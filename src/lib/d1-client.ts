/**
 * Cloudflare D1データベースクライアントを作成する
 * @throws {Error} 環境変数が不足している場合やAPI接続に失敗した場合
 */
export const createD1Database = async () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;

  // 環境変数のバリデーション
  const missingVars = [];
  if (!accountId) missingVars.push("CLOUDFLARE_ACCOUNT_ID");
  if (!apiToken) missingVars.push("CLOUDFLARE_API_TOKEN");
  if (!databaseId) missingVars.push("CLOUDFLARE_D1_DATABASE_ID");

  if (missingVars.length > 0) {
    throw new Error(
      `Cloudflare D1の設定が不完全です。不足している環境変数: ${missingVars.join(
        ", "
      )}`
    );
  }

  // 接続テスト
  try {
    const testResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!testResponse.ok) {
      throw new Error(
        `Cloudflare D1への接続テストに失敗しました: ${testResponse.status}`
      );
    }
  } catch (error) {
    throw new Error(
      `Cloudflare D1への接続に失敗しました: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  // リトライ用のユーティリティ関数
  const executeWithRetry = async (operation: () => Promise<any>) => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1秒
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 最後の試行でない場合は待機してリトライ
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt); // 指数バックオフ
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    // 全てのリトライが失敗した場合
    if (lastError) {
      throw lastError;
    }
  };

  // Cloudflare D1 REST APIを使用してデータベースに接続
  return {
    prepare: (sql: string) => ({
      bind: (...params: any[]) => {
        const boundQuery = {
          run: async () => {
            return executeWithRetry(async () => {
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
                const errorText = await response.text();
                throw new Error(
                  `D1 API Error: ${response.status} - ${errorText}`
                );
              }

              const result = await response.json();
              if (!result.success) {
                throw new Error(
                  `D1 Query failed: ${
                    result.errors?.[0]?.message || "Unknown error"
                  }`
                );
              }

              return {
                success: true,
                meta: { duration: result.result?.[0]?.meta?.duration || 1 },
              };
            });
          },
          all: async () => {
            return executeWithRetry(async () => {
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
                const errorText = await response.text();
                throw new Error(
                  `D1 API Error: ${response.status} - ${errorText}`
                );
              }

              const result = await response.json();
              if (!result.success) {
                throw new Error(
                  `D1 Query failed: ${
                    result.errors?.[0]?.message || "Unknown error"
                  }`
                );
              }

              return {
                success: true,
                results: result.result?.[0]?.results || [],
                meta: { duration: result.result?.[0]?.meta?.duration || 1 },
              };
            });
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
          },
        };
        return boundQuery;
      },
    }),
  };
};
