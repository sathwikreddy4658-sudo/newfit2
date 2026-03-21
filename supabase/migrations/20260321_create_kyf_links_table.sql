-- Create Know Your Food Links table
-- This migration creates a table to store admin-managed links for KYF subsections

CREATE TABLE IF NOT EXISTS public.kyf_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id VARCHAR(50) NOT NULL,
  subsection_id VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(section_id, subsection_id, title)
);

-- Add comment for clarity
COMMENT ON TABLE public.kyf_links IS 'Stores admin-managed links for Know Your Food page subsections';
COMMENT ON COLUMN public.kyf_links.section_id IS 'Section identifier (e.g., how-to-read, common-words, ingredient-terms)';
COMMENT ON COLUMN public.kyf_links.subsection_id IS 'Subsection identifier within the section';
COMMENT ON COLUMN public.kyf_links.title IS 'Display text for the link';
COMMENT ON COLUMN public.kyf_links.url IS 'URL the link points to';
COMMENT ON COLUMN public.kyf_links."order" IS 'Display order of links within a subsection';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_kyf_links_section ON public.kyf_links(section_id, subsection_id);

-- Enable RLS
ALTER TABLE public.kyf_links ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view KYF links)
CREATE POLICY "kyf_links_public_read" ON public.kyf_links
  FOR SELECT USING (true);

-- Admin-only write access
CREATE POLICY "kyf_links_admin_write" ON public.kyf_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "kyf_links_admin_update" ON public.kyf_links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "kyf_links_admin_delete" ON public.kyf_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
