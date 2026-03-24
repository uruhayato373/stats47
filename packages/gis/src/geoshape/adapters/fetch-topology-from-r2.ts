/**
 * R2 から Geoshape TopoJSON を取得するアダプタ
 *
 * 環境変数で指定した R2 の公開ベース URL と buildGeoshapeR2Path で組み立てた相対パスから fetch する。
 */

import { buildGeoshapeR2Path } from "../utils/geoshape-r2-path";
import { validateTopojson } from "../utils/topojson-converter";

import type { GeoshapeOptions } from "../types/geoshape-options";
import type { TopoJSONTopology } from "@stats47/types";

const DEFAULT_TIMEOUT = 30000;

/**
 * R2 の Geoshape 用ベース URL を取得
 *
 * NEXT_PUBLIC_R2_GEOSHAPE_URL を優先し、未設定なら NEXT_PUBLIC_R2_PUBLIC_URL を使用する。
 */
function getR2GeoshapeBaseUrl(): string | undefined {
  const url =
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_R2_GEOSHAPE_URL
      ? process.env.NEXT_PUBLIC_R2_GEOSHAPE_URL
      : typeof process !== "undefined" &&
          process.env?.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!url || typeof url !== "string") return undefined;
  return url.replace(/\/$/, "");
}

/**
 * R2 が Geoshape 取得に利用可能かどうか
 *
 * ベース URL が環境変数で設定されていれば true。
 */
export function isR2GeoshapeAvailable(): boolean {
  return getR2GeoshapeBaseUrl() !== undefined;
}

/**
 * R2 から TopoJSON を取得
 *
 * @param options - データ取得オプション（areaType, prefCode, wardMode）
 * @returns TopoJSON トポロジー
 * @throws ベース URL 未設定、HTTP エラー、または無効な TopoJSON 形式の場合
 */
export async function fetchTopologyFromR2(
  options: GeoshapeOptions
): Promise<TopoJSONTopology> {
  const baseUrl = getR2GeoshapeBaseUrl();
  if (!baseUrl) {
    throw new Error(
      "R2 Geoshape のベース URL が未設定です（NEXT_PUBLIC_R2_GEOSHAPE_URL または NEXT_PUBLIC_R2_PUBLIC_URL）"
    );
  }

  const r2Path = buildGeoshapeR2Path(options);
  const url = `${baseUrl}/${r2Path}`;

  const response = await fetch(url, {
    headers: { "User-Agent": "stats47-app/1.0" },
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }

  const data: unknown = await response.json();

  if (!validateTopojson(data)) {
    throw new Error("Invalid TopoJSON format");
  }

  return data;
}
