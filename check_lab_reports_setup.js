import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSetup() {
  console.log('🔍 Checking Lab Reports Setup...\n');

  try {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('❌ Not logged in');
      console.log('👉 Please log in to the admin dashboard first\n');
      return;
    }

    console.log('✅ Logged in as:', session.user.email);
    console.log('   User ID:', session.user.id, '\n');

    // Check admin role
    const { data: roleData, error: roleError } = await supabase
      .rpc('has_role', { user_id: session.user.id, role_name: 'admin' });

    if (roleError) {
      console.log('❌ Error checking admin role:', roleError.message);
      console.log('👉 The has_role() function might not exist\n');
    } else {
      console.log(roleData ? '✅ User has admin role' : '❌ User does NOT have admin role');
      if (!roleData) {
        console.log('👉 Run assign_admin_role.js to grant admin role\n');
      } else {
        console.log('');
      }
    }

    // Check if lab_reports table exists
    const { data: tableData, error: tableError } = await supabase
      .from('lab_reports')
      .select('count')
      .limit(1);

    if (tableError) {
      console.log('❌ lab_reports table error:', tableError.message);
      console.log('👉 Run the migration: supabase/migrations/001_create_lab_reports_table.sql\n');
    } else {
      console.log('✅ lab_reports table exists\n');
    }

    // Check if storage bucket exists
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .getBucket('lab-reports');

    if (bucketError) {
      console.log('❌ Storage bucket error:', bucketError.message);
      console.log('👉 Bucket might not exist or have wrong name\n');
    } else {
      console.log('✅ Storage bucket "lab-reports" exists');
      console.log('   Public:', bucketData.public, '\n');
    }

    // Try to list files in bucket (tests read access)
    const { data: filesData, error: filesError } = await supabase
      .storage
      .from('lab-reports')
      .list('', { limit: 1 });

    if (filesError) {
      console.log('❌ Cannot list files in bucket:', filesError.message, '\n');
    } else {
      console.log('✅ Can list files in bucket\n');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSetup();
