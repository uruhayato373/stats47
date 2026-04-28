import type { D1Database } from "@cloudflare/workers-types";
import { logger } from "@stats47/logger";

import {
  type D1Adapter,
  type D1PreparedStatementAdapter,
  type D1Result,
  asD1Database,
} from "../types";

/**
 * 全クエリを空結果で返す noop アダプタ。
 *
 * Cloudflare Workers ビルド時 (NEXT_PHASE=phase-production-build) に D1 binding が
 * 利用できない場合、`getStaticDatabase()` が throw すると `next build` の RSC 静的生成が
 * 中断する (build worker exits 1)。本アダプタを返すことで「クエリは success だが空配列」
 * という形にし、ビルドを通過させる。
 *
 * 実リクエスト時は Cloudflare Workers の D1 binding が context 経由で注入されるので
 * このアダプタには到達しない。
 */
export function createNoopAdapter(): D1Database {
  const emptyResult: D1Result<unknown> = {
    results: [],
    success: true,
    meta: { duration: 0 } as any,
  };

  const stmt: D1PreparedStatementAdapter = {
    bind: () => stmt,
    first: async () => null,
    run: async () => emptyResult,
    all: async () => emptyResult as D1Result<any>,
    raw: async () => [],
  };

  const adapter: D1Adapter = {
    prepare: () => stmt,
    dump: async () => new ArrayBuffer(0),
    batch: async () => [],
    exec: async () => ({ count: 0, duration: 0 }),
  };

  logger.warn(
    "[noop D1 adapter] D1 binding 不在のため空アダプタを返します。実クエリは [] / null を返します",
  );

  return asD1Database(adapter);
}
