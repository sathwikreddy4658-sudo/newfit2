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
        const response = await fetch(`https://osromibanfzzthdmhyzp.supabase.co/functions/v1/phonepe-check-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ merchantOrderId: merchantTransactionId })
        });

        const data = await response.json();
        console.log('[PaymentCallback] PhonePe status check:', data);

        if (data.success && data.state === 'COMPLETED') {
          return 'COMPLETED';
        } else if (data.state === 'FAILED') {
          return 'FAILED';
        } else {
          return 'PENDING';
        }
      } catch (error) {
        console.error('[PaymentCallback] Error checking PhonePe status:', error);
        return null;
      }
    };

    const verifyPayment = async () => {
      if (hasProcessed) return;
      hasProcessed = true;

      const transactionId = searchParams.get('transactionId');
      const orderParam = searchParams.get('order');
      
      if (!transactionId && !orderParam) {
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

        // Wait 2 seconds for webhook to process
        console.log('[PaymentCallback] Waiting for webhook...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check again after waiting
        if (orderParam) {
          const { data: orderData } = await supabase
            .from('orders')
            .select('status')
            .eq('id', orderParam)
            .maybeSingle();

          if (orderData && orderData.status === 'paid') {
            clearCart();
            setStatus('success');
            return;
          }
        }

        // If webhook hasn't updated yet, check with PhonePe directly
        if (transactionId) {
          console.log('[PaymentCallback] Checking payment status with PhonePe API');
          const phonePeStatus = await checkPhonePeOrderStatus(transactionId);

          if (phonePeStatus === 'COMPLETED') {
            // Payment successful - confirm it in our system
            if (orderParam) {
              const { error: confirmError } = await supabase.rpc('confirm_payment_for_order', {
                p_order_id: orderParam,
                p_transaction_id: transactionId
              });

              if (!confirmError) {
                clearCart();
                setStatus('success');
                return;
              }
            }
          } else if (phonePeStatus === 'FAILED') {
            setStatus('failed');
            return;
          }
        }

        // If still no confirmation, payment was cancelled or failed
        console.log('[PaymentCallback] No payment confirmation - showing failed');
        setStatus('failed');

      } catch (error) {
        console.error('Payment verification failed:', error);
        setStatus('failed');
      }
    };

    verifyPayment();
  }, [searchParams, clearCart]);

  const handleContinue = () => {
    if (status === 'success') {
      // Clear cart only on successful payment
      // Note: Cart clearing should be handled in the context when payment succeeds
      navigate('/orders');
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
            <p className="text-gray-600 mb-6">
              Your order has been placed successfully. You will receive a confirmation email shortly.
            </p>
          </>
        ) : (
          <>
            <div className="text-red-500 text-6xl mb-4">✗</div>
            <h2 className="text-2xl font-bold mb-2 text-red-600">Payment Failed</h2>
            <p className="text-gray-600 mb-6">
              Your payment could not be processed. Please try again or contact support if the issue persists.
            </p>
          </>
        )}

        <Button onClick={handleContinue} className="w-full">
          {status === 'success' ? 'View Orders' : 'Try Again'}
        </Button>
      </Card>
    </div>
  );
};

export default PaymentCallback;
