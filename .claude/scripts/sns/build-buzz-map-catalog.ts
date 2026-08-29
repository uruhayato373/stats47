#!/usr/bin/env tsx
/**
 * build-buzz-map-catalog.ts — バズ地図 (buzz-map) の「投稿できるネタ」候補カタログを
 * 構築/更新する状態付きキュー builder。
 *
 * blog の build-topic-queue.mjs の姉妹スクリプト。SNS 展開を計画的に回すため、
 * e-Stat 由来の metric registry (git TS = SSOT) を一次ソースに候補を棚卸し・スコアリングする。
 * e-Stat API を生で再走査しない (取り込み済み registry + R2 観測値だけで完結)。
 *
 * 2 レーン:
 *   - muni: entities に "city" を含む active metric 全量 (市区町村マップ = まちの計量舎の主戦場)
 *   - pref: 都道府県のみの active metric を機械フィルタ (二値化しやすさ×鮮度×相性×流入) で上位に絞る
 *
 * スコア (エフェメラル計算 → 状態付きキュー JSON。永続 DB は作らない):
 *   combined = 0.35*affinity + 0.25*freshness + 0.20*binaryFram + 0.20*gscImp
 *   - affinity:   category の X 相性 (x-catalog getAffinity の 反論/数字 = paradox/number 軸)
 *   - freshness:  latestYear 2022+ =1.0 / 2018+ =0.6 / それ以前 0.2
 *   - binaryFram: 二値化しやすさ (unit %系=1.0 / title に率|割合|指数|あたり=0.7 / その他 0.3)
 *   - gscImp:     最新 GSC pages.csv の /ranking/<key> imp → norm(log)。無ければ 0
 *
 * status: candidate → spec → generated → posted / rejected (再構築時に upsert 保持)
 *
 * 真実源 (SSOT): .claude/state/sns/buzz-map-catalog.json (git tracked)
 * 正典: .claude/rules/buzz-map-standards.md §4
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/build-buzz-map-catalog.ts                    # 構築/更新 + top20 表示
 *   npx tsx .claude/scripts/sns/build-buzz-map-catalog.ts --pref-cap 400     # pref レーンの採録上限
 *   npx tsx .claude/scripts/sns/build-buzz-map-catalog.ts --next 10 [--lane muni|pref]
 *   npx tsx .claude/scripts/sns/build-buzz-map-catalog.ts --mark-spec <metricKey> [--theme-id <id>]
 *   npx tsx .claude/scripts/sns/build-buzz-map-catalog.ts --mark-generated <metricKey>
 *   npx tsx .claude/scripts/sns/build-buzz-map-catalog.ts --mark-posted <metricKey>
 *   npx tsx .claude/scripts/sns/build-buzz-map-catalog.ts --mark-rejected <metricKey> [--note "理由"]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

import { listAllMetrics, getMetricMeta } from "@stats47/data-configs";
import type { MetricConfig } from "@stats47/data-configs";

// KSJ データセットは workspace exports 制約のため相対パスで import
import { GIS_DATASETS } from "../../../packages/gis/src/mlit-ksj/datasets";

// curated ideas (人が選定した企画 SSOT) と router/inventory コア (.mjs)
import { CURATED_BUZZ_MAP_IDEAS } from "./data/buzz-map-curated-ideas";
import type { CuratedBuzzMapIdea } from "./data/buzz-map-curated-ideas";
import {
  computeCuratedScore,
  evaluateHardGate,
  resolveLanding,
  findMachineDuplicate,
  curatedToCatalogEntry,
  resolveMergedStatus,
} from "./lib/buzz-map-router-core.mjs";
import { loadInventory } from "./lib/buzz-map-inventory-core.mjs";

// x-catalog / sns-posts-store は .cjs (require)
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { getAffinity } = require("../lib/x-catalog.cjs") as {
  getAffinity: () => Record<string, Record<string, string>>;
};
// posts.json は read-only 参照 (draft 継承)。書込は store 経由のみ・ここでは query しか使わない。
const snsPostsStore = require("../lib/sns-posts-store.cjs") as {
  query: (predicate: (p: Record<string, unknown>) => boolean) => Array<Record<string, unknown>>;
};

/**
 * posts.json の buzz-map draft content_key → curated ideaId の対応（draft status 継承）。
 * literal 一致するもの (vacant-housing-muni / onsen-place-names) は明示不要だが、
 * machine 由来の旧 content_key で curated ideaId と一致しないものだけここに書く。
 * 根拠: no-station-muni は P0 の「駅なし×人口」= curated stationless-large-municipalities
 * (renderPlan「型D 駅なし×人口上位 map」で照合)。population-growth-muni は machine themeId で、
 * curated population-growth-municipalities に aliasesOf 経由で統合される (下の resolve で解決)。
 */
const POSTS_CONTENT_KEY_TO_IDEA: Record<string, string> = {
  "no-station-muni": "stationless-large-municipalities",
  "population-growth-muni": "population-growth-municipalities",
};

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const STATE_PATH = join(PROJECT_ROOT, ".claude/state/sns/buzz-map-catalog.json");
const GSC_SNAPSHOTS = join(
  PROJECT_ROOT,
  ".claude/skills/analytics/gsc-improvement/reference/snapshots",
);

