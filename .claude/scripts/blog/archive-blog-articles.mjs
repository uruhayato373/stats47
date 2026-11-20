#!/usr/bin/env node
// 本体は packages/ops/src/blog/archive-blog-articles.mjs。workflow・スキル・agent・hook が名指しするこのパスは変えない。
import { main } from "../../../packages/ops/src/blog/archive-blog-articles.mjs";

main(process.argv.slice(2)).catch((e) => {
  console.error(e.message);
  process.exit(1);
});
