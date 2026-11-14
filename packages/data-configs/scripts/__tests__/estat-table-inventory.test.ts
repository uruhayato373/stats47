import assert from "node:assert/strict";
import { test } from "node:test";
import { gzipSync } from "node:zlib";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createEstatIngestClient } from "../../../estat-api/src/ingest.js";
import { parseSnapshotArgs, writeTableSnapshot, readSnapshotForPush, markSnapshotPushed, registerLocalSnapshot, type TableMetadata } from "../estat-table-snapshot.js";

import { collectReferences, countSlices, makeSliceKey, measureSample, readAxes, planTablePartitions, type Axis } from "../estat-table-inventory.js";

const axis = (id: string, codes: string[]): Axis => ({ id, codes, name: id });

test("CLASS singleton/arrayを読み、コードの先頭ゼロとCLASS_OBJ順を保つ", () => {
  assert.deepEqual(readAxes([
    { "@id": "cat01", "@name": "分類", CLASS: [{ "@code": "001" }, { "@code": "001" }, { "@code": "002" }] },
    { "@id": "tab", CLASS: { "@code": "01" } },
  ]), [axis("cat01", ["001", "002"]), { id: "tab", codes: ["01"], name: null }].map((a) =>
    a.id === "cat01" ? { ...a, name: "分類" } : a));
});

test("空・未知・重複軸や文字列でないコードを正常な0件として扱わない", () => {
  for (const input of [[], { "@id": "cat01", CLASS: [] }, { "@id": "other", CLASS: { "@code": "1" } },
    { "@id": "tab", CLASS: { "@code": 1 } }, [{ "@id": "tab", CLASS: { "@code": "1" } }, { "@id": "tab", CLASS: { "@code": "2" } }]]) {
    assert.throws(() => readAxes(input));
  }
});

test("切片はtabと全cat軸の直積で、全地域・時間は切片内の行数になる", () => {
  const axes = [axis("tab", ["01", "02"]), axis("cat01", ["0", "1", "2"]),
    axis("cat06", ["A", "B"]), axis("area", ["00000", "01000", "01100"]),
    axis("time", ["2020000000", "2020010000", "2021000000", "2021010000"])];
  const counts = countSlices(axes);
  assert.equal(counts.sliceCount, 12);
  assert.equal(counts.regionCount, 3);
  assert.equal(counts.timeCount, 4); // not two normalized years
  assert.equal(counts.rowCountEstimate, 144);
  assert.deepEqual(counts.sliceAxes, ["tab", "cat01", "cat06"]);
});

test("県がcat02に入るときは全国も含めその軸を地域扱いにする", () => {
  const axes = [axis("tab", ["1", "2"]), axis("cat01", ["a", "b", "c"]),
    axis("cat02", ["00000", "01000", "02000"]), axis("time", ["2020000000", "2021000000"])];
  const counts = countSlices(axes, "cat02");
  assert.equal(counts.sliceCount, 6);
  assert.equal(counts.regionCount, 3);
  assert.equal(counts.rowCountEstimate, 36);
  assert.deepEqual(counts.regionAxes, ["cat02"]);
  assert.equal(makeSliceKey("0000010101", axes, { tab: "1", cat01: "a" }, 2, "cat02"),
    "estat-tables/0000010101/data/tab=1/cat01=a.json.gz");
});

test("areaを県軸として指定しても地域数を二重に掛けない", () => {
  const axes = [axis("tab", ["1"]), axis("area", ["01000", "02000"]), axis("time", ["t1", "t2"])];
  assert.equal(countSlices(axes, "area").rowCountEstimate, 4);
});

test("areaと別の県軸が共存する場合は両方の座標を保持する", () => {
  const axes = [axis("tab", ["1"]), axis("cat01", ["01000", "02000"]), axis("area", ["a", "b", "c"])];
  const counts = countSlices(axes, "cat01");
  assert.equal(counts.sliceCount, 1);
  assert.equal(counts.regionCount, 6);
  assert.equal(counts.rowCountEstimate, 6);
});

