# 🤖 NEXT AGENT — pull 後にまず読むファイル

> 最新の session-handoff の pointer。pull した agent はこのファイルから読み始めて、リンク先の詳細ハンドオフへ飛ぶ。

## 直近のセッション

**2026-05-27** — area / theme 責務分離 + ホームページプレビュー画像/動画

- 詳細: [`docs/04_レビュー/session-handoff/2026-05-27-area-theme-separation.md`](../../docs/04_レビュー/session-handoff/2026-05-27-area-theme-separation.md)
- branch: `claude/gallant-albattani-wxxhJ`
- PR: 未作成 (作業完了後に develop → main で起票)

## 次の agent がやるべきこと (要約)

### A. area / theme 責務分離 (STEP 1-6)

実装済みの設計 doc / 棚卸しスクリプトを使って、`page_components` の pageType 配置を是正する。

1. **棚卸し実行**: `node .claude/scripts/audit/page-components-audit.cjs`
2. **結果目視判定**: `docs/04_レビュー/area-theme-audit/YYYY-MM-DD.md`
3. **page_type 付け替え SQL** を書く (棚卸し結果確定後)
4. **R2 反映**: `bash .claude/skills/db/sync-snapshots/run.sh --only page-components`
5. **コード側マイグレーション**: `apps/web/src/app/areas/[areaCode]/page.tsx` から `<AreaMigrationFlowSection>` を外し、`ThemePageLayout` に移管
6. **検証**: `next build` で SSG 維持確認 + browser で `/areas/17000` `/themes/population-dynamics` 表示確認

### B. ホームページプレビュー画像/動画

NextUpGrid 拡張 + 撮影スクリプト + GitHub Actions cron は実装済み。あとは初回撮影と R2 反映だけ。

1. `npm install --workspace=apps/web` (sharp dep を取得)
2. `npx tsx apps/web/scripts/capture-home-previews.ts --base-url https://stats47.jp --output /tmp/home-previews`
3. ローカル確認: `cp /tmp/home-previews/* .local/r2/app/home/previews/ && npm run dev --workspace=apps/web`
4. 本番 R2 push: `wrangler r2 object put stats47/app/home/previews/{file} --file ... --remote` (or GHA workflow を `workflow_dispatch` で起動)
5. PSI で LCP 影響確認 (+0ms のはず)

## 詳細手順

すべて [`docs/04_レビュー/session-handoff/2026-05-27-area-theme-separation.md`](../../docs/04_レビュー/session-handoff/2026-05-27-area-theme-separation.md) に記録。コマンド / 影響範囲 / 既知の懸念点まで載せてある。

## 古いハンドオフは

`docs/04_レビュー/session-handoff/` 配下に日付別で蓄積。本ファイル `LATEST-HANDOFF.md` は **常に最新の 1 件だけ**を指す。
