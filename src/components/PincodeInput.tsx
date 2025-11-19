import React, { useState, useEffect } from 'react';
import { validatePincodeForCheckout, getShippingRate } from '@/lib/pincodeService';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Loader } from 'lucide-react';

interface PincodeInputProps {
  onPincodeChange?: (pincode: number | null) => void;
  onRateUpdate?: (rate: any) => void;
  onCODAvailabilityChange?: (available: boolean) => void;
  required?: boolean;
  disabled?: boolean;
}

export const PincodeInput: React.FC<PincodeInputProps> = ({
  onPincodeChange,
  onRateUpdate,
  onCODAvailabilityChange,
  required = false,
  disabled = false,
}) => {
  const [pincode, setPincode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pincode || pincode.length < 6) {
      setValidationResult(null);
      setError('');
      onPincodeChange?.(null);
      return;
    }

    const checkPincode = async () => {
      setIsLoading(true);
      setError('');

      try {
        const pincodeNum = parseInt(pincode, 10);
        const result = await validatePincodeForCheckout(pincodeNum);

        if (result.valid) {
          const rate = await getShippingRate(pincodeNum);
          setValidationResult(result);
          onPincodeChange?.(pincodeNum);
          onRateUpdate?.(rate);
          onCODAvailabilityChange?.(rate.codAvailable);
        } else {
          setValidationResult(result);
          setError(result.message);
          onPincodeChange?.(null);
          onCODAvailabilityChange?.(false);
        }
      } catch (err) {
        console.error('Pincode validation error:', err);
        setError('Error checking pincode. Please try again.');
        onPincodeChange?.(null);
        onCODAvailabilityChange?.(false);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(checkPincode, 300); // Debounce
    return () => clearTimeout(timer);
  }, [pincode, onPincodeChange, onRateUpdate, onCODAvailabilityChange]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Delivery Pincode {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <Input
          type="text"
          placeholder="Enter 6-digit pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          disabled={disabled || isLoading}
          className="w-full"
          maxLength={6}
          required={required}
        />
        
        {isLoading && (
          <Loader className="absolute right-3 top-3 h-5 w-5 animate-spin text-blue-500" />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {validationResult?.valid && (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Delivery available
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-2 space-y-1">
            <p className="text-gray-700">
              <span className="font-medium">Shipping Charge:</span> ₹{validationResult.rate?.charge}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Est. Delivery:</span> {validationResult.rate?.estimatedDays} day(s)
            </p>
            {validationResult.rate?.codAvailable ? (
              <p className="text-green-600 text-sm">
                ✓ Cash on Delivery available
              </p>
            ) : (
              <p className="text-orange-600 text-sm">
                ⚠ Only prepaid payment available
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PincodeInput;
