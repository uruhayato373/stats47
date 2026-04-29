/**
 * Geoshapeドメイン - サービス
 *
 * TopoJSONデータの取得とビジネスロジックを提供。
 * リポジトリ層へのアクセスを抽象化し、データの妥当性チェックを行う。
 *
 * データソースは環境変数 GIS_DATA_SOURCE で切り替え可能:
 * - "mlit": MLIT R2 → geoshape R2 → 外部 API
 * - "geoshape"（デフォルト）: geoshape R2 → 外部 API
 *
 * 注意: logger は外部から注入される必要があるため、このパッケージでは logger に依存しない。
 * ログ記録は呼び出し側で行う。
 */

import * as fs from "node:fs";
import * as path from "node:path";

import {
  fetchTopologyFromR2,
  isR2GeoshapeAvailable,
} from "../adapters";
import {
  fetchMlitTopologyFromR2,
  isR2MlitAvailable,
} from "../../mlit/adapters";
import { buildMlitR2Path } from "../../mlit/utils/mlit-r2-path";
import { buildGeoshapeR2Path } from "../utils/geoshape-r2-path";
import { getGisDataSource } from "../../config";
import { fetchTopology } from "../repositories/geoshape-repository";
import { rethrowError } from "../utils/errorHandler";
import {
    getPerformanceMeasurementString,
    startPerformanceMeasurement,
} from "../utils/performanceMonitor";
import { validateTopojson } from "../utils/topojson-converter";

import type { GeoshapeOptions } from "../types/geoshape-options";
import type { MlitR2PathOptions } from "../../mlit/utils/mlit-r2-path";
import type { TopoJSONTopology } from "@stats47/types";
import type { DesignatedCityWardMode } from "../types/index";

/**
 * .local/r2/ 配下のローカルファイルから TopoJSON を読み込む。
 * R2 URL が未設定のローカル開発環境用フォールバック。
 */
