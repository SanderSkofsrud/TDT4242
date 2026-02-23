-- v_instructor_aggregate
-- Instructor-level aggregate over declarations by assignment and course.
-- Suppression is handled in the controller layer.

CREATE OR REPLACE VIEW v_instructor_aggregate AS
SELECT
  d.assignment_id,
  a.course_id,
  category,
  d.frequency,
  COUNT(d.id) AS declaration_count
FROM declarations d
JOIN assignments a ON a.id = d.assignment_id
JOIN sharing_preferences sp
  ON sp.student_id = d.student_id
 AND sp.course_id = a.course_id
 AND sp.is_shared = TRUE
CROSS JOIN LATERAL unnest(d.categories) AS category
WHERE d.expires_at > now()
GROUP BY
  d.assignment_id,
  a.course_id,
  category,
  d.frequency;
