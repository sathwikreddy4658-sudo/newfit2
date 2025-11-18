import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TrackOrder = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!email && !phone) {
      toast({
        title: "Input Required",
        description: "Please enter your email or phone number to track orders.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      // Use secure RPC to bypass RLS safely
      const { data, error } = await (supabase.rpc as any)(
        'get_orders_with_items_public',
        { p_email: email || null, p_phone: phone || null }
      );

      if (error) throw error;

      setOrders(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "No Orders Found",
          description: "We couldn't find any orders with the provided information.",
        });
      }
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'delivered':
        return 'bg-green-600';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">
            Enter your email or phone number to view your order status
          </p>
        </div>

        {/* Search Form */}
        <Card className="p-6 mb-8">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground font-semibold">
              OR
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            <Button 
              onClick={handleSearch} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Track Orders
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {searched && orders.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
            <p className="text-muted-foreground">
              We couldn't find any orders with the provided information.
              <br />
              Please check your email or phone number and try again.
            </p>
          </Card>
        )}

        {orders.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Your Orders ({orders.length})</h2>
            
            {orders.map((order) => {
              const isCOD = order.payment_id && order.payment_id.startsWith('COD-');
              
              return (
                <Card key={order.id} className="p-6">
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-4 pb-4 border-b">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">Order #{order.id.slice(0, 8)}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(order.created_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold text-primary">₹{parseFloat(order.total_price).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium text-sm">{order.customer_email}</p>
                      </div>
                    </div>
                    {order.customer_phone && (
                      <div className="flex items-start gap-2">
                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="font-medium text-sm">{order.customer_phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery Address */}
                  {order.address && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg mb-4">
                      <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-blue-900 font-semibold">Delivery Address</p>
                        <p className="text-sm text-blue-800 mt-1">{order.address}</p>
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="space-y-2 mb-4">
                    <p className="font-semibold text-sm">Items Ordered:</p>
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity} × ₹{item.product_price}</p>
                        </div>
                        <p className="font-semibold">₹{(item.product_price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Payment Method */}
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-semibold text-green-900">
                      Payment: {isCOD ? 'Cash on Delivery (COD)' : 'Online Payment'}
                    </p>
                    {isCOD && (
                      <p className="text-xs text-green-700 mt-1">
                        Please keep the exact amount ready for delivery
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Card */}
        <Card className="p-4 mt-8 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Tip:</strong> Save your order details or bookmark this page. You can always return here to track your orders by entering your email or phone number.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default TrackOrder;
