// 家計調査の台帳 (data/estat/kakei-ledger/ledger.json) を e-Stat カタログと metric config から導出する純粋関数。
// ネットワーク・fs に触れない。CLI: .claude/scripts/estat/kakei-ledger.ts / テスト: lib/__tests__/kakei-ledger.test.mjs
//
// なぜ要るか (2026-11-02): 家計調査で取れる表・品目と、そのうちどれを指標にしたか・なぜ採らなかったかを
// 機械で照合できる記録が無かった。e-Stat カタログが集計地域区分「該当なし」の表を取り込んでおらず、
// 家計調査は 126 表すべてが索引に無かったため、棚卸しは手書きの Markdown にしか残っていなかった。

export const KAKEI_STAT_CODE = "00200561";
/** 指標が使う世帯区分。cdCat02=03 = 二人以上の世帯 (農林漁家世帯を含む) */
export const KAKEI_HOUSEHOLD_TWO_PLUS = "03";

/**
 * @typedef {"amount" | "quantity"} KakeiMeasure  品目表の種類 (金額 = 支出額 / 数量 = 購入数量)
 * @typedef {"item" | "group" | "other"} KakeiItemKind
 *   item = 品目番号を持つ品目 (「371 ぎょうざ」)、group = 十大費目・中分類 (「1.1 穀類」)、other = 世帯属性や合計 (「世帯人員」「消費支出」)
 * @typedef {"adopted" | "planned" | "excluded" | "undecided"} KakeiStatus
 *   adopted = 指標か作成済みの分析単位がある (metric config・kakei-analysis-catalog.ts から導出)、planned = 候補の分析単位か decisions.json の予定、
 *   excluded = decisions.json の判断、undecided = 判断なし
 * @typedef {{ key: string, via: "single" | "sum" }} KakeiMetricLink  sum = 複数品目の合算 (axisSum) の一部
 *
 * @typedef {object} KakeiLedgerTable
 * @property {string} statsDataId
 * @property {string} title
 * @property {string | null} cycle
 * @property {string | null} updatedDate
 * @property {string[]} collectAreas
 * @property {string | null} timeKind
 * @property {{ from: string, to: string, count: number } | null} years
 * @property {number | null} areaCount
 * @property {{ id: string, name: string | null, count: number }[]} dims
 * @property {string[]} metrics  この表を使う指標の key
 * @property {string[]} analyses  この表を使う分析単位の id (kakei-analysis-catalog.ts)
 * @property {KakeiStatus} status
 * @property {string | null} reason
 *
 * @typedef {object} KakeiLedgerItem
 * @property {string} code  e-Stat の cat01 コード
 * @property {string} name
 * @property {KakeiMeasure} measure
 * @property {string} statsDataId
 * @property {KakeiItemKind} kind
 * @property {string | null} level
 * @property {string | null} parentCode
 * @property {string | null} unit
 * @property {KakeiMetricLink[]} metrics
 * @property {KakeiStatus} status
 * @property {string | null} reason
 *
 * @typedef {object} KakeiDecisions  data/estat/kakei-ledger/decisions.json (人が書く判断)
 * @property {1} schemaVersion
 * @property {Record<KakeiMeasure, string>} itemTables  品目ごとの採否を持つ年次の品目表
 * @property {{ statsDataId: string, status: "planned" | "excluded", reason: string, decidedAt: string, decidedBy: string }[]} tables
 * @property {number} [maxUndecidedTables]  未判断の表の上限 (縮小専用)
 * @property {{ code: string, measure: KakeiMeasure, status: "planned" | "excluded", reason: string, decidedAt: string, decidedBy: string }[]} items
 *
 * @typedef {object} KakeiMetricInput  metric config から必要な部分だけ
 * @property {string} key
 * @property {string} statsDataId
 * @property {string | null} cdCat02
 * @property {string[]} codes  cdCat01 (単品) か axisSum の codes
 * @property {"single" | "sum"} via
 */

