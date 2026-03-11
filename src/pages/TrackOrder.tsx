import { useState, useEffect } from "react";
import { searchOrders, getGuestOrders } from "@/integrations/firebase/db";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, Mail, Phone, Calendar, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TrackOrder = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email && !phone && !orderId) {
      toast({
        title: "Input Required",
        description: "Please enter your email, phone number, or order ID to track orders.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      let results: any[] = [];
      
      // Try all provided search terms
      if (orderId.trim()) {
        const orderResults = await searchOrders(orderId);
        results = [...results, ...orderResults];
      }
      
      if (email.trim() && phone.trim()) {
        const guestResults = await getGuestOrders(email, phone);
        results = [...results, ...guestResults];
      } else if (email.trim()) {
        const emailResults = await searchOrders(email);
        results = [...results, ...emailResults];
      } else if (phone.trim()) {
        const phoneResults = await searchOrders(phone);
        results = [...results, ...phoneResults];
      }
      
      // Remove duplicates by order ID
      const uniqueResults = Array.from(new Map(results.map(r => [r.id, r])).values());
      
      if (uniqueResults.length === 0) {
        toast({
          title: "No orders found",
          description: "No orders found matching your search criteria. Please check and try again.",
          variant: "destructive"
        });
        setOrders([]);
      } else {
        setOrders(uniqueResults);
        toast({
          title: "Success",
          description: `Found ${uniqueResults.length} order(s)`,
        });
      }
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to search orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-[#b5edce]/50 min-h-screen py-6 md:py-8 lg:py-12 pt-20 md:pt-24">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8 md:mb-12">
          <h1 className="font-saira font-black text-4xl sm:text-5xl md:text-6xl lg:text-6xl text-[#3b2a20] uppercase mb-2">
            Track Your Order
          </h1>
          <p className="font-poppins text-[#3b2a20]/70 text-base sm:text-base md:text-lg">
            Search for your order using order ID, email, or phone number
          </p>
        </div>

        {/* Search Form */}
        <Card className="p-4 sm:p-6 md:p-8 mb-6 md:mb-8 shadow-lg">
          <form onSubmit={handleSearch} className="space-y-4 sm:space-y-6">
            {/* Order ID Search */}
            <div>
              <Label htmlFor="orderId" className="text-xs sm:text-sm font-poppins font-semibold text-[#3b2a20]">
                Order Number or Reference ID (Optional)
              </Label>
              <Input
                id="orderId"
                type="text"
                placeholder="e.g., ORD-1709907600000 or JQF4mcy2"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                disabled={loading}
                className="mt-2 text-sm border-[#b5edce] focus:border-[#3b2a20] focus:ring-[#3b2a20]"
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 border-t-2 border-[#3b2a20]/20"></div>
              <span className="font-poppins text-xs sm:text-sm text-[#3b2a20]/60 font-semibold ">OR</span>
              <div className="flex-1 border-t-2 border-[#3b2a20]/20"></div>
            </div>

            {/* Email and Phone Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <Label htmlFor="email" className="text-xs sm:text-sm font-poppins font-semibold text-[#3b2a20]">
                  Email Address (Optional)
                </Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-3 sm:top-3.5 h-4 sm:h-5 w-4 sm:w-5 text-[#3b2a20]/50" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-10 text-sm border-[#b5edce] focus:border-[#3b2a20] focus:ring-[#3b2a20]"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone" className="text-xs sm:text-sm font-poppins font-semibold text-[#3b2a20]">
                  Phone Number (Optional)
                </Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-3 sm:top-3.5 h-4 sm:h-5 w-4 sm:w-5 text-[#3b2a20]/50" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    className="pl-10 text-sm border-[#b5edce] focus:border-[#3b2a20] focus:ring-[#3b2a20]"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-[#3b2a20] hover:bg-[#3b2a20]/90 text-white font-poppins font-semibold py-4 sm:py-5 md:py-6 text-base sm:text-lg rounded-lg transition-all"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Searching...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-5 w-5" />
                  TRACK ORDERS
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Results Section */}
        {searched && (
          <div>
            {orders.length > 0 ? (
              <>
                <h2 className="font-saira font-black text-2xl sm:text-3xl md:text-4xl text-[#3b2a20] uppercase mb-6 md:mb-8">
                  Found {orders.length} Order{orders.length !== 1 ? 's' : ''}
                </h2>
                <div className="space-y-4 sm:space-y-6">
                  {orders.map((order) => (
                    <Card key={order.id} className="p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow border-0">
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 pb-4 sm:pb-6 border-b-2 border-[#b5edce] gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="bg-[#b5edce]/30 p-2 sm:p-3 rounded-lg flex-shrink-0">
                            <Package className="h-5 sm:h-6 w-5 sm:w-6 text-[#3b2a20]" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-saira font-bold text-base sm:text-lg md:text-xl text-[#3b2a20] break-words">
                              {order.order_number}
                            </h3>
                            <p className="font-poppins text-xs text-[#3b2a20]/50 mt-0.5">
                              Reference ID: {order.id}
                            </p>
                            <p className="font-poppins text-xs sm:text-sm text-[#3b2a20]/60 mt-1">
                              <Calendar className="h-3 sm:h-4 w-3 sm:w-4 inline mr-1" />
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} flex-shrink-0 text-xs sm:text-sm`}>
                          {order.status?.toUpperCase() || 'PENDING'}
                        </Badge>
                      </div>

                      {/* Order Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
                        <div className="bg-[#b5edce]/20 p-3 sm:p-4 rounded-lg">
                          <p className="font-poppins text-xs sm:text-sm text-[#3b2a20]/60 mb-1">Customer Name</p>
                          <p className="font-poppins font-semibold text-sm sm:text-base text-[#3b2a20] break-words">{order.customer_name}</p>
                        </div>
                        <div className="bg-[#b5edce]/20 p-3 sm:p-4 rounded-lg">
                          <p className="font-poppins text-xs sm:text-sm text-[#3b2a20]/60 mb-1">Email</p>
                          <p className="font-poppins font-semibold text-sm sm:text-base text-[#3b2a20] break-all">{order.customer_email}</p>
                        </div>
                        <div className="bg-[#b5edce]/20 p-3 sm:p-4 rounded-lg">
                          <p className="font-poppins text-xs sm:text-sm text-[#3b2a20]/60 mb-1">Phone</p>
                          <p className="font-poppins font-semibold text-sm sm:text-base text-[#3b2a20]">{order.customer_phone}</p>
                        </div>
                        <div className="bg-[#b5edce]/20 p-3 sm:p-4 rounded-lg">
                          <p className="font-poppins text-xs sm:text-sm text-[#3b2a20]/60 mb-1">Status</p>
                          <p className="font-poppins font-semibold text-sm sm:text-base text-[#3b2a20] capitalize">{order.status}</p>
                        </div>
                      </div>

                      {/* Delivery Address */}
                      {order.address && (
                        <div className="bg-blue-50 border-l-4 border-[#3b2a20] p-3 sm:p-4 rounded-r-lg mb-4 sm:mb-6">
                          <p className="font-poppins text-xs sm:text-sm text-[#3b2a20]/70 font-semibold mb-2">📍 Delivery Address</p>
                          <p className="font-poppins text-xs sm:text-sm text-[#3b2a20] break-words">{order.address}</p>
                        </div>
                      )}

                      {/* Items */}
                      {order.items && order.items.length > 0 && (
                        <div className="mb-4 sm:mb-6">
                          <p className="font-poppins font-semibold text-xs sm:text-sm md:text-base text-[#3b2a20] mb-2 sm:mb-3">Items Ordered:</p>
                          <div className="space-y-2">
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center p-2 sm:p-3 bg-[#b5edce]/10 rounded-lg font-poppins text-xs sm:text-sm">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[#3b2a20] font-semibold break-words">{item.name}</p>
                                  <p className="text-[#3b2a20]/60 text-xs">Qty: {item.quantity} × ₹{item.price?.toFixed(2)}</p>
                                </div>
                                <p className="font-semibold text-[#3b2a20] flex-shrink-0 ml-2">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pricing Summary */}
                      <div className="border-t-2 border-[#b5edce] pt-3 sm:pt-4 space-y-2 sm:space-y-3 font-poppins text-xs sm:text-sm">
                        {/* Raw Items Total */}
                        <div className="flex justify-between text-[#3b2a20]/70">
                          <span>Items:</span>
                          <span>₹{order.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toFixed(2) || '0.00'}</span>
                        </div>
                        
                        {/* Combo Discount if applicable */}
                        {order.combo_discount_amount && order.combo_discount_amount > 0 && (
                          <div className="flex justify-between text-green-600 font-semibold">
                            <span>Combo Discount:</span>
                            <span>-₹{order.combo_discount_amount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        {/* Subtotal after combo discounts */}
                        <div className="flex justify-between text-[#3b2a20] font-semibold">
                          <span>Subtotal:</span>
                          <span>₹{(order.items_subtotal || order.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) - (order.combo_discount_amount || 0)).toFixed(2)}</span>
                        </div>
                        
                        {/* Promo Discount if applicable */}
                        {order.discount_amount && order.discount_amount > 0 && (
                          <div className="flex justify-between text-green-600 font-semibold">
                            <span>Promo Discount:</span>
                            <span>-₹{order.discount_amount.toFixed(2)}</span>
                          </div>
                        )}
                        {order.shipping_charge !== undefined && order.shipping_charge > 0 && (
                          <div className="flex justify-between text-[#3b2a20]/70">
                            <span>Shipping:</span>
                            <span>₹{order.shipping_charge.toFixed(2)}</span>
                          </div>
                        )}
                        {order.cod_charge > 0 && (
                          <div className="flex justify-between text-[#3b2a20]/70">
                            <span>COD Charge:</span>
                            <span>₹{order.cod_charge.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base sm:text-lg font-bold text-[#3b2a20] border-t-2 border-[#b5edce] pt-2 sm:pt-3">
                          <span>Total:</span>
                          <span>₹{order.total_amount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t-2 border-[#b5edce]">
                        <p className="font-poppins font-semibold text-xs sm:text-sm md:text-base text-[#3b2a20] mb-1 sm:mb-2">💳 Payment Method</p>
                        <p className="font-poppins text-xs sm:text-sm text-[#3b2a20] capitalize">
                          {order.payment_method === 'cod' ? '💰 Cash on Delivery (COD)' : '🏦 Online Payment'}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card className="p-6 sm:p-8 md:p-12 text-center shadow-lg">
                <Package className="h-12 sm:h-16 w-12 sm:w-16 text-[#3b2a20]/30 mx-auto mb-3 sm:mb-4" />
                <h3 className="font-saira font-black text-lg sm:text-2xl text-[#3b2a20] mb-2">No Orders Found</h3>
                <p className="font-poppins text-xs sm:text-base md:text-lg text-[#3b2a20]/60">
                  Try searching with different information or check your email and phone number
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Info Card */}
        {searched && orders.length > 0 && (
          <Card className="p-4 sm:p-6 mt-6 md:mt-8 bg-blue-50 border-l-4 border-[#3b2a20] shadow-md">
            <p className="font-poppins text-xs sm:text-sm md:text-base text-[#3b2a20]">
              <strong>💡 Tip:</strong> Save your order details. You can always return here to track your orders by entering your email or phone number.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
