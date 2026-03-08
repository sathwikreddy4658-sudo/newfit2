// Keep-alive endpoint to prevent Supabase free-tier project from pausing
// Triggered daily by Vercel cron: "0 0 * * *"

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(200).json({ status: 'skipped', reason: 'env vars not set' });
    }

    // Ping Supabase with a lightweight query to keep the project active
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const status = response.status;
    return res.status(200).json({
      status: 'ok',
      supabase_status: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Don't fail the cron - just log it
    return res.status(200).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};
