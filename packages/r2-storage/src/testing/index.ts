/**
 * R2ストレージモック
 *
 * テスト環境で使用する共通のR2ストレージモックを提供します。
 */

import { vi } from "vitest";

import type {
  R2Bucket,
  R2Checksums as R2ChecksumsType,
  R2GetOptions,
  R2ListOptions,
  R2Object,
  R2ObjectBody,
  R2Objects,
  R2PutOptions,
} from "@cloudflare/workers-types";

/**
 * R2Checksums型（簡易版）
 */
interface R2Checksums {
  toJSON(): Record<string, string>;
}

/**
 * モックR2Object
 */
class MockR2Object implements R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  checksums: R2ChecksumsType;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
  range?: { offset: number; length?: number };
  storageClass: string = "STANDARD";
  writeHttpMetadata(headers: R2Object["writeHttpMetadata"] extends (headers: infer H) => void ? H : never): void {
    // モック実装
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return new ArrayBuffer(0);
  }
  async text(): Promise<string> {
    return "";
  }
  async json<T = unknown>(): Promise<T> {
    return {} as T;
  }
  async blob(): Promise<Blob> {
    return new Blob();
  }
  async body(): Promise<ReadableStream> {
    return new ReadableStream();
  }
  get bodyUsed(): boolean {
    return false;
  }

  constructor(key: string) {
    this.key = key;
    this.version = "1";
    this.size = 0;
    this.etag = "mock-etag";
    this.httpEtag = '"mock-etag"';
    this.uploaded = new Date();
    this.checksums = {
      toJSON: () => ({}),
    } as R2ChecksumsType;
  }
}

/**
 * R2HTTPMetadata型（簡易版）
 */
interface R2HTTPMetadata {
  contentType?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
  cacheExpiry?: Date;
}

/**
 * モックR2Bucket
 */
class MockR2Bucket {
  private storage: Map<string, string> = new Map();

  head(key: string): Promise<R2Object | null> {
    if (this.storage.has(key)) {
      return Promise.resolve(new MockR2Object(key));
    }
    return Promise.resolve(null);
  }

  get(
    key: string,
    options?: R2GetOptions
  ): Promise<R2ObjectBody | null> {
    if (this.storage.has(key)) {
      const obj = new MockR2Object(key);
      // R2ObjectBodyにはbytesプロパティが必要
      return Promise.resolve({
        ...obj,
        bytes: new Uint8Array(0),
      } as unknown as R2ObjectBody);
    }
    return Promise.resolve(null);
  }

  async put(
    key: string,
    value:
      | ReadableStream
      | ArrayBuffer
      | ArrayBufferView
      | string
      | null
      | Blob,
    options?: R2PutOptions
  ): Promise<R2Object> {
    let stringValue = "";
    if (typeof value === "string") {
      stringValue = value;
    } else if (value instanceof Blob) {
      stringValue = await value.text();
    }
    this.storage.set(key, stringValue);
    return Promise.resolve(new MockR2Object(key) as unknown as R2Object);
  }

  delete(keys: string | string[]): Promise<void> {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach((key) => this.storage.delete(key));
    return Promise.resolve();
  }

  list(options?: R2ListOptions): Promise<R2Objects> {
    return Promise.resolve({
      objects: [],
      delimitedPrefixes: [],
      truncated: false,
    } as R2Objects);
  }
}

/**
 * デフォルトのモックR2Bucketインスタンス
 */
const mockR2Bucket = new MockR2Bucket() as unknown as R2Bucket;

/**
 * getR2Clientのモック実装
 */
export const getR2Client = vi.fn(() => Promise.resolve(mockR2Bucket));

/**
 * fetchFromR2のモック実装
 */
export const fetchFromR2 = vi.fn(() => Promise.resolve(null));

/**
 * saveToR2のモック実装
 */
export const saveToR2 = vi.fn(() => Promise.resolve());

