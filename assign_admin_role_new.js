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

async function assignAdminRole() {
  try {
    const adminEmail = 'sathwikreddypapaigari@gmail.com';
    
    console.log(`🔍 Looking for user with email: ${adminEmail}\n`);

    // Find user by email from auth.users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error fetching users:', listError);
      return;
    }

    const adminUser = users.find(u => u.email === adminEmail);

    if (!adminUser) {
      console.error(`❌ User not found with email: ${adminEmail}`);
      console.log('\n💡 Make sure the user has already signed up in the application first!');
      return;
    }

    console.log(`✅ Found user: ${adminUser.email}`);
    console.log(`   ID: ${adminUser.id}\n`);

    // Assign admin role to user_roles table
    console.log('🔐 Assigning admin role...\n');

    const { data, error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: adminUser.id,
        role: 'admin'
      });

    if (roleError) {
      console.error('❌ Error assigning admin role:', roleError);
      return;
    }

    console.log('✅ Admin role assigned successfully!');
    console.log(`\n📋 User Details:`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   User ID: ${adminUser.id}`);
    console.log(`   Role: admin`);
    console.log('\n✨ The user can now access admin features in your application!');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

assignAdminRole();
