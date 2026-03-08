#!/usr/bin/env node

/**
 * Export blog posts data to JSON file
 * Run this with: node export-blog-data.js
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

async function exportBlogData() {
  try {
    console.log('📥 Fetching blog posts from database...\n');

    // Fetch all blogs with all columns
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching blogs:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No blog posts found in database');
      console.log('\n📝 You can now:');
      console.log('   1. Go to Admin Dashboard → Blogs');
      console.log('   2. Click "Add New Blog"');
      console.log('   3. Create your first blog post');
      return;
    }

    console.log(`✅ Found ${data.length} blog post(s)\n`);

    // Display data in console
    console.log('📋 BLOG DATA:');
    console.log('=' .repeat(80));
    data.forEach((blog, index) => {
      console.log(`\n[Blog ${index + 1}]`);
      console.log(`Title: ${blog.title}`);
      console.log(`ID: ${blog.id}`);
      console.log(`Created: ${new Date(blog.created_at).toLocaleString()}`);
      console.log(`Updated: ${new Date(blog.updated_at).toLocaleString()}`);
      if (blog.image_url) console.log(`Image: ${blog.image_url}`);
      if (blog.cta_heading) console.log(`CTA Heading: ${blog.cta_heading}`);
      if (blog.links && Array.isArray(blog.links) && blog.links.length > 0) {
        console.log(`CTA Links: ${JSON.stringify(blog.links)}`);
      }
      console.log(`Content Length: ${blog.content.length} characters`);
    });
    console.log('\n' + '='.repeat(80));

    // Export to JSON file
    const exportData = {
      exported_at: new Date().toISOString(),
      total_posts: data.length,
      blogs: data
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = path.join(process.cwd(), `blog_export_${timestamp}.json`);
    
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`\n✅ Data exported to: ${exportPath}`);

    // Also create CSV for easy spreadsheet viewing
    const csvPath = path.join(process.cwd(), `blog_export_${timestamp}.csv`);
    const csvHeader = 'ID,Title,Created Date,Updated Date,Image URL,CTA Heading,Links Count\n';
    const csvRows = data.map(blog => {
      const linksCount = blog.links ? blog.links.length : 0;
      return `"${blog.id}","${blog.title.replace(/"/g, '""')}","${new Date(blog.created_at).toLocaleString()}","${new Date(blog.updated_at).toLocaleString()}","${blog.image_url || ''}","${blog.cta_heading || 'Learn More'}",${linksCount}`;
    }).join('\n');
    
    fs.writeFileSync(csvPath, csvHeader + csvRows);
    console.log(`✅ CSV also created: ${csvPath}`);

    console.log('\n📊 SUMMARY:');
    console.log(`   • Total blogs: ${data.length}`);
    console.log(`   • Latest post: ${data[0] ? data[0].title : 'None'}`);
    console.log(`   • Oldest post: ${data[data.length - 1] ? data[data.length - 1].title : 'None'}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

console.log('🚀 Blog Export Tool\n');
exportBlogData();
