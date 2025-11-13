import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Phone, MapPin, CreditCard, Package } from "lucide-react";

const OrdersTab = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("admin-orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*),
        profiles (name, email, phone),
        payment_transactions (*)
      `)
      .order("created_at", { ascending: false });

    if (data) setOrders(data);
  };

  const handleStatusChange = async (orderId: string, newStatus: "pending" | "shipped" | "delivered" | "cancelled") => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Status update failed", variant: "destructive" });
    } else {
      toast({ title: "Order status updated" });
      fetchOrders();
    }
  };

  const toggleOrderExpanded = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "default";
      case "shipped":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Orders Management</h2>

      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrders.has(order.id);
          const paymentTransaction = order.payment_transactions?.[0];
          const customerPhone = order.customer_phone || order.profiles?.phone;

          return (
            <Card key={order.id} className="p-6">
              {/* Header Section */}
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                {/* Order Info */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Order ID</p>
                  <p className="font-mono font-bold">{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>

                {/* Customer Info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Customer</p>
                    <p className="font-semibold">{order.customer_name || order.profiles?.name || "Guest"}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_email || order.profiles?.email}</p>
                  </div>

                  {customerPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <a href={`tel:${customerPhone}`} className="text-blue-600 hover:underline font-medium">
                        {customerPhone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Status Section */}
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Order Status</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(order.status)} className="text-sm px-2 py-1">
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <Select
                    value={order.status}
                    onValueChange={(value) =>
                      handleStatusChange(order.id, value as "pending" | "shipped" | "delivered" | "cancelled")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  {paymentTransaction && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Payment Status</p>
                      <Badge className={`${getPaymentStatusColor(paymentTransaction.status)} text-xs`}>
                        {paymentTransaction.status}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Address Section */}
              {order.address && (
                <div className="border-t pt-4 mb-4">
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Delivery Address</p>
                      <p className="text-sm mt-1 leading-relaxed">{order.address}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Transaction Details */}
              {paymentTransaction && (
                <div className="border-t pt-4 mb-4">
                  <div className="flex items-start gap-2">
                    <CreditCard className="h-5 w-5 text-purple-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Payment Details</p>
                      <div className="grid md:grid-cols-2 gap-3 mt-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Transaction ID</p>
                          <p className="font-mono">{paymentTransaction.merchant_transaction_id?.slice(0, 12)}...</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="font-semibold">₹{(paymentTransaction.amount / 100).toFixed(2)}</p>
                        </div>
                        {paymentTransaction.response_code && (
                          <div>
                            <p className="text-xs text-muted-foreground">Response Code</p>
                            <p className="font-mono">{paymentTransaction.response_code}</p>
                          </div>
                        )}
                        {paymentTransaction.payment_method && (
                          <div>
                            <p className="text-xs text-muted-foreground">Payment Method</p>
                            <p className="font-medium">{paymentTransaction.payment_method}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items Section */}
              <div className="border-t pt-4">
                <button
                  onClick={() => toggleOrderExpanded(order.id)}
                  className="flex items-center gap-2 w-full text-left font-semibold mb-3 hover:text-blue-600 transition-colors"
                >
                  <Package className="h-5 w-5" />
                  <span>Order Items ({order.order_items.length})</span>
                  <span className="ml-auto text-2xl">{isExpanded ? "−" : "+"}</span>
                </button>

                {isExpanded && (
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-sm py-1">
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{(item.product_price * item.quantity).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">@ ₹{item.product_price}</p>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between font-bold pt-3 border-t mt-3">
                      <span>Order Total:</span>
                      <span className="text-lg">₹{parseFloat(order.total_price).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {orders.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No orders found</p>
        </Card>
      )}
    </div>
  );
};

export default OrdersTab;
