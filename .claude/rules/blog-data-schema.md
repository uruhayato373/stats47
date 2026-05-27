# Blog data schema 規約 + wave 命名規則 + skill ↔ docs ↔ memory map

Blog エコシステム (article 生成 / brushup / factual-check / 効果計測) の **対応関係の真実源**。
Phase A (2026-05-27) で `recursive-purring-planet.md` plan の一環として整備。

## 1. data/*.json 統一 schema (Phase B で実装、ここでは規約のみ宣言)

`.local/r2/app/blog/<slug>/data/*.json` の **統一 schema** (Phase B 完了後の状態):

```json
{
  "areaName": "鹿児島",
  "rank": 12,
  "value": 110700,
  "label": "耕地面積",
  "unit": "ha"
}
```

**必須 field**: `areaName` / `rank` / `value` / `label` / `unit`

**現状 (Phase B 前) の 3 種共存** (探索結果より):

| Schema 形式 | 構造例 | label 位置 | unit 位置 |
|---|---|---|---|
| flat array | `[{areaName, rank, value, unit}]` | item 内 (空 or なし) | item 内 |
| nested-metrics | `{rankings: {label, unit, data: [{rank, value}]}}` | wrapper | wrapper |
| timeseries | `{series: {label, data: [{year, value}]}}` | wrapper | なし ❌ |

3 種が混在することで `article-factual-check.mjs` の `walkAndIndex()` が label/unit を完全 index 化できず、value mismatch detector が実装不能になっている (2026-05-27 検出力テスト: rank 系 100% / value 系 0%)。

**Phase B での migration**: `.claude/scripts/blog/migrate-data-schema.mjs` で flat / nested / timeseries → 統一 schema に一括変換。

## 2. Wave 命名規則

Blog の brushup 施策は **wave 単位** で記録・追跡する。wave は「同一目的・同一日付・同一手法」でまとめた施策のセット。

### Wave ID フォーマット

```
YYYY-MM-DD-<method>[-<batch>]
```

- `method`: `manual` (人手), `auto` (auto-brushup-batch), `mixed` (両方)
- `batch`: 同一日に複数 wave を実行した場合の連番 (optional)

例:

- `2026-05-23-manual` — 2026-05-23 に手動で 10 記事 (BLOG-WAVE-2026-05-23-manual section)
- `2026-05-25-auto` — 2026-05-25 に auto-brushup-batch で 54 記事 (BLOG-WAVE-2026-05-25-auto section)
- `2026-06-15-auto-1` / `2026-06-15-auto-2` — 同日 2 波の場合

### Wave に紐づくデータ

| 場所 | 内容 |
|---|---|
| `docs/05_改善ログ/gsc.md` の section heading | `## [BLOG-WAVE-<wave_id>] <title> (legacy: <旧 BLOG-CTR-*>)` |
| section frontmatter | `wave_id`, `legacy_section_ids`, `predecessor_wave`, `successor_wave` |
| `.claude/state/blog/auto-brushup-history.json` | 各 entry に `wave_id` フィールド (2026-05-27 migration 済) |
| commit message | 必須ではない (legacy refactoring を避けるため) |

### Predecessor / Successor

複数 wave が **同じ slug を再上書き** した場合は対応関係を明示:

- `predecessor_wave`: 自分より前に同 slug を改修した wave
- `successor_wave`: 自分より後に同 slug を再上書きした wave

**純粋効果分離が不能** な記事は section の「純粋効果分離の限界」note で明示。判定対象から除外。

## 3. Skill ↔ Docs ↔ Memory map

施策フェーズごとの対応関係。stale 防止のため定期的に確認 (週次 review 時など)。

### Skill (実装)

