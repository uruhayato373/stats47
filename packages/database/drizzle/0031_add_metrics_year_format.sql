-- Add year_format to metrics for semantic year name derivation
-- fiscal   → "YYYY年度" (e-Stat 年度系、多数)
-- calendar → "YYYY年"   (家計調査・国勢調査・交通統計・医療統計 等)
-- plain    → "YYYY"     (将来予測等の例外、現時点では使用なし)

ALTER TABLE metrics ADD COLUMN year_format TEXT NOT NULL DEFAULT 'fiscal'
  CHECK (year_format IN ('fiscal', 'calendar', 'plain'));

-- calendar バックフィル: source_id ベースで一括分類
UPDATE metrics SET year_format = 'calendar'
  WHERE source_id IN (
    'kakei-chousa',
    'wage-structure-survey',
    'mlit_dpf',
    'mlit_ksj',
    'agricultural-output',
    'housing-land-survey',
    'employment-structure-survey',
    'health-admin-report',
    'vital-statistics',
    'crop-statistics',
    'sole-proprietor-survey',
    'hospital-report',
    'patient-survey',
    'census',
    'employment-trend-survey',
    'factory-location-survey',
    'livestock-statistics',
    'local-public-employee-salary',
    'workplace-accident-survey',
    'estat:0003456573',
    'estat:0003456409',
    'estat:0003456245',
    'estat:0003456093'
  );
