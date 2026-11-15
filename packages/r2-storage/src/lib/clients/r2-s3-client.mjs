// R2 の S3 クライアントを作る唯一の部品。@aws-sdk 以外を import しない (Workers の bundle と web の読み口から読まれるため)。
// 再試行は SDK に任せる (adaptive: 429・503 で間隔を空けて再試行)。正典: .claude/rules/r2-storage-design.md
import { S3Client } from '@aws-sdk/client-s3';

/** Shared S3 transport. Bucket selection stays on each command, not on the client. */
export function createR2S3Client({ bucket } = {}) {
  void bucket;
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    maxAttempts: 5,
    retryMode: 'adaptive',
  });
}
