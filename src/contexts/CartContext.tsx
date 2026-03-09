import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrentUser } from "@/integrations/firebase/auth";
import { getAllProducts, getPromoCode } from "@/integrations/firebase/db";
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
  min_order_quantity?: number; // Minimum quantity required for this product
  combo_3_discount?: number; // 3-pack discount percentage
  combo_6_discount?: number; // 6-pack discount percentage
  combo_12_discount?: number; // 12-pack discount percentage
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
        // Fetch all products from Firebase
        const allProducts = await getAllProducts();
        
        // Filter to only the products in the cart
        const products = allProducts.filter(p => productIds.includes(p.id));

        if (!products || products.length === 0) return;

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
              combo_6_discount: product.combo_6_discount || item.combo_6_discount || 0,
              combo_12_discount: product.combo_12_discount || item.combo_12_discount || 0,
              min_order_quantity: product.min_order_quantity || item.min_order_quantity || 1
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
                combo_6_discount: item.combo_6_discount || i.combo_6_discount,
                combo_12_discount: item.combo_12_discount || i.combo_12_discount,
                min_order_quantity: item.min_order_quantity || i.min_order_quantity
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
      prev.map((i) => {
        if (i.id === id && i.protein === protein) {
          const minQty = i.min_order_quantity || 1;
          const newQty = Math.min(Math.max(minQty, quantity), i.stock);
          return { ...i, quantity: newQty };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setPromoCode(null);
  };

  const applyPromoCode = async (code: string): Promise<boolean> => {
    try {
      const user = await getCurrentUser();
      
      // Fetch the promo code details from Firebase
      const promoCodeData = await getPromoCode(code.toUpperCase());

      if (!promoCodeData) {
        toast.error("Invalid promo code");
        return false;
      }

      // Check minimum order amount
      if (promoCodeData.min_order_amount && promoCodeData.min_order_amount > 0 && totalPrice < promoCodeData.min_order_amount) {
        toast.error(`Minimum order amount of ₹${promoCodeData.min_order_amount} required for this promo code`);
        return false;
      }

      // Check if promo code is active
      if (promoCodeData.active === false) {
        toast.error('This promo code is no longer active');
        return false;
      }

      setPromoCode({
        code: promoCodeData.code,
        discount_percentage: promoCodeData.discount_percentage || 0,
        free_shipping: promoCodeData.free_shipping || false,
        min_order_amount: promoCodeData.min_order_amount || 0,
        max_discount_amount: promoCodeData.max_discount_amount || null,
      });
      
      // Build success message based on promo benefits
      const benefits = [];
      if (promoCodeData.free_shipping) {
        benefits.push('Free Shipping');
      }
      if (promoCodeData.discount_percentage && promoCodeData.discount_percentage > 0) {
        benefits.push(`${promoCodeData.discount_percentage}% OFF`);
      }
      
      toast.success(`Promo code ${promoCodeData.code} applied! ${benefits.join(' + ')}`);
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
    // 12-pack applies to 12+ items
    // 6-pack applies to 6-11 items
    // 3-pack applies to 3-5 items
    if (item.quantity >= 12 && item.combo_12_discount) {
      discount = (subtotal * item.combo_12_discount) / 100;
    } else if (item.quantity >= 6 && item.combo_6_discount) {
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