test("地域/時間軸が無いときは暗黙の1座標として明記する", () => {
  const counts = countSlices([axis("tab", ["1", "2"])]);
  assert.equal(counts.rowCountEstimate, 2);
  assert.equal(counts.implicitRegion, true);
  assert.equal(counts.implicitTime, true);
  assert.equal(countSlices([axis("area", ["01000", "02000"])]).sliceCount, 1);
  assert.equal(makeSliceKey("0000010101", [axis("area", ["01000"])], {}, 0), "estat-tables/0000010101/data/all.json.gz");
});

test("100,000行の境界と切片内ページングを区別する", () => {
  const regions = Array.from({ length: 1000 }, (_, i) => String(i));
  const times = Array.from({ length: 100 }, (_, i) => String(i));
  const axes = [axis("tab", ["1"]), axis("area", regions), axis("time", times)];
  assert.equal(countSlices(axes).fetchStrategy, "丸ごと");
  assert.equal(countSlices(axes).wholeTableRequestsEstimate, 1);
  const split = countSlices([axis("tab", ["1", "2"]), ...axes.slice(1)]);
  assert.equal(split.fetchStrategy, "軸で分ける");
  assert.equal(split.wholeTableRequestsEstimate, 2);
  assert.equal(split.requestsPerSliceEstimate, 1);
  const largeSlice = countSlices([axis("tab", ["1"]), axis("area", [...regions, "extra"]), axis("time", times)]);
  assert.equal(largeSlice.requestsPerSliceEstimate, 2);
});

test("切片キーは入力オブジェクトの順や辞書順でなく目録の順・生コードを使う", () => {
  const axes = [axis("cat02", ["#C04505"]), axis("area", ["01000"]), axis("tab", ["703-2021"]),
    axis("time", ["2021000000"]), axis("cat01", ["00001"])];
  assert.equal(makeSliceKey("0000010101", axes, { cat01: "00001", tab: "703-2021", cat02: "#C04505" }, 3),
    "estat-tables/0000010101/data/cat02=#C04505/tab=703-2021/cat01=00001.json.gz");
});

test("欠けたコード・余分な地域軸・未知コード・パスを壊すコードは拒否する", () => {
  const axes = [axis("tab", ["01"]), axis("cat01", ["a/b", "ok"]), axis("area", ["01000"])];
  const invalidCodes: Record<string, string>[] = [{ tab: "01" }, { tab: "01", cat01: "ok", area: "01000" },
    { tab: "1", cat01: "ok" }, { tab: "01", cat01: "a/b" }];
  for (const codes of invalidCodes) {
    assert.throws(() => makeSliceKey("0000010101", axes, codes, 2));
  }
  assert.throws(() => makeSliceKey("../bad", axes, { tab: "01", cat01: "ok" }, 2));
  assert.throws(() => countSlices(axes, "cat02"));
  assert.throws(() => countSlices(axes, "tab"));
});

test("有効な実行時定義から主・市・補完・sampleCount・外部由来の明示IDを拾う", () => {
  const metrics = [
    { key: "a", isActive: true, source: { kind: "estat", statsDataId: "0000010101", cdCat01: "A1101" },
      supplementalSources: [{ source: { statsDataId: "0000010102" } }], sampleCount: { statsDataId: "0000010103" } },
    { key: "b", source: { kind: "kakei-chousa", filter: { statsDataId: "0000010101" } }, citySource: { statsDataId: "0000010104" } },
    { key: "c", isActive: false, source: { statsDataId: "9999999999" } },
    { key: "d", source: { kind: "calculated", inputs: ["a", "b"] } },
    { key: "e", source: { kind: "external", config: { provenance: { apiParameters: { statsDataId: "0000010105" } } } } },
    { key: "f", source: { kind: "external", config: { url: "https://example.com" } } },
  ];
  const refs = collectReferences(metrics);
  assert.equal(refs.size, 5);
  assert.deepEqual(refs.get("0000010101")?.map((ref) => ref.metricKey), ["a", "b"]);
  assert.equal(refs.get("0000010103")?.[0].path, "sampleCount");
  assert.equal(refs.get("0000010105")?.[0].path, "source.config.provenance.apiParameters");
  assert.equal(refs.has("9999999999"), false);
});

