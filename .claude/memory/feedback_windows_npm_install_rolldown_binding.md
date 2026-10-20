---
name: feedback_windows_npm_install_rolldown_binding
description: Windows用Rolldown任意依存のlock欠落によるVitest起動失敗。2026-10-20にlock修復済み
metadata:
  node_type: memory
  type: feedback
  originSessionId: 0626770c-ca2a-4172-914d-1e784feb8ca1
  modified: 2026-10-16T03:16:38.471Z
---

2026-10-16、この Windows PC の node_modules が古く (tailwindcss 3.4.19 のまま、lock は 4.3.3) 本番ビルドが `Can't resolve 'tailwindcss'` で落ちたため `npm install` した。すると `package-lock.json` に Windows 用の `@rolldown/binding-win32-x64-msvc` が載っていないため余分扱いで削除され、vitest が `Cannot find native binding` で起動しなくなった。

**Why:** lock は別 OS で作られ、Windows 用の任意依存の記載を持たない。lock どおりに入れ直すと Windows でしか要らない部品が消える。

**How to apply:**
- Windows で `npm install` / `npm ci` をした後は、vitest を 1 ファイル動かして起動を確かめる。
- 2026-10-20に `package-lock.json` の `@rolldown/binding-win32-x64-msvc@1.2.5` をnpm生成のmetadataで修復し、クリーンな `npm ci` とVitest起動を検証済み。現在はlockに従って導入する。別版の部品を足して隠さない。
- 再発したら親のrolldownが宣言する版とlockのOS/CPU・resolved・integrityを照合し、同じ版の正規metadataを修復する。依存操作の前に作業セッションと稼働中アプリを確認する。
- 本番ビルドが CSS で落ちたら、まず `node_modules/tailwindcss` の版と lock の版を比べる (依存を入れ直していない PC で起きる)。
- 関連: [[project_two_machine_local_footprint_2026-09]]
- 修復時の経緯と検証: [feedback_next_eslint_unpatched_braces.md](feedback_next_eslint_unpatched_braces.md)。
