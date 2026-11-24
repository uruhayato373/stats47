#!/usr/bin/env node
// 入口。本体は packages/ops/src/blog/rebuild-scatter-data.mjs (skill・workflow・品質ゲートがこのパスで起動する)
// 作る source.json の generatedBy にこの入口のパスを書くので、ここで渡す (packages は .claude のパスを持たない)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../../../packages/ops/src/blog/rebuild-scatter-data.mjs";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2), { tool: ".claude/scripts/blog/rebuild-scatter-data.mjs" }).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
