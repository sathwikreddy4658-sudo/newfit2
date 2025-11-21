import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShoppingCart, Package, MapPin, CreditCard, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const UserThankYou = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const orderId = location.state?.orderId;
  const email = location.state?.email;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no order info, redirect to orders page
    if (!orderId) {
      setTimeout(() => navigate('/orders'), 2000);
      return;
    }

    // Fetch order details
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('id', orderId)
          .single();

        if (!error && data) {
          setOrder(data);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  const isCOD = order?.payment_id?.startsWith('COD-');
  const paymentMethod = isCOD ? 'Cash on Delivery' : 'Online Payment';

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <Card className="p-4 md:p-8 text-center mb-4 md:mb-6 border-[#3b2a20]" style={{ backgroundColor: '#3b2a20' }}>
          <CheckCircle className="h-12 w-12 md:h-20 md:w-20 mx-auto mb-3 md:mb-4 animate-bounce" style={{ color: '#b5edce' }} />
          <h1 className="text-2xl md:text-4xl font-saira font-black mb-2 md:mb-3 uppercase text-white">
            Thank You For Your Order
          </h1>
          <p className="text-sm md:text-lg mb-2" style={{ color: '#b5edce' }}>
            A confirmation email will be sent to you shortly.
          </p>
          {email && (
            <p className="font-semibold text-sm md:text-lg break-all" style={{ color: '#b5edce' }}>
              {email}
            </p>
          )}
          {orderId && (
            <div className="mt-3 md:mt-4 p-2 md:p-3 rounded-lg inline-block" style={{ backgroundColor: 'rgba(181, 237, 206, 0.2)' }}>
              <p className="text-xs md:text-sm" style={{ color: '#b5edce' }}>Order ID</p>
              <p className="text-lg md:text-xl font-mono font-bold" style={{ color: '#b5edce' }}>
                {orderId.slice(0, 8)}
              </p>
            </div>
          )}
        </Card>

        {/* Order Summary */}
        {order && (
          <Card className="p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="text-lg md:text-2xl font-bold mb-4 text-gray-800">Order Summary</h2>
            
            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Items Ordered</h3>
              <div className="space-y-2">
                {order.order_items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm md:text-base">{item.product_name}</span>
                    <span className="text-sm md:text-base font-semibold">
                      {item.quantity}x ₹{item.product_price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Price */}
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total Amount</span>
                <span className="text-xl md:text-2xl font-bold text-primary">₹{order.total_price}</span>
              </div>
            </div>

            {/* Delivery Address */}
            {order.address && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Delivery Address</h4>
                    <p className="text-sm text-gray-700">{order.address}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Payment Method</h4>
                  <p className="text-sm text-gray-700">{paymentMethod}</p>
                  {isCOD && (
                    <p className="text-xs text-orange-600 mt-2">
                      - Please have the exact amount ready for payment upon delivery
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
          <Button
            onClick={() => navigate('/cart')}
            variant="outline"
            size="lg"
            className="h-20 md:h-24 flex flex-col items-center justify-center gap-1 md:gap-2 border-2 hover:border-primary hover:bg-primary/5"
          >
            <ShoppingCart className="h-6 w-6 md:h-8 md:w-8" />
            <span className="text-sm md:text-base font-bold">Continue Shopping</span>
          </Button>
          
          <Button
            onClick={() => navigate('/orders')}
            size="lg"
            className="h-20 md:h-24 flex flex-col items-center justify-center gap-1 md:gap-2 bg-primary hover:bg-primary/90"
          >
            <Package className="h-6 w-6 md:h-8 md:w-8" />
            <span className="text-sm md:text-base font-bold">View My Orders</span>
          </Button>
        </div>

        {/* Additional Info */}
        <Card className="p-4 md:p-6 border-[#b5edce]" style={{ backgroundColor: 'rgba(181, 237, 206, 0.3)' }}>
          <h3 className="text-sm md:text-base font-saira font-black mb-2 uppercase" style={{ color: '#3b2a20' }}>Create Your Account Now</h3>
          <ul className="space-y-1 md:space-y-2 text-xs md:text-sm" style={{ color: '#3b2a20' }}>
            <li>✅ Your order has been confirmed and is being processed</li>
            <li>📧 Check your email for order confirmation and tracking details</li>
            <li>📦 You can track your order status anytime from the "My Orders" page</li>
            <li>💬 Need help? Contact our support team anytime</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default UserThankYou;
