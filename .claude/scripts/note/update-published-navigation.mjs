#!/usr/bin/env node
// 入口。本体は packages/ops/src/note/update-published-navigation.mjs (skill・workflow・品質ゲートがこのパスで起動する)
// catalog を JSON で出す CLI と storefront.generated.ts のパスはここで渡す (packages は .claude・apps のパスを持たない)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../../../packages/ops/src/note/update-published-navigation.mjs";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main({
      catalogScript: ".claude/scripts/note/catalog/dump-circulation-json.ts",
      storefrontPath: fileURLToPath(new URL("../../../apps/web/src/features/products/storefront.generated.ts", import.meta.url)),
    });
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}
