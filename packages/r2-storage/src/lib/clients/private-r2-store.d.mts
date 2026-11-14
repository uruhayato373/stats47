import type { IncomingHttpHeaders } from "node:http";

export interface PrivateR2Store {
  bucket: string;
  readonly transport: "s3" | "wrangler-oauth";
  get(key: string): Promise<Buffer | null>;
  /** OAuth object endpoint rejects HTTP HEAD; use GET for readback verification. */
  head(key: string): Promise<{ size: number } | null>;
  put(key: string, bytes: Buffer, options?: { ifNoneMatch?: boolean }): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<{ key: string; size: number; lastModified: string | null }[]>;
}
export const R2_BULK_REQUEST_INTERVAL_MS: number;
export function createR2Store(options: {
  bucket: string; writeOnce?: boolean; maxBytes?: number; minimumRequestIntervalMs?: number;
}): PrivateR2Store;
export function r2ContentType(key: string): string;
export function wranglerConfigFile(options?: {
  platform?: string; env?: NodeJS.ProcessEnv; home?: string; isDirectory?: (path: string) => boolean;
}): string;
export function wranglerTokenProvider(config: string, renew?: () => Promise<void>): () => Promise<string>;
export function retryRemoteRead<T extends { status: number }>(read: () => Promise<T>, method?: string,
  wait?: (milliseconds: number) => Promise<void>): Promise<T>;
export function request(url: string | URL, options?: {
  method?: string; body?: Buffer; headers?: Record<string, string>; maxBytes?: number;
  beforeRequest?: () => Promise<void>;
}): Promise<{ status: number; headers: IncomingHttpHeaders; body: Buffer }>;
