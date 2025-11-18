// Generate PhonePe OAuth Token for v2 API
// This token is needed for phonepe-check-status Edge Function

const PHONEPE_CLIENT_ID = 'SU2511071520405754774079';
const PHONEPE_CLIENT_SECRET = 'c70dce3a-c985-4237-add4-b8b9ad647bbf';

// Try both sandbox and production endpoints
const PHONEPE_SANDBOX_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';
const PHONEPE_PRODUCTION_URL = 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token';

async function generateToken() {
  console.log('🔐 Generating PhonePe OAuth Token...\n');

  // Try production first, then sandbox
  const endpoints = [
    { name: 'Production', url: PHONEPE_PRODUCTION_URL },
    { name: 'Sandbox', url: PHONEPE_SANDBOX_URL }
  ];

  for (const endpoint of endpoints) {
    console.log(`Trying ${endpoint.name} endpoint...`);
    
    try {
      // Create form data
      const formData = new URLSearchParams();
      formData.append('client_id', PHONEPE_CLIENT_ID);
      formData.append('client_version', '1');
      formData.append('client_secret', PHONEPE_CLIENT_SECRET);
      formData.append('grant_type', 'client_credentials');

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`  ❌ ${endpoint.name} failed: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      console.log(`\n✅ Token Generated Successfully from ${endpoint.name}!\n`);
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('📋 COPY THIS TOKEN TO SUPABASE:');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('Token (access_token):');
      console.log(data.access_token);
      console.log('\n═══════════════════════════════════════════════════════════════\n');
      
      console.log('📊 Token Details:');
      console.log(`   Environment: ${endpoint.name}`);
      console.log(`   Token Type: ${data.token_type}`);
      console.log(`   Issued At: ${new Date(data.issued_at * 1000).toLocaleString()}`);
      console.log(`   Expires At: ${new Date(data.expires_at * 1000).toLocaleString()}`);
      
      const expiresInHours = Math.round((data.expires_at - data.issued_at) / 3600);
      console.log(`   Valid For: ${expiresInHours} hours\n`);
      
      console.log('🔧 Next Steps:');
      console.log('1. Go to: https://supabase.com/dashboard/project/osromibanfzzthdmhyzp/settings/functions');
      console.log('2. Click "Add secret" or "New secret"');
      console.log('3. Add:');
      console.log('   Name: PHONEPE_AUTH_TOKEN');
      console.log(`   Value: ${data.access_token}`);
      console.log('4. Click "Save" or "Add secret"');
      console.log('\n⚠️  Remember: Token expires on', new Date(data.expires_at * 1000).toLocaleString());
      console.log('   You will need to regenerate and update it before expiry.\n');
      
      return; // Success, exit

    } catch (error) {
      console.log(`  ❌ ${endpoint.name} error:`, error.message);
    }
  }

  console.error('\n❌ Could not generate token from any endpoint');
  console.error('\n💡 Manual Token Generation:');
  console.error('1. Go to PhonePe Business Dashboard: https://business.phonepe.com');
  console.error('2. Navigate to Developer Settings');
  console.error('3. Generate OAuth token using:');
  console.error(`   Client ID: ${PHONEPE_CLIENT_ID}`);
  console.error('4. Copy the access_token from the response');
  console.error('5. Add it to Supabase as PHONEPE_AUTH_TOKEN');
}

generateToken();
