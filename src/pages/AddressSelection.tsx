import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Edit, Plus } from "lucide-react";
import AddressForm from "@/components/AddressForm";
import { guestCheckoutSchema } from "@/lib/validation";

const AddressSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Guest checkout state
  const isGuestCheckout = location.state?.isGuest || false;
  const [guestData, setGuestData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [guestErrors, setGuestErrors] = useState<any>({});

  useEffect(() => {
    if (!isGuestCheckout) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          navigate("/auth");
          return;
        }
        setUser(session.user);
        fetchProfile(session.user.id);
      });
    }
  }, [isGuestCheckout]);

  const fetchProfile = async (userId: string) => {
    const { data } = await (supabase
      .from as any)("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  const handleAddressSubmit = async (address: string) => {
    if (!user) return;

    setSavingAddress(true);
    try {
      const { error } = await (supabase
        .from as any)("profiles")
        .update({ address })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Address saved successfully!");
      setShowAddressForm(false);
      fetchProfile(user.id);
    } catch (error: any) {
      toast.error("Failed to save address: " + error.message);
    } finally {
      setSavingAddress(false);
    }
  };

  const proceedToCheckout = () => {
    if (isGuestCheckout) {
      // Validate guest data
      const validationResult = guestCheckoutSchema.safeParse(guestData);
      if (!validationResult.success) {
        const errors: any = {};
        validationResult.error.errors.forEach(err => {
          errors[err.path[0]] = err.message;
        });
        setGuestErrors(errors);
        return;
      }
      setGuestErrors({});
      navigate("/checkout", { state: { isGuest: true, guestData } });
    } else {
      if (!profile?.address) {
        toast.error("Please add a delivery address first");
        return;
      }
      navigate("/checkout");
    }
  };

  if (showAddressForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => setShowAddressForm(false)}
            className="mb-4"
          >
            ← Back to Address Selection
          </Button>
        </div>
        <AddressForm
          onAddressSubmit={handleAddressSubmit}
          initialAddress={profile?.address}
          isLoading={savingAddress}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Select Delivery Address</h1>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Current Address */}
        {profile?.address ? (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Current Delivery Address
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{profile.name}</p>
                <p className="text-muted-foreground">{profile.email}</p>
                <p className="mt-2">{profile.address}</p>
              </div>
              <Button
                onClick={proceedToCheckout}
                className="w-full mt-4 font-poppins font-bold"
              >
                Deliver to this address
              </Button>
            </CardContent>
          </Card>
        ) : isGuestCheckout ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Guest Checkout Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="guest-name">Full Name</Label>
                  <Input
                    id="guest-name"
                    value={guestData.name}
                    onChange={(e) => setGuestData({ ...guestData, name: e.target.value })}
                    className={guestErrors.name ? "border-red-500" : ""}
                  />
                  {guestErrors.name && <p className="text-red-500 text-sm mt-1">{guestErrors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="guest-email">Email</Label>
                  <Input
                    id="guest-email"
                    type="email"
                    value={guestData.email}
                    onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                    className={guestErrors.email ? "border-red-500" : ""}
                  />
                  {guestErrors.email && <p className="text-red-500 text-sm mt-1">{guestErrors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="guest-phone">Phone Number</Label>
                  <Input
                    id="guest-phone"
                    value={guestData.phone}
                    onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
                    className={guestErrors.phone ? "border-red-500" : ""}
                  />
                  {guestErrors.phone && <p className="text-red-500 text-sm mt-1">{guestErrors.phone}</p>}
                </div>
                <div>
                  <Label htmlFor="guest-address">Delivery Address</Label>
                  <textarea
                    id="guest-address"
                    value={guestData.address}
                    onChange={(e) => setGuestData({ ...guestData, address: e.target.value })}
                    className={`w-full p-2 border rounded-md ${guestErrors.address ? "border-red-500" : "border-gray-300"}`}
                    rows={3}
                  />
                  {guestErrors.address && <p className="text-red-500 text-sm mt-1">{guestErrors.address}</p>}
                </div>
                <Button
                  onClick={proceedToCheckout}
                  className="w-full font-poppins font-bold"
                >
                  Proceed to Checkout
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No delivery address found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Please add a delivery address to proceed with your order
              </p>
              <Button
                onClick={() => setShowAddressForm(true)}
                className="flex items-center gap-2 font-poppins font-bold"
              >
                <Plus className="h-4 w-4" />
                Add Delivery Address
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add New Address Option */}
        {profile?.address && (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <Plus className="h-8 w-8 text-gray-400 mb-2" />
              <Button
                variant="outline"
                onClick={() => setShowAddressForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New Address
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AddressSelection;
