-- 012_update_sharing_defaults

ALTER TABLE sharing_preferences
  ALTER COLUMN is_shared SET DEFAULT FALSE;

UPDATE sharing_preferences
SET is_shared = FALSE;

INSERT INTO sharing_preferences (student_id, course_id, is_shared)
SELECT e.user_id, e.course_id, FALSE
FROM enrolments e
WHERE e.role = 'student'
  AND NOT EXISTS (
    SELECT 1
    FROM sharing_preferences sp
    WHERE sp.student_id = e.user_id
      AND sp.course_id = e.course_id
  );
