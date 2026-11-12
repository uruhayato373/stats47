/** 生成済みの全指標を台帳と照合する。生成後・公開前に同じ検査を使う。 */
import fs from 'node:fs';
import path from 'node:path';
import { listAllMetrics } from '@stats47/data-configs';
import { CORRELATION_DIRECTIONS } from '../selection-policy';
import { CORRELATION_BY_KEY_PREFIX, parseCorrelationByKeySnapshot } from '../types/snapshot';

export function verifyCorrelationDirectory(root: string): { files: number; populated: number; positive: number; negative: number } {
  const configs = listAllMetrics().filter(metric => metric.isActive !== false && metric.entities.includes('prefecture'));
  const known = new Set(configs.map(metric => metric.key));
  const directory = path.join(root, CORRELATION_BY_KEY_PREFIX);
  const files = fs.readdirSync(directory).filter(file => file.endsWith('.json'));
  if (files.length !== known.size) throw new Error(`Expected ${known.size} snapshots, found ${files.length}`);
  const counts = { files: files.length, populated: 0, positive: 0, negative: 0 };
  for (const key of known) {
    const snapshot = parseCorrelationByKeySnapshot(JSON.parse(fs.readFileSync(path.join(directory, `${key}.json`), 'utf8')));
    if (snapshot.rankingKey !== key) throw new Error(`Snapshot ID mismatch: ${key}`);
    if (CORRELATION_DIRECTIONS.some(direction => snapshot.groups[direction].length > 0)) counts.populated++;
    for (const direction of CORRELATION_DIRECTIONS) {
      for (const item of snapshot.groups[direction]) {
        if (!known.has(item.rankingKey)) throw new Error(`Unknown metric: ${item.rankingKey}`);
      }
      counts[direction] += snapshot.groups[direction].length;
    }
  }
  return counts;
}

if (process.argv[1]?.includes('verify-correlation-by-key')) {
  const root = process.env.R2_STAGING_DIR ?? path.resolve('.local/r2');
  console.log(JSON.stringify(verifyCorrelationDirectory(root)));
}
