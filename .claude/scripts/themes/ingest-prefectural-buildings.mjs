#!/usr/bin/env node
/** Official prefectural public-property stock; only --write-local stages canonical values. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, realpath } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";
const root = process.cwd();
const requireRepo = createRequire(resolve(root, "package.json"));
const ExcelJS = requireRepo("exceljs");
const { parse: parseCsv } = requireRepo("csv-parse/sync");
const prefs = requireRepo("./packages/area/src/data/prefectures.json");
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const sha = (body) => createHash("sha256").update(body).digest("hex");
export const HEADERS = [
  "決算年度",
  "業務コード",
  "団体コード ",
  "県名",
  "団体名",
  "団体区分",
  "表番号",
  "表名称",
  "行番号",
  "行名称",
  "001:土地（地積　㎡）・令和5年度末現在高",
  "002:土地（地積　㎡）・令和6年度中増減高",
  "003:土地（地積　㎡）・令和6年度末現在高",
  "004:建物（延面積　㎡）・令和5年度末現在高",
  "005:建物（延面積　㎡）・令和6年度中増減高",
  "006:建物（延面積　㎡）・令和6年度末現在高",
];
export const LABELS = {
  "01": "公有財産・行政財産・本庁舎",
  "02": "公有財産・行政財産・その他の行政機関・警察施設",
  "03": "公有財産・行政財産・その他の行政機関・その他の施設",
  "04": "公有財産・行政財産・公共用財産・高等学校",
  "05": "公有財産・行政財産・公共用財産・中等教育学校",
  "06": "公有財産・行政財産・公共用財産・公営住宅",
  "07": "公有財産・行政財産・公共用財産・公園",
  "08": "公有財産・行政財産・公共用財産・その他の施設",
  "09": "公有財産・行政財産・山林",
  10: "公有財産・行政財産・その他",
  11: "公有財産・行政財産・計",
  12: "公有財産・普通財産・宅地",
  13: "公有財産・普通財産・田畑",
  14: "公有財産・普通財産・山林",
  15: "公有財産・普通財産・その他",
  16: "公有財産・普通財産・計",
  17: "基金・土地開発基金・宅地",
  18: "基金・土地開発基金・田畑",
  19: "基金・土地開発基金・山林",
  20: "基金・土地開発基金・その他",
  21: "基金・土地開発基金・計",
  22: "基金・その他の基金・宅地",
  23: "基金・その他の基金・田畑",
  24: "基金・その他の基金・山林",
  25: "基金・その他の基金・その他",
  26: "基金・その他の基金・計",
};
export const CITY_PINS = [
  {
    code: "011002",
    prefName: "北海道",
    name: "札幌市",
  },
  {
    code: "041009",
    prefName: "宮城県",
    name: "仙台市",
  },
  {
    code: "111007",
    prefName: "埼玉県",
    name: "さいたま市",
  },
  {
    code: "121002",
    prefName: "千葉県",
    name: "千葉市",
  },
  {
    code: "141003",
    prefName: "神奈川県",
    name: "横浜市",
  },
  {
    code: "141305",
    prefName: "神奈川県",
    name: "川崎市",
  },
  {
    code: "141500",
    prefName: "神奈川県",
    name: "相模原市",
  },
  {
    code: "151009",
    prefName: "新潟県",
    name: "新潟市",
  },
  {
    code: "221007",
    prefName: "静岡県",
    name: "静岡市",
  },
  {
    code: "221309",
    prefName: "静岡県",
    name: "浜松市",
  },
  {
    code: "231002",
    prefName: "愛知県",
    name: "名古屋市",
  },
  {
    code: "261009",
    prefName: "京都府",
    name: "京都市",
  },
  {
    code: "271004",
    prefName: "大阪府",
    name: "大阪市",
  },
  {
    code: "271403",
    prefName: "大阪府",
    name: "堺市",
  },
  {
    code: "281000",
    prefName: "兵庫県",
    name: "神戸市",
  },
  {
    code: "331007",
    prefName: "岡山県",
    name: "岡山市",
  },
  {
    code: "341002",
    prefName: "広島県",
    name: "広島市",
  },
  {
    code: "401005",
    prefName: "福岡県",
    name: "北九州市",
  },
  {
    code: "401307",
    prefName: "福岡県",
    name: "福岡市",
  },
  {
    code: "431001",
    prefName: "熊本県",
    name: "熊本市",
  },
];
export const SOURCES = [
  {
    filename: "facilities-property-2025.csv",
    url: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040442089&fileKind=1",
    sha256: "77ed19c13137c0893bba71aa05b24623913d70b95c6343e9272f05d84bd8c4d8",
    bytes: 172000,
  },
  {
    filename: "facilities-property-2025.xlsx",
    url: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040442089&fileKind=0",
    sha256: "67ee107575c71caff64278fdfd64d19c390b1b5688c72fabf5a8a79fb652eebf",
    bytes: 139482,
  },
  {
    filename: "facilities-definitions-2025.pdf",
    url: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040442079&fileKind=2",
    sha256: "538dd47d05b829f278ac63f2e100d268ebc9c16b5bf901acb37e5ab02182d385",
    bytes: 188915,
  },
];
export const FIELD = {
  key: "prefectural-public-building-floor-area",
  exportName: "prefecturalPublicBuildingFloorArea",
  unit: "㎡",
  year: 2024,
  yearName: "2024年度末（2025年3月31日現在）",
};
export const EXPECTED_SOURCE = {
  kind: "external",
  fetcherKey: "manual",
  displayName: "公共施設状況調査",
  url: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040442089&fileKind=1",
  config: {
    source: {
      name: "公共施設状況調査",
      url: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040442089&fileKind=1",
    },
    provenance: {
      url: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040442089&fileKind=1",
      sourceSha256:
        "77ed19c13137c0893bba71aa05b24623913d70b95c6343e9272f05d84bd8c4d8",
      publicationIndexUrl:
        "https://www.e-stat.go.jp/stat-search/files?layout=datalist&toukei=00200252&tstat=000001151626&tclass1=000001151629&tclass2=000001151630&cycle=7&year=20250&month=0",
      table: "令和6年度都道府県公共施設状況調査 10表 公有財産・基金",
      valueColumn:
        "行11 行政財産計＋行16 普通財産計、006:建物（延面積 ㎡）・令和6年度末現在高",
      dataYear: "2024年度末（2025年3月31日現在）",
      accessedAt: "2026-09-10",
      extraction:
        "CP932 CSVの26区分中、公有財産16区分を検査。団体コードの上5桁が都道府県コードと一致する県47行を使用し、政令市20行は加算しない。行政財産と普通財産の建物延面積を合計。",
      verification:
        "47県の行政財産計166907556㎡＋普通財産計8935926㎡＝175843482㎡。各県内訳・前年度末＋年度増減＝当年度末、全国合計を検査。CSVとXLSXの1794行16列を全セル照合。",
      restore:
        "node --import tsx .claude/scripts/themes/ingest-prefectural-buildings.mjs --write-local",
      sourceUnit: "㎡",
      geography: "都道府県が報告する公有財産。所在地県の全所有者建物ではない。",
      periodEnd: "2025-03-31",
      timeScope: "fiscal-year-2024-end",
      population:
        "prefectural-public-property-administrative-plus-ordinary-property",
      accountScope: "ordinary-account-principle-per-official-instructions",
      definitionUrl:
        "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040442079&fileKind=2",
      definitionSha256:
        "538dd47d05b829f278ac63f2e100d268ebc9c16b5bf901acb37e5ab02182d385",
      exclusions:
        "市町村所有分、基金、道路・橋りょう・河川・海岸・港湾・漁港を除く。",
      counting: "building-floor-area-stock-not-facility-count",
      denominator: "none",
    },
  },
};
export function integer(value, { signed = false } = {}) {
  assert.equal(typeof value, "string", "value must preserve original text");
  assert.match(
    value,
    signed ? /^-?\d+$/ : /^\d+$/,
    "missing/suppressed/non-integer value",
  );
  const n = Number(value);
  assert.ok(Number.isSafeInteger(n));
  return n;
}
const checksum = (five) => {
  const remainder =
    11 - ([...five].reduce((n, c, i) => n + Number(c) * (6 - i), 0) % 11);
  return String(remainder % 10);
};
export function parsePropertyRows(matrix, { nationalPins = true } = {}) {
  assert.equal(matrix.length, 1794, "complete26table sections");
  assert.ok(
    matrix.every((r) => r.length === 16),
    "16columns",
  );
  const sections = new Map();
  for (let section = 1; section <= 26; section++) {
    const header = matrix[(section - 1) * 69];
    assert.deepEqual(
      header,
      section <= 16 ? HEADERS : [...HEADERS.slice(0, 13), "", "", ""],
      "column identity",
    );
    const code = String(section).padStart(2, "0");
    const rows = new Map();
    for (const row of matrix.slice((section - 1) * 69 + 1, section * 69)) {
      assert.equal(row[0], "2024", "fiscal year");
      assert.equal(row[1], "32", "survey business");
      assert.equal(row[6], "10", "table");
      assert.equal(row[7], "10表");
      assert.equal(row[8], code, "category identity");
      assert.equal(row[9], LABELS[code], "category label");
      assert.ok(!rows.has(row[2]), "duplicate reporting body");
      if (row[2] === "合計(全国)") {
        assert.deepEqual(row.slice(3, 6), ["", "", ""]);
      } else {
        assert.match(row[2], /^\d{6}$/, "reporting body code");
        assert.equal(
          row[2][5],
          checksum(row[2].slice(0, 5)),
          "reporting body checksum",
        );
        const p = prefs.find((p) => p.prefCode === row[2].slice(0, 5));
        if (p)
          assert.deepEqual(
            row.slice(3, 6),
            [p.prefName, p.prefName, ""],
            "prefecture identity",
          );
        else {
          const city = CITY_PINS.find((c) => c.code === row[2]);
          assert.ok(city, "unrecognized city body");
          assert.deepEqual(row.slice(3, 6), [city.prefName, city.name, "1"]);
        }
      }
      const values = row
        .slice(10, section <= 16 ? 16 : 13)
        .map((x, i) => integer(x, { signed: i % 3 === 1 }));
      if (section > 16)
        assert.deepEqual(
          row.slice(13),
          ["", "", ""],
          "fund has no building measures",
        );
      if (row[5] === "1")
        assert.ok(
          values.every((v) => v === 0),
          "excluded city cells must remain original zero placeholders",
        );
      for (let j = 0; j < values.length; j += 3)
        assert.equal(
          values[j] + values[j + 1],
          values[j + 2],
          "opening plus change equals closing",
        );
      rows.set(row[2], { row: [...row], values });
    }
    assert.equal(rows.size, 68, "47pref+20city+national");
    for (const p of prefs)
      assert.ok(
        rows.has(p.prefCode + checksum(p.prefCode)),
        "missing prefecture",
      );
    for (const city of CITY_PINS)
      assert.ok(rows.has(city.code), "missing city placeholder");
    assert.ok(rows.has("合計(全国)"), "national missing");
    sections.set(code, rows);
  }
  const nationalChecks = [];
  for (const [section, rs] of sections) {
    const national = rs.get("合計(全国)").values;
    for (let c = 0; c < national.length; c++) {
      const observed = sum(
        prefs.map((p) => rs.get(p.prefCode + checksum(p.prefCode)).values[c]),
      );
      assert.equal(
        observed,
        national[c],
        "prefecture sum equals official national",
      );
      nationalChecks.push({
        section,
        column: c + 1,
        observed,
        official: national[c],
      });
    }
  }
  let subtotalChecks = 0;
  for (const [target, children] of [
    [
      "11",
      Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, "0")),
    ],
    ["16", ["12", "13", "14", "15"]],
    ["21", ["17", "18", "19", "20"]],
    ["26", ["22", "23", "24", "25"]],
  ]) {
    for (const [body, record] of sections.get(target))
      for (let c = 0; c < record.values.length; c++) {
        assert.equal(
          sum(children.map((code) => sections.get(code).get(body).values[c])),
          record.values[c],
          "exclusive property subtotal",
        );
        subtotalChecks++;
      }
  }
  const recordFor = (code, name) => {
    const administrative = sections.get("11").get(code).values;
    const ordinary = sections.get("16").get(code).values;
    return {
      areaCode: code === "合計(全国)" ? "00000" : code.slice(0, 5),
      areaName: name,
      administrative: administrative[5],
      ordinary: ordinary[5],
      total: administrative[5] + ordinary[5],
      previousTotal: administrative[3] + ordinary[3],
      change: administrative[4] + ordinary[4],
    };
  };
  const rows = prefs.map((p) =>
    recordFor(p.prefCode + checksum(p.prefCode), p.prefName),
  );
  const national = recordFor("合計(全国)", "全国");
  assert.equal(sum(rows.map((r) => r.total)), national.total);
  if (nationalPins) {
    assert.equal(national.administrative, 166907556);
    assert.equal(national.ordinary, 8935926);
    assert.equal(national.total, 175843482);
  }
  return {
    rows,
    national,
    checks: {
      sectionCount: 26,
      reportingBodies: 68,
      prefectures: 47,
      excludedCityPlaceholders: 20,
      missingSelectedValues: 0,
      nationalColumnChecks: nationalChecks.length,
      subtotalChecks,
      stockFlowChecks: 1768 * 2 - 680,
      nationalChecks,
    },
  };
}
export function verifyMatrices(csvRows, xlsxRows) {
  assert.deepEqual(xlsxRows, csvRows, "CSV and XLSX original cells");
  return {
    rows: csvRows.length,
    columns: 16,
    cellComparisons: csvRows.length * 16,
  };
}
export function validateSourceBytes(source, body) {
  assert.equal(body.length, source.bytes, "source length");
  assert.equal(sha(body), source.sha256, "source SHA");
}
export function validateConfig(config) {
  assert.ok(config);
  assert.equal(config.key, FIELD.key);
  assert.equal(config.unit, FIELD.unit);
  assert.deepEqual(config.years, { from: 2024, to: 2024 });
  assert.equal(config.yearFormat, "fiscal");
  assert.deepEqual(config.entities, ["prefecture"]);
  assert.equal(config.isActive, true);
  assert.deepEqual(config.display, { conversionFactor: 1, decimalPlaces: 0 });
  assert.equal(config.calculation?.isCalculated ?? false, false);
  assert.deepEqual(config.calculation?.normalizationOptions ?? [], []);
  assert.deepEqual(
    config.source,
    EXPECTED_SOURCE,
    "source/cohort/provenance immutable",
  );
}
async function sourceBody(source, directory) {
  const localPath = resolve(directory, source.filename);
  let body,
    fetchedAt = null;
  try {
    body = await readFile(localPath);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
    const response = await fetch(source.url, {
      signal: AbortSignal.timeout(45000),
    });
    assert.ok(response.ok, "source HTTP " + response.status);
    body = Buffer.from(await response.arrayBuffer());
    validateSourceBytes(source, body);
    fetchedAt = new Date().toISOString();
    await mkdir(dirname(localPath), { recursive: true });
    await writeFile(localPath, body);
    await writeFile(
      localPath + ".source.json",
      JSON.stringify({ ...source, fetchedAt }, null, 2) + "\n",
    );
  }
  validateSourceBytes(source, body);
  if (!fetchedAt)
    try {
      const receipt = JSON.parse(
        await readFile(localPath + ".source.json", "utf8"),
      );
      if (receipt.sha256 === source.sha256 && receipt.url === source.url)
        fetchedAt = receipt.fetchedAt ?? null;
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
  return {
    body,
    observed: {
      ...source,
      localPath,
      fetchedAt,
      verifiedAt: new Date().toISOString(),
    },
  };
}
export function verifyDefinition(text) {
  const t = text.normalize("NFKC").replace(/\s/g, "");
  for (const phrase of [
    "令和6年度都道府県公共施設状況調査作成要領",
    "全都道府県",
    "原則として、普通会計",
    "公有財産(調査表10表)",
    "令和(n+1)年3月31日現在",
    "道路、橋りょう、河川、海岸、港湾、漁港については含めないこと",
    "前年度数値は訂正せずに増減欄で修正すること",
  ])
    assert.ok(t.includes(phrase), "definition missing: " + phrase);
  return {
    year: 2024,
    stockDate: "2025-03-31",
    account: "ordinary-account-principle",
    excluded: "roads/bridges/rivers/coasts/ports/fishing-ports",
    changeIncludesPriorYearCorrections: true,
  };
}
async function main() {
  const { values: o } = parseArgs({
    options: {
      "write-local": { type: "boolean", default: false },
      "source-dir": {
        type: "string",
        default: resolve(
          root,
          ".local/verification/themes/prefectural-buildings-source",
        ),
      },
      "config-file": { type: "string" },
      "local-r2-root": { type: "string", default: resolve(root, ".local/r2") },
      out: {
        type: "string",
        default: resolve(
          root,
          ".local/verification/themes/prefectural-buildings-source.json",
        ),
      },
    },
  });
  const configs = o["config-file"]
    ? JSON.parse(await readFile(o["config-file"], "utf8"))
    : Object.values(
        requireRepo("./packages/data-configs/src/registry.ts").METRICS_REGISTRY,
      );
  const matches = configs.filter((c) => c.key === FIELD.key);
  assert.equal(matches.length, 1);
  const config = matches[0];
  validateConfig(config);
  const bodies = {},
    sources = [];
  for (const s of SOURCES) {
    const got = await sourceBody(s, o["source-dir"]);
    bodies[s.filename] = got.body;
    sources.push(got.observed);
  }
  const matrix = parseCsv(
    new TextDecoder("shift_jis", { fatal: true }).decode(
      bodies["facilities-property-2025.csv"],
    ),
    { bom: false, skip_empty_lines: false },
  );
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bodies["facilities-property-2025.xlsx"]);
  assert.equal(workbook.worksheets.length, 1);
  const sheet = workbook.worksheets[0];
  assert.equal(sheet.name, "A0010202432100100");
  assert.equal(sheet.rowCount, 1794);
  assert.equal(sheet.columnCount, 16);
  const xlsxRows = Array.from({ length: sheet.rowCount }, (_, i) =>
    Array.from({ length: 16 }, (_, j) => {
      const cell = sheet.getCell(i + 1, j + 1);
      assert.notEqual(
        cell.type,
        ExcelJS.ValueType.Formula,
        "no formula source cells",
      );
      return cell.value === null ? "" : String(cell.value);
    }),
  );
  const formatProof = verifyMatrices(matrix, xlsxRows);
  const result = parsePropertyRows(matrix);
  const definitionText = execFileSync("pdftotext", ["-layout", "-", "-"], {
    input: bodies["facilities-definitions-2025.pdf"],
    encoding: "utf8",
  });
  const definitions = verifyDefinition(definitionText);
  const { buildRecipe } = requireRepo("./packages/data-configs/src/recipe.ts");
  const { parseStatsValuesPayload } = requireRepo(
    "./packages/stats-r2/src/schemas.ts",
  );
  const recipe = buildRecipe(config);
  assert.ok(recipe);
  const payload = parseStatsValuesPayload({
    metricKey: FIELD.key,
    entityKind: "prefecture",
    rows: result.rows.map((r) => ({
      areaCode: r.areaCode,
      areaName: r.areaName,
      yearCode: String(FIELD.year),
      yearName: FIELD.yearName,
      value: r.total,
      unit: FIELD.unit,
    })),
    meta: {
      generatedAt: new Date().toISOString(),
      rowCount: 47,
      areaCount: 47,
      yearRange: [String(FIELD.year), String(FIELD.year)],
      recipe,
    },
  });
  const body = Buffer.from(JSON.stringify(payload) + "\n");
  const key = "app/stats/" + FIELD.key + "/values.json";
  const report = {
    status: o["write-local"]
      ? "source-verified-staged"
      : "source-verified-dry-run",
    generatedAt: new Date().toISOString(),
    candidateId: 92,
    sources,
    formatProof,
    definitions,
    result,
    files: [
      {
        key,
        metricKey: FIELD.key,
        rowCount: 47,
        sha256: sha(body),
        bytes: body.length,
      },
    ],
    remaining: ["Root adoption and browser/release gates."],
  };
  if (o["write-local"]) {
    const output = resolve(o["local-r2-root"], key);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, body);
  }
  await mkdir(dirname(o.out), { recursive: true });
  await writeFile(o.out, JSON.stringify(report, null, 2) + "\n");
  console.log(
    JSON.stringify({
      status: report.status,
      metricKey: FIELD.key,
      rowCount: 47,
      national: result.national.total,
      out: o.out,
    }),
  );
}
if (
  process.argv[1] &&
  (await realpath(process.argv[1])) ===
    (await realpath(fileURLToPath(import.meta.url)))
)
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
