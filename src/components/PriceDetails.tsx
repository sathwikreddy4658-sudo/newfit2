import React, { useMemo } from 'react';
import { AlertCircle, Gift, Truck, Phone, Zap } from 'lucide-react';
import { formatPrice, calculateOrderPrice, validatePaymentMethod, PRICING_RULES } from '@/lib/pricingEngine';

interface PriceDetailsProps {
  cartTotal: number;
  shippingCharge: number;
  selectedPincode: string;
  selectedState: string;
  paymentMethod: 'prepaid' | 'cod';
  onPaymentMethodChange: (method: 'prepaid' | 'cod') => void;
}

/**
 * COMPLETE CHECKOUT PRICE BREAKDOWN
 * Shows:
 * - Cart subtotal with MRP inclusive of all taxes
 * - Shipping charges (or Free Delivery)
 * - COD charges (if applicable)
 * - Prepaid discount (5%)
 * - Final total
 */
export const PriceDetails: React.FC<PriceDetailsProps> = ({
  cartTotal,
  shippingCharge,
  selectedPincode,
  selectedState,
  paymentMethod,
  onPaymentMethodChange,
}) => {
  // Calculate all pricing tiers
  const pricing = useMemo(() => {
    return calculateOrderPrice(cartTotal, shippingCharge, paymentMethod, selectedState);
  }, [cartTotal, shippingCharge, paymentMethod, selectedState]);

  // Validate payment method
  const paymentValidation = useMemo(() => {
    return validatePaymentMethod(cartTotal, paymentMethod, selectedState);
  }, [cartTotal, paymentMethod, selectedState]);

  // Check eligibility for different features
  const eligibility = useMemo(() => {
    return {
      canUseCOD: paymentValidation.canUseCOD,
      isFreeDelivery: pricing.isFreeDelivery,
      hasPrepaidDiscount: paymentMethod === 'prepaid' && pricing.prepaidDiscount > 0,
      hasCODCharge: pricing.codCharge > 0,
      qualifiesForFreeDelivery: cartTotal >= PRICING_RULES.FREE_DELIVERY_MIN_ORDER && shippingCharge < PRICING_RULES.FREE_DELIVERY_MAX_SHIPPING,
    };
  }, [pricing, paymentMethod, cartTotal, shippingCharge]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Details</h3>

      {/* Main Pricing Section */}
      <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-gray-700">
            Subtotal (MRP inclusive of all taxes)
          </span>
          <span className="font-medium text-gray-900">{formatPrice(pricing.subtotal)}</span>
        </div>

        {/* Shipping Charges */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">
              {eligibility.isFreeDelivery ? 'Delivery (Free)' : 'Delivery Charges'}
            </span>
          </div>
          <div className="text-right">
            {eligibility.isFreeDelivery ? (
              <div>
                <span className="text-green-600 font-medium">{formatPrice(0)}</span>
                <div className="text-xs text-green-600 line-through text-gray-400 ml-2">
                  {formatPrice(pricing.shippingChargeOriginal)}
                </div>
              </div>
            ) : (
              <span className="font-medium text-gray-900">{formatPrice(pricing.shippingCharge)}</span>
            )}
          </div>
        </div>

        {/* Free Delivery Eligibility Info */}
        {eligibility.qualifiesForFreeDelivery && !eligibility.isFreeDelivery && (
          <div className="text-xs text-blue-600 flex items-start gap-1 mt-2">
            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>✓ You qualify for free delivery! Your cart minimum is met.</span>
          </div>
        )}

        {/* COD Charges */}
        {pricing.codCharge > 0 && paymentMethod === 'cod' && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-600" />
              <span className="text-gray-700">COD Charges</span>
            </div>
            <span className="font-medium text-orange-600">{formatPrice(pricing.codCharge)}</span>
          </div>
        )}

        {/* COD Surcharge for Payment Method */}
        {paymentMethod === 'cod' && pricing.canUseCOD && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">COD Handling Charges</span>
            <span className="text-gray-900">+{formatPrice(35)} included above</span>
          </div>
        )}

        {/* Prepaid Discount */}
        {eligibility.hasPrepaidDiscount && (
          <div className="flex justify-between items-center bg-green-50 p-2 rounded">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-green-600" />
              <span className="text-green-700 font-medium">Prepaid Discount (5%)</span>
            </div>
            <span className="font-medium text-green-600">-{formatPrice(pricing.prepaidDiscount)}</span>
          </div>
        )}
      </div>

      {/* Final Total */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Order Total</span>
          <span className="text-2xl font-bold text-orange-600">{formatPrice(pricing.total)}</span>
        </div>
        {eligibility.hasPrepaidDiscount && (
          <p className="text-xs text-green-700 mt-2">
            You save {formatPrice(pricing.prepaidDiscount)} with prepaid payment!
          </p>
        )}
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900">Select Payment Method</p>

        {/* Prepaid Option */}
        <button
          onClick={() => onPaymentMethodChange('prepaid')}
          className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
            paymentMethod === 'prepaid'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-gray-50 hover:border-blue-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-900">Online Payment (Prepaid)</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Get 5% discount + Save {formatPrice(pricing.prepaidDiscount)}
              </p>
            </div>
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'prepaid'}
              onChange={() => onPaymentMethodChange('prepaid')}
              className="mt-1"
            />
          </div>
        </button>

        {/* COD Option */}
        {eligibility.canUseCOD ? (
          <button
            onClick={() => onPaymentMethodChange('cod')}
            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
              paymentMethod === 'cod'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 bg-gray-50 hover:border-orange-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900">Cash on Delivery</p>
                <p className="text-xs text-gray-600 mt-1">
                  Pay when you receive your order
                  {pricing.codCharge > 0 && (
                    <span className="text-orange-600 ml-1">
                      (Includes {formatPrice(pricing.codCharge)} COD charge)
                    </span>
                  )}
                </p>
                {paymentMethod === 'cod' && pricing.codCharge === 0 && (
                  <p className="text-xs text-green-600 mt-1">Free COD for your order size</p>
                )}
              </div>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'cod'}
                onChange={() => onPaymentMethodChange('cod')}
                className="mt-1"
              />
            </div>
          </button>
        ) : (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{paymentValidation.message}</span>
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-700">
          <strong>Pincode:</strong> {selectedPincode || 'Not selected'} | <strong>Shipping:</strong> {formatPrice(pricing.shippingChargeOriginal)}
        </p>
      </div>
    </div>
  );
};

export default PriceDetails;
