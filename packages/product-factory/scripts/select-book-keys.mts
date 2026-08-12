#!/usr/bin/env -S npx tsx
/**
 * 書籍ごとの ranking キー候補を実測してレポートする (read-only)。
 *
 * ★なぜ要るか (2026-08-12)
 *   S2/S3/S4 は pack の全キー (最大 2,179) を渡して**先頭 24 件**を章にしていた。
 *   その結果 (a) 書籍のテーマと無関係な指標が並び (b) S3 8 冊 + S4 が同じ P-12 を使うので
 *   全冊ほぼ同一の本になっていた。「どのキーを載せるか」を書籍ごとに確定させる必要がある。
 *
 * ここは**候補を出すだけ**で確定はしない。確定は `book-ranking-keys.ts` (git TS) に人が置く。
 * 判定は章コンポーザと同じゲート (values.json との数値照合) を使うので、
 * 「載せたら本文が組めるか」を出す前に確かめられる。
 *
 * Usage:
 *   npx tsx packages/product-factory/scripts/select-book-keys.mts            # 全書籍のサマリ
 *   npx tsx packages/product-factory/scripts/select-book-keys.mts --book K-S2-02 --top 40
 *   npx tsx packages/product-factory/scripts/select-book-keys.mts --book K-S2-02 --emit  # TS 断片
 */
import { KINDLE_BOOKS, S3_REGION_CODES } from "../src/channels/kindle/book-catalog";
import { fetchRankingAiContent, composeChapterBody } from "../src/channels/kindle/ai-content-composer";
import { fetchRankingValues } from "../src/data/load-ranking-values";
import { PREFECTURE_BY_CODE5 } from "../src/data/prefectures";
import { METRICS_REGISTRY } from "@stats47/data-configs";

const KNOWN_FLAGS = new Set(["--book", "--top", "--emit", "--json", "--concurrency", "--sample"]);
function assertKnownFlags(): void {
  const unknown = process.argv.slice(2).filter((a) => a.startsWith("--") && !KNOWN_FLAGS.has(a));
  if (unknown.length > 0) {
    console.error(`未知のフラグ: ${unknown.join(", ")}\n使えるのは ${[...KNOWN_FLAGS].join(" / ")} です。`);
    process.exit(2);
  }
}
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

export interface KeyProbe {
  readonly rankingKey: string;
  readonly title: string;
  /** ai-content から合成できた本文の字数 (図・定型文を除く)。0 なら章が薄いまま。 */
  readonly composedChars: number;
  readonly used: readonly string[];
  readonly dropped: readonly { field: string; reason: string }[];
  /** 1位・最下位が人口規模の大きい県か (S4「意外な1位」の選定に使う)。 */
  readonly topIsBigPref: boolean;
  readonly ratio: number | null;
  /** 全国順位つきの行 (地域スコアの算出に使う)。 */
  readonly ranked: readonly { areaCode: string; rank: number }[];
  readonly reason?: string;
}

/** 人口規模が大きく「1位になりがち」な県 (意外性のスコアリング用)。 */
const BIG_PREFS = new Set(["13000", "27000", "14000", "23000", "11000", "12000"]);

/**
 * S3 用: その地域がこの指標でどれだけ「特徴的」か。
 *
 * ★S3 の 8 冊は同じ pack (P-12) を参照しており、キー段階では全冊同じだった。
 *   本文は地域抽出で別物になるが、**載せる指標そのもの**も地域ごとに変えないと
 *   「北海道版なのに北海道が平凡な指標ばかり」になる。
 *   地域の県が上位/下位に偏っているほど高スコア (0〜1)。順位の中央値からの乖離で測る。
 */
export function regionDistinctiveness(
  ranked: readonly { areaCode: string; rank: number }[],
  regionCodes: readonly string[],
): number {
  const set = new Set(regionCodes);
  const inRegion = ranked.filter((r) => set.has(r.areaCode));
  if (inRegion.length === 0) return 0;
  const n = ranked.length;
  const mid = (n + 1) / 2;
  // 各県の「中央からの距離」を 0〜1 に正規化して平均する。
  const avg = inRegion.reduce((s, r) => s + Math.abs(r.rank - mid), 0) / inRegion.length;
  return Math.min(1, avg / (mid - 1 || 1));
}

