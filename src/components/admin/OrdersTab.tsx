import { useEffect, useState, useRef } from "react";
import { getAllOrders, listenToOrderChanges, updateOrderStatus } from "@/integrations/firebase/db";
import { db } from "@/integrations/firebase/client";
import { doc, updateDoc, deleteDoc, writeBatch, collection, query, where, getDocs } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Phone, MapPin, CreditCard, Package, Trash2, Download, FileSpreadsheet, Bell, BellOff } from "lucide-react";

// Helper: convert Firestore Timestamp or ISO string to JS Date
const getOrderDate = (order: any): Date => {
  const ts = order?.createdAt;
  if (!ts) return new Date(0);
  return ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(ts));
};

const OrdersTab = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // listenToOrderChanges is async — store the unsubscribe ref once the Promise resolves.
    // The first snapshot fires immediately and populates orders, so no separate fetchOrders() needed.
    let unsubscribeFn: (() => void) | null = null;

    listenToOrderChanges((newOrders) => {
      setOrders(newOrders);
      setFilteredOrders(newOrders);

      if (newOrders.length > lastOrderCount && !isInitialLoad.current && notificationsEnabled) {
        const newOrder = newOrders[0]; // Most recent order
        playNotificationSound();
        showNewOrderNotification(newOrder);

        if (newOrder.status !== 'pending') {
          sendTelegramNotificationAuto(newOrder);
        }
      }

      setLastOrderCount(newOrders.length);
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      }
    })
      .then((unsub) => {
        unsubscribeFn = unsub;
      })
      .catch((error) => {
        console.error("Failed to set up real-time listener:", error);
      });

    return () => {
      if (unsubscribeFn) unsubscribeFn();
    };
  }, [notificationsEnabled]);

  const playNotificationSound = () => {
    // Use browser's built-in notification sound
    if (notificationsEnabled) {
      // Create a simple beep using Web Audio API (CSP-friendly)
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (err) {
        console.log('Audio notification failed:', err);
      }
    }
  };

  const showNewOrderNotification = (orderData: any) => {
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🎉 New Order Received!', {
        body: `Order ID: ${orderData.id.slice(0, 8)} | Amount: ₹${orderData.total_amount}`,
        icon: '/icon.png',
        tag: orderData.id,
        requireInteraction: true
      });
    }

    // Toast notification
    toast({
      title: "🎉 New Order Received!",
      description: `Order ID: ${orderData.id.slice(0, 8)} | Amount: ₹${orderData.total_amount}`,
      duration: 8000,
    });
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You will now receive browser notifications for new orders",
        });
      }
    }
  };

  useEffect(() => {
    filterOrdersByDate();
  }, [orders, fromDate, toDate]);

  const filterOrdersByDate = () => {
    let filtered = [...orders];

    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter(order => getOrderDate(order) >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => getOrderDate(order) <= to);
    }

    setFilteredOrders(filtered);
    // Clear selections when filter changes
    setSelectedOrders(new Set());
  };

  const fetchOrders = async () => {
    try {
      const ordersData = await getAllOrders();
      
      setOrders(ordersData);
      setFilteredOrders(ordersData);
      
      // Track order count for new order detection
      if (isInitialLoad.current) {
        setLastOrderCount(ordersData.length);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({ title: "Failed to load orders", variant: "destructive" });
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: "pending" | "confirmed" | "paid" | "shipped" | "delivered" | "cancelled" | "send_confirmation") => {
    // Handle the special "send confirmation email" action
    if (newStatus === "send_confirmation") {
      await handleSendConfirmationEmail(orderId);
      return;
    }

    try {
      await updateOrderStatus(orderId, newStatus);
      toast({ title: "Order status updated" });
      
      // Auto-send emails for shipped and delivered statuses
      if (newStatus === "shipped" || newStatus === "delivered") {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          setTimeout(() => {
            handleStatusChangeEmail(orderId, newStatus, order);
          }, 500);
        }
      }
      
      fetchOrders();
    } catch (error: any) {
      toast({ title: "Status update failed", description: error.message, variant: "destructive" });
    }
  };

  const handleStatusChangeEmail = async (orderId: string, status: string, order: any) => {
    const customerEmail = order.customer_email || order.profiles?.email;
    if (!customerEmail) {
      console.log("No email found for auto-sending status email");
      return;
    }

    try {
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api/send-email'
        : `${window.location.origin}/api/send-email`;

      let emailPayload: any = {
        orderId: order.id,
        customerEmail: customerEmail,
        customerName: order.customer_name || order.profiles?.name || "Customer",
        address: order.address,
      };

      if (status === "shipped") {
        emailPayload.emailType = "shipped";
        emailPayload.trackingNumber = order.tracking_number || "";
        emailPayload.carrierName = order.carrier_name || "";
        emailPayload.estimatedDeliveryDate = order.estimated_delivery || "";
      } else if (status === "delivered") {
        emailPayload.emailType = "delivered";
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload)
      });

      const data = await response.json();
      console.log(`Auto-sent ${status} email:`, { status: response.status, success: data.success });

      if (!response.ok || data?.success === false) {
        console.warn(`Failed to auto-send ${status} email:`, data.error);
      }
    } catch (error) {
      console.error(`Error auto-sending ${status} email:`, error);
      // Don't show toast - this is a background operation
    }
  };

  const handleSendConfirmationEmail = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      toast({ title: "Order not found", variant: "destructive" });
      return;
    }

    const customerEmail = order.customer_email || order.profiles?.email;
    if (!customerEmail) {
      toast({ 
        title: "Cannot send email", 
        description: "No email address found for this customer",
        variant: "destructive" 
      });
      return;
    }

    // Confirm before sending
    const confirmed = confirm(
      `Send order confirmation email to ${customerEmail}?\n\n` +
      `Order ID: ${order.id.slice(0, 8)}\n` +
      `Total: ₹${order.total_amount}\n` +
      `Items: ${order.items?.length || 0} product(s)`
    );

    if (!confirmed) return;

    toast({ 
      title: "Sending email...", 
      description: "Please wait" 
    });

    try {
      // Call our email API endpoint - use same domain as current site
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api/send-email'  // Local development
        : `${window.location.origin}/api/send-email`; // Production - same domain
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          customerEmail: customerEmail,
          customerName: order.customer_name || order.profiles?.name || "Customer",
          totalPrice: order.total_amount,
          orderItems: order.items,
          address: order.address,
          paymentMethod: order.payment_method === 'cod' ? 'COD' : 'Online Payment',
          createdAt: getOrderDate(order).toISOString()
        })
      });

      const data = await response.json();
      console.log('Email API response:', { status: response.status, data });

      if (!response.ok) {
        console.error('Email sending error:', data);
        toast({ 
          title: "Failed to send email", 
          description: data.error || "Check Supabase Edge Function logs for details",
          variant: "destructive",
          duration: 8000,
        });
      } else if (data?.success === false) {
        toast({ 
          title: "Failed to send email", 
          description: data.error || "SMTP error occurred",
          variant: "destructive",
          duration: 8000,
        });
      } else {
        // Update order status to confirmed after successful email send
        await updateOrderStatus(orderId, "confirmed");

        toast({ 
          title: "✅ Email sent successfully!", 
          description: `Confirmation email sent to ${customerEmail}`,
        });
        fetchOrders();
      }
    } catch (error: any) {
      console.error('Email sending error:', error);
      
      // Provide helpful error messages
      let errorMessage = error.message || "An error occurred";
      let errorTitle = "Failed to send email";
      
      if (error.message?.includes('Failed to send a request') || error.message?.includes('CORS')) {
        errorTitle = "⚠️ Email Function Not Deployed";
        errorMessage = "The email sending function hasn't been deployed yet. See ORDER_CONFIRMATION_EMAIL_GUIDE.md for setup instructions.";
      }
      
      toast({ 
        title: errorTitle, 
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      });
    }
  };

  const handleSendTelegramNotification = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      toast({ title: "Order not found", variant: "destructive" });
      return;
    }

    // Don't allow sending notifications for pending orders
    if (order.status === 'pending') {
      toast({ 
        title: "Cannot send notification", 
        description: "Pending orders should not be notified yet. Please confirm the order first.",
        variant: "destructive" 
      });
      return;
    }

    // Confirm before sending
    const confirmed = confirm(
      `Send Telegram notification for this order?\n\n` +
      `Order ID: ${order.id.slice(0, 8)}\n` +
      `Total: ₹${order.total_amount}\n` +
      `Status: ${order.status}`
    );

    if (!confirmed) return;

    toast({ 
      title: "Sending Telegram notification...", 
      description: "Please wait" 
    });

    try {
      // Call the Cloud Function's manual endpoint to send notification
      const baseUrl = process.env.REACT_APP_API_URL || '/api';
      const response = await fetch(`${baseUrl}/telegram-notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send notification');
      }

      toast({ 
        title: "✅ Notification sent", 
        description: "Telegram notification sent successfully"
      });
    } catch (error: any) {
      console.error('Telegram notification error:', error);
      toast({ 
        title: "Failed to send notification", 
        description: error.message,
        variant: "destructive",
        duration: 8000,
      });
    }
  };

  const sendTelegramNotificationAuto = async (order: any) => {
    // Notification is now automatically sent by the Firestore trigger (onNewOrder)
    // when a new order is created in the database.
    // This function is kept for reference but no manual action is needed.
    console.log('[Auto Telegram] Order created - notification will be sent automatically:', order.id);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      return;
    }

    // Delete the order (Firebase handles nested deletion)
    try {
      // For testing purposes, we'll just call deleteProduct which deletes the entire document
      // In Firebase, deleting a document automatically deletes nested collections
      console.log('Delete order:', orderId);
      toast({ title: "Order deletion not yet implemented", variant: "destructive" });
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: "Failed to delete order", variant: "destructive" });
    }
  };

  const toggleOrderExpanded = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const toggleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedOrders.size === 0) {
      toast({ title: "No orders selected", variant: "destructive" });
      return;
    }

    const confirmed = confirm(
      `⚠️ WARNING: You are about to delete ${selectedOrders.size} selected order(s)!\n\n` +
      `This action cannot be undone. Continue?`
    );

    if (!confirmed) return;

    toast({ 
      title: "Deleting selected orders...", 
      description: "This may take a moment" 
    });

    try {
      const orderIds = Array.from(selectedOrders);

      // Delete orders using Firebase batch (items are embedded in order document)
      const batch = writeBatch(db);
      orderIds.forEach((id) => {
        batch.delete(doc(db, "orders", id));
      });
      await batch.commit();

      toast({ 
        title: "Orders deleted successfully", 
        description: `${selectedOrders.size} order(s) have been removed` 
      });
      
      setSelectedOrders(new Set());
      fetchOrders();
    } catch (error: any) {
      toast({ 
        title: "Failed to delete orders", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handleDeleteAllOrders = async () => {
    if (filteredOrders.length === 0) {
      toast({ title: "No orders to delete", variant: "destructive" });
      return;
    }

    const confirmed = confirm(
      `⚠️ WARNING: You are about to delete ALL ${filteredOrders.length} ${fromDate || toDate ? 'filtered ' : ''}orders!\n\n` +
      `This action cannot be undone and will permanently remove:\n` +
      `- All order records\n` +
      `- All order items\n` +
      `- All associated data\n\n` +
      `Type 'DELETE ALL' in the next prompt to confirm.`
    );

    if (!confirmed) return;

    const finalConfirm = prompt(
      `Please type 'DELETE ALL' (in capital letters) to confirm deletion of ${filteredOrders.length} orders:`
    );

    if (finalConfirm !== "DELETE ALL") {
      toast({ title: "Deletion cancelled", description: "Confirmation text did not match" });
      return;
    }

    toast({ 
      title: "Deleting orders...", 
      description: "This may take a moment" 
    });

    try {
      const orderIds = filteredOrders.map(o => o.id);

      // Delete all orders using Firebase batch (items are embedded in order document)
      // Firestore batch limit is 500 operations; chunk if needed
      const BATCH_SIZE = 450;
      for (let i = 0; i < orderIds.length; i += BATCH_SIZE) {
        const chunk = orderIds.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((id) => {
          batch.delete(doc(db, "orders", id));
        });
        await batch.commit();
      }

      toast({ 
        title: "All orders deleted successfully", 
        description: `${filteredOrders.length} orders have been permanently removed` 
      });
      
      fetchOrders();
    } catch (error: any) {
      toast({ 
        title: "Failed to delete all orders", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const exportToCSV = () => {
    const ordersToExport = selectedOrders.size > 0 
      ? filteredOrders.filter(o => selectedOrders.has(o.id))
      : filteredOrders;

    if (ordersToExport.length === 0) {
      toast({ title: "No orders to export", variant: "destructive" });
      return;
    }

    // Prepare CSV data
    const headers = [
      "Order ID",
      "Date",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Status",
      "Payment Method",
      "Total Price",
      "Address",
      "Items Count"
    ];

    const rows = ordersToExport.map(order => {
      const customerPhone = order.customer_phone || order.profiles?.phone || "";
      const isCOD = order.payment_method === 'cod';
      const paymentMethod = isCOD ? "COD" : "Online Payment";

      return [
        order.id,
        getOrderDate(order).toLocaleString(),
        order.customer_name || order.profiles?.name || "Guest",
        order.customer_email || order.profiles?.email || "",
        customerPhone,
        order.status.toUpperCase(),
        paymentMethod,
        order.total_amount,
        order.address || "",
        order.items?.length || 0
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ 
      title: "CSV exported successfully", 
      description: `${ordersToExport.length} order(s) exported` 
    });
  };

  const exportToExcel = () => {
    const ordersToExport = selectedOrders.size > 0 
      ? filteredOrders.filter(o => selectedOrders.has(o.id))
      : filteredOrders;

    if (ordersToExport.length === 0) {
      toast({ title: "No orders to export", variant: "destructive" });
      return;
    }

    // Prepare detailed Excel data with order items
    const detailedRows: string[][] = [];
    
    // Add header
    detailedRows.push([
      "Order ID",
      "Date & Time",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Status",
      "Payment Method",
      "Address",
      "Product Name",
      "Quantity",
      "Unit Price",
      "Item Total",
      "Order Total"
    ]);

    // Add data rows
    ordersToExport.forEach(order => {
      const customerPhone = order.customer_phone || order.profiles?.phone || "";
      const isCOD = order.payment_method === 'cod';
      const paymentMethod = isCOD ? "COD" : "Online Payment";
      const customerName = order.customer_name || order.profiles?.name || "Guest";
      const customerEmail = order.customer_email || order.profiles?.email || "";
      const date = getOrderDate(order).toLocaleString();

      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any, index: number) => {
          detailedRows.push([
            index === 0 ? order.id.slice(0, 8) : "",
            index === 0 ? date : "",
            index === 0 ? customerName : "",
            index === 0 ? customerEmail : "",
            index === 0 ? customerPhone : "",
            index === 0 ? order.status.toUpperCase() : "",
            index === 0 ? paymentMethod : "",
            index === 0 ? order.address || "" : "",
            item.name,
            item.quantity.toString(),
            item.price.toString(),
            (item.price * item.quantity).toFixed(2),
            index === 0 ? order.total_amount?.toString() || '0' : ""
          ]);
        });
      } else {
        // Order with no items
        detailedRows.push([
          order.id.slice(0, 8),
          date,
          customerName,
          customerEmail,
          customerPhone,
          order.status.toUpperCase(),
          paymentMethod,
          order.address || "",
          "No items",
          "0",
          "0",
          "0",
          order.total_amount?.toString() || '0'
        ]);
      }
    });

    // Convert to CSV format (Excel can open CSV files)
    const csvContent = detailedRows
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    // Download as Excel-compatible CSV
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" }); // UTF-8 BOM for Excel
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_detailed_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ 
      title: "Excel file exported successfully", 
      description: `${ordersToExport.length} order(s) with detailed items exported` 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "default";
      case "shipped":
        return "secondary";
      case "confirmed":
      case "paid":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Orders Management</h2>
          <Button
            variant={notificationsEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (!notificationsEnabled) {
                requestNotificationPermission();
              }
              setNotificationsEnabled(!notificationsEnabled);
              toast({
                title: notificationsEnabled ? "Notifications Disabled" : "Notifications Enabled",
                description: notificationsEnabled 
                  ? "You will no longer receive order alerts" 
                  : "You will now be notified of new orders",
              });
            }}
            className="gap-2"
          >
            {notificationsEnabled ? (
              <>
                <Bell className="h-4 w-4" />
                Alerts ON
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4" />
                Alerts OFF
              </>
            )}
          </Button>
        </div>
        
        <div className="flex gap-2">
          {selectedOrders.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedOrders.size})
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={filteredOrders.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV {selectedOrders.size > 0 && `(${selectedOrders.size})`}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            disabled={filteredOrders.length === 0}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel {selectedOrders.size > 0 && `(${selectedOrders.size})`}
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteAllOrders}
            disabled={filteredOrders.length === 0}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete All
          </Button>
        </div>
      </div>

      {/* Date Filter Section */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">From:</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">To:</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-40"
            />
          </div>
          {(fromDate || toDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
            >
              Clear Filters
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Select All ({filteredOrders.length})
            </label>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const isExpanded = expandedOrders.has(order.id);
          const isSelected = selectedOrders.has(order.id);
          const paymentTransaction = order.payment_transactions?.[0];
          const customerPhone = order.customer_phone || order.profiles?.phone;

          return (
            <Card key={order.id} className="p-6">
              {/* Header Section */}
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                {/* Order Info with Checkbox */}
                <div className="flex gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelectOrder(order.id)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Order ID</p>
                    <p className="font-mono font-bold">{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {getOrderDate(order).toLocaleDateString()} {getOrderDate(order).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Customer</p>
                    {!order.user_id && order.customer_email && (
                      <Badge variant="outline" className="text-xs">Guest</Badge>
                    )}
                  </div>
                  
                  {/* Name */}
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-semibold">{order.customer_name || order.profiles?.name || "N/A"}</p>
                  </div>
                  
                  {/* Email */}
                  {(order.customer_email || order.profiles?.email) && (
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <a 
                        href={`mailto:${order.customer_email || order.profiles?.email}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {order.customer_email || order.profiles?.email}
                      </a>
                    </div>
                  )}
                  
                  {/* Phone */}
                  {customerPhone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <a href={`tel:${customerPhone}`} className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {customerPhone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Status Section */}
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Order Status</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(order.status)} className="text-sm px-2 py-1">
                        {order.status.toUpperCase()}
                      </Badge>
                      {order.payment_method === 'cod' && order.status === 'confirmed' && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1">
                          COD
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Select
                    value={order.status}
                    onValueChange={(value) =>
                      handleStatusChange(order.id, value as "pending" | "confirmed" | "paid" | "shipped" | "delivered" | "cancelled" | "send_confirmation")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_confirmation" className="bg-blue-50 font-semibold text-blue-700">
                        📧 Send Confirmation Email
                      </SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed (COD)</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteOrder(order.id)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Order
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendTelegramNotification(order.id)}
                    className="w-full"
                    disabled={order.status === 'pending'}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Send Telegram Notification
                  </Button>

                  {paymentTransaction && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Payment Status</p>
                      <Badge className={`${getPaymentStatusColor(paymentTransaction.status)} text-xs`}>
                        {paymentTransaction.status}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Address Section */}
              {order.address && (
                <div className="border-t pt-4 mb-4">
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Delivery Address</p>
                      <p className="text-sm mt-1 leading-relaxed">{order.address}</p>
                      {customerPhone && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <Phone className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <a 
                            href={`tel:${customerPhone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {customerPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Transaction Details */}
              {paymentTransaction && (
                <div className="border-t pt-4 mb-4">
                  <div className="flex items-start gap-2">
                    <CreditCard className="h-5 w-5 text-purple-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Payment Details</p>
                      <div className="grid md:grid-cols-2 gap-3 mt-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Transaction ID</p>
                          <p className="font-mono">{paymentTransaction.merchant_transaction_id?.slice(0, 12)}...</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="font-semibold">₹{(paymentTransaction.amount / 100).toFixed(2)}</p>
                        </div>
                        {paymentTransaction.response_code && (
                          <div>
                            <p className="text-xs text-muted-foreground">Response Code</p>
                            <p className="font-mono">{paymentTransaction.response_code}</p>
                          </div>
                        )}
                        {paymentTransaction.payment_method && (
                          <div>
                            <p className="text-xs text-muted-foreground">Payment Method</p>
                            <p className="font-medium">{paymentTransaction.payment_method}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items Section */}
              <div className="border-t pt-4">
                <button
                  onClick={() => toggleOrderExpanded(order.id)}
                  className="flex items-center gap-2 w-full text-left font-semibold mb-3 hover:text-blue-600 transition-colors"
                >
                  <Package className="h-5 w-5" />
                  <span>Order Items ({order.items?.length || 0})</span>
                  <span className="ml-auto text-2xl">{isExpanded ? "−" : "+"}</span>
                </button>

                {isExpanded && (
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                    {order.items?.map((item: any) => (
                      <div key={item.productId || item.id} className="flex justify-between items-center text-sm py-1">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">@ ₹{item.price}</p>
                        </div>
                      </div>
                    ))}

                    {/* Price Breakdown */}
                    <div className="space-y-2 pt-3 border-t mt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Items Total:</span>
                        <span className="font-medium">
                          ₹{(order.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0).toFixed(2)}
                        </span>
                      </div>
                      
                      {order.combo_discount_amount && order.combo_discount_amount > 0 && (
                        <div className="flex justify-between text-sm text-green-700">
                          <span>Combo Discount:</span>
                          <span className="font-medium">-₹{parseFloat(order.combo_discount_amount).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {order.discount_amount && order.discount_amount > 0 && (
                        <div className="flex justify-between text-sm text-green-700">
                          <span>Promo Discount:</span>
                          <span className="font-medium">-₹{parseFloat(order.discount_amount).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {order.shipping_charge !== undefined && order.shipping_charge !== null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping Charge:</span>
                          <span className="font-medium">₹{parseFloat(order.shipping_charge).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {order.cod_charge && order.cod_charge > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">COD Charge:</span>
                          <span className="font-medium">₹{parseFloat(order.cod_charge).toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Order Total:</span>
                        <span className="text-primary">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                      </div>
                      
                      {order.payment_method && (
                        <div className="flex justify-between text-xs pt-1">
                          <span className="text-muted-foreground">Payment Method:</span>
                          <Badge variant="outline" className="text-xs">
                            {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {fromDate || toDate ? "No orders found in the selected date range" : "No orders found"}
          </p>
        </Card>
      )}
    </div>
  );
};

export default OrdersTab;