function tryReadLocalMlitFile(options: MlitR2PathOptions): TopoJSONTopology | undefined {
  try {
    let dir = process.cwd();
    for (let i = 0; i < 10; i++) {
      const localR2 = path.join(dir, ".local", "r2");
      if (fs.existsSync(localR2)) {
        const relativePath = buildMlitR2Path(options);
        const filePath = path.join(localR2, relativePath);
        if (fs.existsSync(filePath)) {
          return JSON.parse(fs.readFileSync(filePath, "utf-8"));
        }
        return undefined;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * .local/r2/ 配下のローカルファイルから Geoshape TopoJSON を読み込む。
 * R2 URL が未設定またはネットワーク不通のローカル開発環境用フォールバック。
 */
function tryReadLocalGeoshapeFile(options: GeoshapeOptions): TopoJSONTopology | undefined {
  try {
    let dir = process.cwd();
    for (let i = 0; i < 10; i++) {
      const localR2 = path.join(dir, ".local", "r2");
      if (fs.existsSync(localR2)) {
        const relativePath = buildGeoshapeR2Path(options);
        const filePath = path.join(localR2, relativePath);
        if (fs.existsSync(filePath)) {
          return JSON.parse(fs.readFileSync(filePath, "utf-8"));
        }
        return undefined;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * Logger インターフェース
 * 外部から注入される logger の型定義
 */
export interface Logger {
  debug: (context: Record<string, unknown>, message: string) => void;
  info: (context: Record<string, unknown>, message: string) => void;
  error: (context: Record<string, unknown>, message: string) => void;
}

/**
 * 都道府県のTopoJSONトポロジーを取得
 *
 * GIS_DATA_SOURCE に応じたデータソースから取得する。
 * - "mlit": MLIT R2 → geoshape R2 → 外部 API
 * - "geoshape": geoshape R2 → 外部 API
 */
export async function fetchPrefectureTopology(
  logger?: Logger
): Promise<TopoJSONTopology> {
  // build 時 (NEXT_PHASE=phase-production-build): 2,000 超のランキングページが
  // 各々 topology を fetch すると build が 30 分超 に伸びる (1 fetch ~数 MB)。
  // ここで throw → ページ側は catch して null を渡し、ISR で初回リクエスト時に
  // 生 fetch する。
  if (process.env.NEXT_PHASE === "phase-production-build") {
    throw new Error("topology fetch skipped at build phase");
  }

  const startTime = startPerformanceMeasurement();

  try {
    const source = getGisDataSource();
    if (logger) {
      logger.debug(
        { areaType: "prefecture", source },
        "都道府県TopoJSON取得開始"
      );
    }

    let data: TopoJSONTopology | undefined;

    // MLIT 優先: MLIT R2 から取得を試行
    if (source === "mlit" && isR2MlitAvailable()) {
      try {
        data = await fetchMlitTopologyFromR2({ type: "prefecture" });
      } catch {
        // fallback to geoshape
      }
    }

    // ローカルファイルから読み込みを試行（MLIT → geoshape）
    if (!data) {
      data = tryReadLocalMlitFile({ type: "prefecture" });
    }
    if (!data) {
      data = tryReadLocalGeoshapeFile({ areaType: "prefecture", wardMode: "merged" });
    }

    // geoshape R2 から取得を試行
    if (!data && isR2GeoshapeAvailable()) {
      try {
        data = await fetchTopologyFromR2({
          areaType: "prefecture",
          wardMode: "merged",
        });
      } catch {
        // fallback to external API
      }
    }

    // 外部 API (geoshape.ex.nii.ac.jp) で取得
    if (!data) {
      data = await fetchTopology({
        areaType: "prefecture",
        wardMode: "merged",
      });
    }

    const validationResult = validateTopojson(data);
    if (!validationResult) {
      const dataAsUnknown = data as unknown as Record<string, unknown>;
      if (logger) {
        logger.error(
          {
            dataSize: JSON.stringify(data).length,
            hasObjects: !!dataAsUnknown.objects,
            objectKeys: dataAsUnknown.objects
              ? Object.keys(dataAsUnknown.objects as Record<string, unknown>)
              : [],
            hasArcs: Array.isArray(dataAsUnknown.arcs),
            arcsLength: Array.isArray(dataAsUnknown.arcs)
              ? dataAsUnknown.arcs.length
              : 0,
          },
          "都道府県TopoJSON取得エラー: 無効なTopoJSON形式"
        );
      }
      throw new Error("Invalid TopoJSON format");
    }

    if (logger) {
      const processingTime = getPerformanceMeasurementString(startTime);
      logger.info(
        {
          dataSize: JSON.stringify(data).length,
          processingTime,
          source,
        },
        "都道府県TopoJSON取得完了"
      );
    }

    return data;
  } catch (error) {
    rethrowError(
      error,
      "都道府県TopoJSON取得エラー",
      "Failed to fetch prefecture topology"
    );
  }
}

/**
 * 市区町村のTopoJSONトポロジーを取得
 *
 * GIS_DATA_SOURCE に応じたデータソースから取得する。
 * - "mlit": MLIT R2 → geoshape R2 → 外部 API
 * - "geoshape": geoshape R2 → 外部 API
 */
export async function fetchMunicipalityTopology(
  prefCode: string,
  wardMode: DesignatedCityWardMode = "merged",
  logger?: Logger
): Promise<TopoJSONTopology> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    throw new Error("topology fetch skipped at build phase");
  }

  const startTime = startPerformanceMeasurement();

  try {
    const source = getGisDataSource();
    if (logger) {
      logger.debug(
        { prefCode, wardMode, source },
        "市区町村TopoJSON取得開始"
      );
    }

    let data: TopoJSONTopology | undefined;

    // MLIT 優先: MLIT R2 から取得を試行
    if (source === "mlit" && isR2MlitAvailable()) {
      try {
        data = await fetchMlitTopologyFromR2({
          type: "city",
          prefCode,
          wardMode,
        });
      } catch {
        // fallback to geoshape
      }
    }

    // ローカルファイルから読み込みを試行（MLIT → geoshape）
    if (!data) {
      data = tryReadLocalMlitFile({ type: "city", prefCode, wardMode });
    }
    if (!data) {
      data = tryReadLocalGeoshapeFile({ areaType: "city", prefCode, wardMode });
    }

    // geoshape R2 から取得を試行
    if (!data && isR2GeoshapeAvailable()) {
      try {
        data = await fetchTopologyFromR2({
          areaType: "city",
          prefCode,
          wardMode,
        });
      } catch {
        // fallback to external API
      }
    }

    // 外部 API (geoshape.ex.nii.ac.jp) で取得
    if (!data) {
      data = await fetchTopology({ areaType: "city", prefCode, wardMode });
    }

    const validationResult = validateTopojson(data);
    if (!validationResult) {
      if (logger) {
        logger.error(
          { prefCode, wardMode },
          "市区町村TopoJSON取得エラー: 無効なTopoJSON形式"
        );
      }
      throw new Error("Invalid TopoJSON format");
    }

    if (logger) {
      const processingTime = getPerformanceMeasurementString(startTime);
      logger.info(
        { prefCode, wardMode, processingTime, source },
        "市区町村TopoJSON取得完了"
      );
    }

    return data;
  } catch (error) {
    rethrowError(
      error,
      "市区町村TopoJSON取得エラー",
      "Failed to fetch municipality topology"
    );
  }
}

/**
 * 全国市区町村のTopoJSONトポロジーを取得
 *
 * GIS_DATA_SOURCE に応じたデータソースから取得する。
 * - "mlit": MLIT R2 → geoshape R2 → 外部 API
 * - "geoshape": geoshape R2 → 外部 API
 */
export async function fetchAllCitiesTopology(
  logger?: Logger
): Promise<TopoJSONTopology> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    throw new Error("topology fetch skipped at build phase");
  }

  const startTime = startPerformanceMeasurement();

  try {
    const source = getGisDataSource();
    if (logger) {
      logger.debug({ source }, "全国市区町村TopoJSON取得開始");
    }

    let data: TopoJSONTopology | undefined;

    // MLIT 優先: MLIT R2 から取得を試行
    if (source === "mlit" && isR2MlitAvailable()) {
      try {
        data = await fetchMlitTopologyFromR2({
          type: "allCities",
          wardMode: "merged",
        });
      } catch {
        // fallback to geoshape
      }
    }

    // ローカルファイルから読み込みを試行（MLIT → geoshape）
    if (!data) {
      data = tryReadLocalMlitFile({ type: "allCities", wardMode: "merged" });
    }
    if (!data) {
      data = tryReadLocalGeoshapeFile({ areaType: "city", wardMode: "merged" });
    }

    // geoshape R2 から取得を試行
    if (!data && isR2GeoshapeAvailable()) {
      try {
        data = await fetchTopologyFromR2({
          areaType: "city",
          wardMode: "merged",
        });
      } catch {
        // fallback to external API
      }
    }

    // 外部 API (geoshape.ex.nii.ac.jp) で取得
    if (!data) {
      const { fetchFromExternalAPI } = await import("../adapters");
      data = await fetchFromExternalAPI({
        areaType: "city",
        wardMode: "merged",
      });
    }

    const validationResult = validateTopojson(data);
    if (!validationResult) {
      if (logger) {
        logger.error({}, "全国市区町村TopoJSON取得エラー: 無効なTopoJSON形式");
      }
      throw new Error("Invalid TopoJSON format");
    }

    if (logger) {
      const dataSize = JSON.stringify(data).length;
      const processingTime = getPerformanceMeasurementString(startTime);
      logger.info(
        { dataSize, processingTime, source },
        "全国市区町村TopoJSON取得完了"
      );
    }

    return data;
  } catch (error) {
    rethrowError(
      error,
      "全国市区町村TopoJSON取得エラー",
      "Failed to fetch all cities topology"
    );
  }
}
