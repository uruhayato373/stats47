# 🤖 NEXT AGENT — pull 後にまず読むファイル

> 最新の session-handoff の pointer。pull した agent はこのファイルから読み始めて、リンク先の詳細ハンドオフへ飛ぶ。

## 直近のセッション

**2026-05-27** — area / theme 責務分離 (継続) + ホームページプレビュー画像/動画 **(完了 ✅)**

- 詳細: [`docs/04_レビュー/session-handoff/2026-05-27-area-theme-separation.md`](../../docs/04_レビュー/session-handoff/2026-05-27-area-theme-separation.md)
- branch: `develop`
- PR: 未作成 (area/theme 責務分離 STEP 1-6 完了後に develop → main で起票予定)

## 次の agent がやるべきこと (要約)

### A. area / theme 責務分離 (STEP 1-6) ← 残タスク

実装済みの設計 doc / 棚卸しスクリプトを使って、`page_components` の pageType 配置を是正する。

1. **棚卸し実行**: `node .claude/scripts/audit/page-components-audit.cjs`
2. **結果目視判定**: `docs/04_レビュー/area-theme-audit/YYYY-MM-DD.md`
3. **page_type 付け替え SQL** を書く (棚卸し結果確定後)
4. **R2 反映**: `bash .claude/skills/db/sync-snapshots/run.sh --only page-components`
5. **コード側マイグレーション**: `apps/web/src/app/areas/[areaCode]/page.tsx` から `<AreaMigrationFlowSection>` を外し、`ThemePageLayout` に移管
6. **検証**: `next build` で SSG 維持確認 + browser で `/areas/17000` `/themes/population-dynamics` 表示確認

### B. ホームページプレビュー画像/動画 — 完了 (2026-05-27)

- 8 アセット (`ranking/themes/areas/blog/survey/search`.avif + `ranking/themes`.webm) を `stats47` bucket の `app/home/previews/` に push 済
- 本番 `https://stats47.jp/` で `NextUpGrid` に preview 反映確認 (HTML grep / R2 curl 200)
- 月次 cron `.github/workflows/capture-home-previews-monthly.yml` が 2026-06-01 から自動更新
- 実行 plan: `~/.claude/plans/b-goal-inherited-locket.md`
- 詳細記録: `docs/04_レビュー/session-handoff/2026-05-27-area-theme-separation.md` の「✅ 完了 (2026-05-27) — homepage previews」セクション

## 詳細手順

すべて [`docs/04_レビュー/session-handoff/2026-05-27-area-theme-separation.md`](../../docs/04_レビュー/session-handoff/2026-05-27-area-theme-separation.md) に記録。コマンド / 影響範囲 / 既知の懸念点まで載せてある。

## 古いハンドオフは

`docs/04_レビュー/session-handoff/` 配下に日付別で蓄積。本ファイル `LATEST-HANDOFF.md` は **常に最新の 1 件だけ**を指す。
