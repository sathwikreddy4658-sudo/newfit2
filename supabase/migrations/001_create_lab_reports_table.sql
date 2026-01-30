-- Create lab_reports table
CREATE TABLE public.lab_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  test_type TEXT,
  test_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_lab_reports_product_id ON public.lab_reports(product_id);
CREATE INDEX idx_lab_reports_created_at ON public.lab_reports(created_at DESC);

-- Enable RLS
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

-- Lab reports policies
-- Anyone can view lab reports
CREATE POLICY "Anyone can view lab reports"
  ON public.lab_reports FOR SELECT
  USING (true);

-- Admins can insert lab reports
CREATE POLICY "Admins can insert lab reports"
  ON public.lab_reports FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update lab reports
CREATE POLICY "Admins can update lab reports"
  ON public.lab_reports FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete lab reports
CREATE POLICY "Admins can delete lab reports"
  ON public.lab_reports FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_lab_reports_updated_at
  BEFORE UPDATE ON public.lab_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for lab reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('lab-reports', 'lab-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for lab reports
CREATE POLICY "Public can view lab reports files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lab-reports');

CREATE POLICY "Admins can upload lab reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lab-reports' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete lab reports files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lab-reports' 
    AND public.has_role(auth.uid(), 'admin')
  );
