-- Drop the view so it can be recreated with new columns (course_code, course_name).
-- CREATE OR REPLACE VIEW cannot change the column list in PostgreSQL.

DROP VIEW IF EXISTS v_faculty_aggregate;
