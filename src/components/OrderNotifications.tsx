import { useEffect, useState } from "react";
import { listenToNewOrders } from "@/integrations/firebase/db";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const OrderNotifications = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    // Check if browser supports notifications
    if ("Notification" in window) {
      setPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    if (!notificationsEnabled) return;

    // Subscribe to new orders in real-time
    const unsubscribe = listenToNewOrders((order: any) => {
      // Show browser notification
      if (Notification.permission === "granted") {
        const notification = new Notification("New Order Received!", {
          body: `Order #${order.id.slice(0, 8)} - ₹${order.total_amount}\nPayment: ${order.payment_method === 'online' ? 'Online' : 'COD'}`,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: order.id,
          requireInteraction: true, // Notification stays until user interacts
          silent: false,
        });

        // Play notification sound
        const audio = new Audio("/notification.mp3");
        audio.play().catch(() => {
          // Ignore if sound fails
        });

        // Click notification to open orders page
        notification.onclick = () => {
          window.focus();
          window.location.href = "/admin/orders";
          notification.close();
        };

        // Auto-close after 10 seconds if not clicked
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      // Also show in-app toast
      toast({
        title: "New Order Received!",
        description: `Order #${order.id.slice(0, 8)} for ₹${order.total_amount}`,
        duration: 5000,
      });

      console.log("[OrderNotifications] New order:", order);
    });

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [notificationsEnabled]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive",
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === "granted") {
        setNotificationsEnabled(true);
        toast({
          title: "Notifications Enabled",
          description: "You'll be notified when new orders are placed",
        });

        // Show test notification
        new Notification("Order Notifications Active", {
          body: "You'll now receive alerts for new orders",
          icon: "/favicon.ico",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Please allow notifications in your browser settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast({
        title: "Error",
        description: "Failed to enable notifications",
        variant: "destructive",
      });
    }
  };

  const toggleNotifications = () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      toast({
        title: "Notifications Disabled",
        description: "You won't receive order alerts",
      });
    } else {
      if (permission === "granted") {
        setNotificationsEnabled(true);
        toast({
          title: "Notifications Enabled",
          description: "You'll be notified when new orders are placed",
        });
      } else {
        requestNotificationPermission();
      }
    }
  };

  return (
    <Button
      variant={notificationsEnabled ? "default" : "outline"}
      size="sm"
      onClick={toggleNotifications}
      className="flex items-center gap-2"
      title={notificationsEnabled ? "Disable order notifications" : "Enable order notifications"}
    >
      {notificationsEnabled ? (
        <>
          <Bell className="h-4 w-4 animate-pulse" />
          <span className="hidden sm:inline">Notifications On</span>
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4" />
          <span className="hidden sm:inline">Enable Notifications</span>
        </>
      )}
    </Button>
  );
};

export default OrderNotifications;
