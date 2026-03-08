import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, getCurrentUser } from "@/integrations/firebase/auth";
import { getUserRoles } from "@/integrations/firebase/db";
import { auth } from "@/integrations/firebase/client";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const AdminAuth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in with admin access
  useEffect(() => {
    const checkExistingAdmin = async () => {
      const user = getCurrentUser();
      if (user) {
        // Check admin role from Firebase
        const roles = await getUserRoles(user.uid);
        if (roles?.includes('admin')) {
          navigate("/admin/dashboard");
        }
      }
    };

    checkExistingAdmin();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await loginUser(email, password);

      // Check admin role immediately after login
      const roles = await getUserRoles(user.uid);
      
      if (!roles?.includes('admin')) {
        await signOut(auth);
        toast({ 
          title: "Access denied", 
          description: "Your account does not have admin privileges", 
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }
      
      toast({ title: "Success", description: "Admin login successful" });
      navigate("/admin/dashboard");
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full font-poppins font-bold" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminAuth;
