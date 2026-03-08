#!/usr/bin/env node

/**
 * View and manage blog posts data
 * Run this with: node view-blog-data.js <command>
 * 
 * Commands:
 *   list      - List all blog titles
 *   count     - Count total blog posts
 *   details   - Show full details of all posts
 *   backup    - Create backup of all data
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function listBlogs() {
  const { data, error } = await supabase.from('blogs').select('id, title, created_at');
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('📭 No blog posts yet');
    return;
  }

  console.log(`\n📚 ${data.length} Blog Post(s):\n`);
  data.forEach((blog, i) => {
    console.log(`${i + 1}. ${blog.title}`);
    console.log(`   ID: ${blog.id}`);
    console.log(`   Created: ${new Date(blog.created_at).toLocaleDateString()}\n`);
  });
}

async function countBlogs() {
  const { count, error } = await supabase
    .from('blogs')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`\n📊 Total Blog Posts: ${count}\n`);
}

async function showDetails() {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('📭 No blog posts yet');
    return;
  }

  console.log(`\n📄 FULL BLOG DATA (${data.length} posts):\n`);
  console.log('='.repeat(80));

  data.forEach((blog, index) => {
    console.log(`\n[${index + 1}] ${blog.title.toUpperCase()}`);
    console.log('-'.repeat(80));
    console.log(`ID: ${blog.id}`);
    console.log(`Created: ${new Date(blog.created_at).toLocaleString()}`);
    console.log(`Updated: ${new Date(blog.updated_at).toLocaleString()}`);
    if (blog.image_url) {
      console.log(`Image URL: ${blog.image_url}`);
    }
    if (blog.cta_heading) {
      console.log(`CTA Heading: ${blog.cta_heading}`);
    }
    if (blog.links && Array.isArray(blog.links) && blog.links.length > 0) {
      console.log(`CTA Links:`);
      blog.links.forEach((link, i) => {
        console.log(`  ${i + 1}. ${link.text} → ${link.url}`);
      });
    }
    console.log(`\nContent Preview: ${blog.content.substring(0, 200)}...`);
    console.log();
  });

  console.log('='.repeat(80));
}

async function backupData() {
  const { data, error } = await supabase.from('blogs').select('*');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  const backupDir = path.join(process.cwd(), 'blog_backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const backupFile = path.join(backupDir, `blog_backup_${timestamp}.json`);

  const backup = {
    timestamp: new Date().toISOString(),
    total_posts: data?.length || 0,
    blogs: data || []
  };

  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  console.log(`\n✅ Backup created: ${backupFile}`);
  console.log(`   Posts backed up: ${data?.length || 0}`);
}

async function main() {
  const command = process.argv[2] || 'list';

  console.log('🚀 Blog Data Manager\n');

  switch (command) {
    case 'list':
      await listBlogs();
      break;
    case 'count':
      await countBlogs();
      break;
    case 'details':
      await showDetails();
      break;
    case 'backup':
      await backupData();
      break;
    default:
      console.log('Available commands:');
      console.log('  node view-blog-data.js list     - List all blog titles\n');
      console.log('  node view-blog-data.js count    - Count total posts\n');
      console.log('  node view-blog-data.js details  - Show full details\n');
      console.log('  node view-blog-data.js backup   - Create backup\n');
  }
}

main().catch(console.error);
