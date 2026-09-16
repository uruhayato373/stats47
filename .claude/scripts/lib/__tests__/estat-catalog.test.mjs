import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyTimeKind,
  classRows,
  normalizeCollectArea,
  normalizeTableRow,
  PREFECTURE_CODES,
  summarizeMeta,
} from "../estat-catalog/normalize.mjs";
import {
  buildPlan,
  computeSurveysSummary,
  MAX_ATTEMPTS,
  markRemoved,
  recordFetchFailure,
  recordFetchSuccess,
  upsertTableRow,
} from "../estat-catalog/index.mjs";

function classObj(id, name, items) {
  return { "@id": id, "@name": name, CLASS: items };
}

function metaResponse({ classObjs, tableOverrides = {} } = {}) {
  return {
    GET_META_INFO: {
      RESULT: { STATUS: 0 },
      METADATA_INF: {
        TABLE_INF: {
          "@id": "0000010101",
          STAT_NAME: { $: "社会・人口統計体系", "@code": "00200502" },
          GOV_ORG: { $: "総務省" },
          TITLE: { $: "Ａ　人口・世帯" },
          CYCLE: "年次",
          UPDATED_DATE: "2024-03-29",
          COLLECT_AREA: "2",
          MAIN_CATEGORY: { "@no": "02", $: "人口・世帯" },
          ...tableOverrides,
        },
        CLASS_INF: { CLASS_OBJ: classObjs },
      },
    },
  };
}

const prefClassItems = PREFECTURE_CODES.map((code, i) => ({
  "@code": code,
  "@name": `pref-${i}`,
}));

test("normalizeTableRow: getStatsList/getMetaInfo 共通の TABLE_INF を正規化する", () => {
  const raw = {
    "@id": "0000010101",
    STAT_NAME: { $: "社会・人口統計体系", "@code": "00200502" },
    GOV_ORG: { $: "総務省" },
    TITLE: { $: "Ａ　人口・世帯" },
    CYCLE: "年次",
    SURVEY_DATE: "0",
    OPEN_DATE: "2024-03-29",
    UPDATED_DATE: "2024-03-29",
    COLLECT_AREA: "2",
    MAIN_CATEGORY: { "@no": "02", $: "人口・世帯" },
  };
  const row = normalizeTableRow(raw);
  assert.equal(row.statsDataId, "0000010101");
  assert.equal(row.statCode, "00200502");
  assert.equal(row.statName, "社会・人口統計体系");
  assert.equal(row.title, "Ａ　人口・世帯");
  assert.equal(row.govOrg, "総務省");
  assert.equal(row.collectArea, "2");
  assert.deepEqual(row.mainCategory, { code: "02", name: "人口・世帯" });
  assert.equal(row.subCategory, null);
});

test("normalizeCollectArea: e-Stat実測の日本語ラベルを数字コードへ正規化する (2026-09-16回帰)", () => {
  // 実測: getStatsList の COLLECT_AREA は型定義の "1"/"2"/"3" ではなく日本語ラベルを返す
  // (初回run で全23,180件のcollectAreaが空扱いになりtoFetchMeta=0になった実障害)
  assert.equal(normalizeCollectArea("全国"), "1");
  assert.equal(normalizeCollectArea("都道府県"), "2");
  assert.equal(normalizeCollectArea("市区町村"), "3");
  assert.equal(normalizeCollectArea("2"), "2");
  assert.equal(normalizeCollectArea("該当なし"), null); // getMetaInfo で観測される値
  assert.equal(normalizeCollectArea(null), null);
});

test("normalizeTableRow: 日本語ラベルのCOLLECT_AREAでも正しい数字コードになる", () => {
  const raw = { "@id": "0000010101", COLLECT_AREA: "都道府県" };
  assert.equal(normalizeTableRow(raw, "9").collectArea, "2"); // ラベルが読めればfallbackより優先
  const rawUnknown = { "@id": "0000010101", COLLECT_AREA: "該当なし" };
  assert.equal(normalizeTableRow(rawUnknown, "2").collectArea, "2"); // 読めなければfallbackへ
});

test("classifyTimeKind: 名称の末尾から年次/年度/月次を判定する", () => {
  assert.equal(classifyTimeKind("2023年"), "calendar-year");
  assert.equal(classifyTimeKind("2023年度"), "fiscal-year");
  assert.equal(classifyTimeKind("2023年4月"), "month");
  assert.equal(classifyTimeKind("不明"), "other");
  assert.equal(classifyTimeKind(null), "other");
});

