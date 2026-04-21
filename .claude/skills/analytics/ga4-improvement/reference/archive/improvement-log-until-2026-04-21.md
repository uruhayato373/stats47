# GA4 改善記録

Google Analytics 4 のアクセス指標を時系列で追跡する記録簿。
更新ルールは `../SKILL.md` を参照。

- **プロパティ ID**: `463218070`
- **本番 URL**: `https://stats47.jp`
- **開始日**: 2026-04-15

---

## 1. Baseline

**取得日**: 2026-04-17
**ソース**: `reference/snapshots/2026-W16/overview.csv`, `channels.csv`, `pages.csv`

### overview（過去 28 日 / 2026-03-20 〜 2026-04-16）

| 指標 | 値 |
|---|---|
| screenPageViews (PV) | 2,163 |
| activeUsers | 689 |
| newUsers | 681 |
| sessions | 759 |
| averageSessionDuration (秒) | 136.66 |
| bounceRate | 42.42% |

### 流入経路（channels.csv、過去 28 日）

| チャネル | セッション | ユーザー | PV | 直帰率 |
|---|---|---|---|---|
| Direct | 456 | 425 | 1,034 | 42.11% |
| Organic Search | 115 | 95 | 558 | 33.04% |
| Referral | 113 | 94 | 452 | 30.09% |
| Organic Social | 72 | 72 | 90 | 79.17% |
| Unassigned | 4 | 3 | 29 | 75.00% |

### 上位ページ（pages.csv、過去 28 日）

| # | ページ | PV | ユーザー | 平均滞在(秒) |
|---|---|---|---|---|
| 1 | / | 472 | 376 | 47.12 |
| 2 | /themes/population-dynamics | 141 | 2 | 4169.34 |
| 3 | /search | 86 | 7 | 62.82 |
| 4 | /ranking | 84 | 16 | 253.40 |
| 5 | /ranking/total-population | 84 | 10 | 142.46 |
| 6 | /ranking/annual-sunshine-duration | 47 | 19 | 93.05 |
| 7 | /correlation | 44 | 40 | 62.46 |
| 8 | /themes | 42 | 3 | 354.58 |
| 9 | /category/landweather | 37 | 5 | 78.86 |
| 10 | /ports | 33 | 2 | 736.01 |

---

## 2. Action Log

施策を打ったら以下の書式で追記する。

### Phase 0 — スキル新設（2026-04-15）

**日付**: 2026-04-15
**コミット**: _(このコミット)_

#### 変更内容

- `.claude/skills/analytics/ga4-improvement/SKILL.md` 新規作成
- `.claude/skills/analytics/ga4-improvement/reference/improvement-log.md` 新規作成
- `/fetch-ga4-data snapshot` モード新設
- `/weekly-review` から自動で observe モードが呼ばれるよう統合

#### 想定効果

- スキルそのものの効果はない。以降の Action Log で施策 → 数値変化を追跡できるようになる基盤

---

### Fix GA4-01 — gtag strategy を `lazyOnload` → `afterInteractive` に戻す（2026-04-18）

**日付**: 2026-04-18
**ファイル**: `apps/web/src/lib/analytics/GoogleAnalytics.tsx:43,45`

#### 背景（RCA）

W16 取得 (2026-04-18) で `2026-03-28 以降に PV が前日比 1/10 へ急落` を確認。GSC clicks は同期間 5〜77 で健全 → 真のトラフィック消失ではなく **計測断絶**。