type Lane = "muni" | "pref" | "ksj" | "mlit-dpf" | "gsi" | "curated";
type Status = "candidate" | "spec" | "generated" | "posted" | "rejected";
/** 型に落とせるか (どのヘルパー/レンダラーで作れるか) */
type RenderClass =
  | "point-plot" // 型C 点プロット
  | "point-muni" // 型A 点→自治体 PIP
  | "muni-binary" // 型A 自治体指定型 polygon
  | "line-timeline" // 型D 線ネットワーク時系列リール (供用開始年属性あり)
  | "line-network" // 型D 線ネットワーク静止画 (年属性なし)
  | "polygon-overlay" // polygon (面積比等・型未対応)
  | "mesh" // mesh (型未対応)
  | "flow" // OD/流動 (型未対応)
  | "unknown";
/** R2/API での取得可能性 */
type Availability = "r2" | "registered" | "candidate" | "api";

interface CatalogEntry {
  /** 主キー。estat=metricKey / ksj="ksj:<dataId>" / dpf="dpf:<catalogId>" / curated="curated:<ideaId>" */
  metricKey: string;
  source: "estat" | "ksj" | "mlit-dpf" | "gsi" | "curated";
  lane: Lane;
  title: string;
  score: number;
  status: Status;
  themeId: string | null;
  note: string | null;
  // ── curated 固有 (任意) ──
  ideaId?: string;
  priority?: "P0" | "P1" | "P2" | "P3";
  recommendedType?: string;
  sourceKind?: string;
  metricKeys?: string[];
  requiredYear?: string | null;
  landingPromise?: string;
  feasibility?: string;
  commercialUse?: string;
  sensitivity?: string;
  eligible?: boolean;
  autoPostable?: boolean;
  gateReasons?: string[];
  landingStrategy?: string;
  landingReadiness?: string;
  primaryUrl?: string | null;
  /** curated が machine catalog の既存 entry と重複した場合の被マッチ key 群 (§4.1 統合の記録) */
  aliasesOf?: string[];
  /** GA4 attribution (buzz-map-attribution-latest.json) の measured 補正入力。
   *  投稿 0 の現在は付かない (no-op)。実補正ロジックは 4 週後の実データで調整する (今は入口のみ)。 */
  measuredOutcome?: { landingSessions: number; deepClickRate: number | null; outcomeScore: number };
  // ── e-Stat 固有 (任意) ──
  subtitle?: string | null;
  category?: string;
  unit?: string;
  latestYear?: string | null;
  yearCount?: number;
  breakdown?: Record<string, number>;
  // ── GIS (KSJ/DPF) 固有 (任意) ──
  dataId?: string;
  geometryType?: string;
  renderClass?: RenderClass;
  availability?: Availability;
  license?: string;
  /** このデータで「何が作れるか」(型と実装状況)。renderClass/lane から機械導出 */
  capability?: string;
}

/** renderClass → 作れる地図表現と実装状況 (まちの計量舎の各分析タイプに対応)。 */
const CAPABILITY: Record<RenderClass, string> = {
  "point-plot": "型C 点プロット (実装済)",
  "point-muni": "型A 点→自治体二値 (実装済)",
  "muni-binary": "型A 二値マップ (実装済)",
  "line-timeline": "型D 線ネットワーク・時系列リール (実装済)",
  "line-network": "型D 線ネットワーク静止画 (実装済)",
  "polygon-overlay": "型A 面塗り (型A流用・要 pipeline)",
  mesh: "型F メッシュ塗り (未実装。標高/将来推計人口/土地利用マップ)",
  flow: "OD/流動矢印 (未実装。通勤流動・訪日外国人流動)",
  unknown: "形状未確定 (要 datasets.ts 登録で型確定)",
};

interface CatalogFile {
  generatedAt: string | null;
  weights: Record<string, number>;
  counts: { muni: number; pref: number; ksj: number; "mlit-dpf": number; gsi: number; curated: number };
  entries: CatalogEntry[];
}

// ─── CLI ───
function parseArgs() {
  const a = process.argv.slice(2);
  const val = (n: string) => {
    const i = a.indexOf(n);
    return i !== -1 ? (a[i + 1] ?? null) : null;
  };
  return {
    prefCap: val("--pref-cap") ? Number(val("--pref-cap")) : 400,
    next: val("--next") ? Number(val("--next")) : null,
    lane: (val("--lane") as Lane | null) ?? null,
    markSpec: val("--mark-spec"),
    markGenerated: val("--mark-generated"),
    markPosted: val("--mark-posted"),
    markRejected: val("--mark-rejected"),
    markCandidate: val("--mark-candidate"),
    themeId: val("--theme-id"),
    note: val("--note"),
  };
}

// ─── スコアリング部品 ───
const RATE_RE = /率|割合|指数|あたり|当たり|per\b/i;
const PCT_UNIT_RE = /[%‰]|パーセント|ポイント/;

/** category → 反論(paradox)/数字(number) 相性を 0.3-1.0 に。◎=1.0 ○=0.6 △=0.3 —=0.1 */
function affinityScore(category: string, affinity: Record<string, Record<string, string>>): number {
  const row = affinity[category];
  if (!row) return 0.4;
  const mark = (m: string) => (m === "◎" ? 1 : m === "○" ? 0.6 : m === "△" ? 0.3 : 0.1);
  // バズ地図は「通説と逆」「数字の格差」で刺す → 反論・数字を重視
  return Math.max(mark(row["反論"] ?? ""), mark(row["数字"] ?? "") * 0.9);
}

function freshnessScore(latestYear: string | null): number {
  if (!latestYear) return 0.2;
  const y = parseInt(latestYear, 10);
  if (y >= 2022) return 1;
  if (y >= 2018) return 0.6;
  return 0.2;
}

