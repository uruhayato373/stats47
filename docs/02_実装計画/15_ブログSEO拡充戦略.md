---
type: content-strategy
created: 2026-07-05
updated: 2026-07-05
status: active
tags: [seo, blog, ranking, content]
---

# ブログSEO拡充戦略 (記事の型 × データ活用 × 継続生産)

新規記事「何を・どの型で・どのデータから書くか」の正典。品質基準 (どう書くか) は
`.claude/rules/blog-quality-standards.md`、既存記事の是正は `docs/02_実装計画/06_ブログ品質是正ループ.md`、
ランキングページ拡充は §5 を参照。

## 1. 現在地と目標 (2026-07-05 起点)

- **実測 (2026-W26)**: 週 1,947 clicks / 73,661 imp / CTR 2.64% / position 9.14。11 週で clicks +450%。公開 290 記事、生産ペース週 1-2 本
- **目標 (1 四半期)**: 週 2,500 clicks (+28%)。生産ペース **月 15-20 本 (週 4-5 本)**
- **KPI**: ①新規記事の 4 週後 clicks 中央値 ②topic-queue must-write レーン消化率 ③/ranking インデックス率 43%→70% ④B 型 (相関) 記事の position

## 2. 競合分析と差別化軸

| 競合 | 指標数 | 強み | 弱み (= stats47 の攻め所) |
|---|---|---|---|
| todo-ran.com | 1,501 | 指標網羅・ブランド認知・被リンク | 自動生成の淡白ページ。相関「見かけの説明」止まり・図解貧弱・市区町村なし |
| uub.jp | 1,843 | データセット数・老舗 | UI 古い・記事型コンテンツなし・モバイル弱い |
| @riskmap.jp (SNS) | — | 感情喚起 Reel | Web 送客なし・信頼性欠如 (stats47 は煽り路線に入らない) |

**stats47 の差別化 4 軸** (競合が構造的に持たないもの):

1. **相関×散布図の分析記事** — 相関 snapshot (~200 万ペア計算済、R2 `app/correlation/by-ranking-key/<key>.json`) を持つのは stats47 だけ。B 型の素材調達コストほぼゼロ
2. **市区町村粒度** — 決算カード (47 県 × 市区町村財政 + 類似団体平均)。競合 2 サイトは都道府県止まり
3. **図解ファースト** — tile-grid 地図・散布図・カード型 SVG (winning-patterns robust: hasMap/hasScatter +15.4%)
4. **移動フロー** — 県間 O-D データ (migration-flow) の方向性分析

## 3. 記事の型ポートフォリオ (月次ミックス)

型定義・章構成テンプレの正典は `.claude/rules/blog-quality-standards.md` §記事アーキタイプ。ここでは配分と入力データを管理する。

| 型 | 本/月 | 入力データ | 狙いクエリパターン |
|---|---|---|---|
| **B 相関・真因** | 5 | R2 correlation per-key top-20 から \|r\|≥0.6 × カテゴリ跨ぎ | 「◯◯ △△ 関係」「◯◯ なぜ」 |
| **D2 食品・家計消費** | 4 | 家計調査品目 metric (系統展開: 麺類→調味料→肉類…) | 「◯◯ 消費量 日本一」「◯◯ 県民」 |
| **A 単一指標深掘り** | 3-4 | metric 2,124 active + 新規登録分 | 「◯◯ 都道府県 ランキング」 |
| **F 市区町村内格差** | 3 | `apps/web/public/finance-cards/` (決算カード + 類似団体平均) | 「◯◯市 財政」「△△県 市町村 比較」 |
| **G 移動フロー** | 1-2 | R2 migration-flow (1-3 月は +1) | 「◯◯県 転出先」「移住 統計」 |
| C 時系列 / E ハブ | 1-2 | 統計公表イベント連動 / 内部リンク集約 (E は隔月 1 まで) | — |

立ち上げ順: 第 1 月は **D2 (勝ち実績の複製・最低リスク) と B (素材既存)** に寄せて回し、F/G はデータ変換テンプレ整備後の第 2 月から本格投入する。

## 4. ネタ選定 (topic-queue)

「次に何を書くか」の真実源は **`.claude/state/blog/topic-queue.json`** (`build-topic-queue.mjs` が生成、
remediation-queue と同じ状態付きキュー)。

```
combined = 0.35*queryGap + 0.25*seasonality + 0.20*surprise + 0.20*competitionGap
```

