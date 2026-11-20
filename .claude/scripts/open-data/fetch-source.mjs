#!/usr/bin/env node
// 入口。本体は packages/ops/src/open-data/fetch-source.mjs (workflow・npm script がこのパスで起動する)
import { main } from "../../../packages/ops/src/open-data/fetch-source.mjs";

export * from "../../../packages/ops/src/open-data/fetch-source.mjs";
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
