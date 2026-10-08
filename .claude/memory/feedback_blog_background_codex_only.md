---
name: feedback_blog_background_codex_only
description: ブログの記事背景は Codex (/generate-blog-images Mode A) で作り git の assets/blog/article-backgrounds/ に置く。Gemini で作り直さない。課金や R2 書込を起こす依頼ファイルをコードの commit と同じ push に入れない
metadata:
  node_type: memory
  type: feedback
  modified: 2026-10-07T10:20:00.000Z
---

**事象 (2026-10-07)**: 22 記事の書き直しを公開したら、タイトルを変えた 5 記事でサムネイル検査が
「AI背景promptが変わりました。generate-blog-thumbnails-cloud.ts --ai-background で再生成」と止めた。
エラーと規約の案内どおりに Gemini で作り直す経路を組み、依頼ファイル (`data/gemini-image-requests.json`,
apply: true) をコードの直しと同じ commit で push した。オーナーに「gemini ではなく codex では？」と
止められたが、commit と push は中断の前に済んでいて、Gemini の run が起動した (生成段階で失敗し、R2 への
書き込みは無かった)。

**正典**: 記事固有背景は Codex imagegen で作り `assets/blog/article-backgrounds/<slug>.jpg` に置く
(`.claude/skills/blog/generate-blog-images/SKILL.md` Mode A、`.claude/rules/ogp-image-standards.md`)。
公開時の検査は、この画像があれば今の記事から prompt を計算するので、タイトルを変えても止まらない。
送り箱の記事は `npm run blog-images:codex -- request-article --slug <slug> --article contents/blog/<slug>/article.md`
→ Codex の `$imagegen` → `ingest-article` (同じ `--article`) の順。公開済み Gemini 背景は再利用だけ。

**教訓**:
- エラーメッセージの「こうして直せ」を実行する前に、その領域の skill と規約で正典の経路を確かめる。
  案内文が古いことがある (今回の案内文は Codex に向け直した)。
- 外部の課金・R2 書込・公開を起こす依頼ファイルは、コードの直しと別の commit・別の push にし、
  コードを確かめてから最後に置く。commit と push を 1 コマンドにまとめると、中断が間に合わない。
- クラウド環境では codex MCP が接続できない (codex コマンドが無い)。画像の生成はオーナーのローカルで行う。
- quality-gate (`check-blog-background.ts`) が、背景の無い・古い送り箱の記事を push 前に止めるようになった。
