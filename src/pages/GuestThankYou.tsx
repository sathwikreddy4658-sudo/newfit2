import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Mail, Lock, Sparkles, TrendingUp, MapPin, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const GuestThankYou = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const orderId = location.state?.orderId;
  const email = location.state?.email;
  const customerName = location.state?.guestName || '';
  const customerPhone = location.state?.guestPhone || '';

  useEffect(() => {
    // Fetch order details
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('id', orderId)
          .single();

        if (!error && data) {
          setOrder(data);
          console.log('[GuestThankYou] Order data:', {
            id: data.id,
            total_price: data.total_amount,
            shipping_charge: (data as any).shipping_charge || 0,
            cod_charge: (data as any).cod_charge || 0,
            discount_applied: (data as any).discount_applied || 0,
            payment_method: (data as any).payment_method || 'online'
          });
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

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
        // Update the user's profile with address from the order
        if (order?.address) {
          const { error: profileError } = await (supabase as any)
            .from('profiles')
            .update({ address: order.address })
            .eq('id', authData.user.id);

          if (profileError) {
            console.error('Error updating profile with address:', profileError);
          }
        }

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
    // Navigate to home
    navigate('/');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  const isCOD = order?.payment_id?.startsWith('COD-');
  const paymentMethod = isCOD ? 'Cash on Delivery' : 'Online Payment';

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <Card className="p-4 md:p-8 text-center mb-4 md:mb-6 border-[#3b2a20]" style={{ backgroundColor: '#3b2a20' }}>
          <CheckCircle className="h-12 w-12 md:h-20 md:w-20 mx-auto mb-3 md:mb-4 animate-bounce" style={{ color: '#b5edce' }} />
          <h1 className="text-2xl md:text-4xl font-saira font-black mb-2 md:mb-3 uppercase text-white">
            Thank You For Your Order
          </h1>
          <p className="text-sm md:text-lg mb-2" style={{ color: '#b5edce' }}>
            You will receive a confirmation email shortly at:
          </p>
          <p className="font-semibold text-sm md:text-lg break-all" style={{ color: '#b5edce' }}>
            {email}
          </p>
          {orderId && (
            <div className="mt-3 md:mt-4 p-2 md:p-3 rounded-lg inline-block" style={{ backgroundColor: 'rgba(181, 237, 206, 0.2)' }}>
              <p className="text-xs md:text-sm" style={{ color: '#b5edce' }}>Order ID</p>
              <p className="text-lg md:text-xl font-mono font-bold" style={{ color: '#b5edce' }}>
                {orderId.slice(0, 8)}
              </p>
            </div>
          )}
        </Card>

        {/* Order Summary */}
        {order && (
          <Card className="p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="text-lg md:text-2xl font-bold mb-4 text-gray-800">Order Summary</h2>
            
            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Items Ordered</h3>
              <div className="space-y-2">
                {order.order_items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm md:text-base">{item.product_name}</span>
                    <span className="text-sm md:text-base font-semibold">
                      {item.quantity}x ₹{item.product_price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="border-t pt-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items Total</span>
                  <span className="font-medium">
                    ₹{order.order_items?.reduce((sum: number, item: any) => sum + (item.product_price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
                
                {order.discount_applied > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Discount Applied</span>
                    <span className="font-medium">-₹{parseFloat(order.discount_applied).toFixed(2)}</span>
                  </div>
                )}
                
                {order.shipping_charge !== undefined && order.shipping_charge !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping Charge</span>
                    <span className="font-medium">₹{parseFloat(order.shipping_charge).toFixed(2)}</span>
                  </div>
                )}
                
                {order.cod_charge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">COD Charge</span>
                    <span className="font-medium">₹{parseFloat(order.cod_charge).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-lg font-bold">Total Amount</span>
                  <span className="text-xl md:text-2xl font-bold text-primary">₹{parseFloat(order.total_price).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            {order.address && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Delivery Address</h4>
                    <p className="text-sm text-gray-700">{order.address}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Payment Method</h4>
                  <p className="text-sm text-gray-700">{paymentMethod}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Sign Up Incentive */}
        <Card className="p-4 md:p-6 mb-4 md:mb-6 border-[#b5edce]" style={{ backgroundColor: 'rgba(181, 237, 206, 0.3)' }}>
          <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4">
            <Sparkles className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0 mt-1" style={{ color: '#3b2a20' }} />
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-saira font-black mb-2 md:mb-3 uppercase" style={{ color: '#3b2a20' }}>
                Create Your Account Now
              </h2>
              <div className="space-y-2 mb-3 md:mb-4">
                <div className="flex items-center gap-2" style={{ color: '#3b2a20' }}>
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                  <p className="text-sm md:text-base font-semibold">Track this order and all future orders</p>
                </div>
                <div className="flex items-center gap-2" style={{ color: '#3b2a20' }}>
                  <Mail className="h-4 w-4 md:h-5 md:w-5" />
                  <p className="text-sm md:text-base font-semibold">Receive exclusive promotions and offers</p>
                </div>
                <div className="flex items-center gap-2" style={{ color: '#3b2a20' }}>
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                  <p className="text-sm md:text-base font-semibold">Faster checkout for future purchases</p>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 md:p-3 mb-3 md:mb-4">
                <p className="text-sm text-yellow-900">
                  <strong> Important:</strong> Guest orders are <strong>NOT</strong> visible later if you sign up separately. 
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
            💡 <strong></strong> Registered users get early access to sales, 
            personalized product recommendations, and can easily track all their orders in one place!
          </p>
        </Card>
      </div>
    </div>
  );
};

export default GuestThankYou;