/**
 * 「371 ぎょうざ」は品目、「1.1 穀類」「1 食料」と品目番号の範囲・列挙 (「170-189 鮮魚」「531,532 ティッシュペーパー・…」) は分類、
 * それ以外 (「世帯人員」「消費支出」) は other。
 * 品目番号の判定は kakei-classification.mjs の itemNumberFromCat01Name と同じ規則 (3 桁か 2 桁 + 英字)。
 * @returns {KakeiItemKind}
 */
export function classifyItemName(name) {
  const s = String(name ?? "");
  if (/^([0-9]{3}|[0-9]{2}[A-Z])\s/.test(s)) return "item";
  if (/^[0-9]{1,2}(\.[0-9]{1,2})*\s/.test(s)) return "group";
  if (/^([0-9]{3}|[0-9]{2}[A-Z])([-,]([0-9]{3}|[0-9]{2}[A-Z]))+\s/.test(s)) return "group";
  return "other";
}

/**
 * metric config (METRICS_REGISTRY の値) から家計調査の取得条件を取り出す。家計調査でなければ null。
 * @returns {KakeiMetricInput | null}
 */
export function kakeiMetricInput(metric) {
  if (metric?.source?.kind !== "kakei-chousa") return null;
  const filter = metric.source.filter ?? {};
  const sum = filter.axisSum?.axis === "cat01" ? filter.axisSum.codes : null;
  return {
    key: metric.key,
    statsDataId: String(filter.statsDataId ?? ""),
    cdCat02: filter.cdCat02 != null ? String(filter.cdCat02) : null,
    codes: sum ? sum.map(String) : filter.cdCat01 ? [String(filter.cdCat01)] : [],
    via: sum ? "sum" : "single",
  };
}

/**
 * 分析単位 (packages/data-configs/src/kakei-analysis-catalog.ts) を表ごとにまとめる。
 * 指標だけを使い手として数えると、全国ページの図やブログで使っている表が「未判断」に見えていた (2026-11-02)。
 * @param {{ id: string, statsDataId: string, state: "configured" | "staged" | "proposed" }[]} analyses
 */
function groupAnalysesByTable(analyses) {
  const byTable = new Map();
  for (const a of analyses) byTable.set(a.statsDataId, [...(byTable.get(a.statsDataId) ?? []), a]);
  return byTable;
}

/**
 * 表の状態。指標か、作成済み・生成済みの分析単位があれば adopted。候補の分析単位だけなら planned。
 * どちらも無ければ decisions.json の判断、それも無ければ undecided。
 * @returns {KakeiStatus}
 */
function tableStatus(metricKeys, analyses, decided) {
  if (metricKeys.length || analyses.some((a) => a.state !== "proposed")) return "adopted";
  if (analyses.length) return "planned";
  return decided?.status ?? "undecided";
}

/**
 * @param {object} p
 * @param {object[]} p.tables  カタログ index/tables/00200561.json の行 (removedAt のない現行の表)
 * @param {{ statsDataId: string, dim: string, code: string, name: string, unit: string | null, level: string | null, parentCode: string | null }[]} p.classes
 *   カタログ index/classes/00200561.json の行
 * @param {KakeiMetricInput[]} p.metrics
 * @param {{ id: string, statsDataId: string, state: "configured" | "staged" | "proposed" }[]} [p.analyses]  分析単位 (kakei-analysis-catalog.ts)
 * @param {KakeiDecisions} p.decisions
 * @param {string} p.generatedAt
 * @param {string | null} p.catalogGeneratedAt
 */
