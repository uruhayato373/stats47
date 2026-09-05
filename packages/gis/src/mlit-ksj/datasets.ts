/**
 * KSJ 登録済みデータセットのメタデータ SSOT (git TS)。
 *
 * 完全DBレス: stats47 が稼働対象とする KSJ データセット (status='registered') の
 * 純メタデータ (name / category / geometryType / coverage / license / stats47Category /
 * ranking 定義) の**単一の真実源**。
 *
 * 旧設計 (plan: stateless-stargazing-teapot Phase 2) では純メタを永続/ローカル D1
 * `gis_datasets` テーブルに寄せ、新規は「手動 INSERT」していた。これは DBレス doctrine
 * (SSOT = git TS + R2、ローカル SQLite は使い捨てビルドキャッシュ) と矛盾し、SQLite を
 * 消すとメタが失われていた。本ファイルでメタを git TS に戻し、`seed-from-registry.ts` が
 * これを使い捨て SQLite に決定的に再構築する。
 *
 * - 技術設定 (downloadUrlPattern / propertyMap / simplifyOptions) は `registry.ts`
 *   (KSJ_CODE_CONFIG) が持つ。本ファイルはメタ + ranking 定義。
 * - 候補メタの superset (126 件) は `packages/database/seed/ksj-catalog.json` (git)。
 * - build state (r2Version / fileCount / convertedAt / lastImportedAt / status='imported')
 *   は pipeline 実行時に SQLite へ書かれる ephemeral。SSOT には持たない。
 * - nameEn は KSJ API 非提供のため空 (catalog seed の慣習に合わせる。display 専用)。
 *
 * 新規データセット追加: 本ファイルにエントリ追加 + `registry.ts` に技術設定追加
 *   → `npx tsx packages/gis/src/mlit-ksj/scripts/seed-from-registry.ts` で再 seed。
 *   (ローカル SQLite への手動 INSERT は廃止)
 *
 * 正典: `.claude/rules/gis-data.md` / `packages/gis/src/mlit-ksj/README.md`
 */

import type { KsjCategory, KsjCoverage, KsjGeometryType, KsjLicense } from "./types";

export interface GisDatasetRankingConfig {
  rankingKey: string;
  rankingName: string;
  unit: string;
  /** stats47 ranking の categoryKey (17 軸) */
  categoryKey: string;
  filename?: string;
  filenamePattern?: string;
  /** 4 桁年 (estat-api.md の year 正規化に準拠) */
  yearCode: string;
  description?: string;
  /**
   * 「1 件」を数える単位を feature ではなく、この属性群の組で決める (県内で重複排除)。
   *
   * KSJ には 1 施設が複数 feature に分かれるデータセットがある。P03 発電施設は
   * **号機ごとに 1 レコード**で、原発は 68 レコード = 21 施設。`unit: "か所"` に
   * 対して feature を数えると 3 倍以上に膨らみ、福井県が「15 か所」になってしまう
   * (実際の発電所は高浜・大飯・美浜・敦賀の 4 か所)。
   *
   * **施設名だけでは足りない**。青森県の東通原子力発電所は東北電力と東京電力の
   * 2 か所が同名で別住所にあり、名前だけで畳むと 1 か所に潰れる。名前 + 住所で持つ。
   *
   * 属性のいずれかが空の feature は畳まず 1 件として数える (身元を確認できないものを
   * まとめると黙って過少計上になるため)。省略時は feature 数をそのまま数える。
   */
  dedupeByProperties?: readonly string[];
}

