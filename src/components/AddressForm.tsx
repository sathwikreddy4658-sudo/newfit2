import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { addressSchema } from "@/lib/validation";
import { toast } from "sonner";
import {
  validateIndianPhoneNumber,
  formatIndianPhoneNumber,
  validateAddress,
  getAddressErrorMessage,
  getPhoneNumberErrorMessage,
} from "@/lib/addressValidation";
import { getShippingRate } from "@/lib/pincodeService";

interface AddressFormProps {
  onAddressSubmit: (address: string, phone?: string) => void;
  initialAddress?: string;
  initialPhone?: string;
  isLoading?: boolean;
  onDeliveryCheck?: (data: { pincode: string; state: string; shippingCharge: number; isCODAvailable: boolean; estimatedDays: number }) => void;
}

const AddressForm = ({ onAddressSubmit, initialAddress, initialPhone, isLoading, onDeliveryCheck }: AddressFormProps) => {
  const [formData, setFormData] = useState({
    flat_no: "",
    building_name: "",
    street_address: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });

  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Delivery check state
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [deliveryChecked, setDeliveryChecked] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState<{
    state: string;
    shippingCharge: number;
    isCODAvailable: boolean;
    estimatedDays: number;
  } | null>(null);

  // Parse initial address if provided
  useEffect(() => {
    if (initialAddress) {
      // Don't auto-fill - just leave fields empty for user to fill
      // This prevents automatic population of street address from other fields
    }
    if (initialPhone) {
      setPhone(initialPhone);
    }
  }, [initialAddress, initialPhone]);

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    // Clear error as user is typing
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: "" }));
    }
  };

  const handleCheckDelivery = async () => {
    if (!formData.pincode || formData.pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    setCheckingDelivery(true);
    setDeliveryError('');
    setDeliveryChecked(false);

    try {
      const pincodeNum = parseInt(formData.pincode);
      const rate = await getShippingRate(pincodeNum);

      if (!rate.serviceable) {
        setDeliveryError('Delivery not available for this pincode');
        setDeliveryChecked(false);
        toast.error('Delivery not available for this pincode');
      } else {
        setDeliveryInfo({
          state: rate.state || '',
          shippingCharge: rate.charge || 0,
          isCODAvailable: rate.codAvailable || false,
          estimatedDays: rate.estimatedDays || 3,
        });
        setDeliveryChecked(true);
        setDeliveryError('');
        
        // Auto-fill state if available
        if (rate.state && !formData.state) {
          setFormData(prev => ({ ...prev, state: rate.state }));
        }

        // Notify parent component
        if (onDeliveryCheck) {
          onDeliveryCheck({
            pincode: formData.pincode,
            state: rate.state || '',
            shippingCharge: rate.charge || 0,
            isCODAvailable: rate.codAvailable || false,
            estimatedDays: rate.estimatedDays || 3,
          });
        }

        toast.success('Delivery available for this pincode!');
      }
    } catch (error) {
      console.error('Error checking delivery:', error);
      setDeliveryError('Error checking delivery availability');
      toast.error('Error checking delivery availability');
    } finally {
      setCheckingDelivery(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== AddressForm Submit Started ===");
    console.log("Phone value:", phone);
    console.log("Phone length:", phone.length);
    console.log("Phone cleaned:", phone.replace(/\D/g, ''));

    // Reset errors
    const newErrors: Record<string, string> = {};

    // Validate phone number
    if (!phone) {
      newErrors.phone = "Phone number is required";
    } else if (!validateIndianPhoneNumber(phone)) {
      const errorMsg = getPhoneNumberErrorMessage(phone);
      newErrors.phone = errorMsg;
      console.log("Phone validation failed:", errorMsg);
    } else {
      console.log("Phone validation passed!");
    }

    // Validate required fields
    if (!formData.street_address.trim()) {
      newErrors.street_address = "Street address is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }
    if (!formData.pincode || formData.pincode.length !== 6) {
      newErrors.pincode = "Valid 6-digit pincode is required";
    }

    console.log("Validation errors:", newErrors);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      console.log("Form validation failed, showing errors");
      toast.error("Please fix the errors before continuing");
      return;
    }

    // Auto-trigger delivery check if not already checked
    if (!deliveryChecked && formData.pincode.length === 6) {
      toast.info('Checking delivery availability...');
      await handleCheckDelivery();
      // Wait a bit for the check to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Warn if delivery check failed but continue with address save
      if (!deliveryChecked) {
        toast.warning('Could not verify delivery. Please check delivery manually.');
        // Don't return - continue saving address
      }
    }

    // Format address from individual fields
    const addressParts = [
      formData.flat_no && formData.building_name
        ? `${formData.flat_no}, ${formData.building_name}`
        : formData.flat_no || formData.building_name,
      formData.street_address,
      formData.city,
      formData.state,
      formData.pincode,
      formData.landmark,
    ].filter(Boolean);

    const formattedAddress = addressParts.join(", ");
    const formattedPhone = formatIndianPhoneNumber(phone);

    console.log("Formatted address:", formattedAddress);
    console.log("Formatted phone:", formattedPhone);
    console.log("Calling onAddressSubmit with:", { formattedAddress, formattedPhone });

    onAddressSubmit(formattedAddress, formattedPhone);
    toast.success("Address saved successfully!");
    
    // Scroll to payment section on mobile after saving address
    setTimeout(() => {
      const paymentSection = document.querySelector('[data-payment-section]');
      if (paymentSection) {
        paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback: scroll to bottom of page
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }, 300);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    // Reset delivery check if pincode changes
    if (field === 'pincode' && deliveryChecked) {
      setDeliveryChecked(false);
      setDeliveryInfo(null);
      setDeliveryError('');
    }
    // Auto-check delivery when pincode is complete (6 digits)
    if (field === 'pincode' && value.length === 6) {
      setTimeout(() => handleCheckDelivery(), 300);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Delivery Address & Contact
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Number Field */}
          <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="Enter 10-digit Indian phone number"
              maxLength={13}
              className={errors.phone ? "border-red-500 bg-red-50" : ""}
            />
            {errors.phone && (
              <p className="text-red-600 text-sm">{errors.phone}</p>
            )}
            <p className="text-xs text-gray-600 mt-1">
              ✓ Valid formats: 9876543210, +919876543210, or 919876543210
            </p>
          </div>

          {/* Address Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flat_no">Flat/House Number *</Label>
              <Input
                id="flat_no"
                type="text"
                value={formData.flat_no}
                onChange={(e) => handleInputChange("flat_no", e.target.value)}
                placeholder="e.g., 123, A-456"
                className={errors.flat_no ? "border-red-500 bg-red-50" : ""}
                required
              />
              {errors.flat_no && (
                <p className="text-red-600 text-sm">{errors.flat_no}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="building_name">Building Name *</Label>
              <Input
                id="building_name"
                type="text"
                value={formData.building_name}
                onChange={(e) => handleInputChange("building_name", e.target.value)}
                placeholder="e.g., Shiva Towers, Green Park"
                className={errors.building_name ? "border-red-500 bg-red-50" : ""}
                required
              />
              {errors.building_name && (
                <p className="text-red-600 text-sm">{errors.building_name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street_address">Street Address *</Label>
            <Textarea
              id="street_address"
              value={formData.street_address}
              onChange={(e) => handleInputChange("street_address", e.target.value)}
              placeholder="Enter complete street address"
              rows={2}
              className={errors.street_address ? "border-red-500 bg-red-50" : ""}
              required
            />
            {errors.street_address && (
              <p className="text-red-600 text-sm">{errors.street_address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City/Town *</Label>
              <Input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="City name"
                className={errors.city ? "border-red-500 bg-red-50" : ""}
                required
              />
              {errors.city && (
                <p className="text-red-600 text-sm">{errors.city}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                type="text"
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                placeholder="State name"
                className={errors.state ? "border-red-500 bg-red-50" : ""}
                required
              />
              {errors.state && (
                <p className="text-red-600 text-sm">{errors.state}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                type="text"
                value={formData.pincode}
                onChange={(e) => handleInputChange("pincode", e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit pincode"
                maxLength={6}
                className={errors.pincode ? "border-red-500 bg-red-50" : ""}
                required
              />
              {errors.pincode && (
                <p className="text-red-600 text-sm">{errors.pincode}</p>
              )}
              
              {/* Check Delivery Button - Always visible */}
              <Button
                type="button"
                onClick={handleCheckDelivery}
                disabled={checkingDelivery || formData.pincode.length !== 6}
                size="sm"
                className="w-full mt-2 text-sm font-poppins font-extrabold text-white hover:opacity-90"
                style={{ backgroundColor: '#5e4338' }}
              >
                {checkingDelivery ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Check Delivery
                  </>
                )}
              </Button>
              
              {/* Delivery Status */}
              {deliveryChecked && deliveryInfo && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Delivery Available!
                  </div>
                  <p className="text-xs text-green-600">
                    {deliveryInfo.state} • ₹{deliveryInfo.shippingCharge}
                  </p>
                  {!deliveryInfo.isCODAvailable && (
                    <p className="text-xs text-orange-600 mt-1">⚠️ COD not available</p>
                  )}
                </div>
              )}
              
              {deliveryError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {deliveryError}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark">Landmark (Optional)</Label>
            <Input
              id="landmark"
              type="text"
              value={formData.landmark}
              onChange={(e) => handleInputChange("landmark", e.target.value)}
              placeholder="e.g., Near XYZ mall, Opposite ABC hospital"
            />
          </div>

          <Button
            type="submit"
            className="w-full font-poppins font-bold"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Address & Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddressForm;
