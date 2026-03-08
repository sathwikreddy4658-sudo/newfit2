import { useEffect, useState } from "react";
import { getCurrentUser, auth } from "@/integrations/firebase/auth";
import { db } from "@/integrations/firebase/client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { profileSchema } from "@/lib/validation";
import { sanitizeError } from "@/lib/errorUtils";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        navigate("/auth");
        return;
      }
      setUser(firebaseUser as any);
      fetchProfile(firebaseUser.uid);
    });

    return () => unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setProfile(userData);
        setFormData({
          name: userData.full_name || "",
          email: userData.email || "",
          address: userData.address || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSave = async () => {
    // Validate profile data
    const validationResult = profileSchema.safeParse(formData);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validation failed",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        full_name: validationResult.data.name,
        email: validationResult.data.email,
        address: validationResult.data.address,
      });
      toast({ title: "Profile updated successfully" });
      setEditing(false);
      fetchProfile(user.uid);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: sanitizeError(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-16">
      <h1 className="text-3xl font-saira font-black mb-8 uppercase text-[#3b2a20]">My Profile</h1>

      <Card className="p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            {editing ? (
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            ) : (
              <p className="mt-1">{profile?.full_name}</p>
            )}
          </div>

          <div>
            <Label>Email</Label>
            {editing ? (
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            ) : (
              <p className="mt-1">{profile?.email}</p>
            )}
          </div>

          <div>
            <Label>Address</Label>
            {editing ? (
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            ) : (
              <p className="mt-1">{profile?.address}</p>
            )}
          </div>

          <div className="flex gap-2">
            {editing ? (
              <>
                <Button onClick={handleSave} className="font-poppins font-bold">Save</Button>
                <Button variant="outline" onClick={() => setEditing(false)} className="font-poppins font-bold">
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)} className="font-poppins font-bold">Edit Profile</Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
