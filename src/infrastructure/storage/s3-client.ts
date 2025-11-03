/**
 * R2 S3互換APIクライアント
 * ローカル開発環境でR2にアクセスするためのS3互換APIクライアント
 */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

/**
 * R2 S3互換API設定
 */
export interface R2S3Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region?: string;
}

/**
 * R2 S3互換APIクライアント
 */
export class R2S3Client {
  private client: S3Client;
  private bucketName: string;

  constructor(config: R2S3Config) {
    this.bucketName = config.bucketName;

    this.client = new S3Client({
      region: config.region || "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // R2では必須
    });
  }

  /**
   * オブジェクトを保存
   */
  async putObject(
    key: string,
    body: Buffer | Uint8Array | string,
    options?: {
      contentType?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<{ key: string; size: number }> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: options?.contentType || "application/json",
      Metadata: options?.metadata,
    });

    await this.client.send(command);

    const size =
      body instanceof Buffer
        ? body.length
        : body instanceof Uint8Array
        ? body.length
        : new TextEncoder().encode(body).length;

    return { key, size };
  }

  /**
   * オブジェクトを取得
   */
  async getObject(key: string): Promise<Buffer | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        return null;
      }

      // BodyをBufferに変換
      const chunks: Uint8Array[] = [];
      const stream = response.Body as any;

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      if (error instanceof Error && error.name === "NoSuchKey") {
        return null;
      }
      throw error;
    }
  }

  /**
   * オブジェクトを削除
   */
  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
  }

  /**
   * オブジェクト一覧を取得（ページネーション対応）
   */
  async listObjects(prefix?: string): Promise<string[]> {
    const allKeys: string[] = [];
    let continuationToken: string | undefined = undefined;

    do {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await this.client.send(command);

      if (response.Contents) {
        const keys = response.Contents.map((obj) => obj.Key || "").filter(
          (key) => key
        );
        allKeys.push(...keys);
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return allKeys;
  }
}

/**
 * 環境変数からR2 S3設定を取得
 */
export function getR2S3Config(): R2S3Config | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName: bucketName,
  };
}
