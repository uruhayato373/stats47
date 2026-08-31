---
name: push-r2
description: .local/r2/ のローカルファイルをリモート R2 バケットにアップロードする。Use when user says "R2 push", "R2アップロード", "push-r2". プレフィックス指定で部分同期可能.
disable-model-invocation: true
primary_agent: r2-publisher
co_agents: [instagram-strategist]
---

R2 への push (書き込み) を実行する。remote R2 が唯一の真実源であり、認証済みのローカル / CI の
どちらからも限定対象を直接反映できる。

## ★ 生成画像 bundle (OGP 等) は対象外

**生成画像 bundle (OGP / リンクカード / note カバー / pref-silhouette) は本 skill の `.local/r2` →
`diff-push-r2` 経路を使わない。** generator が変更分だけを `.local/image-staging/<type>/` に生成して出す
exact plan (`.local/image-generation-publish-plan-<type>.json`) を、
`packages/r2-storage/src/scripts/push-generated-image-set.ts --plan <path>` で反映する
(正典: `.claude/rules/ogp-image-standards.md` §5.0)。manifest を持たない資産 (blog SVG / buzz-map 等) は
`push-exact-r2-assets.ts` (明示 key のみ)。

## ★ R2 書き込みはローカル / CIの両方から可能

完全DBレス運用では SSOT は git TS と R2。`_assert-ci-write.ts` はローカル実行を停止せず、
書き込み通知を1行出す。ローカル実行には `.env.local` の R2 S3 creds、CIには対応するsecretが必要。
対象はexact keyか十分狭いprefixに限定し、広域prefixの反映や任意削除を行わない。

ローカルの R2 **読み取り**は公開 URL 経由で認証不要 (`R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`)。

## 手順

1. push する対象を判断する:
   - 配信 snapshot 全般 (page-components / blog / master / area / port 等) → `sync-snapshots.yml`
   - blog 公開 → `publish-blog.yml`
   - e-Stat → R2 観測値の更新 → `data-refresh.yml`
   - KSJ GIS → `/fetch-mlit-ksj` のmanifest-last exact publish
2. 通常の反映は対応workflowを起動する:
   ```bash
   gh workflow run sync-snapshots.yml -f only=<task>     # 1 task (例: page-components)
   gh workflow run sync-snapshots.yml                    # 全 task
   gh workflow run sync-snapshots.yml -f dry_run=true    # 生成のみ (確認)
   gh run watch                                          # 進捗 / 結果確認
   ```
   （`gh auth login` 済みなら `! gh workflow run …` でこのセッションから直接起動できる）
3. 完了したら run の結果を報告して終了（CDN キャッシュは ISR/TTL で更新。必要時のみ `/purge-cdn`）。

## ローカルからpushする場合

S3認証済みならCIと同じpublisherを使用できる。最初にdry-runまたは限定prefixで対象を確認する:

```bash
# 事前に R2 S3 認証 (R2_S3_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY) が必要
npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix <prefix> --dry-run
npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix <prefix>
# S3 鍵なしで wrangler 経由 (要 `wrangler login`):
npx tsx packages/r2-storage/src/scripts/push-r2-wrangler.ts app/<prefix> --apply
```

ローカル実行時の警告は意図確認であり、失敗ではない。資格情報不足・publisherの対象検証・反映後監査はhard failにする。

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