function binaryFramingScore(config: MetricConfig): number {
  if (PCT_UNIT_RE.test(config.unit)) return 1;
  if (RATE_RE.test(config.title) || RATE_RE.test(config.unit)) return 0.7;
  return 0.3;
}

/** 最新 GSC snapshot の /ranking/<key> impressions を key→imp で返す。 */
function loadGscImpByKey(): Map<string, number> {
  const out = new Map<string, number>();
  if (!existsSync(GSC_SNAPSHOTS)) return out;
  const weeks = readdirSync(GSC_SNAPSHOTS)
    .filter((d) => /^\d{4}-W\d{2}$/.test(d))
    .sort();
  if (weeks.length === 0) return out;
  const csv = join(GSC_SNAPSHOTS, weeks[weeks.length - 1], "pages.csv");
  if (!existsSync(csv)) return out;
  const lines = readFileSync(csv, "utf8").split("\n").slice(1);
  for (const line of lines) {
    const m = line.match(/\/ranking\/([a-z0-9-]+)[^,]*,\s*\d+\s*,\s*(\d+)/);
    if (m) out.set(m[1], Math.max(out.get(m[1]) ?? 0, Number(m[2])));
  }
  return out;
}

function normLog(v: number, max: number): number {
  if (max <= 0 || v <= 0) return 0;
  return Math.log1p(v) / Math.log1p(max);
}

// ─── メイン ───
function loadState(): CatalogFile {
  if (existsSync(STATE_PATH)) {
    try {
      return JSON.parse(readFileSync(STATE_PATH, "utf8")) as CatalogFile;
    } catch {
      /* fresh */
    }
  }
  return {
    generatedAt: null,
    weights: {},
    counts: { muni: 0, pref: 0, ksj: 0, "mlit-dpf": 0, gsi: 0, curated: 0 },
    entries: [],
  };
}

function saveState(state: CatalogFile) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
}

const WEIGHTS = { affinity: 0.35, freshness: 0.25, binaryFram: 0.2, gscImp: 0.2 };

// ─── KSJ / DPF 分類 ───

/** 自治体指定型 polygon (地域指定・圏域) → 型A muni-binary で描ける dataId */
const KSJ_MUNI_BINARY_IDS = new Set([
  "A17", // 過疎地域
  "A22", // 豪雪地帯
  "A16", // DID (人口集中地区)
  "A10", // 自然公園
  "A24", // 振興山村
  "A25", // 特定農山村
  "A18", // 半島振興
  "A19", // 離島振興
  "A38", // 医療圏
]);

/** 供用開始・開業年など時系列属性を持つ線データ (→ 型D line-timeline) */
const KSJ_LINE_TIMELINE_IDS = new Set([
  "N06", // 高速道路時系列 (供用開始年 N06_002)
  "N05", // 鉄道時系列 (開業・廃止年)
]);

/** ksj-catalog.json の未登録候補で、内容から renderClass が明らかなもの (手動格上げ) */
const KSJ_CANDIDATE_RENDERCLASS: Record<string, RenderClass> = {
  N05: "line-timeline", // 鉄道時系列 (開業年で伸びる鉄道網リール)
  N08: "point-plot", // 空港時系列 (開港年つき点)
  // 公式ページから JPGIS 形状が機械抽出できなかったが、内容から点形状が明らかな施設系
  P02: "point-plot", // 公共施設 (施設点)
  P20: "point-plot", // 避難施設 (施設点)
  "S05-c": "point-plot", // 交通流動量_駅別乗降数 (駅点)
};

/**
 * KSJ 形状対照表 (build-ksj-geometry-map.ts が公式ページから機械抽出・git tracked)。
 * 未登録候補の geometry (点/線/面/メッシュ) はこれで確定する。
 */
interface KsjGeometryMap {
  entries: Record<string, { shapes: string[]; name: string }>;
}
function loadKsjGeometryMap(): KsjGeometryMap["entries"] {
  try {
    const p = join(PROJECT_ROOT, ".claude/scripts/sns/data/ksj-geometry.generated.json");
    return (JSON.parse(readFileSync(p, "utf8")) as KsjGeometryMap).entries;
  } catch {
    return {};
  }
}

/** shapes (複数可) → renderClass。バズ地図で使いやすい順に point > line > polygon > mesh。 */
function renderClassFromShapes(dataId: string, shapes: string[]): RenderClass {
  if (shapes.includes("point")) return "point-plot";
  if (shapes.includes("line"))
    return KSJ_LINE_TIMELINE_IDS.has(dataId) ? "line-timeline" : "line-network";
  if (shapes.includes("polygon"))
    return KSJ_MUNI_BINARY_IDS.has(dataId) ? "muni-binary" : "polygon-overlay";
  if (shapes.includes("mesh")) return "mesh";
  return "unknown";
}

function ksjRenderClass(dataId: string, geom: string): RenderClass {
  if (geom === "point") return "point-plot"; // point-muni も可 (両対応)
  if (geom === "polygon") return KSJ_MUNI_BINARY_IDS.has(dataId) ? "muni-binary" : "polygon-overlay";
  if (geom === "line")
    return KSJ_LINE_TIMELINE_IDS.has(dataId) ? "line-timeline" : "line-network";
  if (geom === "mesh") return "mesh";
  return "unknown";
}

