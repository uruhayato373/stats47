import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(__dirname, "../../../..");
export const D1_PATH = resolve(
  REPO_ROOT,
  "packages/database/.data/stats47.sqlite",
);
export const R2_LOCAL_DIR = resolve(REPO_ROOT, ".local/r2");
