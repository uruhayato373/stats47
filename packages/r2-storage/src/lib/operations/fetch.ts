
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@stats47/logger";
import { gunzipSync } from "node:zlib";
import { getR2Client } from "../clients/get-r2-client";
import { getS3Client } from "../clients/get-s3-client";
import { detectEnvironment } from "../utils/detect-environment";
import { shouldSkipRemoteR2Read } from "../utils/should-skip-remote-r2-read";

/**
 * R2 オブジェクトキーの安全性を検証する（defense-in-depth）。
 *
 * 正当な R2 キーは `app/...` `gis/...` `ges/...` `sns/...` `video/...` のような
 * スラッシュ区切りの相対パスのみ。以下を拒否する:
 * - パストラバーサル (`..` セグメント / バックスラッシュ)
 * - 絶対パス・プロトコル相対 URL (`/foo`, `//evil.com`)
 * - スキーム付き URL (`http:`, `file:` 等) — SSRF / ローカルファイル読み出し防止
 * - NUL バイト
 *
 * 正当なキー（`app/blog/<slug>/data/chart.json` 等）は一切拒否しない。
 */
function isSafeR2Key(key: string): boolean {
  if (typeof key !== "string" || key.length === 0) return false;
  if (key.includes("\0") || key.includes("\\")) return false;
  // 公開URLへ組み込む key から、パス以外の意味を持つ文字を外す。
  // `?` / `#` はクエリ・フラグメントとして解釈され、意図と別のオブジェクトを取りに行く
  // (実測: key="app/blog/x?foo=1" は pathname="/app/blog/x" になる)。
  // 空白と制御文字も URL として曖昧なので拒否する。
  // 非ASCII は encodeURI 相当で正しくパスに載るため許可する
  // (参考文献の日本語キーが使えなくなるため、ASCII allowlist には戻さない)。
  if (/[?#\s\u0000-\u001f\u007f]/.test(key)) return false;
  // 絶対パス / プロトコル相対 (`/foo`, `//host`)
  if (key.startsWith("/")) return false;
  // スキーム付き URL (`http://`, `file:`, `data:` 等)
  if (/^[a-z][a-z0-9+.-]*:/i.test(key)) return false;
  // `..` をパスセグメントとして含む（先頭/中間/末尾いずれも）
  const segments = key.split("/");
  if (segments.some((s) => s === "..")) return false;
  return true;
}

async function fetchFromS3(key: string): Promise<Buffer | null> {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";
  const s3 = getS3Client();
  try {
    const response = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
    if (!response.Body) return null;
    const bytes = await response.Body.transformToByteArray();
    return decodeStoredBody(Buffer.from(bytes), response.ContentEncoding);
  } catch (err: unknown) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e?.name === "NoSuchKey" || e?.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

export function decodeStoredBody(
  body: Buffer,
  contentEncoding: string | null | undefined
): Buffer {
  return contentEncoding?.trim().toLowerCase() === "gzip"
    ? gunzipSync(body)
    : body;
}

/**
 * 公開 R2 URL (例: https://storage.stats47.jp) からオブジェクトを取得する。
 * 認証不要な build / スクリプト環境向けの最終 read tier。
 * @returns 見つかれば Buffer、404 なら null（その他のエラーは throw）。
 */
function getPublicR2Base(): string | null {
  const base = process.env.R2_PUBLIC_FETCH_URL ?? process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  return base ? base.replace(/\/+$/, "") : null;
}

async function fetchFromPublicUrl(base: string, key: string): Promise<Buffer | null> {
  const url = `${base}/${key.replace(/^\/+/, "")}`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`公開 R2 URL 取得に失敗 (HTTP ${res.status}): ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * オブジェクトを R2 から取得（Buffer形式）
 *
 * ローカル FS ミラー読み取りは廃止。remote (binding/S3/公開URL) が唯一の真実源。
 *
 * 優先順位:
 *   1. Cloudflare Workers R2バインディング
 *   2. S3 API（スクリプト環境）
 *   3. 公開 R2 URL（R2_PUBLIC_FETCH_URL / NEXT_PUBLIC_R2_PUBLIC_URL。認証不要の最終手段）
 *
 * CF Workers ランタイムは 1 (binding) で必ず先に返るため 3 には到達しない（挙動不変）。
 * 3 は binding も S3 認証も無い build / スクリプト環境でのみ発火する。
 */
export async function fetchFromR2(
  key: string,
  options?: { async?: boolean }
): Promise<Buffer | null> {
  // defense-in-depth: 呼び出し側 (API route 等) の検証漏れに備え、
  // パストラバーサル / 絶対パス / スキーム付き URL を core reader で拒否する。
  // 正当な `app/...` `gis/...` キーは通過する（挙動不変）。
  if (!isSafeR2Key(key)) {
    logger.warn({ key }, "不正な R2 キーを拒否しました");
    return null;
  }

  const env = detectEnvironment();

  // build / スクリプト環境でS3資格情報が無い場合だけ、明示された公開URLへ直行する。
  // S3資格情報があるCIでは、直前にpushしたobjectをCDN cache越しに読み直すと
  // 古いsnapshotを派生物へ焼き込むため、下のS3 tierを必ず優先する。
  const forcedPublicBase = process.env.R2_PUBLIC_FETCH_URL?.replace(/\/+$/, "");
  if (forcedPublicBase && !env.hasS3Credentials) {
    return await fetchFromPublicUrl(forcedPublicBase, key);
  }

  if (shouldSkipRemoteR2Read()) {
    return null;
  }

  if (env.isCloudflareWorkers) {
    try {
      const r2Client = await getR2Client(options);
      const object = await r2Client.get(key);
      if (!object) return null;
      const arrayBuffer = await object.arrayBuffer();
      return decodeStoredBody(
        Buffer.from(arrayBuffer),
        object.httpMetadata?.contentEncoding
      );
    } catch (error) {
      logger.warn({ key, error }, "R2バインディング経由での取得に失敗。S3 APIにフォールバックします");
    }
  }

  if (env.hasS3Credentials) {
    try {
      return await fetchFromS3(key);
    } catch (error) {
      logger.error({ key, error }, "S3 API での取得に失敗しました");
      throw error;
    }
  }

  // 最終 tier: 公開 R2 URL（認証が無い build 環境向け）
  const publicBase = getPublicR2Base();
  if (publicBase) {
    return await fetchFromPublicUrl(publicBase, key);
  }

  const errorMessage = "R2クライアントを取得できませんでした。環境変数 R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_S3_ENDPOINT または R2_PUBLIC_FETCH_URL / NEXT_PUBLIC_R2_PUBLIC_URL が設定されているか確認してください。";
  logger.error({ key, ...env }, errorMessage);
  throw new Error(errorMessage);
}

/**
 * オブジェクトを R2 から取得（文字列形式）
 */
export async function fetchFromR2AsString(
  key: string,
  options?: { async?: boolean }
): Promise<string | null> {
  const buffer = await fetchFromR2(key, options);
  if (!buffer) return null;
  return buffer.toString("utf-8");
}

/**
 * オブジェクトを R2 から取得してJSONとしてパース
 */
export async function fetchFromR2AsJson<T>(
  key: string,
  options?: { async?: boolean }
): Promise<T | null> {
  const str = await fetchFromR2AsString(key, options);
  if (!str) return null;
  return JSON.parse(str) as T;
}
