import React, { useState } from 'react';
import { initiatePhonePePayment } from '@/lib/phonepe';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CheckoutPaymentProps {
  orderId: string;
  amount: number; // in paise (₹1 = 100 paise)
  userId: string;
  userPhone: string;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const CheckoutPayment: React.FC<CheckoutPaymentProps> = ({
  orderId,
  amount,
  userId,
  userPhone,
  onSuccess,
  onError,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate unique transaction ID
      const merchantTransactionId = `${orderId}-${Date.now()}`;

      // Get current URL for redirect
      const redirectUrl = `${window.location.origin}/payment-callback`;

      // Initiate payment
      const response = await initiatePhonePePayment({
        amount,
        merchantTransactionId,
        merchantUserId: userId,
        redirectUrl,
        callbackUrl: `${import.meta.env.VITE_PHONEPE_CALLBACK_URL}`,
        mobileNumber: userPhone,
        deviceContext: {
          deviceOS: 'WEB'
        }
      });

      if (response.success && response.data?.instrumentResponse?.redirectInfo?.url) {
        // Store transaction ID for callback verification
        sessionStorage.setItem('phonepe_txn_id', merchantTransactionId);
        
        // Redirect to PhonePe payment page
        window.location.href = response.data.instrumentResponse.redirectInfo.url;
        
        if (onSuccess) {
          onSuccess(merchantTransactionId);
        }
      } else {
        const errorMsg = response.message || 'Failed to initiate payment. Please try again.';
        setError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <Button
        onClick={handlePayment}
        disabled={isLoading || amount <= 0}
        size="lg"
        className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? 'Processing...' : `Pay ₹${(amount / 100).toFixed(2)}`}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Secure payment via PhonePe. Your transaction is encrypted.
      </p>
    </div>
  );
};

export default CheckoutPayment;
