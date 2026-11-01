/**
 * テーマの設計案 (読者の悩み → 問いの章 → 見せ方のブロック) を機械の検査に通し、ThemeCatalog の章と指標カードを書き換える。
 *
 * 設計案は NotebookLM が白書を参照して作る (ask-notebooklm.mjs)。ここではモデルの判断を信用せず、データの形で
 * 見せ方を決め直す (2026-10-31。theme-catalog-standards.md §3 の対応表)。
 *   - trend: 2 年以上ある指標だけ。1 枚 3 指標・単位 2 種まで。単年の指標は stat へ
 *   - stat: 1 指標 1 枚 (値・順位・47 都道府県の中の位置)
 *   - ranking: 47 都道府県の比較はランキングのページが受け持つ (2026-10-31 オーナー決定) ので、1 指標ずつの stat にする
 *   - sex: 同じ単位の [男, 女] で 2 年以上あるもの。単年なら 2 枚の stat、それ以外は trend か stat へ
 *   - composition: 同じ単位の 2〜6 指標。構成比のチャートを章に足し、指標のタイルは値だけになる
 * 章の説明はモデルの注意書きを使わない (確かめていない事実を含むため)。
 * 案に無い指標は最後の章へ stat で足す。主指標 (primary) は落とさない。落とした指標は context (全指標の一覧だけ) にする。
 * 既存のチャート・埋め込み・考察の章は、指標が最も重なる章へ移す (人が個別に作った図は残す)。単位の混ざった構成比・
 * 単年の推移のチャートだけを外す。完全に同じ指標の折れ線とカードは描画側 (chartDuplicatesMetrics) が 1 つにまとめる。
 *
 * 使い方: npx tsx .claude/scripts/themes/dashboard-design/apply-design.ts [--write] [theme ...]
 *   入力: .local/theme-design/inventory.json (build-inventory.ts) と .local/theme-design/proposals/<theme>.json
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { getMetricConfig } from "@stats47/data-configs";

import { datasetDir } from "../../../../config/datasets.mjs";
import { normalizeUnitForAxis } from "@stats47/data-configs/theme-catalog/types";

const PROJECT_ROOT = resolve(__dirname, "../../../..");
const CATALOG_DIR = resolve(PROJECT_ROOT, datasetDir("themes.catalogs"));
const WORK_DIR = resolve(PROJECT_ROOT, ".local/theme-design");

type View = "trend" | "stat" | "ranking" | "sex" | "composition";
interface Block { view: View; title: string; rankingKeys: string[] }
interface Proposal {
  chapters: { key: string; title: string; concern: string; description: string; blocks: Block[] }[];
  drop: string[];
}
interface MetricInfo { years?: number; range?: [string, string] | null }

const MAX_TREND_KEYS = 3;
const MAX_COMPOSITION_KEYS = 6;
const LINE_TYPES = new Set(["line-chart"]);

/**
 * 構成比にしない組 (人が中身を見て決めた。2026-10-31)。単位が同じでも、足して全体にならない (一部の内訳だけ・内数) なら
 * 構成比は誤読を生む。ラベルに「内数」「総」がある組は規則で外し、それ以外をここに理由つきで書く。
 */
const COMPOSITION_REJECTS: { theme: string; keysIncluding: string; reason: string }[] = [
  { theme: "forestry-timber", keysIncluding: "mushroom", reason: "林業産出額の一部の品目だけで全体にならない" },
  { theme: "household-assets-debt", keysIncluding: "deposit-balance-ratio", reason: "金融資産に占める割合の一部の項目だけで全体にならない" },
  { theme: "safety", keysIncluding: "individual-evacuation-plan", reason: "計画を作った人数は名簿の人数の内数" },
  { theme: "local-finance", keysIncluding: "return-gift", reason: "返礼品の調達費・送付費は募集費の内数で、2 つで全体にならない" },
  { theme: "water-services", keysIncluding: "aged-pipe", reason: "耐用年数を過ぎた延長は総延長の内数" },
];

