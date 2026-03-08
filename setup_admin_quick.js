import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function assignAdminRoleSQL() {
  try {
    const adminEmail = 'sathwikreddypapaigari@gmail.com';
    
    console.log(`🔍 Assigning admin role to: ${adminEmail}\n`);

    // Use RPC call or direct lookup from profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', adminEmail);

    if (profileError) {
      console.error('❌ Error finding user:', profileError.message);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.error(`❌ User not found with email: ${adminEmail}`);
      console.log('\n💡 Make sure the user has already signed up in the application first!');
      return;
    }

    const userId = profiles[0].id;
    console.log(`✅ Found user ID: ${userId}`);
    console.log(`   Email: ${adminEmail}\n`);

    // Assign admin role
    console.log('🔐 Assigning admin role...\n');

    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'admin'
      }, {
        onConflict: 'user_id,role'
      });

    if (roleError) {
      console.error('❌ Error assigning admin role:', roleError.message);
      return;
    }

    // Verify the role was assigned
    const { data: roles, error: verifyError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (verifyError || !roles || roles.length === 0) {
      console.error('❌ Failed to verify admin role');
      return;
    }

    console.log('✅ Admin role assigned successfully!');
    console.log(`\n📋 User Details:`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Role: admin`);
    console.log(`   Assigned at: ${roles[0].created_at}`);
    console.log('\n✨ The user can now access admin features in your application!');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

assignAdminRoleSQL();
