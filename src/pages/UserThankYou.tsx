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
          console.log('[UserThankYou] Order data:', {
            id: data.id,
            total_price: data.total_amount,
            shipping_charge: (data as any).shipping_charge || 0,
            cod_charge: (data as any).cod_charge || 0,
            discount_applied: (data as any).discount_applied || 0,
            payment_method: (data as any).payment_method || 'online'
          });
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
          <Card className="p-4 md:p-6 mb-4 md:mb-6 border-2" style={{ borderColor: '#b5edce', backgroundColor: 'rgba(181, 237, 206, 0.05)' }}>
            <h2 className="text-lg md:text-2xl font-bold mb-4" style={{ color: '#3b2a20' }}>Order Summary</h2>
            
            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3" style={{ color: '#3b2a20' }}>Items Ordered</h3>
              <div className="space-y-2">
                {order.order_items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: 'rgba(181, 237, 206, 0.15)' }}>
                    <span className="text-sm md:text-base" style={{ color: '#3b2a20' }}>{item.product_name}</span>
                    <span className="text-sm md:text-base font-semibold" style={{ color: '#3b2a20' }}>
                      {item.quantity}x ₹{item.product_price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="pt-4 mb-6" style={{ borderTop: '2px solid #b5edce' }}>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#3b2a20' }}>Items Total</span>
                  <span className="font-medium" style={{ color: '#3b2a20' }}>
                    ₹{order.order_items?.reduce((sum: number, item: any) => sum + (item.product_price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
                
                {order.discount_applied > 0 && (
                  <div className="flex justify-between text-sm" style={{ color: '#16a34a' }}>
                    <span>Discount Applied</span>
                    <span className="font-medium">-₹{parseFloat(order.discount_applied).toFixed(2)}</span>
                  </div>
                )}
                
                {order.shipping_charge !== undefined && order.shipping_charge !== null && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#3b2a20' }}>Shipping Charge</span>
                    <span className="font-medium" style={{ color: '#3b2a20' }}>₹{parseFloat(order.shipping_charge).toFixed(2)}</span>
                  </div>
                )}
                
                {order.cod_charge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#3b2a20' }}>COD Charge</span>
                    <span className="font-medium" style={{ color: '#3b2a20' }}>₹{parseFloat(order.cod_charge).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3" style={{ borderTop: '2px solid #b5edce' }}>
                  <span className="text-lg font-bold" style={{ color: '#3b2a20' }}>Total Amount</span>
                  <span className="text-xl md:text-2xl font-bold" style={{ color: '#3b2a20' }}>₹{parseFloat(order.total_price).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Billing and Shipping Address */}
            {order.address && (
              <div className="mb-6 p-4 rounded-lg border-2" style={{ backgroundColor: 'rgba(181, 237, 206, 0.15)', borderColor: '#b5edce' }}>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-1 flex-shrink-0" style={{ color: '#3b2a20' }} />
                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: '#3b2a20' }}>Billing and Shipping Address</h4>
                    <p className="text-sm" style={{ color: '#3b2a20' }}>{order.address}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="p-4 rounded-lg border-2" style={{ backgroundColor: 'rgba(181, 237, 206, 0.15)', borderColor: '#b5edce' }}>
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 mt-1 flex-shrink-0" style={{ color: '#3b2a20' }} />
                <div>
                  <h4 className="font-semibold mb-1" style={{ color: '#3b2a20' }}>Payment Method</h4>
                  <p className="text-sm" style={{ color: '#3b2a20' }}>{paymentMethod}</p>
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
          <h3 className="text-sm md:text-base font-saira font-black mb-2 uppercase" style={{ color: '#3b2a20' }}></h3>
          <ul className="space-y-1 md:space-y-2 text-xs md:text-sm" style={{ color: '#3b2a20' }}>
            <li>✅ Your order has been confirmed and is being processed</li>
            <li>📧 Check your email for order confirmation and tracking details</li>
            <li>📦 You can check your order status anytime from the "My Orders" page</li>
            <li>💬 Need help? Contact our support team anytime</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default UserThankYou;
