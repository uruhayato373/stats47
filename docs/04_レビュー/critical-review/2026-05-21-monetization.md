---
type: critical-review
topic: monetization
date: 2026-05-21
status: active
related_strategy: docs/00_プロジェクト管理/02_収益化戦略.md
---

# stats47 収益化戦略分析 — AdSense 単独で月 ¥10,000

## 問い

Google AdSense **単独** で月 ¥10,000 を達成するには何をすべきか。

前提として、2026-05-20 の「AdSense 100x」レビュー（[`2026-05-20-monetization.md`](./2026-05-20-monetization.md)）でレバー分解は済んでいる。本レビューはそれを「月 ¥10,000」という具体マイルストーンに再射影し、**到達経路と中間ゲート**を定義する。

## 現状サマリー (2026-W21, 05/13–05/19)

| 項目 | 値 | 出典 |
|---|---|---|
| AdSense Earnings | **¥61 / 週**（≒¥264/月） | `.claude/state/metrics/adsense/history.csv` W21 |
| AdSense Page Views | 1,711 / 週 | 同上 |
| AdSense RPM | ¥36 | 同上 |
| Impressions / PV | 0.93（1,588 ÷ 1,711） | 計算値 |
| CTR / Viewability | 0.44% / 54.3% | 同上 |
| GA4 Pageviews | 2,830 / 週（W21、前週比 -68.7%） | `.claude/state/metrics/ga4/history.csv` |
| GSC Clicks / Impressions | 797 / 31,810（W21、position 8.64） | `.claude/state/metrics/gsc/history.csv` |

**データ信頼性の注意（2026-05-21 実証済み・解決）**: GA4 LATEST の「W21 PV 2,830・前週比 -68.7%」は **計測アーティファクトで、実際のトラフィック減少ではない**。GA4 Data API を当日（2026-05-21）直接照会した結果:

- カレンダー週の実測 PV: W20（05/06–12)= **2,039** / W21（05/13–19)= **2,836**。W21 はむしろ +39%。
- 流入の本体である Organic Search の PV: W20 **1,269** → W21 **1,824**（**+44%**）。
- GSC も整合: clicks W20 832 → W21 797（-4%、ほぼ横ばい）/ impressions 33,302 → 31,810（-4.5%）。
- `history.csv` の W20 PV=9,028 は API 再照会で再現せず（実カレンダー週は 2,039）。同値は `ga4-improvement` snapshot の last28d ローリング値 or bot 混入値が「週次」ラベルで保存されたもの。**`.claude/state/metrics/ga4/history.csv` の pageviews 列の前週比は信頼できない**（→ 後述「データパイプラインの課題」）。
- bot スパイク確定: 2026-04-27 単日で 3,194 PV / 154 sessions（PV/session 20.7、通常 ~2）。

→ **トラフィック崩壊は起きていない。Organic は増加基調。** 本レビューの倍率計算は AdSense PV（¥に直結する実測値 1,711）を基準にしており、この検証で前提は揺るがない。WoW 監視は GA4 history ではなく **GSC clicks と AdSense console PV** を用いること。

## 結論（先に）

**AdSense Earnings = AdSense PV × RPM ÷ 1000。** 月 ¥10,000（¥2,309/週）は現状 ¥61/週の **約 38 倍**。

```
38x  =  RPM 1.8x  ×  デリバリー 1.1x  ×  トラフィック 19x
       (¥36→¥65)    (0.93→1.0 impr/PV)   (AdSense PV 1.7k→33k/週)
```

広告側で取れるのは **RPM × デリバリー ≒ 2x**（¥61→¥120/週 ≒ **¥520/月**）まで。これは数週〜2ヶ月で取れるが、ここで頭打ちになる。**残り 19 倍はトラフィック増でしか埋まらない。**

→ **「AdSense で月 ¥10,000」は広告最適化の問題ではなく、ほぼ純粋に SEO トラフィックの問題。** 広告チューニングを「やらない」と ¥10,000 の天井そのものが下がる（同じ PV で 2 倍違う）ので必須だが、それ単独では 1/20 しか埋まらない。

統計系コンテンツの RPM 天井は実測根拠で ¥75 前後（2026-05-20 レビュー）。RPM に ¥100 超を期待しないこと。

## 月 ¥10,000 を構成する 3 レバー

### レバー A: RPM ¥36 → ¥65（約 1.8x）★低コスト・即効

