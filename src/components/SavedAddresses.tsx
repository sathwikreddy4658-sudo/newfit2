import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, MapPin, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SavedAddress {
  id: string;
  label: string;
  flat_no?: string;
  building_name?: string;
  street_address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  phone: string;
  is_default: boolean;
}

interface SavedAddressesProps {
  userId: string;
  onAddressSelect: (address: SavedAddress) => void;
  selectedAddressId?: string | null;
}

export const SavedAddresses = ({ userId, onAddressSelect, selectedAddressId }: SavedAddressesProps) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    flat_no: "",
    building_name: "",
    street_address: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    phone: "",
    is_default: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_addresses" as any)
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAddresses((data as any) || []);
      
      // Auto-select default address if exists and no address is selected
      if (data && data.length > 0 && !selectedAddressId) {
        const defaultAddr = (data as any).find((a: SavedAddress) => a.is_default) || data[0];
        onAddressSelect(defaultAddr);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast({ title: "Error loading addresses", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.label.trim() || !formData.street_address.trim() || !formData.city.trim() || 
        !formData.state.trim() || !formData.pincode.trim() || !formData.phone.trim()) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    // Check max 6 addresses limit
    if (!editingAddress && addresses.length >= 6) {
      toast({ 
        title: "Maximum limit reached", 
        description: "You can save up to 6 addresses. Please delete an existing address first.",
        variant: "destructive" 
      });
      return;
    }

    try {
      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from("saved_addresses" as any)
          .update(formData)
          .eq("id", editingAddress.id);

        if (error) throw error;
        toast({ title: "Address updated successfully" });
      } else {
        // Insert new address
        const { error } = await supabase
          .from("saved_addresses" as any)
          .insert([{ ...formData, user_id: userId }]);

        if (error) throw error;
        toast({ title: "Address saved successfully" });
      }

      fetchAddresses();
      setShowDialog(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving address:", error);
      toast({ 
        title: "Error saving address", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const { error } = await supabase
        .from("saved_addresses" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Address deleted successfully" });
      fetchAddresses();
    } catch (error: any) {
      console.error("Error deleting address:", error);
      toast({ 
        title: "Error deleting address",
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handleEdit = (address: SavedAddress) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      flat_no: address.flat_no || "",
      building_name: address.building_name || "",
      street_address: address.street_address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || "",
      phone: address.phone,
      is_default: address.is_default,
    });
    setShowDialog(true);
  };

  const handleSetDefault = async (id: string) => {
    try {
      // First, unset all defaults
      await supabase
        .from("saved_addresses" as any)
        .update({ is_default: false })
        .eq("user_id", userId);

      // Then set the selected one as default
      const { error } = await supabase
        .from("saved_addresses" as any)
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Default address updated" });
      fetchAddresses();
    } catch (error: any) {
      console.error("Error setting default:", error);
      toast({ 
        title: "Error setting default address",
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const resetForm = () => {
    setFormData({
      label: "",
      flat_no: "",
      building_name: "",
      street_address: "",
      city: "",
      state: "",
      pincode: "",
      landmark: "",
      phone: "",
      is_default: false,
    });
    setEditingAddress(null);
  };

  if (loading) {
    return <div className="text-center py-4">Loading addresses...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Address Selection Dropdown */}
      {addresses.length > 0 && (
        <div>
          <Label className="mb-2 block">Select Delivery Address</Label>
          <Select
            value={selectedAddressId || addresses[0]?.id}
            onValueChange={(value) => {
              const addr = addresses.find(a => a.id === value);
              if (addr) onAddressSelect(addr);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose an address" />
            </SelectTrigger>
            <SelectContent>
              {addresses.map((addr) => (
                <SelectItem key={addr.id} value={addr.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-semibold">{addr.label}</span>
                    {addr.is_default && <span className="text-xs text-green-600">(Default)</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Selected Address Display */}
      {selectedAddressId && addresses.find(a => a.id === selectedAddressId) && (
        <Card className="p-4 bg-green-50 border-green-200">
          {(() => {
            const addr = addresses.find(a => a.id === selectedAddressId)!;
            return (
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <h3 className="font-bold text-green-900">{addr.label}</h3>
                    {addr.is_default && (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Default</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(addr)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    {!addr.is_default && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(addr.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  {addr.flat_no && `${addr.flat_no}, `}
                  {addr.building_name && `${addr.building_name}, `}
                  {addr.street_address}, {addr.city}, {addr.state} - {addr.pincode}
                  {addr.landmark && ` (Near ${addr.landmark})`}
                </p>
                <p className="text-sm text-gray-600 mt-1">Phone: {addr.phone}</p>
              </div>
            );
          })()}
        </Card>
      )}

      {/* Add New Address Button */}
      <Button
        onClick={() => {
          resetForm();
          setShowDialog(true);
        }}
        variant="outline"
        className="w-full"
        disabled={addresses.length >= 6}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New Address {addresses.length > 0 && `(${addresses.length}/6)`}
      </Button>

      {/* Add/Edit Address Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
            <DialogDescription>
              {editingAddress ? "Update your delivery address details below." : "Add a new delivery address with pincode for delivery verification."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="label">Address Label *</Label>
              <Input
                id="label"
                placeholder="e.g., Home, Office, Parents House"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="flat_no">Flat/House No.</Label>
                <Input
                  id="flat_no"
                  value={formData.flat_no}
                  onChange={(e) => setFormData({ ...formData, flat_no: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="building_name">Building Name</Label>
                <Input
                  id="building_name"
                  value={formData.building_name}
                  onChange={(e) => setFormData({ ...formData, building_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="street_address">Street Address *</Label>
              <Input
                id="street_address"
                value={formData.street_address}
                onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })}
                />
              </div>
              <div>
                <Label htmlFor="landmark">Landmark</Label>
                <Input
                  id="landmark"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_default" className="cursor-pointer">Set as default address</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingAddress ? "Update Address" : "Save Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedAddresses;