const RENDER_PRIORITY: Record<RenderClass, number> = {
  "point-plot": 1.0,
  "point-muni": 1.0,
  "line-timeline": 0.95,
  "muni-binary": 0.9,
  "line-network": 0.85,
  "polygon-overlay": 0.4,
  mesh: 0.1,
  flow: 0.1,
  unknown: 0.2,
};
const AVAIL_PRIORITY: Record<Availability, number> = {
  r2: 1.0,
  api: 0.55,
  registered: 0.6,
  candidate: 0.3,
};

/**
 * R2 に national.topojson の実在を実測確認済みのデータセット (dataId → version)。
 * ここは「実際に HEAD 200 を確認した」記録 (evidence-based)。実証・pipeline 実行で増やす。
 * latestVersion フィールドが無くても R2 に実在するケース (S12 等) を r2 に昇格する。
 */
const KSJ_R2_VERIFIED: Record<string, string> = {
  S12: "24", // 駅別乗降客数。実証で HEAD 200 確認 (2026-07-16)
};

/**
 * gis/mlit-ksj 規約パス外だが R2 に加工済み派生がある dataId → note。
 * ヘルパーは --r2-key でこのキーを直接読める (line-network 実証で確認)。
 */
const KSJ_R2_ALT_KEY: Record<string, { key: string; note: string }> = {
  N06: {
    key: "app/highway-history/highway-sections.topojson",
    note: "R2 実在 (highway-history 派生・供用開始年 N06_002・1962-2020)。--r2-key で読む",
  },
};

/** availability を判定 (verified 実測 > alt-key 派生 > latestVersion 楽観 > registered)。 */
function ksjAvailability(dataId: string, latestVersion: string): {
  availability: Availability;
  version: string;
} {
  if (KSJ_R2_VERIFIED[dataId]) return { availability: "r2", version: KSJ_R2_VERIFIED[dataId] };
  if (KSJ_R2_ALT_KEY[dataId]) return { availability: "r2", version: "alt" };
  if (latestVersion) return { availability: "r2", version: latestVersion };
  return { availability: "registered", version: "" };
}

function buildKsjEntries(prevByKey: Map<string, CatalogEntry>): CatalogEntry[] {
  // 登録済み 42 件 + 候補 superset (ksj-catalog.json 126 件、dataId 重複は登録優先)
  const catalogRaw = JSON.parse(
    readFileSync(join(PROJECT_ROOT, "packages/database/seed/ksj-catalog.json"), "utf8"),
  ) as { id: string; name: string; category2_name?: string }[];
  const registered = new Map(GIS_DATASETS.map((d) => [d.dataId, d]));

  const entries: CatalogEntry[] = [];
  const seen = new Set<string>();

  // 1) 登録済み (geometryType が判る = renderClass 確定)
  for (const d of GIS_DATASETS) {
    seen.add(d.dataId);
    const renderClass = ksjRenderClass(d.dataId, d.geometryType);
    const latestVersion = (d as { latestVersion?: string }).latestVersion ?? "";
    const { availability, version } = ksjAvailability(d.dataId, latestVersion);
    const score =
      0.5 * RENDER_PRIORITY[renderClass] + 0.5 * AVAIL_PRIORITY[availability];
    const key = `ksj:${d.dataId}`;
    const prev = prevByKey.get(key);
    entries.push({
      metricKey: key,
      source: "ksj",
      lane: "ksj",
      title: d.name,
      score: Math.round(score * 1000) / 1000,
      dataId: d.dataId,
      geometryType: d.geometryType,
      renderClass,
      capability: CAPABILITY[renderClass],
      availability,
      license: (d as { license?: string }).license,
      status: prev?.status ?? "candidate",
      themeId: prev?.themeId ?? null,
      // alt-key を持つデータは「取得方法」が機械事実なので prev より優先。他は運用メモ prev を尊重
      note: KSJ_R2_ALT_KEY[d.dataId]
        ? KSJ_R2_ALT_KEY[d.dataId].note
        : (prev?.note ??
          (availability === "r2"
            ? `version=${version} (national.topojson 実在)`
            : "登録済・R2 未変換 (要 pipeline)")),
    });
  }

  // 2) 未登録候補 — geometry は KSJ 形状対照表 (公式ページから機械抽出) で確定
  const geoMap = loadKsjGeometryMap();
  for (const c of catalogRaw) {
    if (seen.has(c.id) || registered.has(c.id)) continue;
    seen.add(c.id);
    const shapes = geoMap[c.id]?.shapes ?? [];
    const renderClass =
      KSJ_CANDIDATE_RENDERCLASS[c.id] ?? renderClassFromShapes(c.id, shapes);
    const score = 0.5 * RENDER_PRIORITY[renderClass] + 0.5 * AVAIL_PRIORITY.candidate;
    const key = `ksj:${c.id}`;
    const prev = prevByKey.get(key);
    entries.push({
      metricKey: key,
      source: "ksj",
      lane: "ksj",
      title: c.name,
      score: Math.round(score * 1000) / 1000,
      dataId: c.id,
      geometryType: shapes.length > 0 ? shapes.join("+") : undefined,
      renderClass,
      capability: CAPABILITY[renderClass],
      availability: "candidate",
      status: prev?.status ?? "candidate",
      themeId: prev?.themeId ?? null,
      note: prev?.note ?? "未登録候補 (要 datasets.ts 登録 → pipeline)",
    });
  }

  return entries.sort((a, b) => b.score - a.score);
}

/**
 * MLIT DPF カタログ (静的表。reference/mlit-dpf-catalog.md 転記)。
 * nlni_ksj / dpf_area_data / dpf_statistical_data は KSJ/N03/e-Stat と重複 → 除外。
 * renderClass は内容から手書き。availability は全て api (GraphQL 取得が要る)。
 */
