import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://osromibanfzzthdmhyzp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcm9taWJhbmZ6enRoZG1oeXpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgzMDMyOSwiZXhwIjoyMDc4NDA2MzI5fQ.I1P1jpiI5hHe5Hue57p1i8_kkQEC3a8tWtPJQUTpdTk';

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

    // Test admin verification
    const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-admin', {
      headers: {
        Authorization: `Bearer ${data.session?.access_token}`,
      },
    });

    if (verifyError) {
      console.error('Admin verification error:', verifyError);
    } else {
      console.log('Admin verification result:', verifyData);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testAdminVerification();
