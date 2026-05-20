---
type: critical-review
topic: monetization
date: 2026-05-20
status: active
related_strategy: docs/00_プロジェクト管理/02_収益化戦略.md
---

# stats47 収益化戦略分析 — AdSense 収益 100x

## 問い

AdSense 収益を 100 倍にするには何をすべきか。

> **2026-05-20 追記 — データ収集を復旧、最新週で再計測**
> OAuth 再認証を実施し `GOOGLE_ADSENSE_REFRESH_TOKEN` を local・GHA secret とも更新。W21 (05/13–05/19) を取得:
> Earnings **¥61/週**（W17 比 +69%）/ RPM **¥36**（+38%）/ Impressions **1,588**（+183%）/ **Impressions/PV 0.93**（W17 0.42 から改善）/ CTR 0.44%（impression 増で希釈）/ Viewability 54.3%。
> → 下記レバー 1（デリバリー率）は W17→W21 で既に約 2 倍実現済み。残る伸びしろは縮小し、**100x はトラフィックがさらに支配的**になった。基準は ¥61/週（→100x = ¥6,100/週）。

## 現状サマリー

| 項目 | 値 | 出典 |
|---|---|---|
| AdSense Earnings | ¥36 / 週（≒¥155/月） | `.claude/state/metrics/adsense/history.csv` W17 |
| AdSense Page Views | 1,351 / 週 | 同上 |
| AdSense RPM | ¥26 | 同上 |
| Ad Impressions | 561 / 週 | 同上 |
| Impressions / PV | **0.42**（561 ÷ 1,351） | 計算値 |
| CTR / Viewability | 1.25% / 61.9% | 同上 |
| GA4 Pageviews | 9,028 / 週（W20、+44%/週） | `.claude/state/metrics/ga4/history.csv` |
| GSC Clicks / Impressions | 832 / 33,302（W20、直近 +27%/週） | `.claude/state/metrics/gsc/history.csv` |
| 公開記事 | 179（下書き 11） | D1 `articles` |
| metric キー | 2,185 | D1 `metrics` |
| page_components | 411 / 53 page_key | D1 `page_components` |

**重要 — AdSense データ収集が停止中**: `history.csv` は W17 で更新停止（GSC/GA4 は W20 まで継続）。原因は確定済み: GHA workflow `fetch-metrics-weekly.yml` の run 25989490636（2026-05-17）ログで `AdSense snapshot failed: invalid_grant` を確認。`GOOGLE_ADSENSE_REFRESH_TOKEN` が local・GHA secret **両方とも失効**（AdSense OAuth client が Testing mode のため短期失効）。`fetch-adsense-snapshot` ステップは `continue-on-error: true` で失敗が silent 化していた。**1 データ点では効果判定が不可能。OAuth 再認証が 100x への前提条件。**

注: AdSense 広告コンポーネントの設置状況をコード調査した結果、当初の仮説「広告がほぼ載っていないページが大半」は**部分的に誤り**だった。下記レバー 1 を修正済み。

## 結論（先に）

**AdSense 収益 = AdSense PV × RPM ÷ 1000。** 100x は 3 つの掛け算でしか達成できない。

```
収益 100x  =  RPM 3x  ×  広告デリバリー率 3x  ×  トラフィック 11x
            (¥26→¥75)   (0.42→1.3 impr/PV)      (SEO 流入)
```

RPM 単独では 100x は不可能（日本の統計系コンテンツの RPM 天井は実測根拠で 3〜4x が限界）。**100x の大半はトラフィック増**であり、本質は AdSense 最適化ではなく SEO スケールの問題。広告側の最適化（RPM × デリバリー率 ≒ 9x）は数週〜数ヶ月で取れるが、それだけでは ¥36→¥320/週（9x）で頭打ち。残り約 11x はトラフィック次第。

## 100x を構成する 3 レバー

### レバー 1: 広告デリバリー率の改善 — 0.42 → 1.2〜1.5（約 3x）★最優先

- **実測**: Impressions 561 ÷ PV 1,351 = **0.42 表示/PV**。
- **コード調査結果（2026-05-20）**: 広告ユニットの設置は当初仮説より広い。`/`・`/category/*`・`/ranking`・`/ranking/*`・`/areas`・`/areas/*`・`/blog/*`・`/survey/*`・`/compare/*` に AdSense ユニット設置済み（7 スロット定義、`/blog/*` は 4 枠 + 記事内 inline）。グローバルサイドバーにも `MAIN_SIDEBAR`。
  - 唯一のページ単位の空白: **`/search`（広告 0 枠）**。ただし `robots: noindex` のページで内部回遊流入のみ。
- **0.42 が低い真因（修正後）**: 「設置漏れ」ではなく「デリバリー throttle」。
  1. `AdSenseScript.tsx` が `setTimeout 3000ms + requestIdleCallback` 後にスクリプト読込
  2. `AdSenseAd.tsx` が `IntersectionObserver`（lazyLoad 既定 ON）で各枠を遅延
  3. 土台の Mobile LCP 5〜19 秒 → 描画前にユーザーが離脱、広告 request が発火しない
  - → 3 つが重なり、ページは見られても広告が出ない。Viewability 61.9% も同じ根。
- **施策**: スクリプト遅延（3000ms）と lazyLoad の `rootMargin` を測定しながら緩める。これは **RPM↑ vs LCP↑ のトレードオフ**であり、A/B と実測必須。`/search` には footer 広告 1 枠追加（結果あり時のみ表示、AdSense ポリシー考慮）。
- **想定効果**: 0.42 → 1.2〜1.5 表示/PV で **約 3x**（当初の 5x から下方修正。設置はすでに広く、伸びしろは throttle 緩和分のみ）。
- **コスト**: S（パラメータ調整）。ただし LCP 計測との並行が前提で、AdSense データ収集が復旧するまで効果判定は不可。

