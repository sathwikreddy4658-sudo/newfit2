#!/usr/bin/env node

/**
 * Supabase to Firebase Migration Script
 * Exports all data from Supabase and uploads to Firebase Firestore
 */

import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'firebase-admin-key.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error(`   URL: ${supabaseUrl ? '✅' : '❌'}`);
  console.error(`   Key: ${supabaseKey ? '✅' : '❌'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

let stats = {
  total: 0,
  successful: 0,
  failed: 0,
  errors: [],
};

/**
 * Migrate profiles table to users collection
 */
async function migrateProfiles() {
  console.log('\n📦 Migrating Profiles...');
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) {
    console.error('❌ Error fetching profiles:', error);
    stats.errors.push(`Profiles: ${error.message}`);
    return;
  }

  for (const profile of data || []) {
    stats.total++;
    try {
      const user = {
        ...profile,
        createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
        updatedAt: profile.updated_at ? new Date(profile.updated_at) : new Date(),
      };

      delete user.created_at;
      delete user.updated_at;

      await db.collection('users').doc(profile.id).set(user);
      stats.successful++;
      console.log(`  ✅ ${profile.id}`);
    } catch (err) {
      stats.failed++;
      stats.errors.push(`Profile ${profile.id}: ${err.message}`);
      console.error(`  ❌ ${profile.id}:`, err.message);
    }
  }
  console.log(`  Total: ${data?.length || 0}`);
}

/**
 * Migrate products table
 */
async function migrateProducts() {
  console.log('\n📦 Migrating Products...');
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('❌ Error fetching products:', error);
    stats.errors.push(`Products: ${error.message}`);
    return;
  }

  for (const product of data || []) {
    stats.total++;
    try {
      const prod = {
        ...product,
        createdAt: product.created_at ? new Date(product.created_at) : new Date(),
        updatedAt: product.updated_at ? new Date(product.updated_at) : new Date(),
      };

      delete prod.created_at;
      delete prod.updated_at;

      await db.collection('products').doc(product.id).set(prod);
      stats.successful++;
      console.log(`  ✅ ${product.name}`);
    } catch (err) {
      stats.failed++;
      stats.errors.push(`Product ${product.id}: ${err.message}`);
      console.error(`  ❌ ${product.id}:`, err.message);
    }
  }
  console.log(`  Total: ${data?.length || 0}`);
}

/**
 * Migrate orders table
 */
async function migrateOrders() {
  console.log('\n📦 Migrating Orders...');
  const { data, error } = await supabase.from('orders').select('*');
  if (error) {
    console.error('❌ Error fetching orders:', error);
    stats.errors.push(`Orders: ${error.message}`);
    return;
  }

  for (const order of data || []) {
    stats.total++;
    try {
      const ord = {
        ...order,
        createdAt: order.created_at ? new Date(order.created_at) : new Date(),
        updatedAt: order.updated_at ? new Date(order.updated_at) : new Date(),
      };

      delete ord.created_at;
      delete ord.updated_at;

      await db.collection('orders').doc(order.id).set(ord);
      stats.successful++;
      console.log(`  ✅ Order ${order.id}`);
    } catch (err) {
      stats.failed++;
      stats.errors.push(`Order ${order.id}: ${err.message}`);
      console.error(`  ❌ ${order.id}:`, err.message);
    }
  }
  console.log(`  Total: ${data?.length || 0}`);
}

/**
 * Migrate promo_codes table
 */
async function migratePromoCodes() {
  console.log('\n📦 Migrating Promo Codes...');
  const { data, error } = await supabase.from('promo_codes').select('*');
  if (error) {
    console.error('❌ Error fetching promo codes:', error);
    stats.errors.push(`PromoCode: ${error.message}`);
    return;
  }

  for (const code of data || []) {
    stats.total++;
    try {
      const promo = {
        ...code,
        createdAt: code.created_at ? new Date(code.created_at) : new Date(),
        updatedAt: code.updated_at ? new Date(code.updated_at) : new Date(),
        expiresAt: code.expires_at ? new Date(code.expires_at) : null,
      };

      delete promo.created_at;
      delete promo.updated_at;
      delete promo.expires_at;

      await db.collection('promoCodes').doc(code.id).set(promo);
      stats.successful++;
      console.log(`  ✅ ${code.code}`);
    } catch (err) {
      stats.failed++;
      stats.errors.push(`PromoCode ${code.id}: ${err.message}`);
      console.error(`  ❌ ${code.id}:`, err.message);
    }
  }
  console.log(`  Total: ${data?.length || 0}`);
}

/**
 * Migrate blogs table
 */
async function migrateBlogs() {
  console.log('\n📦 Migrating Blogs...');
  const { data, error } = await supabase.from('blogs').select('*');
  if (error) {
    console.error('❌ Error fetching blogs:', error);
    stats.errors.push(`Blogs: ${error.message}`);
    return;
  }

  for (const blog of data || []) {
    stats.total++;
    try {
      const bl = {
        ...blog,
        createdAt: blog.created_at ? new Date(blog.created_at) : new Date(),
        updatedAt: blog.updated_at ? new Date(blog.updated_at) : new Date(),
      };

      delete bl.created_at;
      delete bl.updated_at;

      await db.collection('blogs').doc(blog.id).set(bl);
      stats.successful++;
      console.log(`  ✅ ${blog.title}`);
    } catch (err) {
      stats.failed++;
      stats.errors.push(`Blog ${blog.id}: ${err.message}`);
      console.error(`  ❌ ${blog.id}:`, err.message);
    }
  }
  console.log(`  Total: ${data?.length || 0}`);
}

/**
 * Migrate lab_reports table
 */
async function migrateLabReports() {
  console.log('\n📦 Migrating Lab Reports...');
  const { data, error } = await supabase.from('lab_reports').select('*');
  if (error) {
    console.error('❌ Error fetching lab reports:', error);
    stats.errors.push(`LabReport: ${error.message}`);
    return;
  }

  for (const report of data || []) {
    stats.total++;
    try {
      const rep = {
        ...report,
        createdAt: report.created_at ? new Date(report.created_at) : new Date(),
        updatedAt: report.updated_at ? new Date(report.updated_at) : new Date(),
      };

      delete rep.created_at;
      delete rep.updated_at;

      await db
        .collection('products')
        .doc(report.product_id)
        .collection('labReports')
        .doc(report.id)
        .set(rep);
      stats.successful++;
      console.log(`  ✅ ${report.id}`);
    } catch (err) {
      stats.failed++;
      stats.errors.push(`LabReport ${report.id}: ${err.message}`);
      console.error(`  ❌ ${report.id}:`, err.message);
    }
  }
  console.log(`  Total: ${data?.length || 0}`);
}

/**
 * Migrate product_faqs table
 */
async function migrateProductFAQs() {
  console.log('\n📦 Migrating Product FAQs...');
  const { data, error } = await supabase.from('product_faqs').select('*');
  if (error) {
    console.error('❌ Error fetching FAQs:', error);
    stats.errors.push(`ProductFAQ: ${error.message}`);
    return;
  }

  for (const faq of data || []) {
    stats.total++;
    try {
      const f = {
        ...faq,
        createdAt: faq.created_at ? new Date(faq.created_at) : new Date(),
        updatedAt: faq.updated_at ? new Date(faq.updated_at) : new Date(),
      };

      delete f.created_at;
      delete f.updated_at;

      await db
        .collection('products')
        .doc(faq.product_id)
        .collection('faqs')
        .doc(faq.id)
        .set(f);
      stats.successful++;
      console.log(`  ✅ ${faq.id}`);
    } catch (err) {
      stats.failed++;
      stats.errors.push(`ProductFAQ ${faq.id}: ${err.message}`);
      console.error(`  ❌ ${faq.id}:`, err.message);
    }
  }
  console.log(`  Total: ${data?.length || 0}`);
}

/**
 * Migrate product_ratings table
 */
async function migrateRatings() {
  console.log('\n📦 Migrating Product Ratings...');
  const { data, error } = await supabase.from('product_ratings').select('*');
  if (error) {
    console.error('❌ Error fetching ratings:', error);
    stats.errors.push(`ProductRating: ${error.message}`);
    return;
  }

  for (const rating of data || []) {
    stats.total++;
    try {
      const rat = {
        ...rating,
        createdAt: rating.created_at ? new Date(rating.created_at) : new Date(),
        updatedAt: rating.updated_at ? new Date(rating.updated_at) : new Date(),
      };

      delete rat.created_at;
      delete rat.updated_at;

      await db
        .collection('products')
        .doc(rating.product_id)
        .collection('ratings')
        .doc(rating.id)
        .set(rat);
      stats.successful++;
      console.log(`  ✅ ${rating.id}`);
    } catch (err) {
      stats.failed++;
      stats.errors.push(`ProductRating ${rating.id}: ${err.message}`);
      console.error(`  ❌ ${rating.id}:`, err.message);
    }
  }
  console.log(`  Total: ${data?.length || 0}`);
}

/**
 * Migrate payment_transactions table
 */
async function migratePaymentTransactions() {
  console.log('\n📦 Migrating Payment Transactions...');
  const { data, error } = await supabase
    .from('payment_transactions')
    .select('*');
  if (error) {
    console.error('❌ Error fetching payment transactions:', error);
    stats.errors.push(`PaymentTransaction: ${error.message}`);
    return;
  }

  for (const transaction of data || []) {
    stats.total++;
    try {
      const trans = {
        ...transaction,
        createdAt: transaction.created_at
          ? new Date(transaction.created_at)
          : new Date(),
        updatedAt: transaction.updated_at
          ? new Date(transaction.updated_at)
          : new Date(),
      };

      delete trans.created_at;
      delete trans.updated_at;

      await db.collection('paymentTransactions').doc(transaction.id).set(trans);
      stats.successful++;
      console.log(`  ✅ ${transaction.id}`);
    } catch (err) {
      stats.failed++;
      stats.errors.push(`PaymentTransaction ${transaction.id}: ${err.message}`);
      console.error(`  ❌ ${transaction.id}:`, err.message);
    }
  }
  console.log(`  Total: ${data?.length || 0}`);
}

/**
 * Migrate newsletter_subscribers table
 */
async function migrateNewsletterSubscribers() {
  console.log('\n📦 Migrating Newsletter Subscribers...');
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*');
  if (error) {
    console.error('❌ Error fetching subscribers:', error);
    stats.errors.push(`Subscriber: ${error.message}`);
    return;
  }

  for (const subscriber of data || []) {
    stats.total++;
    try {
      const sub = {
        ...subscriber,
        createdAt: subscriber.created_at
          ? new Date(subscriber.created_at)
          : new Date(),
        subscribedAt: subscriber.subscribed_at
          ? new Date(subscriber.subscribed_at)
          : new Date(),
      };

      delete sub.created_at;
      delete sub.subscribed_at;

      await db.collection('subscribers').doc(subscriber.id).set(sub);
      stats.successful++;
      console.log(`  ✅ ${subscriber.email}`);
    } catch (err) {
      stats.failed++;
      stats.errors.push(`Subscriber ${subscriber.id}: ${err.message}`);
      console.error(`  ❌ ${subscriber.id}:`, err.message);
    }
  }
  console.log(`  Total: ${data?.length || 0}`);
}

/**
 * Migrate user_roles table
 */
async function migrateUserRoles() {
  console.log('\n📦 Migrating User Roles...');
  const { data, error } = await supabase.from('user_roles').select('*');
  if (error) {
    console.error('❌ Error fetching user roles:', error);
    stats.errors.push(`UserRole: ${error.message}`);
    return;
  }

  for (const role of data || []) {
    stats.total++;
    try {
      const r = {
        ...role,
        createdAt: role.created_at ? new Date(role.created_at) : new Date(),
      };

      delete r.created_at;

      await db.collection('userRoles').doc(role.id).set(r);
      stats.successful++;
      console.log(`  ✅ ${role.id}`);
    } catch (err) {
      stats.failed++;
      stats.errors.push(`UserRole ${role.id}: ${err.message}`);
      console.error(`  ❌ ${role.id}:`, err.message);
    }
  }
  console.log(`  Total: ${data?.length || 0}`);
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    console.log('🚀 Starting Supabase to Firebase Migration...');
    console.log('='.repeat(50));

    await migrateProfiles();
    await migrateProducts();
    await migrateOrders();
    await migratePromoCodes();
    await migrateBlogs();
    await migrateLabReports();
    await migrateProductFAQs();
    await migrateRatings();
    await migratePaymentTransactions();
    await migrateNewsletterSubscribers();
    await migrateUserRoles();

    console.log('\n' + '='.repeat(50));
    console.log('✅ Migration Complete!');
    console.log(`📊 Statistics:`);
    console.log(`   Total Records: ${stats.total}`);
    console.log(`   Successful: ${stats.successful} ✅`);
    console.log(`   Failed: ${stats.failed} ❌`);

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      stats.errors.forEach((err) => console.log(`   - ${err}`));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