export function buildKakeiLedger({ tables, classes, metrics, analyses = [], decisions, generatedAt, catalogGeneratedAt }) {
  const current = tables.filter((t) => !t.removedAt);
  const analysesByTable = groupAnalysesByTable(analyses);
  const metricsByTable = new Map();
  for (const m of metrics) {
    if (!metricsByTable.has(m.statsDataId)) metricsByTable.set(m.statsDataId, []);
    metricsByTable.get(m.statsDataId).push(m.key);
  }
  const tableDecision = new Map(decisions.tables.map((d) => [d.statsDataId, d]));

  /** @type {KakeiLedgerTable[]} */
  const ledgerTables = current
    .map((t) => {
      const used = [...new Set(metricsByTable.get(t.statsDataId) ?? [])].sort();
      const usedBy = analysesByTable.get(t.statsDataId) ?? [];
      const decided = tableDecision.get(t.statsDataId);
      const status = tableStatus(used, usedBy, decided);
      const years = t.meta?.years ?? [];
      return {
        statsDataId: t.statsDataId,
        title: t.title,
        cycle: t.cycle ?? null,
        updatedDate: t.updatedDate ?? null,
        collectAreas: t.collectAreas ?? (t.collectArea != null ? [String(t.collectArea)] : []),
        timeKind: t.meta?.timeKind ?? null,
        years: years.length ? { from: years[0], to: years.at(-1), count: years.length } : null,
        areaCount: t.meta?.areaCount ?? null,
        dims: (t.meta?.dims ?? []).map((d) => ({ id: d.id, name: d.name ?? null, count: d.count })),
        metrics: used,
        analyses: usedBy.map((a) => a.id).sort(),
        status,
        reason: status === decided?.status ? decided.reason : null,
      };
    })
    .sort((a, b) => a.statsDataId.localeCompare(b.statsDataId));

  const itemDecision = new Map(decisions.items.map((d) => [`${d.measure}:${d.code}`, d]));
  /** @type {KakeiLedgerItem[]} */
  const items = [];
  for (const measure of /** @type {KakeiMeasure[]} */ (["amount", "quantity"])) {
    const statsDataId = decisions.itemTables[measure];
    const links = new Map();
    for (const m of metrics) {
      if (m.statsDataId !== statsDataId || m.cdCat02 !== KAKEI_HOUSEHOLD_TWO_PLUS) continue;
      for (const code of m.codes) {
        if (!links.has(code)) links.set(code, []);
        links.get(code).push({ key: m.key, via: m.via });
      }
    }
    for (const c of classes.filter((x) => x.statsDataId === statsDataId && x.dim === "cat01")) {
      const linked = (links.get(c.code) ?? []).sort((a, b) => a.key.localeCompare(b.key));
      const decided = itemDecision.get(`${measure}:${c.code}`);
      items.push({
        code: c.code,
        name: c.name,
        measure,
        statsDataId,
        kind: classifyItemName(c.name),
        level: c.level ?? null,
        parentCode: c.parentCode ?? null,
        unit: c.unit ?? null,
        metrics: linked,
        status: linked.length ? "adopted" : decided?.status ?? "undecided",
        reason: linked.length ? null : decided?.reason ?? null,
      });
    }
  }

  return {
    schemaVersion: /** @type {1} */ (1),
    generatedAt,
    source: { statCode: KAKEI_STAT_CODE, catalogGeneratedAt, itemTables: decisions.itemTables },
    summary: summarize(ledgerTables, items),
    tables: ledgerTables,
    items,
  };
}

function countBy(rows, key) {
  const out = {};
  for (const r of rows) out[key(r)] = (out[key(r)] ?? 0) + 1;
  return out;
}

/** 件数は台帳の行から数える (手で書かない) */
function summarize(tables, items) {
  return {
    tables: tables.length,
    tablesWithMeta: tables.filter((t) => t.years).length,
    tablesByStatus: countBy(tables, (t) => t.status),
    tablesByCycle: countBy(tables, (t) => t.cycle ?? "unknown"),
    items: Object.fromEntries(
      ["amount", "quantity"].map((measure) => {
        const rows = items.filter((i) => i.measure === measure);
        return [measure, { total: rows.length, byStatus: countBy(rows, (i) => i.status), undecidedByKind: countBy(rows.filter((i) => i.status === "undecided"), (i) => i.kind) }];
      }),
    ),
  };
}

/**
 * 台帳・判断・metric config の整合を検査する。error が 1 件でもあれば CLI は exit 1。
 * @param {object} p
 * @param {ReturnType<typeof buildKakeiLedger>} p.ledger  ファイルの台帳
 * @param {KakeiMetricInput[]} p.metrics  現在の metric config
 * @param {{ id: string, statsDataId: string, state: "configured" | "staged" | "proposed" }[]} [p.analyses]  現在の分析単位
 * @param {Map<string, string[]> | null} [p.lensTables]  切り口台帳の表 → その表を使う切り口 (null なら切り口との整合は見ない)
 * @param {KakeiDecisions} p.decisions
 * @returns {{ level: "error" | "warn", code: string, message: string }[]}
 */
