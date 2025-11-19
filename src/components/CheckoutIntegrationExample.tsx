/**
 * CHECKOUT INTEGRATION EXAMPLE
 * 
 * This shows how to integrate the pincode serviceability system
 * into your existing checkout flow.
 */

import React, { useState } from 'react';
import PincodeInput from '@/components/PincodeInput';
import { validatePincodeForCheckout } from '@/lib/pincodeService';

interface CheckoutState {
  pincode: number | null;
  shippingCharge: number;
  estimatedDays: number;
  codAvailable: boolean;
  totalPrice: number;
  cartTotal: number;
}

export const CheckoutFormExample = () => {
  const [checkout, setCheckout] = useState<CheckoutState>({
    pincode: null,
    shippingCharge: 0,
    estimatedDays: 0,
    codAvailable: false,
    totalPrice: 0,
    cartTotal: 1500, // Example: ₹1500 cart
  });

  const [paymentMethod, setPaymentMethod] = useState('prepaid');

  /**
   * Handle pincode validation and rate update
   */
  const handlePincodeChange = (pincode: number | null) => {
    setCheckout(prev => ({
      ...prev,
      pincode,
    }));
  };

  const handleRateUpdate = (rate: any) => {
    setCheckout(prev => ({
      ...prev,
      shippingCharge: rate.charge || 0,
      estimatedDays: rate.estimatedDays || 0,
      totalPrice: prev.cartTotal + (rate.charge || 0),
    }));
  };

  const handleCODChange = (available: boolean) => {
    setCheckout(prev => ({
      ...prev,
      codAvailable: available,
    }));

    // If COD becomes unavailable, switch to prepaid
    if (!available && paymentMethod === 'cod') {
      setPaymentMethod('prepaid');
    }
  };

  /**
   * Validate checkout before submission
   */
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkout.pincode) {
      alert('Please enter a valid pincode');
      return;
    }

    // Validate pincode for the selected payment method
    const isCOD = paymentMethod === 'cod';
    const validation = await validatePincodeForCheckout(checkout.pincode, isCOD);

    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    // Proceed with order creation
    console.log('Creating order:', {
      pincode: checkout.pincode,
      shippingCharge: checkout.shippingCharge,
      estimatedDays: checkout.estimatedDays,
      paymentMethod,
      totalPrice: checkout.totalPrice,
    });

    // Create order in your system
    // await createOrder({ ... });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handleCheckout} className="space-y-6">
        {/* Cart Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Order Summary</h2>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{checkout.cartTotal}</span>
            </p>
            <p className="flex justify-between text-blue-600 font-medium">
              <span>Shipping:</span>
              <span>₹{checkout.shippingCharge}</span>
            </p>
            <p className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>Total:</span>
              <span>₹{checkout.totalPrice}</span>
            </p>
          </div>
        </div>

        {/* Pincode Input */}
        <PincodeInput
          onPincodeChange={handlePincodeChange}
          onRateUpdate={handleRateUpdate}
          onCODAvailabilityChange={handleCODChange}
          required={true}
        />

        {/* Delivery Information */}
        {checkout.pincode && checkout.estimatedDays > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-gray-700">
              📦 Estimated Delivery: <strong>{checkout.estimatedDays} day(s)</strong>
            </p>
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="border rounded-lg p-4">
          <h3 className="font-bold mb-4">Payment Method</h3>
          <div className="space-y-3">
            {/* Prepaid Option - Always available */}
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="prepaid"
                checked={paymentMethod === 'prepaid'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <span className="font-medium">Pay Online (Card, UPI, etc.)</span>
            </label>

            {/* COD Option - Only if available for pincode */}
            <label className={`flex items-center cursor-pointer ${!checkout.codAvailable ? 'opacity-50' : ''}`}>
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={!checkout.codAvailable}
                className="mr-3"
              />
              <div>
                <span className="font-medium">Cash on Delivery</span>
                {!checkout.codAvailable && (
                  <p className="text-sm text-red-600">Not available for your pincode</p>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Error Message if COD not available */}
        {paymentMethod === 'cod' && !checkout.codAvailable && (
          <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
            ⚠️ Cash on Delivery is not available for your pincode. Please select "Pay Online" or enter a different pincode.
          </div>
        )}

        {/* Address Form (placeholder) */}
        <div className="border-t pt-4">
          <h3 className="font-bold mb-4">Delivery Address</h3>
          {/* Add your AddressForm component here */}
          <p className="text-gray-500 text-sm">
            [AddressForm component goes here]
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!checkout.pincode || !checkout.totalPrice}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {checkout.pincode ? 'Complete Order' : 'Enter Pincode to Continue'}
        </button>
      </form>

      {/* Order Summary Details */}
      {checkout.pincode && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm">
          <h4 className="font-bold mb-2">Order Details</h4>
          <ul className="space-y-1 text-gray-600">
            <li>✓ Pincode: {checkout.pincode}</li>
            <li>✓ Shipping Charge: ₹{checkout.shippingCharge}</li>
            <li>✓ Estimated Days: {checkout.estimatedDays}</li>
            <li>✓ COD Available: {checkout.codAvailable ? 'Yes' : 'No'}</li>
            <li>✓ Total Price: ₹{checkout.totalPrice}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CheckoutFormExample;

/**
 * INTEGRATION INSTRUCTIONS
 * 
 * 1. Import this component or use its patterns in your existing Checkout.tsx
 * 
 * 2. Key integration points:
 *    - PincodeInput component for pincode entry
 *    - handleRateUpdate to update shipping charge
 *    - handleCODChange to toggle COD availability
 *    - handleCheckout for validation before order creation
 * 
 * 3. Connect to your order creation flow:
 *    - Store selected pincode, shipping charge, payment method
 *    - Validate before calling your order API
 *    - Pass all data to backend for order processing
 * 
 * 4. Update cart/checkout state based on:
 *    - Pincode validation
 *    - Shipping charge calculation
 *    - COD availability
 * 
 * 5. Test scenarios:
 *    - Valid serviceable pincode (should allow COD)
 *    - Valid non-COD pincode (should disable COD)
 *    - Invalid pincode (should show error)
 *    - Switching between pincodes (should update rates)
 */
