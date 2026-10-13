/**
 * 2026-10-12 独立レビューで判明した納品物の 4 不具合の回帰テスト。
 *  1. SOURCES.csv の注意事項 / LICENSE の出典表示が、e-Stat 以外の出典にも e-Stat と書く
 *  2. PowerPoint 使い方スライドの「data.csv を貼れば 47 県分」が、10 件しか参照しないグラフと食い違う
 *  3. SOURCES.csv の statsDataId が指標定義 (補完出典を含む) と食い違う
 *  4. 47 県すべて同値の列を別指標として数えている
 */
import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { METRICS_REGISTRY } from "@stats47/data-configs";
import { loadPackSnapshotDatasets } from "../src/data/pack-snapshot";
import type { Dataset } from "../src/data/dataset";
import { renderLicenseText } from "../src/licenses/license-text";
import { buildDatabook } from "../src/build/build-databook";
import { buildDatabookPptx, buildProductPptx } from "../src/generators/pptx";
import { loadPrefectureGeometry, JAPAN_CLIP } from "../src/maps/prefecture-geometry";
import { ALL_PRODUCTS } from "../src/catalog/products";
import { JAPANESE_POPULATION_2024 } from "../src/data/datasets/japanese-population";

const PACK_IDS = ["P-01", "P-02", "P-03", "P-04", "P-05", "P-06", "P-07", "P-08", "P-09", "P-10", "P-11", "P-12", "P-14"];
const registry = METRICS_REGISTRY as unknown as Record<string, Record<string, any>>;

// テスト側の独立した分類: 実際に取得している出典 (補完出典を含む) が e-Stat の統計表か。
function effectiveSource(key: string, year: string): Record<string, any> {
  const cfg = registry[key];
  const sup = (cfg.supplementalSources ?? []).find((s: { years: number[] }) => s.years.includes(Number(year)));
  return sup ? sup.source : cfg.source;
}
// パックの固定データ (src/data/pack-snapshots/、R2 から作る派生物・git 管理外) がある環境でだけ実行する。
// CI の checkout には無い (2026-10-13 に PR #1125 の Unit Tests を null 参照で落とした)。CI での実行は PRODUCT-PACK-SNAPSHOT-CI-01
const SNAPSHOTS_READY = PACK_IDS.every((id) => loadPackSnapshotDatasets(id) !== null);
const packs = new Map(SNAPSHOTS_READY ? PACK_IDS.map((id) => [id, loadPackSnapshotDatasets(id)!.datasets]) : []);
const p12 = packs.get("P-12") ?? [];
const byKey = (key: string): Dataset => {
  const d = p12.find((x) => x.rankingKey === key);
  if (!d) throw new Error(`P-12 に ${key} が無い`);
  return d;
};

