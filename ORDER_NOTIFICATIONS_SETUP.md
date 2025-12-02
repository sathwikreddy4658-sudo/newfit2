# Order Notifications Setup Guide

## Overview
You now have real-time browser notifications that will alert you instantly when new orders are placed!

## Features
✅ **Real-time alerts** - Get notified within seconds of a new order
✅ **Browser notifications** - Works with Chrome, Firefox, Edge, Safari
✅ **Order details** - Shows order ID, total amount, and payment method
✅ **Click to view** - Clicking notification opens the admin orders page
✅ **In-app toast** - Also shows notification within the app
✅ **Toggle on/off** - Enable/disable notifications with one click
✅ **Auto-reconnect** - Maintains connection even if network drops

---

## Setup Steps

### 1. Enable Realtime in Supabase (REQUIRED)

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Replication**
3. Find the **`orders`** table in the list
4. Toggle the switch to **enable** Realtime for orders
5. Click **Save**

**Option B: Via SQL**
1. Go to **SQL Editor** in Supabase Dashboard
2. Paste the contents of `supabase/migrations/20251202_enable_orders_realtime.sql`
3. Run the query
4. Then follow Option A steps 2-5 above

---

### 2. Enable Browser Notifications

**In Chrome:**
1. Open your Admin Dashboard (`/admin/dashboard`)
2. Look for the **bell icon button** in the top-right corner (next to Logout)
3. Click **"Enable Notifications"**
4. Chrome will show a popup asking for permission
5. Click **"Allow"**
6. You'll see a test notification: "Order Notifications Active"
7. The button will change to **"Notifications On"** with a pulsing bell icon

**In Firefox:**
1. Same as Chrome steps above
2. Firefox shows the permission popup at the top-left of the address bar

**In Edge:**
1. Same as Chrome steps above

**In Safari (macOS):**
1. Safari may ask for permission differently
2. Go to Safari → Preferences → Websites → Notifications
3. Allow notifications for your site

---

## How It Works

### When a New Order is Placed:

1. **Browser Notification** appears with:
   - Title: "🎉 New Order Received!"
   - Body: Order ID, total amount, payment method
   - Icon: Your site favicon
   - Sound: Notification sound (if browser allows)

2. **In-App Toast** shows simultaneously:
   - "🎉 New Order Received!"
   - Order details

3. **Click Actions**:
   - Click notification → Opens admin orders page
   - Auto-closes after 10 seconds if not clicked

### Notification Example:
```
🎉 New Order Received!
Order #a1b2c3d4 - ₹899
Payment: COD
```

---

## Using the Notifications Toggle

### Enable Notifications:
- Click the bell icon button
- If first time: Browser asks for permission → Click "Allow"
- Button shows: **"Notifications On"** (bell pulsing)
- Status: Active - You'll receive alerts

### Disable Notifications:
- Click the bell icon button again
- Button shows: **"Enable Notifications"** (bell crossed out)
- Status: Inactive - No alerts

### Re-enable:
- Click the button again
- Instantly reactivates (no permission needed again)

---

## Troubleshooting

### "Notifications not working"
**Check:**
1. ✅ Realtime enabled in Supabase? (Database → Replication → orders → ON)
2. ✅ Browser permission granted? (Click bell icon to check)
3. ✅ Admin dashboard page open? (Notifications only work when page is open)
4. ✅ Browser supports notifications? (Chrome, Firefox, Edge, Safari do)

**Fix:**
- Refresh the admin dashboard page
- Click bell icon to re-enable
- Check browser console for errors (F12)

### "Permission denied"
**Cause:** You clicked "Block" on the browser permission popup

**Fix:**
1. Click the lock icon in your browser's address bar
2. Find "Notifications" setting
3. Change from "Block" to "Allow"
4. Refresh the page
5. Click bell icon again

### "Notification doesn't show order details"
**Check:** Make sure the orders table has all these columns:
- `id` (UUID)
- `total_price` (numeric)
- `payment_method` (text)

### "Sound not playing"
**Note:** Sound requires adding a notification sound file:
1. Add a file named `notification.mp3` to your `public/` folder
2. Or remove the audio code from `OrderNotifications.tsx` (lines 36-40)

---

## Testing

### Test the Notification System:

1. **Enable notifications** in admin dashboard
2. **Open a new browser tab/window**
3. **Place a test order** as a customer:
   - Go to your store
   - Add items to cart
   - Complete checkout
