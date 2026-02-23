import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  FlaskConical, 
  ShoppingCart, 
  Tag, 
  Star, 
  Mail, 
  BarChart3, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import OrderNotifications from "@/components/OrderNotifications";
import ProtectedAdminRoute from "./ProtectedAdminRoute";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Package, label: "Products", path: "/admin/products" },
    { icon: FileText, label: "Blogs", path: "/admin/blogs" },
    { icon: FlaskConical, label: "Lab Reports", path: "/admin/lab-reports" },
    { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
    { icon: Tag, label: "Promo Codes", path: "/admin/promo-codes" },
    { icon: Star, label: "Customer Ratings", path: "/admin/ratings" },
    { icon: Mail, label: "Newsletter", path: "/admin/newsletter" },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-50 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <OrderNotifications />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <aside
          className={`
            fixed top-0 left-0 h-full bg-white border-r w-64 z-40 transition-transform duration-300
            lg:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your store</p>
          </div>

          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      isActive(item.path)
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
          <div className="p-6 lg:p-8">
            {/* Header for desktop */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {menuItems.find((item) => item.path === location.pathname)?.label || "Admin"}
                </h2>
                <p className="text-gray-500 mt-1">
                  Welcome back! Here's what's happening today.
                </p>
              </div>
              <OrderNotifications />
            </div>

            {/* Page Content */}
            <div className="bg-white rounded-lg shadow-sm p-6">{children}</div>
          </div>
        </main>
      </div>
    </ProtectedAdminRoute>
  );
};

export default AdminLayout;
