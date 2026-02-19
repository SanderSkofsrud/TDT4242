-- 008_create_feedback_templates

CREATE TABLE IF NOT EXISTS feedback_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50),
  trigger_condition VARCHAR(255) NOT NULL,
  template_text TEXT NOT NULL,
  policy_version INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

