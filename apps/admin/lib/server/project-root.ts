import "server-only";

import fs from "node:fs";
import path from "node:path";

/**
 * モノレポルートの解決 (旧 server.mjs の PROJECT_ROOT = path.resolve(__dirname, "../../..") 相当)。
 *
 * apps/admin は monorepo の 2 階層下 (apps/admin/) なので、既定は cwd から `../..`。
 * STATS47_PROJECT_ROOT が指定されていれば優先する (Next.js の cwd が変わっても効くように)。
 * <root>/package.json の name === "stats47-monorepo" を検証し、違えば throw (誤ったルートで
 * .claude/state を破壊しないため)。結果はモジュール変数にキャッシュ。
 */
let cachedRoot: string | null = null;

export function projectRoot(): string {
  if (cachedRoot) return cachedRoot;
  const root = process.env.STATS47_PROJECT_ROOT
    ? path.resolve(process.env.STATS47_PROJECT_ROOT)
    : path.resolve(process.cwd(), "../..");
  const pkgPath = path.join(root, "package.json");
  let name: string | undefined;
  try {
    name = JSON.parse(fs.readFileSync(pkgPath, "utf8")).name;
  } catch (e) {
    throw new Error(
      `project root not found: ${pkgPath} を読めません (${(e as Error).message})。` +
        `STATS47_PROJECT_ROOT を設定してください`,
    );
  }
  if (name !== "stats47-monorepo") {
    throw new Error(
      `project root 検証失敗: ${pkgPath} の name は "${name}" (expected "stats47-monorepo")`,
    );
  }
  cachedRoot = root;
  return root;
}

/** ローカル SNS 素材ミラー (旧 LOCAL_SNS_DIR)。 */
export function localSnsDir(): string {
  return path.join(projectRoot(), ".local/r2/sns");
}

/** ブログ OGP AI パイロットのローカル出力先 (旧 LOCAL_PILOT_DIR)。 */
export function localPilotDir(): string {
  return path.join(projectRoot(), ".local/ogp-pilot");
}

/** .claude/state ディレクトリ (旧 STATE_DIR)。 */
export function stateDir(): string {
  return path.join(projectRoot(), ".claude/state");
}

/** gallery 固有の永続 state (旧 GALLERY_STATE)。 */
export function galleryStatePath(): string {
  return path.join(projectRoot(), ".local/sns-gallery-state.json");
}

/** R2 公開ベース URL (旧 R2_BASE)。 */
export const R2_BASE =
  process.env.SNS_R2_BASE || process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

/** 本番サイト origin (旧 SITE)。 */
export const SITE = process.env.SITE_ORIGIN || "https://stats47.jp";
