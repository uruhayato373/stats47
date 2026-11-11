import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

const R7_XLSX_URL =
  "https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/b0a8057b-34bf-4c20-84fb-ae592708ca9b/1aa96453/20250828_policies_hoiku_torimatome_r7_04.xlsx";

/**
 * 市区町村の保育所等利用待機児童率 (待機児童 ÷ 保育利用申込者数)。e-Stat に無く、こども家庭庁の
 * 「保育所等関連状況取りまとめ」参考 Excel を毎年 8 月末の公表後に手動で取り込む (fetcherKey: "manual")。
 * ファイルの URL が年ごとに変わるため cron にはしない。取り込み手順は
 * packages/data-configs/scripts/ingest-childcare-waiting-rate.ts の冒頭に書いてある。
 */
export const nurseryWaitingChildrenRate: MetricConfig = {
  key: "nursery-waiting-children-rate",
  title: "保育所等利用待機児童率",
  subtitle: "待機児童数の保育利用申込者数に対する割合",
  description:
    "保育所等の利用を申し込んだ児童(申込者数)のうち、利用できず待機児童とされた児童の割合。こども家庭庁「保育所等関連状況取りまとめ」の市区町村別の申込者数と待機児童数から、待機児童数÷申込者数×100で求めた。0〜5歳の合計で、4月1日時点。",
  note: "令和7年(2025年)4月1日時点。待機児童がいる自治体は全1,741市区町村のうち211で、残り1,530は待機児童0のため順位から除く(うち申込者数0の8自治体は率を定義できない)。待機児童の定義は国の基準による(育児休業中・特定の園のみ希望などの児童は含まない)。政令指定都市は市全体、東京23区は区ごと。算出：stats47。",
  unit: "％",
  category: "socialsecurity",
  surveyId: "childcare-related-status-report",
  source: {
    kind: "external",
    fetcherKey: "manual",
    config: {
      source: {
        name: "保育所等関連状況取りまとめ（令和7年4月1日）／こども家庭庁",
        url: "https://www.cfa.go.jp/policies/hoiku/torimatome/r7/",
        license: "公共データ利用規約（第1.0版）PDL1.0（商用利用可・出典と加工者の表示）",
        termsUrl: "https://www.cfa.go.jp/copyright-policy",
      },
      sourceSha256: "5f3e86aa669a9ca66c55549991491a37c059d40110e88eb8b07fbd8a664b9bca",
      dataDate: "2025-04-01",
      nationalWaitingTotal: 2254,
      waitingMunicipalityCount: 211,
      municipalityCount: 1741,
      extraction: {
        sheet: "申込者の状況",
        prefectureColumn: "都道府県",
        municipalityColumn: "市区町村",
        applicantsColumn: "合計の申込者数（最初の「申込者数」列）",
        waitingColumn: "合計の待機児童（最初の「待機児童」列）",
        join: "都道府県名＋市区町村名で packages/area の公開市区町村(standard-municipality-v1)に結合",
        nameAlias: { "高知県|梼原町": "高知県|檮原町" },
        formula: "待機児童 ÷ 申込者数 × 100（小数4桁）",
      },
      provenance: {
        publicationIndexUrl: "https://www.cfa.go.jp/policies/hoiku/torimatome/r7/",
        url: R7_XLSX_URL,
        table: "（参考）定員・申込者の状況（令和７年４月１日）シート「申込者の状況」",
        valueColumn: "合計の「待機児童」列 ÷ 合計の「申込者数」列 × 100",
        dataYear: "令和7年(2025年)4月1日",
        accessedAt: "2026-11-01",
        attributionUrl: "https://www.cfa.go.jp/copyright-policy",
        extraction:
          "公開 Excel を取得し、シート「申込者の状況」の行を決定的に読む。都道府県名＋市区町村名で packages/area の公開市区町村 1,741 に結合する(同じ組の重複は拒否。公表側の表記「梼原町」だけマスタの「檮原町」へ別名で対応し、それ以外の未結合は止める)。申込者数が0の自治体は率を定義できないので値なし、待機児童0の自治体は値0とし、順位は値が正の自治体にだけ付ける。",
        verification:
          "1,741市区町村の結合に過不足0、重複0。待機児童のいる自治体211、待機児童の合計2,254人が本文の公表値と一致(一致しなければ取り込みを止める)。申込者数の合計は2,765,235人。",
        restore:
          "npx tsx packages/data-configs/scripts/ingest-childcare-waiting-rate.ts --dry-run [--url <新年度のxlsx直リンク> --year <年>]（--dry-run を外すと .local/r2/app/stats/nursery-waiting-children-rate/cities.json へ書く）",
      },
    },
    // 調査の紐付け辞書 (カタログの surveys.source-names の displayNameToSurvey) と完全一致させる
    displayName: "こども家庭庁「保育所等関連状況取りまとめ」",
    url: "https://www.cfa.go.jp/policies/hoiku/torimatome/r7/",
  },
  entities: ["city"],
  years: {
    from: 2025,
    to: 2025,
  },
  yearFormat: "fiscal",
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    colorScheme: "interpolateReds",
    colorSchemeType: "sequential",
    domain: { mode: "zero" },
  },
  display: {
    conversionFactor: 1,
    decimalPlaces: 2,
  },
  calculation: {
    isCalculated: false,
  },
  isActive: true,
};
