-- ─────────────────────────────────────────────
-- SNAPSAVE PRO — Database Schema
-- Run this in your Supabase SQL Editor
-- ─────────────────────────────────────────────

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id               UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name        TEXT,
  username         TEXT UNIQUE,
  avatar_url       TEXT,
  country          TEXT,
  download_count_ig INTEGER DEFAULT 0,
  download_count_yt INTEGER DEFAULT 0,
  last_reset_date  DATE DEFAULT CURRENT_DATE,   -- used for daily quota reset
  is_pro           BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- 2. Row Level Security
-- ─────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read any profile (public leaderboard etc.)
CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT USING (true);

-- Users can only insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Service role (backend) can update any profile (for quota tracking)
CREATE POLICY "profiles_update_service_role" ON profiles
  FOR UPDATE USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────
-- 3. Auto-create profile on signup trigger
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, last_reset_date)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    CURRENT_DATE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- 4. Atomic quota increment RPC
-- Call from backend: supabase.rpc("increment_download_count", {...})
-- This prevents race conditions from simultaneous requests
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_download_count(
  p_user_id  UUID,
  p_platform TEXT   -- 'instagram' or 'youtube'
)
RETURNS void AS $$
DECLARE
  v_today       DATE := CURRENT_DATE;
  v_last_reset  DATE;
  v_field       TEXT;
BEGIN
  -- Determine which counter to increment
  IF p_platform = 'instagram' THEN
    v_field := 'download_count_ig';
  ELSE
    v_field := 'download_count_yt';
  END IF;

  -- Fetch last reset date
  SELECT last_reset_date INTO v_last_reset
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;  -- row-level lock prevents race conditions

  -- Reset counters if it's a new day
  IF v_last_reset IS DISTINCT FROM v_today THEN
    UPDATE public.profiles
    SET
      download_count_ig = 0,
      download_count_yt = 0,
      last_reset_date   = v_today
    WHERE id = p_user_id;
  END IF;

  -- Atomically increment the correct field
  EXECUTE format(
    'UPDATE public.profiles SET %I = %I + 1 WHERE id = $1',
    v_field, v_field
  ) USING p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
