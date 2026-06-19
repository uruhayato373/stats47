---
name: note cover SVG 重なり検証スクリプト
description: B/C/D シリーズ note 記事 cover SVG の CJK テキスト重なり自動検出ツールの存在と使い方
type: project
originSessionId: dfec608a-a637-4fdf-b949-56d68f37fcb8
---
note 記事 cover SVG (1280×670) で `font-size 180` の big number を `y=250` 付近に置いた際、上の `y=110` リード文と完全に重なる事故が 8 ファイル一斉に発生した（2026-04-18）。再発防止として下記の検証スクリプトを設置した。

**スクリプト**: `.claude/scripts/note/check-cover-overlap.cjs`

**仕様**:
- `<text x y font-size text-anchor>` を全列挙、`<g transform="translate(x,y)">` の入れ子もトラッキング
- CJK glyph を baseline から `[Y - 0.88F, Y + 0.12F]` の縦範囲とみなし bbox 重なりを検出
- 横幅は CJK 1.0em / Latin 0.55em で推定
- 4px 以下の接触は許容（節点重なりでの誤検知防止）
- 失敗時 exit 1

**Why**: SVG の y は baseline 位置だが、CJK は em-box 全域（≈ font-size の 88%）を占める。Latin の cap-height 70% 感覚で見積もると確実に重なる。テキスト + 大数字の組み合わせはエージェントが ad-hoc で書くと再発しやすいため機械的にゲートする。

**How to apply**:
- cover SVG を新規生成・編集したら `node .claude/scripts/note/check-cover-overlap.cjs <slug>/images/cover*.svg` を必ず通す
- `.claude/skills/note/edit-note-draft/SKILL.md` の品質チェックリスト末尾に項目化済み
- 失敗が出たら font-size を縮小（180→130 程度）または y を下げる。font-size 180 は cover では原則使わない
- 教訓は `.claude/skills/management/knowledge/SKILL.md` の「note 記事 cover SVG で大きな数字テキストがリード文と重なる」エントリにも記録済み
