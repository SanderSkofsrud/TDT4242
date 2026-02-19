-- 006_create_declarations

CREATE TABLE IF NOT EXISTS declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  tools_used TEXT[] NOT NULL,
  categories TEXT[] NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('none', 'light', 'moderate', 'extensive')),
  context_text VARCHAR(500),
  policy_version INTEGER NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT declarations_categories_allowed CHECK (
    categories <@ ARRAY['explanation', 'structure', 'rephrasing', 'code_assistance']::TEXT[]
  ),
  CONSTRAINT declarations_unique_student_assignment UNIQUE (student_id, assignment_id)
);

