import { ListObjectsV2Command } from '@aws-sdk/client-s3';

import { getS3Client } from '../../lib/clients/get-s3-client';
import inventory from './license-retention-20260905.json';

export interface RetentionObject {
  key: string;
  bytes: number;
  etag: string;
}

/** Immutable approved objects, not a user-supplied prefix or manifest. */
export const LICENSE_RETENTION_TARGETS = inventory;

export function assertUnchangedRetentionInventory(
  expected: readonly RetentionObject[],
  actual: readonly RetentionObject[],
): void {
  const current = new Map(actual.map((object) => [object.key, object]));
  if (current.size !== actual.length || new Set(expected.map((object) => object.key)).size !== expected.length) {
    throw new Error('License retention inventory contains duplicate keys');
  }
  if (expected.length !== actual.length || expected.some((object) => {
    const found = current.get(object.key);
    return !found || found.bytes !== object.bytes || found.etag !== object.etag;
  })) {
    throw new Error('License retention inventory changed; no objects may be deleted');
  }
}

/** S3 only: never silently compare against a local staging directory. */
export async function listLicenseRetentionObjects(prefixes: readonly string[]): Promise<RetentionObject[]> {
  const client = getS3Client();
  const objects: RetentionObject[] = [];
  for (const prefix of prefixes) {
    let cursor: string | undefined;
    do {
      const response = await client.send(new ListObjectsV2Command({
        Bucket: 'stats47', Prefix: prefix, ContinuationToken: cursor,
      }));
      for (const object of response.Contents ?? []) {
        if (!object.Key || object.Size === undefined || !object.ETag) {
          throw new Error('Incomplete S3 inventory; refusing deletion');
        }
        // A file-prefix must not accidentally include similarly named siblings.
        if (!prefix.endsWith('/') && object.Key !== prefix) continue;
        objects.push({ key: object.Key, bytes: object.Size, etag: object.ETag });
      }
      if (response.IsTruncated && !response.NextContinuationToken) {
        throw new Error('Truncated S3 inventory without continuation token');
      }
      cursor = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (cursor);
  }
  return objects;
}
