/**
 * 社会・人口統計体系 (SSDS) の指標の「年の区切り」(yearFormat: 暦年 calendar / 年度 fiscal) を、
 * e-Stat が公開する定義から決める純粋関数。
 *
 * なぜ要るか (2026-10-21): 指標の生成器 gen-ssds-configs.mjs が SSDS の全指標に yearFormat: "fiscal" を固定で書いていて、
 * 国勢調査 (10月1日時点)・家計調査 (暦年平均)・犯罪統計 (暦年計) などが「2020年度」と表示されていた。
 * 同日に 410 指標を手で直したが、生成器が固定のままでは新しい指標で再発する (SSDS-YEARFORMAT-SOURCE-01)。
 *
 * 根拠にするもの (どちらも公開 HTML。控えは data/estat/ssds-year-format/definitions.json、取得は build-ssds-definitions.mjs):
 *   - 統計項目の定義 https://www.e-stat.go.jp/koumoku/koumoku_teigi/<A〜M>
 *       表の 1 列目 = 項目符号、4 列目 = 時点又は期間、節の末尾 = 調査名又は報告書名
 *   - 指標計算式 https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/<A〜M>
 *       都道府県の指標コード (#L01201 等) と、計算式に現れる基礎項目 (L3110 等)
 *
 * 判定 (decideYearFormat):
 *   指標 (# 付き) は計算式の基礎項目へ、基礎項目はそのまま定義の表へたどる。
 *   1 つでも年度の項目 (年度計・年度間・3月31日 など、または表題が「年度」の調査) を含めば fiscal。
 *   すべてが暦年の項目 (暦年計・暦年平均・暦年・12月末/31日・10月1日、または表題が「年」の調査) なら calendar。
 *   それ以外は判定しない (null)。判定できない指標を年度か暦年のどちらかへ倒さない。
 *
 * 人の判断は data/estat/ssds-year-format/decisions.json に置く:
 *   surveyNaming  期間では決まらない調査の、表題での年の呼び方 / itemOverrides  定義ページの期間が誤っている項目 /
 *   undetermined  判定できない指標の一覧 (理由付き・縮小専用)
 */

export const FIELDS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
export const definitionUrl = (field) => `https://www.e-stat.go.jp/koumoku/koumoku_teigi/${field}`;
export const formulaUrl = (field) => `https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/${field}`;

const ITEM_CODE = /^[A-M][0-9]{1,8}$/;
const ITEM_CODE_IN_TEXT = /[A-M][0-9]{2,8}/g;
/** 表のセルで「上の符号から下の符号まで」を表す印 */
const RANGE_MARK = /^[│～〜]$/;
const DITTO = "〃";

