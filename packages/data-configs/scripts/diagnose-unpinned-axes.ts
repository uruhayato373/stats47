/**
 * diagnose-unpinned-axes — 形状が壊れた metric について「絞り忘れた分類軸」を機械的に列挙する。
 *
 * ## なぜこれで是正が機械化できるか
 *
 * 2026-07-30 に 3 件で検証した事実: **config が固定していない軸のコード数の積が、
 * 観測された重複倍率とほぼ一致する**。
 *
 *   smartphone-usage-students (0003457319)
 *     未指定 tab(1) × cat03(16) × cat04(8) × cat05(23) = 2,944 に対し実測倍率 2,083
 *   bed-utilization-rate (0004045406)
 *     未指定 tab(6) に対し実測倍率 6
 *   gender-wage-gap (0003426933)
 *     未指定 tab(16) × cat03(4) × cat04(51) = 3,264 (limit 打ち切りのため実測は 1,064)
 *
 * つまり「どの軸を絞り忘れたか」は getMetaInfo だけで決まる。残る判断は
 * 「その軸のどのコードが正しいか」だけで、これは metric の title / description と
 * 軸のコード名を突き合わせれば決められる。194 件を 1 件ずつ手探りする必要はない。
 *
 * ## ★「総数を pin する」を既定にしてはならない (2026-07-30 に一度誤った)
 *
 * 初版は「未指定軸に総数コードがあれば総数を pin」を機械的提案にしていたが、これは危険。
 * 実例: `hobby-participation-rate-art-appreciation` (美術鑑賞の行動者率) の未指定軸は
 * 「趣味・娯楽の種類」で、正しいコードは `02=美術鑑賞`。総数を pin すると**全趣味の合計**が
 * 美術鑑賞の値として配信される。これは今直そうとしている欠陥 (別系列の値が入っている) を
 * 新たに作るのと同じで、しかも形状ゲートは 47 行 1 系列になるので**通ってしまう**。
 *
 * 正しい判定材料は **metric の title と軸コード名の一致**。総数が正しいのは
 * 「title が特定メンバーを指していない」場合に限る。
 *
 * ## 出力する分類
 *
 *   pin-match          title と一致するコードが 1 つ → そのコードを pin (最も確度が高い)
 *   needs-calculation  unit が % なのに軸は実数の内訳 → 分子/分母の calculation が要る
 *   pin-total          title が特定メンバーを指さず総数がある → 総数を pin
 *   ambiguous          一致なし / 複数一致 / 未指定軸が複数 → コード一覧を見て判断
 *   time               時間軸に年計以外が混ざる → timeScope:"annual" を足す
 *   unexplained        未指定軸なし → 別要因 (area コード形式・calculation 等) を個別調査
 *   meta-missing       メタ未取得 → --fetch するか fetch-estat-meta.mjs を先に走らせる
 *
 * メタは `.claude/state/estat/meta/<statsDataId>.json` を再利用する
 * (`.claude/scripts/estat/fetch-estat-meta.mjs --ids <...> --full` が生成)。
 * `--fetch` を付ければ本スクリプトが未取得ぶんを取りに行く (要 NEXT_PUBLIC_ESTAT_APP_ID)。
 *
 * 使い方:
 *   npx tsx packages/data-configs/scripts/diagnose-unpinned-axes.ts
 *   npx tsx packages/data-configs/scripts/diagnose-unpinned-axes.ts --fetch
 *   npx tsx packages/data-configs/scripts/diagnose-unpinned-axes.ts --wave 1
 *   npx tsx packages/data-configs/scripts/diagnose-unpinned-axes.ts --json /tmp/axes.json
 *
 * read-only (R2 書き込みも config 書き換えもしない)。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isTotalName,
  matchCodeByTitle,
  normalizeCodeName,
  normalizeTitle,
  tabProvidesRate,
  type AxisCode,
} from "../src/axis-match.js";
import { EXPECTED_SHAPE_ANOMALY } from "../src/expected-shape-anomaly.js";
import { getMetricConfig } from "../src/registry.js";
import type { MetricConfig, SourceConfig } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const META_DIR = resolve(REPO_ROOT, ".claude/state/estat/meta");

/** `.claude/scripts/estat/fetch-estat-meta.mjs` が書く形 */
interface MetaDump {
  statsDataId: string;
  title?: string;
  error?: string;
  dimensions?: Array<{
    id: string;
    name: string;
    valueCount: number;
    sampleValues?: Array<{ code: string; name: string; unit?: string | null }>;
    hasTotal?: boolean;
  }>;
}

