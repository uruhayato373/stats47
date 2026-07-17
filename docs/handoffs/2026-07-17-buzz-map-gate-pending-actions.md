---
type: handoff
date: 2026-07-17
topic: buzz-map集客ゲート統合 完了後の残アクション (公開・投稿・commit 待ち)
status: pending
---

# buzz-map 集客ゲート統合 — 完了済み成果と残アクション

doc 27 (`docs/02_実装計画/27_buzz-map集客ゲート統合仕様.md`) の全 Phase + §16 正典更新は
2026-07-17 に完了 (tests 108 pass / 整合性 error 0)。ただし**指示の境界どおり commit / push /
公開 / 実投稿は一切していない**。以下がすべて残アクション。

## 1. SNS 投稿判断 (draft 6 件・投稿タイミングは人間判断)

posts.json (SSOT) に status=draft で登録済み。posted 0 / scheduled 0。

| id | platform | content_key | 素材 |
|---|---|---|---|
| 701 | instagram | population-growth-muni | R2 sns/buzz-map/ (HEAD 200 実測済) |
| 702 | instagram | vacant-housing-muni | 同上 |
| 703 | instagram | no-station-muni | 同上 |
| 704 | instagram | onsen-place-names | 同上 |
| 705 | x | vacant-housing-muni | 同上 (utm_url 記録済・attribution=direct) |
| 706 | x | migration-inflow-top-decile-muni | 同上 |

- X: `publish-x --from-queue` (ローカル・check-x-post-budget ガード経由)
- IG: gallery `/sns` か instagram schedule JSON への予約登録 (二重書込は同一ハンドラ)
- 全件 isPostable (landingContract=pass + live 200) 通過済み。頻度リミットは §1 (X≤3/日) に従う

## 2. コンテンツ公開 (develop push が必要 = 明示指示待ち)

- **P1 記事 16 本** (`docs/21_ブログ記事原稿/`・published:false・critic PASS 済):
  published:true 化 → develop push → blog-auto-publish.yml。残り 14 本は blocked-data で終端 (公開対象外)
- **ai-content バッチ② 10 件** (`data/ai-content-staging/`・gate 通過済):
  commit → develop push → publish-ai-content.yml

## 3. 全変更の commit / push (最優先推奨)

buzz-map ゲート一式 (curated-ideas TS 160 件 / builder / router / contract / batch CLI /
attribution / tests 108 / gallery `/buzz-map` / 正典 5 ファイル) + P1 記事 + ai-content staging が
**すべて未 commit**。他 PC・他セッションから見えず消失リスクあり。commit 時は並行セッションの
dirty (`.claude/scripts/note/catalog/*` = note 復元系) を混ぜないこと。

## 4. GA4 custom dimension 登録 (ユーザー操作)

`content_id` / `target_type` をイベントスコープで登録 (affiliate §6 と同手順) →
48h 後に `node .claude/scripts/sns/buzz-map-attribution.mjs` で deep-click 内訳が取れる。
未登録の間は session KPI のみ (実装は degrade 済・異常終了しない)。

## 5. 運用継続候補 (急がない)

- catalog `--next` の spec 未生成候補 → 次バッチ (`prepare-buzz-map-batch.ts` dry-run から)
- ai-content 残 971 件の消化 (build-ai-content-queue.mjs --next)
- gallery Next.js 移管の develop→main 本番反映 (gallery はローカル専用なので deploy 不要、コード同期のみ)
