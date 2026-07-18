import type { PrefectureStatisticsCatalogEntry } from "./types";

const DISCOVERY_SOURCE =
  "https://rcisss.ier.hit-u.ac.jp/Japanese/guide/localstat.html";
const VERIFIED_AT = "2026-07-18";

const PORTALS = [
  ["01", "北海道", "https://www.pref.hokkaido.lg.jp/ss/tuk/index.htm"],
  ["02", "青森県", "https://www.pref.aomori.lg.jp/kensei/tokei/index.html"],
  ["03", "岩手県", "https://www3.pref.iwate.jp/webdb/view/outside/s14Tokei/top.html"],
  ["04", "宮城県", "https://www.pref.miyagi.jp/soshiki/toukei/"],
  ["05", "秋田県", "https://www.pref.akita.lg.jp/pages/genre/11706"],
  ["06", "山形県", "https://www.pref.yamagata.jp/ou/kikakushinko/020052/tokeijoho.html"],
  ["07", "福島県", "https://www.pref.fukushima.lg.jp/sec/11045b/15832.html"],
  ["08", "茨城県", "https://www.pref.ibaraki.jp/kikaku/tokei/fukyu/tokei/index.html"],
  ["09", "栃木県", "https://www.pref.tochigi.lg.jp/c04/pref/toukei/toukei/top.html"],
  ["10", "群馬県", "https://toukei.pref.gunma.jp/"],
  ["11", "埼玉県", "https://www.pref.saitama.lg.jp/theme/tokei/index.html"],
  ["12", "千葉県", "https://www.pref.chiba.lg.jp/toukei/toukeidata/hiroba/index.html"],
  ["13", "東京都", "https://www.toukei.metro.tokyo.lg.jp/index.htm"],
  ["14", "神奈川県", "https://www.pref.kanagawa.jp/menu/6/26/139/index.html"],
  ["15", "新潟県", "https://www.pref.niigata.lg.jp/tokei.html"],
  ["16", "富山県", "https://www.pref.toyama.jp/cms_cat/404060/index.html"],
  ["17", "石川県", "https://www.pref.ishikawa.lg.jp/kensei/index.html"],
  ["18", "福井県", "https://www.pref.fukui.lg.jp/doc/toukei/index.html"],
  ["19", "山梨県", "https://www.pref.yamanashi.jp/kensei/tokei/index.html"],
  ["20", "長野県", "https://tokei.pref.nagano.lg.jp/"],
  ["21", "岐阜県", "https://www.pref.gifu.lg.jp/page/13376.html"],
  ["22", "静岡県", "https://www.pref.shizuoka.jp/kensei/information/myshizuoka/1002256/index.html"],
  ["23", "愛知県", "https://www.pref.aichi.jp/soshiki/toukei/"],
  ["24", "三重県", "https://www.pref.mie.lg.jp/DATABOX/index.htm"],
  ["25", "滋賀県", "https://www.pref.shiga.lg.jp/kensei/tokei/"],
  ["26", "京都府", "https://www.pref.kyoto.jp/t-ptl/index.html"],
  ["27", "大阪府", "https://www.pref.osaka.lg.jp/o040090/toukei/top_portal/index.html"],
  ["28", "兵庫県", "https://web.pref.hyogo.lg.jp/stat/index.html"],
  ["29", "奈良県", "https://www.pref.nara.jp/1309.htm"],
  ["30", "和歌山県", "https://www.pref.wakayama.lg.jp/prefg/020300/"],
  ["31", "鳥取県", "https://www.pref.tottori.lg.jp/3214.htm"],
  ["32", "島根県", "https://pref.shimane-toukei.jp/"],
  ["33", "岡山県", "https://www.pref.okayama.jp/soshiki/15/"],
  ["34", "広島県", "https://www.pref.hiroshima.lg.jp/site/toukei/"],
  ["35", "山口県", "https://www.pref.yamaguchi.lg.jp/soshiki/22/"],
  ["36", "徳島県", "https://www.pref.tokushima.lg.jp/statistics/"],
  ["37", "香川県", "https://www.pref.kagawa.lg.jp/tokei/"],
  ["38", "愛媛県", "https://www.pref.ehime.jp/soshiki/17/"],
  ["39", "高知県", "https://www.pref.kochi.lg.jp/soshiki/120000/121901/"],
  ["40", "福岡県", "https://www.pref.fukuoka.lg.jp/dataweb/"],
  ["41", "佐賀県", "https://www.pref.saga.lg.jp/toukei/default.html"],
  ["42", "長崎県", "https://www.pref.nagasaki.jp/bunrui/kenseijoho/toukeijoho/"],
  ["43", "熊本県", "https://www.pref.kumamoto.jp/soshiki/20/"],
  ["44", "大分県", "https://www.pref.oita.jp/site/toukei/"],
  ["45", "宮崎県", "https://stat.pref.miyazaki.lg.jp/"],
  ["46", "鹿児島県", "https://www.pref.kagoshima.jp/tokei/index.html"],
  ["47", "沖縄県", "https://www.pref.okinawa.jp/toukeika/index.html"],
] as const;

export const PREFECTURE_STATISTICS_CATALOG = PORTALS.map(
  ([prefectureCode, prefectureName, url]): PrefectureStatisticsCatalogEntry => ({
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
  }),
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
