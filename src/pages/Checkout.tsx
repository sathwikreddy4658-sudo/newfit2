import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { getCurrentUser, auth } from "@/integrations/firebase/auth";
import { createOrder, getPromoCode, getAllProducts, getVisiblePromoCodes, deductStock, verifyStockForItems } from "@/integrations/firebase/db";
import { db } from "@/integrations/firebase/client";
import { doc, getDoc } from "firebase/firestore";
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
import SavedAddresses from "@/components/SavedAddresses";
import { getThumbnailUrl } from "@/utils/imageOptimization";
import { Loader2, CheckCircle2, AlertCircle, Truck, Tag, X, Plus, Minus } from "lucide-react";
import { calculateOrderPrice, validatePaymentMethod } from "@/lib/pricingEngine";
import { getShippingRate } from "@/lib/pincodeService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Checkout = () => {
  const { items, totalPrice, clearCart, discountedTotal, discountAmount, promoCode, totalWeight, applyPromoCode, removePromoCode, updateQuantity } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({});
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successOrderData, setSuccessOrderData] = useState<{orderId: string, email: string, isGuest: boolean, guestName?: string, guestPhone?: string} | null>(null);
  const [preventCartRedirect, setPreventCartRedirect] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  
  // Saved address state
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<string | null>(null);
  const [currentSavedAddress, setCurrentSavedAddress] = useState<any>(null);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  
  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [visiblePromoCodes, setVisiblePromoCodes] = useState<any[]>([]);
  const [showOffers, setShowOffers] = useState(false);

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
  useEffect(() => {
    getVisiblePromoCodes().then(setVisiblePromoCodes).catch(() => {});
  }, []);

  const getShippingDiscount = () => {    if (!promoCode || !promoCode.free_shipping) return 0;
    if (!deliveryChecked || !shippingCharge) return 0;

    // Free shipping promo gives 100% discount on shipping
    return shippingCharge;
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
      // Check Firebase auth state
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        if (!firebaseUser) {
          navigate("/auth");
          return;
        }
        setUser(firebaseUser);
        // Fetch user profile from Firestore
        try {
          const userDoc = await getCurrentUser();
          if (userDoc) {
            fetchProfile(firebaseUser.uid, firebaseUser);
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      });

      return () => unsubscribe();
    }
  }, [isGuestCheckout, navigate]);

  // Debug: Track profile changes
  useEffect(() => {
    console.log('[Checkout] Profile state changed:', {
      profile,
      hasAddress: !!profile?.address,
      addressLength: profile?.address?.length || 0,
      addressSaved
    });
  }, [profile, addressSaved]);

  // Track when saved address is selected and verify address is in profile
  useEffect(() => {
    if (selectedSavedAddress && user && profile?.address) {
      console.log('[Checkout] Saved address verified in profile state:', {
        selectedAddressId: selectedSavedAddress,
        profileAddress: profile.address,
        addressLength: profile.address.length,
        addressSaved,
        profileFull_name: profile.full_name,
        profilePhone: profile.phone
      });
    } else if (selectedSavedAddress && user && !profile?.address) {
      console.warn('[Checkout] Saved address selected but profile.address is EMPTY:', {
        selectedAddressId: selectedSavedAddress,
        profileAddress: profile?.address,
        addressSaved,
        profile
      });
    }
  }, [selectedSavedAddress, profile?.address, addressSaved, user]);

  // Update contact form when profile loads or user changes
  useEffect(() => {
    if (!isGuestCheckout && (profile || user)) {
      console.log('[Checkout] Updating userContactData from profile:', { profile, user: !!user });
      setUserContactData({
        name: profile?.full_name || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        phone: profile?.phone || ''
      });
    }
  }, [profile, user, isGuestCheckout]);

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
    try {
      // Fetch user profile from Firebase 'users' collection
      const { doc: docRef, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/integrations/firebase/client');
      
      const userDocRef = docRef(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        // DON'T set address here - it will be set by SavedAddresses component
        // to avoid race condition where fetchProfile overwrites saved address selection
        const profileData = {
          full_name: data.full_name || '',
          phone: data.phone || ''
        };
        console.log('[Checkout] Setting profile from Firestore (without address):', profileData);
        setProfile(profileData);
        
        // Pre-fill contact form with existing data if available
        setUserContactData({
          name: data.full_name || sessionUser?.email?.split('@')[0] || '',
          email: sessionUser?.email || '',
          phone: data.phone || ''
        });
      } else {
        console.log('User profile not found, using session data');
        setProfile({});
        setUserContactData({
          name: sessionUser?.email?.split('@')[0] || '',
          email: sessionUser?.email || '',
          phone: ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile({});
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

  // Handle promo code application
  const handleApplyPromo = async () => {
    if (!promoInput.trim()) {
      toast({
        title: "Promo Code Required",
        description: "Please enter a promo code",
        variant: "destructive"
      });
      return;
    }

    setApplyingPromo(true);
    try {
      await applyPromoCode(promoInput);
      setPromoInput('');
    } catch (error) {
      console.error('Error applying promo code:', error);
    } finally {
      setApplyingPromo(false);
    }
  };

  // Handle saved address selection
  const handleSavedAddressSelect = async (address: any) => {
    console.log('[Checkout] Saved address selected:', address);
    
    // Validate that the saved address has all required fields
    if (!address.street_address || !address.city || !address.state || !address.pincode) {
      console.error('[Checkout] Saved address missing required fields:', {
        street_address: !!address.street_address,
        city: !!address.city,
        state: !!address.state,
        pincode: !!address.pincode
      });
      toast({
        title: "Incomplete Address",
        description: "This saved address is missing required fields. Please update or use a different address.",
        variant: "destructive"
      });
      return;
    }
    
    // Store the complete address object for immediate use
    setCurrentSavedAddress(address);
    setSelectedSavedAddress(address.id);
    setSelectedPincode(address.pincode);
    setSelectedState(address.state);
    
    // Format address with all available details
    const addressParts = [
      address.flat_no,
      address.building_name,
      address.street_address,
      address.landmark && `Near ${address.landmark}`,
      address.city,
      address.state,
      address.pincode
    ].filter(Boolean);
    
    const formattedAddress = addressParts.join(', ');
    
    if (!formattedAddress || formattedAddress.trim().length === 0) {
      console.error('[Checkout] Failed to format address - all parts were empty!', { addressParts });
      toast({
        title: "Invalid Address",
        description: "Could not format the selected address. Please check the saved address details.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('[Checkout] Formatted saved address:', {
      formattedAddress,
      addressLength: formattedAddress.length
    });
    
    // Update profile with formatted address
    setProfile(prev => ({
      ...(prev || {}),
      address: formattedAddress,
      phone: address.phone || prev?.phone || ''
    }));
    setAddressSaved(true);
    
    // Auto-trigger delivery check
    setCheckingDelivery(true);
    setDeliveryError('');
    
    try {
      const pincodeNum = parseInt(address.pincode);
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
        setSelectedState(rate.state || address.state);
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

    // Check if COD is selected but not available (COD DISABLED - skip this check)
    // if (paymentMethod === 'cod' && !isCODAvailable) {
    //   toast({
    //     title: "COD Not Available",
    //     description: "Cash on Delivery is not available for this area. Please choose online payment.",
    //     variant: "destructive"
    //   });
    //   return;
    // }

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
      // For authenticated users, validate contact information from form
      const contactErrors: any = {};
      
      if (!userContactData.name || userContactData.name.trim().length < 2) {
        contactErrors.name = "Name must be at least 2 characters";
      }
      
      if (!userContactData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userContactData.email)) {
        contactErrors.email = "Valid email is required";
      }
      
      const cleanPhone = userContactData.phone?.replace(/\D/g, '') || '';
      if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        contactErrors.phone = "Valid 10-digit phone number is required (starting with 6-9)";
      }

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

      setUserContactErrors({});
    }

    setProcessing(true);

    console.log('[Checkout] Starting order with pricing:', {
      totalPrice,
      discountedTotal,
      discountAmount,
      promoCode: promoCode?.code,
      freeShipping: promoCode?.free_shipping,
      discountPercentage: promoCode?.discount_percentage,
      usingPrice: discountedTotal !== undefined ? discountedTotal : totalPrice
    });

    // Calculate shipping discount from promo code (CRITICAL FIX)
    const shippingDiscount = getShippingDiscount();

    // Calculate final price based on payment method - use discountedTotal if it exists (even if 0)
    const finalPricing = calculateOrderPrice(
      discountedTotal !== undefined ? discountedTotal : totalPrice,
      Math.max(0, shippingCharge - shippingDiscount), // Apply shipping discount
      paymentMethod === 'online' ? 'prepaid' : 'cod',
      selectedState
    );

    console.log('[Checkout] Final pricing calculation:', {
      paymentMethod,
      paymentMethodForCalculation: paymentMethod === 'online' ? 'prepaid' : 'cod',
      finalPricing,
      codCharge: finalPricing.codCharge,
      canUseCOD: finalPricing.canUseCOD
    });

    // Get authenticated user for payment (optional for guest checkout)
    let authUser = user;
    if (!authUser && isGuestCheckout) {
      // For guest checkout, authUser can be null - Firebase allows this
      authUser = null;
    }

    // SECURITY: Validate prices from server to prevent manipulation
    // Re-fetch current prices from Firestore instead of trusting localStorage cart
    const validatedItems = await Promise.all(
      items.map(async (item) => {
        try {
          const productDoc = await getDoc(doc(db, 'products', item.id));
          if (!productDoc.exists()) {
            throw new Error(`Product ${item.name} not found`);
          }
          const productData = productDoc.data();
          
          // Determine which variant price to use based on protein (15g or 20g)
          let serverPrice = 0;
          if (item.protein === '15g' && productData.price_15g) {
            serverPrice = productData.price_15g;
          } else if (item.protein === '20g' && productData.price_20g) {
            serverPrice = productData.price_20g;
          } else if (productData.price) {
            // Fallback to main price if variant not found
            serverPrice = productData.price;
          }
          
          // If still no valid price, use the cart item price as fallback
          // This prevents orders from being created with ₹0 prices when product data is incomplete
          if (!serverPrice || serverPrice <= 0) {
            console.warn(`[Checkout] Product ${item.name} (${item.protein}) has invalid price (${serverPrice}), using cart price: ${item.price}`);
            serverPrice = item.price;
          }
          
          console.log(`[Checkout] Price validation: ${item.name} (${item.protein}) - Server: ₹${serverPrice}`);
          
          // Use server price, not cart price (unless server price is invalid)
          return {
            productId: item.id,
            name: item.name,
            price: serverPrice,  // ← Server-validated price (with correct variant)
            quantity: item.quantity,
            image: item.image
          };
        } catch (error) {
          console.error('[Checkout] Error fetching product price:', error);
          throw new Error(`Failed to validate price for ${item.name}`);
        }
      })
    );

    // Prepare order items with validated prices
    const orderItems = validatedItems;

    // Calculate items total from the orderItems array with server prices
    const itemsTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    console.log('[Checkout] Price calculation:', {
      itemsTotal,
      cartTotalPrice: totalPrice,
      discountAmount,
      discountedTotal,
      orderItems,
      itemBreakdown: orderItems.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }))
    });

    // Build customer details based on actual authentication state
    // For logged-in users, use userContactData; for guests, use guestData
    const customerName = user ? userContactData.name?.trim() : guestData.name?.trim();
    const customerEmail = user ? userContactData.email?.trim() : guestData.email?.trim();
    const customerPhone = user ? userContactData.phone?.trim() : guestData.phone?.trim();

    // Pricing breakdown
    const itemsSubtotal = discountedTotal !== undefined ? discountedTotal : totalPrice; // after product discount
    const appliedDiscount = discountAmount || 0;
    const netShipping = Math.max(0, shippingCharge - shippingDiscount);
    const codCharge = finalPricing.codCharge || 0;

    // Verify stock before creating order - check each product individually
    try {
      console.log('[Checkout] Verifying stock for items:', orderItems.map(i => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity
      })));
      
      const stockCheck = await verifyStockForItems(orderItems);
      
      console.log('[Checkout] Stock verification result:', stockCheck);
      
      if (!stockCheck.available && stockCheck.unavailableItem) {
        console.error('[Checkout] Stock check failed:', stockCheck.unavailableItem);
        toast({
          title: "Out of stock",
          description: `${stockCheck.unavailableItem.name}: ${stockCheck.unavailableItem.message}`,
          variant: "destructive"
        });
        setProcessing(false);
        return;
      }
    } catch (error) {
      console.error('[Checkout] Error verifying stock:', error);
      toast({
        title: "Error",
        description: "Failed to verify product availability.",
        variant: "destructive"
      });
      setProcessing(false);
      return;
    }

    // Get the address based on actual user authentication state (not location.state)
    // For logged-in users with saved address, use currentSavedAddress directly (avoid async state race condition)
    // Otherwise use profile.address or guestData.address
    let orderAddress: string = '';
    
    if (user && useSavedAddress && currentSavedAddress) {
      // Using a saved address - build it from the saved address object directly
      const addressParts = [
        currentSavedAddress.flat_no,
        currentSavedAddress.building_name,
        currentSavedAddress.street_address,
        currentSavedAddress.landmark && `Near ${currentSavedAddress.landmark}`,
        currentSavedAddress.city,
        currentSavedAddress.state,
        currentSavedAddress.pincode
      ].filter(Boolean);
      orderAddress = addressParts.join(', ');
    } else {
      // Using manually entered address or guest address
      orderAddress = user ? (profile?.address || '') : (guestData.address || '');
    }
    
    console.log('[Checkout] Address resolution:', {
      hasUser: !!user,
      usingSavedAddress: user && useSavedAddress && !!currentSavedAddress,
      profileAddress: profile?.address,
      guestDataAddress: guestData.address,
      currentSavedAddress: currentSavedAddress ? 'present' : 'null',
      resolvedAddress: orderAddress,
      addressLength: orderAddress.length,
      addressSaved
    });
    
    // CRITICAL: Validate address is not empty before creating order
    if (!orderAddress || orderAddress.trim().length === 0) {
      console.error('[Checkout] Address validation failed - address is empty:', {
        hasUser: !!user,
        isGuestCheckout,
        usingSavedAddress: user && useSavedAddress && !!currentSavedAddress,
        profileAddress: profile?.address,
        guestDataAddress: guestData.address,
        currentSavedAddressId: currentSavedAddress?.id,
        addressSaved,
        useSavedAddress,
        selectedSavedAddressId: selectedSavedAddress
      });
      toast({
        title: "Address Required",
        description: "Please save your complete delivery address before placing the order.",
        variant: "destructive"
      });
      setProcessing(false);
      return;
    }

    // Create order using Firebase
    const orderData: any = {
      order_number: `ORD-${Date.now()}`,
      user_id: authUser?.uid || null,
      customer_name: customerName || null,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      address: orderAddress,
      items: orderItems,
      total_amount: itemsSubtotal + netShipping + codCharge - appliedDiscount,
      status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
      paid: paymentMethod === 'online' ? false : true,
      payment_method: paymentMethod,
      discount_amount: appliedDiscount,
      shipping_charge: netShipping,
      cod_charge: codCharge,
      promo_code: promoCode?.code || null
    };

    console.log('[Checkout] Creating order with Firebase:', {
      ...orderData,
      isGuestCheckout,
      addressLength: orderAddress.length,
      addressValue: orderAddress,
      usingSavedAddress: user && useSavedAddress && !!currentSavedAddress,
      currentSavedAddressId: currentSavedAddress?.id
    });

    let orderId: string;
    try {
      const createdOrder = await createOrder(orderData);
      orderId = createdOrder.id;
      console.log('[Checkout] Order created successfully with ID:', orderId);
    } catch (error) {
      console.error('[Checkout] Order creation failed:', error);
      toast({
        title: "Order creation failed",
        description: sanitizeError(error || new Error("Failed to create order")),
        variant: "destructive"
      });
      setProcessing(false);
      return;
    }

    // Promo code tracking is handled within the order creation above
    // No need for separate tracking with Firebase

    // Generate unique transaction ID
    const merchantTransactionId = `MT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate COD transaction ID (for COD orders)
    const codTransactionId = `COD-${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // Handle COD payment
    if (paymentMethod === 'cod') {
      console.log('[Checkout] Confirming COD order:', { orderId, codTransactionId });
      
      // Deduct stock immediately for COD orders (no webhook for COD)
      try {
        await deductStock(orderItems.map(i => ({ productId: i.productId, quantity: i.quantity })));
        console.log('[Checkout] Stock deducted for COD order');
      } catch (err) {
        console.error('[Checkout] Stock deduction error (non-fatal):', err);
      }
      
      console.log('[Checkout] COD order confirmed successfully');
      
      // Prevent cart redirect during success flow
      setPreventCartRedirect(true);
      
      // Clear cart and show success
      clearCart();
      setShowSuccess(true);
      setProcessing(false);
      
      // Store order data for navigation via state (NOT sessionStorage)
      setSuccessOrderData({
        orderId,
        email: isGuestCheckout ? guestData.email : user?.email || '',
        isGuest: isGuestCheckout,
        guestName: isGuestCheckout ? guestData.name : undefined,
        guestPhone: isGuestCheckout ? guestData.phone : undefined
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
    const merchantUserId = authUser?.uid || `GUEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get billing address with proper fallback (PhonePe requires 10-500 chars)
    let billingAddress = '';
    if (isGuestCheckout) {
      billingAddress = guestData.address || '';
    } else {
      // For authenticated users, try multiple sources
      billingAddress = profile?.address || '';
    }

    // Ensure address meets PhonePe minimum length (10 chars) - CRITICAL FIX
    if (!billingAddress || billingAddress.trim().length < 10) {
      // Build fallback address with guaranteed minimum 10 chars
      if (phoneNumber && phoneNumber.length >= 10) {
        billingAddress = `${phoneNumber}, India`;
      } else {
        billingAddress = 'Customer Address, India'; // Safe fallback (24 chars)
      }
    }

    console.log('[Checkout] Billing address for payment:', {
      isGuest: isGuestCheckout,
      addressLength: billingAddress.length,
      addressPreview: billingAddress.substring(0, 50),
      phoneNumber: phoneNumber || 'none'
    });

    // Initiate PhonePe payment
    // callbackUrl must always be a public HTTPS URL — never a relative/localhost URL
    const phonePeCallbackUrl = 'https://us-central1-newfit-35320.cloudfunctions.net/api/phonepe-webhook';
    // redirectUrl must also be a public HTTPS URL (PhonePe rejects localhost)
    const baseOrigin = window.location.hostname === 'localhost'
      ? 'https://freelit.in'
      : window.location.origin;
    const paymentOptions = {
      amount: Math.round(finalPricing.total), // Send final total in rupees - Edge Function converts to paisa
      merchantTransactionId,
      merchantUserId,
      redirectUrl: `${baseOrigin}/payment/callback?transactionId=${merchantTransactionId}&order=${orderId}`,
      callbackUrl: phonePeCallbackUrl,
      mobileNumber: phoneNumber,
      billingAddress: billingAddress, // Required by PhonePe (10-500 chars)
      deviceContext: {
        deviceOS: navigator.platform.includes('Mac') ? 'MAC' : 'WINDOWS'
      }
    };

    console.log('[Checkout] About to initiate payment with options:', {
      amount: { value: paymentOptions.amount, rupees: `₹${paymentOptions.amount}`, type: typeof paymentOptions.amount },
      merchantTransactionId: { value: paymentOptions.merchantTransactionId, type: typeof paymentOptions.merchantTransactionId },
      callbackUrl: { value: paymentOptions.callbackUrl, type: typeof paymentOptions.callbackUrl },
      merchantUserId: { value: merchantUserId, isGuest: isGuestCheckout, type: typeof merchantUserId },
      mobileNumber: paymentOptions.mobileNumber,
      billingAddress: { length: paymentOptions.billingAddress.length, preview: paymentOptions.billingAddress.substring(0, 30) }
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
    <div className="container mx-auto px-4 py-8 pt-16 bg-gray-50 min-h-screen">
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
                    console.log('[Checkout] Guest address submitted:', { address, phone, addressLength: address?.length });
                    setGuestData({ ...guestData, address, phone: phone || guestData.phone });
                    setAddressSaved(true);
                    console.log('[Checkout] Guest data updated, addressSaved set to true');
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
                    <Label htmlFor="user-email">Email *</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={userContactData.email}
                      onChange={(e) => setUserContactData({ ...userContactData, email: e.target.value })}
                      className={userContactErrors.email ? "border-red-500" : ""}
                      placeholder="Enter your email"
                    />
                    {userContactErrors.email && <p className="text-red-500 text-sm mt-1">{userContactErrors.email}</p>}
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
                  <p className="text-sm text-green-700 mt-2 ml-10">
                    {useSavedAddress ? "Select a saved address or enter a new one below" : "Enter your pincode and click 'Check Delivery' button below"}
                  </p>
                </div>
                
                {/* Saved Addresses for Authenticated Users */}
                {user && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-semibold">Delivery Address</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUseSavedAddress(!useSavedAddress)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {useSavedAddress ? "Enter new address" : "Use saved address"}
                      </Button>
                    </div>
                    
                    {useSavedAddress ? (
                      <SavedAddresses
                        userId={user.uid}
                        onAddressSelect={handleSavedAddressSelect}
                        selectedAddressId={selectedSavedAddress}
                      />
                    ) : null}
                  </div>
                )}
                
                {/* Address Form - Show for guests or if user chooses manual entry */}
                {(!user || !useSavedAddress) && (
                  <AddressForm
                    onAddressSubmit={(address, phone) => {
                      console.log('[Checkout] Address submitted:', { address, phone, addressLength: address?.length, isUser: !!user });
                      if (user) {
                        // Use phone from contact info if available, otherwise use the one from address form
                        const finalPhone = userContactData.phone || phone;
                        // Just update local state - all info goes to orders table
                        setProfile({ ...profile, address, phone: finalPhone });
                        setAddressSaved(true);
                        console.log('[Checkout] User profile updated, addressSaved set to true');
                      } else {
                        // Guest checkout - update guestData
                        setGuestData({ ...guestData, address, phone: phone || guestData.phone });
                        setAddressSaved(true);
                        console.log('[Checkout] Guest data updated (fallback), addressSaved set to true');
                      }
                    }}
                    initialAddress={user ? profile?.address : guestData.address}
                    initialPhone={user ? (userContactData.phone || profile?.phone) : guestData.phone}
                    onDeliveryCheck={(data) => {
                      setSelectedPincode(data.pincode);
                      setSelectedState(data.state);
                      setShippingCharge(data.shippingCharge);
                      setIsCODAvailable(data.isCODAvailable);
                      setEstimatedDays(data.estimatedDays);
                      setDeliveryChecked(true);
                    }}
                  />
                )}
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
                <div key={`${item.id}-${item.protein}`} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  {item.image && (
                    <img
                      src={getThumbnailUrl(item.image)}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.protein}
                    </div>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.protein, Math.max(item.min_order_quantity || 1, item.quantity - 1))}
                      disabled={item.quantity <= (item.min_order_quantity || 1)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={item.quantity <= (item.min_order_quantity || 1) ? `Minimum quantity is ${item.min_order_quantity}` : "Decrease quantity"}
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="font-medium text-sm min-w-[2rem] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.protein, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={item.quantity >= item.stock ? "Maximum stock reached" : "Increase quantity"}
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-sm">₹{(item.price * item.quantity).toFixed(2)}</div>
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
            
            {/* Promo Code Section */}
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <Label htmlFor="promo-code" className="text-sm font-medium mb-2 block">
                <Tag className="inline mr-2 h-4 w-4" />
                Have a promo code?
              </Label>
              {promoCode ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-green-600" />
                    <span className="font-mono font-bold text-green-700">{promoCode.code}</span>
                    <span className="text-sm text-green-600">
                      {[
                        promoCode.free_shipping && '🚚 Free Shipping',
                        promoCode.discount_percentage > 0 && `💰 ${promoCode.discount_percentage}% OFF`
                      ].filter(Boolean).join(' + ')}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removePromoCode}
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="promo-code"
                      placeholder="Enter promo code"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
                    />
                    <Button
                      onClick={handleApplyPromo}
                      disabled={applyingPromo || !promoInput.trim()}
                      variant="outline"
                      className="font-poppins font-bold"
                    >
                      {applyingPromo ? "Applying..." : "Apply"}
                    </Button>
                  </div>

                  {visiblePromoCodes.length > 0 && (
                    <div className="border-2 border-[#b5edce] rounded-lg bg-gradient-to-r from-[#5e4338] to-[#3b2a20] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowOffers(v => !v)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-poppins font-bold text-[#b5edce] hover:bg-black/10 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <span>🎁</span>
                          <span>{visiblePromoCodes.length} Available Offer{visiblePromoCodes.length > 1 ? 's' : ''}</span>
                        </span>
                        <span className="text-[#b5edce] text-xs">{showOffers ? '▲ Hide' : '▼ View'}</span>
                      </button>

                      {showOffers && (
                        <div className="px-3 pb-3 space-y-2 border-t border-[#b5edce]/30">
                          {visiblePromoCodes.map((offer) => (
                            <div
                              key={offer.id}
                              className="flex items-center justify-between p-2 bg-white/10 rounded-md border border-[#b5edce]/40 hover:bg-white/20 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-sm text-white bg-[#b5edce] text-[#3b2a20] px-1.5 py-0.5 rounded">{offer.code}</span>
                                  <span className="text-xs text-[#b5edce] font-medium">
                                    {[offer.free_shipping && '🚚 Free Shipping', offer.discount_percentage > 0 && `${offer.discount_percentage}% OFF`].filter(Boolean).join(' + ')}
                                  </span>
                                </div>
                                {(offer.description || offer.min_order_amount > 0) && (
                                  <p className="text-xs text-[#b5edce]/70 mt-0.5 truncate">
                                    {offer.description || `Min order: ₹${offer.min_order_amount}`}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  setApplyingPromo(true);
                                  await applyPromoCode(offer.code);
                                  setShowOffers(false);
                                  setApplyingPromo(false);
                                }}
                                disabled={applyingPromo}
                                className="ml-2 shrink-0 text-xs font-poppins font-bold text-[#3b2a20] bg-[#b5edce] border border-[#b5edce] rounded px-2 py-1 hover:bg-white hover:text-[#3b2a20] transition-colors disabled:opacity-50"
                              >
                                Apply
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <h3 className="font-semibold mb-4 text-gray-700">Price Details</h3>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>MRP (Inclusive of all taxes)</span>
                <span className="font-medium">₹{totalPrice}</span>
              </div>
              
              {promoCode && promoCode.discount_percentage > 0 && discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({promoCode.discount_percentage}%)</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              {promoCode && promoCode.free_shipping && getShippingDiscount() > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">
                    🎉 Free Shipping
                  </span>
                  <span className="text-blue-600 font-medium">({promoCode.code})</span>
                </div>
              )}

              {deliveryChecked && (
                <>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span>Subtotal</span>
                    <span>₹{(discountedTotal !== undefined ? discountedTotal : totalPrice).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      Shipping
                    </span>
                    <span>
                      {(() => {
                        const pricing = calculateOrderPrice(discountedTotal !== undefined ? discountedTotal : totalPrice, shippingCharge, paymentMethod === 'online' ? 'prepaid' : 'cod', selectedState);
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

                  {paymentMethod === 'online' && (discountedTotal !== undefined ? discountedTotal : totalPrice) > 800 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Prepaid Discount (4%)</span>
                      <span>-₹{((discountedTotal !== undefined ? discountedTotal : totalPrice) * 0.04).toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>
                  {deliveryChecked 
                    ? (() => {
                        const pricing = calculateOrderPrice(discountedTotal !== undefined ? discountedTotal : totalPrice, shippingCharge, paymentMethod === 'online' ? 'prepaid' : 'cod', selectedState);
                        const shippingDiscount = getShippingDiscount();
                        let finalTotal = pricing.total;
                        
                        // Apply shipping discount from promo
                        if (shippingDiscount > 0) {
                          finalTotal = finalTotal - shippingDiscount;
                        }
                        
                        return `₹${finalTotal.toFixed(2)}`;
                      })()
                    : `₹${(discountedTotal !== undefined ? discountedTotal : totalPrice).toFixed(2)}`
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
                {/* COD Payment Option */}
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