export function checkKakeiLedger({ ledger, metrics, analyses = [], lensTables = null, decisions }) {
  /** @type {{ level: "error" | "warn", code: string, message: string }[]} */
  const findings = [];
  const tableIds = new Set(ledger.tables.map((t) => t.statsDataId));
  const itemKey = (measure, code) => `${measure}:${code}`;
  const itemsByKey = new Map(ledger.items.map((i) => [itemKey(i.measure, i.code), i]));
  const measureOf = new Map(Object.entries(decisions.itemTables).map(([measure, id]) => [id, measure]));

  for (const [measure, id] of Object.entries(decisions.itemTables)) {
    if (ledger.source.itemTables?.[measure] !== id) {
      findings.push({ level: "error", code: "STALE_LEDGER", message: `decisions.itemTables.${measure}=${id} が台帳 (${ledger.source.itemTables?.[measure]}) と違う。台帳を作り直す` });
    }
  }

  // 1. 指標が e-Stat に実在する表・品目を指しているか
  for (const m of metrics) {
    if (!tableIds.has(m.statsDataId)) {
      findings.push({ level: "error", code: "UNKNOWN_TABLE", message: `${m.key}: statsDataId ${m.statsDataId} が家計調査の表 (e-Stat カタログ) に無い` });
      continue;
    }
    const measure = measureOf.get(m.statsDataId);
    if (!measure) continue; // 品目表以外 (旧分類の表など) は品目単位の照合をしない
    for (const code of m.codes) {
      if (!itemsByKey.has(itemKey(measure, code))) {
        findings.push({ level: "error", code: "UNKNOWN_ITEM", message: `${m.key}: cdCat01 ${code} が ${m.statsDataId} の品目に無い` });
      }
    }
  }

  // 2. 台帳の採用状況が今の metric config と一致するか (指標を足して作り直し忘れた台帳を止める)
  const expected = new Set();
  for (const m of metrics) {
    const measure = measureOf.get(m.statsDataId);
    if (!measure || m.cdCat02 !== KAKEI_HOUSEHOLD_TWO_PLUS) continue;
    for (const code of m.codes) expected.add(`${itemKey(measure, code)}:${m.key}`);
  }
  const recorded = new Set(ledger.items.flatMap((i) => i.metrics.map((l) => `${itemKey(i.measure, i.code)}:${l.key}`)));
  const missing = [...expected].filter((x) => !recorded.has(x));
  const extra = [...recorded].filter((x) => !expected.has(x));
  if (missing.length || extra.length) {
    findings.push({
      level: "error",
      code: "STALE_LEDGER",
      message: `台帳の採用状況が metric config と違う (台帳に無い ${missing.length} 件・config に無い ${extra.length} 件。例: ${[...missing, ...extra].slice(0, 3).join(", ")})。npm run estat:kakei-ledger:build で作り直す`,
    });
  }
  const tableMetrics = new Map();
  for (const m of metrics) tableMetrics.set(m.statsDataId, [...(tableMetrics.get(m.statsDataId) ?? []), m.key]);
  for (const t of ledger.tables) {
    const now = [...new Set(tableMetrics.get(t.statsDataId) ?? [])].sort().join(",");
    if (now !== [...t.metrics].sort().join(",")) {
      findings.push({ level: "error", code: "STALE_LEDGER", message: `${t.statsDataId}: 表を使う指標が台帳と config で違う。npm run estat:kakei-ledger:build で作り直す` });
    }
  }

  const analysesByTable = groupAnalysesByTable(analyses);
  for (const t of ledger.tables) {
    const now = (analysesByTable.get(t.statsDataId) ?? []).map((a) => a.id).sort().join(",");
    if (now !== [...(t.analyses ?? [])].sort().join(",")) {
      findings.push({ level: "error", code: "STALE_LEDGER", message: `${t.statsDataId}: 表を使う分析単位が台帳と kakei-analysis-catalog.ts で違う。npm run estat:kakei-ledger:build で作り直す` });
    }
  }

  // 3. 判断の参照先が実在し、採用済みのものに見送り・予定を付けていないか
  for (const d of decisions.tables) {
    const t = ledger.tables.find((x) => x.statsDataId === d.statsDataId);
    if (!t) findings.push({ level: "error", code: "UNKNOWN_DECISION", message: `decisions.tables の ${d.statsDataId} が家計調査の表に無い` });
    else if (t.metrics.length || (t.analyses ?? []).length) findings.push({ level: "error", code: "DECISION_CONFLICT", message: `${d.statsDataId} は指標か分析単位があるのに ${d.status} の判断がある` });
  }

  // 3b. 切り口台帳と表の判断をつなぐ (2026-11-02)。切り口が使う表を未判断のまま残さず、
  //     採用・予定の表はどれかの切り口に属させる。台帳の外でページが表を使い始めるのを止める
  if (lensTables) {
    for (const t of ledger.tables) {
      const lenses = lensTables.get(t.statsDataId) ?? [];
      if (lenses.length && t.status === "undecided") {
        findings.push({ level: "error", code: "LENS_TABLE_UNDECIDED", message: `${t.statsDataId} (${t.title}) は切り口 ${lenses.join(",")} が使うのに未判断。decisions.json に planned か excluded を理由付きで書く (除外なら切り口の dataTables からも外す)` });
      }
      if (!lenses.length && (t.status === "adopted" || t.status === "planned")) {
        findings.push({ level: "error", code: "TABLE_WITHOUT_LENS", message: `${t.statsDataId} (${t.title}) は ${t.status} なのにどの切り口にも属さない。切り口台帳 (surveys.lenses の kakei-chousa) の dataTables に足す` });
      }
      if (lenses.length && t.status === "excluded") {
        findings.push({ level: "error", code: "LENS_USES_EXCLUDED", message: `${t.statsDataId} は除外の判断なのに切り口 ${lenses.join(",")} が使う` });
      }
    }
  }

  // 3c. 未判断の表は増やさない (縮小専用。減ったら decisions.json の maxUndecidedTables を下げる)
  const undecidedTables = ledger.tables.filter((t) => t.status === "undecided").length;
  if (typeof decisions.maxUndecidedTables === "number" && undecidedTables > decisions.maxUndecidedTables) {
    findings.push({ level: "error", code: "UNDECIDED_GREW", message: `未判断の表が ${undecidedTables} 件で上限 ${decisions.maxUndecidedTables} を超えた。新しい表に判断を書く` });
  }
  const seen = new Set();
  for (const d of decisions.items) {
    const k = itemKey(d.measure, d.code);
    if (seen.has(k)) findings.push({ level: "error", code: "DUPLICATE_DECISION", message: `decisions.items に ${k} が重複` });
    seen.add(k);
    const item = itemsByKey.get(k);
    if (!item) findings.push({ level: "error", code: "UNKNOWN_DECISION", message: `decisions.items の ${k} が品目表に無い` });
    else if (item.metrics.length) findings.push({ level: "error", code: "DECISION_CONFLICT", message: `${k} (${item.name}) は指標があるのに ${d.status} の判断がある` });
  }

  // 3d. 予定のまま作られていない表と、未判断の残りを知らせる (止めない。週次レビューが読み、backlog へ流す)
  const planned = ledger.tables.filter((t) => t.status === "planned");
  if (planned.length) {
    findings.push({ level: "warn", code: "PLANNED_TABLES", message: `予定のまま指標・作成済みの分析単位が無い表 ${planned.length} 件: ${planned.map((t) => t.statsDataId).join(", ")}` });
  }
  if (undecidedTables) {
    findings.push({ level: "warn", code: "UNDECIDED_TABLES", message: `未判断の表 ${undecidedTables} 件 (上限 ${decisions.maxUndecidedTables ?? "なし"})` });
  }

  // 4. 判断のない品目は件数だけ知らせる (止めない。判断の作業は backlog が持つ)
  const undecided = ledger.items.filter((i) => i.status === "undecided" && i.kind === "item");
  if (undecided.length) {
    findings.push({ level: "warn", code: "UNDECIDED_ITEMS", message: `指標も判断もない品目が ${undecided.length} 件 (分類・属性の行を除く)` });
  }
  return findings;
}
