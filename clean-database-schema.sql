-- =====================================================
-- CLEAN DATABASE SCHEMA - Handles Existing Objects
-- =====================================================

-- Drop existing objects if they exist (be careful!)
-- Uncomment these lines if you want to start completely fresh:

-- DROP TABLE IF EXISTS public.payment_transactions CASCADE;
-- DROP TABLE IF EXISTS public.rating_votes CASCADE;
-- DROP TABLE IF EXISTS public.product_ratings CASCADE;
-- DROP TABLE IF EXISTS public.promo_code_usage CASCADE;
-- DROP TABLE IF EXISTS public.promo_codes CASCADE;
-- DROP TABLE IF EXISTS public.newsletter_subscribers CASCADE;
-- DROP TABLE IF EXISTS public.blogs CASCADE;
-- DROP TABLE IF EXISTS public.order_items CASCADE;
-- DROP TABLE IF EXISTS public.orders CASCADE;
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP TABLE IF EXISTS public.user_roles CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- DROP TYPE IF EXISTS public.payment_method CASCADE;
-- DROP TYPE IF EXISTS public.payment_status CASCADE;
-- DROP TYPE IF EXISTS public.app_role CASCADE;
-- DROP TYPE IF EXISTS public.order_status CASCADE;
-- DROP TYPE IF EXISTS public.product_category CASCADE;

