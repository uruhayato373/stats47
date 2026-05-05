-- metric_texts (7列) を metrics に吸収する
-- SQLite は ALTER TABLE ADD COLUMN に対応しているため再構築不要

ALTER TABLE metrics ADD COLUMN year_code         TEXT;
ALTER TABLE metrics ADD COLUMN faq               TEXT;
ALTER TABLE metrics ADD COLUMN regional_analysis TEXT;
ALTER TABLE metrics ADD COLUMN insights          TEXT;

UPDATE metrics SET
  year_code         = (SELECT year_code         FROM metric_texts WHERE metric_key = metrics.key),
  faq               = (SELECT faq               FROM metric_texts WHERE metric_key = metrics.key),
  regional_analysis = (SELECT regional_analysis FROM metric_texts WHERE metric_key = metrics.key),
  insights          = (SELECT insights           FROM metric_texts WHERE metric_key = metrics.key);

DROP TABLE metric_texts;
