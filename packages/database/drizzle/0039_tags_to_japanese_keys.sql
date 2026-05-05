PRAGMA foreign_keys = OFF;

-- taggings.tag_key を英語スラグ → 日本語名に変換
UPDATE taggings
SET tag_key = (SELECT tag_name FROM tags WHERE tags.tag_key = taggings.tag_key)
WHERE taggable_type IN ('article', 'metric');

-- taggings を FK なしで再構築
CREATE TABLE taggings_new (
  taggable_type TEXT NOT NULL,
  taggable_id   TEXT NOT NULL,
  tag_key       TEXT NOT NULL,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (taggable_type, taggable_id, tag_key),
  CONSTRAINT taggings_type_check CHECK (taggable_type IN ('article', 'metric'))
);
INSERT INTO taggings_new SELECT * FROM taggings;
DROP TABLE taggings;
ALTER TABLE taggings_new RENAME TO taggings;

CREATE INDEX idx_taggings_tag_key ON taggings(tag_key);
CREATE INDEX idx_taggings_entity  ON taggings(taggable_type, taggable_id);

-- tags テーブル廃止
DROP TABLE tags;

PRAGMA foreign_keys = ON;
