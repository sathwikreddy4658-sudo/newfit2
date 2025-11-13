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

async function createAdminUser() {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@freelit.com',
      password: 'admin123', // Use a strong password in production
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        name: 'Admin User'
      }
    });

    if (error) {
      console.error('Error creating admin user:', error);
    } else {
      console.log('Admin user created successfully:', data.user);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createAdminUser();