export interface GisDatasetMeta {
  dataId: string;
  /** データ名 (日本語) */
  name: string;
  category: KsjCategory;
  geometryType: KsjGeometryType;
  coverage: KsjCoverage;
  license: KsjLicense;
  /** stats47 カテゴリ (17 軸の CategoryKey)。地図のみで ranking 化しない場合は null */
  stats47Category: string | null;
  isRankingTarget: boolean;
  /** ranking 対象データセットの ranking 定義 (旧 seed-from-registry.ts RANKINGS を統合) */
  rankingConfig?: GisDatasetRankingConfig[];
  /** ranking 集計の基準バージョン (旧 RANKINGS.version)。pipeline download の {VERSION} 既定値 */
  latestVersion?: string;
  /** 国土数値情報の公式データ詳細ページ。配布単位の自動検出にも使う。 */
  sourcePageUrl?: string;
  /** 候補カタログ側で別IDになっている場合のID。 */
  candidateAliases?: readonly string[];
}

/**
 * 登録済みデータセット。件数は配列から導出し、文書へ固定値を複製しない。
 * 本ファイル (datasets.ts) が git TS メタ SSOT (完全DBレス)。
 * 旧 doc 04 の生成表 (generate-docs.ts) は datasets.ts と重複するため 2026-07-12 廃止。
 * ranking 定義は旧 RANKINGS (seed-from-registry.ts) を統合。
 */