type Wave =
  | "pin-match"
  | "pin-multi"
  | "needs-calculation"
  | "pin-total"
  | "ambiguous"
  | "time"
  | "meta-missing"
  | "no-estat"
  | "unexplained";

interface Diagnosis {
  key: string;
  statsDataId: string;
  title: string;
  /** allowlist に記録された実測重症度 (= 観測倍率の目安) */
  observedSeverity: number;
  pinned: string[];
  unpinned: Array<{ id: string; name: string; count: number; hasTotal: boolean; codes: string }>;
  /** 未指定軸のコード数の積 */
  product: number;
  wave: Wave;
  /** 機械的に提案できる pin (wave1 のみ) */
  suggestion?: string;
  note?: string;
}

interface Args {
  fetch: boolean;
  json?: string;
  wave?: string;
  limit?: number;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = { fetch: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--fetch") out.fetch = true;
    else if (a === "--json") out.json = argv[++i];
    else if (a === "--wave") out.wave = argv[++i];
    else if (a === "--limit") out.limit = Number(argv[++i]);
  }
  return out;
}

function readAppId(): string | null {
  if (process.env.NEXT_PUBLIC_ESTAT_APP_ID) return process.env.NEXT_PUBLIC_ESTAT_APP_ID;
  const envPath = resolve(REPO_ROOT, ".env.local");
  if (!existsSync(envPath)) return null;
  const line = readFileSync(envPath, "utf8")
    .split("\n")
    .find((l) => l.startsWith("NEXT_PUBLIC_ESTAT_APP_ID="));
  return line?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "") ?? null;
}

function asArray<T>(x: T | T[] | undefined | null): T[] {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

/** getMetaInfo を叩いて fetch-estat-meta.mjs と同じ形にして保存する */
async function fetchMeta(statsDataId: string, appId: string): Promise<MetaDump> {
  const params = new URLSearchParams({ appId, lang: "J", statsDataId });
  const res = await fetch(`https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?${params}`);
  if (!res.ok) return { statsDataId, error: `HTTP ${res.status}` };
  const json = (await res.json()) as Record<string, any>;
  const meta = json?.GET_META_INFO?.METADATA_INF;
  if (!meta) {
    return { statsDataId, error: json?.GET_META_INFO?.RESULT?.ERROR_MSG ?? "no METADATA_INF" };
  }
  const tableInf = meta.TABLE_INF ?? {};
  const dimensions = asArray(meta.CLASS_INF?.CLASS_OBJ).map((co: any) => {
    const values = asArray(co.CLASS);
    return {
      id: String(co["@id"]),
      name: String(co["@name"]),
      valueCount: values.length,
      sampleValues: values.map((v: any) => ({
        code: String(v["@code"]),
        name: String(v["@name"]),
        unit: v["@unit"] ?? null,
      })),
      hasTotal: values.some((v: any) => /総数|全体|計$/.test(String(v["@name"] ?? ""))),
    };
  });
  const title =
    typeof tableInf.TITLE === "string" ? tableInf.TITLE : (tableInf.TITLE?.$ ?? "");
  return { statsDataId, title: String(title), dimensions };
}

function loadCachedMeta(statsDataId: string): MetaDump | null {
  const p = resolve(META_DIR, `${statsDataId}.json`);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8")) as MetaDump;
  } catch {
    return null;
  }
}

/** config が固定している軸の id 集合 */
function pinnedAxes(src: Extract<SourceConfig, { kind: "estat" }>): Set<string> {
  const out = new Set<string>();
  if (src.cdCat01) out.add("cat01");
  if (src.cdCat02) out.add("cat02");
  if (src.cdCat03) out.add("cat03");
  if (src.cdCat04) out.add("cat04");
  if (src.cdCat05) out.add("cat05");
  // tabCombination は複数 tab を線形結合するので tab 軸は解決済み扱い
  if (src.cdTab || (src.tabCombination && src.tabCombination.length > 0)) out.add("tab");
  // axisSum はその軸のメンバーを合算するので同じく解決済み扱い
  if (src.axisSum && src.axisSum.codes.length > 0) out.add(src.axisSum.axis);
  return out;
}

