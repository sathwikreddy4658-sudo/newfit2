import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://osromibanfzzthdmhyzp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_KEY; // Use the service role key

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAdminRole() {
  try {
    // Check if admin user exists and has role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'admin');

    if (roleError) {
      console.error('Error checking admin roles:', roleError);
      return;
    }

    console.log('Current admin roles:', roleData);

    // Check profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@freelit.com');

    if (profileError) {
      console.error('Error checking profiles:', profileError);
      return;
    }

    console.log('Admin profiles:', profileData);

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkAdminRole();
