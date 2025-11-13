/**
 * Hostinger SMTP Test Script
 *
 * This script tests your Hostinger SMTP configuration to verify it's working correctly.
 * Run this to diagnose email sending issues before testing with Supabase.
 */

import nodemailer from 'nodemailer';

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

const SMTP_CONFIG = {
  host: 'smtp.hostinger.com',
  port: 465, // You mentioned 462, but Hostinger typically uses 465 for SSL
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'care@freelit.com', // ⚠️ REPLACE with your full Hostinger email address
    pass: 'Sathwikreddy77wk$', // ⚠️ REPLACE with your email password
  }
};

const TEST_EMAIL = {
  from: '"Freelit" <care@freelit.com>', // ⚠️ REPLACE with your Hostinger email
  to: 'sathwikreddy4658@gmail.com', // ⚠️ REPLACE with your test email address
  subject: 'Hostinger SMTP Test - Freelit',
  text: 'If you receive this email, your Hostinger SMTP configuration is working correctly!',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">✅ Hostinger SMTP Test Successful!</h2>
      <p>If you're reading this, your Hostinger SMTP configuration is working correctly.</p>
      <p><strong>Configuration Details:</strong></p>
      <ul>
        <li>Host: ${SMTP_CONFIG.host}</li>
        <li>Port: ${SMTP_CONFIG.port}</li>
        <li>Secure: ${SMTP_CONFIG.secure ? 'Yes (SSL/TLS)' : 'No'}</li>
      </ul>
      <p>You can now use this configuration in your Supabase project.</p>
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This is a test email from Freelit application.<br>
        Sent via Hostinger SMTP
      </p>
    </div>
  `,
};

// ============================================
// TEST FUNCTION
// ============================================

async function testHostingerSMTP() {
  console.log('🔍 Testing Hostinger SMTP Configuration...\n');
  
  // Validate configuration
  console.log('📋 Configuration:');
  console.log(`   Host: ${SMTP_CONFIG.host}`);
  console.log(`   Port: ${SMTP_CONFIG.port}`);
  console.log(`   Secure: ${SMTP_CONFIG.secure ? 'Yes (SSL/TLS)' : 'No'}`);
  console.log(`   User: ${SMTP_CONFIG.auth.user}`);
  console.log(`   From: ${TEST_EMAIL.from}`);
  console.log(`   To: ${TEST_EMAIL.to}\n`);

  // Check if configuration needs to be updated
  if (SMTP_CONFIG.auth.user === 'your-email@yourdomain.com' || SMTP_CONFIG.auth.pass === 'your_email_password') {
    console.error('❌ ERROR: Please update the SMTP_CONFIG with your actual Hostinger credentials!');
    console.log('\n📝 Steps to get your credentials:');
    console.log('   1. Log in to your Hostinger account');
    console.log('   2. Go to Email section');
    console.log('   3. Use your full email address and password');
    console.log('   4. Update this script with your credentials\n');
    return;
  }

  if (TEST_EMAIL.from.includes('your-email@yourdomain.com') || TEST_EMAIL.to.includes('example.com')) {
    console.error('❌ ERROR: Please update TEST_EMAIL with your actual email addresses!');
    console.log('\n📝 Important:');
    console.log('   - "from" email must be your Hostinger email address');
    console.log('   - "to" email should be your actual test email address\n');
    return;
  }

  try {
    // Create transporter
    console.log('🔌 Creating SMTP transporter...');
    const transporter = nodemailer.createTransport(SMTP_CONFIG);

    // Verify connection
    console.log('🔐 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail(TEST_EMAIL);

    console.log('\n✅ SUCCESS! Email sent successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`📨 Response: ${info.response}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✨ Next Steps:');
    console.log('   1. Check your inbox at:', TEST_EMAIL.to);
    console.log('   2. If email arrived, your SMTP is working correctly!');
    console.log('   3. Use these same settings in Supabase Dashboard');
    console.log('   4. Go to: Supabase → Authentication → SMTP Settings');
    console.log('   5. Enter the configuration and save\n');

    console.log('📋 Supabase SMTP Settings:');
    console.log('   ┌─────────────────────────────────────────────');
    console.log(`   │ Host: ${SMTP_CONFIG.host}`);
    console.log(`   │ Port: ${SMTP_CONFIG.port}`);
    console.log(`   │ Username: ${SMTP_CONFIG.auth.user}`);
    console.log(`   │ Password: [Your email password]`);
    console.log(`   │ Sender Email: ${TEST_EMAIL.from.match(/<(.+)>/)?.[1] || TEST_EMAIL.from}`);
    console.log('   │ Sender Name: Freelit');
    console.log('   │ Enable TLS: ✓ Yes');
    console.log('   └─────────────────────────────────────────────\n');

  } catch (error) {
    console.error('\n❌ ERROR: Failed to send email\n');
    console.error('Error Details:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`Type: ${error.name}`);
    console.error(`Message: ${error.message}`);
    if (error.code) console.error(`Code: ${error.code}`);
    if (error.command) console.error(`Command: ${error.command}`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔧 Troubleshooting Tips:\n');

    if (error.message.includes('authentication') || error.message.includes('auth')) {
      console.log('❌ Authentication Error:');
      console.log('   • Verify your email address is correct (full address)');
      console.log('   • Verify your password is correct');
      console.log('   • Check if you need an app-specific password');
      console.log('   • Try logging into webmail to confirm credentials\n');
    }

    if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
      console.log('❌ Connection Error:');
      console.log('   • Check if port 465 is correct (not 462)');
      console.log('   • Try port 587 with secure:false instead');
      console.log('   • Verify your internet connection');
      console.log('   • Check if your ISP blocks SMTP ports\n');
    }

    if (error.message.includes('certificate') || error.message.includes('self signed')) {
      console.log('❌ SSL Certificate Error:');
      console.log('   • Try setting "secure: false" and "port: 587"');
      console.log('   • Add "tls: { rejectUnauthorized: false }" to SMTP_CONFIG (not secure for production)');
      console.log('   • Contact Hostinger support about their SSL certificate\n');
    }

    console.log('📚 Additional Resources:');
    console.log('   • Hostinger SMTP Docs: https://support.hostinger.com/en/articles/1583453-how-to-set-up-email-on-your-device');
    console.log('   • Hostinger Support: https://support.hostinger.com/');
    console.log('   • Nodemailer Docs: https://nodemailer.com/smtp/\n');
  }
}

// ============================================
// RUN TEST
// ============================================

console.log('╔════════════════════════════════════════════════╗');
console.log('║   Hostinger SMTP Configuration Test           ║');
console.log('║   For Freelit Application                      ║');
console.log('╚════════════════════════════════════════════════╝\n');

// Check if nodemailer is installed
try {
  import('nodemailer');
} catch (e) {
  console.error('❌ ERROR: nodemailer is not installed!');
  console.log('\n📦 Please install nodemailer first:');
  console.log('   npm install nodemailer\n');
  console.log('Then run this script again:');
  console.log('   node test_hostinger_smtp.js\n');
  process.exit(1);
}

// Run the test
testHostingerSMTP().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
