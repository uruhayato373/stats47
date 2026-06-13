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

- `method`: `manual` (人手), `auto` (一括リライト = `/brushup-blog --target batch`), `mixed` (両方)
- `batch`: 同一日に複数 wave を実行した場合の連番 (optional)

例:

- `2026-05-23-manual` — 2026-05-23 に手動で 10 記事 (BLOG-WAVE-2026-05-23-manual section)
- `2026-05-25-auto` — 2026-05-25 に一括リライト (当時の自動 batch スキル、現 `/brushup-blog --target batch`) で 54 記事 (BLOG-WAVE-2026-05-25-auto section)
- `2026-06-15-auto-1` / `2026-06-15-auto-2` — 同日 2 波の場合

### Wave に紐づくデータ

| 場所 | 内容 |
|---|---|
| `docs/02_実装計画/03_改善バックログ.md` の section heading | `## [BLOG-WAVE-<wave_id>] <title> (legacy: <旧 BLOG-CTR-*>)` |
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
| `/brushup-blog` | リライトの唯一エンジン。`--target priority` (キュー) / `--target article` (1 記事、CTR-reframe 既定。エキスパート視点追加は対話実行のみ NotebookLM) / `--target batch` (ユーザー指示時の一括、cron なし) | `.claude/scripts/blog/{select-brushup-candidates,quality-gate}.mjs`, `lint-article.cjs` |
| `/publish-article` | draft → publish (factual gate あり) | `.claude/scripts/lib/article-factual-check.mjs` |
| `/draft-from-trend` | trend → 新規 draft 生成 | `.claude/scripts/blog/{fetch-article-data,generate-article-charts}.mjs` |
| `/publish-bulk-articles` | 複数記事の bulk publish | factual gate 共有 |
| `measure-gsc-impact.mjs` (wave_id 駆動・2026-06-08〜) | due 到達 wave の before/after を週次 GSC で自動 diff → `improvement-log.md` の `## [BLOG-WAVE-<id>]` upsert。`fetch-metrics-weekly.yml` cron に配線済 (delta 提示まで・status 確定は weekly-review) | `measure-gsc-impact.mjs` |
| `/analyze-winning-patterns` | 天井ループ: GSC実測×構造特徴で勝ち要因抽出 (順位交絡統制付き)。正典 `docs/02_実装計画/07_ブログ勝ちパターン学習.md` | `.claude/scripts/blog/analyze-winning-patterns.mjs` |

### Docs (人間向け真実源)

| Docs | 内容 | 更新トリガ |
|---|---|---|
| `docs/02_実装計画/03_改善バックログ.md` | wave section の真実源 (status / effect / 判定基準) | wave deploy 時 + effect 計測時 |
| `docs/03_週次運用/週次計画/YYYY-Www.md` | 週次 TODO | 週次 (月曜) |
| `docs/03_週次運用/週次レビュー/YYYY-Www.md` | 週次振り返り | 週次 (日曜) |
| `docs/04_レビュー/YYYY-MM-DD-session-handoff-<x>.md` | 大規模 session 完了時のハンドオフ (フラット。種別絞り込みは frontmatter `type:`) | session 完了時 |

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
| `.claude/state/blog/remediation-queue.json` | **品質是正キュー (状態付き)**。「次に何を直すか」の真実源。pending/in-progress/done + wave_id。GSC×品質 blocker の統合スコア。**正典: `docs/02_実装計画/06_ブログ品質是正ループ.md`** | `build-remediation-queue.mjs` (build / --mark-* / --next) |
| `.claude/state/blog/winning-patterns.json` | **勝ち要因 (天井ループ)**。featureSignals (confidence付) + 順位交絡統制 (robust/confounded) + 記事別 conformance。build-remediation-queue が conformance を tiebreaker に読む。**正典: `docs/02_実装計画/07_ブログ勝ちパターン学習.md`** | `analyze-winning-patterns.mjs` |
| `.claude/state/blog/auto-brushup-history.json` | wave_id 駆動 source of truth (effect 計測の入力 + 是正キューの done シード) | `/brushup-blog --target batch\|queue` 実行時 |
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
- Phase D (wave 効果計測): `measure-gsc-impact.mjs` を wave_id 駆動化し `fetch-metrics-weekly.yml` cron に配線済 (2026-06-08)。SKILL 化はせず週次 cron で自動実行。正典: `docs/02_実装計画/06_ブログ品質是正ループ.md` Phase 2
