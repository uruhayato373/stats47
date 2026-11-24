#!/usr/bin/env node
// 入口。本体は packages/ops/src/note/build-kakei-note-evidence-data.mjs (skill・workflow・品質ゲートがこのパスで起動する)
// 順位データを取る CLI と首都のデータは .claude にあるので、そのパスをここで渡す (packages は .claude のパスを持たない)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../../../packages/ops/src/note/build-kakei-note-evidence-data.mjs";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main({
    fetchRankingScript: ".claude/scripts/blog/fetch-ranking-data-r2.mjs",
    capitalsPath: ".claude/scripts/note/data/kakei-capital-cities.json",
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