-- =====================================================
-- CREATE ENUMS (only if they don't exist)
-- =====================================================

DO $$ BEGIN
    CREATE TYPE public.product_category AS ENUM ('protein_bars', 'dessert_bars', 'chocolates');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('pending', 'shipped', 'delivered', 'cancelled', 'paid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_method AS ENUM ('UPI', 'CARD', 'NET_BANKING', 'WALLET', 'PAY_PAGE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CREATE TABLES (only if they don't exist)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  address TEXT,
  favorites UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category public.product_category NOT NULL,
  price DECIMAL(10,2),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  nutrition TEXT NOT NULL,
  protein TEXT,
  sugar TEXT,
  calories TEXT,
  weight TEXT,
  shelf_life TEXT,
  allergens TEXT,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  image_main TEXT,
  image_nutrition TEXT,
  image_ingredients TEXT,
  min_order_quantity INTEGER DEFAULT 1 CHECK (min_order_quantity > 0),
  price_variants JSONB DEFAULT '[]'::jsonb,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  payment_id TEXT,
  address TEXT NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subheadline TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  active BOOLEAN DEFAULT true,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.promo_code_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(promo_code_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.product_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.rating_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rating_id UUID NOT NULL REFERENCES public.product_ratings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(rating_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  merchant_transaction_id TEXT NOT NULL UNIQUE,
  phonepe_transaction_id TEXT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status public.payment_status NOT NULL DEFAULT 'INITIATED',
  payment_method public.payment_method,
  payment_instrument JSONB,
  response_code TEXT,
  response_message TEXT,
  phonepe_response JSONB,
  callback_received BOOLEAN DEFAULT FALSE,
  callback_data JSONB,
  refund_amount INTEGER DEFAULT 0,
  refund_transaction_id TEXT,
  refund_status TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- INDEXES (only create if they don't exist)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.promo_codes(active);
CREATE INDEX IF NOT EXISTS idx_product_ratings_product_id ON public.product_ratings(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ratings_user_id ON public.product_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_product_ratings_approved ON public.product_ratings(approved);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_merchant_txn_id ON public.payment_transactions(merchant_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_phonepe_txn_id ON public.payment_transactions(phonepe_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);

-- =====================================================
-- FUNCTIONS (create or replace)
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'address', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_payment_transaction(
  p_order_id UUID,
  p_merchant_transaction_id TEXT,
  p_amount INTEGER,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id) THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  INSERT INTO payment_transactions (
    order_id,
    merchant_transaction_id,
    amount,
    status,
    metadata
  )
  VALUES (
    p_order_id,
    p_merchant_transaction_id,
    p_amount,
    'INITIATED',
    p_metadata
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_payment_transaction_status(
  p_merchant_transaction_id TEXT,
  p_status payment_status,
  p_phonepe_transaction_id TEXT DEFAULT NULL,
  p_payment_method payment_method DEFAULT NULL,
  p_response_code TEXT DEFAULT NULL,
  p_response_message TEXT DEFAULT NULL,
  p_phonepe_response JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
BEGIN
  UPDATE payment_transactions
  SET
    status = p_status,
    phonepe_transaction_id = COALESCE(p_phonepe_transaction_id, phonepe_transaction_id),
    payment_method = COALESCE(p_payment_method, payment_method),
    response_code = COALESCE(p_response_code, response_code),
    response_message = COALESCE(p_response_message, response_message),
    phonepe_response = COALESCE(p_phonepe_response, phonepe_response),
    completed_at = CASE WHEN p_status IN ('SUCCESS', 'FAILED', 'CANCELLED') THEN now() ELSE completed_at END,
    updated_at = now()
  WHERE merchant_transaction_id = p_merchant_transaction_id
  RETURNING order_id INTO v_order_id;

  IF p_status = 'SUCCESS' AND v_order_id IS NOT NULL THEN
    UPDATE orders
    SET
      status = 'paid'::order_status,
      paid = true
    WHERE id = v_order_id;
  END IF;

  RETURN FOUND;
END;
$$;

-- =====================================================
-- TRIGGERS (drop and recreate to avoid conflicts)
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_blogs_updated_at ON public.blogs;
CREATE TRIGGER update_blogs_updated_at
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON public.promo_codes;
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_ratings_updated_at ON public.product_ratings;
CREATE TRIGGER update_product_ratings_updated_at
  BEFORE UPDATE ON public.product_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (enable and create policies)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view profiles for ratings" ON public.profiles;

DROP POLICY IF EXISTS "Anyone can view non-hidden products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;

DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

DROP POLICY IF EXISTS "Blogs are viewable by everyone" ON public.blogs;
DROP POLICY IF EXISTS "Admins can manage blogs" ON public.blogs;

DROP POLICY IF EXISTS "Allow admins to manage promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Allow authenticated users to view active promo codes" ON public.promo_codes;

DROP POLICY IF EXISTS "Users can view their own promo code usage" ON public.promo_code_usage;
DROP POLICY IF EXISTS "Users can insert their own promo code usage" ON public.promo_code_usage;
DROP POLICY IF EXISTS "Admins can view all promo code usage" ON public.promo_code_usage;

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can view all subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can manage subscribers" ON public.newsletter_subscribers;

DROP POLICY IF EXISTS "Users can view approved ratings" ON public.product_ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON public.product_ratings;
DROP POLICY IF EXISTS "Users can update their own approved ratings" ON public.product_ratings;
DROP POLICY IF EXISTS "Admins can view all ratings" ON public.product_ratings;
DROP POLICY IF EXISTS "Admins can update all ratings" ON public.product_ratings;
DROP POLICY IF EXISTS "Admins can delete ratings" ON public.product_ratings;

DROP POLICY IF EXISTS "Users can view all rating votes" ON public.rating_votes;
DROP POLICY IF EXISTS "Authenticated users can vote on ratings" ON public.rating_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON public.rating_votes;

DROP POLICY IF EXISTS "Users can view their own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins can view all payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins can insert payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins can update payment transactions" ON public.payment_transactions;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view profiles for ratings"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view non-hidden products"
  ON public.products FOR SELECT
  USING (is_hidden = false OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all orders"
  ON public.orders FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for their orders"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Blogs are viewable by everyone"
  ON public.blogs FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage blogs"
  ON public.blogs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow admins to manage promo codes"
  ON public.promo_codes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow authenticated users to view active promo codes"
  ON public.promo_codes FOR SELECT
  USING (auth.uid() IS NOT NULL AND active = true);

CREATE POLICY "Users can view their own promo code usage"
  ON public.promo_code_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own promo code usage"
  ON public.promo_code_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all promo code usage"
  ON public.promo_code_usage FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all subscribers"
  ON public.newsletter_subscribers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage subscribers"
  ON public.newsletter_subscribers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view approved ratings"
  ON public.product_ratings FOR SELECT
  USING (approved = true);

CREATE POLICY "Users can insert their own ratings"
  ON public.product_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own approved ratings"
  ON public.product_ratings FOR UPDATE
  USING (auth.uid() = user_id AND approved = true);

CREATE POLICY "Admins can view all ratings"
  ON public.product_ratings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all ratings"
  ON public.product_ratings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ratings"
  ON public.product_ratings FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view all rating votes"
  ON public.rating_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote on ratings"
  ON public.rating_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.rating_votes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own payment transactions"
  ON public.payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payment_transactions.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payment transactions"
  ON public.payment_transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert payment transactions"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payment transactions"
  ON public.payment_transactions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- STORAGE
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- Create storage policies
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND public.has_role(auth.uid(), 'admin')
  );

-- =====================================================
-- REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.payment_transactions IS 'Stores all payment transaction details from PhonePe';
COMMENT ON COLUMN public.payment_transactions.amount IS 'Amount in paisa (1 INR = 100 paisa)';
COMMENT ON COLUMN public.payment_transactions.merchant_transaction_id IS 'Unique transaction ID generated by merchant';
COMMENT ON COLUMN public.payment_transactions.phonepe_transaction_id IS 'Transaction ID from PhonePe';

-- =====================================================
-- END OF CLEAN SCHEMA
-- =====================================================
