---
type: handoff
date: 2026-07-12
status: active
topic: SSDS ランキング拡充 (公開待ち) + 今セッションのデプロイ済み成果
tags: [ranking-expansion, ssds, estat, handoff]
---

# ハンドオフ: SSDS ランキング拡充 + UI/CTR デプロイ (2026-07-12)

別セッションで公開作業を引き継ぐための引き継ぎ。**デプロイは後でまとめて 1 回**の方針。

## 1. すでに本番 LIVE (今セッションでデプロイ済み・確認済み)

- **UI リデザイン** (PR #564 → main): home hero 画像 + サイト幅 1280 統一 (PageShell/ArticleShell) + 注目ランキングのタイルマップ改善 (順位配色+金メダルリング+凡例) + 運営者プロフィールカード分離 + アバター + /blog 2カラム。本番 200 実測済。
- **ランキング CTR 改修 (RANKING-CTR-01)**: 高表示×低CTR 13本の seoTitle を curiosity gap 化。config→R2 item.json 反映済 (item-seo-refresh)。本番でタイトル LIVE 確認済 (例 vacant-housing-rate)。**GSC で CTR リフトを 2-4 週後 (〜2026-08-08) に実測** → 効けば残り 723本 (表示あり×クリックゼロ) へ展開。真実源: `docs/todo/01_改善バックログ.md#RANKING-CTR-01`。

## 2. 生成済みだが未公開 (次セッションで公開が必要) ★引き継ぎの核心

**SSDS 拡充 高価値 curated ~46 本を生成・validate 済み。まだ e-Stat 投入していないため本番は soft404 (「ランキングが見つかりません」)。**

| バッチ | 本数 | 内容 | 置き場 |
|---|---|---|---|
| batch-1 | 7 | 外国人人口/単独・核家族・高齢者世帯/流出人口/食料自給率 | **main** (PR#565・soft404) |
| chunk-1 | 27 | GDP業種別/財政費目/保険種別/費目別支出/税 | develop (commit 1d791d15/0162b568) |
| chunk-2 | 12 | 教員数/学級数/長期欠席児童/農業従事者/6次産業 | develop (commit 7f5269ee) |

### 公開手順 (最後に 1 デプロイの方針)
1. develop の ~39本 + main の 7本を **e-Stat 投入** (page-data-batch → R2 `app/stats/<key>/values.json`)。
   - ⚠️ `data-refresh.yml` は **main checkout・`--metric` 単一**。46本を 1デプロイで出すには **develop を読む push-trigger 投入 workflow を 1 本組む**のが要 (未実装)。妥協案: develop→main マージ後に data-refresh (全 or 個別) → sync-snapshots → 2回目デプロイ (= 2デプロイ)。
2. `generate-ranking-items.ts` で item.json 生成 → `KNOWN_RANKING_KEYS` / `SITEMAP_RANKING_KEYS` / `INDEXABLE` 再生成 (`sync-snapshots.yml`)。
3. デプロイ → **本番 200 を Googlebot UA で実測** (`nextjs-ssg-preservation.md` の soft404 固着に注意)。
4. GSC 計測は公開 4 週後。
   - 正典手順: `.claude/rules/metric-config-standards.md`「isActive:true ≠ 本番公開」/ memory `project_ranking_publish_pipeline_gap`。

## 3. 再利用ツール (今セッションで構築)

- **DBレス発見**: `.claude/scripts/estat/{discover-prefecture-candidates,fetch-estat-meta,enumerate-ssds-indicators}.mjs` + CI `discover-estat-candidates.yml`/`estat-fetch-meta.yml`/`estat-ssds-enum.yml` (専用ブランチ push で発火・main デプロイ不要)。
- **config 生成器**: `.claude/scripts/estat/gen-ssds-configs.mjs` (spec JSON→config.ts、**subtitle 自動分離**・dup-title/GONE/正規化重複を skip)。spec 例は scratchpad の ssds-c1/c2.json (次回は spec を docs か repo に置くと良い)。

## 4. 知見 (次セッションが同じ壁を踏まないために)

- **「e-Stat 全展開」= 8,688生テーブル≒17万metric = 物理的に不可能**。生 survey クロス集計は多次元でキュレーション重の二次ソース。本命は SSDS。
- **SSDS クリーン候補 4,181 → タイトル非重複 3,981 → 実用 ~2,705 だが**、lint dup-title の正規化 (**括弧内全除去**) を考慮すると多くが既存の変種重複。**認知度の高い指標 (県民所得・GDP・保険普及率等) はほぼ既存済**。真に新規で高価値は小さく、財政費目・教育の細分に寄る。
- **★subtitle で変種は追加可能**: 同名グループは subtitle 無しのものだけ error。gen-ssds-configs.mjs が末尾括弧を subtitle 分離するので変種 (GDP業種別等) を追加できる。自分の追加が既存の subtitle 無し config に衝突相手を与えると既存側が error → 自分の衝突分を skip で回避。
- **供給は制約でない** (12週GSC: 既存2,141本の41%がゼロ表示・クリックは上位50本に49%集中)。拡充より CTR 改修 (RANKING-CTR-01) + ai-content 未完860本の方が ROI 高い。→ memory `project_competitor_indicator_benchmark`。
- **公開は構造上 2 デプロイ/サイクル** (config→main + KNOWN反映)。1 デプロイは develop 読みの投入が要。

## 5. 真実源マップ (知見の管理先)

- memory `project_estat_expansion_pipeline_2026_07` — 拡充スコープ・パイプライン・subtitle 知見・公開待ち状態
- memory `project_competitor_indicator_benchmark` — 2,141>競合・供給でなく需要が制約
- `docs/todo/03_指標バックログ.md` — 拡充スコープ (2026-07-11 更新節)
- `docs/todo/01_改善バックログ.md#RANKING-CTR-01` — CTR 改修 (公開済・計測待ち)
- この handoff — 消化 (公開完了) したら抽出→削除 (`docs/handoffs/README.md`)
