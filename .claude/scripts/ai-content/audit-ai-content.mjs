#!/usr/bin/env node
// 入口。本体は packages/ops/src/ai-content/audit-ai-content.mjs (agent・skill・workflow がこのパスで起動する)
import { main } from "../../../packages/ops/src/ai-content/audit-ai-content.mjs";

export * from "../../../packages/ops/src/ai-content/audit-ai-content.mjs";
await main();
