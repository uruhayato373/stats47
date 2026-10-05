import type { PrefectureStatisticsCatalogEntry } from "./types";
import { PREFECTURE_LIST_2DIGIT } from "@stats47/area";

const DISCOVERY_SOURCE =
  "https://rcisss.ier.hit-u.ac.jp/Japanese/guide/localstat.html";
const VERIFIED_AT = "2026-07-18";

const PORTALS = [
  ["01", "https://www.pref.hokkaido.lg.jp/ss/tuk/index.htm"],
  ["02", "https://www.pref.aomori.lg.jp/kensei/tokei/index.html"],
  ["03", "https://www3.pref.iwate.jp/webdb/view/outside/s14Tokei/top.html"],
  ["04", "https://www.pref.miyagi.jp/soshiki/toukei/"],
  ["05", "https://www.pref.akita.lg.jp/pages/genre/11706"],
  ["06", "https://www.pref.yamagata.jp/ou/kikakushinko/020052/tokeijoho.html"],
  ["07", "https://www.pref.fukushima.lg.jp/sec/11045b/15832.html"],
  ["08", "https://www.pref.ibaraki.jp/kikaku/tokei/fukyu/tokei/index.html"],
  ["09", "https://www.pref.tochigi.lg.jp/c04/pref/toukei/toukei/top.html"],
  ["10", "https://toukei.pref.gunma.jp/"],
  ["11", "https://www.pref.saitama.lg.jp/theme/tokei/index.html"],
  ["12", "https://www.pref.chiba.lg.jp/toukei/toukeidata/hiroba/index.html"],
  ["13", "https://www.toukei.metro.tokyo.lg.jp/index.htm"],
  ["14", "https://www.pref.kanagawa.jp/menu/6/26/139/index.html"],
  ["15", "https://www.pref.niigata.lg.jp/tokei.html"],
  ["16", "https://www.pref.toyama.jp/cms_cat/404060/index.html"],
  ["17", "https://www.pref.ishikawa.lg.jp/kensei/index.html"],
  ["18", "https://www.pref.fukui.lg.jp/doc/toukei/index.html"],
  ["19", "https://www.pref.yamanashi.jp/kensei/tokei/index.html"],
  ["20", "https://tokei.pref.nagano.lg.jp/"],
  ["21", "https://www.pref.gifu.lg.jp/page/13376.html"],
  ["22", "https://www.pref.shizuoka.jp/kensei/information/myshizuoka/1002256/index.html"],
  ["23", "https://www.pref.aichi.jp/soshiki/toukei/"],
  ["24", "https://www.pref.mie.lg.jp/DATABOX/index.htm"],
  ["25", "https://www.pref.shiga.lg.jp/kensei/tokei/"],
  ["26", "https://www.pref.kyoto.jp/t-ptl/index.html"],
  ["27", "https://www.pref.osaka.lg.jp/o040090/toukei/top_portal/index.html"],
  ["28", "https://web.pref.hyogo.lg.jp/stat/index.html"],
  ["29", "https://www.pref.nara.jp/1309.htm"],
  ["30", "https://www.pref.wakayama.lg.jp/prefg/020300/"],
  ["31", "https://www.pref.tottori.lg.jp/3214.htm"],
  ["32", "https://pref.shimane-toukei.jp/"],
  ["33", "https://www.pref.okayama.jp/soshiki/15/"],
  ["34", "https://www.pref.hiroshima.lg.jp/site/toukei/"],
  ["35", "https://www.pref.yamaguchi.lg.jp/soshiki/22/"],
  ["36", "https://www.pref.tokushima.lg.jp/statistics/"],
  ["37", "https://www.pref.kagawa.lg.jp/tokei/"],
  ["38", "https://www.pref.ehime.jp/soshiki/17/"],
  ["39", "https://www.pref.kochi.lg.jp/soshiki/120000/121901/"],
  ["40", "https://www.pref.fukuoka.lg.jp/dataweb/"],
  ["41", "https://www.pref.saga.lg.jp/toukei/default.html"],
  ["42", "https://www.pref.nagasaki.jp/bunrui/kenseijoho/toukeijoho/"],
  ["43", "https://www.pref.kumamoto.jp/soshiki/20/"],
  ["44", "https://www.pref.oita.jp/site/toukei/"],
  ["45", "https://stat.pref.miyazaki.lg.jp/"],
  ["46", "https://www.pref.kagoshima.jp/tokei/index.html"],
  ["47", "https://www.pref.okinawa.jp/toukeika/index.html"],
] as const;

/** 2 桁コード → 都道府県名。名称の正本は @stats47/area の prefectures.json。 */
const PREFECTURE_NAME_BY_CODE = new Map(PREFECTURE_LIST_2DIGIT.map((p) => [p.code, p.name]));

function prefectureNameOf(prefectureCode: string): string {
  const name = PREFECTURE_NAME_BY_CODE.get(prefectureCode);
  if (!name) throw new Error(`prefecture-statistics-catalog: 未知の都道府県コード ${prefectureCode}`);
  return name;
}

export const PREFECTURE_STATISTICS_CATALOG = PORTALS.map(
  ([prefectureCode, url]): PrefectureStatisticsCatalogEntry => {
    const prefectureName = prefectureNameOf(prefectureCode);
    return {
      prefectureCode,
      prefectureName,
      resources: [
        {
          id: `${prefectureCode}-statistics-portal`,
          title: `${prefectureName} 公式統計情報`,
          url,
          type: "statistics-portal",
          topics: ["general"],
          publisher: prefectureName,
          isOfficial: true,
          discoveredFrom: DISCOVERY_SOURCE,
          lastVerifiedAt: VERIFIED_AT,
        },
      ],
    };
  },
);

export function getPrefectureStatisticsEntry(
  prefectureCode: string,
): PrefectureStatisticsCatalogEntry | undefined {
  return PREFECTURE_STATISTICS_CATALOG.find(
    (entry) => entry.prefectureCode === prefectureCode,
  );
}

export type {
  PrefectureStatisticsCatalogEntry,
  PrefectureStatisticsResource,
  PrefectureStatisticsResourceType,
  PrefectureStatisticsTopicKey,
} from "./types";
export {
  PREFECTURE_STATISTICS_RESOURCE_TYPES,
  PREFECTURE_STATISTICS_TOPIC_KEYS,
} from "./types";
