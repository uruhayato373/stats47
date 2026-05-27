# 🤖 NEXT AGENT — pull 後にまず読むファイル

> 最新の session-handoff の pointer。pull した agent はこのファイルから読み始めて、リンク先の詳細ハンドオフへ飛ぶ。

## 直近のセッション

**2026-05-27** — area / theme 責務分離 + ホームページプレビュー画像/動画 **(両方完了 ✅)**

- 詳細: [`docs/04_レビュー/session-handoff/2026-05-27-area-theme-separation.md`](../../docs/04_レビュー/session-handoff/2026-05-27-area-theme-separation.md)
- branch: `develop`
- 関連 commit: `c74fb0ee` (area/theme 移管), `406d0584` (homepage previews 完了記録), `86dcd47` (責務分離 doc + 棚卸し script)

## 次の agent がやるべきこと

このセッションのハンドオフはすべて完了。次に着手すべきは:

1. **follow-up 2 件** (本ハンドオフ doc 末尾の「Homepage previews follow-ups」セクション参照)
   - `capture-home-previews.ts` の `/survey` networkidle timeout 対応
   - homepage hero h1 LCP 7.8s (別件として performance-improvement で追跡)
2. **週次計画** (`docs/03_週次運用/週次計画/2026-W21.md`) に従って次のタスクを選択

## 古いハンドオフは

`docs/04_レビュー/session-handoff/` 配下に日付別で蓄積。本ファイル `LATEST-HANDOFF.md` は **常に最新の 1 件だけ**を指す。
