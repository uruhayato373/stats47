/**
 * 保育所等利用待機児童率 (nursery-waiting-children-rate) の純粋関数。
 * 取り込みスクリプト ingest-childcare-waiting-rate.ts が IO を担い、ここは副作用を持たない(テスト対象)。
 */

export type SheetRows = Map<number, Map<string, string>>;

export interface WaitingRow {
  prefecture: string;
  municipality: string;
  applicants: number;
  waiting: number;
}

export interface MunicipalityRef {
  code: string;
  /** 例 "北海道 札幌市" / "東京都 特別区部 千代田区" (packages/area の cityName) */
  name: string;
  prefectureName: string;
}

export interface CityRow {
  areaCode: string;
  areaName: string;
  yearCode: string;
  yearName: string;
  value: number | null;
  unit: string;
  rank: number | null;
  prefectureCode: string;
}

/** 公表資料の表記ゆれだけを許す。キーは「都道府県|市区町村」(資料側)、値はマスタ側。 */
export const NAME_ALIASES: Readonly<Record<string, string>> = {
  "高知県|梼原町": "高知県|檮原町",
};

const colIndex = (col: string): number => col.split("").reduce((a, ch) => a * 26 + (ch.charCodeAt(0) - 64), 0);

/**
 * 見出し行(「都道府県」「市区町村」がある行)から列を決め、データ行を読む。
 * 申込者数・待機児童は年齢別に同名の列が並ぶので、列番号が最も小さい(=合計)ものを採る。
 */
export function parseWaitingRows(rows: SheetRows): WaitingRow[] {
  let headerRow = -1;
  for (const [r, cells] of rows) {
    const vals = Array.from(cells.values());
    if (vals.includes("都道府県") && vals.includes("市区町村")) {
      headerRow = r;
      break;
    }
  }
  if (headerRow < 0) throw new Error("見出し行(都道府県・市区町村)が見つからない");
  const header = Array.from(rows.get(headerRow)!.entries()).sort((a, b) => colIndex(a[0]) - colIndex(b[0]));
  const first = (label: string): string => {
    const hit = header.find(([, v]) => v === label);
    if (!hit) throw new Error(`見出し「${label}」が見つからない`);
    return hit[0];
  };
  const prefCol = first("都道府県");
  const muniCol = first("市区町村");
  const applicantsCol = first("申込者数");
  const waitingCol = first("待機児童");
  if (!(colIndex(applicantsCol) < colIndex(waitingCol))) throw new Error("列の並びが想定と違う(申込者数が待機児童より左にない)");

  const out: WaitingRow[] = [];
  for (const r of [...rows.keys()].filter((k) => k > headerRow).sort((a, b) => a - b)) {
    const cells = rows.get(r)!;
    const prefecture = cells.get(prefCol);
    const municipality = cells.get(muniCol);
    if (!prefecture || !municipality) continue;
    const applicants = Number(cells.get(applicantsCol));
    const waiting = Number(cells.get(waitingCol));
    if (!Number.isFinite(applicants) || !Number.isFinite(waiting)) {
      throw new Error(`数値でない行: ${prefecture}${municipality} 申込者数=${cells.get(applicantsCol)} 待機児童=${cells.get(waitingCol)}`);
    }
    out.push({ prefecture, municipality, applicants, waiting });
  }
  return out;
}

export interface JoinResult {
  joined: Array<WaitingRow & { code: string; name: string }>;
}

