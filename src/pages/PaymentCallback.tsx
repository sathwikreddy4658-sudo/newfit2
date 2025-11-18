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
    let hasShownToast = false;
    let hasProcessed = false;

    const verifyPayment = async () => {
      if (hasProcessed) return;
      hasProcessed = true;

      const transactionId = searchParams.get('transactionId');
      const orderParam = searchParams.get('order');
      
      if (!transactionId && !orderParam) {
        setStatus('failed');
        if (!hasShownToast) {
          hasShownToast = true;
          toast({
            title: "Error",
            description: "Missing transaction information",
            variant: "destructive"
          });
        }
        return;
      }

      setOrderId(orderParam);

      try {
        // First check if payment_transactions table exists and has the transaction
        if (transactionId) {
          const { data: txData, error: txError } = await supabase
            .from('payment_transactions')
            .select('status, order_id')
            .eq('merchant_transaction_id', transactionId)
            .maybeSingle();

          console.log('[PaymentCallback] Transaction query result:', { txData, txError });

          // If transaction exists and is successful
          if (txData && txData.status === 'SUCCESS') {
            clearCart();
            setStatus('success');
            return;
          }

          // If failed
          if (txData && txData.status === 'FAILED') {
            setStatus('failed');
            return;
          }
        }

        // Check order status (webhook might have updated it)
        if (orderParam) {
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('status, payment_id')
            .eq('id', orderParam)
            .maybeSingle();

          console.log('[PaymentCallback] Order query result:', { orderData, orderError });

          if (!orderError && orderData && orderData.status === 'paid') {
            clearCart();
            setStatus('success');
            return;
          }
        }

        // Wait 3 seconds to give webhook time to process
        console.log('[PaymentCallback] Waiting for webhook to process...');
        await new Promise(resolve => setTimeout(resolve, 3000));

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

        // If no confirmation after waiting, payment was likely cancelled or failed
        console.log('[PaymentCallback] No payment confirmation received - payment cancelled or failed');
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