**原因コミット (確証)**: `c17ac68d 2026-03-27 21:17 perf: JS バンドル ~1,210KB 削減` で gtag.js の Script strategy を `afterInteractive` → `lazyOnload` に変更。`lazyOnload` は window load 後の idle 起動のため、ファーストビューで離脱するユーザーや /ranking/* 等の重いページでは gtag 自体が読まれず、`PageViewTracker` の `window.gtag?.(...)` が no-op で終わる (`apps/web/src/lib/analytics/pageview.ts:22`)。`send_page_view: false` 運用 (`GoogleAnalytics.tsx:55`) と組み合わさり PV/sessions が約 1/10 に収縮した。

#### 観測値の比較

| 日付 | GA4 PV | GSC clicks | 計測健全度 |
|---|---|---|---|
| 3/26 | 301 | 10 | OK |
| 3/27 | 71 | 13 | デプロイ当日 |
| 3/28 | **17** | 6 | 急落開始 |
| 4/09 | 73 | **77** | GSC ↑でも GA4 横ばい (= 計測欠損) |
| 4/15 | 0 | 18 | 完全断絶状態 |

#### 変更内容

```diff
- <Script src={...} strategy="lazyOnload" />
- <Script id="google-analytics" strategy="lazyOnload">
+ <Script src={...} strategy="afterInteractive" />
+ <Script id="google-analytics" strategy="afterInteractive">
```

JS バンドル削減目的の他のファイル (lucide-react / D3 / KaTeX dynamic import) は維持。GA タグだけは初期描画前に発火させる。

#### 想定効果 (W17 取得時に検証)

- PV / sessions / users が 3/27 以前の水準 (200-300 PV/日 規模) に回復
- Baseline (W16: PV 2,163) は計測断絶後の値であり、修正デプロイ後に**再ベースライン取得**が必要

#### 残課題 (確証外、別途検討)

- `CookieConsentBanner.tsx:48-51` の `handleDecline` で `gtag('consent','update',{...denied})` を明示発火していない問題 (Consent Mode v2 のモデル化レポートが効かない)
- 国内向けサイトとして `analytics_storage: 'granted'` をデフォルトにする選択肢

---

## 3. Observation Log

施策適用後の数値トレンドを時系列で記録する。**1 行追記でも OK**、長文は不要。

| 日付 | PV | users | sessions | bounceRate | Organic | Direct | Social | 備考 |
|---|---|---|---|---|---|---|---|---|
| 2026-04-17 | 2,163 | 689 | 759 | 42.4% | 115 | 456 | 72 | **Baseline** (W16, last28d 2026-03-20〜2026-04-16). Direct が 60% を占有、Organic は 15% 程度 |

### 2026-04-17 MID 観測 — `/themes/population-dynamics` 異常滞在調査

W16 snapshot の pages.csv で `/themes/population-dynamics` に以下の異常値を確認:

| 指標 | 実測 | 他 /themes/* 平均 | 備考 |
|---|---|---|---|
| PV | 141 | 20-30 | 最大 |
| active users | 2 | 1-2 | — |
| PV / user | **70.5** | **25 以下** | 異常（Bot 疑い） |
| avg session duration | **4,169 秒（≈69 分）** | 700-1,500 秒 | 異常 |
| engagement rate | 100% | 60-80% | 1.0 固定 = 人工的 |

**仮説（確度順）**
1. Bot traffic（60%）: PV/user 70.5 は自動クロールのシグネチャ。ページは D3 散布図 4 枚・Leaflet Map 等を動的ロードするため、クローラーのレンダリング時間が累積している可能性
2. 放置タブ（30%）: GA4 engagement_time は visible タブで加算され続ける。2 user のうち片方が長時間放置の疑い
3. ページ実装バグ（10%）: `apps/web/src/app/themes/population-dynamics/` に setInterval/setTimeout なし、polling 無し。コード変更は不要と判断

**検証アクション（ユーザー作業）**
- GA4 管理 → データフィルタで「既知の bot トラフィックを除外」を有効化
- Cloudflare Analytics で `/themes/population-dynamics` の User-Agent 分布を確認
- GA4 の当該ページで Device Category / Country ブレークダウンを確認

**観測継続**
- W17-W18 snapshot で PV/user が 25 以下に収束するか観測
- 収束しない場合は middleware で UA 判定 + 410、または GA4 IP 除外で対処

---

## 4. Next Actions

優先度順。実施したら Action Log に移動し、ここから削除する。

### 観測後に具体化（Baseline 取得後に埋める）

- _空_

---

## 付録: GA4 データ取得ガイド

### snapshot 取得（週次）

```
/fetch-ga4-data last28d snapshot YYYY-Www
```

上記が `reference/snapshots/YYYY-Www/` に 5 ファイルを保存する:
- `overview.csv` — サマリー
- `pages.csv` — ページ別（全件）
- `channels.csv` — 流入経路
- `devices.csv` — デバイス別
- `daily.csv` — 日次推移

### 観測ログ追記

```
/ga4-improvement observe
```

最新 snapshots ディレクトリを読み込んで Observation Log に追記する。

### `/weekly-review` からの自動実行

`/weekly-review` は Phase 1 Agent C で以下を一連で実行する:
1. `/fetch-ga4-data last28d snapshot <今週の YYYY-Www>` で CSV 保存
2. `/ga4-improvement observe` で Observation Log 更新
3. レビュー本文から snapshot/improvement-log への参照を記載
