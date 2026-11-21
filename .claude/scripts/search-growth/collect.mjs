#!/usr/bin/env node
// 入口。本体は packages/ops/src/search-growth/collect.mjs (workflow・npm script・skill がこのパスで起動する)
// live fetcher の CLI は .claude 側の道具なので、そのパスはこの入口が持って本体へ渡す (packages は .claude のパスを持たない)
import { main } from "../../../packages/ops/src/search-growth/collect.mjs";

main({
  liveScripts: {
    gsc: ".claude/scripts/metrics/fetch-gsc-snapshot.mjs",
    ga4: ".claude/scripts/metrics/fetch-ga4-snapshot.mjs",
    inspection: ".claude/scripts/gsc/url-inspection-daily.cjs",
    cloudflare: ".claude/scripts/cloudflare/fetch-usage.mjs",
  },
});