| Skill | 役割 | 関連 script |
|---|---|---|
| `/auto-brushup-batch` | 自動 brushup の主軸 | `.claude/scripts/blog/{select-brushup-candidates,quality-gate,generate-brushup-plan}.mjs` |
| `/brushup-blog-article` | 手動 brushup (1 記事単位) | `.claude/scripts/blog/lint-article.cjs` |
| `/publish-article` | draft → publish (factual gate あり) | `.claude/scripts/lib/article-factual-check.mjs` |
| `/draft-from-trend` | trend → 新規 draft 生成 | `.claude/scripts/blog/{fetch-article-data,generate-article-charts}.mjs` |
| `/publish-bulk-articles` | 複数記事の bulk publish | factual gate 共有 |
| `/measure-blog-impact` (Phase D 新設予定) | wave 単位の effect 計測 | `measure-gsc-impact.mjs` (要 SKILL 化 + wave_id 駆動化) |

### Docs (人間向け真実源)

| Docs | 内容 | 更新トリガ |
|---|---|---|
| `docs/05_改善ログ/gsc.md` | wave section の真実源 (status / effect / 判定基準) | wave deploy 時 + effect 計測時 |
| `docs/03_週次運用/週次計画/YYYY-Www.md` | 週次 TODO | 週次 (月曜) |
| `docs/03_週次運用/週次レビュー/YYYY-Www.md` | 週次振り返り | 週次 (日曜) |
| `docs/04_レビュー/session-handoff/YYYY-MM-DD-*.md` | 大規模 session 完了時のハンドオフ | session 完了時 |

### Memory (auto memory)

| Memory | 内容 | 更新タイミング |
|---|---|---|
| `project_blog_brushup_risk_2026_05_25.md` | brushup の FAIL/WARN リスクと factual-check 実装状態 | factual-check 検出力測定後 |
| `feedback_bulk_blog_publish_isr_404.md` | bulk publish の ISR 404 リスク | 該当現象観測時 |
| `feedback_evidence_based_judgment` | 実証ベース判定ルールの参照 | 判定方針変更時 |
| `feedback_skill_schema_drift` | SKILL.md と実 schema 乖離リスク | schema migration 時 |

### State (機械向け真実源)

| State | 内容 | 書き込み箇所 |
|---|---|---|
| `.claude/state/blog/auto-brushup-history.json` | wave_id 駆動 source of truth (Phase D で effect 計測の入力) | `/auto-brushup-batch` 実行時 |
| `.claude/state/blog/auto-brushup-skipped.log` | dedup でスキップした slug ログ | 同上 |
| `.claude/state/blog/SHARED-failure-cases.md` | F-001〜N の failure ledger | factual FAIL 検出時 |

## 4. 整理の判断指針 (次に同じ混乱が起きたとき)

セッション中に「設計・ドキュメント・メモリ・スキルが混乱している」と気付いたら、以下を確認:

1. **改善ログの section ID と auto-brushup-history.json の wave_id が一致しているか** (`jq '[.entries[].wave_id] | unique' .claude/state/blog/auto-brushup-history.json` で一覧)
2. **auto memory が実装と一致しているか** (個別 memory の `description` を読み、現状確認)
3. **SKILL.md が実装と乖離していないか** (`feedback_skill_schema_drift` の警告に該当しないか)
4. **改善ログの section が「単一施策 = 1 section」になっているか** (重複対応の場合は `predecessor_wave` / `successor_wave` で明示)

混乱の兆候:
- 同じ slug が複数 section に登場
- effect 計測時に「どの section の数字を更新すべきか不明」
- factual-check 実装と memory に乖離

→ 個別実装ではなく **整理 PR を先に切る** (Phase A 的な)。

## 関連

- 親 plan: `~/.claude/plans/recursive-purring-planet.md`
- Phase B (data schema 統一) で実装予定の migrate script: `.claude/scripts/blog/migrate-data-schema.mjs` (未着手)
- Phase C で実装予定の value detector: `.claude/scripts/lib/article-factual-check.mjs` の `checkValueClaims` (未実装、Phase B 前提)
- Phase D で実装予定: `.claude/skills/blog/measure-blog-impact/SKILL.md` (未作成)
