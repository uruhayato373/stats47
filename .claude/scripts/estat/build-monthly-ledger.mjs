#!/usr/bin/env node
/**
 * 月次データの台帳の CLI 入口。本体は packages/ops/src/estat/build-monthly-ledger.mjs。
 *   node .claude/scripts/estat/build-monthly-ledger.mjs          # ledger.json を作り直す
 *   node .claude/scripts/estat/build-monthly-ledger.mjs --check  # 判断と台帳の食い違いで止める (カタログ不要)
 */
import { main } from "../../../packages/ops/src/estat/build-monthly-ledger.mjs";

main();