test("summarizeMeta: time 軸から year を4桁化し timeKind を多数決で決める", () => {
  const response = metaResponse({
    classObjs: [
      classObj("tab", "観測値", [{ "@code": "00001", "@name": "観測値" }]),
      classObj("area", "地域", [
        { "@code": "00000", "@name": "全国" },
        ...prefClassItems,
      ]),
      classObj("time", "時間軸", [
        { "@code": "2023000000", "@name": "2023年" },
        { "@code": "2022000000", "@name": "2022年" },
      ]),
    ],
  });
  const summary = summarizeMeta(response);
  assert.deepEqual(summary.years, ["2022", "2023"]);
  assert.equal(summary.timeKind, "calendar-year");
  assert.equal(summary.tableRow.statsDataId, "0000010101");
  assert.equal(summary.sourceUpdatedDate, "2024-03-29");
});

test("summarizeMeta: area 軸が47都道府県ならprefecture、areaCountも47件で記録する", () => {
  const response = metaResponse({
    classObjs: [
      classObj("area", "地域", [{ "@code": "00000", "@name": "全国" }, ...prefClassItems]),
      classObj("time", "時間軸", [{ "@code": "2023000000", "@name": "2023年" }]),
    ],
  });
  const summary = summarizeMeta(response);
  assert.equal(summary.areaKind, "prefecture");
  assert.equal(summary.has47Pref, true);
  assert.equal(summary.prefDim, "area");
  assert.equal(summary.areaCount, 48); // 全国(00000) + 47県 = 軸の実カード数
});

test("summarizeMeta: 都道府県が area でなく catNN に入っていても検出する", () => {
  const response = metaResponse({
    classObjs: [
      classObj("cat01", "都道府県別内訳", prefClassItems),
      classObj("time", "時間軸", [{ "@code": "2023000000", "@name": "2023年" }]),
    ],
  });
  const summary = summarizeMeta(response);
  assert.equal(summary.prefDim, "cat01");
  assert.equal(summary.has47Pref, true);
  assert.equal(summary.areaKind, "prefecture");
});

test("summarizeMeta: 都道府県が全く無い area (全国のみ) は national と判定する", () => {
  const response = metaResponse({
    classObjs: [
      classObj("area", "地域", [{ "@code": "00000", "@name": "全国" }]),
      classObj("time", "時間軸", [{ "@code": "2023000000", "@name": "2023年" }]),
    ],
  });
  const summary = summarizeMeta(response);
  assert.equal(summary.areaKind, "national");
  assert.equal(summary.has47Pref, false);
});

test("summarizeMeta: 市区町村コードのarea は municipality と判定する", () => {
  const response = metaResponse({
    classObjs: [
      classObj("area", "地域", [
        { "@code": "01100", "@name": "札幌市" },
        { "@code": "01101", "@name": "札幌市中央区" },
      ]),
      classObj("time", "時間軸", [{ "@code": "2023000000", "@name": "2023年" }]),
    ],
  });
  const summary = summarizeMeta(response);
  assert.equal(summary.areaKind, "municipality");
  assert.equal(summary.has47Pref, false);
});

test("classRows: tab/catNN のみ抽出し area/time を除外する", () => {
  const response = metaResponse({
    classObjs: [
      classObj("tab", "観測値", [{ "@code": "00001", "@name": "観測値" }]),
      classObj("cat01", "項目", [
        { "@code": "A1101", "@name": "総人口", "@level": "1" },
      ]),
      classObj("area", "地域", [{ "@code": "00000", "@name": "全国" }]),
      classObj("time", "時間軸", [{ "@code": "2023000000", "@name": "2023年" }]),
    ],
  });
  const rows = classRows(response, "0000010101");
  assert.deepEqual(
    rows.map((r) => r.dim),
    ["tab", "cat01"],
  );
  assert.equal(rows[1].code, "A1101");
  assert.equal(rows[1].name, "総人口");
});

// --- index.mjs ---

function row(id, overrides = {}) {
  return { statsDataId: id, statCode: "00200502", statName: "s", title: "t", govOrg: "g", collectArea: "2", updatedDate: "2024-01-01", ...overrides };
}

