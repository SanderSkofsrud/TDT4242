-- v_instructor_aggregate
-- Instructor-level aggregate over declarations by assignment and course.
-- Enforces k=5 suppression in the HAVING clause.

CREATE OR REPLACE VIEW v_instructor_aggregate AS
SELECT
  d.assignment_id,
  a.course_id,
  category,
  d.frequency,
  COUNT(d.id) AS declaration_count
FROM declarations d
JOIN assignments a ON a.id = d.assignment_id
CROSS JOIN LATERAL unnest(d.categories) AS category
WHERE d.expires_at > now()
GROUP BY
  d.assignment_id,
  a.course_id,
  category,
  d.frequency
HAVING COUNT(d.id) >= 5;
