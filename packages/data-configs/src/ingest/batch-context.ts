import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(__dirname, "../../../..");
export const R2_LOCAL = resolve(REPO_ROOT, ".local/r2");

// The CLI owns credential resolution; ingestion only calls it on the live API branch.
export let readAppId: () => string;
export function setAppIdReader(reader: () => string): void {
  readAppId = reader;
}

export interface Args {
  metric?: string;
  all: boolean;
  selectOnly: boolean;
  kind?: string;
  since?: string;
  dryRun: boolean;
  concurrency: number;
  /** 0 件を警告に降格する metric key (一回きりの検証用) */
  allowEmpty: Set<string>;
  /** 形状違反を警告に降格する metric key (一回きりの検証用) */
  allowShape: Set<string>;
}
