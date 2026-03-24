/**
 * Geoshape外部APIクライアント
 *
 * Geoshapeリポジトリ（https://geoshape.ex.nii.ac.jp）からTopoJSONを取得する。
 */

import { buildGeoshapeExternalUrl } from "../utils/geoshape-url-builder";

import type { GeoshapeOptions } from "../types/geoshape-options";
import type { TopoJSONTopology } from "@stats47/types";

const DEFAULT_TIMEOUT = 30000;

/**
 * 外部APIからTopoJSONを取得
 */
export async function fetchFromExternalAPI(
  options: GeoshapeOptions
): Promise<TopoJSONTopology> {
  const url = buildGeoshapeExternalUrl(options);

  const response = await fetch(url, {
    headers: { "User-Agent": "stats47-app/1.0" },
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }

  const data: unknown = await response.json();

  if (!isValidTopoJSON(data)) {
    throw new Error("Invalid TopoJSON format");
  }

  return data as TopoJSONTopology;
}

/**
 * 外部APIが利用可能かチェック
 */
export async function isExternalAPIAvailable(
  options: GeoshapeOptions
): Promise<boolean> {
  try {
    const url = buildGeoshapeExternalUrl(options);
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function isValidTopoJSON(data: unknown): boolean {
  return (
    data !== null &&
    typeof data === "object" &&
    "type" in data &&
    (data as { type: unknown }).type === "Topology"
  );
}
