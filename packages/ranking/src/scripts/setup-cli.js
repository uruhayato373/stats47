/**
 * CLI スクリプト用セットアップ
 * - .env.local から環境変数をロード（import 巻き上げより前に実行）
 * - server-only モジュールを無効化
 * - NODE_ENV=development を設定（ローカル D1 アダプタ使用のため）
 *
 * Usage: npx tsx -r ./packages/ranking/src/scripts/setup-cli.js ...
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";

const Module = require("module");
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request === "server-only") return request;
  return originalResolveFilename.call(this, request, ...args);
};
Module._cache["server-only"] = {
  id: "server-only",
  filename: "server-only",
  loaded: true,
  exports: {},
};
