import { useEffect, useState } from "react";
import { getAllOrders } from "@/integrations/firebase/db";
import { Card } from "@/components/ui/card";

const AnalyticsTab = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    soldProducts: [] as any[],
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const orders = await getAllOrders();

    const completedOrders = orders.filter((o: any) => o.status !== "cancelled");

    // Order items are embedded as an array in each order document
    const allItems: any[] = [];
    completedOrders.forEach((order: any) => {
      const items = order.items || order.order_items || [];
      items.forEach((item: any) => {
        allItems.push(item);
      });
    });

    setStats({
      totalOrders: completedOrders.length,
      totalRevenue: completedOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0),
      soldProducts: allItems,
    });
  };

  const productSales = stats.soldProducts.reduce((acc: any, item) => {
    const name = item.product_name || item.name || "Unknown";
    const qty = item.quantity || item.qty || 1;
    const price = item.product_price || item.price || 0;
    if (!acc[name]) {
      acc[name] = { quantity: 0, revenue: 0 };
    }
    acc[name].quantity += qty;
    acc[name].revenue += qty * price;
    return acc;
  }, {});

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Sales Analytics</h2>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Total Orders</h3>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold">₹{stats.totalRevenue}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Product Sales</h3>
        <div className="space-y-3">
          {Object.entries(productSales).map(([name, data]: [string, any]) => (
            <div key={name} className="flex justify-between items-center pb-3 border-b">
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-sm text-muted-foreground">
                  {data.quantity} units sold
                </p>
              </div>
              <p className="font-bold">₹{data.revenue}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
