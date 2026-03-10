import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { registerUser, signInWithGoogle, linkGuestOrdersToUser } from "@/integrations/firebase/auth";
import { getOrder } from "@/integrations/firebase/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Mail, Lock, Sparkles, TrendingUp, MapPin, CreditCard, Package, ArrowRight, Home } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const GuestThankYou = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);

  const orderId = location.state?.orderId;
  const email = location.state?.email;
  const customerName = location.state?.guestName || '';
  const customerPhone = location.state?.guestPhone || '';

  useEffect(() => {
    // Fetch order details
    const fetchOrderData = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const data = await getOrder(orderId);

        if (data) {
          setOrder(data);
          console.log('[GuestThankYou] Order data:', {
            id: data.id,
            total_amount: data.total_amount,
            shipping_charge: (data as any).shipping_charge || 0,
            cod_charge: (data as any).cod_charge || 0,
            discount_amount: (data as any).discount_amount || 0,
            payment_method: (data as any).payment_method || 'online'
          });
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
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
      // Create the account using Firebase, customerName);

      if (authUser) {
        // Link guest order to the new user account
        try {
          const linkedCount = await linkGuestOrdersToUser(authUser.uid, email!);
          console.log(`[GuestThankYou] Linked ${linkedCount} orders to new account`);
          toast({
            title: "Account Created & Orders Linked",
            description: `Your account has been created successfully and ${linkedCount} order(s) have been linked!`,
          });
        } catch (linkError) {
          console.error('Error linking orders (non-fatal):', linkError);
          toast({
            title: "Account Created",
            description: "Your account has been created successfully!",
          });
        }

        // Redirect to dashboard
        setTimeout(() => {
          navigate('/products', { replace: true });
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    setIsSigningInGoogle(true);

    try {
      const authUser = await signInWithGoogle();

      if (authUser) {
        // Link guest orders to the Google-authenticated user account
        try {
          const linkedCount = await linkGuestOrdersToUser(authUser.uid, email!);
          console.log(`[GuestThankYou] Linked ${linkedCount} orders to Google account`);
          toast({
            title: "Signed In & Orders Linked",
            description: `Welcome back! ${linkedCount} order(s) have been linked to your account.`,
          });
        } catch (linkError) {
          console.error('Error linking orders (non-fatal):', linkError);
          toast({
            title: "Signed In Successfully",
            description: "Welcome to your account!",
          });
        }

        // Redirect to dashboard
        setTimeout(() => {
          navigate('/products', { replace: true });
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast({
        title: "Sign-in Failed",
        description: error.message || "Failed to sign in with Google. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSigningInGoogle
      setIsCreatingAccount(false);
    }
  };

  const handleExit = () => {
    // Navigate to home
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-cyan-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white shadow-lg mb-4" style={{ borderColor: '#c9f4dd', borderWidth: '2px' }}>
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200" style={{ borderTopColor: '#3b2a20' }}></div>
          </div>
          <p className="text-slate-600 font-medium">Preparing your confirmation...</p>
        </div>
      </div>
    );
  }

  const isCOD = order?.payment_method === 'cod';
  const paymentMethod = isCOD ? 'Cash on Delivery' : 'Online Payment';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-white">
      {/* Elegant Header with Brand Accent */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(to right, #3b2a20, #3b2a20 50%, #c9f4dd 50%, #c9f4dd)' }}></div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        {/* Success Section */}
        <div className="text-center mb-12 md:mb-16">
          {/* Circular Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl opacity-20" style={{ backgroundColor: '#c9f4dd' }}></div>
              <div className="relative bg-white rounded-full p-4 shadow-lg border-2" style={{ borderColor: '#c9f4dd' }}>
                <CheckCircle className="h-16 w-16 md:h-20 md:w-20 animate-pulse" style={{ color: '#3b2a20' }} strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4 tracking-tight" style={{ color: '#3b2a20' }}>
            Order Confirmed
          </h1>
          <p className="text-lg md:text-xl mb-6 md:mb-8 font-light" style={{ color: '#3b2a20' }}>
            Thank you for choosing NewFit
          </p>

          {/* Order ID Card - Premium Style */}
          {orderId && (
            <div className="inline-block bg-white rounded-xl shadow-md border-2 px-6 md:px-8 py-4 md:py-5 mb-6" style={{ borderColor: '#c9f4dd' }}>
              <p className="text-xs md:text-sm text-gray-500 uppercase tracking-widest font-semibold mb-2">Order Number</p>
              <p className="text-2xl md:text-3xl font-mono font-bold" style={{ color: '#3b2a20' }}>
                {orderId.slice(0, 12)}
              </p>
            </div>
          )}

          {/* Confirmation Email */}
          <p className="text-gray-600 mb-2">Confirmation sent to</p>
          <p className="text-base md:text-lg font-semibold break-all" style={{ color: '#3b2a20' }}>
            {email}
          </p>
        </div>

        {/* Order Details Section */}
        {order && (
          <div className="mb-12 md:mb-14">
            {/* Order Items - Minimal Design */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6" style={{ borderColor: '#c9f4dd' }}>
              <div className="px-6 md:px-8 py-6 md:py-7 border-b" style={{ borderColor: '#c9f4dd', backgroundColor: 'rgba(201, 244, 221, 0.3)' }}>
                <div className="flex items-center gap-3 mb-0">
                  <Package className="h-5 w-5" style={{ color: '#3b2a20' }} />
                  <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#3b2a20' }}>Order Items</h2>
                </div>
              </div>

              <div className="divide-y" style={{ divideColor: '#c9f4dd' }}>
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="px-6 md:px-8 py-5 md:py-6 flex justify-between items-center hover:bg-white transition-colors" style={{ backgroundColor: 'rgba(201, 244, 221, 0.05)' }}>
                    <div className="flex-1">
                      <p className="font-medium text-base md:text-lg" style={{ color: '#3b2a20' }}>{item.name}</p>
                      <p className="text-sm mt-1" style={{ color: '#666' }}>Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg" style={{ color: '#3b2a20' }}>₹{(item.price * item.quantity).toFixed(2)}</p>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <p className="text-xs" style={{ color: '#999' }}>@₹{item.price.toFixed(2)}</p>
                        {item.original_price && item.original_price > item.price && (
                          <p className="text-xs line-through" style={{ color: '#ccc' }}>₹{item.original_price.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown - Clean Table */}
            <div className="bg-white rounded-xl shadow-sm border px-6 md:px-8 py-6 md:py-8" style={{ borderColor: '#c9f4dd' }}>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span style={{ color: '#666' }}>Items Subtotal</span>
                  <span className="font-medium" style={{ color: '#3b2a20' }}>
                    ₹{order.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>

                {order.discount_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <span style={{ color: '#666' }}>Discount Applied</span>
                    <span className="font-semibold" style={{ color: '#16a34a' }}>
                      -₹{parseFloat(order.discount_amount).toFixed(2)}
                    </span>
                  </div>
                )}

                {order.shipping_charge !== undefined && order.shipping_charge !== null && order.shipping_charge > 0 && (
                  <div className="flex justify-between items-center">
                    <span style={{ color: '#666' }}>Shipping</span>
                    <span className="font-medium" style={{ color: '#3b2a20' }}>₹{parseFloat(order.shipping_charge).toFixed(2)}</span>
                  </div>
                )}

                {order.cod_charge > 0 && (
                  <div className="flex justify-between items-center">
                    <span style={{ color: '#666' }}>COD Service Fee</span>
                    <span className="font-medium" style={{ color: '#3b2a20' }}>₹{parseFloat(order.cod_charge).toFixed(2)}</span>
                  </div>
                )}

                {/* Total */}
                <div className="pt-4 flex justify-between items-center" style={{ borderTop: '2px solid #c9f4dd' }}>
                  <span className="font-bold text-lg" style={{ color: '#3b2a20' }}>Total Amount</span>
                  <span className="text-2xl md:text-3xl font-bold" style={{ color: '#3b2a20' }}>
                    ₹{parseFloat(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Info Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-12 md:mb-14">
          {/* Address */}
          {order?.address && (
            <div className="bg-white rounded-xl shadow-sm border p-6 md:p-7 hover:shadow-md transition-shadow" style={{ borderColor: '#c9f4dd' }}>
              <div className="flex items-start gap-3">
                <div className="rounded-lg p-3 flex-shrink-0" style={{ backgroundColor: 'rgba(201, 244, 221, 0.5)' }}>
                  <MapPin className="h-5 w-5" style={{ color: '#3b2a20' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold mb-2" style={{ color: '#3b2a20' }}>Delivery Address</h4>
                  <p className="text-sm leading-relaxed break-words" style={{ color: '#666' }}>{order.address}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-sm border p-6 md:p-7 hover:shadow-md transition-shadow" style={{ borderColor: '#c9f4dd' }}>
            <div className="flex items-start gap-3">
              <div className="rounded-lg p-3 flex-shrink-0" style={{ backgroundColor: 'rgba(201, 244, 221, 0.5)' }}>
                <CreditCard className="h-5 w-5" style={{ color: '#3b2a20' }} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold mb-2" style={{ color: '#3b2a20' }}>Payment Method</h4>
                <p className="text-sm" style={{ color: '#666' }}>
                  {isCOD ? '💵 Pay at Doorstep' : '🔐 Online Payment'}
                </p>
                <p className="text-xs mt-1" style={{ color: '#999' }}>{paymentMethod}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section - Brand Themed Card */}
        <div className="rounded-xl shadow-lg p-8 md:p-10 mb-8 border relative overflow-hidden" style={{ backgroundColor: '#3b2a20', borderColor: '#c9f4dd', borderWidth: '2px' }}>
          {/* Background accent */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-10" style={{ backgroundColor: '#c9f4dd' }}></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Create Your Account</h2>
            <p className="text-gray-200 text-base md:text-lg mb-6 max-w-lg">
              Link this order to your account, track your purchases, and enjoy exclusive member benefits.
            </p>

            {/* Benefits List */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#c9f4dd' }}></div>
                <p className="text-gray-200 text-sm md:text-base">Track all your orders in one place</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#c9f4dd' }}></div>
                <p className="text-gray-200 text-sm md:text-base">Get early access to exclusive sales</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#c9f4dd' }}></div>
                <p className="text-gray-200 text-sm md:text-base">Personalized recommendations</p>
              </div>
            </div>

            {/* Quick Sign-In with Google */}
            <div className="mb-8">
              <Button 
                onClick={handleSignInWithGoogle}
                disabled={isSigningInGoogle || isCreatingAccount}
                className="w-full text-gray-900 font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl text-base md:text-lg bg-white border-2"
                style={{ borderColor: '#c9f4dd' }}
              >
                {isSigningInGoogle ? (
                  <>
                    <span className="animate-spin mr-2 inline-block">⏳</span>
                    Signing in with Google...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 inline mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>
              <p className="text-center text-gray-300 text-xs md:text-sm mt-3">One-click sign-up & automatic order linking</p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201, 244, 221, 0.3)' }}></div>
              <span className="text-gray-400 text-sm">Or create an account</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201, 244, 221, 0.3)' }}></div>
            </div>

            {/* Sign Up Form */}
            <div className="rounded-lg p-6 border mb-6" style={{ backgroundColor: 'rgba(201, 244, 221, 0.15)', borderColor: 'rgba(201, 244, 221, 0.3)' }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email-static" className="text-white text-sm font-medium block mb-2">
                    Email Address
                  </Label>
                  <Input
                    id="email-static"
                    type="email"
                    value={email || ''}
                    disabled
                    className="bg-white/20 border text-white placeholder:text-white/50 disabled:opacity-80"
                    style={{ borderColor: 'rgba(201, 244, 221, 0.5)' }}
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-white text-sm font-medium block mb-2">
                    Create Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isCreatingAccount}
                      className="bg-white/20 border text-white placeholder:text-white/50 pl-10 disabled:opacity-70"
                      style={{ borderColor: 'rgba(201, 244, 221, 0.5)' }}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-white text-sm font-medium block mb-2">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isCreatingAccount}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateAccount()}
                      className="bg-white/20 border text-white placeholder:text-white/50 pl-10 disabled:opacity-70"
                      style={{ borderColor: 'rgba(201, 244, 221, 0.5)' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleCreateAccount} 
              disabled={isCreatingAccount}
              className="w-full text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl text-base md:text-lg"
              style={{ backgroundColor: '#c9f4dd', color: '#3b2a20' }}
            >
              {isCreatingAccount ? (
                <>
                  <span className="animate-spin mr-2 inline-block">⏳</span>
                  Creating Your Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5 inline" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleExit}
            className="border-2 font-medium py-6 flex items-center justify-center gap-2"
            style={{ borderColor: '#c9f4dd', color: '#3b2a20', backgroundColor: 'rgba(201, 244, 221, 0.1)' }}
          >
            <Home className="h-4 w-4" />
            Continue Shopping
          </Button>
          <Button 
            onClick={handleExit}
            className="border-2 font-medium py-6 flex items-center justify-center gap-2"
            style={{ borderColor: '#3b2a20', color: '#3b2a20', backgroundColor: '#ffffff' }}
          >
            Back to Home
          </Button>
        </div>

        {/* Footer Info */}
        <div className="mt-12 md:mt-16 pt-8 md:pt-10" style={{ borderTop: '2px solid #c9f4dd' }}>
          <p className="text-center text-sm md:text-base leading-relaxed" style={{ color: '#666' }}>
            A confirmation email with your order details and tracking information has been sent to <span className="font-semibold" style={{ color: '#3b2a20' }}>{email}</span>. 
            <br className="hidden md:inline" />
            <span className="block md:inline md:ml-1">You can always check your order status after creating an account.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuestThankYou;
