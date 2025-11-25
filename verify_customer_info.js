// Script to verify customer info in orders and alert on missing data
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCustomerInfo() {
  console.log('Checking orders for missing customer information...\n');

  // Get orders from the last 24 hours
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, customer_name, customer_email, customer_phone, created_at, user_id')
    .gte('created_at', yesterday.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  console.log(`Found ${orders.length} orders in the last 24 hours\n`);

  const missingInfo = [];

  orders.forEach(order => {
    const issues = [];
    
    if (!order.customer_email) {
      issues.push('email');
    }
    if (!order.customer_name) {
      issues.push('name');
    }
    if (!order.customer_phone) {
      issues.push('phone');
    }

    if (issues.length > 0) {
      missingInfo.push({
        orderId: order.id,
        userId: order.user_id,
        createdAt: order.created_at,
        missing: issues
      });
    }
  });

  if (missingInfo.length === 0) {
    console.log('✅ All orders have complete customer information!');
  } else {
    console.log(`⚠️  Found ${missingInfo.length} orders with missing information:\n`);
    
    missingInfo.forEach(issue => {
      console.log(`Order ID: ${issue.orderId.slice(0, 8)}...`);
      console.log(`User ID: ${issue.userId || 'GUEST'}`);
      console.log(`Created: ${new Date(issue.createdAt).toLocaleString()}`);
      console.log(`Missing: ${issue.missing.join(', ')}`);
      console.log('---');
    });

    // Attempt to recover missing info from profiles
    console.log('\nAttempting to recover missing information...\n');
    console.log('Note: Auto-recovery requires manual Supabase admin access.');
    console.log('Please check the orders manually in your Supabase dashboard.\n');

    for (const issue of missingInfo) {
      if (issue.userId) {
        // Try to get info from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', issue.userId)
          .single();

        if (!profileError && profile) {
          const updates = {};
          
          if (issue.missing.includes('name') && profile?.full_name) {
            updates.customer_name = profile.full_name;
          }
          if (issue.missing.includes('phone') && profile?.phone) {
            updates.customer_phone = profile.phone;
          }

          if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
              .from('orders')
              .update(updates)
              .eq('id', issue.orderId);

            if (!updateError) {
              console.log(`✅ Recovered info for order ${issue.orderId.slice(0, 8)}: ${Object.keys(updates).join(', ')}`);
            } else {
              console.error(`❌ Failed to update order ${issue.orderId.slice(0, 8)}:`, updateError);
            }
          }
        }
        
        // Note about email - requires admin access to auth.users
        if (issue.missing.includes('email')) {
          console.log(`📧 Order ${issue.orderId.slice(0, 8)} missing email - check Supabase Auth users table manually`);
        }
      }
    }
  }
}

verifyCustomerInfo().catch(console.error);
