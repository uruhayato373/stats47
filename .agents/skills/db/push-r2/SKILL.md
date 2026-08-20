---
name: push-r2
description: .local/r2/ のローカルファイルをリモート R2 バケットにアップロードする。Use when user says "R2 push", "R2アップロード", "push-r2". プレフィックス指定で部分同期可能.
disable-model-invocation: true
primary_agent: r2-publisher
co_agents: [instagram-strategist]
---

R2 への push (書き込み) を実行する。**R2 書き込みは CI / クラウド専用** で、ローカルからは原則行わない。

## ★ 生成画像 bundle (OGP 等) は対象外

**生成画像 bundle (OGP / リンクカード / note カバー / pref-silhouette) は本 skill の `.local/r2` →
`diff-push-r2` 経路を使わない。** generator が変更分だけを `.local/image-staging/<type>/` に生成して出す
exact plan (`.local/image-generation-publish-plan-<type>.json`) を、
`packages/r2-storage/src/scripts/push-generated-image-set.ts --plan <path>` で反映する
(正典: `.Codex/rules/ogp-image-standards.md` §5.0)。manifest を持たない資産 (blog SVG / buzz-map 等) は
`push-exact-r2-assets.ts` (明示 key のみ)。

## ★ R2 書き込みは CI / クラウド専用

完全DBレス運用では SSOT は git TS と R2。R2 反映 (push) は **レビュー済みの git 状態から CI が行う**。
ローカルからの誤 push を防ぐため、push 系スクリプト (`diff-push-r2.ts` / `push-r2-wrangler.ts` /
`db:push` / `delete-r2-prefix.ts` / `r2-cleanup-orphans.ts`) は `_assert-ci-write` ガードで
**CI 外では停止**する (`CI` / `GITHUB_ACTIONS` 未設定かつ `ALLOW_LOCAL_R2_WRITE` 未設定時)。

ローカルの R2 **読み取り**は公開 URL 経由で認証不要 (`R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`)。

## 手順 (GitHub Actions で実行)

1. push する対象を判断する:
   - 配信 snapshot 全般 (page-components / blog / master / area / port 等) → `sync-snapshots.yml`
   - blog 公開 → `publish-blog.yml`
   - e-Stat → R2 観測値の更新 → `data-refresh.yml`
2. workflow を起動する:
   ```bash
   gh workflow run sync-snapshots.yml -f only=<task>     # 1 task (例: page-components)
   gh workflow run sync-snapshots.yml                    # 全 task
   gh workflow run sync-snapshots.yml -f dry_run=true    # 生成のみ (確認)
   gh run watch                                          # 進捗 / 結果確認
   ```
   （`gh auth login` 済みなら `! gh workflow run …` でこのセッションから直接起動できる）
3. 完了したら run の結果を報告して終了（CDN キャッシュは ISR/TTL で更新。必要時のみ `/purge-cdn`）。

## ローカルから push したい場合 (非推奨)

緊急時のみ。`gh` / CI が使えない状況に限る:

```bash
# 事前に R2 S3 認証 (R2_S3_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY) が必要
ALLOW_LOCAL_R2_WRITE=1 npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix <prefix>
# S3 鍵なしで wrangler 経由 (要 `wrangler login`):
ALLOW_LOCAL_R2_WRITE=1 npx tsx packages/r2-storage/src/scripts/push-r2-wrangler.ts app/<prefix> --apply
```

ガードを外さない限り上記は `⛔ … ローカルから実行できません` で停止する。

## R2 キーのマッピング

ローカルパスから `.local/r2/` を除いた部分がそのまま R2 キーになる。

| ローカルパス | R2 キー |
|---|---|
| `.local/r2/blog/<slug>/article.mdx` | `blog/<slug>/article.mdx` |
| `.local/r2/area/<file>` | `area/<file>` |
| `.local/r2/categories/<file>` | `categories/<file>` |
| `.local/r2/csv/<path>` | `csv/<path>` |
| `.local/r2/ranking/<path>` | `ranking/<path>` |
| `.local/r2/sns/<path>` | `sns/<path>` |
| `.local/r2/ges/<path>` | `ges/<path>` |

## 参照

- `packages/r2-storage/src/scripts/README.md` — アップロード/ダウンロードスクリプトの使い方
- `packages/r2-storage/src/scripts/diff-push-r2.ts` — アップロードスクリプト本体 (S3 差分 push)。wrangler 経由は `push-r2-wrangler.ts`
