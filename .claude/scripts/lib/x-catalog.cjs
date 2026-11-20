#!/usr/bin/env node
/**
 * x-catalog の CLI 入口。本体は packages/ops/src/sns/x-catalog.cjs (正本: 台帳 sns.x-catalog)。
 *   node .claude/scripts/lib/x-catalog.cjs --check   # 自己検証 (exit 0/1)
 *   node .claude/scripts/lib/x-catalog.cjs --json     # 全カタログを JSON で出力
 */
require("../../../packages/ops/src/sns/x-catalog.cjs").main();
