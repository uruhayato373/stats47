#!/usr/bin/env node
// 本体は .claude/scripts/note/ensure-note-images。package.json・publish-new-note.sh・editor-helpers.sh がこのパスを名指しする。
// 画像の作り直しに使う render-ranking-images.mjs はこちらの置き場なので、入口が渡す。
import path from "node:path";
import { fileURLToPath } from "node:url";
import { main } from "../../../packages/ops/src/note/ensure-note-images.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
process.env.NOTE_RENDER_RANKING_IMAGES ??= path.join(HERE, "render-ranking-images.mjs");

await main(process.argv.slice(2));
