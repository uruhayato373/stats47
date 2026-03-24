import {
    GetObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client
} from "@aws-sdk/client-s3";
import { config } from "dotenv";
import path from "path";
  
  // Load environment variables
  config({ path: path.join(process.cwd(), "../../.env.local") });
  config({ path: path.join(process.cwd(), ".env.local") });
  config({ path: path.join(process.cwd(), ".env") });
  
  const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  const ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47-r2";
  
  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    console.error("❌  Missing Cloudflare R2 credentials. Please check .env.local");
    process.exit(1);
  }
  
  const R2 = new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });
  
  export interface FileInfo {
    key: string;
    size: number;
    lastModified?: Date;
  }
  
  export async function listR2Files(prefix: string): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    let token: string | undefined;
  
    do {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: token,
      });
      const response = await R2.send(command);
      if (response.Contents) {
        files.push(
          ...response.Contents.map((c) => ({
            key: c.Key!,
            size: c.Size!,
            lastModified: c.LastModified,
          }))
        );
      }
      token = response.NextContinuationToken;
    } while (token);
  
    return files;
  }
  
  export async function uploadToR2(key: string, body: Buffer | string, contentType?: string) {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await R2.send(command);
  }
  
  export async function downloadFromR2(key: string): Promise<Buffer | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      const response = await R2.send(command);
      if (!response.Body) return null;
      return Buffer.from(await response.Body.transformToByteArray());
    } catch (error) {
        // console.error(`Failed to download ${key}:`, error);
        return null;
    }
  }
  
