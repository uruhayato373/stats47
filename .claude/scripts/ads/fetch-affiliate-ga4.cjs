#!/usr/bin/env node
// 本体は packages/ops/src/ads/fetch-affiliate-ga4。main の workflow (affiliate-ga4-weekly.yml) がこのパスを名指しする
const impl = require("../../../packages/ops/src/ads/fetch-affiliate-ga4.cjs");

module.exports = impl;

if (require.main === module) {
  impl.main().catch((e) => {
    process.stderr.write(`[error] ${e.message}\n`);
    process.exit(1);
  });
}
