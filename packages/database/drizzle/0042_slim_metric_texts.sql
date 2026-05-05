PRAGMA foreign_keys = OFF;

CREATE TABLE "metric_texts_new" (
  metric_key        TEXT PRIMARY KEY REFERENCES metrics(key),
  year_code         TEXT NOT NULL,
  faq               TEXT,
  regional_analysis TEXT,
  insights          TEXT,
  created_at        TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at        TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO metric_texts_new
  (metric_key, year_code, faq, regional_analysis, insights, created_at, updated_at)
SELECT
  metric_key, year_code, faq, regional_analysis, insights, created_at, updated_at
FROM metric_texts;

DROP TABLE metric_texts;
ALTER TABLE metric_texts_new RENAME TO metric_texts;

PRAGMA foreign_keys = ON;
