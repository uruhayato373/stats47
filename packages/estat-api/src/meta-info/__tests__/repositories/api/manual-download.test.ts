import fs from "fs";
import path from "path";
import { describe, it, vi } from "vitest";
import { ESTAT_STATS_DEFINITIONS } from "../../../constants/definitions";


// このテストは手動実行専用です
// NEXT_PUBLIC_ESTAT_APP_ID環境変数が必要です

describe("manual-download", () => {
  it("実際のAPIからデータを取得して保存する", async () => {
    // .env.local から読み込み
    const envPath = path.resolve(__dirname, "../../../../../../../.env.local");
    let appId = process.env.NEXT_PUBLIC_ESTAT_APP_ID;

    if (!appId && fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const match = envContent.match(/NEXT_PUBLIC_ESTAT_APP_ID=(.+)/);
      if (match) {
        appId = match[1].trim();
      }
    }

    if (!appId) {
      console.warn("NEXT_PUBLIC_ESTAT_APP_ID is not set in .env.local or environment variables. Skipping manual download test.");
      return;
    }

    // core/config の ESTAT_APP_ID をモックする
    // static import だと未定義のままロードされる可能性があるため
    // core/config の ESTAT_APP_ID をモックする
    // static import だと未定義のままロードされる可能性があるため
    vi.doMock("../../../../core/config/index", async (importOriginal) => {
      const actual = await importOriginal<typeof import("../../../../core/config/index")>();
      return {
        ...actual,
        ESTAT_APP_ID: appId,
      };
    });
    
    // ダイナミックインポートで再読み込み（モックを適用）
    const { fetchMetaInfoFromApi } = await import("../../../repositories/api/fetch-from-api");

    // coreのモックをせず、実際の実装を使う必要があるが、
    // ここでは単純にfetchFromApiを呼ぶ。
    // ただし、fetchFromApiはcoreをimportしているので、
    // テスト環境でcoreが正しく動作する必要がある。
    // vitest環境で実際のHTTPリクエストが飛ぶかどうかは設定次第。
    
    // ここでは簡易的に実装。実運用に合わせて調整してください。
    
    const statsIds = Object.keys(ESTAT_STATS_DEFINITIONS);


    const saveDir = path.resolve(__dirname, "../../../../../../mock/src/estat-api/meta-info");
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    for (const id of statsIds) {
      try {
        console.log(`Fetching ${id}...`);
        const data = await fetchMetaInfoFromApi(id);
        fs.writeFileSync(
          path.join(saveDir, `${id}.json`),
          JSON.stringify(data, null, 2)
        );
        console.log(`Saved ${id}.json`);
      } catch (e) {
        console.error(`Failed to fetch ${id}`, e);
      }
    }
  }, 300000);
});
