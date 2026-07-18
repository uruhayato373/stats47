/**
 * source-manifest.json / product-links.json ジェネレータ (仕様 §5・§7・§13)。
 * 出典・年次・ライセンスの provenance を商品 manifest から集約し、note↔ココナラ↔stats47 の
 * リンクを 1 箇所にまとめる (共通 productId/version でドリフト検知できるようにする)。
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NoteArticlePlan } from "../types";
import type { ProductDefinition } from "../../../catalog/types";
import { LICENSE_REGISTRY, type LicenseId } from "../../../catalog/licenses";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const COCONALA_ROOT_DEFAULT = resolve(REPO_ROOT, ".local/coconala-products");

export interface ProductProvenance {
  readonly productId: string;
  readonly name: string;
  readonly indicator: string;
  readonly year: string;
  readonly notice: string;
  readonly licenseId: string;
  readonly attribution: string;
}

interface ProductManifestShape {
  readonly indicator?: string;
  readonly year?: string;
  readonly notice?: string;
}

/** member 商品の出典 provenance を manifest から解決する (未生成なら定義由来の既定値)。 */
export function resolveProvenance(
  article: NoteArticlePlan,
  products: readonly ProductDefinition[],
  opts: { coconalaRoot?: string; version?: string } = {},
): ProductProvenance[] {
  const root = opts.coconalaRoot ?? COCONALA_ROOT_DEFAULT;
  const version = opts.version ?? "v1";
  const byId = new Map(products.map((p) => [p.id, p]));
  const out: ProductProvenance[] = [];
  for (const pid of article.memberProductIds) {
    const product = byId.get(pid);
    if (!product) continue;
    const lic = LICENSE_REGISTRY[product.licenseId as LicenseId];
    const manifestPath = join(root, pid, version, "manifest.json");
    let indicator = "(未生成)";
    let year = "(未生成)";
    let notice = "商品未生成 (draft は雛形)";
    if (existsSync(manifestPath)) {
      const m = JSON.parse(readFileSync(manifestPath, "utf8")) as ProductManifestShape;
      indicator = m.indicator ?? indicator;
      year = m.year ?? year;
      notice = m.notice ?? notice;
    }
    out.push({
      productId: pid,
      name: product.name,
      indicator,
      year,
      notice,
      licenseId: product.licenseId,
      attribution: lic?.attribution ?? "",
    });
  }
  return out;
}

export function buildSourceManifest(
  article: NoteArticlePlan,
  provenance: readonly ProductProvenance[],
): string {
  const payload = {
    slug: article.slug,
    series: article.series,
    stats47Targets: article.stats47Targets,
    note: "出典は商品 manifest 由来。基準年固定・再生成可能。国・府省・自治体や e-Stat の公認を示すものではない。",
    sources: provenance,
  };
  return JSON.stringify(payload, null, 2) + "\n";
}

/**
 * product-links.json: note 記事 ↔ ココナラ商品 ↔ stats47 の対応。
 * productId/version を共通参照し、価格・版のドリフトを後段で検知できるようにする。
 */
export function buildProductLinks(
  article: NoteArticlePlan,
  products: readonly ProductDefinition[],
): string {
  const byId = new Map(products.map((p) => [p.id, p]));
  const payload = {
    slug: article.slug,
    series: article.series,
    access: article.access,
    notePriceJpy: article.priceJpy,
    stats47Targets: article.stats47Targets,
    products: article.memberProductIds.map((pid) => {
      const p = byId.get(pid);
      return {
        productId: pid,
        name: p?.name ?? "(不明)",
        coconalaPriceYen: p?.price.initialYen ?? null,
        licenseId: p?.licenseId ?? null,
        status: p?.status ?? null,
      };
    }),
  };
  return JSON.stringify(payload, null, 2) + "\n";
}
