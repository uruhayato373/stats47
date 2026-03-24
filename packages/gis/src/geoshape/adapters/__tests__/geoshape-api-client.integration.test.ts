import { describe, it, expect, beforeAll } from "vitest";

import { fetchFromExternalAPI } from "../geoshape-api-client";

import type { GeoshapeOptions } from "../../types/geoshape-options";

// 統合テスト（実際のAPIを呼び出す）
// SAVE_TEST_OUTPUTS=trueの時のみ実行
const shouldSaveOutputs = process.env.SAVE_TEST_OUTPUTS === "true";
const outputDir = `${process.cwd()}/src/geoshape/adapters/__tests__/__test_outputs__`;

describe.skipIf(!shouldSaveOutputs)("geoshape-api-client 統合テスト", () => {
  beforeAll(async () => {
    // Node.js環境でfs/promisesを使用（requireで直接読み込む）
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs/promises");
    await fs.mkdir(outputDir, { recursive: true });
  }, 60000); // タイムアウトを60秒に延長

  it(
    "実際のAPIから都道府県データを取得して保存",
    async () => {
      const options: GeoshapeOptions = { areaType: "prefecture" };
      const data = await fetchFromExternalAPI(options);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs/promises");
      const fileName = "prefecture_all_default.topojson.json";
      const filePath = `${outputDir}/${fileName}`;
      await fs.writeFile(
        filePath,
        JSON.stringify(data, null, 2),
        "utf-8",
      );
      console.log(`保存完了: ${filePath}`);

      expect(data.type).toBe("Topology");
    },
    60000, // タイムアウトを60秒に延長
  );

  it(
    "実際のAPIから全国市区町村データ（merged）を取得して保存",
    async () => {
      const options: GeoshapeOptions = { areaType: "city", wardMode: "merged" };
      const data = await fetchFromExternalAPI(options);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs/promises");
      const fileName = "city_all_merged.topojson.json";
      const filePath = `${outputDir}/${fileName}`;
      await fs.writeFile(
        filePath,
        JSON.stringify(data, null, 2),
        "utf-8",
      );
      console.log(`保存完了: ${filePath}`);

      expect(data.type).toBe("Topology");
    },
    60000, // タイムアウトを60秒に延長
  );

  it(
    "実際のAPIから全国市区町村データ（split）を取得して保存",
    async () => {
      const options: GeoshapeOptions = { areaType: "city", wardMode: "split" };
      const data = await fetchFromExternalAPI(options);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs/promises");
      const fileName = "city_all_split.topojson.json";
      const filePath = `${outputDir}/${fileName}`;
      await fs.writeFile(
        filePath,
        JSON.stringify(data, null, 2),
        "utf-8",
      );
      console.log(`保存完了: ${filePath}`);

      expect(data.type).toBe("Topology");
    },
    60000, // タイムアウトを60秒に延長
  );

  it(
    "実際のAPIから都道府県別データ（47000、merged）を取得して保存",
    async () => {
      const options: GeoshapeOptions = {
        areaType: "city",
        prefCode: "47000",
        wardMode: "merged",
      };
      const data = await fetchFromExternalAPI(options);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs/promises");
      const fileName = "city_47000_merged.topojson.json";
      const filePath = `${outputDir}/${fileName}`;
      await fs.writeFile(
        filePath,
        JSON.stringify(data, null, 2),
        "utf-8",
      );
      console.log(`保存完了: ${filePath}`);

      expect(data.type).toBe("Topology");
    },
    60000, // タイムアウトを60秒に延長
  );

  it(
    "実際のAPIから都道府県別データ（01000、split）を取得して保存",
    async () => {
      const options: GeoshapeOptions = {
        areaType: "city",
        prefCode: "01000",
        wardMode: "split",
      };
      const data = await fetchFromExternalAPI(options);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs/promises");
      const fileName = "city_01000_split.topojson.json";
      const filePath = `${outputDir}/${fileName}`;
      await fs.writeFile(
        filePath,
        JSON.stringify(data, null, 2),
        "utf-8",
      );
      console.log(`保存完了: ${filePath}`);

      expect(data.type).toBe("Topology");
    },
    60000, // タイムアウトを60秒に延長
  );
});
