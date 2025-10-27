# ランキンググループ機能ガイド

**作成日**: 2025-01-27  
**最終更新**: 2025-01-27  
**対象**: ランキンググループ機能の実装と運用

---

## 概要

ランキンググループ機能は、関連する複数のランキング項目をグループ化して管理する機能です。

### ビジネス課題

- サブカテゴリ内に多くの関連項目が存在する
- 例：「製造業」サブカテゴリに「製造品出荷額」「製造品出荷額（事業所あたり）」「製造品出荷額（従業員あたり）」など
- サイドバーに全ての項目を列挙すると見づらい

### 解決策

- 関連する項目をグループ化
- グループ単位で表示・管理
- UI でグループごとに折り畳み表示が可能

---

## データベース設計

### ranking_groups テーブル

```sql
CREATE TABLE ranking_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_key TEXT UNIQUE NOT NULL,           -- 'manufacturing-output'
  subcategory_id TEXT NOT NULL,            -- 'manufacturing'
  name TEXT NOT NULL,                       -- '製造品出荷'
  description TEXT,                         -- グループの説明
  icon TEXT,                                -- グループアイコン（オプション）
  display_order INTEGER DEFAULT 0,          -- サブカテゴリ内での表示順
  is_collapsed BOOLEAN DEFAULT 0,          -- デフォルトで折り畳むか
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### ranking_group_items テーブル

```sql
CREATE TABLE ranking_group_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  ranking_item_id INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,         -- グループ内での表示順
  is_featured BOOLEAN DEFAULT 0,           -- 注目項目フラグ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(group_id, ranking_item_id),
  FOREIGN KEY (group_id) REFERENCES ranking_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (ranking_item_id) REFERENCES ranking_items(id) ON DELETE CASCADE
);
```

---

## 使用方法

### 1. グループの作成

```sql
-- グループを作成
INSERT INTO ranking_groups (group_key, subcategory_id, name, description, display_order)
VALUES
  ('manufacturing-output', 'manufacturing', '製造品出荷', '製造品の出荷額に関するランキング', 1),
  ('manufacturing-establishments', 'manufacturing', '事業所', '製造業事業所に関するランキング', 2);
```

### 2. グループとアイテムの関連付け

```sql
-- グループとランキング項目を関連付ける
INSERT INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES
  (1, 101, 1, 1),  -- 製造品出荷額（注目項目）
  (1, 102, 2, 0),  -- 製造品出荷額（事業所あたり）
  (1, 103, 3, 0);  -- 製造品出荷額（従業員あたり）
```

### 3. API 経由でデータ取得

```typescript
// API経由でランキンググループを取得
const response = await fetch('/api/rankings/groups/subcategory/manufacturing');
const data = await response.json();

// レスポンス構造
{
  subcategory: { id: 'manufacturing', name: '製造業', ... },
  groups: [
    {
      id: 1,
      groupKey: 'manufacturing-output',
      name: '製造品出荷',
      items: [
        { rankingKey: 'manufacturing-output-total', label: '製造品出荷額' },
        { rankingKey: 'manufacturing-output-per-establishment', label: '製造品出荷額（事業所あたり）' }
      ]
    }
  ],
  ungroupedItems: [...],  // グループに属さない項目
}
```

---

## 実装例

### Repository メソッド

```typescript
// RankingRepository.getRankingGroupsBySubcategory()
const repository = await RankingRepository.create();
const response = await repository.getRankingGroupsBySubcategory(subcategoryId);
```

### UI コンポーネント（将来実装予定）

```typescript
// RankingGroupsSidebar.tsx
export async function RankingGroupsSidebar({ subcategory }) {
  const data = await fetchRankingGroupsBySubcategory(subcategory);

  return (
    <div>
      {data.groups.map((group) => (
        <Collapsible key={group.id} defaultOpen={!group.isCollapsed}>
          <CollapsibleTrigger>
            <h3>{group.name}</h3>
            <Badge>{group.items.length}</Badge>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {group.items.map((item) => (
              <RankingItemCard key={item.id} item={item} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}

      {data.ungroupedItems.length > 0 && (
        <div>
          <h3>その他</h3>
          {data.ungroupedItems.map((item) => (
            <RankingItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## ベストプラクティス

### 1. グループ名の命名規則

- わかりやすい名前を使用
- 例：「製造品出荷」「事業所数」「売上高」

### 2. 表示順の管理

- `display_order` でグループの表示順を制御
- 重要度の高いグループを上に配置

### 3. デフォルト表示

- `is_collapsed` でグループの初期状態を制御
- 重要度の低いグループは折り畳み表示

### 4. 注目項目の活用

- `is_featured` フラグで注目項目を指定
- UI で強調表示することが可能

---

## 関連ドキュメント

- [Ranking ドメイン設計](../../../../01_技術設計/03_ドメイン設計/10_ranking.md)
- [データベース設計](../../../../01_技術設計/04_インフラ設計/01_データベース設計.md)
- [ランキング設定管理ガイド](../../../../04_UI・UX/ランキング/implementation/ranking-configuration-guide.md)

---

**更新履歴**:

- 2025-01-27: 初版作成
