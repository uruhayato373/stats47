// Cloudflare D1対応 DB Providerユーティリティ（できるだけシンプルに）
export type D1Database = any; // cloudflare/workers-types で型定義できる場合は利用可

export const getD1 = (): D1Database => {
  // 本番では process.env.DB などバインディングでD1を取得
  // ローカル開発時も適宜アダプタ拡張（必要ならwrangler/d1-pg/KV等に拡張可）
  if (typeof process !== "undefined" && "env" in process && process.env.DB) {
    return (globalThis as any).DB;
  }
  throw new Error("Cloudflare D1 Databaseバインディングがありません（process.env.DB）");
};

// ラッパUtils例
export async function runQuery(sql: string, ...params: any[]): Promise<any> {
  const db = getD1();
  const stmt = db.prepare(sql);
  if (params && params.length > 0) stmt.bind(...params);
  return await stmt.all(); // .first()等、用途に応じて拡張可
}
