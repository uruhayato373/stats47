import { calculateBodySize } from "../utils/calculate-body-size";
import { findLocalR2Root } from "../utils/find-local-r2-root";

function saveToLocalFs(
  key: string,
  body: string | ArrayBuffer | Buffer | Uint8Array,
): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");
  const r2Root = findLocalR2Root() ?? path.join(process.cwd(), ".local/r2");
  const filePath = path.join(r2Root, key);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  let data: Buffer | string;
  if (Buffer.isBuffer(body)) {
    data = body;
  } else if (body instanceof ArrayBuffer) {
    data = Buffer.from(body);
  } else if (body instanceof Uint8Array) {
    data = Buffer.from(body);
  } else {
    data = String(body);
  }
  fs.writeFileSync(filePath, data);
}

/**
 * オブジェクトをローカルファイルシステム (.local/r2/) に保存する。
 * リモート R2 への反映は diff-push-r2.ts（S3 API）で行う。
 */
export async function saveToR2(
  key: string,
  body: string | ArrayBuffer | Buffer | Uint8Array,
  options?: {
    contentType?: string;
    metadata?: Record<string, string>;
    async?: boolean;
  }
): Promise<{ key: string; size: number }> {
  void options;
  const size = calculateBodySize(body);
  saveToLocalFs(key, body);
  return { key, size };
}
