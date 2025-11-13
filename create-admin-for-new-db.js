/**
 * Script to create an admin user in the new database
 * 
 * Usage:
 * 1. First, sign up a user through your application
 * 2. Get the user's ID from Supabase Dashboard (Authentication > Users)
 * 3. Run this script: node create-admin-for-new-db.js
 * 4. Enter the user ID when prompted
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n==============================================');
console.log('CREATE ADMIN USER FOR NEW DATABASE');
console.log('==============================================\n');

console.log('This script will help you create an admin user in your new database.\n');

console.log('Prerequisites:');
console.log('1. You have created a new Supabase project');
console.log('2. You have applied the database schema');
console.log('3. You have signed up a user through your application');
console.log('4. You have the user\'s ID from Supabase Dashboard\n');

rl.question('Do you have all prerequisites ready? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('\nPlease complete the prerequisites first, then run this script again.');
    rl.close();
    return;
  }

  console.log('\n==============================================');
  console.log('STEP 1: Get User ID');
  console.log('==============================================\n');
  
  console.log('To get the user ID:');
  console.log('1. Go to your new Supabase project dashboard');
  console.log('2. Click on "Authentication" in the sidebar');
  console.log('3. Click on "Users"');
  console.log('4. Find the user you want to make admin');
  console.log('5. Copy their UUID (it looks like: 12345678-1234-1234-1234-123456789abc)\n');

  rl.question('Enter the user ID (UUID): ', (userId) => {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(userId.trim())) {
      console.log('\n❌ Invalid UUID format. Please run the script again with a valid UUID.');
      rl.close();
      return;
    }

    console.log('\n==============================================');
    console.log('STEP 2: Run SQL Query');
    console.log('==============================================\n');

    const sqlQuery = `
-- Assign admin role to user
INSERT INTO public.user_roles (user_id, role)
VALUES ('${userId.trim()}', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the role was assigned
SELECT 
  u.id,
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.id = '${userId.trim()}';
`;

    console.log('Copy and paste this SQL query into your Supabase SQL Editor:\n');
    console.log('─────────────────────────────────────────────');
    console.log(sqlQuery);
    console.log('─────────────────────────────────────────────\n');

    console.log('To run the query:');
    console.log('1. Go to your new Supabase project dashboard');
    console.log('2. Click on "SQL Editor" in the sidebar');
    console.log('3. Click "New Query"');
    console.log('4. Paste the SQL query above');
    console.log('5. Click "Run" (or press Ctrl+Enter)\n');

    console.log('If successful, you should see the user\'s email and role in the results.\n');

    console.log('==============================================');
    console.log('VERIFICATION');
    console.log('==============================================\n');

    console.log('To verify the admin role was assigned:');
    console.log('1. Log in to your application with this user');
    console.log('2. Try accessing admin-only features');
    console.log('3. Check if the admin dashboard is accessible\n');

    console.log('✅ Admin user creation instructions generated successfully!\n');

    rl.close();
  });
});
