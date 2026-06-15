// note 本文を /tmp/note-data-<slug>.json の segments から組み立て /tmp/note-body-<slug>.txt に出力。
// （editor-operations.md Phase 4-2 のチャンク注入ペーストの入力ファイルを作る）
// 使い方: node .claude/scripts/note/build-body.cjs <slug>
const fs = require("fs");
const slug = process.argv[2];
const d = JSON.parse(fs.readFileSync("/tmp/note-data-" + slug + ".json", "utf8"));
const b = d.segments
  .map((s) => (s.type === "url" ? "\n\n" + s.content + "\n\n" : s.content))
  .join("")
  .replace(/\n{3,}/g, "\n\n")
  .trim();
fs.writeFileSync("/tmp/note-body-" + slug + ".txt", b);
console.log("chars", [...b].length);