test("buildPlan: 新規表は toFetchMeta に入り、L1から消えた表は removedIds に入る", () => {
  const fresh = new Map([
    ["A", row("A")],
    ["B", row("B")],
  ]);
  const plan = buildPlan({
    existingTables: [row("B", { meta: { sourceUpdatedDate: "2024-01-01" } }), row("C", { meta: { sourceUpdatedDate: "2024-01-01" } })],
    freshRows: fresh,
    manifest: {},
    metaScope: [2, 3],
  });
  assert.deepEqual(plan.newRows.map((r) => r.statsDataId), ["A"]);
  assert.deepEqual(plan.updatedRows, []);
  assert.deepEqual(plan.removedIds, ["C"]);
  assert.deepEqual(plan.toFetchMeta.map((r) => r.statsDataId), ["A"]);
});

test("buildPlan: updatedDate が meta.sourceUpdatedDate より新しければ再取得対象になる", () => {
  const fresh = new Map([["A", row("A", { updatedDate: "2024-06-01" })]]);
  const plan = buildPlan({
    existingTables: [row("A", { updatedDate: "2024-01-01", meta: { sourceUpdatedDate: "2024-01-01" } })],
    freshRows: fresh,
    manifest: {},
    metaScope: [2, 3],
  });
  assert.deepEqual(plan.updatedRows.map((r) => r.statsDataId), ["A"]);
  assert.deepEqual(plan.toFetchMeta.map((r) => r.statsDataId), ["A"]);
});

test("buildPlan: meta 未取得の既存表 (meta:null) は updated 扱いで再取得される", () => {
  const fresh = new Map([["A", row("A", { updatedDate: "2024-01-01" })]]);
  const plan = buildPlan({
    existingTables: [row("A", { updatedDate: "2024-01-01", meta: null })],
    freshRows: fresh,
    manifest: {},
    metaScope: [2, 3],
  });
  assert.deepEqual(plan.updatedRows.map((r) => r.statsDataId), ["A"]);
});

test("buildPlan: collectArea が metaScope 外なら toFetchMeta から除外する", () => {
  const fresh = new Map([["A", row("A", { collectArea: "1" })]]);
  const plan = buildPlan({ existingTables: [], freshRows: fresh, manifest: {}, metaScope: [2, 3] });
  assert.deepEqual(plan.newRows.map((r) => r.statsDataId), ["A"]);
  assert.deepEqual(plan.toFetchMeta, []);
});

test("buildPlan: maxMeta で優先度順 (new→updated→retry) に打ち切る", () => {
  const fresh = new Map([
    ["A", row("A", { updatedDate: "2024-06-01" })],
    ["B", row("B")],
  ]);
  const manifest = { failed: [{ id: "Z", attempts: 1 }] };
  const plan = buildPlan({
    existingTables: [
      row("A", { updatedDate: "2024-01-01", meta: { sourceUpdatedDate: "2024-01-01" } }),
      row("Z", { meta: { sourceUpdatedDate: "2024-01-01" } }), // unchanged だが前回 fetch 失敗 → retry 候補
    ],
    freshRows: new Map([...fresh, ["Z", row("Z")]]),
    manifest,
    metaScope: [2, 3],
    maxMeta: 2,
  });
  // B は新規、A は更新、Z は retry。優先度は new → updated → retry
  assert.deepEqual(plan.toFetchMeta.map((r) => r.statsDataId), ["B", "A"]);
});

test("buildPlan: quarantine 済みや attempts上限は retry 対象から外れる", () => {
  const fresh = new Map([["Z", row("Z")]]);
  const plan1 = buildPlan({
    existingTables: [row("Z", { meta: { sourceUpdatedDate: "2024-01-01" } })],
    freshRows: fresh,
    manifest: { failed: [{ id: "Z", attempts: MAX_ATTEMPTS }] },
    metaScope: [2, 3],
  });
  assert.deepEqual(plan1.toFetchMeta, []);

  const plan2 = buildPlan({
    existingTables: [row("Z", { meta: { sourceUpdatedDate: "2024-01-01" } })],
    freshRows: fresh,
    manifest: { quarantined: [{ id: "Z" }], failed: [] },
    metaScope: [2, 3],
  });
  assert.deepEqual(plan2.toFetchMeta, []);
});

test("upsertTableRow: 成功時は新しい meta、未実施/失敗時は既存 meta を保持する", () => {
  const fresh = row("A", { updatedDate: "2024-06-01" });
  const existing = row("A", { updatedDate: "2024-01-01", meta: { sourceUpdatedDate: "2024-01-01" } });

  const success = upsertTableRow(existing, fresh, { ok: true, meta: { sourceUpdatedDate: "2024-06-01" } });
  assert.equal(success.meta.sourceUpdatedDate, "2024-06-01");
  assert.equal(success.removedAt, null);

  const untouched = upsertTableRow(existing, fresh, null);
  assert.equal(untouched.meta.sourceUpdatedDate, "2024-01-01");

  const noExisting = upsertTableRow(undefined, fresh, null);
  assert.equal(noExisting.meta, null);
});

