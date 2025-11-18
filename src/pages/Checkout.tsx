import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errorUtils";
import { guestCheckoutSchema } from "@/lib/validation";
import { initiatePhonePePayment, createPaymentTransaction } from "@/lib/phonepe";
import AddressForm from "@/components/AddressForm";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Checkout = () => {
  const { items, totalPrice, clearCart, discountedTotal, discountAmount, promoCode, totalWeight } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('cod');

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
    const { data } = await supabase
      .from("profiles" as any)
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
  };



  const handlePayment = async () => {
    // Check if terms are accepted
    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to proceed with payment.",
        variant: "destructive"
      });
      return;
    }

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
    } else {
      // For authenticated users, ensure user is loaded
      if (!user || !profile) {
        toast({
          title: "Authentication Required",
          description: "Please log in to continue with payment.",
          variant: "destructive"
        });
        return;
      }
    }

    setProcessing(true);

    // Get authenticated user for payment (required for security)
    let authUser = user;
    if (!authUser && isGuestCheckout) {
      // For guest checkout, we still need to get or create a user session
      // to ensure payment tracking. Retrieve current user context.
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      authUser = currentUser;
    }

    // If still no authenticated user for guest, require login
    if (!authUser) {
      toast({
        title: "Login Required",
        description: "Guest checkout is not yet fully supported. Please log in to proceed with payment.",
        variant: "destructive"
      });
      setProcessing(false);
      navigate("/auth");
      return;
    }

    // Prepare order items for atomic creation
    const orderItems = items.map(item => ({
      product_id: item.id,
      product_name: item.name,
      product_price: item.price,
      quantity: item.quantity,
    }));

    // Create order params - always use authenticated user_id
    // For now, pass the original total (before discount) for validation
    // The database function will validate items sum matches this total
    const orderParams = {
      p_user_id: authUser.id,
      p_total_price: totalPrice, // Original total (before discount) for validation
      p_address: isGuestCheckout ? guestData.address : profile.address,
      p_payment_id: null, // Will be updated after payment
      p_items: orderItems,
    };

    // Create order and items atomically using database function
    const { data, error } = await (supabase.rpc as any)('create_order_with_items', orderParams);

    if (error || !data || data.length === 0) {
      toast({
        title: "Order creation failed",
        description: sanitizeError(error || new Error("Unknown error")),
        variant: "destructive"
      });
      setProcessing(false);
      return;
    }

    const result = data[0];

    if (!result.success) {
      toast({
        title: "Order failed",
        description: result.error_message?.includes("Insufficient stock")
          ? "Some items in your cart are no longer available. Please update your cart."
          : sanitizeError(new Error(result.error_message || "Order creation failed")),
        variant: "destructive"
      });
      setProcessing(false);
      return;
    }

    const orderId = result.order_id;

    // Track promo code usage if a promo code was applied (only for authenticated users)
    if (promoCode && !isGuestCheckout) {
      try {
        // Get promo code id first
        const { data: promoData, error: promoError } = await supabase
          .from("promo_codes")
          .select("id")
          .eq("code", promoCode.code)
          .single();

        if (promoError) {
          console.warn("Error fetching promo code:", promoError);
        } else if (promoData) {
          const { error: usageError } = await (supabase
            .from as any)("promo_code_usage")
            .insert({
              promo_code_id: promoData.id,
              order_id: orderId,
              user_id: authUser.id,
            });
          
          if (usageError) {
            console.warn("Error tracking promo code usage:", usageError);
          }
        }
      } catch (error) {
        // Don't fail the order for promo code tracking issues
        console.error("Error in promo code tracking:", error);
      }
    }

    // Generate unique transaction ID
    const merchantTransactionId = `MT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // Handle COD payment
    if (paymentMethod === 'cod') {
      console.log('[Checkout] Confirming COD order:', { orderId, merchantTransactionId });
      
      // For COD, mark order as confirmed using database function
      // This bypasses RLS restrictions
      const { data: confirmData, error: confirmError } = await (supabase.rpc as any)('confirm_cod_order', {
        p_order_id: orderId,
        p_payment_id: merchantTransactionId
      });

      if (confirmError) {
        console.error('[Checkout] COD confirmation error:', {
          code: confirmError.code,
          message: confirmError.message,
          details: confirmError.details,
          hint: confirmError.hint
        });
        
        // If order is already processed or not found, check current status
        if (confirmError.message?.includes('already processed')) {
          const { data: orderCheck } = await supabase
            .from('orders')
            .select('status')
            .eq('id', orderId)
            .single();
          
          if (orderCheck && orderCheck.status === 'confirmed') {
            console.log('[Checkout] Order already confirmed, proceeding...');
            clearCart();
            setShowSuccess(true);
            setProcessing(false);
            return;
          }
        }
        
        toast({
          title: "Error",
          description: confirmError.message || "Failed to confirm COD order. Please try again.",
          variant: "destructive"
        });
        setProcessing(false);
        return;
      }

      console.log('[Checkout] COD order confirmed successfully:', confirmData);
      
      // Clear cart and show success
      clearCart();
      setShowSuccess(true);
      setProcessing(false);
      
      // Redirect to orders page after 2 seconds
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
      
      return;
    }

    // Handle online payment (PhonePe)
    // Get phone number from authenticated user profile or guest data
    let phoneNumber = guestData.phone;
    if (!phoneNumber && profile) {
      // Try to get from user profile phone field if it exists
      phoneNumber = profile.phone;
    }
    
    // Ensure phone number is never undefined/null
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      phoneNumber = '';
    }

    // Initiate PhonePe payment
    const paymentOptions = {
      amount: Math.round(discountedTotal), // Send in rupees - Edge Function converts to paisa
      merchantTransactionId,
      merchantUserId: authUser.id,
      redirectUrl: `${window.location.origin}/payment/callback?transactionId=${merchantTransactionId}&order=${orderId}`,
      callbackUrl: `https://osromibanfzzthdmhyzp.supabase.co/functions/v1/phonepe-webhook`,
      mobileNumber: phoneNumber,
      deviceContext: {
        deviceOS: navigator.platform.includes('Mac') ? 'MAC' : 'WINDOWS'
      }
    };

    console.log('[Checkout] About to initiate payment with options:', {
      amount: { value: paymentOptions.amount, rupees: `₹${paymentOptions.amount}`, type: typeof paymentOptions.amount },
      merchantTransactionId: { value: paymentOptions.merchantTransactionId, type: typeof paymentOptions.merchantTransactionId },
      callbackUrl: { value: paymentOptions.callbackUrl, type: typeof paymentOptions.callbackUrl },
      merchantUserId: paymentOptions.merchantUserId,
      mobileNumber: paymentOptions.mobileNumber
    });

    const paymentResponse = await initiatePhonePePayment(paymentOptions);

    console.log('[Checkout] Payment response received:', {
      success: paymentResponse.success,
      code: paymentResponse.code,
      message: paymentResponse.message,
      data: paymentResponse.data
    });

    // PhonePe v2.0 API returns redirectUrl directly in response
    const redirectUrl = paymentResponse.data?.redirectUrl;

    if (paymentResponse.success && redirectUrl) {
      // Create payment transaction record for tracking
      // Order status will be updated by webhook after payment confirmation
      try {
        await createPaymentTransaction(orderId, merchantTransactionId, paymentOptions.amount);
        console.log('[Checkout] Payment transaction recorded:', { orderId, merchantTransactionId, amount: paymentOptions.amount });
      } catch (error) {
        console.error('[Checkout] Error creating payment transaction record:', error);
        // Don't fail checkout for this - webhook will handle it
      }

      console.log('[Checkout] Opening PhonePe payment page (redirect):', redirectUrl);
      // Use full-page redirect - PhonePe's page will load in their own domain
      // This avoids CSP issues since the page runs on phonepe.com, not on our domain
      window.location.href = redirectUrl;
    } else {
      console.error('[Checkout] Payment initiation failed:', {
        success: paymentResponse.success,
        hasRedirectUrl: !!redirectUrl,
        code: paymentResponse.code,
        message: paymentResponse.message
      });
      
      toast({
        title: "Payment initiation failed",
        description: paymentResponse.message || "Unable to initiate payment. Please try again.",
        variant: "destructive"
      });
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    navigate("/products");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {isGuestCheckout ? (
            <>
              <Card className="p-6 mb-4">
                <h2 className="text-xl font-bold mb-4">Guest Information</h2>
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
                </div>
              </Card>

              <Card className="p-6 mb-4">
                <AddressForm
                  onAddressSubmit={(address, phone) => setGuestData({ ...guestData, address, phone: phone || guestData.phone })}
                  initialAddress={guestData.address}
                  initialPhone={guestData.phone}
                />
              </Card>
            </>
          ) : (
            <>
              <Card className="p-6 mb-4">
                <h2 className="text-xl font-bold mb-4">Delivery Address</h2>
                <AddressForm
                  onAddressSubmit={(address, phone) => {
                    // Update profile address and phone in database
                    supabase
                      .from("profiles" as any)
                      .update({ address, phone })
                      .eq("id", user.id);
                    setProfile({ ...profile, address, phone });
                  }}
                  initialAddress={profile?.address}
                  initialPhone={profile?.phone}
                />
              </Card>
            </>
          )}


        </div>

        <div>
          <Card className="p-6 mb-4">
            <h2 className="text-xl font-bold mb-4">Order Items</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={`${item.id}-${item.protein}`} className="flex items-center gap-3 p-3 border rounded-lg">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.protein} × {item.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">₹{item.price * item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Payment Summary</h2>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{totalPrice}</span>
              </div>
              {promoCode && discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({promoCode.discount_percentage}%)</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>₹{discountedTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Payment Method</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="w-4 h-4"
                  />
                  <span>Cash on Delivery (COD)</span>
                </label>
                <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="w-4 h-4"
                  />
                  <span>Online Payment (PhonePe)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                className="data-[state=checked]:bg-[#3b2a20] data-[state=checked]:border-[#3b2a20]"
              />
              <Label htmlFor="terms" className="text-sm font-poppins text-black cursor-pointer">
                I have read and agree to the{" "}
                <a href="/terms" target="_blank" className="text-[#b5edce] hover:underline">
                  terms and conditions
                </a>
              </Label>
            </div>

            <Button
              className="w-full font-poppins font-bold"
              onClick={handlePayment}
              disabled={processing || !termsAccepted}
            >
              {processing ? "Processing..." : paymentMethod === 'cod' ? "Place Order (COD)" : "Proceed to Payment"}
            </Button>
          </Card>
        </div>
      </div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Placed Successfully!</DialogTitle>
          </DialogHeader>
          <p>Your COD order has been confirmed. Please keep the exact amount ready for payment upon delivery.</p>
          <Button onClick={() => navigate("/orders")} className="font-poppins font-bold">View Orders</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;
