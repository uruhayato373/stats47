# 引用RT テーマカタログ + 多様性ルール

`find-quote-rt` スキルが参照する静的ドキュメント。
**ローテーションは採用しない** — 全テーマを並列検索し、鮮度×エンゲージスコアで選定する「鮮度ファースト戦略」に移行した(ファイル名は歴史的経緯で rotation- のまま)。

このファイルが持つのは:
1. **全テーマのキーワード集合**（並列検索の入力）
2. **テーマ↔category_key マッピング**（投稿記録とテーマ別集計のため）
3. **多様性ソフト制約**（直近2件の category_key を避ける）

## 戦略サマリ

- **鮮度ファースト**: 投稿から72時間以内のツイートのみ対象
- **全テーマ並列検索**: テーマを先に固定せず、全カタログで検索してからスコア順で選定
- **スコア**: `engagement * (0.4 + 0.6 * freshness)`（詳細は SKILL.md Phase 4a）
- **多様性制約**: 直近2件の category_key は避ける（ただし鮮度優先で緩めることあり）

**なぜローテを捨てたか**: ローテで先にテーマを固定すると、その日の最強ツイートを逃す。テーマ別の反応データは `sns_posts.content_key → ranking_items.category_key` の事後集計で観察データとして取れるため、投稿時にバランスを強制する必要がない。

## テーマカタログ

| # | テーマ | category_key | 検索キーワード（OR で連結） | 備考 |
|---|---|---|---|---|
| 1 | 人口 | `population` | `少子化 OR 出生率 OR 人口減少 OR 高齢化 OR 過疎` | 社会的関心度が高い |
| 2 | 年収 | `laborwage` | `年収 OR 給料 OR 給与 OR 賃金 OR 最低賃金 OR 手取り` | stats47 主力データ |
| 3 | 物価 | `economy` | `物価 OR 家賃 OR 地価 OR 不動産 OR 生活費` | 地域差が明確 |
| 4 | 治安 | `safetyenvironment` | `治安 OR 犯罪 OR 交通事故 OR 詐欺` | センシティブ配慮 |
| 5 | 医療 | `socialsecurity` | `医療 OR 医師不足 OR 病院 OR 看護師 OR 介護` | 医療費・介護含む |
| 6 | 教育 | `educationsports` | `教育 OR 大学 OR 学歴 OR 偏差値 OR 進学率` | 地域格差の定番 |
| 7 | 観光 | `tourism` | `観光 OR 旅行 OR インバウンド OR 宿泊` | ポジ文脈で伸びやすい |
| 8 | 農業 | `agriculture` | `農業 OR 農家 OR 米 OR 農産物` | 地方活性化と絡める |

## 並列検索フロー（SKILL.md Phase 2 から参照）

全テーマのキーワードをループして X 検索 → Phase 3 のスクレイプで候補収集。
共通フィルタ: `min_faves:300 lang:ja -filter:replies since:<3日前>`

```bash
SINCE=$(date -v-3d +%Y-%m-%d 2>/dev/null || date -d '3 days ago' +%Y-%m-%d)
for KEYWORDS in \
  "少子化 OR 出生率 OR 人口減少" \
  "年収 OR 給料 OR 賃金 OR 最低賃金" \
  "物価 OR 家賃 OR 地価" \
  "治安 OR 犯罪 OR 交通事故" \
  "医療 OR 医師不足 OR 看護師" \
  "教育 OR 大学 OR 学歴" \
  "観光 OR インバウンド" \
  "農業 OR 米 OR 農家"; do
  QUERY="$KEYWORDS min_faves:300 lang:ja -filter:replies since:$SINCE"
  # 検索 → スクレイプ → 結果統合
done
```

## 多様性ソフト制約

投稿記録から直近2件の category_key を取得し、同じ category_key の候補を避ける:

```sql
SELECT ri.category_key
FROM sns_posts sp
LEFT JOIN ranking_items ri ON ri.ranking_key = sp.content_key
WHERE sp.post_type = 'quote_rt' AND sp.platform = 'x'
ORDER BY sp.posted_at DESC
LIMIT 2;
```

- **避ける条件**: 候補の `content_key` の category_key が直近2件に含まれる
- **緩和条件**: スコア上位3件が全て該当する場合は最上位を採用（鮮度優先）
- **同一 content_key の7日制約**: 同じ ranking_key は7日以内に再利用しない

```sql
SELECT content_key FROM sns_posts
WHERE post_type='quote_rt' AND posted_at > datetime('now','-7 days');
```

## 運用メモ

- テーマを追加する場合は「テーマカタログ」表と「並列検索フロー」の両方に追記
- キーワードの鮮度管理: 季節性のあるキーワード(花粉・暖房費等)はカタログに入れず引数指定で使う
- 反応分析は `sns_metrics` と `sns_posts` を category_key で集計して評価(`/sns-weekly-report` 対応予定)
