// DEPRECATED: This endpoint was for Supabase keep-alive
// No longer needed - using Firebase instead
// Original file preserved below but disabled

/*
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  success: boolean;
  message?: string;
  timestamp?: string;
  productCount?: number;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  return res.status(410).json({ 
    success: false, 
    error: 'This endpoint is deprecated. Supabase has been replaced with Firebase.' 
  });
}
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    console.log('[Keep-Alive] Running at:', new Date().toISOString());

    // Simple query to keep database active
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('[Keep-Alive] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Database query failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Database kept active',
      timestamp: new Date().toISOString(),
      productCount: count || 0
    });
  } catch (error) {
    console.error('[Keep-Alive] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Keep-alive failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
}