### レバー 2: RPM — ¥26 → ¥75（約 3x）★低コスト

- **実測根拠**: 現 RPM ¥26 / CTR 1.25% / Viewability 61.9%。`02_収益化戦略.md` が日本の display 業界水準を ¥100〜200 と記載。統計系は商業価値が低くこの下限寄り。
- **施策**: 自動広告 ON、Anchor / Vignette の A/B、ファーストビュー直下への手動配置、Viewability 61.9% → 75%+ を狙う上部寄せ。
- **想定効果**: 保守 3x（¥75）。楽観でも 4x が天井 — **これ以上を RPM に期待しない**（根拠: 統計コンテンツの広告主入札が薄い）。
- **検証コマンド**: AdSense 管理画面で施策前後 2 週の RPM 比較。週次 `history.csv` の収集を復旧してから判定。

### レバー 3: トラフィック — 7〜11x ★本丸・長期（6〜18ヶ月）

- **現状**: GSC impressions が直近 4 週で 12,865 → 33,302（+27%/週）。この複利は持続しない（順位上昇の一巡で減速する）。
- **構造的余地**: metric キー 2,185 に対し page_components が載るのは 53 page_key のみ。競合 todo-ran は指標 1,501 件（memory `competitor_indicator_benchmark`）。**indexable ページ数の拡大**が 7〜11x の唯一の道。
  - 47 都道府県 × metric のプログラマティック SEO、ランキングページ量産。
- **施策**: 既存の改善ログ（`docs/05_改善ログ/gsc.md`・`indicator-expansion.md`）の TODO を継続。AdSense 固有施策ではない。
- **前提条件**: PSI Mobile LCP 5〜19 秒。広告は LCP が遅いほど描画前に離脱され表示・収益とも頭打ち。LCP 改善（別タスク・L 工数）が 3 レバー全部の天井を上げる。

## 優先度マトリクス

| レバー | 倍率 | 実装容易性 | UX 影響 | 期間 | 推奨順位 |
|---|---|---|---|---|---|
| 0. AdSense データ収集復旧 | （測定の前提） | S（要 OAuth 再認証） | 無 | 即日 | **最優先・ブロッカー** |
| 1. 広告デリバリー率 0.42→1.3 | ×3 | S | 中 | 1〜3 週 | 1 位 |
| 2. RPM ¥26→¥75 | ×3 | S | 低〜中 | 2〜6 週 | 2 位 |
| 3. トラフィック 11x | ×11 | L | 無 | 6〜18ヶ月 | 3 位（本丸） |
| 前提: LCP 改善 | （天井解放） | L | 無（向上） | 並行 | 前提条件 |

レバー 1×2 = **約 9x**（¥155→¥1,400/月）が数ヶ月で到達可能な現実ライン。残り ~11x は SEO 次第。

## 推奨アクション

1. **AdSense OAuth を再認証**（ブロッカー・即日）。`GOOGLE_ADSENSE_REFRESH_TOKEN` が local・GHA secret 両方失効。`.claude/skills/analytics/fetch-adsense-data/SKILL.md` の手順で loopback OAuth → `.env.local` 更新 → `gh secret set GOOGLE_ADSENSE_REFRESH_TOKEN` で GHA も更新。**根本対策**: Google Cloud Console で AdSense OAuth client を Testing → In production に publish（しないと数週で再失効）。これが済むまで効果判定は不可能。
2. **広告デリバリー率の改善**（レバー 1）。`AdSenseScript.tsx` の 3000ms 遅延と `AdSenseAd.tsx` の lazyLoad を測定しながら緩める。`/search` に footer 広告 1 枠追加。RPM↑ vs LCP↑ のトレードオフのため A/B 必須。
3. **RPM 最適化 A/B**（レバー 2）。自動広告 ON、Anchor 試行、施策前後 2 週で RPM 比較。
4. **100x の本丸はトラフィック**と認識し、SEO 拡大（`docs/05_改善ログ/gsc.md`・`indicator-expansion.md`）を最優先リソースに据える。AdSense 最適化だけでは 9x で頭打ち。
5. **PSI LCP 改善を並行**。3 レバー全部の天井。

## 検証ロードマップ

| 期日 | 検証項目 | 成功判定 | 撤退/再考 |
|---|---|---|---|
| 2026-05-27 | AdSense 週次収集復旧 | history.csv に W20-21 が入る | 入らない → 収集スクリプト修正 |
| 2026-06-10 | 広告ユニット全 page_key 設置 | Impressions/PV ≥ 1.5 | < 0.8 → 設置漏れ調査 |
| 2026-06-30 | RPM A/B | RPM ≥ ¥50 | < ¥35 → 配置・自動広告見直し |
| 2026-07-31 | レバー 1×2 合算 | 月収益 ≥ ¥1,500（10x） | < ¥600 → UX 毀損 vs 収益を再評価 |
| 2026 下期〜 | トラフィック 7x | GA4 PV ≥ 60,000/週 | 未達 → 100x 期日を後ろ倒し |

## 注意事項

- 100x（¥15,500/月）は 12〜18ヶ月の目標。広告最適化（15x）と SEO トラフィック（7x）の積。
- 広告表示数を増やすと UX が毀損する。各設置は A/B でバウンス率・滞在時間を監視。
- `02_収益化戦略.md` の Two-track 戦略上、AdSense は補完チャネル（推奨 ★★★）。100x を AdSense 単独で追わず、アフィリエイトと並走させる。
