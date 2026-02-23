-- v_faculty_aggregate
-- Faculty-level aggregate over declarations by course and faculty.
-- Head of faculty sees aggregates only (no sharing mechanism; no individual declarations).
-- Enforces k=5 suppression in the HAVING clause.
-- Scoped to courses within the faculty; no student identifiers.

CREATE OR REPLACE VIEW v_faculty_aggregate AS
SELECT
  a.course_id,
  c.faculty_id,
  c.code AS course_code,
  c.name AS course_name,
  category,
  d.frequency,
  COUNT(d.id) AS declaration_count
FROM declarations d
JOIN assignments a ON a.id = d.assignment_id
JOIN courses c ON c.id = a.course_id
CROSS JOIN LATERAL unnest(d.categories) AS category
WHERE d.expires_at > now()
GROUP BY
  a.course_id,
  c.faculty_id,
  c.code,
  c.name,
  category,
  d.frequency
HAVING COUNT(d.id) >= 5;