const DPF_CATALOGS: { id: string; name: string; renderClass: RenderClass; note: string }[] = [
  { id: "ipf", name: "社会資本情報 (空港/公園/ダム/砂防)", renderClass: "point-plot", note: "10 DS" },
  { id: "msil", name: "海しる (港湾/漁港/灯台)", renderClass: "point-plot", note: "5 DS" },
  { id: "dhb", name: "ダム便覧", renderClass: "point-plot", note: "1 DS" },
  { id: "hwq", name: "水文水質データベース (雨量/水位)", renderClass: "point-plot", note: "2 DS" },
  { id: "ffd", name: "訪日外国人流動データ", renderClass: "flow", note: "8 DS" },
  { id: "qol", name: "都市QOLデータ", renderClass: "polygon-overlay", note: "2 DS" },
  { id: "gtfs", name: "GTFS (公共交通時刻表)", renderClass: "point-plot", note: "1 DS・停留所点" },
  { id: "rdpf", name: "道路データPF (県間OD交通量)", renderClass: "flow", note: "2 DS" },
  { id: "rsdb", name: "全国道路施設点検DB (橋梁/トンネル)", renderClass: "point-plot", note: "7 DS" },
  { id: "mlit_plateau", name: "3D都市モデル PLATEAU", renderClass: "polygon-overlay", note: "6 DS" },
  { id: "rtc", name: "道路交通センサス", renderClass: "point-plot", note: "2 DS" },
  { id: "ngi", name: "国土地盤情報DB", renderClass: "point-plot", note: "1 DS" },
  { id: "ndm", name: "自然災害伝承碑", renderClass: "point-plot", note: "1 DS・災害記録点" },
  { id: "cyport", name: "サイバーポート (港湾インフラ)", renderClass: "point-plot", note: "1 DS" },
  { id: "karte", name: "事業評価カルテ", renderClass: "unknown", note: "2 DS" },
  { id: "mcc", name: "地方公共団体の工事データ", renderClass: "point-plot", note: "1 DS" },
  { id: "lpfs", name: "全国幹線旅客純流動調査", renderClass: "flow", note: "12 DS" },
  { id: "dimaps", name: "DiMAPS (災害情報)", renderClass: "polygon-overlay", note: "4 DS" },
  { id: "alpc", name: "静岡県航空レーザ点群", renderClass: "mesh", note: "2 DS・地域限定" },
  { id: "ntrack", name: "航空機騒音監視測定", renderClass: "point-plot", note: "9 DS" },
  { id: "psc", name: "災害緊急撮影 (斜め写真)", renderClass: "unknown", note: "2 DS" },
  { id: "crtc", name: "工事実績情報 (コリンズ)", renderClass: "point-plot", note: "1 DS" },
  { id: "nvpf", name: "歩行空間ナビゲーション", renderClass: "line-network", note: "1 DS" },
  { id: "mms", name: "MMS三次元点群", renderClass: "mesh", note: "1 DS" },
  { id: "imm", name: "インフラみらいマップ", renderClass: "point-plot", note: "1 DS" },
  { id: "jyubunpc", name: "重要文化財点群", renderClass: "point-plot", note: "1 DS" },
  { id: "kkd", name: "熊本県施設管理DB", renderClass: "point-plot", note: "7 DS・地域限定" },
  { id: "nxc", name: "高速道路会社の工事図面", renderClass: "unknown", note: "1 DS" },
  { id: "tcd", name: "東京都ICT活用工事", renderClass: "unknown", note: "1 DS・地域限定" },
  { id: "cals_fukushima", name: "福島県電子納品保管管理", renderClass: "unknown", note: "2 DS・地域限定" },
  { id: "dobox", name: "広島県インフラマネジメント基盤", renderClass: "unknown", note: "1 DS・地域限定" },
];

function buildDpfEntries(prevByKey: Map<string, CatalogEntry>): CatalogEntry[] {
  return DPF_CATALOGS.map((c) => {
    const score = 0.5 * RENDER_PRIORITY[c.renderClass] + 0.5 * AVAIL_PRIORITY.api;
    const key = `dpf:${c.id}`;
    const prev = prevByKey.get(key);
    return {
      metricKey: key,
      source: "mlit-dpf" as const,
      lane: "mlit-dpf" as const,
      title: c.name,
      score: Math.round(score * 1000) / 1000,
      dataId: c.id,
      renderClass: c.renderClass,
      capability: CAPABILITY[c.renderClass],
      availability: "api" as const,
      status: prev?.status ?? "candidate",
      themeId: prev?.themeId ?? null,
      note: prev?.note ?? `${c.note}・GraphQL 取得 → --geojson でヘルパーに投入`,
    };
  }).sort((a, b) => b.score - a.score);
}

/**
 * 国土地理院 地名情報 (GSI) レーン (静的キュレーション)。
 * 地名の漢字パターン → 該当地点を点プロット (型C)。GSI タイル API から取得するため
 * R2 dataset は未生成 (availability=api)。renderClass は point-plot (型C)。
 */
