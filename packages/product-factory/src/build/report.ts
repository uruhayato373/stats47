/**
 * リリース台帳 (catalog-status) の再生成。
 * `.claude/state/products/catalog-status.json` に、カタログ定義の status と
 * 生成物 (.local/coconala-products) の有無から導く liveStatus を書き出す。
 * 購入者情報・メッセージ本文・売上は保存しない (販売実績は別途 sales-ledger)。
 */
import { writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_PRODUCTS } from "../catalog/products";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const OUT_ROOT = resolve(REPO_ROOT, ".local/coconala-products");
const STATE_PATH = resolve(REPO_ROOT, ".claude/state/products/catalog-status.json");

function builtProductIds(): Set<string> {
  const built = new Set<string>();
  if (!existsSync(OUT_ROOT)) return built;
  for (const id of readdirSync(OUT_ROOT)) {
    const idDir = join(OUT_ROOT, id);
    let versions: string[] = [];
    try {
      versions = readdirSync(idDir);
    } catch {
      continue;
    }
    if (versions.some((ver) => existsSync(join(idDir, ver, "manifest.json")))) built.add(id);
  }
  return built;
}

export function writeReport(generatedAt = new Date().toISOString()): string {
  const built = builtProductIds();
  const products = ALL_PRODUCTS.map((p) => ({
    id: p.id,
    family: p.family,
    name: p.name,
    catalogStatus: p.status,
    liveStatus: built.has(p.id) ? "generated" : "cataloged",
  }));
  const report = {
    generatedAt,
    total: products.length,
    built: [...built].sort(),
    note: "catalog-status。生成物は .local/coconala-products (git 管理外)。実機検証・出品は人間工程。",
    products,
  };
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(report, null, 2) + "\n");
  return STATE_PATH;
}
