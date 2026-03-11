-- Add unit_no and unit_title columns to class_topics table
ALTER TABLE class_topics ADD COLUMN IF NOT EXISTS unit_no INTEGER DEFAULT 1;
ALTER TABLE class_topics ADD COLUMN IF NOT EXISTS unit_title TEXT;

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_class_topics_unit_no ON class_topics(unit_no);
