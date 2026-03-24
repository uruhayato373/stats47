import type { D1Database } from "@cloudflare/workers-types";

// D1Adapter types
export interface D1Result<T = unknown> {
  results: T[];
  success: true;
  meta: any;
  error?: never;
  columns?: string[];
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

export interface D1PreparedStatementAdapter {
  bind(...args: any[]): D1PreparedStatementAdapter;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result<any>>; 
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Adapter {
  prepare(sql: string): D1PreparedStatementAdapter;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatementAdapter[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export function asD1Database(adapter: D1Adapter): D1Database {
  return adapter as unknown as D1Database;
}
