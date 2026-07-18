import type { OpenDatasetDefinition } from "../types";

/**
 * 金融経済教育推進機構 (J-FLEC、旧・金融広報中央委員会「知るぽると」事業を2024年に承継) の
 * 「金融リテラシー調査」。調査: open-data-curator 2026-07-19。
 *
 * 検証方法: (1) J-FLEC ウェブサイト運営方針ページの生 HTML を直接 curl+パースし、
 * 「商用目的での引用・使用（調査データは除く）はお断りしております」の一文を確認 (=調査データは
 * 商用利用の除外規定=許可)。(2) 統計表一括ファイル (xlsx) を実際にダウンロードし zip 構造を解析、
 * ワークシート名で 47 都道府県別シート (39 北海道〜85 沖縄県)・「86 都道府県比較表 (1)-(4)」・
 * 「90 都道府県別分析一覧表」の実在と、正答率・自己評価・金融トラブル有無・借入状況・行動バイアス系
 * 設問 (購入前によく考える 等) の都道府県別集計セルを直接確認済み。老後資金計画の設問が同一覧表の
 * 後方列 (今回未読み込み範囲) にある可能性が高いが個別確認はしていない。
 */

const LANDING = "https://www.j-flec.go.jp/data/literacy_chosa_2025/";
const DOWNLOAD_XLSX = "https://j-flec.go.jp/wpimages/uploads/25lite_toukei.xlsx";
const TERMS_URL = "https://www.j-flec.go.jp/guidelines/";
const VERIFIED_AT = "2026-07-19";

export const JFLEC_DATASETS: readonly OpenDatasetDefinition[] = [
  {
    id: "jflec-financial-literacy-survey-prefecture",
    sourceId: "jflec-financial-literacy",
    name: "金融リテラシー調査 都道府県別分析",
    description:
      "18歳以上対象の全国調査 (2025年 サンプル3万人)。正誤問題25問の正答率、自己評価と客観評価の差、" +
      "金融トラブル経験の有無、借入状況 (住宅ローン・消費者ローン等)、行動経済学的設問 " +
      "(購入前に注意深く考える等) を都道府県別に集計 (順位・都道府県比較表・都道府県別一覧表)。",
    landingPageUrl: LANDING,
    downloadUrl: DOWNLOAD_XLSX,
    accessMethods: ["file-download"],
    formats: ["xlsx"],
    geographicLevels: ["prefecture"],
    hasGeometry: false,
    coverage: "all-japan",
    timeCoverage: "2016 / 2019 / 2022 / 2025年 (3年周期)",
    updateFrequency: "irregular",
    latestPublishedAt: "2026-03-27",
    license: {
      name: "J-FLEC ウェブサイト運営方針 (著作権法準拠・出所明示で引用転載可)",
      commercialUse: "allowed",
      attributionRequired: true,
      modificationNoticeRequired: false,
      termsUrl: TERMS_URL,
    },
    stats47Uses: ["ranking", "research-only"],
    suggestedCategories: ["economy"],
    existingMetricKeys: [],
    existingGisDataIds: [],
    candidateMetricConcepts: [
      "金融リテラシー正答率 (都道府県別)",
      "金融トラブル経験率 (都道府県別)",
      "金融知識の自己評価と客観評価の差 (都道府県別)",
    ],
    verification: {
      status: "partially-verified",
      verifiedAt: VERIFIED_AT,
      verifiedFromUrls: [LANDING, DOWNLOAD_XLSX, TERMS_URL],
      notes:
        "xlsx を実ダウンロードしシート構造・セル値を直接解析し47都道府県シート・比較表・一覧表の実在と" +
        "正答率/トラブル有無/借入/行動バイアス設問の都道府県別数値を確認済み。老後資金計画の設問が" +
        "同ファイル内にあるかは列範囲を全て読み切っておらず未確認 (partially-verified の理由)。" +
        "e-Stat には未掲載 (検索で不在確認、2026-07-19)。非e-Stat統計のため取得は data-ingester が" +
        "xlsx 解析の専用パイプラインを新設する必要がある (既存 e-Stat クライアントは使えない)。",
    },
  },
];