const GSI_CANDIDATES: { slug: string; pattern: string; title: string; note: string }[] = [
  { slug: "shuku", pattern: "宿", title: "「宿」のつく地名", note: "宿場町の名残" },
  { slug: "onsen", pattern: "温泉", title: "「温泉」のつく地名", note: "温泉地の分布" },
  { slug: "tani", pattern: "谷", title: "「谷」のつく地名", note: "地形由来" },
  { slug: "sawa", pattern: "沢|澤", title: "「沢・澤」のつく地名", note: "地形由来" },
  { slug: "shinden", pattern: "新田", title: "「新田」のつく地名", note: "近世の開発地" },
  { slug: "shima", pattern: "島", title: "「島」のつく地名", note: "島嶼・旧島名" },
  { slug: "dai", pattern: "台", title: "「台」のつく地名 (ニュータウン)", note: "造成地・団地" },
  { slug: "number", pattern: "[0-9一二三四五六七八九十百千]", title: "数字を含む地名", note: "数字地名" },
  { slug: "uma", pattern: "馬", title: "「馬」のつく地名", note: "馬産・交通由来" },
  { slug: "yato", pattern: "谷戸|谷津", title: "「谷戸・谷津」のつく地名", note: "台地の谷地形" },
];

function buildGsiEntries(prevByKey: Map<string, CatalogEntry>): CatalogEntry[] {
  const renderClass: RenderClass = "point-plot";
  return GSI_CANDIDATES.map((c) => {
    const score = 0.5 * RENDER_PRIORITY[renderClass] + 0.5 * AVAIL_PRIORITY.api;
    const key = `gsi:${c.slug}`;
    const prev = prevByKey.get(key);
    return {
      metricKey: key,
      source: "gsi" as const,
      lane: "gsi" as const,
      title: c.title,
      score: Math.round(score * 1000) / 1000,
      dataId: c.slug,
      renderClass,
      capability: CAPABILITY[renderClass],
      availability: "api" as const,
      status: prev?.status ?? "candidate",
      themeId: prev?.themeId ?? null,
      // note は候補定義から機械導出するため upsert 保持せず常に再生成 (コマンド案内のドリフト防止)
      note: `${c.note} (pattern: ${c.pattern})・build-buzz-map-spec-gsi.ts --pattern "${c.pattern}" で spec 化`,
    };
  }).sort((a, b) => b.score - a.score);
}

/**
 * curated lane を組み立てる (§4.1 authored source)。
 * 各 idea を score gate / hard gate / landing router に通し、machine lane との重複を
 * dedup してから catalog entry 形へ射影する。status は前回を upsert 保持。
 * landing backfill: dedup 先の machine entry が generated/posted の場合、その状態を
 * curated entry に引き継ぎ landing readiness を live 扱いにする。
 */
async function buildCuratedEntries(
  prevByKey: Map<string, CatalogEntry>,
  machineKeyToStatus: Map<string, Status>,
): Promise<CatalogEntry[]> {
  const inventory = await loadInventory({});
  const machineKeys = new Set(machineKeyToStatus.keys());
  // posts.json の draft を curated ideaId → status で引けるようにする（draft status 継承・read-only）
  const draftStatusByIdea = loadDraftStatusByIdea();
  // GA4 attribution の measured 補正入力 (投稿 0 の現在は空 = no-op)
  const measuredByIdea = loadMeasuredFeedback();
  const out: CatalogEntry[] = [];

  for (const idea of CURATED_BUZZ_MAP_IDEAS as CuratedBuzzMapIdea[]) {
    const scored = computeCuratedScore(idea);
    const gate = evaluateHardGate(idea);
    const landing = resolveLanding(idea, inventory);
    const dup = findMachineDuplicate(idea, machineKeys);

    const entry = curatedToCatalogEntry(idea, scored, landing, gate) as CatalogEntry;

    // §4.1 machine lane と統合: 被マッチ key を記録
    if (dup.isDuplicate) entry.aliasesOf = dup.matchedKeys;

    // measured 補正入力を付与 (投稿 0 の現在は該当なし = no-op)。
    //   実 score 補正 (outcomeScore を breakdown に加算) は 4 週後の実データ検証後に配線する。
    const measured = measuredByIdea.get(idea.ideaId);
    if (measured) entry.measuredOutcome = measured;

    // dedup 先 machine entry の後段 status 群 (generated/posted/spec 等) を集める
    const matchedMachineStatuses = dup.matchedKeys
      .map((mk) => machineKeyToStatus.get(mk))
      .filter((s): s is Status => Boolean(s));

    // landing backfill: dedup 先が generated/posted なら readiness を live に引き上げる
    let backfilledLive = false;
    for (const st of matchedMachineStatuses) {
      if (st === "generated" || st === "posted") {
        entry.landingReadiness = "live";
        backfilledLive = true;
      }
    }

    // status merge: 前回 curated status を起点に、machine 後段 status と posts.json draft を
    //   max 継承 (後段を巻き戻さない)。draft は generated より後段なので draft が勝つ。
    const prev = prevByKey.get(entry.metricKey);
    const draftStatus = draftStatusByIdea.get(idea.ideaId) ?? null;
    entry.status = resolveMergedStatus(
      prev?.status,
      matchedMachineStatuses,
      draftStatus,
    ) as Status;

    if (prev?.themeId) entry.themeId = prev.themeId;
    const inheritedNotes = [
      draftStatus ? `posts.json draft 継承 (${draftStatus})` : null,
      backfilledLive ? `既存 generated と統合 (landing live backfill)` : null,
      dup.isDuplicate ? `machine lane と統合: ${dup.matchedKeys.join(", ")}` : null,
    ].filter(Boolean) as string[];
    entry.note = prev?.note ?? (inheritedNotes.length > 0 ? inheritedNotes.join(" / ") : null);

    out.push(entry);
  }

  return out.sort((a, b) => b.score - a.score);
}