/** kakei-chousa は filter を estat と同形に写す (page-data-batch と同じ扱い) */
function estatSourceOf(config: MetricConfig): Extract<SourceConfig, { kind: "estat" }> | null {
  if (config.source.kind === "estat") return config.source;
  if (config.source.kind === "kakei-chousa") {
    const f = (config.source.filter ?? {}) as { statsDataId?: string; cdCat01?: string; cdCat02?: string };
    if (!f.statsDataId) return null;
    return { kind: "estat", statsDataId: f.statsDataId, cdCat01: f.cdCat01, cdCat02: f.cdCat02 };
  }
  return null;
}

function diagnose(key: string, observedSeverity: number, meta: MetaDump | null): Diagnosis | null {
  const config = getMetricConfig(key);
  if (!config) return null;
  const src = estatSourceOf(config);
  if (!src) {
    return {
      key,
      statsDataId: "-",
      title: config.title,
      observedSeverity,
      pinned: [],
      unpinned: [],
      product: 0,
      wave: "no-estat",
      note: `source.kind=${config.source.kind} は本診断の対象外`,
    };
  }

  const pinned = pinnedAxes(src);
  const base = {
    key,
    statsDataId: src.statsDataId,
    title: config.title,
    observedSeverity,
    pinned: [...pinned].sort(),
  };

  if (!meta || meta.error || !meta.dimensions) {
    return {
      ...base,
      unpinned: [],
      product: 0,
      wave: "meta-missing",
      note: meta?.error ?? "メタ未取得",
    };
  }

  // area / time は絞る対象ではない。要素数 1 の軸も重複を生まないので除外する。
  const unpinnedDims = meta.dimensions.filter(
    (d) => d.id !== "area" && d.id !== "time" && !pinned.has(d.id) && d.valueCount > 1,
  );

  const unpinned = unpinnedDims.map((d) => ({
    id: d.id,
    name: d.name,
    count: d.valueCount,
    hasTotal: Boolean(d.hasTotal),
    // コード名を突き合わせて選べるよう先頭を出す (全量は meta キャッシュにある)
    codes: (d.sampleValues ?? [])
      .slice(0, 8)
      .map((v) => `${v.code}=${v.name}`)
      .join(" / "),
  }));

  const product = unpinned.reduce((acc, d) => acc * d.count, 1);

  // 時間軸に年計以外 (月次・四半期) が混ざっていないか。
  // extractYearCode が 4 桁に潰すため、年計以外があると同じ年に複数行できる。
  //
  // ★「年計コードの形 (YYYY000000) でないもの」を非年計と見なしてはならない
  //   (2026-07-30 実測)。社会・人口統計体系 (SSDS) の年度コードは `1975100000` で、
  //   1 年 1 コードしかないのに形だけ見ると非年計に見える。この誤判定で
  //   timeScope:"annual" を 17 metric に付けたところ全件 0 行になり、
  //   既存データを消しかけた (0 件ゲートが止めた)。
  //
  //   正しい判定は 2 条件の AND:
  //     (a) 同じ年 (先頭 4 桁) に複数のコードがある = 粒度が混在している
  //     (b) その中に年計コード (YYYY000000) が実在する = timeScope で残すものがある
  //   (b) が無いのに timeScope を付けると全部落ちる。
  const timeCodes = (meta.dimensions.find((d) => d.id === "time")?.sampleValues ?? []).map(
    (v) => v.code,
  );
  const byYear = new Map<string, number>();
  for (const c of timeCodes) {
    const y = c.slice(0, 4);
    byYear.set(y, (byYear.get(y) ?? 0) + 1);
  }
  const mixedGranularity = [...byYear.values()].some((n) => n > 1);
  const hasAnnualCode = timeCodes.some((c) => /^\d{4}0{6}$/.test(c));
  const nonAnnualTime = src.timeScope !== "annual" && mixedGranularity && hasAnnualCode;

  if (unpinned.length === 0) {
    return {
      ...base,
      unpinned,
      product,
      wave: nonAnnualTime ? "time" : "unexplained",
      ...(nonAnnualTime
        ? { suggestion: `timeScope: "annual"` }
        : { note: "未指定軸なし。area コード形式・calculation・別要因を個別調査" }),
    };
  }

  const timeNote = nonAnnualTime ? { note: `timeScope:"annual" も併せて要る` } : {};
  // unit が % でも、表章項目が率を返す表 (社会生活基本調査の行動者率など) なら
  // 該当メンバーを pin するだけでよい。実数の表のときだけ calculation が要る。
  const tabCodes = (meta.dimensions?.find((d) => d.id === "tab")?.sampleValues ?? []) as AxisCode[];
  const needsRatio =
    (config.unit === "%" || config.unit === "％") && !tabProvidesRate(tabCodes, src.cdTab);

  if (unpinned.length === 1) {
    const only = unpinned[0];
    const dim = unpinnedDims[0];
    const param = only.id === "tab" ? "cdTab" : `cdCat${only.id.replace("cat", "")}`;
    const codes = dim.sampleValues ?? [];
    const matched = matchCodeByTitle(config.title, codes);

    if (matched && matched !== "ambiguous") {
      // ★unit が % で、当てたコードが実数の内訳なら「pin して終わり」にはならない。
      //   率 = 当該メンバー / 総数 なので分子分母の 2 セルが要る。
      if (needsRatio && only.hasTotal) {
        return {
          ...base,
          unpinned,
          product,
          wave: "needs-calculation",
          suggestion:
            `分子 ${param}="${matched.code}" (${matched.name}) / ` +
            `分母 ${param}="${codes.find((c) => isTotalName(c.name))?.code ?? "総数"}"`,
          note: `unit が「${config.unit}」なので単一セルの pin では率にならない`,
        };
      }
      return {
        ...base,
        unpinned,
        product,
        wave: "pin-match",
        suggestion: `${param}: "${matched.code}"  // ${matched.name}`,
        ...timeNote,
      };
    }

    if (matched === "ambiguous") {
      return {
        ...base,
        unpinned,
        product,
        wave: "ambiguous",
        note: "title に一致するコードが複数ある。コード一覧を見て選ぶ",
      };
    }

    // 一致するコードが無くても、実数の表で % を求めているなら pin では解決しない。
    if (needsRatio && only.hasTotal) {
      return {
        ...base,
        unpinned,
        product,
        wave: "needs-calculation",
        note: `unit が「${config.unit}」だが表は実数。分子となるコードの特定から要る`,
      };
    }

    // title が特定メンバーを指していない = 集計軸を潰すだけ。ここでのみ総数が正しい。
    if (only.hasTotal) {
      const total = codes.find((v) => isTotalName(v.name));
      return {
        ...base,
        unpinned,
        product,
        wave: "pin-total",
        suggestion: total ? `${param}: "${total.code}"  // ${total.name}` : `${param}: <総数コード>`,
        note: "title が特定メンバーを指していないため総数で潰す (要確認)",
        ...timeNote,
      };
    }

    return {
      ...base,
      unpinned,
      product,
      wave: "ambiguous",
      note: `${only.name} に総数が無く title とも一致しない。コード一覧を見て選ぶ`,
      ...timeNote,
    };
  }

  // 未指定軸が複数。**軸ごとに独立に**解決する。
  //
  // 多くは「title が指す軸が 1 本 + 残りは集計軸 (男女計・産業計・総数)」という形なので、
  // 軸ごとに (a) title 一致 → (b) その軸の総数 の順で決めれば全部埋まる。
  // 総数を使うのは「その軸について title が何も言っていない」ときだけなので、
  // 単一軸のときに禁じた「総数フォールバック」の罠には当たらない
  // (title が指している軸には必ず (a) が当たるため)。
  const resolved = unpinnedDims.map((d) => {
    const param = d.id === "tab" ? "cdTab" : `cdCat${d.id.replace("cat", "")}`;
    const codes = d.sampleValues ?? [];
    const m = matchCodeByTitle(config.title, codes);
    const total = codes.find((c) => isTotalName(c.name));
    if (m && m !== "ambiguous") {
      // ★短い一致 (2 文字) は位置で真偽を分ける (2026-07-30 実測)。
      //   偶然の一致は title の途中に出る:
      //     「バリアフリー化住宅率」の "住宅" が建て方軸の「共同住宅」に当たる
      //     「太陽光発電機のある住宅率」も同じ
      //   真の一致は title の先頭に出る:
      //     「肺炎による死亡者数」の "肺炎"、「老衰による死亡者数」の "老衰"
      //   長さだけで切ると後者を総数 (= 全死因の合計) に落としてしまう。
      const matched = normalizeCodeName(m.name);
      const weak =
        matched.length < 3 && !normalizeTitle(config.title).startsWith(matched) && Boolean(total);
      if (!weak) return { param, code: m.code as string | null, label: m.name, by: "title" as const };
    }
    if (total) return { param, code: total.code as string | null, label: total.name, by: "total" as const };
    return { param, code: null as string | null, label: d.name, by: "none" as const };
  });

  // 実数の表で % を求めているなら pin では解決しない (単一軸と同じ扱い)。
  // barrier-free-housing-rate は tab=住宅数、telework-rate は tab=人口 で、
  // どちらも「該当 / 総数」の 2 セルが要る。
  if (needsRatio) {
    const memberAxis = resolved.find((r) => r.by === "title");
    return {
      ...base,
      unpinned,
      product,
      wave: "needs-calculation",
      ...(memberAxis
        ? { suggestion: `分子 ${memberAxis.param}="${memberAxis.code}" (${memberAxis.label}) / 分母 同軸の総数` }
        : {}),
      note: `unit が「${config.unit}」だが表は実数 (tab=${tabCodes[0]?.name ?? "?"})。分子/分母の 2 セルが要る`,
    };
  }

  const unresolved = resolved.filter((r) => r.code === null);
  const fmt = (r: (typeof resolved)[number]) => `${r.param}: "${r.code}"  // ${r.label}`;

  if (unresolved.length === 0) {
    return {
      ...base,
      unpinned,
      product,
      wave: "pin-multi",
      suggestion: resolved.map(fmt).join(" , "),
      note:
        `軸 ${resolved.length} 本を解決 (title 一致 ${resolved.filter((r) => r.by === "title").length} / ` +
        `総数 ${resolved.filter((r) => r.by === "total").length})`,
      ...timeNote,
    };
  }

  const done = resolved.filter((r) => r.code !== null);
  return {
    ...base,
    unpinned,
    product,
    wave: "ambiguous",
    ...(done.length > 0 ? { suggestion: `一部のみ判明: ${done.map(fmt).join(" , ")}` } : {}),
    note:
      `未指定軸 ${unpinned.length} 本のうち ${unresolved.length} 本が未解決 ` +
      `(${unresolved.map((r) => `${r.param}=${r.label}`).join(", ")})。title 一致も総数も無い`,
    ...timeNote,
  };
}

