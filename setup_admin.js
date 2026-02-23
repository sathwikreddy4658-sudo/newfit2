import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import readline from 'readline';

const SUPABASE_URL = 'https://oikibnfnhauymhfpxiwi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pa2libmZuaGF1eW1oZnB4aXdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc4OTk1OCwiZXhwIjoyMDg3MzY1OTU4fQ.pIWEsWC7-C-Jk1uyKF6MZ2Nz65cW_w7W7mObY5AZGlI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupAdmin() {
  console.log('🔧 Setting up admin access...\n');

  // Step 1: Get your email/user ID
  console.log('📧 Enter your admin email address:');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Admin email: ', async (email) => {
    rl.close();
    
    if (!email) {
      console.log('❌ Email is required');
      return;
    }

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.log(`❌ User not found with email: ${email}`);
      console.log('   Make sure you have created an account first!');
      return;
    }

    console.log(`\n✅ Found user: ${profile.name || profile.email}`);
    console.log(`   ID: ${profile.id}\n`);

    // Step 2: Apply SQL to add is_admin column and policies
    console.log('📋 Go to: https://supabase.com/dashboard/project/osromibanfzzthdmhyzp/sql\n');
    console.log('📋 Copy and run this SQL:\n');
    console.log('─────────────────────────────────────────────────────────');
    
    const sql = readFileSync('supabase/migrations/20251118150000_add_admin_access.sql', 'utf8');
    console.log(sql);
    
    console.log('─────────────────────────────────────────────────────────\n');
    
    // Step 3: Show command to make user admin
    console.log('📋 After running the above SQL, run this command to make yourself admin:\n');
    console.log(`UPDATE profiles SET is_admin = true WHERE email = '${email}';\n`);
    
    console.log('✅ Then refresh your admin page - you will see all orders!\n');
  });
}

setupAdmin();
