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
import { Loader2, CheckCircle2, AlertCircle, Truck } from "lucide-react";
import { calculateOrderPrice, validatePaymentMethod } from "@/lib/pricingEngine";
import { getShippingRate } from "@/lib/pincodeService";
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
  const [successOrderData, setSuccessOrderData] = useState<{orderId: string, email: string, isGuest: boolean} | null>(null);
  const [preventCartRedirect, setPreventCartRedirect] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('cod');

  // Pricing and delivery state
  const [selectedPincode, setSelectedPincode] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [shippingCharge, setShippingCharge] = useState(0);
  const [isCODAvailable, setIsCODAvailable] = useState(false);
  const [estimatedDays, setEstimatedDays] = useState(0);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [deliveryChecked, setDeliveryChecked] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [addressSaved, setAddressSaved] = useState(false);

  // Calculate shipping discount from promo code
  const getShippingDiscount = () => {
    if (!promoCode || promoCode.promo_type !== 'shipping_discount') return 0;
    if (!deliveryChecked || !selectedState || !shippingCharge) return 0;

    // Check if state is allowed
    if (promoCode.allowed_states && promoCode.allowed_states.length > 0) {
      const stateMatch = promoCode.allowed_states.some(
        allowedState => selectedState.toUpperCase().includes(allowedState.toUpperCase())
      );
      if (!stateMatch) return 0;
    }

    // Check if pincode pattern is allowed
    if (promoCode.allowed_pincodes && promoCode.allowed_pincodes.length > 0) {
      const pincodeMatch = promoCode.allowed_pincodes.some(pattern => {
        const regex = new RegExp('^' + pattern.replace('%', '.*'));
        return regex.test(selectedPincode);
      });
      if (!pincodeMatch) return 0;
    }

    return (shippingCharge * (promoCode.shipping_discount_percentage || 0)) / 100;
  };

  // Guest checkout state
  const isGuestCheckout = location.state?.isGuest || false;
  const [guestData, setGuestData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [guestErrors, setGuestErrors] = useState<any>({});

  // User checkout contact info state
  const [userContactData, setUserContactData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [userContactErrors, setUserContactErrors] = useState<any>({});



  useEffect(() => {
    if (!isGuestCheckout) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          navigate("/auth");
          return;
        }
        console.log("=== Checkout: Auth Session ===");
        console.log("Session user:", session.user);
        console.log("User email from session:", session.user.email);
        setUser(session.user);
        fetchProfile(session.user.id, session.user);
      });
    }
  }, [isGuestCheckout]);

  // Handle navigation after successful order
  useEffect(() => {
    if (successOrderData) {
      const timer = setTimeout(() => {
        if (successOrderData.isGuest) {
          navigate('/guest-thank-you', { 
            state: { 
              orderId: successOrderData.orderId, 
              email: successOrderData.email,
              name: guestData.name
            } 
          });
        } else {
          navigate('/user-thank-you', {
            state: {
              orderId: successOrderData.orderId,
              email: successOrderData.email
            }
          });
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [successOrderData, navigate, guestData.name]);

  const fetchProfile = async (userId: string, sessionUser?: any) => {
    const { data } = await supabase
      .from("profiles" as any)
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
    
    // Use the passed sessionUser if available, otherwise fall back to user state
    const userEmail = sessionUser?.email || user?.email || '';
    
    // Pre-fill user contact data from profile
    if (data) {
      console.log("=== Checkout: Profile data ===");
      console.log("Profile:", data);
      console.log("Phone from profile:", data.phone);
      console.log("User email:", userEmail);
      
      setUserContactData({
        name: data.full_name || userEmail?.split('@')[0] || '',
        email: userEmail,
        phone: data.phone || ''
      });
      
      console.log("UserContactData set to:", {
        name: data.full_name || userEmail?.split('@')[0] || '',
        email: userEmail,
        phone: data.phone || ''
      });
      
      console.log("UserContactData set to:", {
        name: data.full_name || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        phone: data.phone || ''
      });
    }
  };

  // Check delivery availability
  const handleCheckDelivery = async () => {
    if (!selectedPincode || selectedPincode.length < 6) {
      setDeliveryError('Please enter a valid 6-digit pincode');
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit pincode",
        variant: "destructive"
      });
      return;
    }

    setCheckingDelivery(true);
    setDeliveryError('');
    
    try {
      const pincodeNum = parseInt(selectedPincode);
      const rate = await getShippingRate(pincodeNum);

      if (!rate.serviceable) {
        setDeliveryError('Delivery not available for this pincode');
        setDeliveryChecked(false);
        toast({
          title: "Not Serviceable",
          description: "We don't deliver to this pincode yet.",
          variant: "destructive"
        });
      } else {
        setSelectedState(rate.state || '');
        setShippingCharge(rate.charge || 0);
        setEstimatedDays(rate.estimatedDays || 0);
        setIsCODAvailable(rate.codAvailable || false);
        setDeliveryChecked(true);
        setDeliveryError('');
        toast({
          title: "Delivery Available!",
          description: `Shipping charge: ₹${rate.charge} | Estimated delivery: ${rate.estimatedDays} days`,
        });
      }
    } catch (error) {
      console.error('Error checking delivery:', error);
      setDeliveryError('Error checking delivery availability');
      toast({
        title: "Error",
        description: "Failed to check delivery availability",
        variant: "destructive"
      });
    } finally {
      setCheckingDelivery(false);
    }
  };



  const handlePayment = async () => {
    // Check if delivery has been verified
    if (!deliveryChecked) {
      toast({
        title: "Delivery Not Checked",
        description: "Please check delivery availability for your pincode",
        variant: "destructive"
      });
      return;
    }

    // Check if address is saved - if not, prompt user
    if (!addressSaved) {
      toast({
        title: "Address Not Saved",
        description: "Please save your delivery address by clicking 'Save Address & Continue' button first",
        variant: "destructive"
      });
      // Scroll to address form
      const addressForm = document.querySelector('[data-address-form]');
      if (addressForm) {
        addressForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Check if COD is selected but not available
    if (paymentMethod === 'cod' && !isCODAvailable) {
      toast({
        title: "COD Not Available",
        description: "Cash on Delivery is not available for this area. Please choose online payment.",
        variant: "destructive"
      });
      return;
    }

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

      // Validate user contact information
      const contactErrors: any = {};
      
      console.log("=== Checkout: Validating contact info ===");
      console.log("UserContactData:", userContactData);
      
      if (!userContactData.name || userContactData.name.trim().length < 2) {
        contactErrors.name = "Name must be at least 2 characters";
        console.log("Name validation failed");
      }
      
      if (!userContactData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userContactData.email)) {
        contactErrors.email = "Valid email is required";
        console.log("Email validation failed");
      }
      
      // Clean phone number (remove all non-digits) before validation
      const cleanPhone = userContactData.phone?.replace(/\D/g, '') || '';
      console.log("Phone:", userContactData.phone);
      console.log("Clean phone:", cleanPhone);
      console.log("Phone regex test:", /^[6-9]\d{9}$/.test(cleanPhone));
      
      if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        contactErrors.phone = "Valid 10-digit phone number is required (starting with 6-9)";
        console.log("Phone validation failed");
      }

      console.log("Contact errors:", contactErrors);

      if (Object.keys(contactErrors).length > 0) {
        setUserContactErrors(contactErrors);
        toast({
          title: "Contact Information Required",
          description: "Please fill in all contact information correctly",
          variant: "destructive"
        });
        // Scroll to contact info section
        const contactInfo = document.querySelector('[data-contact-info]');
        if (contactInfo) {
          contactInfo.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Update profile with contact data
      await supabase
        .from("profiles" as any)
        .update({ 
          full_name: userContactData.name,
          phone: userContactData.phone
        })
        .eq("id", user.id);

      setUserContactErrors({});
    }

    setProcessing(true);

    // Calculate shipping discount from promo code (CRITICAL FIX)
    const shippingDiscount = getShippingDiscount();

    // Calculate final price based on payment method
    const finalPricing = calculateOrderPrice(
      discountedTotal || totalPrice,
      Math.max(0, shippingCharge - shippingDiscount), // Apply shipping discount
      paymentMethod === 'online' ? 'prepaid' : 'cod',
      selectedState
    );

    // Get authenticated user for payment (optional for guest checkout)
    let authUser = user;
    if (!authUser && isGuestCheckout) {
      // For guest checkout, check if there's a current session
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      authUser = currentUser;
      // Guest checkout is allowed - authUser can be null
    }

    // Prepare order items for atomic creation
    const orderItems = items.map(item => ({
      product_id: item.id,
      product_name: item.name,
      product_price: item.price,
      quantity: item.quantity,
    }));

    // Create order params - CRITICAL: Send items total WITHOUT promo discount
    // Database validates items total, promo discount is applied AFTER order creation
    const orderParams = {
      p_user_id: authUser?.id || null, // Allow null for guest checkout
      p_total_price: totalPrice, // Send ORIGINAL items total (without promo discount)
      p_address: isGuestCheckout ? guestData.address : profile.address,
      p_payment_id: null, // Will be updated after payment
      p_items: orderItems,
    };

    // Store guest info in order for guest checkouts
    let guestOrderData = null;
    if (isGuestCheckout) {
      guestOrderData = {
        customer_name: guestData.name,
        customer_email: guestData.email,
        customer_phone: guestData.phone
      };
    }

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

    // Add guest information to the order if it's a guest checkout
    if (isGuestCheckout && guestOrderData) {
      const { error: guestInfoError } = await supabase
        .from("orders")
        .update({
          customer_name: guestOrderData.customer_name,
          customer_email: guestOrderData.customer_email,
          customer_phone: guestOrderData.customer_phone
        })
        .eq("id", orderId);

      if (guestInfoError) {
        console.warn("Error adding guest info to order:", guestInfoError);
        // Don't fail the order, just log the warning
      }
    } else if (!isGuestCheckout && authUser && profile) {
      // For authenticated users, save contact info to order for admin visibility
      console.log('[Checkout] Saving authenticated user info to order:', {
        orderId,
        customer_name: userContactData.name,
        customer_email: userContactData.email,
        customer_phone: userContactData.phone
      });
      
      const { error: userInfoError } = await supabase
        .from("orders")
        .update({
          customer_name: userContactData.name,
          customer_email: userContactData.email,
          customer_phone: userContactData.phone
        })
        .eq("id", orderId);

      if (userInfoError) {
        console.error('[Checkout] Error adding user info to order:', userInfoError);
      } else {
        console.log('[Checkout] User info saved successfully to order');
      }
    }

    // Track promo code usage if a promo code was applied (only for authenticated users)
    if (promoCode && !isGuestCheckout && authUser) {
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
    const merchantTransactionId = paymentMethod === 'cod' 
      ? `COD-${Date.now()}${Math.random().toString(36).substr(2, 9)}`
      : `MT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

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
      
      // Prevent cart redirect during success flow
      setPreventCartRedirect(true);
      
      // Clear cart and show success
      clearCart();
      setShowSuccess(true);
      setProcessing(false);
      
      // Store order data for navigation
      if (isGuestCheckout) {
        sessionStorage.setItem('guestOrderId', orderId);
        sessionStorage.setItem('guestOrderEmail', guestData.email);
        sessionStorage.setItem('guestOrderName', guestData.name);
        sessionStorage.setItem('guestOrderPhone', guestData.phone);
      }
      
      setSuccessOrderData({
        orderId,
        email: isGuestCheckout ? guestData.email : user?.email || '',
        isGuest: isGuestCheckout
      });
      
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

    // Generate merchant user ID - use actual user ID if authenticated, or generate a guest ID
    const merchantUserId = authUser?.id || `GUEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initiate PhonePe payment
    const paymentOptions = {
      amount: Math.round(finalPricing.total), // Send final total in rupees - Edge Function converts to paisa
      merchantTransactionId,
      merchantUserId,
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
      merchantUserId: { value: merchantUserId, isGuest: isGuestCheckout, type: typeof merchantUserId },
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

  if (items.length === 0 && !preventCartRedirect) {
    navigate("/products");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-saira font-black text-[#3b2a20] mb-2">CHECKOUT</h1>
        <p className="text-gray-600 text-lg">Complete your order</p>
      </div>
      <h1 className="text-3xl font-bold mb-8 sr-only">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {isGuestCheckout ? (
            <>
              <Card className="p-6 mb-6 border-l-4 border-l-blue-500 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">1</span>
                  <h2 className="text-xl font-bold">Your Information</h2>
                </div>
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

              <Card className="p-6 mb-6 border-l-4 border-l-green-500 shadow-md" data-address-form>
                <div className="bg-green-50 -m-6 mb-4 p-4 border-b-2 border-green-200">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">2</span>
                    <h2 className="text-xl font-bold text-green-900">Delivery Address & Availability</h2>
                  </div>
                  <p className="text-sm text-green-700 mt-2 ml-10">Enter your pincode and click "Check Delivery" button below</p>
                </div>
                <AddressForm
                  onAddressSubmit={(address, phone) => {
                    setGuestData({ ...guestData, address, phone: phone || guestData.phone });
                    setAddressSaved(true);
                  }}
                  initialAddress={guestData.address}
                  initialPhone={guestData.phone}
                  onDeliveryCheck={(data) => {
                    setSelectedPincode(data.pincode);
                    setSelectedState(data.state);
                    setShippingCharge(data.shippingCharge);
                    setIsCODAvailable(data.isCODAvailable);
                    setEstimatedDays(data.estimatedDays);
                    setDeliveryChecked(true);
                  }}
                />
              </Card>
            </>
          ) : (
            <>
              <Card className="p-6 mb-6 border-l-4 border-l-blue-500 shadow-md" data-contact-info>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">1</span>
                  <h2 className="text-xl font-bold">Your Contact Information</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user-name">Full Name *</Label>
                    <Input
                      id="user-name"
                      value={userContactData.name}
                      onChange={(e) => setUserContactData({ ...userContactData, name: e.target.value })}
                      className={userContactErrors.name ? "border-red-500" : ""}
                      placeholder="Enter your full name"
                    />
                    {userContactErrors.name && <p className="text-red-500 text-sm mt-1">{userContactErrors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="user-phone">Phone Number *</Label>
                    <Input
                      id="user-phone"
                      value={userContactData.phone}
                      onChange={(e) => {
                        const newPhone = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setUserContactData({ ...userContactData, phone: newPhone });
                        // Also update profile phone so AddressForm receives it
                        setProfile({ ...profile, phone: newPhone });
                      }}
                      className={userContactErrors.phone ? "border-red-500" : ""}
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                    />
                    {userContactErrors.phone && <p className="text-red-500 text-sm mt-1">{userContactErrors.phone}</p>}
                    <p className="text-xs text-gray-500 mt-1">Required for order delivery updates. This will auto-fill in the address section below.</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 mb-6 border-l-4 border-l-green-500 shadow-md" data-address-form>
                <div className="bg-green-50 -m-6 mb-4 p-4 border-b-2 border-green-200">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">2</span>
                    <h2 className="text-xl font-bold text-green-900">Delivery Address & Availability</h2>
                  </div>
                  <p className="text-sm text-green-700 mt-2 ml-10">Enter your pincode and click "Check Delivery" button below</p>
                </div>
                <AddressForm
                  onAddressSubmit={(address, phone) => {
                    // Use phone from contact info if available, otherwise use the one from address form
                    const finalPhone = userContactData.phone || phone;
                    // Update profile address and phone in database
                    supabase
                      .from("profiles" as any)
                      .update({ address, phone: finalPhone })
                      .eq("id", user.id);
                    setProfile({ ...profile, address, phone: finalPhone });
                    setAddressSaved(true);
                  }}
                  initialAddress={profile?.address}
                  initialPhone={userContactData.phone || profile?.phone}
                  onDeliveryCheck={(data) => {
                    setSelectedPincode(data.pincode);
                    setSelectedState(data.state);
                    setShippingCharge(data.shippingCharge);
                    setIsCODAvailable(data.isCODAvailable);
                    setEstimatedDays(data.estimatedDays);
                    setDeliveryChecked(true);
                  }}
                />
              </Card>

              {/* Delivery Checker - REMOVED, now integrated in AddressForm */}
              <Card className="p-6 mb-4 bg-blue-50 border-blue-200 hidden">
                <h3 className="font-semibold mb-3 text-blue-900">Check Delivery Availability</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <div className="flex gap-2">
                      <Input
                        id="pincode"
                        placeholder="Enter 6-digit pincode"
                        value={selectedPincode}
                        onChange={(e) => {
                          setSelectedPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
                          setDeliveryChecked(false);
                        }}
                        maxLength={6}
                      />
                      <Button
                        onClick={handleCheckDelivery}
                        disabled={checkingDelivery || !selectedPincode}
                        variant="outline"
                        className="whitespace-nowrap"
                      >
                        {checkingDelivery ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Truck className="w-4 h-4 mr-2" />
                        )}
                        Check
                      </Button>
                    </div>
                  </div>

                  {deliveryChecked && !deliveryError && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-semibold">Delivery Available!</span>
                      </div>
                      <p className="text-xs">
                        {selectedState} • Shipping: ₹{shippingCharge} • Delivery in {estimatedDays} days
                      </p>
                      {!isCODAvailable && (
                        <p className="text-xs text-orange-600 mt-1">⚠️ COD not available for this area</p>
                      )}
                    </div>
                  )}

                  {deliveryError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {deliveryError}
                    </div>
                  )}
                </div>
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

          <Card className="p-6 sticky top-4 border-l-4 border-l-primary shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">{isGuestCheckout ? '3' : '2'}</span>
              <h2 className="text-xl font-bold">Order Summary</h2>
            </div>
            <h3 className="font-semibold mb-4 text-gray-700">Price Details</h3>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>MRP (Inclusive of all taxes)</span>
                <span className="font-medium">₹{totalPrice}</span>
              </div>
              
              {promoCode && promoCode.promo_type === 'percentage' && discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({promoCode.discount_percentage}%)</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              {promoCode && promoCode.promo_type === 'shipping_discount' && getShippingDiscount() > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">
                    🎉 Shipping Discount ({promoCode.shipping_discount_percentage}%)
                  </span>
                  <span className="text-blue-600 font-medium">({promoCode.code})</span>
                </div>
              )}

              {deliveryChecked && (
                <>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span>Subtotal</span>
                    <span>₹{(discountedTotal || totalPrice).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      Shipping
                    </span>
                    <span>
                      {(() => {
                        const pricing = calculateOrderPrice(discountedTotal || totalPrice, shippingCharge, paymentMethod === 'online' ? 'prepaid' : 'cod', selectedState);
                        const shippingDiscount = getShippingDiscount();
                        const finalShipping = Math.max(0, pricing.shippingCharge - shippingDiscount);
                        
                        if (pricing.isFreeDelivery) {
                          return (
                            <>
                              <span className="text-green-600 font-medium">₹0</span>
                              <span className="text-xs text-gray-400 line-through ml-1">₹{shippingCharge}</span>
                            </>
                          );
                        }
                        
                        if (shippingDiscount > 0) {
                          return (
                            <>
                              <span className="text-green-600 font-medium">₹{finalShipping.toFixed(2)}</span>
                              <span className="text-xs text-gray-400 line-through ml-1">₹{pricing.shippingCharge}</span>
                            </>
                          );
                        }
                        
                        return `₹${pricing.shippingCharge}`;
                      })()}
                    </span>
                  </div>

                  {paymentMethod === 'cod' && isCODAvailable && (
                    <div className="flex justify-between text-sm">
                      <span>COD Handling Charges</span>
                      <span>₹35</span>
                    </div>
                  )}

                  {paymentMethod === 'online' && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Prepaid Discount (5%)</span>
                      <span>-₹{((discountedTotal || totalPrice) * 0.05).toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>
                  {deliveryChecked 
                    ? (() => {
                        const pricing = calculateOrderPrice(discountedTotal || totalPrice, shippingCharge, paymentMethod === 'online' ? 'prepaid' : 'cod', selectedState);
                        const shippingDiscount = getShippingDiscount();
                        let finalTotal = pricing.total;
                        
                        // Apply shipping discount from promo
                        if (shippingDiscount > 0) {
                          finalTotal = finalTotal - shippingDiscount;
                        }
                        
                        return `₹${finalTotal.toFixed(2)}`;
                      })()
                    : `₹${(discountedTotal || totalPrice).toFixed(2)}`
                  }
                </span>
              </div>
            </div>

            {!deliveryChecked && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Please check delivery availability for your pincode to see shipping charges</span>
              </div>
            )}

            <div className="mb-4" data-payment-section>
              <h3 className="font-semibold mb-2">Payment Method</h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  disabled={!deliveryChecked || !isCODAvailable}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 font-medium ${
                    !deliveryChecked || !isCODAvailable
                      ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                      : paymentMethod === 'cod'
                      ? 'bg-[#5e4338] text-white border-[#5e4338]'
                      : 'bg-white text-[#5e4338] border-[#5e4338] hover:bg-[#5e4338]/5'
                  }`}
                >
                  Cash on Delivery (COD)
                  {!deliveryChecked || !isCODAvailable ? (
                    <div className="text-xs mt-1 text-gray-500">
                      {!deliveryChecked ? 'Check delivery availability first' : 'Not available for this area'}
                    </div>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  disabled={!deliveryChecked}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 font-medium ${
                    !deliveryChecked
                      ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                      : paymentMethod === 'online'
                      ? 'bg-[#5e4338] text-white border-[#5e4338]'
                      : 'bg-white text-[#5e4338] border-[#5e4338] hover:bg-[#5e4338]/5'
                  }`}
                >
                  Online Payment
                  {paymentMethod === 'online' && (
                    <div className="text-xs mt-1 text-white/90">Get 5% discount</div>
                  )}
                  {!deliveryChecked && (
                    <div className="text-xs mt-1 text-gray-500">Check delivery availability first</div>
                  )}
                </button>
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
          <div className="text-sm text-muted-foreground mt-2">
            Redirecting to your order confirmation...
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;