async function main(): Promise<void> {
  const args = parseArgs();

  // 対象は allowlist の known-broken (= 是正待ちとして登録済みのもの)。
  // 同じ key が複数 check で登録されうるので重症度が最大のものを代表にする。
  const bySeverity = new Map<string, number>();
  for (const e of EXPECTED_SHAPE_ANOMALY) {
    if (e.disposition !== "known-broken") continue;
    bySeverity.set(e.key, Math.max(bySeverity.get(e.key) ?? 0, e.observedSeverity));
  }
  let keys = [...bySeverity.keys()].sort(
    (a, b) => (bySeverity.get(b) ?? 0) - (bySeverity.get(a) ?? 0),
  );
  if (args.limit) keys = keys.slice(0, args.limit);

  console.log(`# 未指定軸の診断 (${new Date().toISOString()})`);
  console.log(`対象: ${keys.length} 件 (expected-shape-anomaly の known-broken)\n`);

  // statsDataId 単位でメタを 1 回だけ引く (同じ表を共有する metric が多いため)
  const idsNeeded = new Set<string>();
  for (const key of keys) {
    const config = getMetricConfig(key);
    const src = config ? estatSourceOf(config) : null;
    if (src) idsNeeded.add(src.statsDataId);
  }
  const metaCache = new Map<string, MetaDump | null>();
  for (const id of idsNeeded) metaCache.set(id, loadCachedMeta(id));

  const uncached = [...idsNeeded].filter((id) => !metaCache.get(id));
  if (uncached.length > 0) {
    if (args.fetch) {
      const appId = readAppId();
      if (!appId) throw new Error("--fetch には NEXT_PUBLIC_ESTAT_APP_ID が要ります");
      console.log(`メタ取得: ${uncached.length} 表 (0.5s 間隔)`);
      mkdirSync(META_DIR, { recursive: true });
      for (let i = 0; i < uncached.length; i++) {
        const id = uncached[i];
        const dump = await fetchMeta(id, appId);
        writeFileSync(resolve(META_DIR, `${id}.json`), JSON.stringify(dump, null, 2));
        metaCache.set(id, dump);
        if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${uncached.length}`);
        await new Promise((r) => setTimeout(r, 500));
      }
      console.log("");
    } else {
      console.log(
        `⚠ メタ未取得 ${uncached.length} 表。--fetch を付けるか先に\n` +
          `  node .claude/scripts/estat/fetch-estat-meta.mjs --ids ${uncached.slice(0, 3).join(",")}… --full\n`,
      );
    }
  }

  const results: Diagnosis[] = [];
  for (const key of keys) {
    const config = getMetricConfig(key);
    const src = config ? estatSourceOf(config) : null;
    const meta = src ? (metaCache.get(src.statsDataId) ?? null) : null;
    const d = diagnose(key, bySeverity.get(key) ?? 0, meta);
    if (d) results.push(d);
  }

  const filtered = args.wave ? results.filter((r) => r.wave === args.wave) : results;

  const byWave = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.wave] = (acc[r.wave] ?? 0) + 1;
    return acc;
  }, {});
  console.log("## wave 別の件数");
  const labels: Record<Wave, string> = {
    "pin-match": "title と一致するコードが 1 つ (そのコードを pin)",
    "pin-multi": "未指定軸が複数だが全軸を解決できた (まとめて pin)",
    "needs-calculation": "unit が % なのに軸は実数の内訳 (分子/分母の calculation が要る)",
    "pin-total": "title が特定メンバーを指さない (総数で潰す・要確認)",
    ambiguous: "一致なし / 複数一致 / 未指定軸が複数 (コード一覧を見て判断)",
    time: "時間軸に年計以外が混在 (timeScope: annual)",
    "meta-missing": "メタ未取得",
    "no-estat": "e-Stat 以外 (対象外)",
    unexplained: "未指定軸なし (別要因。個別調査)",
  };
  for (const [wave, n] of Object.entries(byWave).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${wave.padEnd(13)} ${labels[wave as Wave] ?? ""}`);
  }

  console.log(`\n## 診断 (重症度の重い順${args.wave ? ` / wave=${args.wave}` : ""})`);
  for (const r of filtered.slice(0, 60)) {
    console.log(`\n${r.key}  [${r.wave}]  重症度 ${r.observedSeverity}  ${r.statsDataId}`);
    console.log(`  title: ${r.title}`);
    if (r.pinned.length > 0) console.log(`  pinned: ${r.pinned.join(", ")}`);
    for (const u of r.unpinned) {
      console.log(`  ★未指定 ${u.id} (${u.count}件${u.hasTotal ? "・総数あり" : ""}) ${u.name}`);
      if (u.codes) console.log(`      ${u.codes}`);
    }
    if (r.unpinned.length > 0) {
      const match = Math.abs(r.product - r.observedSeverity) / Math.max(r.observedSeverity, 1);
      console.log(
        `  積=${r.product} / 実測=${r.observedSeverity} ` +
          (match < 0.1 ? "(一致 — 原因はこの軸で確定)" : "(不一致 — 打ち切りか部分欠測の併発を疑う)"),
      );
    }
    if (r.suggestion) console.log(`  → 提案: ${r.suggestion}`);
    if (r.note) console.log(`  note: ${r.note}`);
  }
  if (filtered.length > 60) console.log(`\n… 他 ${filtered.length - 60} 件 (--json で全件)`);

  if (args.json) {
    writeFileSync(args.json, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
    console.log(`\n書き出し: ${args.json}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
