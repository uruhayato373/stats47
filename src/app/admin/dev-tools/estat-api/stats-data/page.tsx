/**
 * @fileoverview e-STAT API統計データページのサーバーコンポーネント
 *
 * このページはサーバーサイドで初期表示用のデータを取得し、
 * クライアント側のEstatAPIStatsDataPageコンポーネントをレンダリングします。
 *
 * @module EstatDataPage
 */

import { estatAPI } from "@/features/estat-api";
import { buildEnvironmentConfig } from "@/infrastructure/config";

import { getMockStatsData } from "@data/mock/estat-api/statsdata";

import StatsDataPageContent from "./StatsDataPageContent";

/**
 * e-STAT API統計データページのサーバーコンポーネント
 *
 * 環境別の動作:
 * - mock: data/mock/statsdata/prefecture/0000010101_A1101.json
 * - development/staging/production: e-STAT API
 *
 * @returns {Promise<React.ReactElement>} レンダリングされたページコンポーネント
 */
export default async function Page(): Promise<React.ReactElement> {
  const config = buildEnvironmentConfig();
  let initialData = null;

  const defaultParams = {
    statsDataId: "0000010101",
    cdCat01: "A1101",
  };

  try {
    if (config.isMock) {
      // Mock環境: ローカルJSONファイルを使用
      console.log(
        `[${config.environment}] Loading stats data from mock file...`
      );
      initialData = getMockStatsData(
        defaultParams.statsDataId,
        defaultParams.cdCat01
      );

      if (!initialData) {
        console.error(
          `[${config.environment}] モックデータが見つかりません: ${defaultParams.statsDataId}_${defaultParams.cdCat01}`
        );
      }
    } else {
      // Development/Staging/Production環境: e-STAT APIを使用
      console.log(
        `[${config.environment}] Fetching stats data from e-STAT API...`
      );
      initialData = await estatAPI.getStatsData({
        statsDataId: defaultParams.statsDataId,
        cdCat01: defaultParams.cdCat01,
        metaGetFlg: "Y",
        cntGetFlg: "N",
        explanationGetFlg: "N",
        annotationGetFlg: "N",
        replaceSpChars: "0",
      });
    }
  } catch (error) {
    console.error(`[${config.environment}] データ取得エラー:`, error);
    // エラーが発生してもページは表示する（initialData = null）
  }

  return <StatsDataPageContent initialData={initialData} />;
}
