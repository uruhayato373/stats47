/** Offline revalidation of all 47 prefectures and named products. Never calls an API or writes R2.
 * npx tsx -r ./packages/ranking/src/scripts/setup-cli.js apps/web/scripts/audit-rakuten-catalog.ts
 *   --input-dir .local/rakuten-preview --output-dir .local/rakuten-quality --terms さんま,コーヒー
 * Filtered snapshots retain their source generatedAt: revalidation is not a fresh API observation.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

import { getFurusatoNozeiLink } from "../src/features/ads/constants/furusato-nozei";
import { furusatoQualityReasons, furusatoRegionEvidence, productQualityReasons, selectQualityItems } from "../src/features/ads/lib/rakuten-item-quality";
import { allPrefCodes, parseRakutenSnapshot, rakutenFurusatoKey, rakutenItemsKey } from "../src/features/ads/repositories/rakuten-snapshot";

const argv = process.argv.slice(2);
const arg = (key: string) => { const index = argv.indexOf(`--${key}`); return index < 0 ? undefined : argv[index + 1]; };
const input = arg("input-dir");
const output = arg("output-dir");
if (!input || !output) throw new Error("--input-dir / --output-dir が必要です");
const inputRoot = resolve(input);
const outputRoot = resolve(output);
const rel = relative(resolve(".local"), outputRoot);
if (!rel || rel.startsWith("..") || isAbsolute(rel) || outputRoot === inputRoot) throw new Error("出力先は入力と異なる .local/ 配下に限定します");
const terms = (arg("terms") ?? "さんま,コーヒー").split(",").map((term) => term.trim()).filter(Boolean);
if (terms.some((term) => /[\\/?#%\u0000-\u001f]/.test(term))) throw new Error("品目名に使用できない文字があります");

async function main() {
  const results: Array<Record<string, unknown>> = [];
  const targets = [
    ...allPrefCodes().map((prefCode) => ({ key: rakutenFurusatoKey(prefCode), prefName: getFurusatoNozeiLink(prefCode)!.prefName, term: null })),
    ...terms.map((term) => ({ key: rakutenItemsKey(term), prefName: null, term })),
  ];
  for (const target of targets) {
    try {
      const snapshot = parseRakutenSnapshot(JSON.parse(await readFile(resolve(inputRoot, target.key), "utf8")));
      const reasons = (item: (typeof snapshot.items)[number]) => target.prefName
        ? furusatoQualityReasons(item, target.prefName) : productQualityReasons(item, target.term!);
      const selected = selectQualityItems(snapshot.items, reasons);
      const food = target.prefName ? selectQualityItems(snapshot.items,
        (item) => furusatoQualityReasons(item, target.prefName!, { context: "food" })) : null;
      const rejected = snapshot.items.map((item, index) => ({ index, name: item.name, reasons: reasons(item) })).filter((row) => row.reasons.length);
      const filteredPath = resolve(outputRoot, "filtered", target.key);
      await mkdir(dirname(filteredPath), { recursive: true });
      await writeFile(filteredPath, JSON.stringify({ ...snapshot, items: selected }, null, 2));
      results.push({ ...target, status: "audited", generatedAt: snapshot.generatedAt, before: snapshot.items.length,
        after: selected.length, foodAfter: food?.length ?? null, rejected,
        regionEvidence: target.prefName ? snapshot.items.map((item) => furusatoRegionEvidence(item, target.prefName!)) : null });
    } catch {
      results.push({ ...target, status: "unavailable-or-invalid" });
    }
  }
  const prefectures = results.filter((row) => row.prefName);
  const report = { generatedAt: new Date().toISOString(), mode: "offline-revalidation-not-refetched", inputRoot,
    expected: targets.length, audited: results.filter((row) => row.status === "audited").length,
    unavailable: results.filter((row) => row.status !== "audited").length,
    regionalFallbackPrefectures: prefectures.filter((row) => row.after === 0).map((row) => row.key),
    foodFallbackPrefectures: prefectures.filter((row) => row.foodAfter === 0).map((row) => row.key), results };
  await mkdir(outputRoot, { recursive: true });
  await writeFile(resolve(outputRoot, "audit.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ expected: report.expected, audited: report.audited, unavailable: report.unavailable,
    regionalFallbacks: report.regionalFallbackPrefectures.length, foodFallbacks: report.foodFallbackPrefectures.length,
    evidence: resolve(outputRoot, "audit.json") }));
  if (report.unavailable) process.exitCode = 1;
}

main().catch(() => { console.error("楽天ローカル監査に失敗しました"); process.exitCode = 1; });
