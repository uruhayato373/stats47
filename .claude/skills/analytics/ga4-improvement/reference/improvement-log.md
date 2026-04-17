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

## 3. Observation Log

施策適用後の数値トレンドを時系列で記録する。**1 行追記でも OK**、長文は不要。

| 日付 | PV | users | sessions | bounceRate | Organic | Direct | Social | 備考 |
|---|---|---|---|---|---|---|---|---|
| 2026-04-17 | 2,163 | 689 | 759 | 42.4% | 115 | 456 | 72 | **Baseline** (W16, last28d 2026-03-20〜2026-04-16). Direct が 60% を占有、Organic は 15% 程度 |

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
