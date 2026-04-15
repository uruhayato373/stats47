# GA4 改善記録

Google Analytics 4 のアクセス指標を時系列で追跡する記録簿。
更新ルールは `../SKILL.md` を参照。

- **プロパティ ID**: `463218070`
- **本番 URL**: `https://stats47.jp`
- **開始日**: 2026-04-15

---

## 1. Baseline

**取得日**: _（初回 `/weekly-review` 実行時に自動で記録される）_
**ソース**: `reference/snapshots/<初回 YYYY-Www>/overview.csv` 他

### overview（過去 28 日）

| 指標 | 値 |
|---|---|
| screenPageViews (PV) | — |
| activeUsers | — |
| newUsers | — |
| sessions | — |
| averageSessionDuration (秒) | — |
| bounceRate | — |

### 流入経路（channels.csv、過去 28 日）

| チャネル | セッション | 割合 |
|---|---|---|
| Organic Search | — | — |
| Direct | — | — |
| Social | — | — |
| Referral | — | — |
| その他 | — | — |

### 上位ページ（pages.csv、過去 28 日）

_初回 observe 時に埋める_

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
| _（初回 observe 時に Baseline 行を追加）_ | — | — | — | — | — | — | — | — |

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