- **現状**: RPM ¥36 / Viewability 54.3%（W17 の 61.9% から低下 — Impression 増で深い枠が増え希釈）/ CTR 0.44%。
- **施策**:
  1. 自動広告（Anchor + Vignette）を ON のまま Viewability を計測 — モバイル Anchor は 2026-05-20 実施済み。
  2. ファーストビュー直下に手動枠を 1 つ寄せ、Viewability 54% → 70%+ を狙う。
  3. `feature/adsense-placement-optimization` / `feature/adsense-all-pages` / PR #321 をマージし、全 page_key に枠が載った状態で 2 週計測。
- **想定効果**: ¥36 → ¥55〜65（保守 1.5x / 標準 1.8x）。[根拠: Viewability を 54%→72% に上げると Impression あたり収益が比例的に増。統計コンテンツの天井 ¥75]
- **検証コマンド**: `node .claude/scripts/metrics/fetch-adsense-snapshot.mjs 2026-W24 && cat .claude/skills/analytics/adsense-improvement/reference/snapshots/2026-W24/devices.csv`
- **コスト**: S。**UX 影響**: 中（広告増 → 直帰率を GA4 で監視）。

### レバー B: デリバリー率 0.93 → 1.0〜1.1（約 1.1x）★ほぼ取り切り済み

- **現状**: Impressions/PV は W17 の 0.42 から **0.93 まで改善済み**（2026-05-20 までの配置施策の効果）。伸びしろは小さい。
- **残課題**: `AdSenseScript.tsx` の 3,000ms 遅延 + `AdSenseAd.tsx` の lazyLoad。Mobile LCP 5〜19 秒の土台で、深い枠は描画前に離脱され発火しない。
- **施策**: スクリプト遅延と lazyLoad `rootMargin` を **LCP を計測しながら** 緩める。RPM↑ vs LCP↑ のトレードオフ、A/B 必須。
- **想定効果**: 0.93 → 1.05 程度（1.1x）。これ以上は LCP 改善が前提。
- **コスト**: S。**UX 影響**: 中（LCP 悪化リスク、PSI 日次で監視）。

### レバー C: トラフィック 19x ★本丸・長期（12ヶ月）

これが月 ¥10,000 の **本体（38x のうち 19x）**。

- **現状の構造的余地**: D1 の metric キーは 2,185 件あるのに、ページ化（page_components）されているのは 53 page_key のみ。競合 todo-ran は指標 1,501 件・uub 1,843 件（memory `competitor_indicator_benchmark`）。**indexable ページ数 ≈ AdSense PV 母数** であり、ここが 3〜4 倍開いている。
- **GSC 実測**: clicks 797/週・impressions 31,810/週・position 8.64。position 8.64 は「2ページ目上部」で、3〜10 位への押し上げ + ページ数拡大の両輪で clicks 10〜20 倍は射程内（ただし複利は一巡で減速）。
- **施策（AdSense 固有ではない・既存ログの TODO）**:
  - 47 都道府県 × metric のプログラマティック SEO でランキングページ量産 → `docs/05_改善ログ/indicator-expansion.md`
  - 既存ページの順位改善 → `docs/05_改善ログ/gsc.md`
- **前提条件**: PSI Mobile LCP 5〜19 秒。LCP が遅いと順位・直帰・広告表示の 3 つ全部を下げる。LCP 改善（別タスク・L 工数）が全レバーの天井。

## 優先度マトリクス

| レバー | 倍率 | 実装容易性 | UX 影響 | 期間 | 推奨順位 |
|---|---|---|---|---|---|
| A. RPM ¥36→¥65 | ×1.8 | S | 中 | 2〜6 週 | 1 位（即効） |
| B. デリバリー 0.93→1.05 | ×1.1 | S | 中 | 1〜3 週 | 2 位（取り切り） |
| C. トラフィック 19x | ×19 | L | 無 | 12ヶ月 | 3 位（本丸） |
| 前提: LCP 改善 | （天井解放） | L | 無（向上） | 並行 | 前提条件 |

A×B ＝ **約 2x**（¥61→¥120/週 ≒ ¥520/月）が 2ヶ月で取れる現実ライン。残り 19x は C 次第。

## 月 ¥10,000 への到達ゲート

| マイルストーン | 必要週収益 | 必要 RPM | 必要 AdSense PV/週 | 想定到達 |
|---|---|---|---|---|
| 現状 | ¥61 | ¥36 | 1,711 | 2026-05 |
| **¥1,000/月** | ¥231 | ¥55 | 4,200（2.5x） | 2026-08 |
| **¥3,000/月** | ¥693 | ¥60 | 11,500（6.7x） | 2026-12 |
| **¥10,000/月** | ¥2,309 | ¥65 | 35,500（21x） | 2027-Q2 |

