import "server-only";

import fs from "node:fs";
import path from "node:path";

/**
 * ローカルファイル配信の安全ユーティリティ (旧 serveMedia / servePilot の検査を強化)。
 *
 * base 起点でパスを解決し、path traversal と symlink 脱出の両方を拒否する。
 * MIME map と Range ヘッダ解析は旧 server.mjs と同一挙動。
 */

export const MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
};

export function mimeFor(file: string): string {
  return MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
}

export type SafeError = { kind: "forbidden" | "not-found"; message: string };

function isInside(base: string, target: string): boolean {
  const rel = path.relative(base, target);
  // rel が "" (base 自身) / ".." 始まり / 絶対パスなら base の外。
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

/**
 * base 配下の実在ファイルパスを安全に解決する。
 * relSegments は URL の catch-all セグメント配列 (各要素は decodeURIComponent 済でよいが、
 * 未 decode の場合に備え内部で decode する)。成功時 { file } / 失敗時 { error }。
 */
export function resolveSafe(
  base: string,
  relSegments: string[],
): { file: string } | { error: SafeError } {
  let decoded: string[];
  try {
    decoded = relSegments.map((s) => decodeURIComponent(s));
  } catch {
    return { error: { kind: "forbidden", message: "forbidden" } };
  }
  // 空セグメント・"." は排除、".." は traversal のため即拒否。
  if (decoded.some((s) => s === ".." || s.includes("\0"))) {
    return { error: { kind: "forbidden", message: "forbidden" } };
  }
  const target = path.resolve(base, ...decoded);
  if (!isInside(base, target)) {
    return { error: { kind: "forbidden", message: "forbidden" } };
  }
  // symlink 脱出防止: realpath 後も base 内に留まることを確認。
  let real: string;
  try {
    real = fs.realpathSync(target);
  } catch {
    return { error: { kind: "not-found", message: "not found" } };
  }
  const realBase = fs.realpathSync(base);
  if (!isInside(realBase, real)) {
    return { error: { kind: "forbidden", message: "forbidden" } };
  }
  let stat: fs.Stats;
  try {
    stat = fs.statSync(real);
  } catch {
    return { error: { kind: "not-found", message: "not found" } };
  }
  if (!stat.isFile()) {
    return { error: { kind: "not-found", message: "not found" } };
  }
  return { file: real };
}

export type ParsedRange = { start: number; end: number } | "unsatisfiable" | null;

/**
 * `bytes=start-end` を解析。start 省略/end 省略/範囲外を旧実装通り処理する。
 * - range ヘッダ無し or 非 bytes → null (呼び元は 200 全量)
 * - start >= size → "unsatisfiable" (呼び元は 416)
 * - 正常 → { start, end } (end は size-1 でクランプ)
 */
export function parseRange(header: string | null | undefined, size: number): ParsedRange {
  if (!header) return null;
  const m = /bytes=(\d*)-(\d*)/.exec(header);
  if (!m) return null;
  const start = m[1] ? parseInt(m[1], 10) : 0;
  let end = m[2] ? parseInt(m[2], 10) : size - 1;
  if (start >= size) return "unsatisfiable";
  end = Math.min(end, size - 1);
  return { start, end };
}