describe.skipIf(!SNAPSHOTS_READY)("不具合1: 出典の種類に応じた注意事項と出典表示", () => {
  it("e-Stat 以外の提供元の指標は、実際の出典を注意事項に書き、e-Stat の数値とは書かない", () => {
    const cases: Array<[string, string]> = [
      ["fishing-port-count-ksj", "水産庁"],
      ["ambulance-hospital-arrival-time", "消防庁"],
      ["roadside-station-count", "国土交通省「道の駅」"],
      ["lake-count", "国土数値情報"],
      ["avg-salary-all-prefecture", "地方公務員給与実態調査"],
      ["future-population", "日本の地域別将来推計人口"],
    ];
    for (const [key, provider] of cases) {
      const d = byKey(key);
      expect(d.source.notes, key).toContain(provider);
      expect(d.source.notes, key).not.toContain("e-Stat");
      expect(d.source.statsDataId, key).not.toMatch(/^\d{10}$/);
    }
  });

  it("全パックの全指標で、定義上 e-Stat の統計表でない指標は e-Stat と書かず、e-Stat の指標は e-Stat と書く", () => {
    let nonEstat = 0;
    for (const [id, datasets] of packs) {
      for (const d of datasets) {
        expect(d.rankingKey, `${id} rankingKey`).toBeTruthy();
        const cfg = registry[d.rankingKey!];
        const eff = effectiveSource(d.rankingKey!, d.year);
        const calculated = eff.kind === "external" && eff.fetcherKey === "calculated";
        if (calculated) continue; // 算出指標は親指標の出典に従う (別テストで確認)
        const viaEstat = eff.kind === "estat" || eff.kind === "kakei-chousa";
        if (viaEstat) expect(d.source.notes, `${id}:${d.rankingKey}`).toContain("e-Stat");
        else {
          nonEstat += 1;
          expect(d.source.notes, `${id}:${d.rankingKey}`).not.toContain("e-Stat");
          const name = String(eff.config?.source?.name ?? eff.displayName ?? cfg.title); // 定義が持つ具体的な出典名
          expect(d.source.notes, `${id}:${d.rankingKey}`).toContain(name);
        }
      }
    }
    expect(nonEstat).toBeGreaterThan(30); // 非 e-Stat 指標を実際に検査している
  });

  it("算出指標は親指標の出典で書く", () => {
    const d = byKey("disposable-income-after-rent");
    const parents = [byKey("disposable-income-worker-households"), byKey("private-rent-consumption-expenditure")];
    for (const parent of parents) expect(d.source.surveyName).toContain(parent.source.surveyName);
  });

  it("LICENSE の出典表示はパックに含まれる出典の種類に従う", () => {
    const estat = byKey("total-population").source;
    const other = byKey("fishing-port-count-ksj").source;
    const onlyOther = renderLicenseText("personal", [other]);
    expect(onlyOther).not.toContain("政府統計の総合窓口");
    expect(onlyOther).toContain("水産庁");
    const onlyEstat = renderLicenseText("personal", [estat]);
    expect(onlyEstat).toContain("政府統計の総合窓口");
    const mixed = renderLicenseText("personal", [estat, other]);
    expect(mixed).toContain("政府統計の総合窓口");
    expect(mixed).toContain("水産庁");
    // 常に残る条項
    for (const text of [onlyOther, onlyEstat, mixed]) {
      expect(text).toContain("再販売 / 再配布");
      expect(text).toContain("著作権の譲渡ではありません");
    }
  });
});

describe.skipIf(!SNAPSHOTS_READY)("不具合2: 使い方スライドの記載とグラフの参照範囲", () => {
  async function slideTexts(path: string): Promise<{ texts: string[]; chartRefs: string[] }> {
    const zip = await JSZip.loadAsync(readFileSync(path));
    const texts: string[] = [];
    for (const name of Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))) {
      const xml = await zip.file(name)!.async("string");
      texts.push([...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).join("\n"));
    }
    const chartRefs: string[] = [];
    for (const name of Object.keys(zip.files).filter((f) => /^ppt\/charts\/chart\d+\.xml$/.test(f))) {
      const xml = await zip.file(name)!.async("string");
      chartRefs.push(...[...xml.matchAll(/<c:f>([^<]*)<\/c:f>/g)].map((m) => m[1]));
    }
    return { texts, chartRefs };
  }
  function expectUsageMatchesCharts(info: { texts: string[]; chartRefs: string[] }): void {
    const usage = info.texts.find((t) => t.includes("使い方②"));
    expect(usage).toBeTruthy();
    // 実装: グラフは上位 10 件 (行 2〜11) だけを参照する
    const rows = info.chartRefs.filter((r) => /\$[AB]\$2:\$[AB]\$\d+$/.test(r));
    expect(rows.length).toBeGreaterThan(0);
    for (const ref of rows) expect(ref).toMatch(/\$2:\$[AB]\$11$/);
    // 記載: 47 県分の一括差し替えを約束しない。10 件であることを書く
    expect(usage).not.toMatch(/47\s*県(分)?を一括/);
    expect(usage).not.toContain("貼り付けると");
    expect(usage).toMatch(/10\s*(件|行)/);
  }

  it("データブック PowerPoint の使い方スライドは、10 件だけを参照するグラフの実装と一致する", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pf-pptx-"));
    try {
      const out = join(dir, "d.pptx");
      await buildDatabookPptx(packs.get("P-01")!.slice(0, 2), loadPrefectureGeometry(1000, JAPAN_CLIP), out, "t");
      expectUsageMatchesCharts(await slideTexts(out));
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }, 60000);

  it("単一指標 PowerPoint も同じ記載で、実装と一致する", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pf-pptx-"));
    try {
      const out = join(dir, "s.pptx");
      await buildProductPptx(JAPANESE_POPULATION_2024, loadPrefectureGeometry(1000, JAPAN_CLIP), out, "t");
      expectUsageMatchesCharts(await slideTexts(out));
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }, 60000);
});

