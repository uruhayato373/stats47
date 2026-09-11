import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import {
  HEADERS,
  LABELS,
  CITY_PINS,
  SOURCES,
  FIELD,
  EXPECTED_SOURCE,
  parsePropertyRows,
  verifyMatrices,
  validateSourceBytes,
  validateConfig,
  integer,
} from "./ingest-prefectural-buildings.mjs";
const requireRepo = createRequire(resolve(process.cwd(), "package.json"));
const prefs = requireRepo("./packages/area/src/data/prefectures.json");
const check = (code) =>
  String(
    (11 - ([...code].reduce((n, c, i) => n + Number(c) * (6 - i), 0) % 11)) %
      10,
  );
function fixture() {
  const bodies = [
    ...prefs.map((p) => ({
      code: p.prefCode + check(p.prefCode),
      name: p.prefName,
      prefName: p.prefName,
      kind: "",
    })),
    ...CITY_PINS.map((c) => ({ ...c, kind: "1" })),
    { code: "合計(全国)", prefName: "", name: "", kind: "" },
  ];
  return Array.from({ length: 26 }, (_, i) => {
    const section = i + 1,
      code = String(section).padStart(2, "0");
    return [
      section <= 16 ? HEADERS : [...HEADERS.slice(0, 13), "", "", ""],
      ...bodies.map((b) => {
        const factor = b.kind === "1" ? 0 : b.code === "合計(全国)" ? 47 : 1;
        const admin = section === 1 || section === 11;
        const ordinary = section === 12 || section === 16;
        const values = admin
          ? [10, 2, 12, 100, -2, 98]
          : ordinary
            ? [20, 3, 23, 40, 2, 42]
            : [0, 0, 0, 0, 0, 0];
        const cells = values.map((x) => String(x * factor));
        if (section > 16) cells.splice(3, 3, "", "", "");
        return [
          "2024",
          "32",
          b.code,
          b.prefName,
          b.name,
          b.kind,
          "10",
          "10表",
          code,
          LABELS[code],
          ...cells,
        ];
      }),
    ];
  }).flat();
}
const config = () => ({
  key: FIELD.key,
  unit: FIELD.unit,
  years: { from: 2024, to: 2024 },
  yearFormat: "fiscal",
  entities: ["prefecture"],
  isActive: true,
  display: { conversionFactor: 1, decimalPlaces: 0 },
  source: structuredClone(EXPECTED_SOURCE),
});
test("building stock includes administrative and ordinary property once", () => {
  const r = parsePropertyRows(fixture(), { nationalPins: false });
  assert.equal(r.rows.length, 47);
  assert.equal(r.rows[0].total, 140);
  assert.equal(r.national.total, 6580);
  assert.equal(r.national.change, 0);
  assert.equal(r.checks.excludedCityPlaceholders, 20);
});
test("actual nationwide pins cannot be bypassed by balanced arbitrary source", () =>
  assert.throws(() => parsePropertyRows(fixture())));
test("year changes can be negative but closing stock cannot", () => {
  assert.equal(integer("-2", { signed: true }), -2);
  assert.throws(() => integer("-2"));
});
for (const value of ["", null, "-", "X", "...", "12.5", "NaN"])
  test("reject missing or suppressed stock " + String(value), () =>
    assert.throws(() => integer(value)),
  );
const mutateCases = [
  ["missing prefecture", (m) => m.splice(1, 1)],
  ["duplicate reporting body", (m) => (m[2][2] = m[1][2])],
  ["year interpretation", (m) => (m[1][0] = "2025")],
  ["wrong measurement column", (m) => (m[0][15] = "006:土地")],
  ["wrong category", (m) => (m[1][9] = "普通財産")],
  [
    "city wrongly added",
    (m) => {
      m[48][13] = "1";
      m[48][15] = "1";
    },
  ],
  ["wrong county identity", (m) => (m[1][3] = "青森県")],
  ["closing stock inconsistent", (m) => (m[1][15] = "99")],
  [
    "subtotal mismatch",
    (m) => {
      m[1][13] = "101";
      m[1][15] = "99";
    },
  ],
  [
    "national mismatch",
    (m) => {
      m[68][13] = "4701";
      m[68][15] = "4607";
    },
  ],
  ["fund misclassified as building", (m) => (m[1105][15] = "0")],
];
for (const [label, edit] of mutateCases)
  test("reject " + label, () => {
    const m = structuredClone(fixture());
    edit(m);
    assert.throws(() => parsePropertyRows(m, { nationalPins: false }));
  });
test("CSV XLSX comparison covers every original cell", () => {
  const a = fixture(),
    b = structuredClone(a);
  assert.equal(verifyMatrices(a, b).cellComparisons, 28704);
  b[1][15] = "99";
  assert.throws(() => verifyMatrices(a, b));
});
test("source change fails closed", () =>
  assert.throws(() =>
    validateSourceBytes(SOURCES[0], Buffer.from("replacement")),
  ));
test("valid immutable metric config", () => validateConfig(config()));
for (const [label, edit] of [
  ["calendar year", (c) => (c.yearFormat = "calendar")],
  ["wrong unit", (c) => (c.unit = "千㎡")],
  [
    "denominator added",
    (c) =>
      (c.calculation = { normalizationOptions: [{ type: "per_population" }] }),
  ],
  [
    "source scope",
    (c) => (c.source.config.provenance.accountScope = "all-owners"),
  ],
  [
    "source pin",
    (c) => (c.source.config.provenance.sourceSha256 = "0".repeat(64)),
  ],
])
  test("reject config " + label, () => {
    const c = config();
    edit(c);
    assert.throws(() => validateConfig(c));
  });
