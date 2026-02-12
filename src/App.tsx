import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import ScrollToTop from "@/components/ScrollToTop";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import Products from "./pages/Products-updated";
import { lazy, Suspense } from "react";

// Lazy load non-critical routes
const About = lazy(() => import("./pages/About"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const COD = lazy(() => import("./pages/COD"));
const Refund = lazy(() => import("./pages/Refund-updated"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const AddressSelection = lazy(() => import("./pages/AddressSelection"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentCallback = lazy(() => import("./pages/PaymentCallback"));
const Profile = lazy(() => import("./pages/Profile"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const GuestThankYou = lazy(() => import("./pages/GuestThankYou"));
const UserThankYou = lazy(() => import("./pages/UserThankYou"));
const AdminAuth = lazy(() => import("./pages/admin/AdminAuth"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Blogs = lazy(() => import("./pages/Blogs"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const LabReports = lazy(() => import("./pages/LabReports"));
const KnowYourFood = lazy(() => import("./pages/KnowYourFood"));
const Favorites = lazy(() => import("./pages/Favorites"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
      cacheTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
      refetchOnWindowFocus: false, // Don't refetch when user returns to tab
      refetchOnMount: false, // Don't refetch on component remount
      retry: 1, // Only retry failed requests once (not 3 times)
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col">
            <Header />
            <BackButton />
            <main className="flex-1">
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy-policy" element={<Privacy />} />
                  <Route path="/cash-on-delivery" element={<COD />} />
                  <Route path="/refund-policy" element={<Refund />} />
                  <Route path="/shipping-delivery" element={<Shipping />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:name" element={<Navigate to={(location) => `/product/${location.pathname.split('/').pop()}`} replace />} />
                  <Route path="/product/:name" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/address" element={<AddressSelection />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/payment/callback" element={<PaymentCallback />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/order-confirmation" element={<OrderConfirmation />} />
                  <Route path="/track-order" element={<TrackOrder />} />
                  <Route path="/guest-thank-you" element={<GuestThankYou />} />
                  <Route path="/user-thank-you" element={<UserThankYou />} />
                  <Route path="/blogs" element={<Blogs />} />
                  <Route path="/blogs/:id" element={<BlogDetail />} />
                  <Route path="/labreports" element={<LabReports />} />
                  <Route path="/knowyourfood" element={<KnowYourFood />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/admin/auth" element={<AdminAuth />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin" element={<Navigate to="/admin/auth" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