/**
 * posts.json (SSOT) の buzz-map draft を curated ideaId → status で引ける Map にする。
 * read-only (store の query のみ・書込しない)。content_key が curated ideaId と一致しない
 * machine 由来 key は POSTS_CONTENT_KEY_TO_IDEA で正規化する。
 */
function loadDraftStatusByIdea(): Map<string, string> {
  const byIdea = new Map<string, string>();
  let drafts: Array<Record<string, unknown>> = [];
  try {
    drafts = snsPostsStore.query(
      (p) => p.domain === "buzz-map" && p.status === "draft",
    );
  } catch {
    return byIdea; // posts.json 読めない環境では draft 継承なし (保守的)
  }
  for (const p of drafts) {
    const contentKey = typeof p.content_key === "string" ? p.content_key : null;
    if (!contentKey) continue;
    const ideaId = POSTS_CONTENT_KEY_TO_IDEA[contentKey] ?? contentKey;
    // draft より後段の status (scheduled/posted) が posts.json にあれば尊重
    const status = typeof p.status === "string" ? p.status : "draft";
    byIdea.set(ideaId, status);
  }
  return byIdea;
}

/**
 * GA4 attribution の measured 補正入力を読む (buzz-map-attribution-latest.json)。
 * ファイル不在 / 投稿 0 の現在は空 Map (no-op)。buzz-map-attribution.mjs が生成する。
 * ここでは score を直接書き換えず measuredOutcome として entry に添えるだけ (入口配線)。
 */
function loadMeasuredFeedback(): Map<
  string,
  { landingSessions: number; deepClickRate: number | null; outcomeScore: number }
> {
  const out = new Map<string, { landingSessions: number; deepClickRate: number | null; outcomeScore: number }>();
  const p = join(PROJECT_ROOT, ".claude/state/sns/buzz-map-attribution-latest.json");
  if (!existsSync(p)) return out;
  try {
    const json = JSON.parse(readFileSync(p, "utf8")) as {
      feedback?: Record<string, { landingSessions?: number; deepClickRate?: number | null; outcomeScore?: number }>;
    };
    for (const [ideaId, f] of Object.entries(json.feedback ?? {})) {
      out.set(ideaId, {
        landingSessions: Number(f.landingSessions ?? 0),
        deepClickRate: f.deepClickRate ?? null,
        outcomeScore: Number(f.outcomeScore ?? 0),
      });
    }
  } catch {
    /* 壊れた state は無視 (no-op) */
  }
  return out;
}

async function rebuild(prefCap: number): Promise<CatalogFile> {
  const prev = loadState();
  // 既存 status を metricKey で引けるように (upsert 保持)
  const prevByKey = new Map(prev.entries.map((e) => [e.metricKey, e]));

  const affinity = getAffinity();
  const gscImp = loadGscImpByKey();
  const gscMax = Math.max(1, ...gscImp.values());

  const active = listAllMetrics().filter((c) => c.isActive !== false);

  const scoreOf = (config: MetricConfig, lane: Lane): CatalogEntry => {
    const meta = getMetricMeta(config.key);
    const b = {
      affinity: affinityScore(config.category, affinity),
      freshness: freshnessScore(meta?.latestYear?.yearCode ?? null),
      binaryFram: binaryFramingScore(config),
      gscImp: normLog(gscImp.get(config.key) ?? 0, gscMax),
    };
    const score =
      WEIGHTS.affinity * b.affinity +
      WEIGHTS.freshness * b.freshness +
      WEIGHTS.binaryFram * b.binaryFram +
      WEIGHTS.gscImp * b.gscImp;
    const prevEntry = prevByKey.get(config.key);
    return {
      metricKey: config.key,
      source: "estat",
      lane,
      title: config.title,
      subtitle: config.subtitle ?? null,
      category: config.category,
      unit: config.unit,
      latestYear: meta?.latestYear?.yearCode ?? null,
      yearCount: meta?.availableYears.length ?? 0,
      score: Math.round(score * 1000) / 1000,
      breakdown: {
        affinity: Math.round(b.affinity * 100) / 100,
        freshness: b.freshness,
        binaryFram: b.binaryFram,
        gscImp: Math.round(b.gscImp * 100) / 100,
      },
      // e-Stat 観測値は二値マップ (型A) が基本。muni は塗りベースとして型E 合成にも使える
      capability:
        lane === "muni"
          ? "型A 二値マップ + 型E 合成の塗りベース (実装済)"
          : "型A 二値マップ (実装済)",
      // status/themeId/note は前回を保持 (rejected/posted を再構築で消さない)
      status: prevEntry?.status ?? "candidate",
      themeId: prevEntry?.themeId ?? null,
      note: prevEntry?.note ?? null,
    };
  };

  // muni: city 対応 active 全量
  const muni = active
    .filter((c) => c.entities.includes("city"))
    .map((c) => scoreOf(c, "muni"))
    .sort((a, b) => b.score - a.score);

  // pref: city 非対応 (都道府県のみ) を機械フィルタ → 上位 prefCap
  const prefAll = active
    .filter((c) => !c.entities.includes("city"))
    .map((c) => scoreOf(c, "pref"))
    // 二値化しにくい・古すぎるノイズを落とす
    .filter((e) => (e.breakdown?.binaryFram ?? 0) >= 0.7 && (e.breakdown?.freshness ?? 0) >= 0.6)
    .sort((a, b) => b.score - a.score);
  const pref = prefAll.slice(0, prefCap);

  const ksj = buildKsjEntries(prevByKey);
  const dpf = buildDpfEntries(prevByKey);
  const gsi = buildGsiEntries(prevByKey);

  // curated lane: machine lane の metricKey **と themeId** → status を渡し dedup + status 継承させる。
  //   curated.aliases は machine の themeId (station-5k-plot 等) を参照するケースがあるため、
  //   metricKey だけでなく themeId もキーに含める (でないと ksj/gsi 系の generated 状態が継承されない)。
  const machineKeyToStatus = new Map<string, Status>();
  for (const e of [...muni, ...pref, ...ksj, ...dpf, ...gsi]) {
    machineKeyToStatus.set(e.metricKey, e.status);
    // themeId は後段 status を持つ entry のみ登録 (candidate の themeId で dedup を汚さない)
    if (e.themeId && e.status !== "candidate") {
      const existing = machineKeyToStatus.get(e.themeId);
      if (!existing) machineKeyToStatus.set(e.themeId, e.status);
    }
  }
  const curated = await buildCuratedEntries(prevByKey, machineKeyToStatus);

  const entries = [...muni, ...pref, ...ksj, ...dpf, ...gsi, ...curated];
  const state: CatalogFile = {
    generatedAt: new Date().toISOString(),
    weights: WEIGHTS,
    counts: {
      muni: muni.length,
      pref: pref.length,
      ksj: ksj.length,
      "mlit-dpf": dpf.length,
      gsi: gsi.length,
      curated: curated.length,
    },
    entries,
  };
  saveState(state);
  return state;
}