- **queryGap**: GSC クエリ imp>50 で専用ブログ記事なし (着地が /ranking) or position>15 → norm(log(imp))。検索需要の実証
- **seasonality**: `seasonality-table.json` (品目×月)。今後 8 週に需要の山があれば加点
- **surprise** (B 型): |r| × categoryDistance。カテゴリが離れた高相関に加点、同カテゴリの自明相関は減点
- **competitionGap**: 決算カード/migration-flow 由来 = 1.0 (競合に存在しない)、一般指標 = 0.5

lane: `must-write` (queryGap 閾値超 = 検索需要実証済) / `opportunity`。運用:

```bash
node .claude/scripts/blog/build-topic-queue.mjs            # 再構築 (週次 cron でも自動実行)
node .claude/scripts/blog/build-topic-queue.mjs --next 5   # 次に書く候補 5 件
/plan-article-queue                                         # スキル経由 (レポート付き)
/draft-from-trend --from queue                              # キュー先頭から 1 本生産
```

生産フローは既存のまま: `/draft-from-trend` → charts → factual-check → quality-gate → blog-critic PASS → develop push (blog-auto-publish.yml)。**1 回 1 記事・小バッチ** (週 2 セッション × 2-3 本。一括 15-20 本は session limit の実証あり)。

効果の書き戻し: 公開 4 週後に measure-gsc-impact 系の週次 cron が clicks を queue の done エントリへ記録し、
`/analyze-winning-patterns` の型別実測で四半期ごとにスコア重み・型配分を再学習する (evidence-based)。

## 5. ランキングページ拡充 (指標数で競合を抜く)

現状 2,124 active / 競合 todo-ran 1,501。**量はすでに逆転済みで、ボトルネックは公開整合とインデックス率**。

1. **公開整合の自動化**: sync-snapshots (R2) 後に git 派生キー (`known-ranking-keys.ts` + `sitemap-ranking-keys.ts`)
   を再生成し差分 PR を自動作成 (CI の `sync-ranking-keys` job)。sitemap は既に KNOWN 全キーを含む実装
   (`build-sitemap-ranking-keys.cjs`) なので、KNOWN が更新されれば新キーも自動掲載される。`indexable-ranking-keys.ts`
   は sitemap の安全弁 (legacy 手動入力) で専用生成器なし。マージ = 本番デプロイなので**まとめて承認**する
2. **1 コマンド公開**: `/publish-ranking <keys...>` → ranking-publisher agent (data 投入→ keys 整合→ deploy → 本番 200 実測)
3. **月次 metric 拡充**: estat-researcher が候補プール 8,838 件から月 30-50 件審査 → `05_指標バックログ.md`、
   data-ingester が high 優先から週 5-10 metric を config 化 + R2 投入 → 月末に一括公開。12-18 ヶ月で 3,000 metric
4. **AI コンテンツ**: 既存キュー (140/1,015 done) を週 25-40 件、高流入 incomplete 優先で継続 (~6 ヶ月で完了)

## 6. データ保有設計 (完全DBレス維持)

- ネタ選定の横断突合 (GSC×metric×相関×既存記事) は **build-topic-queue.mjs 内のエフェメラル計算 → 状態付き
  キュー JSON (git)**。永続 DB は作らない (`docs/01_技術設計/12_完全DBレス設計.md` 準拠)
- **R2 肥大リスク**: values.json は metric 単位で線形 → 問題なし。相関は O(n²) のため metric 3,000 到達前に
  `build-correlation-snapshot.ts` の incremental 化 (新規×既存のみ再計算) を実施 [中期 TODO]
- **非 e-Stat データの取り込み規約** [中期 TODO]: source adapter は `packages/data-configs/src/sources/<provider>.ts`、
  出力は `app/stats/<metric>/values.json` と同一スキーマ (下流の ranking/correlation が無改修で動く)、
  validate:config に provider/取得元 URL/license/取得日の必須メタ lint を追加

## 7. 施策 ID (改善バックログと対応)

| ID | 内容 | 期日 |
|---|---|---|
| BLOG-SEO-TYPES-01 | 型ポートフォリオ改訂 (D2/F/G 新設 + 実測補正) | 2026-07-05 deployed |
| BLOG-SEO-QUEUE-01 | topic-queue + /plan-article-queue + 週次 cron | 2026-07-05 deployed |
| BLOG-SEO-PACE-01 | 月 15-20 本生産 (4 週後 clicks 中央値で判定) | 2026-08-31 |
| RANKING-KEYS-SYNC-01 | keys 自動同期 + sitemap 新キー掲載 | 2026-08-02 |

判定はすべて `.claude/rules/evidence-based-judgment.md` 準拠 (実測コマンド併記・期日つき)。
