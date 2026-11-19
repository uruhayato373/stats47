#!/usr/bin/env node
// 本体は packages/ops/src/ads/append-ga4-affiliate-history。main の workflow (affiliate-ga4-weekly.yml) がこのパスを名指しする
import { main } from "../../../packages/ops/src/ads/append-ga4-affiliate-history.mjs";

main();