/**
 * S4 用: 「意外な 1 位」らしさ。
 * 1 位が人口規模の大きい県だと意外性が無い (総数系は東京が 1 位になりがち)。
 * 格差が大きいほど読者の驚きが大きい。
 */
export function surpriseScore(topIsBigPref: boolean, ratio: number | null): number {
  const base = topIsBigPref ? 0 : 0.6;
  if (ratio === null || !Number.isFinite(ratio)) return base;
  // 2 倍で 0.2、10 倍以上で 0.4 に飽和させる (極端な外れ値に引っ張られないように)
  const gap = Math.min(0.4, Math.max(0, Math.log10(Math.max(1, ratio)) * 0.4));
  return base + gap;
}

/** 1 キーを実測する。R2 に無い / 薄いキーは reason 付きで返す。 */
export async function probeKey(rankingKey: string): Promise<KeyProbe> {
  const cfg = (METRICS_REGISTRY as Record<string, { title?: string; unit?: string } | undefined>)[rankingKey];
  const title = cfg?.title ?? rankingKey;
  let fetched;
  try {
    fetched = await fetchRankingValues(rankingKey);
  } catch {
    return { rankingKey, title, composedChars: 0, used: [], dropped: [], topIsBigPref: false, ratio: null, ranked: [], reason: "R2 に値が無い" };
  }
  const ranked = fetched.values
    .filter((v): v is { code5: string; value: number } => v.value !== null)
    .slice()
    .sort((a, b) => b.value - a.value)
    .map((v, i) => ({
      areaCode: v.code5,
      areaName: PREFECTURE_BY_CODE5.get(v.code5)?.name ?? v.code5,
      value: v.value,
      rank: i + 1,
    }));
  if (ranked.length < 20) {
    return { rankingKey, title, composedChars: 0, used: [], dropped: [], topIsBigPref: false, ratio: null, ranked: [], reason: `観測 ${ranked.length} 県` };
  }

  const ai = await fetchRankingAiContent(rankingKey);
  const composed = composeChapterBody({
    ai,
    gate: { values: ranked, unit: cfg?.unit, yearCode: fetched.year },
  });
  const bot = ranked[ranked.length - 1];
  const ratio = bot.value !== 0 ? ranked[0].value / bot.value : null;
  return {
    rankingKey,
    title,
    composedChars: composed.md.replace(/\s/g, "").length,
    used: composed.used,
    dropped: composed.dropped,
    topIsBigPref: BIG_PREFS.has(ranked[0].areaCode),
    ratio,
    ranked: ranked.map((r) => ({ areaCode: r.areaCode, rank: r.rank })),
  };
}

/** probe のキャッシュ。S3 8 冊 + S4 は同じキー母集団を共有するので再取得しない。 */
const probeCache = new Map<string, KeyProbe>();

/** 並列度を絞って probe する (R2 に一気に投げない)。 */
async function probeAll(keys: readonly string[], concurrency: number): Promise<KeyProbe[]> {
  const out: KeyProbe[] = [];
  for (let i = 0; i < keys.length; i += concurrency) {
    const batch = keys.slice(i, i + concurrency);
    const got = await Promise.all(
      batch.map(async (k) => {
        const hit = probeCache.get(k);
        if (hit) return hit;
        const p = await probeKey(k);
        probeCache.set(k, p);
        return p;
      }),
    );
    out.push(...got);
  }
  return out;
}

/**
 * 候補を母集団全体から拾う。
 * ★pack 内の並びは metric key の**辞書順**なので、先頭から N 件取ると "a"〜"b" に偏る
 *   (実測: 北海道版の候補が agriculture / average ばかりになった)。等間隔で間引く。
 */
export function strideSample(keys: readonly string[], limit: number): string[] {
  if (keys.length <= limit) return [...keys];
  const step = keys.length / limit;
  const out: string[] = [];
  for (let i = 0; i < limit; i++) out.push(keys[Math.floor(i * step)]);
  return out;
}

/** 書籍が現在参照しているキー列を取り出す。 */
function keysOf(bookId: string): string[] {
  const b = KINDLE_BOOKS.find((x) => x.id === bookId);
  if (!b) return [];
  const set = new Set<string>();
  for (const ch of b.chapters as Array<{ rankingKeys?: readonly string[] }>) {
    for (const k of ch.rankingKeys ?? []) set.add(k);
  }
  return [...set];
}

