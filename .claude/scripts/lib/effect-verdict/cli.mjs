#!/usr/bin/env node
// 入口。本体は packages/ops/src/effect-verdict/cli.mjs (週次 workflow・npm script・skill がこのパスで起動する)
// 再現コマンドが指す CLI のパスは .claude の道具のものなので、この入口が持って本体へ渡す (packages は .claude のパスを持たない)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../../../../packages/ops/src/effect-verdict/cli.mjs";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main({
    adapterOptions: {
      gsc: { scriptPath: ".claude/scripts/blog/measure-gsc-impact.mjs" },
      adsense: { scriptPath: ".claude/scripts/metrics/measure-adsense-impact.mjs" },
      gscImprovements: { queryScriptPath: ".claude/scripts/metrics/gsc-query.mjs" },
      ga4Improvements: { queryScriptPath: ".claude/scripts/metrics/ga4-query.mjs" },
    },
  });
}
