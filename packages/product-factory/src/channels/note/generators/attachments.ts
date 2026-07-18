/**
 * attachments.json ジェネレータ (仕様 §10)。
 * 商品 manifest (.local/coconala-products/<id>/<version>/manifest.json) を参照し、
 * ファイルを複製せずに添付メタを組み立てる。有料記事のみ添付を持つ (無料記事は空)。
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NoteArticlePlan } from "../types";
import type { ProductDefinition, ProductStatus } from "../../../catalog/types";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const COCONALA_ROOT_DEFAULT = resolve(REPO_ROOT, ".local/coconala-products");

/** 添付から除外する非成果物 (販売文・プレビュー・台帳)。 */
const NON_DELIVERABLE_PREFIX = ["listing/", "preview/"];

const CONTENT_TYPE: Readonly<Record<string, string>> = {
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".csv": "text/csv",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain",
  ".md": "text/markdown",
};

/** 添付を許可する商品ライフサイクル (仕様 §10)。それ以外は verified=false。 */
const VERIFIED_STATUS: ReadonlySet<ProductStatus> = new Set<ProductStatus>(["reviewed", "approved"]);

export interface NoteAttachment {
  readonly productId: string;
  readonly version: string;
  /** リポジトリ相対の参照パス (複製しない)。 */
  readonly sourcePath: string;
  readonly filename: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly contentType: string;
  readonly isPaid: boolean;
  readonly licenseId: string;
  readonly officeCompatibility: readonly string[];
  /** 商品が reviewed/approved か。false = 未検証 (販売添付は保留)。 */
  readonly verified: boolean;
}

interface ProductManifestFile {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}
interface ProductManifestShape {
  readonly version: string;
  readonly files: readonly ProductManifestFile[];
}

export interface ResolveAttachmentsOptions {
  readonly coconalaRoot?: string;
  readonly version?: string;
}

/**
 * 有料記事の member 商品を添付メタへ解決する。無料記事は [] を返す。
 * 商品が未生成 (.local に manifest 無し) の場合は pending 添付 (bytes=0, sha256="") を返し、
 * missing に productId を記録する。
 */
export function resolveAttachments(
  article: NoteArticlePlan,
  products: readonly ProductDefinition[],
  opts: ResolveAttachmentsOptions = {},
): { attachments: NoteAttachment[]; missing: string[] } {
  if (article.access !== "paid") return { attachments: [], missing: [] };

  const root = opts.coconalaRoot ?? COCONALA_ROOT_DEFAULT;
  const version = opts.version ?? "v1";
  const byId = new Map(products.map((p) => [p.id, p]));
  const attachments: NoteAttachment[] = [];
  const missing: string[] = [];

  for (const pid of article.memberProductIds) {
    const product = byId.get(pid);
    if (!product) {
      missing.push(pid);
      continue;
    }
    const manifestPath = join(root, pid, version, "manifest.json");
    const verified = VERIFIED_STATUS.has(product.status);
    if (!existsSync(manifestPath)) {
      // 未生成: pending 添付を 1 件だけ置く (実体無し)。
      attachments.push({
        productId: pid,
        version,
        sourcePath: `.local/coconala-products/${pid}/${version}/`,
        filename: "(未生成)",
        sha256: "",
        bytes: 0,
        contentType: "application/octet-stream",
        isPaid: true,
        licenseId: product.licenseId,
        officeCompatibility: product.compatibility,
        verified,
      });
      missing.push(pid);
      continue;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as ProductManifestShape;
    for (const f of manifest.files) {
      if (NON_DELIVERABLE_PREFIX.some((pre) => f.path.startsWith(pre))) continue;
      attachments.push({
        productId: pid,
        version: manifest.version,
        sourcePath: `.local/coconala-products/${pid}/${manifest.version}/${f.path}`,
        filename: f.path,
        sha256: f.sha256,
        bytes: f.bytes,
        contentType: CONTENT_TYPE[extname(f.path)] ?? "application/octet-stream",
        isPaid: true,
        licenseId: product.licenseId,
        officeCompatibility: product.compatibility,
        verified,
      });
    }
  }
  return { attachments, missing };
}

export function buildAttachmentsJson(
  article: NoteArticlePlan,
  attachments: readonly NoteAttachment[],
): string {
  const payload = {
    slug: article.slug,
    access: article.access,
    note: "添付は商品 manifest を参照し、ファイルを複製しない (SSOT は .local/coconala-products)。verified=false の添付は実機検証まで販売添付を保留する。",
    attachments,
  };
  return JSON.stringify(payload, null, 2) + "\n";
}
