import type { ExternalSource } from "../types";

// 抽出位置・年・単位を recipe に含める。観測値はここに保存しない。
export const HEALTHY_LIFE_RELEASE = {
  kind: "healthy-life-pdf",
  version: 1,
  sourceUrl: "https://www.mhlw.go.jp/content/10904750/001363069.pdf",
  sha256: "16447afe7041fc0ed1c0750c84623c334dd0d21d377f15178593cf3f9ebff5c6",
  unit: "年",
  yearFormat: "calendar",
  rowTop: [120, 777],
  rowTolerance: 2,
  columns: [
    { year: 2019, heading: "令和元年", nameX: [208, 246], valueX: [246, 387] },
    { year: 2022, heading: "令和4年", nameX: [390, 433], valueX: [433, 590] },
  ],
} as const;

export const AGRICULTURAL_OUTPUT_RELEASE = {
  kind: "agricultural-output-xlsx",
  version: 1,
  sourceUrl: "https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040426672",
  sha256: "5bc5818caa3a44249c7b71b7ca0c9c96cf9644686d770dd2deb961ec5e31a2dc",
  year: 2024,
  yearFormat: "calendar",
  sheet: "都道府県ア（実額）",
  headers: { A2: "(2) 都道府県別農業産出額及び生産農業所得", A3: "ア 実額", C6: "農業産出額", C7: "計", C12: "産出額 ①＋②＋③", C14: "億円" },
  rows: [15, 61],
  nameColumn: "A",
  codeColumn: "B",
  valueColumn: "C",
  totalLabelCell: "A62",
  totalValueCell: "C62",
  sourceUnit: "億円",
  unit: "百万円",
  valueScale: 100,
  // 旧年を一次資料から再構築する。config.estat には置かず汎用 e-Stat 更新と分離する。
  history: { statsDataId: "0000010103", cdCat01: "C3101", from: 1975, to: 2023, unit: "百万円" },
} as const;

const RESTORE = "node --conditions=react-server --import tsx packages/data-configs/scripts/refresh-official-theme-data.ts --stage-dir .local/r2 --artifact-dir /tmp/stats47-official-theme-data";

export function healthyLifeSource(sex: "male" | "female"): ExternalSource {
  const page = sex === "male" ? 4 : 5; // PDF の先頭を 1 とするページ番号
  return {
    kind: "external",
    fetcherKey: "manual",
    displayName: "厚生労働省「健康寿命の令和4年値について」",
    url: HEALTHY_LIFE_RELEASE.sourceUrl,
    config: {
      extraction: { ...HEALTHY_LIFE_RELEASE, page, sex },
      provenance: {
        publicationIndexUrl: "https://kennet.mhlw.go.jp/information/information/hale/h-01-002.html",
        pdfUrl: HEALTHY_LIFE_RELEASE.sourceUrl,
        table: `都道府県別健康寿命（${sex === "male" ? "男性" : "女性"}）`,
        pdfPage: page,
        valueColumn: "令和元年（中央列）・令和4年（右列）の平均値。信頼区間の端点は使用しない",
        dataYear: 2022,
        accessedAt: "2026-09-08",
        extraction: "pdfplumber で列座標と行座標を照合。47県名をコード辞書で正規化し、平均値を各行から1件ずつ抽出",
        verification: "原本 sha256、男女別ページ画像、2019年の47県を既存R2値と全件照合、各年47県・重複なし・値域を検証。図のエラーバーは95%信頼区間",
        restore: RESTORE,
      },
    },
  };
}

export const agriculturalOutputSource: ExternalSource = {
  kind: "external",
  fetcherKey: "manual",
  displayName: "生産農業所得統計",
  url: "https://www.e-stat.go.jp/stat-search/files?layout=datalist&lid=000001478969&page=1",
  config: {
    extraction: AGRICULTURAL_OUTPUT_RELEASE,
    provenance: {
      publicationIndexUrl: "https://www.e-stat.go.jp/stat-search/files?layout=datalist&lid=000001478969&page=1",
      url: AGRICULTURAL_OUTPUT_RELEASE.sourceUrl,
      table: "令和6年生産農業所得統計（確報）表3 都道府県別農業産出額及び生産農業所得・ア 実額",
      valueColumn: "都道府県ア（実額）シート C列「農業産出額・計・産出額①＋②＋③」（15〜61行）",
      dataYear: 2024,
      accessedAt: "2026-09-08",
      extraction: "openpyxl で見出し・県コードを検証して総額列を取得。億円を百万円へ100倍換算。1975〜2023年はSSDS C3101の百万円値を保持",
      verification: "原本 sha256、各年47県・重複なし・単位換算、47県合計と公表合計の丸め許容範囲、過去全2303値のe-Stat照合",
      methodologyUrl: "https://www.maff.go.jp/j/tokei/kouhyou/nougyou_sansyutu/gaiyou/",
      restore: RESTORE,
    },
  },
};
