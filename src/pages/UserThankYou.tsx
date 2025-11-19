import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShoppingCart, Package } from "lucide-react";

const UserThankYou = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const orderId = location.state?.orderId;
  const email = location.state?.email;

  useEffect(() => {
    // If no order info, redirect to orders page
    if (!orderId) {
      setTimeout(() => navigate('/orders'), 2000);
    }
  }, [orderId, navigate]);

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <Card className="p-4 md:p-8 text-center mb-4 md:mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CheckCircle className="h-12 w-12 md:h-20 md:w-20 text-green-600 mx-auto mb-3 md:mb-4 animate-bounce" />
          <h1 className="text-2xl md:text-4xl font-bold text-green-800 mb-2 md:mb-3">
            Thank You For Shopping With Us!
          </h1>
          <p className="text-green-700 text-sm md:text-lg mb-2">
            A confirmation email will be sent to you shortly.
          </p>
          {email && (
            <p className="text-green-900 font-semibold text-sm md:text-lg break-all">
              {email}
            </p>
          )}
          {orderId && (
            <div className="mt-3 md:mt-4 p-2 md:p-3 bg-green-100 rounded-lg inline-block">
              <p className="text-xs md:text-sm text-green-700">Order ID</p>
              <p className="text-lg md:text-xl font-mono font-bold text-green-900">
                {orderId.slice(0, 8)}
              </p>
            </div>
          )}
        </Card>

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
        <Card className="p-4 md:p-6 bg-blue-50 border-blue-200">
          <h3 className="text-sm md:text-base font-bold text-blue-900 mb-2">What's Next?</h3>
          <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-blue-800">
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
