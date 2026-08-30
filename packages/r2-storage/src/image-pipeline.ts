import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

export interface StoredImageObject {
  body: Buffer;
  etag: string | null;
  contentType: string | null;
  contentEncoding: string | null;
  contentLength: number | null;
  metadata: Record<string, string>;
}

export interface ImageObjectStore {
  get(key: string): Promise<StoredImageObject | null>;
  head(key: string): Promise<Omit<StoredImageObject, 'body'> | null>;
  put(options: {
    key: string;
    body: Buffer;
    contentType: string;
    contentEncoding?: string;
    cacheControl: string;
    metadata: Record<string, string>;
    ifMatch?: string;
    ifNoneMatch?: '*';
  }): Promise<void | { etag: string | null }>;
  delete(options: { key: string; ifMatch: string }): Promise<void>;
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };
  return (
    candidate.name === 'NoSuchKey' ||
    candidate.name === 'NotFound' ||
    candidate.$metadata?.httpStatusCode === 404
  );
}

export function createS3ImageObjectStore(
  client: S3Client,
  bucket: string
): ImageObjectStore {
  return {
    async get(key) {
      try {
        const result = await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: key })
        );
        if (!result.Body) throw new Error(`R2 object body が空です: ${key}`);
        return {
          body: Buffer.from(await result.Body.transformToByteArray()),
          etag: result.ETag ?? null,
          contentType: result.ContentType ?? null,
          contentEncoding: result.ContentEncoding ?? null,
          contentLength: result.ContentLength ?? null,
          metadata: result.Metadata ?? {},
        };
      } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
      }
    },
    async head(key) {
      try {
        const result = await client.send(
          new HeadObjectCommand({ Bucket: bucket, Key: key })
        );
        return {
          etag: result.ETag ?? null,
          contentType: result.ContentType ?? null,
          contentEncoding: result.ContentEncoding ?? null,
          contentLength: result.ContentLength ?? null,
          metadata: result.Metadata ?? {},
        };
      } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
      }
    },
    async put(options) {
      const result = await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: options.key,
          Body: options.body,
          ContentType: options.contentType,
          ContentEncoding: options.contentEncoding,
          CacheControl: options.cacheControl,
          Metadata: options.metadata,
          IfMatch: options.ifMatch,
          IfNoneMatch: options.ifNoneMatch,
        })
      );
      return { etag: result.ETag ?? null };
    },
    async delete(options) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: options.key,
          IfMatch: options.ifMatch,
        })
      );
    },
  };
}

export function createS3ImageObjectStoreFromEnv(): ImageObjectStore | null {
  const endpoint = process.env.R2_S3_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? 'stats47';
  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return createS3ImageObjectStore(client, bucket);
}
