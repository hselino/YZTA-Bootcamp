-- AI Career Coach - Onboarding profiles tablosu
-- Bunu Supabase Dashboard > SQL Editor'da calistir:
-- https://supabase.com/dashboard/project/prniwuudzwaofjfmrnpj/sql/new

CREATE TABLE IF NOT EXISTS profiles (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT,
  education     TEXT,
  target_role   TEXT,
  experience    TEXT,
  support_needs TEXT[],
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Kullanici kendi profilini gorebilir
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Kullanici kendi profilini olusturabilir/guncelleyebilir
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
