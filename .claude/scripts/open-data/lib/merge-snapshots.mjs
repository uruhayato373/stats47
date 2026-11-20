#!/usr/bin/env node
// 入口。本体は packages/ops/src/open-data/lib/merge-snapshots.mjs (workflow がこのパスで起動する)
import { main } from "../../../../packages/ops/src/open-data/lib/merge-snapshots.mjs";

export * from "../../../../packages/ops/src/open-data/lib/merge-snapshots.mjs";
main();