function decodeEntities(text) {
  return text.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

/** 全角の数字と空白を半角にそろえ、前後と連続の空白を詰める */
export function normalizeText(text) {
  return String(text ?? "")
    .replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .replace(/[\s　]+/g, " ")
    .trim();
}

/** セルの HTML を、段落 (<p>) と改行 (<br>) ごとの行にする。末尾の空行は落とす */
function cellLines(cellHtml) {
  const lines = decodeEntities(
    cellHtml.replace(/<!--[\s\S]*?-->/g, "").replace(/<\/p>|<br\s*\/?>/gi, "\u0001").replace(/<[^>]+>/g, ""),
  ).split("\u0001").map(normalizeText);
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

/**
 * 期間の欄の 1 行が、それだけで 1 つの期間を表す語か。
 * 欄が狭いので「調査日前 / 暦年計」「センサス / 実施年の / 2月1日」のように 1 つの期間が複数行へ折り返されることがあり、
 * 符号ごとに期間を並べた欄 (「10月1日 / 〃 / 9月」) と行数だけでは区別できない。
 */
const STANDALONE_PERIOD = /^(?:〃|[0-9]{1,2}月(?:[0-9]{1,2}日|末日?|中)?(?: 24時)?|暦年計|暦年平均|暦年|年度計|年度間|年度平均|年度末|年度|年間|年計|年末|寒候期|調査日)$/;

/**
 * 符号の行と期間の行を対応づける (pure)。
 *   - 期間が 1 行だけ → その欄の全符号に同じ期間
 *   - 行数が符号の欄と同じで、どの行も単独で期間を表す語 → 行ごとに対応 (「〃」と空行は上の行と同じ)
 *   - それ以外 → 1 つの期間が折り返されたものとして、つなげて全符号に当てる
 * @returns {(string | null)[]} codeLines と同じ長さ。期間の無い行は null
 */
function alignPeriods(codeLines, periodLines) {
  const filled = periodLines.filter(Boolean);
  if (filled.length === 0) return codeLines.map(() => null);
  if (filled.length === 1) return codeLines.map(() => filled[0]);
  if (periodLines.length === codeLines.length && filled.every((line) => STANDALONE_PERIOD.test(line))) {
    let previous = null;
    return periodLines.map((line) => {
      if (line && line !== DITTO) previous = line;
      return previous;
    });
  }
  const joined = filled.join("");
  return codeLines.map(() => joined);
}

/**
 * 「統計項目の定義」1 分野の HTML から、項目符号ごとの期間と調査名を取り出す (pure)。
 * ページは <hr> で節に分かれ、節ごとに表 (見出しに「時点又は期間」) と、末尾の「調査名又は報告書名」がある。
 * 符号が「A4101 │ A410209」のように範囲で書かれた行は、両端の符号と、その間を表す range を返す。
 *
 * @param {string} html
 * @returns {{ items: { code: string, name: string | null, period: string | null, survey: string | null }[],
 *             ranges: { from: string, to: string, period: string | null, survey: string | null }[] }}
 */
export function parseItemDefinitions(html) {
  const items = [];
  const ranges = [];
  for (const section of html.split(/<hr\b[^>]*>/i)) {
    const surveyMatch = section.match(/調査名又は報告書名\s*(?:<\/b>)?([\s\S]*?)(?:<br|<\/p>|<b>)/);
    const survey = surveyMatch ? normalizeText(decodeEntities(surveyMatch[1].replace(/<[^>]+>/g, ""))) || null : null;
    const sectionItems = [];
    for (const table of section.match(/<table\b[\s\S]*?<\/table>/gi) ?? []) {
      if (!table.includes("時点又は期間")) continue;
      const rows = table.match(/<tr\b[\s\S]*?<\/tr>/gi) ?? [];
      for (const row of rows.slice(1)) {
        const cells = (row.match(/<t[dh]\b[\s\S]*?<\/t[dh]>/gi) ?? []).map(cellLines);
        if (cells.length !== 4) continue;
        const [codeLines, nameLines, , periodLines] = cells;
        const periods = alignPeriods(codeLines, periodLines);
        const names = nameLines.filter(Boolean);
        const codeCount = codeLines.join(" ").split(" ").filter((token) => ITEM_CODE.test(token)).length;
        let nameIndex = 0;
        let rangeFrom = null;
        let lastCode = null;
        codeLines.forEach((line, index) => {
          if (RANGE_MARK.test(line)) {
            rangeFrom = lastCode;
            return;
          }
          for (const token of line.split(" ")) {
            if (!ITEM_CODE.test(token)) continue;
            const period = periods[index];
            // 項目名は、符号と同じ数だけ並んでいるときに限り対応づける (折り返しがあると数が合わない)
            const name = names.length === codeCount ? names[nameIndex] : null;
            nameIndex += 1;
            sectionItems.push({ code: token, name, period, survey });
            if (rangeFrom) {
              ranges.push({ from: rangeFrom, to: token, period, survey });
              rangeFrom = null;
            }
            lastCode = token;
          }
        });
      }
    }
    items.push(...sectionItems);
    // 表は「C61 売上金額」のようにまとめた符号だけを載せ、細分 (C610117 など) は節の先頭の <a name> にだけ現れる。
    // 節の表の期間が 1 つに決まるか、細分の符号が表の符号で始まるときに限り、その期間を細分にも当てる
    const listed = new Set(sectionItems.map((item) => item.code));
    const periods = new Set(sectionItems.map((item) => item.period));
    for (const anchor of new Set([...section.matchAll(/<a\s+(?:name|id)="([A-M][0-9]{1,8})"/g)].map((match) => match[1]))) {
      if (listed.has(anchor) || sectionItems.length === 0) continue;
      const parent = sectionItems.filter((item) => anchor.startsWith(item.code)).sort((a, b) => b.code.length - a.code.length)[0];
      if (parent) items.push({ code: anchor, name: null, period: parent.period, survey });
      else if (periods.size === 1) items.push({ code: anchor, name: null, period: sectionItems[0].period, survey });
    }
  }
  return { items, ranges };
}

/**
 * 「指標計算式」1 分野の HTML から、指標コードと計算式の基礎項目を取り出す (pure)。
 * @param {string} html
 * @returns {{ code: string, name: string, formula: string, baseItems: string[] }[]}
 */
export function parseIndicatorFormulas(html) {
  const indicators = [];
  for (const row of html.matchAll(/<tr id="([^"]+)">([\s\S]*?)<\/tr>/g)) {
    const cells = [...row[2].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) => cellLines(cell[1]).filter(Boolean));
    if (cells.length !== 4) continue;
    const [code, name, , description] = cells;
    const formula = description.join(" ");
    indicators.push({
      code: code[0] ?? `#${row[1]}`,
      name: name.join(""),
      formula,
      baseItems: [...new Set(formula.match(ITEM_CODE_IN_TEXT) ?? [])],
    });
  }
  return indicators;
}

