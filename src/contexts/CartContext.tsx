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
  combo_3_discount?: number; // 3-pack discount percentage
  combo_6_discount?: number; // 6-pack discount percentage
}

interface PromoCode {
  code: string;
  discount_percentage: number;
  free_shipping: boolean;
  min_order_amount: number;
  max_discount_amount: number | null;
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
        // Fetch current stock and combo discount info for all products in cart
        const { data: products, error } = await supabase
          .from('products')
          .select('id, stock, name, combo_3_discount, combo_6_discount')
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

        // Update stock and combo discount information for cart items
        setItems((prev) =>
          prev.map((item) => {
            const product = products.find(p => p.id === item.id);
            return product ? { 
              ...item, 
              stock: product.stock,
              combo_3_discount: product.combo_3_discount || item.combo_3_discount || 0,
              combo_6_discount: product.combo_6_discount || item.combo_6_discount || 0
            } : item;
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
            ? { 
                ...i, 
                quantity: Math.min(i.quantity + (item.quantity || 1), item.stock),
                combo_3_discount: item.combo_3_discount || i.combo_3_discount,
                combo_6_discount: item.combo_6_discount || i.combo_6_discount
              }
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
          .select("current_uses, max_uses")
          .eq("code", code.toUpperCase())
          .eq("active", true)
          .single();

        if (checkError || !canUse) {
          toast.error("Invalid promo code or usage limit exceeded");
          return false;
        }

        // Check if usage limit is exceeded
        if (canUse.max_uses && canUse.current_uses >= canUse.max_uses) {
          toast.error("Promo code usage limit exceeded");
          return false;
        }
      }

      // Get the promo code details (for both authenticated and guest users)
      const { data, error } = await supabase
        .from("promo_codes")
        .select("code, discount_percentage, free_shipping, min_order_amount, max_discount_amount")
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
        discount_percentage: data.discount_percentage,
        free_shipping: data.free_shipping,
        min_order_amount: data.min_order_amount
      });

      // Check minimum order amount
      if (data.min_order_amount > 0 && totalPrice < data.min_order_amount) {
        toast.error(`Minimum order amount of ₹${data.min_order_amount} required for this promo code`);
        return false;
      }

      setPromoCode(data);
      
      // Build success message based on promo benefits
      const benefits = [];
      if (data.free_shipping) {
        benefits.push('Free Shipping');
      }
      if (data.discount_percentage > 0) {
        benefits.push(`${data.discount_percentage}% OFF`);
      }
      
      toast.success(`Promo code ${data.code} applied! ${benefits.join(' + ')}`);
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
  
  // Calculate total price with combo discounts applied per item
  const totalPrice = items.reduce((sum, item) => {
    const subtotal = item.price * item.quantity;
    let discount = 0;
    
    // Apply combo pack discount based on quantity
    if (item.quantity >= 6 && item.combo_6_discount) {
      discount = (subtotal * item.combo_6_discount) / 100;
    } else if (item.quantity >= 3 && item.combo_3_discount) {
      discount = (subtotal * item.combo_3_discount) / 100;
    }
    
    return sum + (subtotal - discount);
  }, 0);
  
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0);
  
  // Calculate discount from promo code (if applicable)
  let discountAmount = 0;
  if (promoCode && promoCode.discount_percentage > 0) {
    discountAmount = (totalPrice * promoCode.discount_percentage) / 100;
    
    // Apply max discount cap if set
    if (promoCode.max_discount_amount && discountAmount > promoCode.max_discount_amount) {
      discountAmount = promoCode.max_discount_amount;
    }
  }
  
  const discountedTotal = totalPrice - discountAmount;

  console.log('[Cart] Discount calculation:', {
    promoCode: promoCode?.code,
    freeShipping: promoCode?.free_shipping,
    discountPercentage: promoCode?.discount_percentage,
    totalPrice,
    discountAmount,
    maxDiscountAmount: promoCode?.max_discount_amount,
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
