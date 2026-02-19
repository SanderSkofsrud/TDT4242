-- 010_create_access_log

CREATE TABLE IF NOT EXISTS access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES users(id),
  capability VARCHAR(100) NOT NULL,
  resource_id UUID,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