/** 県名＋市区町村名で公開市区町村に結合する。未結合・重複・マスタ側の取りこぼしがあれば例外。 */
export function joinToMunicipalities(rows: readonly WaitingRow[], refs: readonly MunicipalityRef[]): JoinResult {
  const byKey = new Map<string, MunicipalityRef>();
  for (const ref of refs) {
    const leaf = ref.name.trim().split(/\s+/).pop() ?? ref.name;
    const key = `${ref.prefectureName}|${leaf}`;
    if (byKey.has(key)) throw new Error(`マスタ側で県名＋市区町村名が重複: ${key}`);
    byKey.set(key, ref);
  }
  const used = new Set<string>();
  const joined: JoinResult["joined"] = [];
  const missing: string[] = [];
  for (const row of rows) {
    const rawKey = `${row.prefecture}|${row.municipality}`;
    const ref = byKey.get(NAME_ALIASES[rawKey] ?? rawKey);
    if (!ref) {
      missing.push(rawKey);
      continue;
    }
    if (used.has(ref.code)) throw new Error(`資料側で同じ自治体が重複: ${rawKey} (${ref.code})`);
    used.add(ref.code);
    joined.push({ ...row, code: ref.code, name: ref.name });
  }
  if (missing.length > 0) throw new Error(`マスタに結合できない行 ${missing.length} 件: ${missing.join(", ")}`);
  const unmatched = refs.filter((r) => !used.has(r.code));
  if (unmatched.length > 0) throw new Error(`資料に行が無い公開市区町村 ${unmatched.length} 件: ${unmatched.map((r) => r.name).join(", ")}`);
  return { joined };
}

export interface Tally {
  municipalityCount: number;
  waitingMunicipalityCount: number;
  waitingTotal: number;
  applicantsTotal: number;
  zeroWaitingCount: number;
  noApplicantsCount: number;
}

export function tally(rows: readonly Pick<WaitingRow, "applicants" | "waiting">[]): Tally {
  return {
    municipalityCount: rows.length,
    waitingMunicipalityCount: rows.filter((r) => r.waiting > 0).length,
    waitingTotal: rows.reduce((a, r) => a + r.waiting, 0),
    applicantsTotal: rows.reduce((a, r) => a + r.applicants, 0),
    zeroWaitingCount: rows.filter((r) => r.waiting === 0).length,
    noApplicantsCount: rows.filter((r) => r.applicants === 0).length,
  };
}

/** 公表値(取り込み前の検算)。ずれたら例外にして取り込みを止める。 */
export function assertPublishedTotals(t: Tally, expected: { municipalityCount: number; waitingMunicipalityCount: number; waitingTotal: number }): void {
  const diffs: string[] = [];
  if (t.municipalityCount !== expected.municipalityCount) diffs.push(`市区町村 ${t.municipalityCount} != ${expected.municipalityCount}`);
  if (t.waitingMunicipalityCount !== expected.waitingMunicipalityCount) diffs.push(`待機児童のいる自治体 ${t.waitingMunicipalityCount} != ${expected.waitingMunicipalityCount}`);
  if (t.waitingTotal !== expected.waitingTotal) diffs.push(`待機児童の合計 ${t.waitingTotal} != ${expected.waitingTotal}`);
  if (diffs.length > 0) throw new Error(`公表値と一致しない: ${diffs.join(" / ")}`);
}

/** 待機児童率(％・小数4桁)。申込者数 0 は率を定義できず null。 */
export function waitingRate(waiting: number, applicants: number): number | null {
  if (applicants <= 0) return null;
  return Math.round((waiting / applicants) * 100 * 1e4) / 1e4;
}

/**
 * cities.json の行を作る。順位は値が正の自治体にだけ付ける(0 は「待機児童がいない」で順位の対象外、
 * 申込者数 0 は null)。同値は同順位(競争順位)。
 */
export function buildCityRows(
  joined: ReadonlyArray<{ code: string; name: string; applicants: number; waiting: number }>,
  opts: { year: number; unit: string },
): CityRow[] {
  const yearCode = String(opts.year);
  const rows: CityRow[] = joined
    .map((j) => ({
      areaCode: j.code,
      areaName: j.name,
      yearCode,
      yearName: `${yearCode}年度`,
      value: waitingRate(j.waiting, j.applicants),
      unit: opts.unit,
      rank: null as number | null,
      prefectureCode: j.code.slice(0, 2),
    }))
    .sort((a, b) => a.areaCode.localeCompare(b.areaCode));
  const ranked = rows.filter((r) => r.value !== null && r.value > 0).sort((a, b) => (b.value as number) - (a.value as number));
  let prevValue: number | null = null;
  let prevRank = 0;
  ranked.forEach((r, i) => {
    if (prevValue !== null && r.value === prevValue) r.rank = prevRank;
    else {
      r.rank = i + 1;
      prevRank = i + 1;
      prevValue = r.value;
    }
  });
  return rows;
}
