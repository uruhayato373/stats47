/**
 * 実データ スナップショット: 地方公務員 全職種平均給与月額（都道府県別・2024年）。
 * 出典: 地方公務員給与実態調査（総務省）。
 * stats47 の R2 `app/ranking/avg-salary-all-prefecture/values.json`（最新フル 47 県 = 2024年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts avg-salary-all-prefecture`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "地方公務員給与実態調査（総務省）",
  tableName: "全職種 平均給与月額",
  statsDataId: "-",
  url: "https://www.soumu.go.jp/main_sosiki/jichi_gyousei/c-gyousei/teiin-kyuuyo02.html",
  year: "2024",
  retrievedAt: "2026-07-23",
  unit: "円",
  transform: "都道府県別・基準年（2024）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2024）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 地方公務員 全職種平均給与月額（2024）。47 県の実データ。 */
export const AVG_SALARY_ALL_PREFECTURE_2024: Dataset = normalizeDataset({
  indicator: "地方公務員 全職種平均給与月額",
  unit: "円",
  year: "2024",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 418868 },
    { code: "02000", value: 408939 },
    { code: "03000", value: 429466 },
    { code: "04000", value: 423986 },
    { code: "05000", value: 403950 },
    { code: "06000", value: 419406 },
    { code: "07000", value: 420308 },
    { code: "08000", value: 419642 },
    { code: "09000", value: 406956 },
    { code: "10000", value: 411280 },
    { code: "11000", value: 428195 },
    { code: "12000", value: 434192 },
    { code: "13000", value: 470775 },
    { code: "14000", value: 446786 },
    { code: "15000", value: 431146 },
    { code: "16000", value: 406827 },
    { code: "17000", value: 412562 },
    { code: "18000", value: 404151 },
    { code: "19000", value: 415726 },
    { code: "20000", value: 397681 },
    { code: "21000", value: 407373 },
    { code: "22000", value: 438633 },
    { code: "23000", value: 439405 },
    { code: "24000", value: 422796 },
    { code: "25000", value: 427326 },
    { code: "26000", value: 422461 },
    { code: "27000", value: 447213 },
    { code: "28000", value: 436336 },
    { code: "29000", value: 404437 },
    { code: "30000", value: 414376 },
    { code: "31000", value: 408736 },
    { code: "32000", value: 411054 },
    { code: "33000", value: 418738 },
    { code: "34000", value: 419058 },
    { code: "35000", value: 401764 },
    { code: "36000", value: 426081 },
    { code: "37000", value: 422017 },
    { code: "38000", value: 416744 },
    { code: "39000", value: 401671 },
    { code: "40000", value: 416800 },
    { code: "41000", value: 394822 },
    { code: "42000", value: 409428 },
    { code: "43000", value: 406248 },
    { code: "44000", value: 410710 },
    { code: "45000", value: 405160 },
    { code: "46000", value: 417360 },
    { code: "47000", value: 418337 },
  ],
});