export const GIS_DATASETS: GisDatasetMeta[] = [
  // ── 国土 (水・土地) ─────────────────────────────────────────
  { dataId: "A12", name: "農業地域", category: "land", geometryType: "polygon", coverage: "prefecture", license: "cc-by-4.0-partial", stats47Category: "agriculture", isRankingTarget: false, latestVersion: "15" },
  { dataId: "A13", name: "森林地域", category: "land", geometryType: "polygon", coverage: "prefecture", license: "cc-by-4.0-partial", stats47Category: "agriculture", isRankingTarget: false, latestVersion: "15" },
  { dataId: "C23", name: "海岸線", category: "land", geometryType: "line", coverage: "prefecture", license: "non-commercial", stats47Category: null, isRankingTarget: false, latestVersion: "06" },
  { dataId: "G04-a", name: "標高・傾斜度3次メッシュ", category: "land", geometryType: "mesh", coverage: "mesh", license: "commercial-ok", stats47Category: null, isRankingTarget: false, latestVersion: "11", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-G04-a.html" },
  { dataId: "L01", name: "地価公示", category: "land", geometryType: "point", coverage: "national", license: "cc-by-4.0", stats47Category: "economy", isRankingTarget: false, latestVersion: "26" },
  { dataId: "L02", name: "都道府県地価調査", category: "land", geometryType: "point", coverage: "national", license: "cc-by-4.0", stats47Category: "economy", isRankingTarget: false, latestVersion: "25" },
  { dataId: "L03-a", name: "土地利用3次メッシュ", category: "land", geometryType: "mesh", coverage: "mesh", license: "cc-by-4.0", stats47Category: null, isRankingTarget: false, latestVersion: "21", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L03-a-2022.html" },
  {
    dataId: "W01", name: "ダム", category: "land", geometryType: "point", coverage: "national", license: "non-commercial",
    stats47Category: null, isRankingTarget: true, latestVersion: "14",
    rankingConfig: [{ rankingKey: "dam-count", rankingName: "ダム数", unit: "か所", categoryKey: "infrastructure", yearCode: "2014", description: "国土数値情報に登録されているダムの都道府県別数" }],
  },
  { dataId: "W05", name: "河川", category: "land", geometryType: "line", coverage: "prefecture", license: "non-commercial", stats47Category: null, isRankingTarget: false, latestVersion: "09" },
  {
    dataId: "W09", name: "湖沼", category: "land", geometryType: "polygon", coverage: "national", license: "commercial-ok",
    stats47Category: "landweather", isRankingTarget: true, latestVersion: "05",
    rankingConfig: [{ rankingKey: "lake-count", rankingName: "湖沼数", unit: "か所", categoryKey: "landweather", yearCode: "2005", description: "国土数値情報に登録されている湖沼の都道府県別数" }],
  },

  // ── 政策区域 ───────────────────────────────────────────────
  { dataId: "A10", name: "自然公園地域", category: "policy", geometryType: "polygon", coverage: "prefecture", license: "cc-by-4.0-partial", stats47Category: "safetyenvironment", isRankingTarget: false, latestVersion: "15" },
  { dataId: "A16", name: "DID人口集中地区", category: "policy", geometryType: "polygon", coverage: "national", license: "commercial-ok", stats47Category: "population", isRankingTarget: false, latestVersion: "20" },
  { dataId: "A17", name: "過疎地域", category: "policy", geometryType: "polygon", coverage: "prefecture", license: "commercial-ok", stats47Category: "population", isRankingTarget: false, latestVersion: "17" },
  { dataId: "A22", name: "豪雪地帯", category: "policy", geometryType: "polygon", coverage: "prefecture", license: "commercial-ok", stats47Category: "landweather", isRankingTarget: false, latestVersion: "16" },
  { dataId: "A27", name: "小学校区", category: "policy", geometryType: "polygon", coverage: "prefecture", license: "cc-by-4.0-partial", stats47Category: "educationsports", isRankingTarget: false, latestVersion: "16" },
  { dataId: "A29", name: "用途地域", category: "policy", geometryType: "polygon", coverage: "prefecture", license: "cc-by-4.0-partial", stats47Category: "infrastructure", isRankingTarget: false, latestVersion: "19" },
  { dataId: "A31b", name: "洪水浸水想定区域", category: "policy", geometryType: "polygon", coverage: "mesh", license: "cc-by-4.0", stats47Category: "safetyenvironment", isRankingTarget: false, latestVersion: "25" },
  { dataId: "A32", name: "中学校区", category: "policy", geometryType: "polygon", coverage: "prefecture", license: "cc-by-4.0-partial", stats47Category: "educationsports", isRankingTarget: false, latestVersion: "16" },
  { dataId: "A33", name: "土砂災害警戒区域", category: "policy", geometryType: "polygon", coverage: "prefecture", license: "cc-by-4.0-partial", stats47Category: "safetyenvironment", isRankingTarget: false, latestVersion: "23" },
  { dataId: "A38", name: "医療圏", category: "policy", geometryType: "polygon", coverage: "national", license: "cc-by-4.0", stats47Category: "socialsecurity", isRankingTarget: false, latestVersion: "20" },
  { dataId: "A40", name: "津波浸水想定", category: "policy", geometryType: "polygon", coverage: "prefecture", license: "cc-by-4.0-partial", stats47Category: "safetyenvironment", isRankingTarget: false, latestVersion: "23" },
  { dataId: "N03", name: "行政区域", category: "policy", geometryType: "polygon", coverage: "national", license: "cc-by-4.0", stats47Category: null, isRankingTarget: false, latestVersion: "20250101" },

  // ── 施設 ───────────────────────────────────────────────────
  {
    dataId: "P03", name: "発電施設", category: "facility", geometryType: "point", coverage: "national", license: "non-commercial",
    stats47Category: "energy", isRankingTarget: true, latestVersion: "13",
    rankingConfig: [
      // P03 は号機ごとに 1 レコードなので、施設名 + 住所で畳んで「か所」にする
      { rankingKey: "nuclear-power-plant-count", rankingName: "原子力発電所数", unit: "か所", categoryKey: "energy", filenamePattern: "NuclearPowerPlant", yearCode: "2013", description: "国土数値情報に登録されている原子力発電所の都道府県別数", dedupeByProperties: ["P03_0002", "P03_0003"] },
      { rankingKey: "thermal-power-plant-count", rankingName: "火力発電所数", unit: "か所", categoryKey: "energy", filenamePattern: "ThermalPowerPlant.topojson", yearCode: "2013", dedupeByProperties: ["P03_0002", "P03_0003"] },
      { rankingKey: "hydroelectric-power-plant-count", rankingName: "水力発電所数", unit: "か所", categoryKey: "energy", filenamePattern: "GeneralHydroelectric", yearCode: "2013", dedupeByProperties: ["P03_0002", "P03_0003"] },
      // photovoltaic-power-plant-count は 2026-08-17 に外した。metric config も R2 データも
      // 無く /ranking/photovoltaic-power-plant-count は soft 404 を返していた。作るなら
      // metric config の新設から。データ自体は P03 に 10,654 レコードある
      // (ただし施設名が空のものが多く、名前 + 住所での重複排除は 9,808 件までしか畳めない)。
      { rankingKey: "wind-power-plant-count-facility", rankingName: "風力発電施設数(施設ベース)", unit: "か所", categoryKey: "energy", filenamePattern: "WindPowerPlant", yearCode: "2013", dedupeByProperties: ["P03_0002", "P03_0003"] },
      { rankingKey: "geothermal-power-plant-count", rankingName: "地熱発電施設数", unit: "か所", categoryKey: "energy", filenamePattern: "Geothermal", yearCode: "2013", dedupeByProperties: ["P03_0002", "P03_0003"] },
      { rankingKey: "biomass-power-station-count", rankingName: "バイオマス発電施設数", unit: "か所", categoryKey: "energy", filenamePattern: "Biomass", yearCode: "2013", dedupeByProperties: ["P03_0002", "P03_0003"] },
    ],
  },
  { dataId: "P04", name: "医療機関", category: "facility", geometryType: "point", coverage: "prefecture", license: "cc-by-4.0", stats47Category: "socialsecurity", isRankingTarget: false, latestVersion: "20" },
  { dataId: "P05", name: "市町村役場等・公的集会施設", category: "facility", geometryType: "point", coverage: "prefecture", license: "cc-by-4.0", stats47Category: null, isRankingTarget: false, latestVersion: "22" },
  { dataId: "P11", name: "バス停留所", category: "facility", geometryType: "point", coverage: "prefecture", license: "cc-by-4.0", stats47Category: "infrastructure", isRankingTarget: false, latestVersion: "22" },
  {
    dataId: "P12", name: "観光資源", category: "facility", geometryType: "point", coverage: "national", license: "non-commercial",
    stats47Category: "tourism", isRankingTarget: true, latestVersion: "14",
    // P12 は同じ登録対象を点 (P12a 17,258) / 線 (P12b 85) / 面 (P12c 1,797) の 3 系統で
    // 持つ。例: 小笠原の「南島」は P12a と P12c の両方に P12_001=10034 で入っている。
    // countByPrefecture は解決済み県コードを identity key に自動付加するため、県内の整理番号
    // P12_001 で畳むと 19,140 feature → 17,254 登録対象になる。P12_001 は全国一意ではない。
    rankingConfig: [{ rankingKey: "tourism-resource-count", rankingName: "観光資源データ登録件数", unit: "件", categoryKey: "tourism", yearCode: "2014", description: "国土数値情報P12に収録された観光資源・観光地点の都道府県別登録件数（2014年9月30日時点。観光地の網羅数ではない）", dedupeByProperties: ["P12_001"] }],
  },
  { dataId: "P13", name: "都市公園", category: "facility", geometryType: "polygon", coverage: "prefecture", license: "non-commercial", stats47Category: "infrastructure", isRankingTarget: false, latestVersion: "11" },
  { dataId: "P14", name: "福祉施設", category: "facility", geometryType: "point", coverage: "prefecture", license: "cc-by-4.0-partial", stats47Category: "socialsecurity", isRankingTarget: false, latestVersion: "23" },
  { dataId: "P17", name: "消防署", category: "facility", geometryType: "point", coverage: "prefecture", license: "non-commercial", stats47Category: "safetyenvironment", isRankingTarget: false, latestVersion: "12" },
  { dataId: "P18", name: "警察署", category: "facility", geometryType: "point", coverage: "prefecture", license: "non-commercial", stats47Category: "safetyenvironment", isRankingTarget: false, latestVersion: "12" },
  { dataId: "P29", name: "学校", category: "facility", geometryType: "point", coverage: "prefecture", license: "cc-by-4.0", stats47Category: "educationsports", isRankingTarget: false, latestVersion: "23" },
  {
    dataId: "P35", name: "道の駅", category: "facility", geometryType: "point", coverage: "national", license: "non-commercial",
    stats47Category: "tourism", isRankingTarget: true, latestVersion: "18",
    rankingConfig: [{ rankingKey: "roadside-station-count", rankingName: "道の駅数", unit: "か所", categoryKey: "tourism", yearCode: "2018", description: "国土数値情報に登録されている道の駅の都道府県別数" }],
  },
  { dataId: "P36", name: "高速バス停留所", category: "facility", geometryType: "point", coverage: "prefecture", license: "cc-by-4.0", stats47Category: "infrastructure", isRankingTarget: false, latestVersion: "23" },

  // ── 交通 ───────────────────────────────────────────────────
  { dataId: "C02", name: "港湾", category: "transport", geometryType: "point", coverage: "national", license: "non-commercial", stats47Category: "infrastructure", isRankingTarget: false, latestVersion: "08" },
  {
    dataId: "C09", name: "漁港", category: "transport", geometryType: "point", coverage: "national", license: "non-commercial",
    stats47Category: "agriculture", isRankingTarget: true, latestVersion: "06",
    rankingConfig: [{ rankingKey: "fishing-port-count-ksj", rankingName: "漁港数", unit: "港", categoryKey: "agriculture", filenamePattern: "FishingPort.topojson", yearCode: "2006", description: "国土数値情報に登録されている漁港の都道府県別数" }],
  },
  {
    dataId: "C28", name: "空港", category: "transport", geometryType: "point", coverage: "national", license: "commercial-ok",
    stats47Category: "infrastructure", isRankingTarget: true, latestVersion: "07",
    rankingConfig: [{ rankingKey: "airport-count", rankingName: "空港数", unit: "か所", categoryKey: "infrastructure", filenamePattern: "AirportReferencePoint", yearCode: "2007", description: "国土数値情報に登録されている空港の都道府県別数" }],
  },
  {
    dataId: "N02", name: "鉄道", category: "transport", geometryType: "line", coverage: "national", license: "cc-by-4.0",
    stats47Category: "infrastructure", isRankingTarget: true, latestVersion: "25",
    rankingConfig: [{ rankingKey: "railway-station-count", rankingName: "鉄道駅数", unit: "駅", categoryKey: "infrastructure", filenamePattern: "Station", yearCode: "2025", description: "国土数値情報に登録されている鉄道駅の都道府県別数" }],
  },
  // ranking 定義を外した (2026-08-17)。`expressway-junction-count` は metric config も
  // R2 データも存在せず、/ranking/expressway-junction-count は soft 404 を返していた
  // (HTTP 200 + 「ランキングが見つかりません」)。実現しなかった計画が SSOT に残っていた
  // 状態なので、実態に合わせて落とす。作るなら metric config の新設から始める。
  { dataId: "N06", name: "高速道路時系列", category: "transport", geometryType: "line", coverage: "national", license: "cc-by-4.0-partial", stats47Category: "infrastructure", isRankingTarget: false, latestVersion: "20" },
  { dataId: "N07", name: "バスルート", category: "transport", geometryType: "line", coverage: "prefecture", license: "cc-by-4.0", stats47Category: "infrastructure", isRankingTarget: false, latestVersion: "22" },
  { dataId: "S12", name: "駅別乗降客数", category: "transport", geometryType: "point", coverage: "national", license: "cc-by-4.0", stats47Category: "infrastructure", isRankingTarget: false, latestVersion: "25" },

  // ── 統計 ───────────────────────────────────────────────────
  { dataId: "mesh1000r6", name: "1kmメッシュ将来推計人口(R6)", category: "statistics", geometryType: "mesh", coverage: "prefecture", license: "cc-by-4.0", stats47Category: "population", isRankingTarget: false, latestVersion: "24", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-mesh1000r6.html", candidateAliases: ["m1kr6"] },

  // ── 2026-08-30 公式利用条件監査で公開・商用利用可能と確定した追加29件 ──
  { dataId: "A03", name: "三大都市圏計画区域", category: "policy", geometryType: "polygon", coverage: "region", license: "cc-by-4.0", stats47Category: "infrastructure", isRankingTarget: false, latestVersion: "03", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A03.html" },
  { dataId: "A09", name: "都市地域", category: "policy", geometryType: "polygon", coverage: "prefecture", license: "cc-by-4.0", stats47Category: "infrastructure", isRankingTarget: false, latestVersion: "18", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A09.html" },
  { dataId: "A18", name: "半島振興対策実施地域", category: "policy", geometryType: "polygon", coverage: "region", license: "cc-by-4.0", stats47Category: "population", isRankingTarget: false, latestVersion: "16", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A18-2016.html" },
  { dataId: "A19", name: "離島振興対策実施地域", category: "policy", geometryType: "polygon", coverage: "region", license: "cc-by-4.0", stats47Category: "population", isRankingTarget: false, latestVersion: "17", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A19-2017.html" },
  { dataId: "A23", name: "特殊土壌地帯", category: "policy", geometryType: "polygon", coverage: "region", license: "cc-by-4.0", stats47Category: "safetyenvironment", isRankingTarget: false, latestVersion: "16", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A23-2016.html" },
  { dataId: "A24", name: "振興山村", category: "policy", geometryType: "polygon", coverage: "region", license: "cc-by-4.0", stats47Category: "population", isRankingTarget: false, latestVersion: "16", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A24-2016.html" },
  { dataId: "A25", name: "特定農山村地域", category: "policy", geometryType: "polygon", coverage: "prefecture", license: "cc-by-4.0", stats47Category: "agriculture", isRankingTarget: false, latestVersion: "16", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A25-2016.html" },
  { dataId: "A30a5", name: "土砂災害・雪崩メッシュ", category: "policy", geometryType: "mesh", coverage: "mesh", license: "cc-by-4.0", stats47Category: "safetyenvironment", isRankingTarget: false, latestVersion: "11", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A30a5.html" },
  { dataId: "A31a", name: "洪水浸水想定区域（河川単位）", category: "policy", geometryType: "polygon", coverage: "region", license: "cc-by-4.0", stats47Category: "safetyenvironment", isRankingTarget: false, latestVersion: "24", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A31a-2024.html" },
  { dataId: "A42", name: "歴史的風土保存区域", category: "policy", geometryType: "polygon", coverage: "national", license: "cc-by-4.0", stats47Category: "tourism", isRankingTarget: false, latestVersion: "18", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A42.html" },
  { dataId: "A43", name: "伝統的建造物群保存地区", category: "policy", geometryType: "polygon", coverage: "national", license: "cc-by-4.0", stats47Category: "tourism", isRankingTarget: false, latestVersion: "18", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A43.html" },
  { dataId: "A44", name: "歴史的風致維持向上計画の重点地区", category: "policy", geometryType: "polygon", coverage: "national", license: "cc-by-4.0", stats47Category: "tourism", isRankingTarget: false, latestVersion: "18", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A44.html" },
  { dataId: "A45", name: "国有林野", category: "land", geometryType: "polygon", coverage: "prefecture", license: "cc-by-4.0", stats47Category: "agriculture", isRankingTarget: false, latestVersion: "19", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A45.html" },
  { dataId: "A51", name: "雨水出水（内水）浸水想定区域", category: "policy", geometryType: "polygon", coverage: "region", license: "cc-by-4.0", stats47Category: "safetyenvironment", isRankingTarget: false, latestVersion: "24", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A51-2024.html" },
  { dataId: "A52", name: "砂防指定地", category: "policy", geometryType: "polygon", coverage: "region", license: "cc-by-4.0", stats47Category: "safetyenvironment", isRankingTarget: false, latestVersion: "23", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A52-2023.html" },
  { dataId: "A53", name: "多段階浸水想定", category: "policy", geometryType: "polygon", coverage: "region", license: "cc-by-4.0", stats47Category: "safetyenvironment", isRankingTarget: false, latestVersion: "24", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A53-2024.html" },
  { dataId: "A54", name: "大規模盛土造成地", category: "land", geometryType: "polygon", coverage: "national", license: "cc-by-4.0", stats47Category: "safetyenvironment", isRankingTarget: false, latestVersion: "23", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A54-2023.html" },
  { dataId: "A55", name: "都市計画決定情報", category: "policy", geometryType: "mixed", coverage: "prefecture", license: "commercial-ok", stats47Category: "infrastructure", isRankingTarget: false, latestVersion: "24", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A55-2022.html" },
  { dataId: "G04-c", name: "標高・傾斜度4次メッシュ", category: "land", geometryType: "mesh", coverage: "mesh", license: "commercial-ok", stats47Category: "landweather", isRankingTarget: false, latestVersion: "11", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-G04-c.html" },
  { dataId: "G04-d", name: "標高・傾斜度5次メッシュ", category: "land", geometryType: "mesh", coverage: "mesh", license: "commercial-ok", stats47Category: "landweather", isRankingTarget: false, latestVersion: "11", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-G04-d.html" },
  { dataId: "G08", name: "低位地帯", category: "land", geometryType: "polygon", coverage: "prefecture", license: "commercial-ok", stats47Category: "safetyenvironment", isRankingTarget: false, latestVersion: "15", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-G08-2015.html" },
  { dataId: "L03-b", name: "土地利用細分メッシュ", category: "land", geometryType: "mesh", coverage: "mesh", license: "commercial-ok", stats47Category: "agriculture", isRankingTarget: false, latestVersion: "21", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L03-b-2021.html" },
  { dataId: "L03-b-c", name: "土地利用詳細メッシュ", category: "land", geometryType: "mesh", coverage: "region", license: "commercial-ok", stats47Category: "agriculture", isRankingTarget: false, latestVersion: "21", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L03-b-c-2021.html" },
  { dataId: "L03-b-u", name: "都市地域土地利用細分メッシュ", category: "land", geometryType: "mesh", coverage: "mesh", license: "commercial-ok", stats47Category: "infrastructure", isRankingTarget: false, latestVersion: "21", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L03-b-u-2021.html" },
  { dataId: "N08", name: "空港時系列", category: "transport", geometryType: "mixed", coverage: "national", license: "commercial-ok", stats47Category: "infrastructure", isRankingTarget: false, latestVersion: "21", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N08-2021.html" },
  { dataId: "S05-d", name: "貨物旅客地域流動量", category: "transport", geometryType: "line", coverage: "national", license: "commercial-ok", stats47Category: "infrastructure", isRankingTarget: false, latestVersion: "18", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-S05-d-2018.html" },
  { dataId: "S10a", name: "港湾間流通量・海上経路", category: "transport", geometryType: "line", coverage: "national", license: "commercial-ok", stats47Category: "infrastructure", isRankingTarget: false, latestVersion: "16", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-S10a-2016.html" },
  { dataId: "m250r6", name: "250mメッシュ別将来推計人口（R6国政局推計）", category: "statistics", geometryType: "mesh", coverage: "prefecture", license: "commercial-ok", stats47Category: "population", isRankingTarget: false, latestVersion: "24", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-mesh250r6.html" },
  { dataId: "m500r6", name: "500mメッシュ別将来推計人口（R6国政局推計）", category: "statistics", geometryType: "mesh", coverage: "prefecture", license: "commercial-ok", stats47Category: "population", isRankingTarget: false, latestVersion: "24", sourcePageUrl: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-mesh500r6.html" },
];

/** dataId → メタ の索引 */
export const GIS_DATASETS_BY_ID: Map<string, GisDatasetMeta> = new Map(
  GIS_DATASETS.map((d) => [d.dataId, d]),
);
