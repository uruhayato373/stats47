---
description: Edge Cache をウォームして初回アクセスの遅延を解消する
argument-hint: [--full]
---

デプロイ後に主要ページ（デフォルト）または全ページ（`--full`）にアクセスし、Cloudflare Edge Cache を事前にウォームする。

## 用途

- デプロイ後の初回アクセス遅延を解消したいとき
- ISR 廃止後（全ページ SSR）のユーザー体験を改善したいとき
- Edge Cache が purge された後のリカバリ

## 手順

### 主要ページのみ（デフォルト、約2分）

```bash
bash .github/scripts/warm-cache.sh
```

29 URL（トップ、ランキング一覧、テーマページ、主要都道府県等）をウォームする。
CI のデプロイ後ステップでも自動実行される。

### 全ページ（`--full`、約25分）

```bash
bash .github/scripts/warm-cache.sh --full
```

sitemap.xml から全 URL（約 2,865 件）を取得し、0.5 秒間隔でアクセスする。
100 件ごとに進捗を表示する。

## いつ使うか

| シナリオ | モード |
|---|---|
| 通常のデプロイ後 | デフォルト（CI で自動実行） |
| 大規模な変更のデプロイ後 | `--full` |
| Edge Cache が効いていないと報告があったとき | `--full` |
| Cloudflare Cache Rules を変更した後 | `--full` |

## 確認方法

ウォーム後に Edge Cache が効いているか確認:

```bash
curl -s -I https://stats47.jp/ | grep cf-cache-status
```

`cf-cache-status: HIT` が返れば Edge Cache が有効。

## 注意

- `--full` は約 2,865 URL にアクセスするため、D1 や Worker に負荷がかかる。深夜等のアクセスが少ない時間帯に実行することを推奨
- Edge Cache の TTL は `s-maxage=86400`（24時間）。ウォームから 24 時間後にキャッシュが切れる
