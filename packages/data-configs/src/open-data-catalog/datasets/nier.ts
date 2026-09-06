import type { OpenDatasetDefinition } from "../types";

/**
 * 国立教育政策研究所 (NIER) が実施主体・文部科学省が公表する「全国学力・学習状況調査」。
 * 調査: open-data-curator 2026-07-20。
 *
 * 検証方法: (1) NIER 公式ページ (kaihatsu/zenkokugakuryoku.html) で年度別リンク一覧を確認し、
 * 令和2年度 (2020) が「報告書・調査結果資料―該当なし」(新型コロナで中止) であることを確認。
 * 最新は令和8年度 (2026、全国平均のみ 2026-07-16 公表・都道府県別 factsheet は未公開)。
 * 都道府県別の全量は令和7年度 (2025) が最新。(2) 令和7年度 factsheet 一覧ページ
 * (25chousakekkahoukoku/factsheet/prefecture_city.html) で47都道府県+道府県(指定都市除く)+
 * 指定都市の3セクション・URLパターン (/{YY}chousakekkahoukoku/factsheet/{code2桁}_{ローマ字}/index.html)
 * を確認。(3) 北海道ページ (01_hokkaido/index.html) を実際に開き、教科別正答率を含む
 * 「問題別調査結果」xlsx (01p_25q.xlsx 等) と、生活習慣設問を含む「児童質問調査回答結果集計表」
 * xlsx (01p_25a.xlsx) の実在をファイル名レベルで確認。(4) NIER 著作権ページ (11_copyright/) が
 * 「文部科学省ウェブサイト利用規約に従う」と明記しているため MEXT 規約ページ (b_menu/1351168.htm) を
 * 直接確認し、政府標準利用規約2.0・CC BY 4.0 互換・商用利用可・出典表示必須・加工時表示必須を確認。
 * コード+ローマ字の都道府県別 URL はテンプレートのため downloadUrl には登録しない
 * (open-data-curator 編集規律: 類推ファイル名・コードプレースホルダは verification.notes に記録)。
 */

const LANDING = "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/prefecture_city.html";
const TERMS_URL = "https://www.mext.go.jp/b_menu/1351168.htm";
const VERIFIED_AT = "2026-07-20";
const VERIFIED_FROM_URLS = [
  "https://www.nier.go.jp/kaihatsu/zenkokugakuryoku.html",
  "https://www.nier.go.jp/25chousakekkahoukoku/index.html",
  LANDING,
  "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/01_hokkaido/index.html",
  "https://www.nier.go.jp/11_copyright/",
  TERMS_URL,
] as const;

const NIER_LICENSE = {
  name: "文部科学省ウェブサイト利用規約 (政府標準利用規約2.0・CC BY 4.0 互換。NIER著作権ページが同規約に従う旨明記)",
  commercialUse: "allowed" as const,
  attributionRequired: true,
  modificationNoticeRequired: true,
  termsUrl: TERMS_URL,
};