/** 暦年の時点・期間 (カード SSDS-YEARFORMAT-SOURCE-01 の判定の手順 ③) */
const CALENDAR_PERIOD = /暦年|(?<![0-9])12月末|(?<![0-9])12月31日|(?<![0-9])10月1日/;
/** 年度の時点・期間 */
const FISCAL_PERIOD = /年度|(?<![0-9])3月31日|(?<![0-9])3月末/;

/**
 * 「時点又は期間」の語から年の区切りを決める (pure)。どちらとも言えない語 (調査日・5月1日・年計 など) は null。
 * @param {string | null | undefined} period
 * @returns {"calendar" | "fiscal" | null}
 */
export function classifyPeriod(period) {
  const text = normalizeText(period).replace(/ /g, "");
  if (FISCAL_PERIOD.test(text)) return "fiscal";
  if (CALENDAR_PERIOD.test(text)) return "calendar";
  return null;
}

/** 調査名の欄 (「国勢調査、人口推計」) を 1 調査ずつに分ける。ハイフンの表記ゆれ (‐ - － −) はそろえる */
export function splitSurveys(survey) {
  return normalizeText(survey)
    .replace(/[‐－−–—]/g, "-")
    .split(/[、,]/)
    .map((name) => name.trim())
    .filter(Boolean);
}

/**
 * 定義の控え (definitions.json) を引ける形にする。
 * @param {{ items: { code: string, name?: string | null, period: string | null, survey: string | null }[],
 *           ranges?: { from: string, to: string, period: string | null, survey: string | null }[],
 *           indicators: { code: string, baseItems: string[] }[] }} definitions
 */
export function indexDefinitions(definitions) {
  /** @type {Map<string, { code: string, period: string | null, survey: string | null }[]>} */
  const items = new Map();
  for (const item of definitions.items) {
    if (!items.has(item.code)) items.set(item.code, []);
    items.get(item.code).push(item);
  }
  const indicators = new Map(definitions.indicators.map((indicator) => [indicator.code, indicator]));
  return { items, ranges: definitions.ranges ?? [], indicators };
}

/**
 * 人の判断 (decisions.json) を引ける形にする。
 * @param {{ surveyNaming?: { survey: string, yearFormat: "calendar" | "fiscal" }[],
 *           itemOverrides?: { code: string, yearFormat: "calendar" | "fiscal", reason: string }[] }} [decisions]
 */
export function buildRules(decisions = {}) {
  return {
    /** @type {Map<string, "calendar" | "fiscal">} */
    surveyNaming: new Map((decisions.surveyNaming ?? []).map((row) => [splitSurveys(row.survey)[0], row.yearFormat])),
    itemOverrides: new Map((decisions.itemOverrides ?? []).map((row) => [row.code, row])),
  };
}

/** SSDS の統計表の種類。都道府県: 00000101xx 基礎データ・00000102xx 指標 / 市区町村: 00000202xx 基礎データ・00000203xx 指標 */
export function ssdsTableKind(statsDataId) {
  const match = String(statsDataId ?? "").match(/^00000([12])0([1-3])[0-9]{2}$/);
  if (!match) return null;
  if (match[1] === "1") return match[2] === "1" ? "prefecture-base" : match[2] === "2" ? "prefecture-indicator" : null;
  return match[2] === "3" ? "city-indicator" : "city-base";
}

