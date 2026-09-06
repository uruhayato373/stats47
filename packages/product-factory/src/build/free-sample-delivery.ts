/** Generated pin for the free sample; never a Coconala listing/publication record. */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { ALL_PRODUCTS } from "../catalog/products";

export const FREE_SAMPLE_STATE = ".claude/state/products/free-sample-delivery.json";
export interface FreeSampleDelivery {
  title: string;
  _delivery: { artifactDirectory: string; manifestSha256: string; indicatorCount: number; pptxIndicatorCount: number; hasXlsx: boolean; officeValidation: string };
}
export function readFreeSampleDelivery(root: string): FreeSampleDelivery | null {
  const path = join(root, FREE_SAMPLE_STATE);
  if (!existsSync(path)) return null;
  const state = JSON.parse(readFileSync(path, "utf8"));
  if (state.schemaVersion !== 1 || state.productId !== "P-13" || state.publicationStatus !== "not-published") throw new Error("invalid free sample state");
  return state.delivery as FreeSampleDelivery;
}
export function recordFreeSampleDelivery(root: string, directory: string): void {
  const relativeDir = relative(resolve(root), resolve(directory));
  if (!/^\.local\/coconala-products\/P-13\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(relativeDir)) throw new Error("unsafe free sample directory");
  const bytes = readFileSync(join(directory, "manifest.json"));
  const manifest = JSON.parse(bytes.toString("utf8"));
  if (manifest.productId !== "P-13" || relativeDir.split("/").pop() !== manifest.version) throw new Error("free sample identity mismatch");
  const required = ["data.csv", "SOURCES.csv", "LICENSE-ja.txt", "databook.pdf", "assets/choropleth-map.png", "preview/thumbnail-620x620.png", "listing/listing.md"];
  if (!Array.isArray(manifest.files) || manifest.files.length !== required.length) throw new Error("free sample files mismatch");
  for (const name of required) {
    const file = manifest.files.find((f: { path: string }) => f.path === name);
    const body = readFileSync(join(directory, name));
    if (!file || file.bytes !== body.length || file.sha256 !== createHash("sha256").update(body).digest("hex")) throw new Error(`free sample SHA mismatch: ${name}`);
  }
  const product = ALL_PRODUCTS.find(p => p.id === "P-13")!;
  const delivery: FreeSampleDelivery = { title: product.name, _delivery: { artifactDirectory: relativeDir,
    manifestSha256: createHash("sha256").update(bytes).digest("hex"), indicatorCount: product.datasets.length,
    pptxIndicatorCount: 0, hasXlsx: false, officeValidation: "not-applicable" } };
  const path = join(root, FREE_SAMPLE_STATE);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify({ schemaVersion: 1, productId: "P-13", generatedAt: new Date().toISOString(), publicationStatus: "not-published", delivery }, null, 2) + "\n");
}
