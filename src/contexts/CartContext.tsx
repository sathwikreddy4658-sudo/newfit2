import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
  protein: string;
  weight?: number; // Weight in grams
}

interface PromoCode {
  code: string;
  discount_percentage: number;
  promo_type?: 'percentage' | 'shipping_discount';
  shipping_discount_percentage?: number;
  allowed_states?: string[];
  allowed_pincodes?: string[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string, protein: string) => void;
  updateQuantity: (id: string, protein: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  totalWeight: number;
  promoCode: PromoCode | null;
  applyPromoCode: (code: string) => Promise<boolean>;
  removePromoCode: () => void;
  discountAmount: number;
  discountedTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  const [promoCode, setPromoCode] = useState<PromoCode | null>(() => {
    const saved = localStorage.getItem("promoCode");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("promoCode", JSON.stringify(promoCode));
  }, [promoCode]);

  // Verify stock availability when cart is loaded or changes
  useEffect(() => {
    if (items.length === 0) return;

    const verifyStockAndCleanup = async () => {
      const productIds = [...new Set(items.map(item => item.id))];
      
      try {
        // Fetch current stock for all products in cart
        const { data: products, error } = await supabase
          .from('products')
          .select('id, stock, name')
          .in('id', productIds);

        if (error) {
          console.error('[Cart] Error fetching product stock:', error);
          return;
        }

        if (!products) return;

        // Check for out-of-stock items
        const outOfStockIds = products
          .filter(p => p.stock === 0)
          .map(p => ({ id: p.id, name: p.name }));

        if (outOfStockIds.length > 0) {
          console.log('[Cart] Found out-of-stock items:', outOfStockIds);
          
          // Remove out-of-stock items
          setItems((prev) => {
            const updated = prev.filter(
              item => !outOfStockIds.find(oos => oos.id === item.id)
            );
            
            if (updated.length < prev.length) {
              outOfStockIds.forEach(oos => {
                toast.error(`"${oos.name}" is out of stock and has been removed from your cart.`);
              });
            }
            
            return updated;
          });
        }

        // Update stock information for cart items
        setItems((prev) =>
          prev.map((item) => {
            const product = products.find(p => p.id === item.id);
            return product ? { ...item, stock: product.stock } : item;
          })
        );
      } catch (error) {
        console.error('[Cart] Error verifying stock:', error);
      }
    };

    // Verify stock on mount and every 30 seconds
    verifyStockAndCleanup();
    const interval = setInterval(verifyStockAndCleanup, 30000);

    return () => clearInterval(interval);
  }, []);

  const addItem = (item: Omit<CartItem, "quantity" | "protein"> & { quantity?: number; protein?: string }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.protein === (item.protein || "15g"));
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.protein === (item.protein || "15g")
            ? { ...i, quantity: Math.min(i.quantity + (item.quantity || 1), item.stock) }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1, protein: item.protein || "15g" }];
    });
    toast.success("Added to cart");
  };

  const removeItem = (id: string, protein: string) => {
    setItems((prev) => prev.filter((i) => !(i.id === id && i.protein === protein)));
  };

  const updateQuantity = (id: string, protein: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id && i.protein === protein ? { ...i, quantity: Math.min(Math.max(1, quantity), i.stock) } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setPromoCode(null);
  };

  const applyPromoCode = async (code: string): Promise<boolean> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const userId = user?.id;

      // For authenticated users, check usage limits
      if (userId) {
        const { data: canUse, error: checkError } = await supabase
          .from("promo_codes")
          .select("usage_count, usage_limit")
          .eq("code", code.toUpperCase())
          .eq("active", true)
          .single();

        if (checkError || !canUse) {
          toast.error("Invalid promo code or usage limit exceeded");
          return false;
        }

        // Check if usage limit is exceeded
        if (canUse.usage_limit && canUse.usage_count >= canUse.usage_limit) {
          toast.error("Promo code usage limit exceeded");
          return false;
        }
      }

      // Get the promo code details (for both authenticated and guest users)
      const { data, error } = await supabase
        .from("promo_codes")
        .select("code, discount_percentage, promo_type, shipping_discount_percentage, allowed_states, allowed_pincodes")
        .eq("code", code.toUpperCase())
        .eq("active", true)
        .single();

      if (error || !data) {
        console.error('[Cart] Promo code fetch error:', error);
        toast.error("Invalid promo code");
        return false;
      }

      console.log('[Cart] Promo code fetched:', {
        code: data.code,
        promo_type: data.promo_type,
        discount_percentage: data.discount_percentage,
        shipping_discount_percentage: data.shipping_discount_percentage
      });

      setPromoCode(data);
      
      if (data.promo_type === 'shipping_discount') {
        const discountText = data.shipping_discount_percentage === 100 ? 'Free shipping' : `${data.shipping_discount_percentage}% off shipping`;
        toast.success(`Promo code ${data.code} applied! ${discountText}${data.allowed_states ? ' for ' + data.allowed_states.join(', ') : ''}`);
      } else {
        toast.success(`Promo code ${data.code} applied! ${data.discount_percentage}% discount`);
      }
      return true;
    } catch (error) {
      console.error("Error applying promo code:", error);
      toast.error("Failed to apply promo code");
      return false;
    }
  };

  const removePromoCode = () => {
    setPromoCode(null);
    toast.success("Promo code removed");
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0);
  
  // Calculate discount only for percentage promo codes (not shipping_discount codes)
  const discountAmount = promoCode && promoCode.promo_type === 'percentage' 
    ? (totalPrice * (promoCode.discount_percentage || 0)) / 100 
    : 0;
  const discountedTotal = totalPrice - discountAmount;

  console.log('[Cart] Discount calculation:', {
    promoCode: promoCode?.code,
    promoType: promoCode?.promo_type,
    discountPercentage: promoCode?.discount_percentage,
    totalPrice,
    discountAmount,
    discountedTotal
  });

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        totalWeight,
        promoCode,
        applyPromoCode,
        removePromoCode,
        discountAmount,
        discountedTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