async function main(): Promise<void> {
  assertKnownFlags();
  const only = arg("book");
  const top = Number(arg("top") ?? 30);
  const concurrency = Number(arg("concurrency") ?? 8);
  const emit = process.argv.includes("--emit");
  const asJson = process.argv.includes("--json");

  const books = KINDLE_BOOKS.filter((b) => (only ? b.id === only : !b.id.startsWith("K-S1-")));
  if (books.length === 0) {
    console.error(only ? `書籍が見つからない: ${only}` : "対象書籍なし");
    process.exit(1);
  }

  for (const b of books) {
    const keys = keysOf(b.id);
    // 全キーを probe すると S3 は 2,179 件で重いので間引く。辞書順の先頭を取ると
    // "a"〜"b" に偏るため等間隔サンプリングにする (probe はキー単位でキャッシュされる)。
    const sample = strideSample(keys, Number(arg("sample") ?? 400));
    const probes = await probeAll(sample, concurrency);
    // 本文が組めないキーは候補から外す (章が薄いまま出しても意味がない)。
    const pool = probes.filter((p) => p.composedChars >= 600);

    // ★書籍種別で並べ方を変える。
    //   S2 = テーマ pack なのでどれも主題に沿う → 本文が厚い順
    //   S3 = 全冊が同じ pack を見ているので、**その地域が特徴的な指標**を優先しないと同じ本になる
    //   S4 = 「意外な1位・最下位」なので、1位が人口大県でない × 格差が大きいものを優先
    const regionCodes = b.id.startsWith("K-S3-") ? (S3_REGION_CODES[b.id.slice(-2)] ?? []) : [];
    const scoreOf = (p: (typeof pool)[number]): number => {
      const volume = Math.min(1, p.composedChars / 2000); // 本文量は 2,000 字で飽和
      if (regionCodes.length > 0) return regionDistinctiveness(p.ranked, regionCodes) * 0.7 + volume * 0.3;
      if (b.id === "K-S4-01") return surpriseScore(p.topIsBigPref, p.ratio) * 0.7 + volume * 0.3;
      return volume;
    };
    const usable = pool.slice().sort((a, b2) => scoreOf(b2) - scoreOf(a) || b2.composedChars - a.composedChars);

    if (asJson) {
      console.log(JSON.stringify({ book: b.id, sampled: sample.length, usable: usable.length, probes: usable.slice(0, top) }, null, 2));
      continue;
    }

    console.log(
      `\n■ ${b.id} ${b.title}\n  参照キー ${keys.length} / 実測 ${sample.length} → **本文を組めるキー ${usable.length}**`,
    );
    if (usable.length < 24) {
      console.log(`  ⚠️ 24 章に足りない (${usable.length} 件)。fresh 章を厚くするか、キー母集団を広げる`);
    }
    if (emit) {
      console.log(`\n  "${b.id}": [`);
      for (const p of usable.slice(0, top)) {
        const note =
          regionCodes.length > 0
            ? `地域特徴度 ${regionDistinctiveness(p.ranked, regionCodes).toFixed(2)}`
            : b.id === "K-S4-01"
              ? `意外性 ${surpriseScore(p.topIsBigPref, p.ratio).toFixed(2)}`
              : `[${p.used.join(",")}]`;
        console.log(`    "${p.rankingKey}", // ${p.title} — 本文 ${p.composedChars}字 / ${note}`);
      }
      console.log("  ],");
    } else {
      for (const p of usable.slice(0, Math.min(top, 8))) {
        console.log(`    ${String(p.composedChars).padStart(5)}字  ${p.title.slice(0, 30)}  [${p.used.join(",")}]`);
      }
      const dropped = probes.filter((p) => p.composedChars < 600);
      const byReason: Record<string, number> = {};
      for (const d of dropped) {
        const r = d.reason ?? (d.dropped[0]?.reason ?? "ai-content なし");
        byReason[r.slice(0, 24)] = (byReason[r.slice(0, 24)] ?? 0) + 1;
      }
      console.log(`  使えない ${dropped.length} 件の内訳: ${JSON.stringify(byReason)}`);
    }
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
