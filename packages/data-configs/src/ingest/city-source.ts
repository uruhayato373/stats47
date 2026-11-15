import { isCityAreaCode, PREFECTURE_CAPITAL_CITIES } from "@stats47/area";
import { prefToCityStatsDataId } from "../ssds/entity-source";
import type { AreaAxisMember } from "../area-axis.js";
import type { KakeiChousaSource, MetricConfig, SourceConfig } from "../types.js";
import { catalogAxisMembers, fetchAxisMembers } from "./area-axis-fetch.js";
import { fetchEstatData, type EstatFetchResult, type EstatValue } from "./estat-fetch.js";
import { shapeForCity, shapeForPrefecture } from "./shape.js";


/**
 * SSDS の分類名から先頭のコード接頭辞を落とす。
 *
 * e-Stat の CLASS 名は `#A03503_65歳以上人口割合` の形で、**コードが名前に埋まっている**。
 * 都道府県表と市区町村表で同じ指標に別コードが振られているため、コードのまま突き合わせると
 * 一致しない。名前部分だけを比較の鍵にする。
 */
export function stripCatCodePrefix(name: string): string {
  return name.replace(/^#?[A-Za-z0-9]+_/, "").trim();
}

/**
 * 市区町村表の cdCat01 を**指標名の完全一致**で解決する (2026-07-31)。
 *
 * ## なぜ要るか
 *
 * `prefToCityStatsDataId` は「同一 cdCat01 で city 表から取れる」前提だったが、実測すると
 * SSDS は表ごとにコードを振り直している:
 *
 *   都道府県表 0000010201: #A03501 15歳未満 / #A03502 15〜64歳 / #A03503 65歳以上
 *   市区町村表 0000020301: #A03504 15歳未満 / #A03505 15〜64歳 / #A03506 65歳以上
 *
 * 同じ指標に別コードが割り当たっているため、pref のコードを city 表に渡すと 0 行になる
 * (該当データなし)。一致する指標もあるので前提が長く成立して見えていた。
 *
 * ## 安全側の設計
 *
 * - **接頭辞を落とした名前の完全一致だけ**を採る。曖昧一致はしない
 *   (「15歳未満」を「65歳以上」に取り違えたら、47 行そろって値も妥当なので
 *    形状ゲートでは捕まらない。空のままの方がはるかに安全)
 * - 候補が 1 件に定まらなければ null を返す
 * - **コードでの取得が 0 行だったときだけ**呼ぶ。今動いている metric の経路は変わらない
 */
export function resolveCat01ByName(
  prefMembers: readonly AreaAxisMember[],
  cityMembers: readonly AreaAxisMember[],
  prefCat01: string,
): string | null {
  const pref = prefMembers.find((m) => m.code === prefCat01);
  if (!pref) return null;
  const want = stripCatCodePrefix(pref.name);
  if (!want) return null;
  const hits = cityMembers.filter((m) => stripCatCodePrefix(m.name) === want);
  return hits.length === 1 ? hits[0].code : null;
}

/**
 * pref/city 両方の cat01 メンバーを取り、名前一致で city 側のコードを解決する。
 *
 * getMetaInfo が落ちたら **null を返して空のまま進む** (推測で別コードを当てない)。
 */
async function resolveCityCat01(
  appId: string,
  prefStatsDataId: string,
  cityStatsDataId: string,
  prefCat01: string,
): Promise<string | null> {
  // 分類名は目録 (estat-catalog/meta) から読む。目録に無い表だけ live の getMetaInfo に頼る
  const members = (id: string) => catalogAxisMembers(id, "cat01", null).catch(() => fetchAxisMembers(appId, id, "cat01"));
  try {
    const [prefMeta, cityMeta] = await Promise.all([members(prefStatsDataId), members(cityStatsDataId)]);
    return resolveCat01ByName(prefMeta.members, cityMeta.members, prefCat01);
  } catch {
    return null;
  }
}

/**
 * 家計調査 (0003348235/0003348239) の @area は都道府県コードではなく
 * 県庁所在市コード (原則 NN003、例外: 福岡市=40004。40003 は北九州市)。
 * サイトの慣行 (既存 675 metric) に合わせ、県庁所在市の値を都道府県コード NN000 に写像する。
 * 全国 (00000) と県庁所在市以外の大都市 (川崎/相模原/浜松/堺/北九州) は対象外として捨てる。
 */
const KAKEI_CITY_TO_PREF = new Map(PREFECTURE_CAPITAL_CITIES.map(area => [area.estatAreaCode, area.prefectureCode]));
export function remapKakeiAreas(values: EstatValue[]): EstatValue[] {
  const out: EstatValue[] = [];
  for (const v of values) {
    const pref = KAKEI_CITY_TO_PREF.get(v["@area"]);
    if (!pref) continue;
    out.push({ ...v, "@area": pref });
  }
  return out;
}

/**
 * kakei-chousa は e-Stat API の通常テーブル (statsDataId + cdCat01/cdCat02 filter)。
 * filter に格納されたパラメータを estat source と同形に写して同一経路で fetch する。statsDataId が無ければ null。
 */
export function kakeiEstatSource(source: KakeiChousaSource): Extract<SourceConfig, { kind: "estat" }> | null {
  const filter = (source.filter ?? {}) as {
    statsDataId?: string;
    cdCat01?: string;
    cdCat02?: string;
    // 品目を合算して 1 指標にする (例: 情報通信関係費 = 固定電話+移動電話+NHK+ケーブルTV+他の受信料)。
    // 家計調査は品目ごとに cdCat01 が分かれており総数コードが無いので estat と同じ axisSum を使う
    axisSum?: Extract<SourceConfig, { kind: "estat" }>["axisSum"];
    // 同じ表の費目の割合 (例: 住居 ÷ 消費支出)。分子・分母は estat と同じ axisRatio で取る
    axisRatio?: Extract<SourceConfig, { kind: "estat" }>["axisRatio"];
  };
  if (!filter.statsDataId) return null;
  return {
    kind: "estat",
    statsDataId: filter.statsDataId,
    cdCat01: filter.cdCat01,
    cdCat02: filter.cdCat02,
    axisSum: filter.axisSum,
    axisRatio: filter.axisRatio,
  };
}

/**
 * 取り込みが県の values.json に書く行を、`years` で絞らずに返す (e-Stat の実在年の台帳用)。
 * 取得・家計調査の写像・県の判定・値の読み方は processOne と同じ経路を通り、年の絞り込みだけを外す。
 * 補完元 (supplementalSources) は別の表なので足さない。
 */
export async function fetchPrefectureRowsAllYears(
  appId: string,
  config: MetricConfig,
  src: Extract<SourceConfig, { kind: "estat" }>,
): Promise<{ rows: ReadonlyArray<{ areaCode: string; yearCode: string; value: number | null }>; raw: EstatFetchResult["raw"] }> {
  const fetched = await fetchEstatData(appId, src);
  const values =
    config.source.kind === "kakei-chousa" ? remapKakeiAreas(fetched.values) : fetched.values;
  return { rows: shapeForPrefecture({ ...config, years: "all" }, values).rows, raw: fetched.raw };
}

/**
 * 市区町村の取り出し条件 (citySource か、県の社会・人口統計体系の表に対応する市区町村の表)。取れない表なら null。
 * 台帳の行のキーに使う。cdCat01 の引き直しは取得時に行うので、ここでは引き直す前の条件を返す。
 */
export function cityEstatSource(
  config: MetricConfig,
  src: Extract<SourceConfig, { kind: "estat" }>,
): Extract<SourceConfig, { kind: "estat" }> | null {
  if (config.citySource) return config.citySource;
  const cityStatsDataId = prefToCityStatsDataId(src.statsDataId);
  return cityStatsDataId ? { ...src, statsDataId: cityStatsDataId } : null;
}

/** 取得に成功した市区町村の表・項目を値と一緒に返す。実在年調査と本取り込みが同じ経路を使う。 */
export async function fetchCityData(
  appId: string,
  config: MetricConfig,
  src: Extract<SourceConfig, { kind: "estat" }>,
  fetchSource = fetchEstatData,
  resolveCategory = resolveCityCat01,
): Promise<(EstatFetchResult & { source: Extract<SourceConfig, { kind: "estat" }> }) | null> {
  let source = cityEstatSource(config, src);
  if (!source) return null;
  let fetched = await fetchSource(appId, source);
  // 指標名の完全一致による再解決は、明示citySourceがなく最初の取得が0件の場合だけ。
  if (!config.citySource && fetched.values.length === 0 && src.cdCat01) {
    const alt = await resolveCategory(appId, src.statsDataId, source.statsDataId, src.cdCat01);
    if (alt) {
      source = { ...source, cdCat01: alt };
      fetched = await fetchSource(appId, source);
    }
  }
  return { ...fetched, source };
}

/**
 * 取り込みが cities.json に書く行を、`years` で絞らずに返す (e-Stat の実在年の台帳用)。
 * 表の選び方・cdCat01 の引き直し・現行の市区町村マスタにあるコードだけを採る判定は processOne と同じ。
 * 補完元 (supplementalSources) は足さない。市区町村の表が無ければ null。
 */
export async function fetchCityRowsAllYears(
  appId: string,
  config: MetricConfig,
  src: Extract<SourceConfig, { kind: "estat" }>,
): Promise<{ rows: ReadonlyArray<{ areaCode: string; yearCode: string; value: number | null }>; raw: EstatFetchResult["raw"] } | null> {
  const fetched = await fetchCityData(appId, config, src);
  if (!fetched) return null;
  return { rows: shapeForCity({ ...config, years: "all" }, fetched.values, fetched.source).rows, raw: fetched.raw };
}

/** 5 桁エリアコード判定 (都道府県集計行 NN000) */


/** 5 桁市区町村コード判定 (NNxyz, xyz≠000, 県 01-47) */


/**
 * 市区町村として取り込むコードか。5 桁の形式に加えて、現行の市区町村マスタにあることを要求する。
 * 国勢調査の「2000年市区町村含む」表は合併前の旧町村 (「（旧：家島町）」等) を別コードで返し、
 * 形式だけでは現行と区別できない (2026-09-30 実測: 0004065882 の市区町村 3,736 = 現行 1,913 +
 * 旧 1,823、マスタとの重複 0。既存 cities.json 39 指標 816,460 行にマスタ外コードは 0)。
 */
export function isIngestableCityCode(code: string, currentCities: ReadonlyMap<string, string>): boolean {
  return isCityAreaCode(code) && currentCities.has(code);
}

/**
 * 社会・人口統計体系: 都道府県表 statsDataId → 市区町村表 statsDataId を解決。
 *
 * metric は pref 表 (00000101xx / 00000102xx) のみを source に持つため、city データは
 * 同一 cdCat01 で対応する city 表から取得する。マッピング (2026-05-29 実測で確定):
 *   - pref 基礎データ      00000101CC → city 基礎データ(廃置分合処理済)   00000202CC
 *   - pref 社会生活統計指標 00000102CC → city 社会生活統計指標(廃置分合処理済) 00000203CC
 *     (いずれも廃置分合処理済を採用。area マスタ cities.json=1913 件と件数一致し areaName join が
 *      完全になるため。オリジナル(00000201CC,1917件)は master に無い 4 件が join 漏れになる。
 *      値は同一: C3109 0000020203→札幌519, #A05307 0000010201→0000020301 で確認済)
 *   - CC=12(家計)/13(生活時間) は city 表が存在しない → null
 *   - source が初めから市区町村表 (00000202CC / 00000203CC) の市区町村専用 metric はその表を使う
 *     (以前は null を返し、current-balance-ratio-city 等が取り込みで city=skip になっていた)
 */
export { prefToCityStatsDataId } from "../ssds/entity-source";