export const NIER_DATASETS: readonly OpenDatasetDefinition[] = [
  {
    id: "nier-gakuryoku-achievement",
    sourceId: "nier-gakuryoku-chousa",
    name: "全国学力・学習状況調査 教科正答率 (都道府県別)",
    description:
      "小学6年・中学3年対象の国語・算数(数学)等の教科別正答率。都道府県・指定都市別に集計した" +
      "「問題別調査結果」xlsx (例 01p_25q.xlsx=小学校、01m_25qs.xlsx=中学校)。2007年度開始・毎年実施" +
      "(令和2年度=2020年は新型コロナで中止・欠測)。",
    landingPageUrl: LANDING,
    accessMethods: ["file-download"],
    formats: ["xlsx"],
    geographicLevels: ["prefecture"],
    hasGeometry: false,
    coverage: "all-japan",
    timeCoverage: "2007年度〜継続 (毎年、2020年度は中止で欠測)",
    updateFrequency: "annual",
    license: NIER_LICENSE,
    stats47Uses: ["ranking", "theme"],
    suggestedCategories: ["educationsports"],
    existingMetricKeys: ["academic-achievement-test-average-rate"],
    existingGisDataIds: [],
    candidateMetricConcepts: [
      "小学生 国語 正答率 (都道府県別)",
      "小学生 算数 正答率 (都道府県別)",
      "中学生 国語 正答率 (都道府県別)",
      "中学生 数学 正答率 (都道府県別)",
    ],
    verification: {
      status: "partially-verified",
      verifiedAt: VERIFIED_AT,
      verifiedFromUrls: [...VERIFIED_FROM_URLS],
      notes:
        "都道府県別ページの URL パターン (/25chousakekkahoukoku/factsheet/{2桁コード}_{ローマ字}/index.html) " +
        "を北海道(01)・東京都(13)・沖縄県(47)の実ページ取得で確認。北海道ページで教科別正答率を含む" +
        "「問題別調査結果」xlsx (01p_25q.xlsx 等) のファイル名を実在確認。コード+ローマ字の県別 URL は" +
        "テンプレートのため downloadUrl は未登録 (landingPageUrl の一覧ページから各県ページへ遷移する)。" +
        "令和2年度(2020)は NIER 公式ページで「報告書・調査結果資料―該当なし」を確認し中止と判定。" +
        "最新の令和8年度(2026)は全国平均のみ2026-07-16公表で都道府県別 factsheet は未公開のため、" +
        "都道府県別全量が揃う最新年は令和7年度(2025)。e-Stat には未掲載 (検索で不在確認、2026-07-20)。" +
        "47都道府県全件の正答率セル値自体はダウンロードして開いておらず未確認のため partially-verified。" +
        "非e-Stat統計のため取得は data-ingester が xlsx 解析の専用パイプラインを新設する必要がある。",
    },
  },
  {
    id: "nier-gakuryoku-lifestyle",
    sourceId: "nier-gakuryoku-chousa",
    name: "全国学力・学習状況調査 児童生徒質問紙 (生活習慣・都道府県別)",
    description:
      "小学6年・中学3年対象の児童生徒質問紙調査。朝食摂取・読書・宿題実行・地域行事参加・" +
      "インターネット利用時間・通塾・学校外学習時間・通学時間等の生活習慣設問を都道府県・指定都市別に" +
      "集計した「回答結果集計表」xlsx (例 01p_25a.xlsx=小学校、01m_25a.xlsx=中学校)。",
    landingPageUrl: LANDING,
    accessMethods: ["file-download"],
    formats: ["xlsx"],
    geographicLevels: ["prefecture"],
    hasGeometry: false,
    coverage: "all-japan",
    timeCoverage: "2007年度〜継続 (毎年、2020年度は中止で欠測)",
    updateFrequency: "annual",
    license: NIER_LICENSE,
    stats47Uses: ["ranking", "theme"],
    suggestedCategories: ["educationsports"],
    existingMetricKeys: [],
    existingGisDataIds: [],
    candidateMetricConcepts: [
      "朝食摂取率 (小学生・都道府県別)",
      "読書率 (小学生・都道府県別)",
      "宿題実行率 (小学生・都道府県別)",
      "地域行事参加率 (小学生・都道府県別)",
      "長時間インターネット利用率 (小学生・都道府県別)",
      "通塾率 (小学生・都道府県別)",
      "学校外学習率 (小学生・都道府県別)",
      "通学時間 (小学生・都道府県別)",
    ],
    verification: {
      status: "partially-verified",
      verifiedAt: VERIFIED_AT,
      verifiedFromUrls: [...VERIFIED_FROM_URLS],
      notes:
        "北海道ページで「児童質問調査回答結果集計表」xlsx (01p_25a.xlsx) のファイル名を実在確認。" +
        "朝食・読書・宿題・地域行事参加・ネット利用・通塾・学校外学習・通学時間の8設問が同ファイル内の" +
        "どのシート・列に収録されるかは実ファイルをダウンロードして開いておらず未確認のため" +
        "partially-verified。取得は data-ingester が xlsx 解析の専用パイプラインを新設する必要がある" +
        "(既存 e-Stat クライアントは使えない、jflec-financial-literacy-survey-prefecture と同様の構成)。",
    },
  },
];
