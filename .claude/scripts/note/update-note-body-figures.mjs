#!/usr/bin/env node
// 入口。本体は packages/ops/src/note/update-note-body-figures.mjs (skill・workflow・品質ゲートがこのパスで起動する)
// 図を作る CLI は .claude にあるので、そのパスをここで渡す (packages は .claude のパスを持たない)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../../../packages/ops/src/note/update-note-body-figures.mjs";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2), { rankingImagesScript: ".claude/scripts/note/build-ranking-type-images.ts" }).catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  });
}
