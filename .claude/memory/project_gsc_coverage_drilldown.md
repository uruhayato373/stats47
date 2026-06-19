---
name: GSC Coverage Drilldown 継続記録（Phase 8 自動化）
description: URL Inspection API (1,500 URL/day) で coverageState を毎日取得・集計し .claude/state/metrics/gsc/coverage-drilldown/ に継続保存。Phase 7 (手動 zip export) は完全代替・廃止。
type: project
originSessionId: c8f7304c-235d-4e27-ad61-b3075b33f5a5
---

# GSC Coverage Drilldown 継続記録（Phase 8、2026-04-26、Phase 7 完全代替）

`#115` 親 issue / `#43` で管理。URL Inspection API による完全自動化。

## 設計（Phase 8）

- **完全自動化**: GitHub Actions `gsc-url-inspection-daily.yml` が毎朝 JST 06:00 に実行
- **対象 URL**: 1,500 件（API quota 2,000/day の 75%）
  - GSC pages.csv 全件 + 主要静的ページ + 47 都道府県 + KNOWN_RANKING_KEYS + GONE_RANKING_KEYS + KNOWN_TAG_KEYS（重複排除順）
- **集計**: URL Inspection の coverageState を内部カテゴリ ID にマッピングして件数集計
- **手動 export 不要**（Phase 7 で導入した `parse-coverage-drilldown.cjs` は削除済み）

## 記録先（恒常事実）

| 用途 | パス |
|---|---|
| URL 単位生データ | `.claude/state/metrics/gsc/url-inspection/YYYY-MM-DD.csv` |
| URL Inspection LATEST | `.claude/state/metrics/gsc/url-inspection/LATEST.md` |
| URL Inspection history | `.claude/state/metrics/gsc/url-inspection/history.csv` |
| Drilldown カテゴリ別 URL | `.claude/state/metrics/gsc/coverage-drilldown/YYYY-Www/{category}-urls.csv` |
| Drilldown 週次サマリ | `.claude/state/metrics/gsc/coverage-drilldown/YYYY-Www/summary.json` |
| Drilldown LATEST | `.claude/state/metrics/gsc/coverage-drilldown/LATEST.md` |
| Drilldown 時系列 | `.claude/state/metrics/gsc/coverage-drilldown/history.csv` |

## カテゴリ ID（内部）↔ coverageState（GSC API 日本語）

| 内部 ID | coverageState |
|---|---|
| `404` | 見つかりませんでした（404） |
| `5xx` | サーバーエラー（5xx） |
| `redirect` | ページにリダイレクトがあります |
| `alt-canonical` | 代替ページ（適切な canonical タグあり） |
| `crawled-not-indexed` | クロール済み - インデックス未登録 |
| `dup-no-canonical` | 重複しています。ユーザーにより、正規ページとして選択されていません |
| `soft-404` | ソフト 404 / ソフト404 |
| `discovered-not-indexed` | 検出 - インデックス未登録 |
| `noindex-excluded` | noindex タグによって除外されました |
| `indexed-submitted` | 送信して登録されました |
| `not-on-google` | URL が Google に認識されていません |

新カテゴリは `COVERAGE_STATE_TO_CATEGORY` mapping に追加するだけ（`url-inspection-daily.cjs`）。未マッピングは WARNING ログ出力。

## API 制約と本仕組みの限界

- URL Inspection API quota: **2,000 URLs/site/day**（公式: developers.google.com/webmaster-tools/v1/limits）
- 安全マージン 25% で 1,500 URL に制限
- **「自分視点」のみ**: sitemap + KNOWN + GONE に含まれない URL（Google 独自発見の旧 URL 等）は対象外
- → GSC UI の Coverage Report 集計値（例: 全 404=5,919 件）と一致しない可能性あり
  - 解決策: GSC UI 集計値は別途人間が確認、API データは「自分が把握する範囲のトレンド」として扱う

## Phase 6 と Phase 8 の統合

両 Phase は同じ `url-inspection-daily.cjs` で同時実行:
- Phase 6 出力: `url-inspection/` 配下（個別 URL の詳細）
- Phase 8 出力: `coverage-drilldown/` 配下（カテゴリ集計、Drilldown 相当）
- 1 回の実行（毎朝 JST 06:00）で両方更新

## 関連

- スクリプト: `.claude/scripts/gsc/url-inspection-daily.cjs`
- 関連 SKILL: `.claude/skills/analytics/fetch-gsc-data/SKILL.md`、`.claude/skills/management/weekly-review/SKILL.md`
- 親 issue: #115、本実装 issue: #43
- 計画ファイル: `/Users/minamidaisuke/.claude/plans/issue-gsc-1-6-modular-goblet.md` Phase 8

## Phase 7 の遺物

- 削除済み: `.claude/scripts/gsc/parse-coverage-drilldown.cjs`
- 残置: `gcsエラー/` は `.gitignore` 済み（誤って配置されても git noise を出さない）
- 残置: `.claude/state/metrics/gsc/coverage-drilldown/2026-W17/` （Phase 7 で救済した baseline、Phase 8 が同じ場所に上書き）
