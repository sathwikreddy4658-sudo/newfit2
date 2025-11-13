import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { checkPaymentStatus, updatePaymentTransaction } from '@/lib/phonepe';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failure' | 'pending'>('loading');
  const [message, setMessage] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get transaction ID from URL or session storage
        const txnIdFromUrl = searchParams.get('transactionId');
        const txnIdFromSession = sessionStorage.getItem('phonepe_txn_id');
        const merchantTxnId = txnIdFromUrl || txnIdFromSession;

        if (!merchantTxnId) {
          setStatus('failure');
          setMessage('Transaction ID not found. Please contact support.');
          return;
        }

        setTransactionId(merchantTxnId);

        // Check payment status from PhonePe
        const response = await checkPaymentStatus(merchantTxnId);

        if (!response) {
          setStatus('failure');
          setMessage('Failed to verify payment. Please try again later.');
          return;
        }

        if (response.success && response.data?.state === 'COMPLETED') {
          setStatus('success');
          setMessage('Payment successful! Your order has been confirmed.');

          // Update transaction status in database
          await updatePaymentTransaction(merchantTxnId, 'SUCCESS', response.data);

          // Clear session storage
          sessionStorage.removeItem('phonepe_txn_id');

          // Redirect to order page after 3 seconds
          setTimeout(() => {
            navigate('/orders');
          }, 3000);
        } else if (response.data?.state === 'FAILED') {
          setStatus('failure');
          setMessage('Payment failed. Please try again.');

          // Update transaction status
          await updatePaymentTransaction(merchantTxnId, 'FAILED', response.data);
        } else if (response.data?.state === 'PENDING') {
          setStatus('pending');
          setMessage('Payment is still being processed. Please wait...');

          // Retry after 3 seconds
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          setStatus('failure');
          setMessage(response.message || 'Unexpected payment status.');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('failure');
        setMessage(error instanceof Error ? error.message : 'An error occurred while verifying payment.');
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {/* Loading State */}
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Payment</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </>
        )}

        {/* Success State */}
        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-green-50 border border-green-200 rounded p-3 mb-4 text-sm text-green-800">
              <p className="font-semibold">Transaction ID:</p>
              <p className="font-mono text-xs">{transactionId}</p>
            </div>
            <p className="text-gray-500 text-sm">Redirecting to your orders...</p>
          </>
        )}

        {/* Failure State */}
        {status === 'failure' && (
          <>
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-700 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/cart')}
                variant="outline"
                className="flex-1"
              >
                Back to Cart
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Try Again
              </Button>
            </div>
          </>
        )}

        {/* Pending State */}
        {status === 'pending' && (
          <>
            <Loader2 className="h-12 w-12 text-yellow-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-yellow-700 mb-2">Payment Pending</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
