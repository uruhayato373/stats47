---
name: generate-known-ranking-keys
description: ローカル D1 の ranking_items から有効な rankingKey を抽出し、apps/web/src/config/known-ranking-keys.ts に書き出す。Use when user says "known-ranking-keys 更新", "ranking キーリスト再生成". /register-ranking 後に必ず実行する.
---

`apps/web/src/config/known-ranking-keys.ts` を再生成する。

## なぜ必要か

CI ビルド環境（GitHub Actions の Deploy to Cloudflare Workers）では D1 binding が使えないため、`generateStaticParams` で `listActiveRankingKeys` を呼ぶとビルドが失敗する。そこで有効な rankingKey 一覧を git commit された静的 Set として保持し、build 時はそれを参照する設計になっている。

以下の 3 箇所がこのファイルを参照する:
- `apps/web/src/app/ranking/[rankingKey]/page.tsx` の `generateStaticParams`
- `apps/web/src/middleware.ts` の Fix 6（未知 rankingKey を 410 化）
- （将来）sitemap.ts の ranking セクション

## いつ実行するか

- **必須**: `/register-ranking` でランキングを追加・削除した直後
- **必須**: `ranking_items.is_active` を変更した直後
- 推奨: 週次レビュー時の差分確認

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

ローカル D1 が未配置。以下で解決:
```
/pull-remote-d1
```

### 件数が期待と違う

- D1 の `ranking_items WHERE is_active=1 AND area_type='prefecture'` の件数を SQLite で直接確認:
  ```bash
  sqlite3 .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite \
    "SELECT COUNT(DISTINCT ranking_key) FROM ranking_items WHERE is_active=1 AND area_type='prefecture';"
  ```
- 他 PC で更新された ranking が未反映の場合は `/pull-remote-d1` で D1 を最新化

### 更新を忘れてデプロイした場合

新規追加した rankingKey が middleware で 410 を返す。サイトでアクセス不可。即座に本スキルを実行して `/deploy`。

## 参照

- 生成スクリプト本体: `apps/web/scripts/generate-known-ranking-keys.ts`
- 出力先: `apps/web/src/config/known-ranking-keys.ts`
- 関連スキル: `/register-ranking`, `/pull-remote-d1`, `/deploy`
- 背景: `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md` T0-RKG-200-01
