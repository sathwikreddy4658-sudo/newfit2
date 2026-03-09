import { useEffect, useState } from "react";
import { getCurrentUser, auth } from "@/integrations/firebase/auth";
import { getOrder, getUserOrdersWithoutIndex } from "@/integrations/firebase/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        navigate("/auth");
        return;
      }
      setUser(firebaseUser as any);
      fetchOrders(firebaseUser.uid);
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchOrders = async (userId: string) => {
    try {
      const orders = await getUserOrdersWithoutIndex(userId);
      setOrders(orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "default";
      case "shipped":
        return "secondary";
      case "paid":
        return "outline";
      case "confirmed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (order: any) => {
    // Check if COD order by payment_id prefix
    const isCOD = order.payment_id && order.payment_id.startsWith('COD-');
    
    if (order.status === 'confirmed' && isCOD) {
      return 'COD - Confirmed';
    }
    if (order.status === 'paid') {
      return 'Paid';
    }
    return order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown';
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Date N/A';
    
    try {
      let date;
      
      // Handle Firebase Timestamp object
      if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
      }
      // Handle milliseconds (number)
      else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      }
      // Handle string (ISO or other format)
      else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      }
      // Handle Date object
      else if (dateValue instanceof Date) {
        date = dateValue;
      }
      else {
        return 'Date N/A';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Date N/A';
      }
      
      return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date parsing error:', error);
      return 'Date N/A';
    }
  };

  const formatPrice = (price: any) => {
    if (price === null || price === undefined) return '0.0';
    const num = parseFloat(price);
    if (isNaN(num)) return '0.0';
    return num.toFixed(1);
  };

  const calculateItemsSubtotal = (order: any) => {
    let subtotal = 0;
    
    if (order.order_items && order.order_items.length > 0) {
      subtotal = order.order_items.reduce((sum: number, item: any) => {
        return sum + ((item.product_price || item.price || 0) * (item.quantity || 1));
      }, 0);
    } else if (order.items && order.items.length > 0) {
      subtotal = order.items.reduce((sum: number, item: any) => {
        return sum + ((item.price || 0) * (item.quantity || 1));
      }, 0);
    }
    
    return subtotal;
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-6 md:py-8 pt-16">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 pt-16 max-w-4xl">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-saira font-black text-[#3b2a20] mb-6 md:mb-8 uppercase">MY ORDERS</h1>

      {orders.length === 0 ? (
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2 sm:gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Order ID: {order.id.slice(0, 8)}
                    </p>
                    {!order.user_id && order.customer_email && (
                      <Badge variant="outline" className="text-xs">Guest Order</Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {formatDate(order.created_at || order.createdAt)}
                  </p>
                  {order.payment_id && order.payment_id.startsWith('COD-') && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Payment: Cash on Delivery
                    </p>
                  )}
                  {order.payment_id && !order.payment_id.startsWith('COD-') && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Payment: Online
                    </p>
                  )}
                  {!order.payment_id && !order.payment_method && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Payment: Pending
                    </p>
                  )}
                </div>
                <Badge variant={getStatusColor(order.status)} className="w-fit">
                  {getStatusLabel(order)}
                </Badge>
              </div>

              <div className="space-y-1 sm:space-y-2 mb-4">
                {order.order_items && order.order_items.length > 0 ? (
                  order.order_items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-xs sm:text-sm">
                      <span className="break-words flex-1">
                        {item.product_name} × {item.quantity}
                      </span>
                      <span className="flex-shrink-0 ml-2">₹{formatPrice(item.product_price * item.quantity)}</span>
                    </div>
                  ))
                ) : order.items && order.items.length > 0 ? (
                  order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs sm:text-sm">
                      <span className="break-words flex-1">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="flex-shrink-0 ml-2">₹{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No items</p>
                )}
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t">
                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                    <span>Items Subtotal:</span>
                    <span>₹{formatPrice(calculateItemsSubtotal(order))}</span>
                  </div>
                  
                  {order.discount_amount && order.discount_amount > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm text-green-700 font-medium">
                      <span>
                        {order.promo_code ? `Promo Discount (${order.promo_code}):` : 'Promo Discount:'}
                      </span>
                      <span>-₹{formatPrice(order.discount_amount)}</span>
                    </div>
                  )}
                  
                  {(order.shipping_charge ?? 0) > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                      <span>Shipping Charge:</span>
                      <span>₹{formatPrice(order.shipping_charge)}</span>
                    </div>
                  )}
                  
                  {(order.cod_charge ?? 0) > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                      <span>COD Processing Charge:</span>
                      <span>₹{formatPrice(order.cod_charge)}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-sm sm:text-base bg-gradient-to-r from-[#b5edce]/20 to-transparent p-3 rounded-md">
                    <span>Total Amount:</span>
                    <span className="text-[#3b2a20]">₹{formatPrice(order.total_amount || order.total_price || 0)}</span>
                  </div>
                </div>

                {/* Promo Code Info */}
                {order.promo_code && order.discount_amount && order.discount_amount > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-2 sm:p-3">
                    <p className="text-xs sm:text-sm text-green-800">
                      ✓ Promo code <span className="font-bold">{order.promo_code}</span> saved you <span className="font-bold">₹{formatPrice(order.discount_amount)}</span>
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
