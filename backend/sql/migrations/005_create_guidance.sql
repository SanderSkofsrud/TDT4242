-- 005_create_guidance

CREATE TABLE IF NOT EXISTS assignment_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL UNIQUE REFERENCES assignments(id) ON DELETE CASCADE,
  permitted_text TEXT NOT NULL,
  prohibited_text TEXT NOT NULL,
  examples JSONB,
  created_by UUID NOT NULL REFERENCES users(id),
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

