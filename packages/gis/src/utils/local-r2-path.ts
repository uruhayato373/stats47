import { basename, join } from "node:path";

/**
 * R2 object key をローカル mirror 配下のパスへ安全に解決する。
 * `basename` を各 segment に適用し、区切り・親参照・絶対パスを持つ segment を拒否する。
 */
export function resolveLocalR2ObjectPath(localR2Root: string, key: string): string {
  if (!key || key.includes("\\")) {
    throw new Error("local R2 key に空文字またはバックスラッシュは使えません");
  }

  const segments = key.split("/");
  const safeSegments = segments.map((segment) => {
    const safe = basename(segment);
    if (!segment || safe !== segment || safe === "." || safe === "..") {
      throw new Error(`unsafe local R2 key segment: ${segment}`);
    }
    return safe;
  });

  return join(localR2Root, ...safeSegments);
}
