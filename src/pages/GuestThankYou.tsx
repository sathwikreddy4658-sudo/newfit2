import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Mail, Lock, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const GuestThankYou = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const orderId = location.state?.orderId || sessionStorage.getItem('guestOrderId');
  const email = location.state?.email || sessionStorage.getItem('guestOrderEmail');
  const customerName = location.state?.name || sessionStorage.getItem('guestOrderName');
  const customerPhone = sessionStorage.getItem('guestOrderPhone') || '';

  const handleCreateAccount = async () => {
    if (!password || password.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingAccount(true);

    try {
      // Create the account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email!,
        password: password,
        options: {
          data: {
            full_name: customerName || ''
          }
        }
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Link the guest order to this new user account via secure RPC
        if (orderId) {
          const { error: linkError } = await (supabase.rpc as any)(
            'link_guest_order_to_user',
            {
              p_order_id: orderId,
              p_email: email || null,
              p_phone: customerPhone || null,
              p_user_id: authData.user.id
            }
          );

          if (linkError) {
            console.error('Error linking order to account:', linkError);
            // Don't fail the signup, just log it
          }
        }

        toast({
          title: "Account Created! 🎉",
          description: "Your account has been created and your order has been linked to it.",
        });

        // Clear guest order data from session storage
        sessionStorage.removeItem('guestOrderId');
        sessionStorage.removeItem('guestOrderEmail');
        sessionStorage.removeItem('guestOrderName');
        sessionStorage.removeItem('guestOrderPhone');

        // Redirect to orders page after a short delay
        setTimeout(() => {
          navigate('/orders');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast({
        title: "Account Creation Failed",
        description: error.message || "Failed to create account. You can sign up later from the main page.",
        variant: "destructive"
      });
      setIsCreatingAccount(false);
    }
  };

  const handleExit = () => {
    // Clear session storage
    sessionStorage.removeItem('guestOrderId');
    sessionStorage.removeItem('guestOrderEmail');
    sessionStorage.removeItem('guestOrderName');
    
    // Navigate to home with cleared cart
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <Card className="p-4 md:p-8 text-center mb-4 md:mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CheckCircle className="h-12 w-12 md:h-20 md:w-20 text-green-600 mx-auto mb-3 md:mb-4" />
          <h1 className="text-2xl md:text-4xl font-bold text-green-800 mb-2 md:mb-3">
            Thank You For Your Order!
          </h1>
          <p className="text-green-700 text-sm md:text-lg mb-2">
            You will receive a confirmation email shortly at:
          </p>
          <p className="text-green-900 font-semibold text-sm md:text-lg break-all">
            {email}
          </p>
          {orderId && (
            <p className="text-xs md:text-sm text-green-600 mt-2 md:mt-3">
              Order ID: <span className="font-mono font-bold">{orderId.slice(0, 8)}</span>
            </p>
          )}
        </Card>

        {/* Sign Up Incentive */}
        <Card className="p-4 md:p-6 mb-4 md:mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4">
            <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-purple-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-purple-900 mb-2 md:mb-3">
                Create Your Account Now!
              </h2>
              <div className="space-y-2 mb-3 md:mb-4">
                <div className="flex items-center gap-2 text-purple-800">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                  <p className="text-sm md:text-base font-semibold">Track this order and all future orders</p>
                </div>
                <div className="flex items-center gap-2 text-purple-800">
                  <Mail className="h-4 w-4 md:h-5 md:w-5" />
                  <p className="text-sm md:text-base font-semibold">Receive exclusive promotions and offers</p>
                </div>
                <div className="flex items-center gap-2 text-purple-800">
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                  <p className="text-sm md:text-base font-semibold">Faster checkout for future purchases</p>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 md:p-3 mb-3 md:mb-4">
                <p className="text-sm text-yellow-900">
                  <strong>⚠️ Important:</strong> Guest orders are <strong>NOT</strong> visible later if you sign up separately. 
                  Create your account now to link this order to your profile!
                </p>
              </div>

              {/* Quick Sign Up Form */}
              <div className="space-y-2 md:space-y-3 bg-white p-3 md:p-4 rounded-lg border">
                <div>
                  <Label htmlFor="email" className="text-sm">Email (Already Saved)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-sm">Create Password</Label>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isCreatingAccount}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isCreatingAccount}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateAccount()}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleCreateAccount} 
                  disabled={isCreatingAccount}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  {isCreatingAccount ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Creating Your Account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Account & Link This Order
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Exit Option */}
        <div className="text-center">
          <Button 
            onClick={handleExit}
            variant="ghost"
            className="text-gray-600 hover:text-gray-800"
          >
            No Thanks, Exit to Home
          </Button>
        </div>

        {/* Additional Info */}
        <Card className="p-3 md:p-4 mt-4 md:mt-6 bg-blue-50 border-blue-200">
          <p className="text-xs md:text-sm text-blue-900">
            💡 <strong>Did you know?</strong> Registered users get early access to sales, 
            personalized product recommendations, and can easily track all their orders in one place!
          </p>
        </Card>
      </div>
    </div>
  );
};

export default GuestThankYou;