function lookupItem(index, code) {
  const exact = index.items.get(code);
  if (exact) return exact;
  // 「A4101 │ A410209」の間にある符号。符号は分野の英字 + 数字なので、文字列の大小で範囲に入るかを決められる
  return index.ranges.filter((range) => range.from <= code && code <= range.to && code.startsWith(range.from.slice(0, 3)));
}

/**
 * 基礎項目 1 つの年の区切り。上書き → 期間 → 調査の呼び方 の順に決める。
 * 同じ符号が複数の節に載っていて区切りが割れるときは決めない。
 */
function classifyItem(index, code, rules) {
  const override = rules.itemOverrides.get(code);
  if (override) return { code, yearFormat: override.yearFormat, period: null, survey: null, why: `上書き (${override.reason})` };
  const entries = lookupItem(index, code);
  if (entries.length === 0) return { code, yearFormat: null, period: null, survey: null, why: "定義ページに項目が無い" };
  const verdicts = entries.map((entry) => {
    const byPeriod = classifyPeriod(entry.period);
    if (byPeriod) return { yearFormat: byPeriod, period: entry.period, survey: entry.survey, why: `期間「${entry.period}」` };
    // 欄に複数の調査が並ぶときは、全部の呼び方が分かっていて同じときだけ決める
    const named = splitSurveys(entry.survey).map((name) => rules.surveyNaming.get(name) ?? null);
    if (named.length > 0 && named.every((format) => format !== null && format === named[0])) {
      return { yearFormat: named[0], period: entry.period, survey: entry.survey, why: `調査の呼び方 (${entry.survey}、期間「${entry.period ?? "記載なし"}」)` };
    }
    return { yearFormat: null, period: entry.period, survey: entry.survey, why: `期間「${entry.period ?? "記載なし"}」(${entry.survey ?? "調査名なし"}) は年度か暦年か決まらない` };
  });
  if (new Set(verdicts.map((verdict) => verdict.yearFormat)).size > 1) {
    return { code, yearFormat: null, period: verdicts.map((verdict) => verdict.period).join(" / "), survey: verdicts.map((verdict) => verdict.survey).join(" / "), why: "同じ符号の定義が複数あり、年の区切りが割れる" };
  }
  return { code, ...verdicts[0] };
}

/**
 * SSDS の指標の年の区切りを決める (pure)。
 * @param {{ statsDataId: string, cdCat01: string | string[] }} source  cdCat01 は基礎項目 "A1101" か指標 "#A01101"。
 *        複数の符号から計算する指標 (axisRatio・axisSum) は全部の符号を配列で渡す
 * @param {ReturnType<typeof indexDefinitions>} index
 * @param {ReturnType<typeof buildRules>} [rules]
 * @returns {{ yearFormat: "calendar" | "fiscal" | null, reason: string,
 *             basis: { code: string, yearFormat: string | null, period: string | null, survey: string | null, why: string }[] }}
 */
export function decideYearFormat(source, index, rules = buildRules()) {
  const kind = ssdsTableKind(source.statsDataId);
  if (!kind) return { yearFormat: null, reason: `統計表 ${source.statsDataId} は社会・人口統計体系の表ではない`, basis: [] };
  const baseItems = [];
  for (const code of [source.cdCat01].flat()) {
    if (!code.startsWith("#")) {
      baseItems.push(code);
      continue;
    }
    // 指標計算式のページは都道府県の指標のもの。市区町村の指標の表は同じコードでも式が違うことがある
    // (#B01101 は都道府県が「全国面積に占める割合」、市区町村が「都道府県面積に占める割合」) ので当てはめない
    if (kind === "city-indicator") return { yearFormat: null, reason: `市区町村の指標 ${code} の計算式は公開されていない (指標計算式のページは都道府県の指標)`, basis: [] };
    const indicator = index.indicators.get(code);
    if (!indicator) return { yearFormat: null, reason: `指標 ${code} が指標計算式のページに無い`, basis: [] };
    if (indicator.baseItems.length === 0) return { yearFormat: null, reason: `指標 ${code} の計算式に基礎項目が無い`, basis: [] };
    baseItems.push(...indicator.baseItems);
  }
  const basis = [...new Set(baseItems)].map((code) => classifyItem(index, code, rules));
  const describe = (entries) => entries.map((entry) => `${entry.code} ${entry.why}`).join("、");
  const fiscal = basis.filter((entry) => entry.yearFormat === "fiscal");
  if (fiscal.length > 0) return { yearFormat: "fiscal", reason: `年度の項目を含む: ${describe(fiscal)}`, basis };
  const unknown = basis.filter((entry) => entry.yearFormat === null);
  if (unknown.length > 0) return { yearFormat: null, reason: describe(unknown), basis };
  return { yearFormat: "calendar", reason: `すべて暦年の項目: ${describe(basis)}`, basis };
}

