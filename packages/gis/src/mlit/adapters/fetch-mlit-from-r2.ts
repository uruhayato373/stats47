/**
 * R2 から MLIT TopoJSON を取得するアダプタ
 *
 * R2 の公開ベース URL と buildMlitR2Path で組み立てた相対パスから fetch する。
 * ベース URL は geoshape アダプタと同じ環境変数を共用する。
 */

import { validateTopojson } from "../../geoshape/utils/topojson-converter";
import { buildMlitR2Path } from "../utils/mlit-r2-path";

import type { MlitR2PathOptions } from "../utils/mlit-r2-path";
import type { TopoJSONTopology } from "@stats47/types";

const DEFAULT_TIMEOUT = 30000;

/**
 * R2 のベース URL を取得（geoshape と共用）
 */
function getR2BaseUrl(): string | undefined {
  const url =
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_R2_GEOSHAPE_URL
      ? process.env.NEXT_PUBLIC_R2_GEOSHAPE_URL
      : typeof process !== "undefined" &&
          process.env?.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!url || typeof url !== "string") return undefined;
  return url.replace(/\/$/, "");
}

/**
 * R2 が MLIT 取得に利用可能かどうか
 */
export function isR2MlitAvailable(): boolean {
  return getR2BaseUrl() !== undefined;
}

/**
 * R2 から MLIT TopoJSON を取得
 *
 * @param options - MLIT パスオプション
 * @returns TopoJSON トポロジー
 * @throws ベース URL 未設定、HTTP エラー、または無効な TopoJSON 形式の場合
 */
export async function fetchMlitTopologyFromR2(
  options: MlitR2PathOptions
): Promise<TopoJSONTopology> {
  const baseUrl = getR2BaseUrl();
  if (!baseUrl) {
    throw new Error(
      "R2 のベース URL が未設定です（NEXT_PUBLIC_R2_GEOSHAPE_URL または NEXT_PUBLIC_R2_PUBLIC_URL）"
    );
  }

  const r2Path = buildMlitR2Path(options);
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
