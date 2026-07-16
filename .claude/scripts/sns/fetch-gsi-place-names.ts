/**
 * GSI 地名情報 (国土地理院 電子国土基本図・地名情報) の全国 GeoJSON タイルを取得し、
 * バズ地図 (型C 点プロット) と県別集計の分析基盤になる統合 points JSON を生成する。
 *
 * データ源 (実験ベクトルタイル・z15・認証不要):
 *   居住地名 https://cyberjapandata.gsi.go.jp/xyz/experimental_nrpt/{z}/{x}/{y}.geojson (admCode あり)
 *   自然地名 https://cyberjapandata.gsi.go.jp/xyz/experimental_nnfpt/{z}/{x}/{y}.geojson (峠/山/川 等・行政コードなし)
 * ライセンス: 国土地理院コンテンツ利用規約 (PDL1.0 準拠・出典明記で商用/SNS 可)。
 *
 * mokuroku (タイル目録) が無いため、municipalities.topojson の陸域ポリゴンを z15 タイルへ
 * ラスタライズして「陸のタイルだけ」を走査する (海タイルの盲目走査を回避)。resumable:
 * 処理済みキーは state/done-<layer>.txt、抽出点は state/points-<layer>.jsonl に append し、
 * 再実行はキャッシュ済みをスキップする。
 *
 * 使い方:
 *   npx tsx .claude/scripts/sns/fetch-gsi-place-names.ts --pref 13            # 1県で試走 (hit率/所要を実測)
 *   npx tsx .claude/scripts/sns/fetch-gsi-place-names.ts --all                # 全国
 *   npx tsx .claude/scripts/sns/fetch-gsi-place-names.ts --merge-only         # fetch 済み jsonl から points.json 再生成
 *   オプション: --layers nrpt,nnfpt  --concurrency 10  --max-tiles N (安全弁)
 */
import { createReadStream, existsSync } from "node:fs";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

const PROJECT_ROOT = resolve(__dirname, "../../..");
const TOPO = resolve(PROJECT_ROOT, "apps/remotion/public/buzz-map/municipalities.topojson");
const OUT_DIR = resolve(PROJECT_ROOT, ".local/gsi-pni");
const STATE_DIR = resolve(OUT_DIR, "state");
const Z = 15;
const N = 2 ** Z;

type Layer = "nrpt" | "nnfpt";
interface PlacePoint {
  name: string;
  kana: string;
  kind: "admin" | "nature";
  featureType: string;
  lon: number;
  lat: number;
  pref: string; // 2桁県コード (居住地名のみ・自然地名は空)
}

// ---------- CLI ----------
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`);
const PREF = arg("pref");
const ALL = hasFlag("all");
const MERGE_ONLY = hasFlag("merge-only");
const LAYERS = (arg("layers") ?? "nrpt,nnfpt").split(",").map((s) => s.trim()) as Layer[];
const CONCURRENCY = Number(arg("concurrency") ?? 10);
const MAX_TILES = arg("max-tiles") ? Number(arg("max-tiles")) : Infinity;

// ---------- タイル座標 ----------
const lonToTX = (lon: number) => ((lon + 180) / 360) * N;
const latToTY = (lat: number) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * N;
};

/** ポリゴンの ring 群を z15 タイル集合へ (scanline 内部塗り + edge ラスタライズ) */
function ringsToTiles(rings: number[][][], out: Set<string>): void {
  const tRings = rings.map((ring) => {
    const r = ring.map(([lon, lat]) => [lonToTX(lon), latToTY(lat)] as [number, number]);
    const [fx, fy] = r[0];
    const [lx, ly] = r[r.length - 1];
    if (fx !== lx || fy !== ly) r.push([fx, fy]); // 閉じる
    return r;
  });
  let minY = Infinity;
  let maxY = -Infinity;
  for (const ring of tRings) for (const [, y] of ring) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  // scanline (各タイル行の中心線で交点を求め even-odd 塗り。穴も自動処理)
  for (let ty = Math.floor(minY); ty <= Math.floor(maxY); ty++) {
    const yc = ty + 0.5;
    const xs: number[] = [];
    for (const ring of tRings) {
      for (let i = 0; i < ring.length - 1; i++) {
        const [ax, ay] = ring[i];
        const [bx, by] = ring[i + 1];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) {
          xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax));
        }
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      for (let x = Math.floor(xs[i]); x <= Math.floor(xs[i + 1]); x++) out.add(`${x}/${ty}`);
    }
  }
  // edge (海岸線タイルを取りこぼさない)
  for (const ring of tRings) {
    for (let i = 0; i < ring.length - 1; i++) {
      const [ax, ay] = ring[i];
      const [bx, by] = ring[i + 1];
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay))));
      for (let s = 0; s <= steps; s++) {
        out.add(`${Math.floor(ax + ((bx - ax) * s) / steps)}/${Math.floor(ay + ((by - ay) * s) / steps)}`);
      }
    }
  }
}

// ---------- 陸域タイル列挙 ----------
async function loadLandTiles(): Promise<string[]> {
  const topo = JSON.parse(await readFile(TOPO, "utf-8")) as Topology;
  const objectName = Object.keys(topo.objects)[0];
  const fc = feature(topo, topo.objects[objectName] as GeometryCollection);
  const tiles = new Set<string>();
  for (const f of fc.features) {
    const code = String((f.properties as Record<string, unknown>)?.N03_007 ?? "");
    if (PREF && !code.startsWith(PREF)) continue;
    const g = f.geometry;
    if (!g) continue;
    if (g.type === "Polygon") ringsToTiles(g.coordinates as number[][][], tiles);
    else if (g.type === "MultiPolygon")
      for (const poly of g.coordinates as number[][][][]) ringsToTiles(poly, tiles);
  }
  return [...tiles];
}

// ---------- fetch ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function fetchTile(layer: Layer, key: string): Promise<PlacePoint[] | null> {
  const url = `https://cyberjapandata.gsi.go.jp/xyz/experimental_${layer}/${Z}/${key}.geojson`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url);
      if (r.status === 404) return [];
      if (!r.ok) {
        await sleep(300 * (attempt + 1));
        continue;
      }
      const j = (await r.json()) as { features?: Array<{ geometry: { coordinates: [number, number] }; properties: Record<string, unknown> }> };
      const pts: PlacePoint[] = [];
      for (const ft of j.features ?? []) {
        const p = ft.properties ?? {};
        const name = String(p.name ?? "").trim();
        if (!name) continue;
        const [lon, lat] = ft.geometry.coordinates;
        pts.push({
          name,
          kana: String(p.kana ?? ""),
          kind: layer === "nrpt" ? "admin" : "nature",
          featureType: String(p.type ?? ""),
          lon,
          lat,
          pref: layer === "nrpt" ? String(p.admCode ?? "").slice(0, 2) : "",
        });
      }
      return pts;
    } catch {
      await sleep(300 * (attempt + 1));
    }
  }
  return null;
}

