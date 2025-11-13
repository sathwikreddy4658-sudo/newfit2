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

async function assignAdminRole() {
  try {
    // Query the user from profiles table instead
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'admin@freelit.com')
      .single();

    if (userError || !userData) {
      console.error('Error finding admin user:', userError);
      return;
    }

    console.log('Found admin user:', userData.id);

    // Assign admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userData.id,
        role: 'admin'
      });

    if (roleError) {
      console.error('Error assigning admin role:', roleError);
    } else {
      console.log('Admin role assigned successfully');
    }

    // Create profile if it doesn't exist
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userData.id,
        name: 'Admin User',
        email: 'admin@freelit.com',
        address: 'Admin Address'
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    } else {
      console.log('Profile created/updated successfully');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

assignAdminRole();
