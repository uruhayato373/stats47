import type { D1Database } from "@cloudflare/workers-types";
import { logger } from "@stats47/logger";
import path from "path";
import { createLocalAdapter } from "./adapters/local-adapter";

// 開発環境でローカルアダプタを使用すべきかの判定ロジック
// 注: Next.js依存(process.env.NEXT_RUNTIME等)は呼び出し側で判定して渡すのが理想だが
// ここでは一般的なNode.js環境としての判定を行う
const isDevelopment = process.env.NODE_ENV === "development";
// window check for server-side
const isServer = typeof window === "undefined";

/**
 * データベースクライアント生成オプション
 */
export interface DatabaseClientOptions {
  /** Cloudflare D1バインディング (Cloudflare環境用) */
  binding?: D1Database;
  /** ローカルSQLiteファイルのパス (開発環境用) */
  localDbPath?: string;
  /** ローカルアダプタを強制的に使用するか */
  useLocalAdapter?: boolean;
}

/**
 * D1データベースクライアントを作成または取得
 * 
 * 優先順位:
 * 1. binding (Cloudflare環境)
 * 2. localDbPath (開発環境/ローカルシミュレーション)
 */
export function createDatabaseClient(options: DatabaseClientOptions): D1Database {
  const { binding, localDbPath, useLocalAdapter } = options;

  // 1. Cloudflareバインディングが渡された場合はそれを使用
  if (binding) {
    logger.debug("[createDatabaseClient] Using provided D1 binding");
    return binding;
  }

  // 2. ローカルアダプタの使用条件チェック
  // useLocalAdapterが明示的にtrue、または開発環境でサーバーサイドかつbindingがない場合
  const shouldCreateLocal = useLocalAdapter ?? (isDevelopment && isServer);


  logger.debug(
    { useLocalAdapter, isDevelopment, isServer, shouldCreateLocal },
    "[createDatabaseClient] ローカルアダプタの使用条件チェック"
  );


  if (shouldCreateLocal && localDbPath) {
    const fs = require("fs");
    // パスの解決: 絶対パスでない場合はprocess.cwd()からの相対パスとして扱う
    // ただし、呼び出し元ですでに解決済みのパスを渡すことを推奨
    const resolvedPath = path.isAbsolute(localDbPath) 
      ? localDbPath 
      : path.resolve(process.cwd(), localDbPath);

    logger.debug(
      { provided: localDbPath, resolved: resolvedPath, cwd: process.cwd() },
      "[createDatabaseClient] ローカルDBパスの解決"
    );


    if (fs.existsSync(resolvedPath)) {
      logger.debug({ dbPath: resolvedPath }, "ローカルD1アダプタを使用");
      logger.info({ dbPath: resolvedPath }, "ローカルDBファイルが見つかりました");

      return createLocalAdapter(resolvedPath);
    } else {
       logger.warn({ dbPath: resolvedPath }, "ローカルDBファイルが見つかりません");
       logger.error({ dbPath: resolvedPath }, "[createDatabaseClient] ローカルDBファイルが見つかりません");

    }
  }

  logger.error("[createDatabaseClient] データベースの初期化に失敗しました: バインディングがなく、ローカルアダプタも利用できません");

  throw new Error("D1データベースバインディングが見つからず、ローカルアダプタも初期化できませんでした。");
}
