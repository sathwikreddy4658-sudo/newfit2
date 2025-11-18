import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    let hasProcessed = false;

    const checkPhonePeOrderStatus = async (merchantTransactionId: string) => {
      try {
        // Call PhonePe Order Status API via our Edge Function
        // The Edge Function will handle authentication with PhonePe
        console.log('[PaymentCallback] Calling phonepe-check-status with:', merchantTransactionId);
        
        const response = await fetch(`https://osromibanfzzthdmhyzp.supabase.co/functions/v1/phonepe-check-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ merchantTransactionId })
        });

        const data = await response.json();
        console.log('[PaymentCallback] PhonePe API response:', JSON.stringify(data, null, 2));

        // Check if the request was successful
        if (!response.ok) {
          console.error('[PaymentCallback] PhonePe check-status error:', response.status, data);
          return 'FAILED';
        }

        // Check the Edge Function response structure
        if (data.success && data.data) {
          // PhonePe v2 API response structure from our Edge Function
          const orderData = data.data;
          console.log('[PaymentCallback] Full PhonePe order data:', JSON.stringify(orderData, null, 2));
          
          // PhonePe v2 API returns order status in a nested structure:
          // Response: { success: true, data: { payload: { state: "COMPLETED" } } }
          // OR: { success: true, data: { state: "COMPLETED" } }
          const payload = orderData.payload || orderData;
          const state = payload.state || payload.status || orderData.state || orderData.status;
          
          console.log('[PaymentCallback] Extracted payment state:', state);
          
          // PhonePe v2 status values:
          // COMPLETED = successful payment
          // FAILED = failed payment  
          // PENDING = payment in progress
          if (state === 'COMPLETED' || state === 'SUCCESS' || state === 'PAYMENT_SUCCESS') {
            return 'COMPLETED';
          } else if (state === 'FAILED' || state === 'FAILURE' || state === 'PAYMENT_ERROR') {
            return 'FAILED';
          } else if (state === 'PENDING') {
            return 'PENDING';
          } else {
            console.warn('[PaymentCallback] Unknown payment state:', state);
            return 'PENDING';
          }
        }
        
        // If response structure is different, log and return failed
        console.error('[PaymentCallback] Unexpected response structure:', data);
        
        // If response says not successful but we got a 200, might be payment pending/failed
        if (data.success === false) {
          if (data.code === 'PAYMENT_PENDING' || data.message?.includes('pending')) {
            return 'PENDING';
          }
          return 'FAILED';
        }
        
        return 'FAILED';
      } catch (error) {
        console.error('[PaymentCallback] Error checking PhonePe status:', error);
        return 'FAILED';
      }
    };

    const verifyPayment = async () => {
      if (hasProcessed) return;
      hasProcessed = true;

      const transactionId = searchParams.get('transactionId');
      const orderParam = searchParams.get('order');
      
      // Log all URL parameters for debugging
      console.log('[PaymentCallback] Received URL parameters:', {
        transactionId,
        order: orderParam,
        allParams: Object.fromEntries(searchParams.entries())
      });
      
      if (!transactionId && !orderParam) {
        console.error('[PaymentCallback] No transaction ID or order ID in URL');
        setStatus('failed');
        return;
      }

      setOrderId(orderParam);

      try {
        // First check if payment_transactions table has the transaction with SUCCESS status
        if (transactionId) {
          const { data: txData } = await supabase
            .from('payment_transactions')
            .select('status, order_id')
            .eq('merchant_transaction_id', transactionId)
            .maybeSingle();

          console.log('[PaymentCallback] Transaction query result:', { txData });

          if (txData && txData.status === 'SUCCESS') {
            clearCart();
            setStatus('success');
            return;
          }

          if (txData && txData.status === 'FAILED') {
            setStatus('failed');
            return;
          }
        }

        // Check if order is already marked as paid by webhook
        if (orderParam) {
          const { data: orderData } = await supabase
            .from('orders')
            .select('status')
            .eq('id', orderParam)
            .maybeSingle();

          console.log('[PaymentCallback] Order query result:', { orderData });

          if (orderData && orderData.status === 'paid') {
            clearCart();
            setStatus('success');
            return;
          }
        }

        // Wait 3 seconds for webhook to process
        console.log('[PaymentCallback] Waiting for webhook...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check transaction status again after waiting
        if (transactionId) {
          const { data: txDataAfterWait } = await supabase
            .from('payment_transactions')
            .select('status, order_id')
            .eq('merchant_transaction_id', transactionId)
            .maybeSingle();

          if (txDataAfterWait && txDataAfterWait.status === 'SUCCESS') {
            clearCart();
            setStatus('success');
            return;
          }
        }

        // Check order status again after waiting
        if (orderParam) {
          const { data: orderDataAfterWait } = await supabase
            .from('orders')
            .select('status')
            .eq('id', orderParam)
            .maybeSingle();

          if (orderDataAfterWait && orderDataAfterWait.status === 'paid') {
            clearCart();
            setStatus('success');
            return;
          }
        }

        // If webhook hasn't updated yet, check with PhonePe directly
        if (transactionId) {
          console.log('[PaymentCallback] Checking payment status with PhonePe API');
          const phonePeStatus = await checkPhonePeOrderStatus(transactionId);

          console.log('[PaymentCallback] PhonePe status result:', phonePeStatus);

          if (phonePeStatus === 'COMPLETED') {
            // Payment successful - update our records
            console.log('[PaymentCallback] Payment COMPLETED, updating transaction and order');
            
            toast({
              title: "Payment Verified",
              description: "Payment confirmed with PhonePe. Updating your order...",
            });
            
            // Update payment transaction status
            const { error: txUpdateError } = await supabase
              .from('payment_transactions')
              .update({
                status: 'SUCCESS',
                updated_at: new Date().toISOString()
              })
              .eq('merchant_transaction_id', transactionId);

            if (txUpdateError) {
              console.error('[PaymentCallback] Error updating transaction:', txUpdateError);
            }

            // Update order status
            if (orderParam) {
              const { error: orderUpdateError } = await supabase
                .from('orders')
                .update({
                  status: 'paid',
                  payment_id: transactionId,
                  updated_at: new Date().toISOString()
                })
                .eq('id', orderParam);

              if (orderUpdateError) {
                console.error('[PaymentCallback] Error updating order:', orderUpdateError);
              } else {
                console.log('[PaymentCallback] Order marked as paid');
              }
            }

            clearCart();
            setStatus('success');
            return;
          } else if (phonePeStatus === 'FAILED') {
            console.log('[PaymentCallback] Payment FAILED');
            
            // Update transaction status
            const { error: txUpdateError } = await supabase
              .from('payment_transactions')
              .update({
                status: 'FAILED',
                updated_at: new Date().toISOString()
              })
              .eq('merchant_transaction_id', transactionId);

            if (txUpdateError) {
              console.error('[PaymentCallback] Error updating failed transaction:', txUpdateError);
            }

            setStatus('failed');
            return;
          } else if (phonePeStatus === 'PENDING') {
            // Payment is still pending, wait a bit longer
            console.log('[PaymentCallback] Payment PENDING, waiting for webhook...');
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Check transaction status one more time
            const { data: finalTxData } = await supabase
              .from('payment_transactions')
              .select('status')
              .eq('merchant_transaction_id', transactionId)
              .maybeSingle();

            if (finalTxData && finalTxData.status === 'SUCCESS') {
              clearCart();
              setStatus('success');
              return;
            }

            // Check order status one more time
            if (orderParam) {
              const { data: finalOrderData } = await supabase
                .from('orders')
                .select('status')
                .eq('id', orderParam)
                .maybeSingle();

              if (finalOrderData && finalOrderData.status === 'paid') {
                clearCart();
                setStatus('success');
                return;
              }
            }

            // Still pending - check PhonePe one final time
            const finalPhonePeStatus = await checkPhonePeOrderStatus(transactionId);
            console.log('[PaymentCallback] Final PhonePe status check:', finalPhonePeStatus);
            
            if (finalPhonePeStatus === 'COMPLETED') {
              // Update records
              await supabase
                .from('payment_transactions')
                .update({
                  status: 'SUCCESS',
                  updated_at: new Date().toISOString()
                })
                .eq('merchant_transaction_id', transactionId);

              if (orderParam) {
                await supabase
                  .from('orders')
                  .update({
                    status: 'paid',
                    payment_id: transactionId,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', orderParam);
              }

              clearCart();
              setStatus('success');
              return;
            } else if (finalPhonePeStatus === 'FAILED') {
              console.log('[PaymentCallback] Final check: Payment FAILED');
              setStatus('failed');
              return;
            }
            
            // If still pending after all checks, show failed with appropriate message
            console.log('[PaymentCallback] Payment still pending after all checks');
            setStatus('failed');
            return;
          }
        }

        // If we reach here, no transaction ID was provided or status couldn't be determined
        console.log('[PaymentCallback] Unable to verify payment status');
        
        toast({
          title: "Verification Issue",
          description: "We couldn't automatically verify your payment. Please check your orders page or contact support if you were charged.",
          variant: "destructive",
        });
        
        setStatus('failed');

      } catch (error) {
        console.error('Payment verification failed:', error);
        setStatus('failed');
      }
    };

    verifyPayment();
  }, [searchParams, clearCart]);

  // Auto-redirect on success after 2 seconds
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        handleContinue();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleContinue = async () => {
    if (status === 'success') {
      // Check if user is authenticated or guest
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get order details
      let orderEmail = user?.email;
      let customerName = '';
      
      if (orderId) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('customer_email, customer_name, user_id')
          .eq('id', orderId)
          .single();
        
        if (orderData) {
          orderEmail = orderData.customer_email || orderEmail;
          customerName = orderData.customer_name || '';
          
          // If order has no user_id, it's a guest order
          if (!orderData.user_id) {
            navigate('/guest-thank-you', {
              state: {
                orderId,
                email: orderEmail,
                name: customerName
              }
            });
            return;
          }
        }
      }
      
      // Authenticated user
      navigate('/user-thank-you', {
        state: {
          orderId,
          email: orderEmail
        }
      });
    } else {
      navigate('/checkout');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we verify your payment...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
      <Card className="p-8 text-center max-w-md">
        {status === 'success' ? (
          <>
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-2 text-green-600">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Your order has been placed successfully. You will receive a confirmation email shortly.
            </p>
            <div className="text-sm text-muted-foreground">
              Redirecting...
            </div>
          </>
        ) : (
          <>
            <div className="text-red-500 text-6xl mb-4">✗</div>
            <h2 className="text-2xl font-bold mb-2 text-red-600">Payment Unsuccessful</h2>
            <p className="text-gray-600 mb-6">
              Your payment was not completed. This may happen if you cancelled the payment or if there was an issue processing it. Please try again or contact support if the issue persists.
            </p>
          </>
        )}

        {status === 'failed' && (
          <Button onClick={handleContinue} className="w-full">
            Try Again
          </Button>
        )}
      </Card>
    </div>
  );
};

export default PaymentCallback;
