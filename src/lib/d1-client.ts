// Cloudflare D1データベースクライアント
export const createD1Database = async () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;

  if (!accountId || !apiToken || !databaseId) {
    throw new Error("Cloudflare D1の設定が不完全です");
  }

  // Cloudflare D1 REST APIを使用してデータベースに接続
  return {
    prepare: (sql: string) => ({
      bind: (...params: any[]) => {
        const boundQuery = {
          run: async () => {
            const response = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ sql, params }),
              }
            );

            if (!response.ok) {
              throw new Error(`D1 API Error: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
              throw new Error("D1 Query failed");
            }

            return {
              success: true,
              meta: { duration: result.result?.[0]?.meta?.duration || 1 }
            };
          },
          all: async () => {
            const response = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ sql, params }),
              }
            );

            if (!response.ok) {
              throw new Error(`D1 API Error: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
              throw new Error("D1 Query failed");
            }

            return {
              success: true,
              results: result.result?.[0]?.results || [],
              meta: { duration: result.result?.[0]?.meta?.duration || 1 }
            };
          },
          first: async () => {
            const response = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ sql, params }),
              }
            );

            if (!response.ok) {
              throw new Error(`D1 API Error: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
              throw new Error("D1 Query failed");
            }

            return result.result?.[0]?.results?.[0] || null;
          }
        };
        return boundQuery;
      }
    })
  };
};