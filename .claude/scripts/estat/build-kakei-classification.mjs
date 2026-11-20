#!/usr/bin/env node
/**
 * 家計調査 収支項目分類の控えを作る CLI 入口。本体は packages/ops/src/estat/build-kakei-classification.mjs。
 *   node .claude/scripts/estat/build-kakei-classification.mjs --revision 2020
 *   node .claude/scripts/estat/build-kakei-classification.mjs --revision 2025
 */
import { main } from "../../../packages/ops/src/estat/build-kakei-classification.mjs";

main().catch((error) => {
  console.error(`[build-kakei-classification] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
