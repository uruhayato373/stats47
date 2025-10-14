/**
 * テストデータのインポート
 */

import { readFileSync } from "fs";
import { join } from "path";
import type { EstatStatsDataResponse } from "../../../types";

// モックデータをファイルから読み込む
const mockDataPath = join(
  process.cwd(),
  "data/mock/statsdata/prefecture/0000010101_A1101.json"
);
const mockDataContent = readFileSync(mockDataPath, "utf-8");
export const mockStatsDataResponse = JSON.parse(
  mockDataContent
) as EstatStatsDataResponse;
