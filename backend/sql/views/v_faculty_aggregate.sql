-- v_faculty_aggregate
-- Faculty-level aggregate over declarations by course and faculty.
-- Scoped to courses within the faculty; no student identifiers.
-- Includes only declarations from students who explicitly shared data.
-- Suppression is handled in the controller layer.

CREATE OR REPLACE VIEW v_faculty_aggregate AS
SELECT
  a.course_id,
  c.faculty_id,
  c.code AS course_code,
  c.name AS course_name,
  category,
  d.frequency,
  COUNT(d.id)::int AS declaration_count
FROM declarations d
JOIN assignments a ON a.id = d.assignment_id
JOIN courses c ON c.id = a.course_id
JOIN sharing_preferences sp
  ON sp.student_id = d.student_id
 AND sp.course_id = a.course_id
 AND sp.is_shared = TRUE
CROSS JOIN LATERAL unnest(d.categories) AS category
WHERE d.expires_at > now()
GROUP BY
  a.course_id,
  c.faculty_id,
  c.code,
  c.name,
  category,
  d.frequency;