test("markRemoved: 既存行に removedAt を付け、meta は消さない", () => {
  const existing = row("A", { meta: { sourceUpdatedDate: "2024-01-01" } });
  const removed = markRemoved(existing, "2024-09-01T00:00:00.000Z");
  assert.equal(removed.removedAt, "2024-09-01T00:00:00.000Z");
  assert.equal(removed.meta.sourceUpdatedDate, "2024-01-01");
});

test("recordFetchFailure: MAX_ATTEMPTS 到達で quarantined へ移す", () => {
  let manifest = {};
  for (let i = 1; i < MAX_ATTEMPTS; i++) {
    manifest = recordFetchFailure(manifest, "A", "boom", "2024-01-01");
    assert.equal(manifest.failed.find((f) => f.id === "A").attempts, i);
    assert.deepEqual(manifest.quarantined ?? [], []);
  }
  manifest = recordFetchFailure(manifest, "A", "boom", "2024-01-01");
  assert.equal(manifest.failed.find((f) => f.id === "A"), undefined);
  assert.equal(manifest.quarantined.find((q) => q.id === "A").attempts, MAX_ATTEMPTS);
});

test("recordFetchSuccess: failed から該当 id を除去する", () => {
  const manifest = { failed: [{ id: "A", attempts: 2 }, { id: "B", attempts: 1 }] };
  const updated = recordFetchSuccess(manifest, "A");
  assert.deepEqual(updated.failed.map((f) => f.id), ["B"]);
});

test("computeSurveysSummary: statCode 単位に集計し removedAt は除外する", () => {
  const tables = [
    row("A", { collectArea: "2", meta: { sourceUpdatedDate: "x" } }),
    row("B", { collectArea: "3" }),
    row("C", { collectArea: "2", removedAt: "2024-09-01" }),
  ];
  const summary = computeSurveysSummary(tables);
  assert.equal(summary.length, 1);
  assert.equal(summary[0].statCode, "00200502");
  assert.deepEqual(summary[0].tablesByCollectArea, { "2": 1, "3": 1 });
  assert.equal(summary[0].metaFetched, 1);
});

// --- pulled.mjs: pull 済み索引の読み取り ---

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadPulled } from "../estat-catalog/pulled.mjs";

function makePullDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "estat-catalog-pull-"));
  fs.mkdirSync(path.join(dir, "index/tables"), { recursive: true });
  fs.writeFileSync(path.join(dir, "manifest.json"), "{}");
  fs.writeFileSync(
    path.join(dir, "index/surveys.json"),
    JSON.stringify([{ statCode: "00200521" }, { statCode: "00450011" }, { statCode: "99999999" }]),
  );
  fs.writeFileSync(
    path.join(dir, "index/tables/00200521.json"),
    JSON.stringify([
      { statsDataId: "A1", statCode: "00200521", statName: "国勢調査", title: "市区町村 表", govOrg: "総務省", collectArea: 3 },
      { statsDataId: "A2", statCode: "00200521", statName: "国勢調査", title: "都道府県 表", govOrg: "総務省", collectArea: 2 },
      { statsDataId: "A3", statCode: "00200521", statName: "国勢調査", title: "消えた表", govOrg: "総務省", collectArea: 3, removedAt: "2026-09-01T00:00:00Z" },
    ]),
  );
  fs.writeFileSync(
    path.join(dir, "index/tables/00450011.json"),
    JSON.stringify([{ statsDataId: "B1", statCode: "00450011", statName: "人口動態", title: "市区町村", govOrg: null, collectArea: "3" }]),
  );
  return dir;
}

test("loadPulled は surveys の statCode 順に tables を連結し、索引が無い statCode は読み飛ばす", () => {
  const dir = makePullDir();
  const { surveys, tables } = loadPulled(dir);
  assert.equal(surveys.length, 3);
  assert.deepEqual(tables.map((t) => t.statsDataId), ["A1", "A2", "A3", "B1"]);
});

test("loadPulled は manifest が無ければ pull を促して throw する", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "estat-catalog-empty-"));
  assert.throws(() => loadPulled(dir), /catalog\.mjs pull/);
});
