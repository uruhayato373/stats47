import { S3Client } from "@aws-sdk/client-s3";
import { logger } from "@stats47/logger";

// https-proxy-agent は ESM-only で `"exports": { "import": ... }` のみ。
// tsx + setup-cli.js の CJS 経路で静的 import すると ERR_PACKAGE_PATH_NOT_EXPORTED
// で失敗するため、プロキシが必要なときのみ require する遅延ロードに切替。
type HttpsProxyAgentCtor = new (proxy: string) => unknown;
function loadHttpsProxyAgent(): HttpsProxyAgentCtor | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("https-proxy-agent") as { HttpsProxyAgent: HttpsProxyAgentCtor };
    return mod.HttpsProxyAgent;
  } catch {
    return null;
  }
}

/**
 * R2エンドポイントがNO_PROXYに含まれているか確認
 */
function shouldBypassProxy(endpoint: string, noProxy: string): boolean {
  if (!noProxy) {
    return false;
  }

  const patterns = noProxy.split(",").map((p) => p.trim());
  
  return patterns.some((pattern) => {
    if (endpoint === pattern) {
      return true;
    }
    
    if (pattern.includes("*")) {
      const regexPattern = pattern
        .replace(/\./g, "\\.")
        .replace(/\*/g, ".*");
      const regex = new RegExp(`^${regexPattern}$`);
      try {
        const hostname = new URL(endpoint).hostname;
        return regex.test(hostname);
      } catch {
        return false;
      }
    }
    
    return endpoint.includes(pattern);
  });
}

/**
 * S3互換API用のS3クライアントを作成
 * 
 * @returns S3Client インスタンス
 */
export function createS3Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 S3互換API用の環境変数が設定されていません: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY"
    );
  }

  const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  // プロキシ設定
  const httpsProxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const noProxy = process.env.NO_PROXY || process.env.no_proxy || "";
  const bypassProxy = shouldBypassProxy(r2Endpoint, noProxy);

  // プロキシエージェントの設定
  let httpAgent: unknown | undefined;
  let httpsAgent: unknown | undefined;

  if (httpsProxy && !bypassProxy) {
    const HttpsProxyAgentClass = loadHttpsProxyAgent();
    if (HttpsProxyAgentClass) {
      try {
        const proxyAgent = new HttpsProxyAgentClass(httpsProxy);
        httpAgent = proxyAgent;
        httpsAgent = proxyAgent;
      } catch (error) {
        logger.warn(
          {
            error: error instanceof Error ? error.message : String(error),
          },
          "S3クライアント: プロキシエージェントの作成に失敗、プロキシなしで続行"
        );
      }
    } else {
      logger.warn(
        { httpsProxy },
        "https-proxy-agent を遅延ロードできませんでした。プロキシなしで続行します",
      );
    }
  }

  return new S3Client({
    region: "auto",
    endpoint: r2Endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    requestHandler: httpAgent && httpsAgent
      ? {
          httpAgent,
          httpsAgent,
          requestTimeout: 15000,
          connectionTimeout: 10000,
        }
      : {
          requestTimeout: 15000,
          connectionTimeout: 10000,
        },
  });
}