const args = process.argv.slice(2);
const write = args.includes("--write");
const only = args.filter((a) => !a.startsWith("--"));
const inventory = JSON.parse(readFileSync(resolve(WORK_DIR, "inventory.json"), "utf8")) as {
  metricInfo: Record<string, MetricInfo>;
};

const unitOf = (key: string) => normalizeUnitForAxis(String(getMetricConfig(key)?.unit ?? ""));
const yearsOf = (key: string) => inventory.metricInfo[key]?.years ?? 0;
const kebab = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "chapter";
const unitCount = (keys: string[]) => new Set(keys.map(unitOf)).size;

/** 単位 2 種・件数の上限で前から詰め、あふれた指標を返す */
function takeWithinAxes(keys: string[], max: number): [string[], string[]] {
  const kept: string[] = [];
  const rest: string[] = [];
  for (const k of keys) {
    if (kept.length < max && unitCount([...kept, k]) <= 2) kept.push(k);
    else rest.push(k);
  }
  return [kept, rest];
}

/** 1 つのブロックをデータの形に合う見せ方へ直す (直せない分は 1 指標ずつの stat に分ける) */
function normalizeBlock(block: Block): Block[] {
  const keys = block.rankingKeys;
  if (keys.length === 0) return [];
  const stats = (ks: string[]) => ks.map((k) => ({ view: "stat" as const, title: "", rankingKeys: [k] }));
  switch (block.view) {
    case "sex": {
      // 推移を重ねられる 2 年以上の組だけ男女の色で重ねる。単年なら数値カードを 2 枚並べる (推移の無い空のグラフを出さない)
      if (keys.length === 2 && unitCount(keys) === 1 && keys.every((k) => yearsOf(k) >= 2)) return [{ ...block, view: "sex" }];
      if (keys.length === 2 && unitCount(keys) === 1) return stats(keys);
      return normalizeBlock({ ...block, view: "trend" });
    }
    case "composition": {
      const labels = keys.map((k) => String(getMetricConfig(k)?.title ?? ""));
      const nested = labels.some((l) => /内数|総/.test(l));
      if (!nested && keys.length >= 2 && keys.length <= MAX_COMPOSITION_KEYS && unitCount(keys) === 1) return [block];
      return stats(keys);
    }
    case "trend": {
      const multi = keys.filter((k) => yearsOf(k) >= 2);
      const [kept, rest] = takeWithinAxes(multi, MAX_TREND_KEYS);
      const single = keys.filter((k) => yearsOf(k) < 2);
      if (kept.length === 0) return stats(keys);
      const head: Block[] = kept.length === 1 ? stats(kept) : [{ ...block, rankingKeys: kept }];
      return [...head, ...stats([...rest, ...single])];
    }
    default:
      return stats(keys);
  }
}

function chartRefs(chart: Record<string, any>): string[] {
  const p = chart.componentProps ?? {};
  return ["seriesRefs", "columnSeriesRefs", "lineSeriesRefs"].flatMap((f) =>
    Array.isArray(p[f]) ? p[f].map((r: any) => r?.metricKey).filter(Boolean) : []
  );
}

/** 外すチャート: 単位の混ざった構成比・ドーナツ、全系列が単年の折れ線 */
function isBrokenChart(chart: Record<string, any>): string | null {
  const refs = chartRefs(chart);
  if ((chart.componentType === "composition-chart" || chart.componentType === "donut-chart") && unitCount(refs) > 1)
    return "単位の違う指標を構成比にしている";
  if (LINE_TYPES.has(chart.componentType) && refs.length > 0 && refs.every((k) => yearsOf(k) < 2))
    return "単年の指標で推移を描いている";
  return null;
}

/** 機械で足した章 (指標の拡充で末尾に付けた章・テーマ全体を 1 章に入れた章)。人が問いを決めた章とは扱いを分ける */
const isAutoSectionKey = (key: string) => /^candidate-/.test(key) || /-overview$/.test(key);

