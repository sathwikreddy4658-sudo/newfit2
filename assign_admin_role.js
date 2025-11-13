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
    // Get the user by email using listUsers and filter
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('Error listing users:', userError);
      return;
    }

    const adminUser = users.users.find(user => user.email === 'admin@freelit.com');

    if (!adminUser) {
      console.error('Admin user not found');
      return;
    }

    console.log('Found admin user:', adminUser.id);

    // Assign admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: adminUser.id,
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
        id: adminUser.id,
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
