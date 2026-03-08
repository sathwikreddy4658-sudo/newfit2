import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCurrentUser } from '@/integrations/firebase/auth';
import { getOrder } from '@/integrations/firebase/db';
import { db } from '@/integrations/firebase/client';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useCart } from '@/contexts/CartContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

// PhonePe Edge Function URL - configurable via env var
const PHONEPE_FUNCTIONS_BASE_URL = import.meta.env.VITE_PHONEPE_FUNCTIONS_URL ||
  'https://osromibanfzzthdmhyzp.supabase.co/functions/v1';

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
        
        const response = await fetch(`${PHONEPE_FUNCTIONS_BASE_URL}/phonepe-check-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ merchantTransactionId })
        });

        const data = await response.json();
        console.log('[PaymentCallback] PhonePe API response:', JSON.stringify(data, null, 2));

        // Check if the request was successful
        // NOTE: Return PENDING (not FAILED) for server/config errors (e.g. 403 IAM, 5xx)
        // so we don't falsely mark a successful payment as failed.
        if (!response.ok) {
          console.error('[PaymentCallback] PhonePe check-status HTTP error:', response.status, data);
          return 'PENDING';
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
        // Helper: get payment transaction doc from Firestore by merchant_transaction_id
        const getPaymentTx = async (txId: string) => {
          const q = query(
            collection(db, 'payment_transactions'),
            where('merchant_transaction_id', '==', txId)
          );
          const snap = await getDocs(q);
          if (snap.empty) return null;
          const d = snap.docs[0];
          return { ref: d.ref, ...d.data() } as any;
        };

        // First check if payment_transactions collection has the transaction with SUCCESS status
        if (transactionId) {
          const txData = await getPaymentTx(transactionId);

          console.log('[PaymentCallback] Transaction query result:', { 
            txData, 
            status: txData?.status,
            orderId: txData?.order_id 
          });

          if (txData && txData.status === 'SUCCESS') {
            console.log('[PaymentCallback] ✅ Payment already confirmed by webhook - SUCCESS');
            clearCart();
            setStatus('success');
            return;
          }

          if (txData && txData.status === 'FAILED') {
            console.log('[PaymentCallback] ❌ Payment marked as FAILED by webhook');
            setStatus('failed');
            return;
          }
          
          if (txData && txData.status === 'INITIATED') {
            console.log('[PaymentCallback] ⏳ Payment is INITIATED, waiting for webhook...');
          }
        }

        // Check if order is already marked as paid by webhook
        if (orderParam) {
          const orderData = await getOrder(orderParam);

          console.log('[PaymentCallback] Order query result:', { 
            orderData,
            status: orderData?.status
          });

          if (orderData && orderData.status === 'paid') {
            console.log('[PaymentCallback] ✅ Order already marked as PAID by webhook');
            clearCart();
            setStatus('success');
            return;
          }
        }

        // Wait 5 seconds for webhook to process (increased from 3 seconds)
        console.log('[PaymentCallback] Waiting 5 seconds for webhook to process...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check transaction status again after waiting
        if (transactionId) {
          const txDataAfterWait = await getPaymentTx(transactionId);

          console.log('[PaymentCallback] Transaction status after wait:', {
            status: txDataAfterWait?.status
          });

          if (txDataAfterWait && txDataAfterWait.status === 'SUCCESS') {
            console.log('[PaymentCallback] ✅ Webhook processed - Payment SUCCESS');
            clearCart();
            setStatus('success');
            return;
          }
          
          if (txDataAfterWait && txDataAfterWait.status === 'FAILED') {
            console.log('[PaymentCallback] ❌ Webhook processed - Payment FAILED');
            setStatus('failed');
            return;
          }
        }

        // Check order status again after waiting
        if (orderParam) {
          const orderDataAfterWait = await getOrder(orderParam);

          console.log('[PaymentCallback] Order status after wait:', {
            status: orderDataAfterWait?.status
          });

          if (orderDataAfterWait && orderDataAfterWait.status === 'paid') {
            console.log('[PaymentCallback] ✅ Webhook processed - Order PAID');
            clearCart();
            setStatus('success');
            return;
          }
        }

        // If webhook hasn't updated yet, try PhonePe API as last resort
        if (transactionId) {
          console.log('[PaymentCallback] Webhook not updated yet, checking with PhonePe API...');
          
          try {
            const phonePeStatus = await checkPhonePeOrderStatus(transactionId);
            console.log('[PaymentCallback] PhonePe status result:', phonePeStatus);

            if (phonePeStatus === 'COMPLETED') {
              console.log('[PaymentCallback] Payment COMPLETED, updating transaction and order');
              
              toast({
                title: "Payment Verified",
                description: "Payment confirmed with PhonePe. Updating your order...",
              });
              
              // Update payment transaction status in Firestore
              const txDoc = await getPaymentTx(transactionId);
              if (txDoc?.ref) {
                await updateDoc(txDoc.ref, {
                  status: 'SUCCESS',
                  updated_at: new Date().toISOString(),
                });
              }

              // Update order status in Firestore
              if (orderParam) {
                await updateDoc(doc(db, 'orders', orderParam), {
                  status: 'paid',
                  payment_id: transactionId,
                  updatedAt: new Date(),
                });
                console.log('[PaymentCallback] Order marked as paid');
              }

              clearCart();
              setStatus('success');
              return;
            } else if (phonePeStatus === 'FAILED') {
              console.log('[PaymentCallback] Payment FAILED confirmed by PhonePe');
              
              const txDoc = await getPaymentTx(transactionId);
              if (txDoc?.ref) {
                await updateDoc(txDoc.ref, {
                  status: 'FAILED',
                  updated_at: new Date().toISOString(),
                });
              }

              setStatus('failed');
              return;
            } else {
              // PENDING or any non-conclusive status (includes 403/5xx from API)
              console.warn('[PaymentCallback] Payment status inconclusive — redirecting to orders page');
              toast({
                title: "Payment Processing",
                description: "Your payment is being verified. Please check your orders page for the latest status.",
              });
              clearCart();
              setTimeout(() => navigate('/orders'), 3000);
              setStatus('success');
              return;
            }
          } catch (phonepeError) {
            console.error('[PaymentCallback] PhonePe API call failed:', phonepeError);
            
            // One final check - maybe webhook processed while we were trying PhonePe API
            const finalTxCheck = await getPaymentTx(transactionId);
            
            if (finalTxCheck && finalTxCheck.status === 'SUCCESS') {
              console.log('[PaymentCallback] ✅ Final check: Webhook processed successfully!');
              clearCart();
              setStatus('success');
              return;
            }
            
            if (orderParam) {
              const finalOrderCheck = await getOrder(orderParam);
            
              if (finalOrderCheck && finalOrderCheck.status === 'paid') {
                console.log('[PaymentCallback] ✅ Final check: Order is PAID!');
                clearCart();
                setStatus('success');
                return;
              }
            }
            
            // Inconclusive — don't show 'failed', redirect to orders
            console.warn('[PaymentCallback] Payment verification inconclusive — redirecting to orders page');
            toast({
              title: "Payment Under Review",
              description: "We couldn't automatically verify your payment. Check your orders page — if payment was deducted, your order is confirmed.",
            });
            clearCart();
            setTimeout(() => navigate('/orders'), 4000);
            setStatus('success');
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
      const authUser = await getCurrentUser();
      
      // Get order details
      let orderEmail = authUser?.email || '';
      let customerName = '';
      
      if (orderId) {
        try {
          const orderData = await getOrder(orderId);
          
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
        } catch (error) {
          console.error('Error fetching order:', error);
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