test("サイズの分母はVALUE行数で、封筒を実gzipした比率を測る", () => {
  const fixture = { response: { GET_STATS_DATA: { STATISTICAL_DATA: {
    RESULT_INF: { TOTAL_NUMBER: 2 }, DATA_INF: { VALUE: [{ "@area": "01000", $: "3" }, { "@area": "02000", $: "4" }] },
  } } } };
  const raw = Buffer.from(JSON.stringify(fixture));
  const sample = measureSample(raw);
  assert.equal(sample.rowCount, 2);
  assert.equal(sample.rawBytesPerRow, raw.byteLength / 2);
  assert.equal(sample.gzipRatio, gzipSync(raw, { level: 6 }).byteLength / raw.byteLength);
  fixture.response.GET_STATS_DATA.STATISTICAL_DATA.RESULT_INF.TOTAL_NUMBER = 3;
  assert.throws(() => measureSample(Buffer.from(JSON.stringify(fixture))), /paginated/);
});


test("最小深さは0から選び、残りの軸と全地域・時間をファイル内に保持する", () => {
  const axes = [axis("tab", ["08", "12", "13"]), axis("cat01", ["M", "F"]),
    axis("area", Array.from({ length: 50 }, (_, i) => String(i))), axis("time", ["2020", "2021"])];
  assert.equal(planTablePartitions(axes, null, 600).depth, 0);
  assert.equal(planTablePartitions(axes, null, 599).depth, 1);
  assert.deepEqual(planTablePartitions(axes, null, 100), { depth: 2, partitionAxes: ["tab", "cat01"],
    rowLimit: 100, fileCount: 6, maxRowsPerFileEstimate: 100, fitsRowLimit: true });
  assert.equal(makeSliceKey("0000010101", axes, { tab: "13" }, 1), "estat-tables/0000010101/data/tab=13.json.gz");
  assert.throws(() => makeSliceKey("0000010101", axes, { tab: "13", cat01: "M" }, 1));
});

test("地域×時間が上限を超える表を無理に分割済みとしない", () => {
  const axes = [axis("tab", ["1", "2"]), axis("cat01", ["01000", "02000", "03000"]), axis("time", ["2020", "2021"])];
  const plan = planTablePartitions(axes, "cat01", 5);
  assert.equal(plan.depth, 1);
  assert.equal(plan.fileCount, 2);
  assert.equal(plan.maxRowsPerFileEstimate, 6);
  assert.equal(plan.fitsRowLimit, false);
  assert.throws(() => planTablePartitions(axes, null, 0));
  assert.throws(() => makeSliceKey("0000010101", axes, {}, 9));
});

const snapshotMeta = (): TableMetadata => ({ statsDataId: "0003445758", title: "賃金", statCode: "00450091",
  updatedDate: "2024-11-27", fetchedAt: "2026-11-14T00:00:00Z", sha256: "a".repeat(64), prefDim: "area", reportedRows: 2,
  axes: [axis("tab", ["08", "13"]), axis("area", ["01000"]), axis("time", ["2020"])] });
const snapshotPage = (tabs: string[], version = "2024-11-27", time = "2020") => ({ GET_STATS_DATA: {
  RESULT: { STATUS: 0 }, PARAMETER: { STATS_DATA_ID: "0003445758", LANG: "J", APP_ID: "test-secret" },
  STATISTICAL_DATA: { TABLE_INF: { "@id": "0003445758", UPDATED_DATE: version }, CLASS_INF: { CLASS_OBJ: [] },
    RESULT_INF: { TOTAL_NUMBER: tabs.length, FROM_NUMBER: 1, TO_NUMBER: tabs.length },
    DATA_INF: { VALUE: tabs.map((tab) => ({ "@tab": tab, "@area": "01000", "@time": time, "@unit": "十人", $: "123" })) } },
} });

