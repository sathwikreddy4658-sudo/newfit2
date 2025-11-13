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
      // Try to parse the existing address format
      const parts = initialAddress.split(", ");
      if (parts.length >= 4) {
        setFormData(prev => ({
          ...prev,
          flat_no: "",
          building_name: "",
          street_address: parts[0] || prev.street_address,
          city: parts[1] || prev.city,
          state: parts[2] || prev.state,
          pincode: parts[3]?.replace(/\D/g, "") || prev.pincode,
          landmark: parts[4] || prev.landmark,
        }));
      }
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

    // Validate address
    if (!validateAddress(formData.street_address)) {
      newErrors.address = getAddressErrorMessage(formData.street_address);
    }

    // Validate city
    if (!formData.city || formData.city.trim().length < 2) {
      newErrors.city = "City must be at least 2 characters";
    }

    // Validate state
    if (!formData.state || formData.state.trim().length < 2) {
      newErrors.state = "State must be at least 2 characters";
    }

    // Validate pincode
    if (!formData.pincode || !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors before continuing");
      return;
    }

    // Validate form data with schema
    const validationResult = addressSchema.safeParse(formData);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    // Format address
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
              <Label htmlFor="flat_no">Flat/House Number (Optional)</Label>
              <Input
                id="flat_no"
                type="text"
                value={formData.flat_no}
                onChange={(e) => handleInputChange("flat_no", e.target.value)}
                placeholder="e.g., 123, A-456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="building_name">Building Name (Optional)</Label>
              <Input
                id="building_name"
                type="text"
                value={formData.building_name}
                onChange={(e) => handleInputChange("building_name", e.target.value)}
                placeholder="e.g., Shiva Towers, Green Park"
              />
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
              className={errors.address ? "border-red-500 bg-red-50" : ""}
            />
            {errors.address && (
              <p className="text-red-600 text-sm">{errors.address}</p>
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
