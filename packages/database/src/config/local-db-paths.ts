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

  // 2. process.cwd() から上方に monorepo ルート (.git or packages/database) を探す
  //    旧来は ".local/d1" を anchor にしていたが、ローカルビルド DB を
  //    packages/database/.data に移したため、常に存在するルートマーカーで判定する。
  while (currentDir !== path.parse(currentDir).root) {
    if (
      fs.existsSync(path.join(currentDir, ".git")) ||
      fs.existsSync(path.join(currentDir, "packages/database/package.json"))
    ) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  // 3. フォールバック: __dirname からの相対パス (packages/database/src/config → root)
  const fromDirname = path.resolve(__dirname, "../../../../");
  logger.warn({ fromDirname }, "[local-db-paths] プロジェクトルートを特定できませんでした。デフォルトを使用します");
  return fromDirname;
}

const PROJECT_ROOT = resolveProjectRoot();
// ローカルビルド DB (SQLite): miniflare 非依存の素の SQLite ファイル。
// drizzle.config.local.ts / scripts/migrate-local.ts / db:pull/push と一致させる。
const LOCAL_DATA_ROOT = path.join(PROJECT_ROOT, "packages/database/.data");
logger.debug({ PROJECT_ROOT, LOCAL_DATA_ROOT }, "[local-db-paths] Root paths resolved");

export const LOCAL_DB_PATHS = {
  STATIC: {
    databaseId: "6cea2d7a-87c2-408b-9de3-72b1bc240478",
    getPath: (): string => {
      return path.join(LOCAL_DATA_ROOT, "stats47.sqlite");
    },
  },
} as const;



