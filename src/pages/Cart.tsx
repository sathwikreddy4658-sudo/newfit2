import { useCart } from "@/contexts/CartContext";
import { getVisiblePromoCodes } from "@/integrations/firebase/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2, Tag, X } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getCurrentUser, auth } from "@/integrations/firebase/auth";
import { getThumbnailUrl } from "@/utils/imageOptimization";

const Cart = () => {
  const {
    items,
    removeItem,
    updateQuantity,
    totalPrice,
    promoCode,
    applyPromoCode,
    removePromoCode,
    discountAmount,
    discountedTotal
  } = useCart();
  const navigate = useNavigate();
  const [promoInput, setPromoInput] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [visiblePromoCodes, setVisiblePromoCodes] = useState<any[]>([]);
  const [showOffers, setShowOffers] = useState(false);

  useEffect(() => {
    // Set up Firebase auth state listener
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  // Fetch visible promo codes on mount
  useEffect(() => {
    getVisiblePromoCodes().then(setVisiblePromoCodes).catch(() => {});
  }, []);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setApplyingPromo(true);
    const success = await applyPromoCode(promoInput.trim());
    if (success) {
      setPromoInput("");
    }
    setApplyingPromo(false);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-saira font-black text-6xl text-[#3b2a20] mb-4 uppercase">YOUR CART</h1>
        <p className="text-muted-foreground mb-4">Your cart is empty</p>
        <Button onClick={() => navigate("/products")} className="bg-[b5edce] bg-[#b5edce]/55 font-poppins font-bold">
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-saira font-black text-6xl text-[#3b2a20] mb-8 uppercase">YOUR CART</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Link key={`${item.id}-${item.protein}`} to={`/product/${encodeURIComponent(item.name)}`} className="block">
              <Card className="p-2 md:p-4 bg-white hover:bg-[#3b2a20]/30 transition-colors cursor-pointer">
                <div className="flex gap-2 md:gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={getThumbnailUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-saira font-black text-sm md:text-lg mb-1 md:mb-2 text-[#3b2a20] uppercase truncate">{item.name}</h3>
                    <p className="text-xs md:text-sm font-poppins font-black mb-1 text-black uppercase">Protein: {item.protein}</p>
                    {(() => {
                      const subtotal = item.price * item.quantity;
                      let discount = 0;
                      let discountPercent = 0;
                      
                      // Apply combo pack discount
                      if (item.quantity >= 6 && item.combo_6_discount) {
                        discount = (subtotal * item.combo_6_discount) / 100;
                        discountPercent = item.combo_6_discount;
                      } else if (item.quantity >= 3 && item.combo_3_discount) {
                        discount = (subtotal * item.combo_3_discount) / 100;
                        discountPercent = item.combo_3_discount;
                      }
                      
                      const finalPrice = subtotal - discount;
                      
                      return (
                        <div>
                          <p className="font-montserrat text-sm md:text-lg font-bold text-primary">
                            ₹{item.price} {item.quantity > 1 && `× ${item.quantity}`}
                            {discount > 0 && (
                              <span className="ml-2 text-xs md:text-sm text-green-600 font-bold">
                                ({discountPercent}% off)
                              </span>
                            )}
                          </p>
                          {discount > 0 && (
                            <p className="text-xs md:text-sm text-green-600 font-bold">
                              Total: ₹{finalPrice.toFixed(2)}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex flex-col items-end gap-1 md:gap-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7 md:h-10 md:w-10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeItem(item.id, item.protein); }}>
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>

                    <div className="flex items-center gap-1 md:gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 md:h-10 md:w-10"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(item.id, item.protein, item.quantity - 1); }}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <span className="w-6 md:w-8 text-center text-xs md:text-base">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 md:h-10 md:w-10"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(item.id, item.protein, item.quantity + 1); }}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          
          {/* Promo Code Banner */}
          <div className="mt-6 p-4 bg-gradient-to-r from-[#5e4338] to-[#3b2a20] border-2 border-[#b5edce] rounded-lg">
            <p className="font-poppins font-bold text-lg text-center mb-1 text-[#b5edce]">
              Use code: <span className="text-white font-black text-xl">APFREE</span>. Get 100% OFF on Shipping
            </p>
            <p className="text-[#ffffff] text-sm text-center italic">
              Available only for eligible pincodes at checkout.
            </p>
          </div>
          
          {/* Free Delivery Banner */}
          <div className="mt-4 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
            <p className="font-poppins font-bold text-black text-lg">
               FREE DELIVERY ON ORDERS ABOVE ₹600! 
            </p>
          </div>
        </div>

        <div>
          <Card className="p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            {/* Promo Code Section */}
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <Label htmlFor="promo-code" className="text-sm font-medium mb-2 block">
                <Tag className="inline mr-2 h-4 w-4" />
                Have a promo code?
              </Label>
              {promoCode ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
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

            <div className="space-y-2 mb-4">
              {(() => {
                // Calculate combo pack discounts
                const itemsBeforeDiscount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                const comboDiscount = itemsBeforeDiscount - totalPrice;
                
                return (
                  <>
                    <div className="flex justify-between">
                      <span>Items ({items.reduce((sum, item) => sum + item.quantity, 0)})</span>
                      <span>₹{itemsBeforeDiscount.toFixed(2)}</span>
                    </div>
                    {comboDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Pack Discount</span>
                        <span>-₹{comboDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {comboDiscount > 0 && (
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{totalPrice.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                );
              })()}
              {promoCode && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Promo Discount ({promoCode.discount_percentage}%)</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>₹{discountedTotal.toFixed(2)}</span>
                  </div>
                </>
              )}
              {!promoCode && (
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {user ? (
                <Button className="w-full font-poppins font-bold btn-animate" onClick={() => navigate("/checkout")}>
                  Order Now
                </Button>
              ) : (
                <>
                  <Button
                    className="w-full font-poppins font-bold btn-animate"
                    onClick={() => navigate("/checkout", { state: { isGuest: true } })}
                  >
                    Order Now
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full font-poppins font-bold"
                    onClick={() => navigate("/auth", { state: { returnTo: window.location.pathname } })}
                  >
                    Sign In & Order
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;
