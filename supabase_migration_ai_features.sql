-- AI Career Coach - Mulakat Simulasyonu ve LinkedIn Optimizasyonu icin gerekli tablolar
-- Bunu Supabase Dashboard > SQL Editor'da calistir:
-- https://supabase.com/dashboard/project/prniwuudzwaofjfmrnpj/sql/new
--
-- Not: "interviews" tablosu daha once elle (dashboard uzerinden) olusturuldugu icin
-- burada sadece eksik kolonlari ekliyoruz, tabloyu yeniden yaratmiyoruz.

-- 1) interview_sessions: devam eden / tamamlanmis tekil mulakat oturumu (soru + cevap + degerlendirme)
CREATE TABLE IF NOT EXISTS interview_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position    TEXT NOT NULL,
  difficulty  TEXT NOT NULL,
  questions   JSONB NOT NULL DEFAULT '[]',
  answers     JSONB NOT NULL DEFAULT '[]',
  status      TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' | 'completed'
  report      JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own interview sessions"
  ON interview_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2) interviews: tamamlanmis mulakatlarin ozet gecmisi (mevcut tabloya eksik kolonlari ekle)
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS overall_score INT;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS report JSONB;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 3) linkedin_analyses: LinkedIn profil optimizasyonu gecmisi
CREATE TABLE IF NOT EXISTS linkedin_analyses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_headline TEXT,
  input_about    TEXT,
  target_role    TEXT,
  score_general  INT,
  result         JSONB NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE linkedin_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own linkedin analyses"
  ON linkedin_analyses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
