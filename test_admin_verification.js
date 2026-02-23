import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oikibnfnhauymhfpxiwi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pa2libmZuaGF1eW1oZnB4aXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NTExNTgsImV4cCI6MjA1MzEyNzE1OH0.U7FaI1E3M6FxwZCOZ1lRSvAiKL-kKW0e6Gk2qlZSkUY';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testAdminVerification() {
  try {
    console.log('Testing admin sign-in...');

    // Try to sign in as admin
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@freelit.com',
      password: 'admin123'
    });

    if (error) {
      console.error('Sign-in error:', error.message);
      return;
    }

    console.log('Sign-in successful:', data.user?.email);

    // Test admin verification via direct database query
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (verifyError) {
      console.error('Admin verification error:', verifyError);
    } else if (verifyData) {
      console.log('Admin verification result: User has admin role');
    } else {
      console.log('Admin verification result: User does NOT have admin role');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testAdminVerification();