async function loadDone(layer: Layer): Promise<Set<string>> {
  const path = resolve(STATE_DIR, `done-${layer}.txt`);
  const done = new Set<string>();
  if (!existsSync(path)) return done;
  const rl = createInterface({ input: createReadStream(path) });
  for await (const line of rl) if (line) done.add(line);
  return done;
}

async function fetchLayer(layer: Layer, tiles: string[]): Promise<void> {
  const done = await loadDone(layer);
  const todo = tiles.filter((t) => !done.has(t)).slice(0, MAX_TILES === Infinity ? undefined : MAX_TILES);
  const donePath = resolve(STATE_DIR, `done-${layer}.txt`);
  const pointsPath = resolve(STATE_DIR, `points-${layer}.jsonl`);
  console.log(`[${layer}] land tiles=${tiles.length} already-done=${done.size} to-fetch=${todo.length}`);
  let idx = 0;
  let hits = 0;
  let features = 0;
  let failed = 0;
  const t0 = Date.now();
  async function worker(): Promise<void> {
    while (idx < todo.length) {
      const key = todo[idx++];
      const pts = await fetchTile(layer, key);
      if (pts === null) {
        failed++;
        continue; // done に入れない → 次回リトライ
      }
      if (pts.length) {
        hits++;
        features += pts.length;
        await appendFile(pointsPath, pts.map((p) => JSON.stringify(p)).join("\n") + "\n");
      }
      await appendFile(donePath, key + "\n");
      const n = idx;
      if (n % 2000 === 0) {
        const rate = n / ((Date.now() - t0) / 1000);
        const eta = Math.round((todo.length - n) / rate / 60);
        console.log(`[${layer}] ${n}/${todo.length} hitTiles=${hits} pts=${features} fail=${failed} ${rate.toFixed(0)}/s ETA~${eta}m`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`[${layer}] DONE fetched=${todo.length} hitTiles=${hits} pts=${features} fail=${failed} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

// ---------- merge ----------
async function merge(): Promise<void> {
  const seen = new Set<string>();
  const points: PlacePoint[] = [];
  for (const layer of LAYERS) {
    const path = resolve(STATE_DIR, `points-${layer}.jsonl`);
    if (!existsSync(path)) continue;
    const rl = createInterface({ input: createReadStream(path) });
    for await (const line of rl) {
      if (!line) continue;
      const p = JSON.parse(line) as PlacePoint;
      const k = `${p.kind}|${p.name}|${p.lon.toFixed(5)}|${p.lat.toFixed(5)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      points.push(p);
    }
  }
  const admin = points.filter((p) => p.kind === "admin").length;
  const nature = points.filter((p) => p.kind === "nature").length;
  const payload = {
    meta: {
      source: "国土地理院 電子国土基本図（地名情報）ベクトルタイル提供実験",
      sourceUrl: "https://github.com/gsi-cyberjapan/experimental_pni",
      license: "国土地理院コンテンツ利用規約 (PDL1.0 準拠・出典明記で商用/SNS 可)",
      attribution: "出典：国土地理院ウェブサイト（電子国土基本図（地名情報））",
      zoom: Z,
      layers: LAYERS,
      generatedAt: new Date().toISOString(),
      counts: { total: points.length, admin, nature },
    },
    points,
  };
  await writeFile(resolve(OUT_DIR, "points.json"), JSON.stringify(payload));
  writeFileGz(resolve(OUT_DIR, "points.json.gz"), JSON.stringify(payload));
  console.log(`merged: total=${points.length} admin(居住)=${admin} nature(自然)=${nature}`);
  console.log(`  → ${resolve(OUT_DIR, "points.json")} (+ .gz)`);
}
function writeFileGz(path: string, text: string): void {
  const buf = gzipSync(Buffer.from(text, "utf-8"));
  return void require("node:fs").writeFileSync(path, buf);
}

// ---------- main ----------
async function main(): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  if (MERGE_ONLY) {
    await merge();
    return;
  }
  if (!ALL && !PREF) {
    console.error("走査範囲を指定してください: --all (全国) または --pref NN (県コード2桁で試走)");
    process.exit(1);
  }
  const tiles = await loadLandTiles();
  console.log(`陸域 z15 タイル: ${tiles.length}${PREF ? ` (pref=${PREF})` : " (全国)"}`);
  for (const layer of LAYERS) await fetchLayer(layer, tiles);
  await merge();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