/**
 * 47 都道府県の比較の設定 (comparisonYear / comparisonMap) を外す (2026-10-31 オーナー決定。比較はランキングのページ)。
 * 年を固定して並べていた複数指標のカードは、全指標が 2 年以上あれば推移の切り替えカードのまま残し、
 * 単年の指標を含むなら 1 指標ずつの数値カードに分ける。
 */
function stripComparison(group: Record<string, any>, labelOf: (k: string) => string): Record<string, any>[] {
  const { comparisonYear, comparisonMap: _map, ...rest } = group;
  if (!comparisonYear || rest.rankingKeys.length <= 1) return [rest];
  // どの指標も 2 年以上あるなら、同じ束のまま推移の切り替えカードにする (初期表示は 1 本)
  if ((rest.rankingKeys as string[]).every((k) => yearsOf(k) >= 2)) {
    return [{ ...rest, defaultCheckedKeys: [rest.defaultCheckedKeys?.[0] ?? rest.rankingKeys[0]] }];
  }
  return rest.rankingKeys.map((k: string, i: number) => ({
    key: `${rest.key}-${i + 1}`,
    title: i === 0 ? rest.title : labelOf(k),
    rankingKeys: [k],
    defaultCheckedKeys: [k],
  }));
}

function applyTheme(themeKey: string, stripOnly = false): string[] {
  const proposalPath = resolve(WORK_DIR, "proposals", `${themeKey}.json`);
  const catalogPath = resolve(CATALOG_DIR, `${themeKey}.json`);
  if (!existsSync(catalogPath) || (!stripOnly && !existsSync(proposalPath))) return [`${themeKey}: 案が無い`];
  const proposal: Proposal = stripOnly
    ? { chapters: [], drop: [] }
    : (JSON.parse(readFileSync(proposalPath, "utf8")) as Proposal);
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  const log: string[] = [];

  const metrics = catalog.metrics as { rankingKey: string; shortLabel?: string; role: string }[];
  const visible = new Set(metrics.filter((m) => m.role !== "context").map((m) => m.rankingKey));
  const primary = new Set(metrics.filter((m) => m.role === "primary").map((m) => m.rankingKey));
  const labelOf = (k: string) => metrics.find((m) => m.rankingKey === k)?.shortLabel ?? getMetricConfig(k)?.title ?? k;
  const markdownKeys = new Set(
    (catalog.charts ?? []).filter((c: any) => c.componentType === "markdown-section").map((c: any) => c.componentKey as string)
  );

  // 既存の章を 3 つに分ける: 人が問いを決めた章 (そのまま残す)・機械で足した章 (組み直す)・考察だけの章 (末尾に残す)
  const oldSections = (catalog.sections ?? []) as Record<string, any>[];
  const oldGroups = (catalog.metricGroups ?? []) as Record<string, any>[];
  const isText = (sec: Record<string, any>) =>
    (sec.metricGroupKeys ?? []).length === 0 &&
    (sec.embeddedSectionKeys ?? []).length === 0 &&
    (sec.chartKeys ?? []).length > 0 &&
    (sec.chartKeys ?? []).every((k: string) => markdownKeys.has(k));
  const textSections = oldSections.filter(isText);
  const humanSections = oldSections.filter((sec) => !isText(sec) && (stripOnly || !isAutoSectionKey(sec.key)));
  const autoSections = oldSections.filter((sec) => !isText(sec) && !stripOnly && isAutoSectionKey(sec.key));

  // 人の章のカードは残す (比較の設定だけ外す)
  const groups: Record<string, any>[] = [];
  const keptSections: Record<string, any>[] = humanSections.map((sec) => {
    const groupKeys = (sec.metricGroupKeys as string[]).flatMap((gk) => {
      const old = oldGroups.find((g) => g.key === gk);
      if (!old) return [];
      const converted = stripComparison(old, labelOf);
      if (converted.length > 1) log.push(`比較カード ${gk} を数値カード ${converted.length} 枚に分ける`);
      groups.push(...converted);
      return converted.map((g) => g.key as string);
    });
    return { ...sec, metricGroupKeys: groupKeys, chartKeys: [...(sec.chartKeys ?? [])], embeddedSectionKeys: [...(sec.embeddedSectionKeys ?? [])] };
  });
  const fixedKeys = new Set(groups.flatMap((g) => g.rankingKeys as string[]));
  const dropped = new Set(proposal.drop.filter((k) => visible.has(k) && !primary.has(k) && !fixedKeys.has(k)));
  const used = new Set<string>(fixedKeys);

  // 機械で足した章の指標だけを、設計案の問いの章へ組み直す
  const chapterKeys = new Set<string>(oldSections.filter((sec) => !autoSections.includes(sec)).map((sec) => sec.key));
  const chapters = proposal.chapters.map((ch) => {
    let key = kebab(ch.key);
    while (chapterKeys.has(key)) key = `${key}-2`;
    chapterKeys.add(key);
    const blocks = ch.blocks.flatMap((b) => {
      const keys = b.rankingKeys.filter((k) => visible.has(k) && !used.has(k) && !dropped.has(k));
      keys.forEach((k) => used.add(k));
      const rejected =
        b.view === "composition" &&
        COMPOSITION_REJECTS.find((r) => r.theme === themeKey && keys.some((k) => k.includes(r.keysIncluding)));
      if (rejected) log.push(`構成比「${b.title}」を外す (${rejected.reason})`);
      return normalizeBlock({ view: rejected ? "trend" : b.view, title: b.title, rankingKeys: keys });
    });
    // モデルが書いた注意書きは確かめていない事実を含むので載せない
    return { key, title: ch.title, concern: ch.concern, blocks };
  }).filter((ch) => ch.blocks.length > 0);

  // 案に無い指標は、key の先頭の語が最も多く一致する指標のある章へ数値カードで足す
  // 章を組み直さないテーマ (専用ページ) は、カードに無い指標を専用の部品が描くので足さない
  const missing = stripOnly ? [] : [...visible].filter((k) => !used.has(k) && !dropped.has(k));
  const sharedPrefix = (a: string, b: string) => {
    const [x, y] = [a.split("-"), b.split("-")];
    let n = 0;
    while (n < x.length && n < y.length && x[n] === y[n]) n += 1;
    return n;
  };
  const orphanCards: string[] = [];
  for (const k of missing) {
    let home = chapters.at(-1);
    let best = 0;
    for (const ch of chapters) {
      const score = Math.max(0, ...ch.blocks.flatMap((b) => b.rankingKeys.map((other) => sharedPrefix(k, other))));
      if (score > best) [home, best] = [ch, score];
    }
    if (home) home.blocks.push({ view: "stat", title: "", rankingKeys: [k] });
    else orphanCards.push(k);
  }
  if (missing.length > 0) log.push(`案に無い ${missing.length} 指標を近い章へ`);

  // 新しい章のカードと構成比のチャート
  const groupKeySet = new Set(groups.map((g) => g.key as string));
  const newCharts: Record<string, any>[] = [];
  const newSections = chapters.map((ch) => {
    const groupKeys: string[] = [];
    const chartKeys: string[] = [];
    ch.blocks.forEach((b, i) => {
      let gkey = `${ch.key}-${i + 1}`;
      while (groupKeySet.has(gkey)) gkey = `${gkey}-2`;
      groupKeySet.add(gkey);
      // 1 指標のカードは人が付けた短い名前 (分母などの区別を含む) を見出しにする
      const title = b.rankingKeys.length === 1 ? labelOf(b.rankingKeys[0]) : b.title || labelOf(b.rankingKeys[0]);
      const group: Record<string, any> = { key: gkey, title, rankingKeys: b.rankingKeys };
      group.defaultCheckedKeys = b.view === "trend" || b.view === "sex" ? b.rankingKeys.slice(0, MAX_TREND_KEYS) : [b.rankingKeys[0]];
      if (b.view === "sex") group.view = "sex";
      groups.push(group);
      groupKeys.push(gkey);
      if (b.view === "composition") {
        const cfg = getMetricConfig(b.rankingKeys[0]) as { source?: { displayName?: string; url?: string } } | undefined;
        const componentKey = `${themeKey}-${ch.key}-composition-${i + 1}`;
        newCharts.push({
          componentKey,
          componentType: "composition-chart",
          // 同じ章の値のカードと見出しが重ならないよう、構成比と明示する
          title: /構成比/.test(title) ? title : `${title}（構成比）`,
          componentProps: {
            seriesRefs: b.rankingKeys.map((k, n) => ({ metricKey: k, label: labelOf(k), colorRole: `series-${n + 1}` })),
          },
          relatedRankingKeys: b.rankingKeys,
          ...(cfg?.source?.displayName ? { sourceName: cfg.source.displayName } : {}),
          ...(cfg?.source?.url ? { sourceLink: cfg.source.url } : {}),
          gridColumnSpan: 12,
          gridColumnSpanTablet: null,
          gridColumnSpanSm: null,
          dataSource: "ranking",
          section: ch.key,
          sortOrder: 100 + newCharts.length,
        });
        chartKeys.push(componentKey);
      }
    });
    return {
      key: ch.key,
      title: ch.title,
      ...(ch.concern ? { concern: ch.concern } : {}),
      metricGroupKeys: groupKeys,
      chartKeys,
      embeddedSectionKeys: [] as string[],
    };
  });
  if (orphanCards.length > 0 && keptSections.length > 0) {
    const last = keptSections.at(-1)!;
    for (const k of orphanCards) {
      const gkey = `${last.key}-${k}`;
      groups.push({ key: gkey, title: labelOf(k), rankingKeys: [k], defaultCheckedKeys: [k] });
      last.metricGroupKeys.push(gkey);
    }
  }
  const contentSections: Record<string, any>[] = [...keptSections, ...newSections];
  if (contentSections.length === 0) return [`${themeKey}: 有効な章が無い`];

  // 既存のチャート: 人の章のものはそのまま。機械の章のものは最も重なる章へ移す。単位の混ざった構成比は外す。
  // 新しい構成比と同じ指標の既存の図は、人が書いた注記を持つので既存の図を残して新しい図を作らない
  const keysOfSection = (sec: Record<string, any>) =>
    new Set((sec.metricGroupKeys as string[]).flatMap((g) => (groups.find((x) => x.key === g)?.rankingKeys as string[]) ?? []));
  const humanChartKeys = new Set(keptSections.flatMap((sec) => sec.chartKeys as string[]));
  const keptCharts: Record<string, any>[] = [];
  const markdownOnly: Record<string, any>[] = [];
  const replacedNew = new Set<string>();
  for (const chart of catalog.charts ?? []) {
    if (chart.componentType === "markdown-section") {
      markdownOnly.push(chart);
      continue;
    }
    const broken = isBrokenChart(chart);
    const isHuman = humanChartKeys.has(chart.componentKey);
    if (broken && (!isHuman || broken.startsWith("単位"))) {
      log.push(`チャート ${chart.componentKey} を外す (${broken})`);
      for (const sec of keptSections) sec.chartKeys = (sec.chartKeys as string[]).filter((k) => k !== chart.componentKey);
      continue;
    }
    const refKey = chartRefs(chart).sort().join(",");
    for (const nc of newCharts) if (chartRefs(nc).sort().join(",") === refKey) replacedNew.add(nc.componentKey);
    if (isHuman) {
      keptCharts.push(chart);
      continue;
    }
    const refs = chartRefs(chart);
    let best = contentSections.at(-1)!;
    let bestScore = -1;
    for (const sec of contentSections) {
      const ks = keysOfSection(sec);
      const score = refs.filter((k) => ks.has(k)).length;
      if (score > bestScore) [best, bestScore] = [sec, score];
    }
    (best.chartKeys as string[]).push(chart.componentKey);
    keptCharts.push({ ...chart, section: best.key });
  }
  const finalNewCharts = newCharts.filter((c) => !replacedNew.has(c.componentKey));
  for (const sec of newSections) sec.chartKeys = sec.chartKeys.filter((k) => !replacedNew.has(k));

  // 機械の章にあった埋め込み (地図・フロー) は、元の章の指標が最も重なる章へ
  for (const old of autoSections) {
    if ((old.embeddedSectionKeys ?? []).length === 0) continue;
    const oldKeys = new Set(
      (old.metricGroupKeys ?? []).flatMap((g: string) => oldGroups.find((x) => x.key === g)?.rankingKeys ?? [])
    );
    let best = contentSections[0];
    let bestScore = -1;
    for (const sec of contentSections) {
      const score = [...keysOfSection(sec)].filter((k) => oldKeys.has(k)).length;
      if (score > bestScore) [best, bestScore] = [sec, score];
    }
    (best.embeddedSectionKeys as string[]).push(...old.embeddedSectionKeys);
  }
  // どの章にも入らなかった考察は最後の章へ
  const placedText = new Set([...textSections, ...keptSections].flatMap((sec) => sec.chartKeys ?? []));
  for (const md of markdownOnly) {
    if (!placedText.has(md.componentKey)) (contentSections.at(-1)!.chartKeys as string[]).push(md.componentKey);
  }

  const cleanSections = [...contentSections, ...textSections].map((sec) => {
    const out: Record<string, unknown> = { ...sec };
    if (!out.description) delete out.description;
    if (Array.isArray(out.chartKeys) && out.chartKeys.length === 0) delete out.chartKeys;
    if (Array.isArray(out.embeddedSectionKeys) && out.embeddedSectionKeys.length === 0) delete out.embeddedSectionKeys;
    return out;
  });
  const sections = newSections;

  // 白書の論点が外したチャートを指していたら、その参照だけを外す
  const chartKeySet = new Set([...keptCharts, ...finalNewCharts, ...markdownOnly].map((c) => c.componentKey as string));
  const evidenceTopics = (catalog.evidenceTopics as Record<string, any>[] | undefined)?.map((topic) => {
    if (!Array.isArray(topic.relatedChartKeys)) return topic;
    const relatedChartKeys = topic.relatedChartKeys.filter((k: string) => chartKeySet.has(k));
    const { relatedChartKeys: _drop, ...rest } = topic;
    return relatedChartKeys.length > 0 ? { ...rest, relatedChartKeys } : rest;
  });
  const newChartsOut = finalNewCharts;

  const next = {
    ...catalog,
    ...(evidenceTopics ? { evidenceTopics } : {}),
    metrics: metrics.map((m) => (dropped.has(m.rankingKey) ? { ...m, role: "context" } : m)),
    charts: [...keptCharts, ...newChartsOut, ...markdownOnly],
    metricGroups: groups,
    sections: cleanSections,
  };
  const views = groups.map((g) => (g.view as string) ?? ((g.rankingKeys as string[]).length > 1 ? "trend" : "stat"));
  const count = (v: string) => views.filter((x) => x === v).length;
  log.unshift(
    `残した章 ${keptSections.length} / 新しい章 ${sections.length} / カード ${groups.length} (推移 ${count("trend")}・数値 ${count("stat")}・男女 ${count("sex")})・構成比 ${newChartsOut.length}・context へ ${dropped.size}`
  );
  if (write) writeFileSync(catalogPath, `${JSON.stringify(next, null, 2)}\n`);
  return log.map((l) => `${themeKey}: ${l}`);
}

// 専用ページの章構成 (splitLocalFinanceSections) を持つので章は組み直さず、比較の設定だけ外す
const SKIP = new Set(["local-finance"]);
const themes = only.length
  ? only
  : readdirSync(resolve(WORK_DIR, "proposals")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
for (const t of themes) for (const line of applyTheme(t, SKIP.has(t))) console.log(line);
