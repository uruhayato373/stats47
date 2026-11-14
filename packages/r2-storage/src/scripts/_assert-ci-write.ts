/**
 * R2 への書き込み (push / delete / cleanup) のガード。
 *
 * 規則 (区分表は `r2-key-classes.ts`):
 * - dry-run は R2 に書かないので常に通す。
 * - CI (GITHUB_ACTIONS=true) では常に通す。
 * - ローカルでは、書き込み先 (targets) がすべて区分表で `origin: "mac"` の prefix のときだけ通す。
 *   それ以外 (CI が書く prefix・未登録・targets 未指定) は、書き手の workflow を案内して throw する。
 * - 明示の逃げ道は `ALLOW_LOCAL_R2_WRITE=1`。警告を出して通す。
 *
 * Mac で作る prefix を書くスクリプトは、書く key か prefix を `targets` に渡すこと。
 * 渡さないとローカルでは止まる (CI 専用の書き手として扱う)。
 */
import { classifyR2Key, R2_PUBLIC_BUCKET } from "./r2-key-classes";

export interface R2WriteTarget {
  bucket?: string;
  /** 書く object の key、または書く範囲の prefix ("/" 終端) */
  key: string;
}

export interface AssertR2WriteOptions {
  op?: string;
  dryRun?: boolean;
  /** 書き込み先。string は公開 bucket の key/prefix として扱う */
  targets?: readonly (string | R2WriteTarget)[];
  /** targets の既定 bucket (省略時は公開 bucket) */
  bucket?: string;
  env?: NodeJS.ProcessEnv;
}

export class LocalR2WriteBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalR2WriteBlockedError";
  }
}

function describeBlocked(bucket: string, key: string): string {
  const c = classifyR2Key(bucket, key);
  if (!c.registered) return `  - ${bucket}:${key} — 区分表に未登録 (r2-key-classes.ts)`;
  const writers = c.rule?.writers.length ? c.rule.writers.join(", ") : "r2-storage-design.md の対応表を参照";
  return `  - ${bucket}:${key} — CI が書く prefix (${c.rule?.prefix})。書き手: ${writers}`;
}

export function assertR2WriteAllowed(opts: AssertR2WriteOptions = {}): void {
  const { op = "R2 write", dryRun = false, targets = [], env = process.env } = opts;
  if (dryRun) return;
  if (env.GITHUB_ACTIONS === "true") return;

  if (env.ALLOW_LOCAL_R2_WRITE === "1") {
    console.warn(`⚠️ ALLOW_LOCAL_R2_WRITE=1 によりローカルから R2 へ書き込みます [${op}]`);
    return;
  }

  const defaultBucket = opts.bucket ?? R2_PUBLIC_BUCKET;
  const resolved = targets.map((t) =>
    typeof t === "string" ? { bucket: defaultBucket, key: t } : { bucket: t.bucket ?? defaultBucket, key: t.key },
  );
  const blocked = resolved.filter((t) => classifyR2Key(t.bucket, t.key).origin !== "mac");
  if (resolved.length > 0 && blocked.length === 0) {
    console.warn(`ℹ️ Mac で作る prefix へローカルから書き込みます [${op}]`);
    return;
  }

  const lines = resolved.length === 0
    ? ["  - 書き込み先が指定されていない (CI 専用の書き手)"]
    : blocked.slice(0, 20).map((t) => describeBlocked(t.bucket, t.key));
  if (blocked.length > 20) lines.push(`  ... 他 ${blocked.length - 20} 件`);
  throw new LocalR2WriteBlockedError(
    [
      `ローカルからの R2 書き込みを止めました [${op}]。`,
      "Mac で作る prefix (r2-key-classes.ts の origin: \"mac\") 以外は GitHub Actions の workflow から書いてください。",
      ...lines,
      "どうしてもローカルから書く場合だけ ALLOW_LOCAL_R2_WRITE=1 を付けて実行してください。",
    ].join("\n"),
  );
}