4. **Check admin dashboard** tab
5. **You should see:**
   - Browser notification popup
   - In-app toast message
   - New order appears in Orders tab

### Test with Multiple Devices:
- Open admin dashboard on laptop → Enable notifications
- Use phone to place order
- Laptop shows notification instantly

---

## Best Practices

### Keep Admin Dashboard Open:
- Notifications only work when the admin dashboard page is open
- Keep it open in a pinned tab for constant monitoring

### Enable Notifications on All Admin Accounts:
- If you have multiple admins, each should enable notifications
- Each admin gets their own notification

### Check Browser Settings:
- Make sure "Do Not Disturb" is OFF
- Check OS notification settings (Windows/Mac)
- Ensure browser notifications are not blocked system-wide

### Use Multiple Tabs:
- You can have multiple admin dashboard tabs open
- Each will show notifications

---

## Technical Details

### Real-time Technology:
- **Supabase Realtime** - WebSocket connection
- **PostgreSQL** - Database triggers
- **Browser Notifications API** - Native browser feature

### Performance:
- **Latency:** < 1 second from order placement to notification
- **Bandwidth:** Minimal (only sends changed data)
- **Battery:** Efficient (uses native browser APIs)

### Security:
- Only authenticated admin users see notifications
- RLS policies ensure data security
- No sensitive data stored in notifications

---

## Advanced Configuration

### Customize Notification Duration:
Edit `src/components/OrderNotifications.tsx`, line 50:
```typescript
setTimeout(() => {
  notification.close();
}, 10000); // Change 10000 to desired milliseconds (e.g., 5000 = 5 seconds)
```

### Customize Notification Sound:
Add your own sound file:
1. Place `notification.mp3` in `public/` folder
2. Or change line 37 to use a different file:
   ```typescript
   const audio = new Audio("/your-sound.mp3");
   ```

### Customize Notification Text:
Edit lines 26-32 in `OrderNotifications.tsx`:
```typescript
const notification = new Notification("Your Custom Title!", {
  body: `Your custom body text`,
  // ... other options
});
```

### Add Order Sound for Specific Payment Methods:
```typescript
// Play different sounds for COD vs Online
const soundFile = order.payment_method === 'online' 
  ? '/online-payment.mp3' 
  : '/cod-payment.mp3';
const audio = new Audio(soundFile);
```

---

## Files Modified

### Created:
1. **`src/components/OrderNotifications.tsx`** (161 lines)
   - React component with notification logic
   - Supabase Realtime subscription
   - Browser Notification API integration

2. **`supabase/migrations/20251202_enable_orders_realtime.sql`**
   - Enables Realtime replication for orders table

3. **`ORDER_NOTIFICATIONS_SETUP.md`** (this file)
   - Complete documentation and setup guide

### Modified:
1. **`src/pages/admin/AdminDashboard.tsx`**
   - Added OrderNotifications component to header
   - Placed between title and logout button

---

## FAQ

**Q: Do notifications work when browser is minimized?**
A: Yes! Browser notifications appear even when the window is minimized or in the background.

**Q: Do I need to keep the tab active?**
A: No, but the tab must be open. You can switch to other tabs and still receive notifications.

**Q: Can I get notifications on mobile?**
A: Yes, if you open the admin dashboard on a mobile browser (Chrome/Firefox/Safari).

**Q: Do notifications work offline?**
A: No, you need an active internet connection. However, notifications will resume when connection is restored.

**Q: Can I customize the notification icon?**
A: Yes, edit line 29 in `OrderNotifications.tsx`:
```typescript
icon: "/your-icon.png", // Change this
```

**Q: How many notifications can I receive at once?**
A: Browsers typically limit to 3-4 simultaneous notifications. Older ones auto-close when new ones arrive.

**Q: Do notifications expire?**
A: Yes, they auto-close after 10 seconds if not clicked (configurable).

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console (F12) for error messages
3. Verify Supabase Realtime is enabled
4. Test with a fresh browser window
5. Check OS notification permissions

---

## Summary

✅ Real-time notifications when orders are placed
✅ Works with Chrome, Firefox, Edge, Safari
✅ One-click toggle to enable/disable
✅ Shows order details instantly
✅ Click notification to view full order
✅ Minimal setup required

**Next Steps:**
1. Enable Realtime in Supabase Dashboard
2. Open Admin Dashboard
3. Click bell icon to enable notifications
4. Test by placing an order!

🎉 **You're all set!** You'll now be notified instantly when customers place orders.
