-- Polymorphic taggings: unify article_tags + indicator_tags (2026-05-04, PR-9)
--
-- 旧 article_tags (474) + indicator_tags (3,638) を taggings 1 テーブルに統合。
-- taggable_type で entity 種別を区別、taggable_id は TEXT で article slug / indicator id 両対応。
--
-- FK CASCADE は polymorphic のため articles(slug) / indicators(id) には張れない。
-- 削除時はアプリ側で taggings の対応行を明示削除する (現状 CASCADE 利用箇所なし)。

CREATE TABLE taggings (
  taggable_type TEXT NOT NULL CHECK (taggable_type IN ('article', 'indicator')),
  taggable_id TEXT NOT NULL,
  tag_key TEXT NOT NULL REFERENCES tags(tag_key),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (taggable_type, taggable_id, tag_key)
);

CREATE INDEX idx_taggings_tag_key ON taggings(tag_key);
CREATE INDEX idx_taggings_entity ON taggings(taggable_type, taggable_id);

-- データ移行: article_tags → taggings
INSERT INTO taggings (taggable_type, taggable_id, tag_key, created_at)
SELECT 'article', slug, tag_key, CURRENT_TIMESTAMP
FROM article_tags;

-- データ移行: indicator_tags → taggings
INSERT INTO taggings (taggable_type, taggable_id, tag_key, created_at)
SELECT 'indicator', CAST(indicator_id AS TEXT), tag_key, COALESCE(created_at, CURRENT_TIMESTAMP)
FROM indicator_tags;
