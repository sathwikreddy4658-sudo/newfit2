#!/usr/bin/env node

/**
 * Setup script to create the blog-images bucket in Supabase
 * Run this with: node setup-blog-bucket.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupBlogBucket() {
  try {
    console.log('🔧 Setting up blog-images bucket...');

    // Create the bucket if it doesn't exist
    const { data, error: createError } = await supabase.storage.createBucket('blog-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 5242880, // 5MB
    });

    if (createError) {
      // Bucket might already exist
      if (createError.message.includes('already exists')) {
        console.log('✅ Bucket blog-images already exists');
      } else {
        console.error('❌ Error creating bucket:', createError.message);
        process.exit(1);
      }
    } else {
      console.log('✅ Bucket blog-images created successfully');
    }

    // Update bucket to be public (if not already)
    const { data: updateData, error: updateError } = await supabase.storage.updateBucket('blog-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 5242880, // 5MB
    });

    if (updateError) {
      console.error('⚠️  Warning updating bucket settings:', updateError.message);
    } else {
      console.log('✅ Bucket permissions updated');
    }

    console.log('\n✅ Blog bucket setup complete!');
    console.log('\nYou can now upload images to the blog admin page.');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupBlogBucket();