/**
 * 判定できない指標の一覧 (decisions.json の undetermined) の件数の上限。一覧は縮小専用で、減らしたらここも下げる。
 * 生成器は判定できない指標を書かないので、増えるのは人が手で指標を足したときだけ。そのときは一覧へ足す前に、
 * 調査の呼び方 (surveyNaming) を一次資料で確かめて決められないかを先に調べる。
 */
export const UNDETERMINED_CEILING = 247;

/**
 * 指標の定義の yearFormat を、定義から決めた区切りと突き合わせる (pure)。
 *   MISMATCH              決まった区切りと食い違う
 *   UNDETERMINED_UNLISTED 決まらないのに、理由付きの一覧 (undetermined) に無い
 *   STALE_UNDETERMINED    一覧にあるが、いまは決まる (一覧から外す)
 *   UNKNOWN_KEY           一覧にあるが、SSDS の指標に無い
 *   OVER_CEILING          一覧が上限より多い
 *
 * @param {{ key: string, statsDataId: string, cdCat01: string | string[], yearFormat?: string }[]} metrics  SSDS の指標だけを渡す
 * @param {ReturnType<typeof indexDefinitions>} index
 * @param {Parameters<typeof buildRules>[0] & { undetermined: { key: string, reason: string }[] }} decisions
 * @param {{ ceiling?: number }} [options]
 */
export function checkSsdsYearFormats(metrics, index, decisions, { ceiling = UNDETERMINED_CEILING } = {}) {
  const rules = buildRules(decisions);
  const listed = new Set(decisions.undetermined.map((row) => row.key));
  const errors = [];
  const undetermined = [];
  const seen = new Set();
  for (const metric of metrics) {
    seen.add(metric.key);
    const label = `${metric.key} (${[metric.cdCat01].flat().join("・")})`;
    const decision = decideYearFormat(metric, index, rules);
    if (decision.yearFormat === null) {
      undetermined.push({ key: metric.key, cdCat01: metric.cdCat01, yearFormat: metric.yearFormat ?? null, reason: decision.reason });
      if (!listed.has(metric.key)) {
        errors.push({ code: "UNDETERMINED_UNLISTED", key: metric.key, message: `${label} の年の区切りが定義から決まらない: ${decision.reason}` });
      }
      continue;
    }
    if (listed.has(metric.key)) {
      errors.push({ code: "STALE_UNDETERMINED", key: metric.key, message: `${label} は ${decision.yearFormat} と決まるので、判定できない指標の一覧から外す: ${decision.reason}` });
    }
    if (metric.yearFormat !== decision.yearFormat) {
      errors.push({ code: "MISMATCH", key: metric.key, message: `${label} の yearFormat は ${metric.yearFormat ?? "未設定"} だが、定義からは ${decision.yearFormat}: ${decision.reason}` });
    }
  }
  for (const key of listed) {
    if (!seen.has(key)) errors.push({ code: "UNKNOWN_KEY", key, message: `判定できない指標の一覧の ${key} は SSDS の指標に無い` });
  }
  if (listed.size > ceiling) {
    errors.push({ code: "OVER_CEILING", key: null, message: `判定できない指標の一覧が ${listed.size} 件で、上限 ${ceiling} 件を超えている (一覧は縮小専用)` });
  }
  return { errors, undetermined, checked: metrics.length };
}
