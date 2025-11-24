import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Phone, MapPin, CreditCard, Package, Trash2, Download, FileSpreadsheet, Bell, BellOff } from "lucide-react";

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
    fetchOrders();

    const channel = supabase
      .channel("admin-orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log('Order change detected:', payload);
          fetchOrders();
          
          // If it's a new order (INSERT event), show notification
          if (payload.eventType === 'INSERT' && notificationsEnabled && !isInitialLoad.current) {
            playNotificationSound();
            showNewOrderNotification(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
        body: `Order ID: ${orderData.id.slice(0, 8)} | Amount: ₹${orderData.total_price}`,
        icon: '/icon.png',
        tag: orderData.id,
        requireInteraction: true
      });
    }

    // Toast notification
    toast({
      title: "🎉 New Order Received!",
      description: `Order ID: ${orderData.id.slice(0, 8)} | Amount: ₹${orderData.total_price}`,
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
      filtered = filtered.filter(order => new Date(order.created_at) >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => new Date(order.created_at) <= to);
    }

    setFilteredOrders(filtered);
    // Clear selections when filter changes
    setSelectedOrders(new Set());
  };

  const fetchOrders = async () => {
    // Fetch orders with order_items only (profiles might not have FK relationship)
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Failed to fetch orders:", ordersError);
      toast({ title: "Failed to load orders", description: ordersError.message, variant: "destructive" });
      return;
    }

    if (!ordersData) {
      setOrders([]);
      return;
    }

    // Try to fetch additional data (profiles and payment_transactions) separately
    // This won't fail if tables don't exist or relationships aren't set up
    const orderIds = ordersData.map(o => o.id);
    const userIds = [...new Set(ordersData.map(o => o.user_id))];

    // Fetch profiles separately
    let profilesMap: any = {};
    try {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);
      
      if (profilesData) {
        profilesMap = Object.fromEntries(profilesData.map(p => [p.id, p]));
      }
    } catch (e) {
      console.warn("Could not fetch profiles:", e);
    }

    // Fetch payment_transactions separately
    let paymentsMap: any = {};
    try {
      const { data: paymentsData } = await supabase
        .from("payment_transactions")
        .select("*")
        .in("order_id", orderIds);
      
      if (paymentsData) {
        paymentsData.forEach(p => {
          if (!paymentsMap[p.order_id]) {
            paymentsMap[p.order_id] = [];
          }
          paymentsMap[p.order_id].push(p);
        });
      }
    } catch (e) {
      console.warn("Could not fetch payment transactions:", e);
    }

    // Combine the data
    const enrichedOrders = ordersData.map(order => ({
      ...order,
      profiles: profilesMap[order.user_id] || null,
      payment_transactions: paymentsMap[order.id] || []
    }));

    setOrders(enrichedOrders);
    setFilteredOrders(enrichedOrders);
    
    // Track order count for new order detection
    if (isInitialLoad.current) {
      setLastOrderCount(enrichedOrders.length);
      isInitialLoad.current = false;
    } else if (enrichedOrders.length > lastOrderCount) {
      // New orders detected
      const newOrdersCount = enrichedOrders.length - lastOrderCount;
      if (notificationsEnabled && newOrdersCount > 0) {
        playNotificationSound();
      }
      setLastOrderCount(enrichedOrders.length);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: "pending" | "confirmed" | "paid" | "shipped" | "delivered" | "cancelled" | "send_confirmation") => {
    // Handle the special "send confirmation email" action
    if (newStatus === "send_confirmation") {
      await handleSendConfirmationEmail(orderId);
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Status update failed", variant: "destructive" });
    } else {
      toast({ title: "Order status updated" });
      fetchOrders();
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
      `Total: ₹${order.total_price}\n` +
      `Items: ${order.order_items.length} product(s)`
    );

    if (!confirmed) return;

    toast({ 
      title: "Sending email...", 
      description: "Please wait" 
    });

    try {
      // Call our email API endpoint
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api/send-email'  // Local development
        : 'https://freelit.in/api/send-email'; // Production - your actual domain
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          customerEmail: customerEmail,
          customerName: order.customer_name || order.profiles?.name || "Customer",
          totalPrice: order.total_price,
          orderItems: order.order_items,
          address: order.address,
          paymentMethod: order.payment_id && order.payment_id.startsWith('COD-') ? 'COD' : 'Online Payment',
          createdAt: order.created_at
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
        await supabase
          .from("orders")
          .update({ status: "confirmed" })
          .eq("id", orderId);

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

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      return;
    }

    // Delete order items first (foreign key constraint)
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    if (itemsError) {
      toast({ title: "Failed to delete order items", variant: "destructive" });
      return;
    }

    // Delete the order
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (error) {
      toast({ title: "Failed to delete order", variant: "destructive" });
    } else {
      toast({ title: "Order deleted successfully" });
      fetchOrders();
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

      // Delete order_items first
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .in("order_id", orderIds);

      if (itemsError) throw itemsError;

      // Delete orders
      const { error: ordersError } = await supabase
        .from("orders")
        .delete()
        .in("id", orderIds);

      if (ordersError) throw ordersError;

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

      // Delete all order_items first
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .in("order_id", orderIds);

      if (itemsError) throw itemsError;

      // Delete all orders
      const { error: ordersError } = await supabase
        .from("orders")
        .delete()
        .in("id", orderIds);

      if (ordersError) throw ordersError;

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
      const isCOD = order.payment_id && order.payment_id.startsWith('COD-');
      const paymentMethod = isCOD ? "COD" : "Online Payment";

      return [
        order.id,
        new Date(order.created_at).toLocaleString(),
        order.customer_name || order.profiles?.name || "Guest",
        order.customer_email || order.profiles?.email || "",
        customerPhone,
        order.status.toUpperCase(),
        paymentMethod,
        order.total_price,
        order.address || "",
        order.order_items?.length || 0
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
      const isCOD = order.payment_id && order.payment_id.startsWith('COD-');
      const paymentMethod = isCOD ? "COD" : "Online Payment";
      const customerName = order.customer_name || order.profiles?.name || "Guest";
      const customerEmail = order.customer_email || order.profiles?.email || "";
      const date = new Date(order.created_at).toLocaleString();

      if (order.order_items && order.order_items.length > 0) {
        order.order_items.forEach((item: any, index: number) => {
          detailedRows.push([
            index === 0 ? order.id.slice(0, 8) : "",
            index === 0 ? date : "",
            index === 0 ? customerName : "",
            index === 0 ? customerEmail : "",
            index === 0 ? customerPhone : "",
            index === 0 ? order.status.toUpperCase() : "",
            index === 0 ? paymentMethod : "",
            index === 0 ? order.address || "" : "",
            item.product_name,
            item.quantity.toString(),
            item.product_price.toString(),
            (item.product_price * item.quantity).toFixed(2),
            index === 0 ? order.total_price.toString() : ""
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
          order.total_price.toString()
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
                      {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}
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
                      {order.payment_id && order.payment_id.startsWith('COD-') && order.status === 'confirmed' && (
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
                  <span>Order Items ({order.order_items.length})</span>
                  <span className="ml-auto text-2xl">{isExpanded ? "−" : "+"}</span>
                </button>

                {isExpanded && (
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-sm py-1">
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{(item.product_price * item.quantity).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">@ ₹{item.product_price}</p>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between font-bold pt-3 border-t mt-3">
                      <span>Order Total:</span>
                      <span className="text-lg">₹{parseFloat(order.total_price).toFixed(2)}</span>
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