RPM はレバー A で 2〜3ヶ月のうちに ¥55〜65 へ。以降の各ゲートの差分は **すべて AdSense PV（＝トラフィック）**。¥10,000 は AdSense 単独なら **約 12ヶ月**の SEO プロジェクト。

## 推奨アクション

1. **レバー A を即着手**（最優先・即効）。`feature/adsense-placement-optimization` / `feature/adsense-all-pages` / PR #321 をマージ → 全 page_key に枠が載った状態で W24・W25 の RPM・Viewability を計測。自動広告 Anchor/Vignette の Viewability を確認。
2. **レバー B を A/B で慎重に**。`AdSenseScript.tsx` の 3,000ms 遅延緩和は LCP 悪化と表裏。PSI 日次計測で施策前後を必ず比較。
3. **GA4 PV 急減の真因を確定**（2026-05-25 まで）。W20 スパイクが bot なら倍率基準が変わる。`/fetch-ga4-data` で channel 別確認。
4. **月 ¥10,000 の本体はトラフィック 19x** と認識し、`docs/05_改善ログ/gsc.md`・`indicator-expansion.md` の SEO 拡大を最優先リソースに据える。広告チューニングだけでは ¥520/月 で頭打ち。
5. **PSI Mobile LCP 改善を並行**。3 レバー全部の天井。
6. **AdSense 単独に固執しない**。`02_収益化戦略.md` の Two-track 上、月 ¥10,000 の現実的な最短路は「AdSense ¥3,000〜5,000 ＋ アフィリエイト ¥5,000〜7,000」の合算。AdSense 単独 ¥10,000 は 12ヶ月、ハイブリッドなら同水準を 6ヶ月で狙える。アフィリエイト（推奨 ★★★★★）と必ず並走させること。

## 検証ロードマップ

| 期日 | 検証項目 | 成功判定 | 撤退/再考 |
|---|---|---|---|
| ~~2026-05-25~~ ✅ 解決 | GA4 PV 急減の真因 | アーティファクト確定（実トラフィックは増加基調） | — |
| 2026-06-08 | W24 RPM/Viewability 計測（配置 PR 群は反映済み） | Impressions/PV ≥ 1.0 / RPM ≥ ¥45 | < 0.8 → 設置漏れ調査 |
| 2026-06-30 | レバー A の RPM | RPM ≥ ¥50 | < ¥40 → 自動広告/配置見直し |
| 2026-08-31 | 月 ¥1,000 ゲート | Earnings ≥ ¥231/週 | < ¥150 → UX 毀損 vs 収益を再評価 |
| 2026-12-31 | 月 ¥3,000 ゲート | Earnings ≥ ¥693/週 | 未達 → ¥10,000 期日を後ろ倒し |
| 2027-Q2 | 月 ¥10,000 ゲート | Earnings ≥ ¥2,309/週 | 未達 → アフィリエイト合算で達成判断 |

## データパイプラインの課題（2026-05-21 発見）

`.claude/state/metrics/ga4/history.csv` の `pageviews` 列は週次ラベルが付くが、実態は last28d ローリング値または bot 混入値が混在しており、**週次ラベルと中身が一致していない**。W20=9,028 はカレンダー週実測 2,039 と 4.4 倍乖離。`LATEST.md` の前週比もこの列から算出されるため誤差が増幅される。

- 影響: `weekly-review` / `weekly-plan` が GA4 PV の WoW を判断材料にすると誤判定する。
- 暫定対処: PV の WoW は GSC clicks（`.claude/state/metrics/gsc/history.csv`）で代替。GSC は週次バケットで整合が取れている。
- 恒久対処（別タスク・要起票）: GA4 history 生成スクリプトを「カレンダー週バケット + country=Japan フィルタ」に統一する。`docs/04_レビュー/critical-review/2026-05-16-ga4-bot-pollution.md` の bot 監査と同根の問題。

## 注意事項

- 月 ¥10,000（AdSense 単独）は約 12ヶ月の目標。広告最適化（2x）は 2ヶ月で取れるが、残り 19x は SEO トラフィック。
- 広告枠を増やすと UX が毀損する。各設置後 2 週、GA4 で直帰率・滞在時間を監視。
- RPM に ¥100 超を期待しない（統計コンテンツは広告主入札が薄い、実測根拠で天井 ¥75）。
- AdSense は `02_収益化戦略.md` 上では補完チャネル（推奨 ★★★）。月 ¥10,000 を最短で狙うならアフィリエイト主軸との合算が現実的。
