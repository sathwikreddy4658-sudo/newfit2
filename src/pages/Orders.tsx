import { useEffect, useState } from "react";
import { getCurrentUser, auth } from "@/integrations/firebase/auth";
import { getOrder, getUserOrders } from "@/integrations/firebase/db";
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
      const orders = await getUserOrders(userId);
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
    return order.status.charAt(0).toUpperCase() + order.status.slice(1);
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-16">
      <h1 className="text-3xl font-saira font-black text-[#3b2a20] mb-8 uppercase">MY ORDERS</h1>

      {orders.length === 0 ? (
        <p className="text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Order ID: {order.id.slice(0, 8)}
                    </p>
                    {!order.user_id && order.customer_email && (
                      <Badge variant="outline" className="text-xs">Guest Order</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
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
                </div>
                <Badge variant={getStatusColor(order.status)}>
                  {getStatusLabel(order)}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.product_name} × {item.quantity}
                    </span>
                    <span>₹{item.product_price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-bold">Total: ₹{order.total_price}</span>
                {/* Orders shown here are confirmed - cancellation must be done through admin/support */}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
