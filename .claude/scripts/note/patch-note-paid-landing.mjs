#!/usr/bin/env node
// 入口。本体は packages/ops/src/note/patch-note-paid-landing.mjs (skill・workflow・品質ゲートがこのパスで起動する)
// catalog を JSON で出す CLI は .claude にあるので、そのパスをここで渡す (packages は .claude のパスを持たない)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../../../packages/ops/src/note/patch-note-paid-landing.mjs";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await main({ catalogScript: ".claude/scripts/note/catalog/dump-circulation-json.ts" }); } catch (error) { console.error(`ERROR: ${error.message}`); process.exitCode = 1; }
}
