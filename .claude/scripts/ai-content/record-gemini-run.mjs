#!/usr/bin/env node
// 入口。本体は packages/ops/src/ai-content/record-gemini-run.mjs (workflow・シェルがこのパスで起動する)
import { cli } from "../../../packages/ops/src/ai-content/record-gemini-run.mjs";

export * from "../../../packages/ops/src/ai-content/record-gemini-run.mjs";
cli();
