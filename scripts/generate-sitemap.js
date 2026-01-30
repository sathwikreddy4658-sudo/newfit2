import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { config } from "dotenv";

// Load .env file if it exists
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const siteUrl = process.env.SITE_URL || "https://freelit.in"; // Change to your domain

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Missing Supabase credentials in environment variables"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function generateSitemap() {
  try {
    console.log("📡 Fetching products from Supabase...");

    // Fetch all non-hidden products
    const { data: products, error } = await supabase
      .from("products")
      .select("name, updated_at, is_hidden")
      .eq("is_hidden", false);

    if (error) {
      console.error("❌ Error fetching products:", error.message);
      process.exit(1);
    }

    console.log(`✅ Found ${products.length} products`);

    // Build sitemap XML
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    const staticPages = [
      { url: "/", priority: "1.0", changefreq: "weekly" },
      { url: "/products", priority: "0.9", changefreq: "weekly" },
      { url: "/about", priority: "0.5", changefreq: "monthly" },
      { url: "/contact", priority: "0.5", changefreq: "monthly" },
      { url: "/privacy", priority: "0.3", changefreq: "yearly" },
    ];

    staticPages.forEach((page) => {
      const lastmod = new Date().toISOString().split("T")[0];
      sitemapXml += `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    });

    // Add dynamic product pages
    products.forEach((product) => {
      // Convert product name to URL-friendly format (matching your routing)
      const productUrl = encodeURIComponent(product.name);
      const lastmod = product.updated_at
        ? new Date(product.updated_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      sitemapXml += `  <url>
    <loc>${siteUrl}/product/${productUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    sitemapXml += `</urlset>`;

    // Write to public folder
    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const sitemapPath = path.join(publicDir, "sitemap.xml");
    fs.writeFileSync(sitemapPath, sitemapXml);

    console.log(`✅ Sitemap generated: ${sitemapPath}`);
    console.log(`📊 Total URLs: ${staticPages.length + products.length}`);
  } catch (error) {
    console.error("❌ Error generating sitemap:", error);
    process.exit(1);
  }
}

generateSitemap();
