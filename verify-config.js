// Configuration Verification Script
// Run this to check your production configuration before deployment

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔍 PRODUCTION CONFIGURATION CHECK\n');
console.log('='.repeat(50));

// Check 1: OrdersTab.tsx production URL
console.log('\n1️⃣  Checking OrdersTab.tsx API URL...');
try {
  const ordersTabPath = path.join(__dirname, 'src/components/admin/OrdersTab.tsx');
  const ordersTabContent = fs.readFileSync(ordersTabPath, 'utf8');
  
  if (ordersTabContent.includes("'https://freelit.in/api/send-email'")) {
    console.log('   ✅ Production URL: https://freelit.in/api/send-email');
  } else if (ordersTabContent.includes('yourdomain.com')) {
    console.log('   ❌ ERROR: Still contains placeholder "yourdomain.com"');
    console.log('   → Update line with production domain');
  } else {
    console.log('   ⚠️  WARNING: Could not verify production URL');
  }
} catch (error) {
  console.log('   ❌ ERROR: Could not read OrdersTab.tsx');
}

// Check 2: Email template configuration
console.log('\n2️⃣  Checking Email Template config...');
try {
  const templatePath = path.join(__dirname, 'api/emailTemplate.js');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  
  // Extract config values
  const storeNameMatch = templateContent.match(/storeName:\s*['"]([^'"]+)['"]/);
  const emailMatch = templateContent.match(/storeEmail:\s*['"]([^'"]+)['"]/);
  const websiteMatch = templateContent.match(/websiteUrl:\s*['"]([^'"]+)['"]/);
  
  console.log('   ✅ Store Name:', storeNameMatch?.[1] || 'Not set');
  console.log('   ✅ Store Email:', emailMatch?.[1] || 'Not set');
  console.log('   ✅ Website URL:', websiteMatch?.[1] || 'Not set');
  
  if (websiteMatch?.[1] !== 'https://freelit.in') {
    console.log('   ⚠️  Website URL should be: https://freelit.in');
  }
} catch (error) {
  console.log('   ❌ ERROR: Could not read emailTemplate.js');
}

// Check 3: Environment variables
console.log('\n3️⃣  Checking .env.email...');
try {
  const envPath = path.join(__dirname, '.env.email');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  console.log('   ✅ SMTP_USER:', envContent.includes('SMTP_USER=') ? 'Set' : '❌ Missing');
  console.log('   ✅ SMTP_PASS:', envContent.includes('SMTP_PASS=') ? 'Set' : '❌ Missing');
  console.log('   ✅ PORT:', envContent.includes('PORT=') ? 'Set' : '⚠️  Optional');
  
  if (envContent.includes('care@freelit.in')) {
    console.log('   ✅ Email configured: care@freelit.in');
  }
} catch (error) {
  console.log('   ❌ ERROR: .env.email not found');
  console.log('   → Create .env.email with SMTP credentials');
}

// Check 4: Server endpoints
console.log('\n4️⃣  Checking server.js endpoints...');
try {
  const serverPath = path.join(__dirname, 'server.js');
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  const endpoints = [
    { route: '/api/send-email', found: serverContent.includes("'/api/send-email'") },
    { route: '/api/test-email', found: serverContent.includes("'/api/test-email'") },
    { route: '/api/health', found: serverContent.includes("'/api/health'") }
  ];
  
  endpoints.forEach(ep => {
    console.log(`   ${ep.found ? '✅' : '❌'} ${ep.route}`);
  });
  
  if (serverContent.includes('port 3001')) {
    console.log('   ✅ Server port: 3001');
  }
} catch (error) {
  console.log('   ❌ ERROR: Could not read server.js');
}

// Check 5: CSP in index.html
console.log('\n5️⃣  Checking Content Security Policy...');
try {
  const indexPath = path.join(__dirname, 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  if (indexContent.includes('connect-src') && indexContent.includes('localhost')) {
    console.log('   ✅ CSP allows localhost for development');
  }
  
  if (indexContent.includes('freelit.in') || indexContent.includes("connect-src 'self'")) {
    console.log('   ✅ CSP allows production domain');
  } else {
    console.log('   ⚠️  May need to add production domain to CSP');
  }
} catch (error) {
  console.log('   ❌ ERROR: Could not read index.html');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📋 SUMMARY\n');

console.log('Files to deploy on backend server:');
console.log('  • server.js');
console.log('  • api/send-email.js');
console.log('  • api/emailTemplate.js ⭐ (customize this!)');
console.log('  • .env.email (or set env vars)\n');

console.log('Frontend deployment:');
console.log('  • Run: npm run build');
console.log('  • Upload: dist/* to hosting\n');

console.log('DNS Records needed (Hostinger):');
console.log('  • SPF: v=spf1 include:_spf.hosting.hostinger.com ~all');
console.log('  • DMARC: v=DMARC1; p=none; rua=mailto:care@freelit.in');
console.log('  • DKIM: Enable in Hostinger control panel\n');

console.log('Test checklist:');
console.log('  1. Deploy server and get it running');
console.log('  2. Test: curl https://freelit.in/api/health');
console.log('  3. Build frontend: npm run build');
console.log('  4. Deploy frontend to hosting');
console.log('  5. Send test email to: test-17hb62vei@srv1.mail-tester.com');
console.log('  6. Check score at: https://www.mail-tester.com');
console.log('  7. Add DNS records if score < 8');
console.log('  8. Wait 24 hours for DNS propagation');
console.log('  9. Re-test with mail-tester\n');

console.log('='.repeat(50));
console.log('\n✅ Ready to deploy!\n');
console.log('📖 See EMAIL_PRODUCTION_GUIDE.md for detailed steps');
console.log('📝 See QUICK_DEPLOY_REFERENCE.md for quick commands\n');
