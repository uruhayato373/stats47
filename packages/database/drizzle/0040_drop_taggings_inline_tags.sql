PRAGMA foreign_keys = OFF;

-- articles に tags 列追加（JSON 配列）
ALTER TABLE articles ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
UPDATE articles
SET tags = COALESCE(
  (SELECT json_group_array(tag_key)
   FROM taggings
   WHERE taggable_type = 'article' AND taggable_id = articles.slug),
  '[]'
);

-- metrics に tags 列追加（JSON 配列）
ALTER TABLE metrics ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
UPDATE metrics
SET tags = COALESCE(
  (SELECT json_group_array(tag_key)
   FROM taggings
   WHERE taggable_type = 'metric' AND taggable_id = metrics.key),
  '[]'
);

DROP TABLE taggings;

PRAGMA foreign_keys = ON;