function printTop(state: CatalogFile, lane: Lane, n = 20) {
  const rows = state.entries.filter((e) => e.lane === lane && e.status === "candidate").slice(0, n);
  console.log(`\n=== ${lane} レーン top${n} (status=candidate) ===`);
  if (lane === "curated") {
    console.log("score  pri  strategy         readiness      ideaId / title");
    for (const e of rows) {
      console.log(
        `${e.score.toFixed(0).padStart(3)}    ${(e.priority ?? "-").padEnd(3)}  ${(e.landingStrategy ?? "-").padEnd(15)} ${(e.landingReadiness ?? "-").padEnd(13)} ${e.ideaId}  「${e.title}」`,
      );
    }
    return;
  }
  if (lane === "ksj" || lane === "mlit-dpf" || lane === "gsi") {
    console.log("score  renderClass      avail       key / title");
    for (const e of rows) {
      console.log(
        `${e.score.toFixed(3)}  ${(e.renderClass ?? "-").padEnd(15)} ${(e.availability ?? "-").padEnd(11)} ${e.metricKey}  「${e.title}」`,
      );
    }
    return;
  }
  console.log("score  cat                 latestY  metricKey / title");
  for (const e of rows) {
    console.log(
      `${e.score.toFixed(3)}  ${(e.category ?? "").padEnd(18)} ${(e.latestYear ?? "-").padEnd(7)} ${e.metricKey}  「${e.title}」`,
    );
  }
}

function markStatus(key: string, status: Status, themeId: string | null, note: string | null) {
  const state = loadState();
  const entry = state.entries.find((e) => e.metricKey === key);
  if (!entry) {
    console.error(`✗ metricKey が見つかりません: ${key} (先に rebuild してください)`);
    process.exit(1);
  }
  entry.status = status;
  if (status === "candidate") {
    // 候補に戻す = 未着手扱い。spec 由来の紐付けをクリアして状態を正確に保つ
    entry.themeId = null;
    entry.note = null;
  }
  if (themeId) entry.themeId = themeId;
  if (note) entry.note = note;
  saveState(state);
  console.log(`✓ ${key} → status=${status}${themeId ? ` themeId=${themeId}` : ""}`);
}

async function main() {
  const opts = parseArgs();

  if (opts.markCandidate) return markStatus(opts.markCandidate, "candidate", opts.themeId, opts.note);
  if (opts.markSpec) return markStatus(opts.markSpec, "spec", opts.themeId, opts.note);
  if (opts.markGenerated) return markStatus(opts.markGenerated, "generated", opts.themeId, opts.note);
  if (opts.markPosted) return markStatus(opts.markPosted, "posted", opts.themeId, opts.note);
  if (opts.markRejected) return markStatus(opts.markRejected, "rejected", opts.themeId, opts.note);

  if (opts.next != null) {
    const state = loadState();
    // 既定は curated (SNS 企画の主レーン)。--lane で machine レーンも指定可
    const lanes: Lane[] = opts.lane ? [opts.lane] : ["curated"];
    let rows = state.entries.filter((e) => lanes.includes(e.lane) && e.status === "candidate");
    // curated は eligible かつ landing が blocked でないものを優先 (hard gate)
    if (lanes.includes("curated")) {
      rows = rows.filter((e) => e.lane !== "curated" || (e.eligible && e.landingReadiness !== "blocked"));
    }
    for (const e of rows.slice(0, opts.next)) console.log(JSON.stringify(e));
    return;
  }

  const state = await rebuild(opts.prefCap);
  console.log(
    `カタログ再構築: muni ${state.counts.muni} / pref ${state.counts.pref} (上限 ${opts.prefCap}) / ` +
      `ksj ${state.counts.ksj} / mlit-dpf ${state.counts["mlit-dpf"]} / gsi ${state.counts.gsi} / ` +
      `curated ${state.counts.curated}`,
  );
  console.log(`SSOT: ${STATE_PATH}`);
  printTop(state, "curated");
  printTop(state, "muni");
  printTop(state, "pref");
  printTop(state, "ksj");
  printTop(state, "mlit-dpf");
  printTop(state, "gsi");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
