#!/usr/bin/env node
// 入口。本体は packages/ops/src/ai-content/record-generation-outcome.mjs (workflow・シェルがこのパスで起動する)
import { cli } from "../../../packages/ops/src/ai-content/record-generation-outcome.mjs";

export * from "../../../packages/ops/src/ai-content/record-generation-outcome.mjs";
cli();
