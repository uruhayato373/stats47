import fs from "fs/promises";
import path from "path";
import { beforeAll, describe, expect, it } from "vitest";

import { ESTAT_STATS_DEFINITIONS } from "../../../../meta-info/constants/definitions";

// マニュアル実行用のテスト
// 通常のテスト実行（CIなど）ではスキップされる
// 実行方法: NEXT_PUBLIC_ESTAT_APP_ID=YourAppId npx vitest run packages/estat-api/src/stats-data/__tests__/repositories/api/manual-download.test.ts
describe("統計データのマニュアルダウンロード", () => {
  // 環境変数をロードするヘルパー関数
  const loadEnv = async () => {
    try {
      // .env.local を再帰的に探索する関数
      const findEnvFile = async (startDir: string): Promise<string | null> => {
        let currentDir = startDir;
        while (currentDir !== "/") {
          const filePath = path.join(currentDir, ".env.local");
          try {
            await fs.access(filePath);
            return filePath;
          } catch {
            const parentDir = path.dirname(currentDir);
            if (parentDir === currentDir) break;
            currentDir = parentDir;
          }
        }
        return null;
      };

      const envPath = await findEnvFile(__dirname);
      
      if (!envPath) {
        console.warn(".env.local が親ディレクトリに見つかりませんでした。");
        return;
      }

      const envContent = await fs.readFile(envPath, "utf-8");
      
      envContent.split("\n").forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
      console.log(`環境変数を ${envPath} からロードしました`);
    } catch (e) {
      console.warn("マニュアルテスト用の .env.local をロードできませんでした。process.env に依存します。");
    }
  };

  // テスト実行前に環境変数をロード
  beforeAll(async () => {
    await loadEnv();
  });

  // 環境変数が設定されていない場合はスキップ (ロード試行後)
  const shouldRun = () => !!process.env.NEXT_PUBLIC_ESTAT_APP_ID;

    it("e-Stat APIから定義された全てのデータをダウンロードして保存する", async () => {
    if (!shouldRun()) {
        console.warn("テストをスキップします: NEXT_PUBLIC_ESTAT_APP_ID が設定されていません。");
        return;
    }

    const outputDir = path.join(__dirname, "../../../../../../../packages/mock/src/estat-api/stats-data");
    await fs.mkdir(outputDir, { recursive: true });

    const statsDataIds = Object.keys(ESTAT_STATS_DEFINITIONS);
    console.log(`${statsDataIds.length} 個の定義が見つかりました。ダウンロードを開始します...`);

    for (const statsDataId of statsDataIds) {
      const definition = ESTAT_STATS_DEFINITIONS[statsDataId];
      console.log(`ダウンロード中 ${statsDataId}: ${definition.title}...`);

      try {
        const { fetchStatsDataFromApi } = await import("@/stats-data/repositories/api/fetch-from-api");

        const response = await fetchStatsDataFromApi({
          statsDataId,
        });

        expect(response).toBeDefined();
        expect(response.GET_STATS_DATA.RESULT.STATUS).toBe(0);

        const outputPath = path.join(outputDir, `${statsDataId}.json`);

        await fs.writeFile(
          outputPath, 
          JSON.stringify(response, null, 2), 
          "utf-8"
        );

        console.log(`保存完了: ${outputPath}`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`ダウンロード失敗 ${statsDataId}:`, error);
      }
    }
  }, 1000 * 60 * 30);
});
