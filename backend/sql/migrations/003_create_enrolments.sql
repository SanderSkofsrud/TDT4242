-- 003_create_enrolments

CREATE TABLE IF NOT EXISTS enrolments (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'instructor')),
  PRIMARY KEY (user_id, course_id, role)
);

