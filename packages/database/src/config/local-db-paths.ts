import { logger } from "@stats47/logger";
import path from "path";

// プロジェクトルートの解決
// 1. 環境変数 LOCAL_DB_ROOT が設定されている場合はそれを使用
// 2. process.cwd() をベースにプロジェクトルートを探索
// 3. フォールバックとして __dirname からの相対パスを使用
function resolveProjectRoot(): string {
  // 1. 環境変数で明示的に指定されている場合
  if (process.env.LOCAL_DB_ROOT) {
    return process.env.LOCAL_DB_ROOT;
  }

  const fs = require("fs");
  let currentDir = process.cwd();

  // 2. process.cwd() から上方に .local/d1 を探す
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, ".local/d1"))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  // 3. フォールバック: __dirname からの相対パス (packages/database/src/config)
  // webpack等で __dirname が正しくない場合に備え、存在確認を行う
  const fromDirname = path.resolve(__dirname, "../../../../");
  if (fs.existsSync(path.join(fromDirname, ".local/d1"))) {
    return fromDirname;
  }

  logger.warn({ fromDirname }, "[local-db-paths] プロジェクトルートを特定できませんでした。デフォルトを使用します");
  return fromDirname;
}

const PROJECT_ROOT = resolveProjectRoot();
// wrangler.toml の persist_to = "../../.local/d1" および drizzle.config と一致させる
const LOCAL_DATA_ROOT = path.join(PROJECT_ROOT, ".local/d1/v3/d1/miniflare-D1DatabaseObject");
logger.debug({ PROJECT_ROOT, LOCAL_DATA_ROOT }, "[local-db-paths] Root paths resolved");

export const LOCAL_DB_PATHS = {
  STATIC: {
    databaseId: "6cea2d7a-87c2-408b-9de3-72b1bc240478",
    getPath: (): string => {
      return path.join(
        LOCAL_DATA_ROOT,
        "baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
      );
    },
  },
} as const;



