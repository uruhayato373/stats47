import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../../../..");

/** Remotion の static アセット出力ルート (apps/remotion/public)。 */
export const REMOTION_PUBLIC = resolve(REPO_ROOT, "apps/remotion/public");
