import { S3Client } from "@aws-sdk/client-s3";

let cachedClient: S3Client | null = null;

export function getS3Client(): S3Client {
  if (cachedClient) return cachedClient;

  const endpoint = process.env.R2_S3_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2_S3_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY が未設定です");
  }

  cachedClient = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  return cachedClient;
}
