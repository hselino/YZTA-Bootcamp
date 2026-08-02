-- Idempotent sürüm (güvenle tekrar çalıştırılabilir)
DROP POLICY IF EXISTS "Users manage own interview sessions" ON interview_sessions;
CREATE POLICY "Users manage own interview sessions"
  ON interview_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE interviews ADD COLUMN IF NOT EXISTS overall_score INT;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS report JSONB;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

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

DROP POLICY IF EXISTS "Users manage own linkedin analyses" ON linkedin_analyses;
CREATE POLICY "Users manage own linkedin analyses"
  ON linkedin_analyses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);