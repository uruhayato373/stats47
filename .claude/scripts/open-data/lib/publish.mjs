#!/usr/bin/env node
// 入口。本体は packages/ops/src/open-data/lib/publish.mjs (workflow がこのパスで起動する)
import { main } from "../../../../packages/ops/src/open-data/lib/publish.mjs";

export * from "../../../../packages/ops/src/open-data/lib/publish.mjs";
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