test("d=0の封筒v2・全VALUE項目・gzipのSHA・manifestと再取得拒否を固定する", async () => {
  const dir = await mkdtemp(join(tmpdir(), "estat-snapshot-test-"));
  let calls = 0;
  const client = createEstatIngestClient({ appId: "test-secret", fetch: async () => {
    calls++; return new Response(JSON.stringify(snapshotPage(["08", "13"])));
  } });
  try {
    const manifest = await writeTableSnapshot(snapshotMeta(), dir, client);
    assert.equal(manifest.partition.depth, 0);
    assert.equal(manifest.fileCount, 1);
    assert.equal(manifest.rowCount, 2);
    assert.equal(manifest.catalogVersion, "2024-11-27");
    const file = manifest.files[0];
    assert.equal(file.key, "estat-tables/0003445758/data/all.json.gz");
    const compressed = await readFile(join(dir, file.key));
    assert.equal(file.sha256, createHash("sha256").update(compressed).digest("hex"));
    assert.equal(file.bytes, compressed.length);
    const raw = gunzipSync(compressed);
    assert.equal(file.uncompressedBytes, raw.length);
    assert(!raw.toString().includes("test-secret"));
    const envelope = JSON.parse(raw.toString());
    assert.equal(envelope.apiVersion, "3.0");
    assert.equal(envelope.params.statsDataId, "0003445758");
    assert.equal(envelope.params.limit, 100_000);
    assert.equal(envelope.response.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE[1]["@tab"], "13");
    assert.equal(envelope.response.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE[1]["@unit"], "十人");
    assert.deepEqual(JSON.parse(await readFile(join(dir, "estat-tables/0003445758/manifest.json"), "utf8")), manifest);
    await assert.rejects(writeTableSnapshot(snapshotMeta(), dir, client), /already exists/);
    assert.equal(calls, 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("深さ1ではtabだけを要求し、残りの軸を行に残した2ファイルを作る", async () => {
  const dir = await mkdtemp(join(tmpdir(), "estat-partition-test-"));
  const meta = snapshotMeta();
  meta.axes[2] = axis("time", Array.from({ length: 26_000 }, (_, i) => String(i)));
  const queries: URL[] = [];
  const client = createEstatIngestClient({ appId: "test-secret", fetch: async (url) => {
    const query = new URL(String(url)); queries.push(query);
    return new Response(JSON.stringify(snapshotPage([query.searchParams.get("cdTab")!], meta.updatedDate, "0")));
  } });
  try {
    const manifest = await writeTableSnapshot(meta, dir, client);
    assert.equal(manifest.partition.depth, 1);
    assert.equal(manifest.fileCount, 2);
    assert.deepEqual(manifest.files.map((file) => file.key), ["estat-tables/0003445758/data/tab=08.json.gz", "estat-tables/0003445758/data/tab=13.json.gz"]);
    assert(queries.every((query) => !query.searchParams.has("cdArea") && !query.searchParams.has("cdTime")));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("版不一致ではmanifestを出さず一時ファイルも片付ける", async () => {
  for (const body of [snapshotPage(["08", "13"], "2025-01-01")]) {
    const dir = await mkdtemp(join(tmpdir(), "estat-fail-test-"));
    try {
      const client = createEstatIngestClient({ appId: "test-secret", fetch: async () => new Response(JSON.stringify(body)) });
      await assert.rejects(writeTableSnapshot(snapshotMeta(), dir, client), /mismatch/);
      assert.deepEqual(await readdir(dir), []);
    } finally { await rm(dir, { recursive: true, force: true }); }
  }
});

test("カタログ記載行数の相違は警告として残し、完了済みAPI応答を失わない", async () => {
  const dir = await mkdtemp(join(tmpdir(), "estat-catalog-count-test-"));
  try {
    const client = createEstatIngestClient({ appId: "test-secret", fetch: async () => new Response(JSON.stringify(snapshotPage(["08", "13"]))) });
    const meta = snapshotMeta();
    meta.reportedRows = 1;
    const manifest = await writeTableSnapshot(meta, dir, client);
    assert.equal(manifest.rowCount, 2);
    assert.equal(manifest.catalogReportedRows, 1);
    assert.match(manifest.warnings[0], /2\/1/);
    assert.equal((await readdir(join(dir, "estat-tables/0003445758"))).includes("manifest.json"), true);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("複数--tableとdry-runを解釈し、不明な引数を拒否する", () => {
  assert.deepEqual(parseSnapshotArgs(["--table", "0003445758,0000010101", "--table", "0003445758", "--dry-run"]).tables, ["0003445758", "0000010101"]);
  assert.equal(parseSnapshotArgs(["--table", "0003445758", "--dry-run"]).dryRun, true);
  assert.throws(() => parseSnapshotArgs(["--table"]));
  assert.throws(() => parseSnapshotArgs(["--table", "../evil"]));
});


test("pushは既存のmanifestとSHAを検査し、台帳の一致した行だけをpushedにする", async () => {
  const dir = await mkdtemp(join(tmpdir(), "estat-push-local-test-"));
  try {
    const client = createEstatIngestClient({ appId: "test-secret", fetch: async () => new Response(JSON.stringify(snapshotPage(["08", "13"]))) });
    const m = await writeTableSnapshot(snapshotMeta(), dir, client);
    const local = await readSnapshotForPush(m.statsDataId, dir);
    assert.equal(local.objects.length, 2);
    assert.equal(local.objects[local.objects.length - 1].key, local.manifestKey);
    const { files, emptyPartitions, schemaVersion, partition, requestCount, catalogFetchedAt, ...fields } = m;
    const ledgerPath = join(dir, "ledger.json");
    const entry = { ...fields, depth: partition.depth, partitionAxes: partition.partitionAxes, rowLimit: partition.rowLimit,
      manifestKey: local.manifestKey, manifestSha256: createHash("sha256").update(local.manifestBytes).digest("hex"),
      status: "local-only", bucket: "stats47-private" };
    await writeFile(ledgerPath, JSON.stringify({ schemaVersion: 1, tables: [entry] }));
    await writeFile(ledgerPath, JSON.stringify({ schemaVersion: 1, tables: [] }));
    await registerLocalSnapshot(local.manifestBytes, ledgerPath);
    assert.deepEqual(JSON.parse(await readFile(ledgerPath, "utf8")).tables[0], entry);
    await markSnapshotPushed(local.manifestBytes, ledgerPath);
    assert.equal(JSON.parse(await readFile(ledgerPath, "utf8")).tables[0].status, "pushed");
    await registerLocalSnapshot(local.manifestBytes, ledgerPath);
    assert.equal(JSON.parse(await readFile(ledgerPath, "utf8")).tables[0].status, "pushed");
    await assert.rejects(registerLocalSnapshot(Buffer.from(local.manifestBytes.toString() + " "), ledgerPath), /refusing replacement/);
    const verified = JSON.parse(await readFile(ledgerPath, "utf8"));
    verified.tables[0].status = "verified";
    await writeFile(ledgerPath, JSON.stringify(verified));
    await markSnapshotPushed(local.manifestBytes, ledgerPath);
    assert.equal(JSON.parse(await readFile(ledgerPath, "utf8")).tables[0].status, "verified");
    await assert.rejects(markSnapshotPushed(Buffer.from(local.manifestBytes.toString() + " "), ledgerPath), /Ledger\/manifest mismatch/);
    await writeFile(join(dir, files[0].key), "tampered");
    await assert.rejects(readSnapshotForPush(m.statsDataId, dir), /Local SHA\/size mismatch/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("pushのdry-runと明示上書きフラグを解析し、push無しの上書き指定を拒否する", () => {
  const flags = parseSnapshotArgs(["--table", "0003445758", "--push", "--dry-run", "--allow-authoritative-overwrite"]);
  assert.equal(flags.push, true); assert.equal(flags.dryRun, true); assert.equal(flags.allowAuthoritativeOverwrite, true);
  assert.throws(() => parseSnapshotArgs(["--table", "0003445758", "--allow-authoritative-overwrite"]), /requires --push/);
});
