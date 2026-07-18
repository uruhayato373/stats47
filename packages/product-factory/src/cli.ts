/**
 * ココナラ商品ファクトリー CLI (Phase 1)。
 *
 * 使い方 (workspace 経由):
 *   npm run products:catalog  --workspace=@stats47/product-factory -- --check
 *   npm run products:validate --workspace=@stats47/product-factory -- --id B-01
 *   npm run products:report   --workspace=@stats47/product-factory
 *
 * Phase 1 で実装するのは catalog / validate (検証系) のみ。
 * generate / preview / report は Phase 2 以降の生成系で、ここでは未実装であることを明示して終了する。
 */
import { ALL_PRODUCTS } from "./catalog/products";
import { FAMILY_META } from "./catalog/families";
import { validateCatalog } from "./validators/catalog-validator";
import type { ProductFamily } from "./catalog/types";

const argv = process.argv.slice(2);
const subcommand = argv[0] ?? "";
const flags = new Set(argv.slice(1).filter((a) => a.startsWith("--")));
const idFlagIndex = argv.indexOf("--id");
const idArg = idFlagIndex >= 0 ? argv[idFlagIndex + 1] : undefined;

function printCatalogSummary(): void {
  const result = validateCatalog(ALL_PRODUCTS);
  console.log(`商品総数: ${result.total}`);
  const families = Object.keys(FAMILY_META) as ProductFamily[];
  for (const family of families) {
    const letter = FAMILY_META[family].letter;
    const count = result.perFamily[letter] ?? 0;
    console.log(`  ${letter} ${family.padEnd(11)} ${String(count).padStart(3)}  ${FAMILY_META[family].label}`);
  }
}

function runCheck(): number {
  const result = validateCatalog(ALL_PRODUCTS);
  printCatalogSummary();
  if (result.ok) {
    console.log(`\n✅ catalog check: OK (${result.total} products, errors 0)`);
    return 0;
  }
  console.error(`\n❌ catalog check: ${result.errors.length} error(s)`);
  for (const e of result.errors) {
    console.error(`  [${e.code}] ${e.id ? `${e.id}: ` : ""}${e.message}`);
  }
  return 1;
}

function runValidate(): number {
  const result = validateCatalog(ALL_PRODUCTS);
  const scoped = idArg ? result.errors.filter((e) => e.id === idArg) : result.errors;
  if (idArg) {
    const product = ALL_PRODUCTS.find((p) => p.id === idArg);
    if (!product) {
      console.error(`❌ 商品が見つからない: ${idArg}`);
      return 1;
    }
    console.log(`商品 ${idArg} (${product.family}): ${product.name}`);
  }
  if (scoped.length === 0) {
    console.log(`✅ validate: エラーなし${idArg ? ` (${idArg})` : ""}`);
    return 0;
  }
  console.error(`❌ validate: ${scoped.length} error(s)`);
  for (const e of scoped) {
    console.error(`  [${e.code}] ${e.id ? `${e.id}: ` : ""}${e.message}`);
  }
  return 1;
}

function notImplemented(name: string): number {
  console.log(`ℹ️  \`${name}\` は後続 Phase で実装します。現状は未実装です。`);
  console.log("   対応コマンド: `catalog --check` / `validate --id <ID>` / `generate --id B-01`");
  return 0;
}

async function runGenerate(): Promise<number> {
  if (flags.has("--all")) {
    const { buildAll } = await import("./build/build-all");
    const results = await buildAll({
      onProgress: (done, total, res) => {
        if (done % 10 === 0 || done === total || done === 1) {
          console.log(`  [${done}/${total}] ${res.productId} ${res.family} (${res.formatsBuilt.join(",") || "listing"})`);
        }
      },
    });
    const skippedFmt = new Set<string>();
    for (const r of results) for (const f of r.skippedFormats) skippedFmt.add(f);
    console.log(`✅ 全 ${results.length} 商品を生成 → .local/coconala-products/`);
    if (skippedFmt.size > 0) console.log(`   未対応形式 (スキップ): ${[...skippedFmt].join(", ")}`);
    return 0;
  }
  if (!idArg) {
    console.log("usage: generate --id <ID> | generate --all");
    return 1;
  }
  const { buildProduct } = await import("./build/build-product");
  const { ALL_PRODUCTS } = await import("./catalog/products");
  const { JAPANESE_POPULATION_2024 } = await import("./data/datasets/japanese-population");
  const product = ALL_PRODUCTS.find((p) => p.id === idArg);
  if (!product) {
    console.error(`❌ 商品が見つからない: ${idArg}`);
    return 1;
  }
  const res = await buildProduct(product, JAPANESE_POPULATION_2024);
  console.log(`✅ 生成: ${res.productId} → ${res.outDir}`);
  for (const f of res.manifest.files) console.log(`   ${f.path} (${f.bytes} bytes)`);
  return 0;
}

async function runReport(): Promise<number> {
  const { writeReport } = await import("./build/report");
  const path = writeReport();
  console.log(`✅ catalog-status を書き出しました: ${path}`);
  return 0;
}

async function main(): Promise<number> {
  switch (subcommand) {
    case "catalog":
      return flags.has("--check") ? runCheck() : (printCatalogSummary(), 0);
    case "validate":
      return runValidate();
    case "generate":
      return runGenerate();
    case "report":
      return runReport();
    case "preview":
      return notImplemented(subcommand);
    default:
      console.log("usage: cli.ts <catalog|validate|generate|preview|report> [--check] [--id <ID>]");
      console.log("実装済: catalog --check / validate --id <ID> / generate --id B-01");
      return subcommand === "" ? 0 : 1;
  }
}

main().then((code) => process.exit(code));
