import "server-only";

import { logger } from "@stats47/logger/server";

import { saveToR2 } from "../lib";

export interface PartitionTask {
  /** R2 key (e.g. "snapshots/correlation/by-ranking-key/foo.json"). */
  key: string;
  /** Snapshot data to JSON.stringify and save. */
  data: unknown;
}

export interface SavePartitionedSnapshotsOptions {
  tasks: Iterable<PartitionTask> | AsyncIterable<PartitionTask>;
  /** Total expected count (for progress logging). Set -1 if unknown. */
  totalHint: number;
  /** Concurrent saveToR2 calls. */
  concurrency: number;
  /** Logger label (e.g. "per-key correlation"). */
  label: string;
  /** Items between progress log entries. Default 100. */
  progressInterval?: number;
  /** Called when an item fails. Default: logger.error. */
  onError?: (key: string, err: Error) => void;
}

export interface PartitionedSnapshotResult {
  totalItems: number;
  succeeded: number;
  failed: number;
  totalBytes: number;
  durationMs: number;
}

async function* toAsyncIterable<T>(
  source: Iterable<T> | AsyncIterable<T>,
): AsyncIterable<T> {
  if (Symbol.asyncIterator in source) {
    yield* source as AsyncIterable<T>;
  } else {
    for (const item of source as Iterable<T>) {
      yield item;
    }
  }
}

export async function savePartitionedJsonSnapshots(
  options: SavePartitionedSnapshotsOptions,
): Promise<PartitionedSnapshotResult> {
  const startedAt = Date.now();
  const progressInterval = options.progressInterval ?? 100;
  const onError =
    options.onError ??
    ((key, err) =>
      logger.error(
        { key, error: err.message },
        `${options.label}: partition snapshot 保存失敗`,
      ));

  const queue: PartitionTask[] = [];
  let producerDone = false;
  let totalItems = 0;
  let succeeded = 0;
  let failed = 0;
  let totalBytes = 0;
  let nextProgressAt = progressInterval;

  // Producer: drain async iterator into bounded queue
  const producer = (async () => {
    for await (const task of toAsyncIterable(options.tasks)) {
      queue.push(task);
      totalItems++;
    }
    producerDone = true;
  })();

  async function worker() {
    while (true) {
      const task = queue.shift();
      if (!task) {
        if (producerDone) return;
        await new Promise((r) => setTimeout(r, 10));
        continue;
      }
      try {
        const body = JSON.stringify(task.data);
        const result = await saveToR2(task.key, body, {
          contentType: "application/json; charset=utf-8",
        });
        succeeded++;
        totalBytes += result.size;
      } catch (error) {
        failed++;
        onError(task.key, error instanceof Error ? error : new Error(String(error)));
      }

      const done = succeeded + failed;
      if (done >= nextProgressAt) {
        nextProgressAt += progressInterval;
        const total = options.totalHint > 0 ? options.totalHint : totalItems;
        logger.info(
          { label: options.label, done, total, succeeded, failed, totalBytes },
          `${options.label}: 進捗`,
        );
      }
    }
  }

  const workers = Array.from({ length: options.concurrency }, () => worker());
  await Promise.all([producer, ...workers]);

  const durationMs = Date.now() - startedAt;
  logger.info(
    {
      label: options.label,
      totalItems,
      succeeded,
      failed,
      totalBytes,
      durationMs,
    },
    `${options.label}: partition snapshots 完了`,
  );

  return { totalItems, succeeded, failed, totalBytes, durationMs };
}
