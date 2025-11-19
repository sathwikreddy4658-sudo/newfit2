import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Package, Mail, Phone, MapPin } from "lucide-react";

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      // Get order details from location state or session storage
      const orderId = location.state?.orderId || sessionStorage.getItem('guestOrderId');
      const email = location.state?.email || sessionStorage.getItem('guestOrderEmail');

      if (!orderId) {
        navigate('/');
        return;
      }

      try {
        // Use secure RPC to fetch order with items and enforce email match
        const { data, error } = await (supabase.rpc as any)(
          'get_order_with_items_public',
          { p_order_id: orderId, p_email: email || null }
        );

        if (error) throw error;

        if (!data) {
          navigate('/');
          return;
        }

        setOrder(data);
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="p-8 text-center max-w-md mx-auto">
          <p className="text-lg text-muted-foreground">Order not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  const isCOD = order.payment_id && order.payment_id.startsWith('COD-');

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <Card className="p-4 md:p-8 text-center mb-4 md:mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-12 w-12 md:h-16 md:w-16 text-green-600 mx-auto mb-3 md:mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-green-800 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-sm md:text-base text-green-700">
            Thank you for your order. We'll send a confirmation email shortly.
          </p>
        </Card>

        {/* Order Details */}
        <Card className="p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-4 border-b">
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">Order ID</p>
              <p className="text-sm md:text-base font-mono font-bold">{order.id.slice(0, 8)}</p>
            </div>
            <Badge variant={order.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs md:text-sm">
              {isCOD ? 'COD - Confirmed' : order.status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-3 md:gap-4 mb-4">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Email</p>
                <p className="text-sm md:text-base font-medium break-all">{order.customer_email}</p>
              </div>
            </div>
            {order.customer_phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Phone</p>
                  <p className="text-sm md:text-base font-medium">{order.customer_phone}</p>
                </div>
              </div>
            )}
          </div>

          {order.address && (
            <div className="flex items-start gap-2 p-2 md:p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-xs md:text-sm text-muted-foreground font-semibold">Delivery Address</p>
                <p className="text-xs md:text-sm mt-1">{order.address}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Order Items */}
        <Card className="p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Package className="h-4 w-4 md:h-5 md:w-5" />
            <h2 className="text-lg md:text-xl font-bold">Order Items</h2>
          </div>
          
          <div className="space-y-2 md:space-y-3">
            {order.order_items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div className="flex-1">
                  <p className="text-sm md:text-base font-medium">{item.product_name}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm md:text-base font-semibold">₹{(item.product_price * item.quantity).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">@ ₹{item.product_price}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3 md:pt-4 border-t mt-3 md:mt-4">
            <span className="text-base md:text-lg font-bold">Total Amount:</span>
            <span className="text-xl md:text-2xl font-bold text-primary">₹{parseFloat(order.total_price).toFixed(2)}</span>
          </div>
        </Card>

        {/* Payment Method */}
        <Card className="p-4 md:p-6 mb-4 md:mb-6 bg-blue-50 border-blue-200">
          <p className="text-xs md:text-sm text-blue-900 font-semibold mb-2">Payment Method</p>
          <p className="text-base md:text-lg font-bold text-blue-800">
            {isCOD ? 'Cash on Delivery (COD)' : 'Online Payment'}
          </p>
          {isCOD && (
            <p className="text-xs md:text-sm text-blue-700 mt-2">
              Please keep the exact amount ready when our delivery partner arrives.
            </p>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
            Continue Shopping
          </Button>
          <Button 
            onClick={() => window.print()} 
            variant="secondary"
            className="flex-1"
          >
            Print Order
          </Button>
        </div>

        {/* Note for Guest Users */}
        <Card className="p-3 md:p-4 mt-4 md:mt-6 bg-yellow-50 border-yellow-200">
          <p className="text-xs md:text-sm text-yellow-900 mb-2 md:mb-3">
            <strong>Important:</strong> Please save your order details! 
            Order ID: <strong>{order.id.slice(0, 8)}</strong>
          </p>
          <Button 
            onClick={() => navigate('/track-order')} 
            variant="outline"
            className="w-full border-yellow-600 text-yellow-900 hover:bg-yellow-100"
          >
            Track This & Other Orders
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default OrderConfirmation;
