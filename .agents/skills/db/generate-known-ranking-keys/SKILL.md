---
name: generate-known-ranking-keys
domain: data
description: ローカル D1 の metrics から有効な rankingKey を抽出し、apps/web/src/config/known-ranking-keys.ts に書き出す。middleware.ts Fix 6 が参照。Use when user says "known-ranking-keys 更新", "ranking キーリスト再生成". 新規 metric 追加後 (TS-config + /sync-metrics-cache 適用後) に必ず実行する.
primary_agent: db-schema-manager
---

`apps/web/src/config/known-ranking-keys.ts` を再生成する。

## なぜ必要か

`apps/web/src/middleware.ts` の Fix 6 ブロックが「未知の rankingKey を 410 Gone で返す」ために、この静的 Set を参照する。CI ビルド環境（GitHub Actions の Deploy to Cloudflare Workers）では D1 binding が無いため、ファイルとして git commit しておく設計。

**重要**: page.tsx の `generateStaticParams` や `dynamicParams` は触らない。v1 / v2 で `dynamicParams = false` を併用したら CI で全 SSG が notFound 化してサイト崩壊した（revert 済）。v3 は middleware 単独で対応する。

## いつ実行するか

- **必須**: 新規 metric を追加 (TS-config + `/sync-metrics-cache --apply`) した直後
- **必須**: `metrics.is_active` を変更した直後
- 推奨: 週次レビュー時の差分確認（他 PC での更新をキャッチ）

## 手順

```bash
cd apps/web && R2_PUBLIC_FETCH_URL=https://storage.stats47.jp NODE_OPTIONS='--conditions react-server' \
  npx tsx scripts/generate-known-ranking-keys.ts
# KNOWN の件数から作るランキング索引も作り直す (忘れると PR の Static Gates が「生成物が SSOT とずれています」で落ちる)
npx tsx scripts/generate-ranking-prominence.ts
```

R2 に `app/ranking/<key>/item.json` があるキーだけが載る。sync-snapshots の sync-ranking-keys job も同じ 2 本を走らせて keys PR を作る。

出力例:
```
[generate-known-ranking-keys] wrote 1899 keys to /Users/minamidaisuke/stats47/apps/web/src/config/known-ranking-keys.ts
```

### 生成後の確認

1. git diff で変更内容を確認:
   ```bash
   git diff apps/web/src/config/known-ranking-keys.ts | head -30
   ```
2. 件数が想定通りか（新規 TS-config N 件追加なら N 件増えるはず）
3. 問題なければ git add + commit:
   ```bash
   git add apps/web/src/config/known-ranking-keys.ts
   git commit -m "chore: known-ranking-keys.ts 再生成（+N 件）"
   ```
4. デプロイ: `/deploy`

## トラブルシューティング

### `D1 not found` エラー

ローカル D1 が未配置。`.local/d1/` のパスを確認し、CLAUDE.md 記載の固定パスを使うこと。

### 更新を忘れてデプロイした場合

新規追加した rankingKey が middleware で 410 を返してサイトでアクセス不可。即座に本スキルを実行して `/deploy` で復旧。

## 参照

- 生成スクリプト本体: `apps/web/scripts/generate-known-ranking-keys.ts`
- 出力先: `packages/ranking/src/config/known-ranking-keys.ts` (+ `packages/data-configs/src/prominence/ranking-prominence.generated.ts`)
- middleware 参照箇所: `apps/web/src/middleware.ts` の Fix 6
- 関連スキル: `/sync-metrics-cache`, `/page-data-batch`, `/deploy`
- 背景・v1/v2 失敗の教訓: `data/improvement/gsc-improvement/improvement-log.md` T0-RKG-200-01-v3
