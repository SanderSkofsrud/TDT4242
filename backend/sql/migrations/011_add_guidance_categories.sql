-- 011_add_guidance_categories

ALTER TABLE assignment_guidance
  ADD COLUMN IF NOT EXISTS permitted_categories TEXT[],
  ADD COLUMN IF NOT EXISTS prohibited_categories TEXT[];
