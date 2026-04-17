# NSM 定義と計測指標（サマリ）

`/nsm-experiment` および関連スキル（`/weekly-plan`, `/weekly-review`）が参照する **NSM の計測側の実装サマリ**。戦略的な定義の真実源は `docs/03_レビュー/critical/north-star-metric.md`。本ファイルはそれを計測実装と繋ぐリファレンス。

**progressive disclosure**: 本ファイルは必要時のみ skill から読み込まれる。

---

## North Star Metric

### 週間エンゲージドセッション数

| 項目 | 値 |
|---|---|
| **定義** | GA4 の `engagedSessions` 全チャネル合計（週次） |
| **実装** | `.claude/scripts/lib/metrics-reader.mjs` の `ga4.total.thisEngagedSessions` |
| **3 ヶ月目標** | 週 2,000 セッション |
| **判断根拠** | `docs/03_レビュー/critical/north-star-metric.md` §North Star Metric |

### 採用理由

1. 「見た」だけでなく「探索した」を測る — 1 ページ離脱では広告もアフィリエイトもほぼ発生しない
2. 収益モデルとの直接相関 — engaged = 2 ページ以上 or 10 秒以上滞在 or CV → AdSense/アフィリエイト接触増
3. ビジョンとの整合 — 「ランキングで笑った人が原データを読めるようになる」をページ遷移で計測
4. 施策即効性 — 記事公開・内部リンク改善・SNS 投稿のいずれも数日で engagedSessions に反映

---

## Input Metrics（NSM を駆動する 4 指標）

NSM の説明変数。実験の `target_metric` にはこちらを使うことが多い。

| # | 指標 | 定義 | データソース | 実装 |
|---|---|---|---|---|
| 1 | 週間オーガニック検索クリック数 | GSC のクリック数（週次合計） | Google Search Console | `metrics-reader.mjs` `gsc.total.thisClicks` |
| 2 | 週間 SNS 流入セッション数 | GA4 `sessionDefaultChannelGroup = Organic Social` + Social | Google Analytics 4 | `metrics-reader.mjs` `ga4.channels[*]` を filter |
| 3 | ページ/セッション | GA4 `screenPageViewsPerSession` | Google Analytics 4 | `/fetch-ga4-data pages` |
| 4 | 週間リピーター率 | 週内に 2 回以上訪問したユーザーの割合 | Google Analytics 4 | GA4 Data API（cohort/activeUsers, 未実装） |

補助指標:

| # | 指標 | 定義 | データソース |
|---|---|---|---|
| 5 | Core Web Vitals (LCP / INP / CLS) | 実ユーザー計測の 75th percentile、モバイル基準 | PageSpeed Insights API / `/lighthouse-audit` |
| 6 | Lighthouse Performance スコア | ラボ環境での総合スコア 0-100 | PageSpeed Insights / `/lighthouse-audit` |

---

## メトリクスツリー

```
NSM（週間エンゲージドセッション数）
├─ オーガニック検索経由 engaged
│    = GSC clicks × engagement 成立率
│      ├─ GSC clicks = impressions × CTR
│      │    ├─ impressions = インデックス済みページ数 × ページあたり平均表示
│      │    └─ CTR = title/description 品質 × 順位
│      └─ engagement 成立率 = コンテンツ質 × 内部リンク × CWV
├─ SNS 経由 engaged
│    = 投稿頻度 × エンゲージメント率 × UTM 誘導率
└─ 直接 / Referral 経由 engaged
     = ブランド認知 × 被リンク × リピーター
```

`playbook.md` の実験カテゴリはこのツリーと対応:

- カテゴリ 1（検索クエリ個別改善） → CTR × 順位の向上
- カテゴリ 2（CTR 改善） → CTR 直接向上
- カテゴリ 3（コンテンツ追加・ランキング拡充） → impressions の向上
- カテゴリ 4（技術的 SEO） → リッチスニペット・CWV → CTR/engagement
- カテゴリ 5（UX / 回遊性） → engagement 成立率の向上
- カテゴリ 6（SNS 流入） → SNS 経由 engaged の向上

---

## 計測基盤の現状

すべて既存実装で取得可能:

- **GA4**: プロパティ `463218070`、サービスアカウント `stats47-windows@stats47.iam.gserviceaccount.com`（閲覧権限付与済み）
- **GSC**: `sc-domain:stats47.jp`、同サービスアカウント
- **PageSpeed Insights**: `PSI_API_KEY` env 変数経由で呼び出し可能（任意）
- **認証鍵**: リポジトリルートの `stats47-*.json`（gitignored）
- **実装スクリプト**:
  - `.claude/skills/analytics/fetch-gsc-data/` — GSC snapshot + ad hoc
  - `.claude/skills/analytics/fetch-ga4-data/` — GA4 snapshot + ad hoc
  - `.claude/scripts/lib/metrics-reader.mjs` — NSM 統合計算
  - `.claude/scripts/snapshot-weekly-metrics.mjs` — 週次 JSON snapshot 保存
- **週次スナップショット**: `docs/03_レビュー/weekly-metrics/YYYY-Www.json`
- **改善ログ**:
  - `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md`
  - `.claude/skills/analytics/ga4-improvement/reference/improvement-log.md`

---

## 関連ドキュメント

- `docs/03_レビュー/critical/north-star-metric.md` — NSM の完全な定義（戦略側の真実源）
- `docs/03_レビュー/critical/growth-loops.md` — 成長ループ設計
- `.claude/skills/management/nsm-experiment/references/playbook.md` — 実験パターンカタログ
- `.claude/skills/management/nsm-experiment/references/rubric.md` — 優先順位評価軸
