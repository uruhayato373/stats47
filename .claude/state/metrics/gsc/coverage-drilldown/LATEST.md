# GSC Coverage Drilldown — 2026-W19

**取得日**: 2026-05-05 / **ソース**: URL Inspection API (Phase 8 自動)
**inspect 件数**: 30 URL

## カテゴリ別件数（前週比）

| カテゴリ | 今週 | 前週 | 変化 |
|---|---:|---:|---|
| ページにリダイレクトがあります | 2 | 1000 | ▼ -998 |
| クロール済み - インデックス未登録 | 5 | 0 | ▲ +5 |
| 登録済み (送信) | 23 | 0 | ▲ +23 |
| **合計** | **30** | 4919 | ▼ -4889 |

## 注意

- 本データは URL Inspection API で **自分が指定した URL（sitemap + KNOWN + GONE）** の coverageState を集計したもの
- GSC UI Coverage Report の Drilldown とは「対象 URL 集合」が異なる（GSC UI は Google 独自視点で発見した URL も含む、API は自分視点のみ）
- 「未把握 URL」（古い旧 URL 等）は API では取得不能。GSC UI 集計値（例: 全 404 件数）と合わせて読む

## 詳細

- 今週の URL リスト: `2026-W19/` 配下
- 時系列集約: `history.csv`
- 自動取得スクリプト: `node .claude/scripts/gsc/url-inspection-daily.cjs`
- GitHub Actions: `.github/workflows/gsc-url-inspection-daily.yml` (毎朝 JST 06:00)