describe.skipIf(!SNAPSHOTS_READY)("不具合3: SOURCES の statsDataId は指標定義の取得元と一致する", () => {
  it("補完出典で取得した年は補完側の statsDataId・調査名を書く (総人口 2025 は国勢調査 0004065881)", () => {
    const d = packs.get("P-01")!.find((x) => x.rankingKey === "total-population") ?? byKey("total-population");
    expect(d.year).toBe("2025");
    expect(d.source.statsDataId).toBe("0004065881");
    expect(d.source.surveyName).toBe("国勢調査");
  });

  it("全パックの全指標で statsDataId が指標定義 (補完出典を含む) の取得元と一致する", () => {
    let checked = 0;
    let supplemental = 0;
    for (const [id, datasets] of packs) {
      for (const d of datasets) {
        const eff = effectiveSource(d.rankingKey!, d.year);
        if (eff.kind === "external" && eff.fetcherKey === "calculated") continue;
        const expected = String(eff.statsDataId ?? eff.filter?.statsDataId ?? eff.config?.statsDataId ?? "-");
        expect(d.source.statsDataId, `${id}:${d.rankingKey}(${d.year})`).toBe(expected);
        checked += 1;
        if (eff !== registry[d.rankingKey!].source) supplemental += 1;
      }
    }
    expect(checked).toBeGreaterThan(1000);
    expect(supplemental).toBeGreaterThan(0); // 補完出典の年を実際に検査している
  });
});

describe.skipIf(!SNAPSHOTS_READY)("不具合4: 47 県すべて同値の列は 1 つにまとめる", () => {
  const sig = (d: Dataset): string => JSON.stringify(d.values.map((v) => [v.value, v.missing ?? null]));

  it("どのパックにも、値が完全に同じ列が 2 つ以上存在しない", () => {
    for (const [id, datasets] of packs) {
      const seen = new Map<string, string>();
      for (const d of datasets) {
        const s = sig(d);
        expect(seen.has(s), `${id}: ${d.rankingKey} は ${seen.get(s)} と全県同値`).toBe(false);
        seen.set(s, d.rankingKey!);
      }
    }
  });

  it("P-12 の retail-store-count-alt は retail-store-count に統合され、統合した旨を SOURCES に残す", () => {
    expect(p12.some((d) => d.rankingKey === "retail-store-count-alt")).toBe(false);
    const kept = byKey("retail-store-count");
    expect(kept.source.notes).toContain("統合");
    expect(kept.mergedRankingKeys).toEqual(["retail-store-count-alt"]);
  });

  it("統合後の指標数: 同値グループ 15 組・権利要確認 11 件の除外ぶん P-12 は 2099 → 2073", () => {
    expect(p12.length).toBe(2073);
  });

  it("実際に書き出した data.csv の指標列・SOURCES 行・PowerPoint 指標数が同じ数で揃い、重複列が無い", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pf-build-"));
    try {
      const product = ALL_PRODUCTS.find((p) => p.id === "P-12")!;
      const keep = ["retail-store-count", "retail-store-count-alt", "total-population", "fishing-port-count-ksj"];
      // 重複を含むパック全体ではなく、loader の結果から小さな databook を組む (統合済みなので alt は入らない)
      const datasets = p12.filter((d) => keep.includes(d.rankingKey!));
      expect(datasets.map((d) => d.rankingKey).sort()).toEqual(["fishing-port-count-ksj", "retail-store-count", "total-population"]);
      const res = await buildDatabook(product, { title: product.name, datasets }, { outRoot: dir, version: "t1" });
      const csvHeader = readFileSync(join(res.outDir, "data.csv"), "utf8").split("\r\n")[0].split(",");
      const sources = readFileSync(join(res.outDir, "SOURCES.csv"), "utf8").trim().split("\r\n");
      expect(csvHeader.length - 3).toBe(datasets.length);
      expect(sources.length - 1).toBe(datasets.length);
      const license = readFileSync(join(res.outDir, "LICENSE-ja.txt"), "utf8");
      expect(license).toContain("水産庁");
      const zip = await JSZip.loadAsync(readFileSync(join(res.outDir, "product.pptx")));
      const slides = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).length;
      expect(slides).toBe(6 + datasets.length * 3);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }, 120000);
});
