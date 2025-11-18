import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone } from "lucide-react";
import { addressSchema } from "@/lib/validation";
import { toast } from "sonner";
import {
  validateIndianPhoneNumber,
  formatIndianPhoneNumber,
  validateAddress,
  getAddressErrorMessage,
  getPhoneNumberErrorMessage,
} from "@/lib/addressValidation";

interface AddressFormProps {
  onAddressSubmit: (address: string, phone?: string) => void;
  initialAddress?: string;
  initialPhone?: string;
  isLoading?: boolean;
}

const AddressForm = ({ onAddressSubmit, initialAddress, initialPhone, isLoading }: AddressFormProps) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    const newErrors: Record<string, string> = {};

    // Validate phone number
    if (!phone) {
      newErrors.phone = "Phone number is required";
    } else if (!validateIndianPhoneNumber(phone)) {
      newErrors.phone = getPhoneNumberErrorMessage(phone);
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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors before continuing");
      return;
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
