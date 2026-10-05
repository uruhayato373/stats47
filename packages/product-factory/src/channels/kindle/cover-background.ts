import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import type { KindleBook, KindleCoverBackgroundAsset } from "./types";
import { SITE } from "@stats47/data-configs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const DEFAULT_R2_BASE = SITE.r2PublicBaseUrl;

function sha256(body: Buffer): string {
  return createHash("sha256").update(body).digest("hex");
}

function assertSafeR2Key(key: string): void {
  if (
    !key.startsWith("media/kindle-cover-assets/") ||
    key.startsWith("/") ||
    key.includes("\\") ||
    key.split("/").some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error(`安全でないKindle表紙背景R2 key: ${key}`);
  }
}

async function verifyBackground(body: Buffer, asset: KindleCoverBackgroundAsset): Promise<void> {
  if (body.byteLength !== asset.bytes || sha256(body) !== asset.sha256) {
    throw new Error(`Kindle表紙背景のbyte/SHA不一致: ${asset.r2Key}`);
  }
  const meta = await sharp(body).metadata();
  if (meta.format !== "jpeg" || meta.width !== asset.width || meta.height !== asset.height) {
    throw new Error(
      `Kindle表紙背景の形式不一致: ${asset.r2Key} (${meta.format ?? "unknown"} ${meta.width ?? 0}x${meta.height ?? 0})`,
    );
  }
}

function localCandidates(bookId: string, asset: KindleCoverBackgroundAsset): readonly string[] {
  return [
    join(REPO_ROOT, ".local/r2", ...asset.r2Key.split("/")),
    join(REPO_ROOT, ".local/kindle-cover-assets/cache", bookId, `${asset.sha256}.jpg`),
  ];
}

/**
 * 承認済み背景をR2から取得し、SHA検証後にローカルへキャッシュする。
 * `.local/r2` のpush前stagingがある場合は同じ検証を通して優先利用する。
 */
export async function loadCoverBackground(book: KindleBook): Promise<Buffer | undefined> {
  const asset = book.coverDesign.backgroundAsset;
  if (!asset) return undefined;
  assertSafeR2Key(asset.r2Key);

  for (const candidate of localCandidates(book.id, asset)) {
    if (!existsSync(candidate)) continue;
    const body = readFileSync(candidate);
    await verifyBackground(body, asset);
    return body;
  }

  if (asset.status !== "published") {
    throw new Error(`Kindle表紙背景はR2 push前です: ${asset.r2Key}`);
  }

  // テストはネットワークに依存させない。背景なしの描画回帰はcover.test.tsが直接検証する。
  if (process.env.NODE_ENV === "test") return undefined;

  const base = (process.env.R2_PUBLIC_FETCH_URL ?? DEFAULT_R2_BASE).replace(/\/$/, "");
  const response = await fetch(`${base}/${asset.r2Key}`);
  if (!response.ok) {
    throw new Error(`Kindle表紙背景をR2から取得できません: ${asset.r2Key} (${response.status})`);
  }
  const body = Buffer.from(await response.arrayBuffer());
  await verifyBackground(body, asset);

  const cachePath = localCandidates(book.id, asset)[1];
  mkdirSync(dirname(cachePath), { recursive: true });
  const tempPath = `${cachePath}.${process.pid}.tmp`;
  writeFileSync(tempPath, body);
  renameSync(tempPath, cachePath);
  return body;
}
