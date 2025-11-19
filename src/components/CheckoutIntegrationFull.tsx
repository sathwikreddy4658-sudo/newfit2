import React, { useState, useCallback } from 'react';
import { PriceDetails } from '@/components/PriceDetails';
import { PincodeInput } from '@/components/PincodeInput';

/**
 * COMPLETE CHECKOUT INTEGRATION EXAMPLE
 * Shows how to use PincodeInput + PriceDetails together
 * 
 * Integration steps:
 * 1. Add PincodeInput component to get pincode & shipping
 * 2. Add PriceDetails component with all pricing logic
 * 3. Connect state management to handle both components
 * 4. Validate order before placing
 */

interface CheckoutProps {
  cartItems: Array<{ id: string; name: string; price: number; quantity: number }>;
  onOrderPlace: (orderData: any) => void;
}

export const CheckoutIntegration: React.FC<CheckoutProps> = ({ cartItems, onOrderPlace }) => {
  // Pincode state
  const [selectedPincode, setSelectedPincode] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [shippingCharge, setShippingCharge] = useState(0);
  const [isCODAvailable, setIsCODAvailable] = useState(false);
  const [estimatedDays, setEstimatedDays] = useState(0);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'prepaid' | 'cod'>('prepaid');

  // Calculate cart total
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Handle pincode validation updates from PincodeInput
  const handlePincodeValidation = useCallback(
    (data: {
      pincode: string;
      state: string;
      shippingCharge: number;
      codAvailable: boolean;
      estimatedDays: number;
    }) => {
      setSelectedPincode(data.pincode);
      setSelectedState(data.state);
      setShippingCharge(data.shippingCharge);
      setIsCODAvailable(data.codAvailable);
      setEstimatedDays(data.estimatedDays);
    },
    []
  );

  // Handle payment method change
  const handlePaymentMethodChange = (method: 'prepaid' | 'cod') => {
    setPaymentMethod(method);
  };

  // Handle order placement
  const handlePlaceOrder = () => {
    // Validate pincode is selected
    if (!selectedPincode) {
      alert('Please enter a valid pincode');
      return;
    }

    // Validate payment method
    if (paymentMethod === 'cod' && !isCODAvailable) {
      alert('COD is not available for this location');
      return;
    }

    // Create order object with complete pricing details
    const orderData = {
      // Cart details
      cartItems,
      subtotal: cartTotal,

      // Delivery details
      deliveryPincode: selectedPincode,
      deliveryState: selectedState,
      estimatedDelivery: estimatedDays,

      // Pricing breakdown
      shippingCharge,
      paymentMethod,
      isCODAvailable,

      // Timestamp
      createdAt: new Date().toISOString(),
    };

    // Send to backend/payment gateway
    onOrderPlace(orderData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT SIDE - Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center pb-3 border-b border-gray-200 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address & Pincode */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Address</h2>
              
              {/* Pincode Input Component */}
              <PincodeInput
                onPincodeChange={handlePincodeValidation}
                onRateUpdate={(data) => {
                  setShippingCharge(data.shippingCharge);
                  setSelectedState(data.state);
                }}
                onCODAvailabilityChange={(available) => setIsCODAvailable(available)}
              />

              {selectedPincode && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700">
                    ✓ Delivery available in {selectedState}
                    <br />
                    Estimated delivery: {estimatedDays} day{estimatedDays !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE - Price Details & Payment */}
          <div className="lg:col-span-1">
            <PriceDetails
              cartTotal={cartTotal}
              shippingCharge={shippingCharge}
              selectedPincode={selectedPincode}
              selectedState={selectedState}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={handlePaymentMethodChange}
            />

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={!selectedPincode}
              className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold transition-all ${
                selectedPincode
                  ? 'bg-orange-600 text-white hover:bg-orange-700 cursor-pointer'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              {selectedPincode ? 'Place Order' : 'Enter Pincode to Continue'}
            </button>

            {/* Trust Badges */}
            <div className="mt-4 space-y-2 text-center text-xs text-gray-600">
              <p>✓ 100% Secure Payment</p>
              <p>✓ Easy 7-day Returns</p>
              <p>✓ Same Day Dispatch</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutIntegration;
