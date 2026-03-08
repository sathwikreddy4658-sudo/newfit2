#!/usr/bin/env node

/**
 * Final Admin Setup - For When Database Schema is Ready
 * This creates the admin user role in the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = 'sathwikreddypapaigari@gmail.com';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupAdminUser() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🔐 ADMIN USER SETUP');
    console.log('='.repeat(70) + '\n');

    console.log(`Setting up admin user: ${adminEmail}\n`);

    // Try to find existing user
    console.log('🔍 Looking for user in database...\n');

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('email', adminEmail);

    if (profileError || !profiles || profiles.length === 0) {
      console.error(`❌ User not found with email: ${adminEmail}`);
      console.error('\n⚠️  IMPORTANT: The user must exist first!');
      console.error('\nPlease:');
      console.error('1. Go to your application');
      console.error('2. Sign up with the email: ' + adminEmail);
      console.error('3. Come back and run this script again\n');
      return;
    }

    const userId = profiles[0].id;
    const userName = profiles[0].name || 'N/A';

    console.log('✅ Found user:');
    console.log(`   ID: ${userId}`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Name: ${userName}\n`);

    // Check if role already exists
    console.log('🔐 Checking admin role...\n');

    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (existingRole && existingRole.length > 0) {
      console.log('✅ Admin role already assigned!');
      console.log(`   Role assigned at: ${existingRole[0].created_at}\n`);
      console.log('User already has admin privileges! 🎉\n');
      return;
    }

    // Assign admin role
    console.log('📝 Assigning admin role...\n');

    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin'
      });

    if (roleError) {
      console.error('❌ Error assigning admin role:', roleError.message);
      return;
    }

    // Verify
    const { data: verifyRole, error: verifyError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (verifyError || !verifyRole || verifyRole.length === 0) {
      console.error('❌ Failed to verify admin role');
      return;
    }

    console.log('✅ Admin role assigned successfully!\n');
    console.log('═'.repeat(70));
    console.log('📋 ADMIN USER DETAILS');
    console.log('═'.repeat(70));
    console.log(`Email:           ${adminEmail}`);
    console.log(`User ID:         ${userId}`);
    console.log(`Name:            ${userName}`);
    console.log(`Role:            admin`);
    console.log(`Assigned at:     ${verifyRole[0].created_at}`);
    console.log('═'.repeat(70));
    console.log('\n✨ Admin setup complete!');
    console.log('\nYou can now:');
    console.log('✓ Log in to your application');
    console.log('✓ Access admin dashboard');
    console.log('✓ Manage products, orders, and other admin features\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

setupAdminUser();
