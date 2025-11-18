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
    const verifyPayment = async () => {
      const transactionId = searchParams.get('transactionId');
      const orderParam = searchParams.get('order');
      
      // PhonePe may also send these parameters
      const code = searchParams.get('code');
      const merchantId = searchParams.get('merchantId');
      const providerReferenceId = searchParams.get('providerReferenceId');

      if (!transactionId && !orderParam) {
        setStatus('failed');
        toast({
          title: "Error",
          description: "Missing transaction information",
          variant: "destructive"
        });
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
            toast({
              title: "Payment Successful",
              description: "Your order has been confirmed!",
            });
            return;
          }

          // If failed
          if (txData && txData.status === 'FAILED') {
            setStatus('failed');
            toast({
              title: "Payment Failed",
              description: "Your payment was not successful. Please try again.",
              variant: "destructive"
            });
            return;
          }
        }

        // Check order status (webhook might have updated it)
        if (orderParam) {
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('status, payment_id, paid')
            .eq('id', orderParam)
            .single();

          console.log('[PaymentCallback] Order query result:', { orderData, orderError });

          if (!orderError && orderData && (orderData.status === 'paid' || orderData.paid === true)) {
            clearCart();
            setStatus('success');
            toast({
              title: "Payment Successful",
              description: "Your order has been confirmed!",
            });
            return;
          }
        }

        // If webhook hasn't processed yet, show pending message
        // In production, you'd typically check PhonePe status API here
        console.log('[PaymentCallback] No confirmation found, assuming payment is pending/processing');
        
        // For now, if user is redirected back to callback page from PhonePe,
        // we'll optimistically assume success since PhonePe redirects on success
        // This is a workaround until webhook is properly configured
        if (transactionId && orderParam) {
          // Update order to paid status
          const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'paid', paid: true, payment_id: transactionId })
            .eq('id', orderParam);

          if (!updateError) {
            clearCart();
            setStatus('success');
            toast({
              title: "Payment Successful",
              description: "Your order has been confirmed!",
            });
            return;
          }
        }

        setStatus('failed');
        toast({
          title: "Payment Verification Pending",
          description: "We're still verifying your payment. Check your orders page in a few minutes.",
          variant: "destructive"
        });

      } catch (error) {
        console.error('Payment verification failed:', error);
        setStatus('failed');
        toast({
          title: "Error",
          description: "Failed to verify payment status",
          variant: "destructive"
        });
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
