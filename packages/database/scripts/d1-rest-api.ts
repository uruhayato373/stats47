/**
 * D1 REST API ユーティリティ
 *
 * wrangler CLI を介さず Cloudflare D1 REST API を直接呼ぶことで、
 * プロセス起動オーバーヘッドを排除し並列実行を可能にする。
 *
 * ベンチマーク（correlation_analysis 344k行）:
 *   wrangler CLI (500行/chunk):  ~2,000行/分
 *   REST API    (500行/chunk, 5並列): ~130,000行/分  ← 65倍速
 */

const D1_API_BASE = "https://api.cloudflare.com/client/v4/accounts";

interface D1Config {
  accountId: string;
  databaseId: string;
  apiToken: string;
}

function getD1Config(): D1Config {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_STATIC_DATABASE_ID_PRODUCTION;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    throw new Error(
      "Missing env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_STATIC_DATABASE_ID_PRODUCTION, CLOUDFLARE_API_TOKEN"
    );
  }

  return { accountId, databaseId, apiToken };
}

function getEndpoint(config: D1Config): string {
  return `${D1_API_BASE}/${config.accountId}/d1/database/${config.databaseId}/raw`;
}

/**
 * D1 REST API で SQL を実行する（リトライ付き）
 */
export async function executeRemoteSQL(
  sql: string,
  maxRetries = 3
): Promise<boolean> {
  const config = getD1Config();
  const url = getEndpoint(config);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql }),
      });
      if (res.ok) return true;

      const text = await res.text();
      if (attempt === maxRetries - 1) {
        console.error(`D1 API error: ${res.status} ${text.slice(0, 200)}`);
      }
    } catch (e) {
      if (attempt === maxRetries - 1) {
        console.error(
          `D1 API fetch error: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }
  }
  return false;
}

/**
 * 複数 SQL チャンクを並列でリモート D1 に送信する
 *
 * @param sqlChunks - 各チャンクの SQL 文字列（複数 INSERT 文を改行で連結）
 * @param concurrency - 同時実行数（デフォルト 5）
 * @param onProgress - 進捗コールバック
 */
export async function executeRemoteBulkSQL(
  sqlChunks: string[],
  concurrency = 5,
  onProgress?: (completed: number, failed: number, total: number) => void
): Promise<{ ok: number; failed: number }> {
  let ok = 0;
  let failed = 0;
  const total = sqlChunks.length;
  const pending: Promise<void>[] = [];

  for (let i = 0; i < sqlChunks.length; i++) {
    const sql = sqlChunks[i];
    const p = executeRemoteSQL(sql).then((success) => {
      if (success) ok++;
      else failed++;
    });
    pending.push(p);

    if (pending.length >= concurrency) {
      await Promise.all(pending);
      pending.length = 0;
      onProgress?.(ok, failed, total);
    }
  }

  if (pending.length > 0) {
    await Promise.all(pending);
    onProgress?.(ok, failed, total);
  }

  return { ok, failed };
}

/**
 * DB の行データから INSERT SQL チャンクを生成する（ストリーミング対応）
 *
 * @param rows - イテレータまたは配列
 * @param table - テーブル名
 * @param cols - カラム名リスト
 * @param chunkSize - 1チャンクあたりの行数
 */
export function buildInsertChunks(
  rows: Iterable<Record<string, unknown>>,
  table: string,
  cols: string[],
  chunkSize: number
): string[] {
  const chunks: string[] = [];
  let buf: string[] = [];

  for (const row of rows) {
    const vals = cols.map((c) => {
      const v = row[c];
      if (v === null || v === undefined) return "NULL";
      let s = String(v).replace(/'/g, "''");
      if (s.includes("\n")) {
        return s
          .split("\n")
          .map((p) => `'${p}'`)
          .join(" || char(10) || ");
      }
      return `'${s}'`;
    });
    buf.push(
      `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${vals.join(", ")});`
    );

    if (buf.length >= chunkSize) {
      chunks.push(buf.join("\n"));
      buf = [];
    }
  }

  if (buf.length > 0) {
    chunks.push(buf.join("\n"));
  }

  return chunks;
}
