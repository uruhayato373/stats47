---
name: generate-known-ranking-keys
description: ローカル D1 の ranking_items から有効な rankingKey を抽出し、apps/web/src/config/known-ranking-keys.ts に書き出す。middleware.ts Fix 6 が参照。Use when user says "known-ranking-keys 更新", "ranking キーリスト再生成". /register-ranking 後に必ず実行する.
---

`apps/web/src/config/known-ranking-keys.ts` を再生成する。

## なぜ必要か

`apps/web/src/middleware.ts` の Fix 6 ブロックが「未知の rankingKey を 410 Gone で返す」ために、この静的 Set を参照する。CI ビルド環境（GitHub Actions の Deploy to Cloudflare Workers）では D1 binding が無いため、ファイルとして git commit しておく設計。

**重要**: page.tsx の `generateStaticParams` や `dynamicParams` は触らない。v1 / v2 で `dynamicParams = false` を併用したら CI で全 SSG が notFound 化してサイト崩壊した（revert 済）。v3 は middleware 単独で対応する。

## いつ実行するか

- **必須**: `/register-ranking` でランキングを追加・削除した直後
- **必須**: `ranking_items.is_active` を変更した直後
- 推奨: 週次レビュー時の差分確認（他 PC での更新をキャッチ）

## 手順

```bash
cd apps/web && npx tsx scripts/generate-known-ranking-keys.ts
```

出力例:
```
[generate-known-ranking-keys] wrote 1899 keys to /Users/minamidaisuke/stats47/apps/web/src/config/known-ranking-keys.ts
```

### 生成後の確認

1. git diff で変更内容を確認:
   ```bash
   git diff apps/web/src/config/known-ranking-keys.ts | head -30
   ```
2. 件数が想定通りか（`/register-ranking` で N 件追加したなら N 件増えるはず）
3. 問題なければ git add + commit:
   ```bash
   git add apps/web/src/config/known-ranking-keys.ts
   git commit -m "chore: known-ranking-keys.ts 再生成（+N 件）"
   ```
4. デプロイ: `/deploy`

## トラブルシューティング

### `D1 not found` エラー

ローカル D1 が未配置。`/pull-remote-d1` で解決。

### 件数が期待と違う

ローカル D1 が古い可能性。他 PC で更新された ranking がある場合:
```
/pull-remote-d1
```
で最新化してから再実行。

### 更新を忘れてデプロイした場合

新規追加した rankingKey が middleware で 410 を返してサイトでアクセス不可。即座に本スキルを実行して `/deploy` で復旧。

## 参照

- 生成スクリプト本体: `apps/web/scripts/generate-known-ranking-keys.ts`
- 出力先: `apps/web/src/config/known-ranking-keys.ts`
- middleware 参照箇所: `apps/web/src/middleware.ts` の Fix 6
- 関連スキル: `/register-ranking`, `/pull-remote-d1`, `/deploy`
- 背景・v1/v2 失敗の教訓: `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md` T0-RKG-200-01-v3
