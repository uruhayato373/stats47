#!/usr/bin/env node
// 本体は packages/ops/src/note/build-note-figure-ledger。package.json・workflow・スキルがこのパスを名指しする。
// 上限の基準 (縮小専用) は設定の JSON なので、パッケージ側へ埋め込まず入口が渡す。
import path from "node:path";
import { fileURLToPath } from "node:url";
import { main } from "../../../packages/ops/src/note/build-note-figure-ledger.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
process.env.NOTE_FIGURE_BASELINE ??= path.join(ROOT, ".claude/config/note-figure-baseline.json");

main(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
