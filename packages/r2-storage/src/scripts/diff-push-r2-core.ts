/**
 * diff-push-r2 の判定と送信の本体 (R2 の入出力は差し替えられる)。
 *
 * 止め (どれも PUT の前、または書いた後に非 0 にする):
 * (a) R2 の一覧が取れないときは送らずに止める。全件を送るのは `--allow-full-upload` のときだけ。
 * (b) authoritative (未登録を含む) の key を上書きする差分 (CHANGED、一覧が無く上書きか判定できない UNKNOWN) は、
 *     `--allow-authoritative-overwrite` が無ければ key を列挙して止める。新しい key (NEW) は止めない。
 *     CI では段階導入として既定は警告して続行し、`R2_AUTHORITATIVE_GUARD=enforce` のときだけ止める
 *     (resolveAuthoritativeGuardMode)。ローカルでは常に止める。
 * (c) 書いた後、送った件数の一致と、抜き取り (既定 最大 20 件) の HEAD 読み戻し (サイズと ETag=MD5) を確かめる。
 *
 * ETag と MD5 の関係: 1 回の PutObject で書いた object の ETag は本文の MD5 になる
 * (出典は lib/diff-push-remote-match.ts の冒頭。https://developers.cloudflare.com/r2/objects/upload-objects/#etags)。
 * diff-push-r2 は multipart を使わないので、読み戻しの ETag は本文の MD5 と一致しなければならない。
 */
import { assertDiffPushComplete } from "./lib/diff-push-result";
import {
  remoteListPrefixes,
  splitUnchangedOnRemote,
  type RemoteObjectSummary,
} from "./lib/diff-push-remote-match";
import { classifyR2Key, type R2DataClass } from "./r2-key-classes";

export const DEFAULT_READBACK_SAMPLE = 20;

export type DiffPushChange = "NEW" | "CHANGED" | "UNKNOWN" | "UNCHANGED";

export interface DiffPushFile {
  key: string;
  size: number;
}

export interface DiffPushPlanEntry<T extends DiffPushFile> {
  file: T;
  change: DiffPushChange;
  class: R2DataClass;
  registered: boolean;
}

export interface DiffPushPlan<T extends DiffPushFile> {
  entries: DiffPushPlanEntry<T>[];
  /** manifest にあってローカルから消えた key。diff-push-r2 は R2 から削除しない (表示だけ) */
  removed: { key: string; class: R2DataClass }[];
}

export interface DiffPushFlags {
  allowFullUpload: boolean;
  allowAuthoritativeOverwrite: boolean;
}

export class DiffPushGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiffPushGuardError";
  }
}

export function parseDiffPushFlags(args: readonly string[]): DiffPushFlags {
  return {
    allowFullUpload: args.includes("--allow-full-upload"),
    allowAuthoritativeOverwrite: args.includes("--allow-authoritative-overwrite"),
  };
}

/**
 * 送る候補を NEW / CHANGED / UNCHANGED に分け、区分を付ける。
 * remote が null (一覧なし) のときは fallbackChange で決める (既定は UNKNOWN)。
 */
export function planDiffPush<T extends DiffPushFile>(options: {
  bucket: string;
  candidates: readonly T[];
  removedKeys?: readonly string[];
  remote: ReadonlyMap<string, RemoteObjectSummary> | null;
  md5Of: (file: T) => string;
  fallbackChange?: (file: T) => DiffPushChange;
}): DiffPushPlan<T> {
  const { bucket, candidates, remote, md5Of } = options;
  const classOf = (key: string) => classifyR2Key(bucket, key);
  let changes: Map<T, DiffPushChange>;
  if (remote) {
    const split = splitUnchangedOnRemote(candidates, remote, md5Of);
    const unchanged = new Set(split.unchanged);
    changes = new Map(candidates.map((file) => [
      file,
      unchanged.has(file) ? "UNCHANGED" : remote.has(file.key) ? "CHANGED" : "NEW",
    ]));
  } else {
    const fallback = options.fallbackChange ?? (() => "UNKNOWN" as const);
    changes = new Map(candidates.map((file) => [file, fallback(file)]));
  }
  return {
    entries: candidates.map((file) => {
      const c = classOf(file.key);
      return { file, change: changes.get(file) ?? "UNKNOWN", class: c.class, registered: c.registered };
    }),
    removed: (options.removedKeys ?? []).map((key) => ({ key, class: classOf(key).class })),
  };
}

/** authoritative (未登録を含む) を上書きしうる entry。NEW と UNCHANGED は含まない */
export function authoritativeOverwrites<T extends DiffPushFile>(plan: DiffPushPlan<T>): DiffPushPlanEntry<T>[] {
  return plan.entries.filter(
    (e) => e.class === "authoritative" && (e.change === "CHANGED" || e.change === "UNKNOWN"),
  );
}

/**
 * 止め (b) の強さ。段階導入のため、CI では既定を「警告して続行」にする。
 * - ローカル (GITHUB_ACTIONS が true 以外): 常に enforce
 * - CI: `R2_AUTHORITATIVE_GUARD=enforce` のときだけ enforce、それ以外は warn
 *
 * 理由: 定期実行は main の workflow 定義で動き、develop のスクリプトを使うものがある。main の YAML に
 * `--allow-authoritative-overwrite` が入る前に止めると、意図した正本の更新 (data-refresh 等) が落ちる。
 */
export type AuthoritativeGuardMode = "enforce" | "warn";

export function resolveAuthoritativeGuardMode(env: NodeJS.ProcessEnv = process.env): AuthoritativeGuardMode {
  if (env.GITHUB_ACTIONS !== "true") return "enforce";
  return env.R2_AUTHORITATIVE_GUARD === "enforce" ? "enforce" : "warn";
}

export function assertNoAuthoritativeOverwrite<T extends DiffPushFile>(
  plan: DiffPushPlan<T>,
  allow: boolean,
  mode: AuthoritativeGuardMode = "enforce",
  log: (line: string) => void = (line) => console.warn(line),
): void {
  if (allow) return;
  const hits = authoritativeOverwrites(plan);
  if (hits.length === 0) return;
  const listed = hits.slice(0, 50).map((e) =>
    `  [${e.change}] ${e.file.key}${e.registered ? "" : " (区分表に未登録)"}`);
  if (hits.length > 50) listed.push(`  ... 他 ${hits.length - 50} 件`);
  if (mode === "warn") {
    // GitHub Actions の注釈として run の要約に出す。本文の key 一覧はログに続けて出す
    log(`::warning title=R2 authoritative overwrite::R2 が唯一の正本の object を ${hits.length} 件上書きします ` +
      "(CI の段階導入で続行。止めるには R2_AUTHORITATIVE_GUARD=enforce、意図した更新なら --allow-authoritative-overwrite)");
    for (const line of listed) log(line);
    return;
  }
  throw new DiffPushGuardError(
    [
      `R2 が唯一の正本 (authoritative) の object を上書きする差分が ${hits.length} 件あるため送信を止めました。`,
      ...listed,
      "意図した更新なら --allow-authoritative-overwrite を付けて再実行してください (区分表: r2-key-classes.ts)。",
    ].join("\n"),
  );
}

export interface DiffPushClassCounts {
  NEW: number;
  CHANGED: number;
  UNKNOWN: number;
  UNCHANGED: number;
  REMOVED: number;
}

export function summarizeDiffPushPlan<T extends DiffPushFile>(
  plan: DiffPushPlan<T>,
): Record<R2DataClass, DiffPushClassCounts> {
  const empty = (): DiffPushClassCounts => ({ NEW: 0, CHANGED: 0, UNKNOWN: 0, UNCHANGED: 0, REMOVED: 0 });
  const out: Record<R2DataClass, DiffPushClassCounts> = { regenerable: empty(), authoritative: empty() };
  for (const e of plan.entries) out[e.class][e.change] += 1;
  for (const r of plan.removed) out[r.class].REMOVED += 1;
  return out;
}

export function formatDiffPushSummary<T extends DiffPushFile>(plan: DiffPushPlan<T>): string[] {
  const summary = summarizeDiffPushPlan(plan);
  return (["regenerable", "authoritative"] as const).map((cls) => {
    const c = summary[cls];
    const unknown = c.UNKNOWN > 0 ? ` 判定不能=${c.UNKNOWN}` : "";
    return `  ${cls.padEnd(13)} NEW=${c.NEW} CHANGED=${c.CHANGED}${unknown} 削除(manifest のみ)=${c.REMOVED} 一致=${c.UNCHANGED}`;
  });
}

/** 抜き取りの対象。件数が max 以下なら全件、超えたら先頭から末尾まで等間隔に選ぶ (再現できる選び方) */
export function pickReadbackSample<T>(items: readonly T[], max = DEFAULT_READBACK_SAMPLE): T[] {
  if (items.length <= max) return [...items];
  if (max <= 1) return items.slice(0, Math.max(max, 0));
  const picked: T[] = [];
  for (let i = 0; i < max; i += 1) picked.push(items[Math.round((i * (items.length - 1)) / (max - 1))]);
  return picked;
}

export interface ReadbackHead {
  contentLength: number | null;
  etag: string | null;
}

export interface ReadbackTarget {
  key: string;
  size: number;
  md5: string;
}

export async function verifyReadback(options: {
  targets: readonly ReadbackTarget[];
  head: (key: string) => Promise<ReadbackHead | null>;
  max?: number;
}): Promise<{ checked: number; mismatches: string[] }> {
  const sample = pickReadbackSample(options.targets, options.max ?? DEFAULT_READBACK_SAMPLE);
  const mismatches: string[] = [];
  for (const target of sample) {
    let head: ReadbackHead | null;
    try {
      head = await options.head(target.key);
    } catch (e: unknown) {
      mismatches.push(`${target.key}: HEAD 失敗 (${e instanceof Error ? e.message.split("\n")[0] : String(e)})`);
      continue;
    }
    if (!head) {
      mismatches.push(`${target.key}: R2 に無い`);
      continue;
    }
    const etag = (head.etag ?? "").replace(/^"|"$/g, "").toLowerCase();
    if (head.contentLength !== target.size || etag !== target.md5.toLowerCase()) {
      mismatches.push(
        `${target.key}: size ${head.contentLength}/${target.size} etag ${etag || "(なし)"}/${target.md5.toLowerCase()}`,
      );
    }
  }
  return { checked: sample.length, mismatches };
}

export interface DiffPushIo<T extends DiffPushFile> {
  list(prefixes: readonly string[]): Promise<Map<string, RemoteObjectSummary>>;
  put(file: T): Promise<void>;
  head(key: string): Promise<ReadbackHead | null>;
  md5Of(file: T): string;
}

export interface DiffPushRunResult<T extends DiffPushFile> {
  plan: DiffPushPlan<T>;
  attempted: number;
  success: number;
  errors: number;
  readback: { checked: number; mismatches: string[] };
}

/**
 * 一覧 → 判定 → 止め → 送信 → 件数照合 → 読み戻し の順に実行する。
 * 止めに当たったときは 1 件も PUT しない。
 */
export async function runDiffPush<T extends DiffPushFile>(options: {
  bucket: string;
  prefix: string;
  candidates: readonly T[];
  removedKeys?: readonly string[];
  flags: DiffPushFlags;
  io: DiffPushIo<T>;
  concurrency?: number;
  readbackMax?: number;
  /** 止め (b) の強さ。省略時は enforce (呼び元の CLI が resolveAuthoritativeGuardMode で決める) */
  authoritativeGuard?: AuthoritativeGuardMode;
  log?: (line: string) => void;
  /** 送信直前に送る対象を受け取る (blog 索引の条件付き PUT の準備など) */
  beforeUpload?: (targets: readonly T[]) => Promise<void>;
  onUnchanged?: (file: T) => void;
  onUploaded?: (file: T) => void;
  onProgress?: (processed: number, total: number, success: number, errors: number) => void;
}): Promise<DiffPushRunResult<T>> {
  const log = options.log ?? ((line: string) => console.log(line));
  const { io, flags } = options;

  let remote: Map<string, RemoteObjectSummary> | null;
  try {
    remote = await io.list(remoteListPrefixes(options.prefix, options.candidates.map((f) => f.key)));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
    if (!flags.allowFullUpload) {
      throw new DiffPushGuardError(
        `R2 の一覧を取れないため送信を止めました (送った件数 0): ${msg}\n` +
          "一覧と照合せずに全件を送る場合だけ --allow-full-upload を付けて再実行してください。",
      );
    }
    log(`⚠ R2 の一覧を取れません (${msg})。--allow-full-upload により照合せずに全件を送ります`);
    remote = null;
  }

  const plan = planDiffPush({
    bucket: options.bucket,
    candidates: options.candidates,
    removedKeys: options.removedKeys,
    remote,
    md5Of: io.md5Of,
  });
  log("区分別の差分:");
  for (const line of formatDiffPushSummary(plan)) log(line);
  assertNoAuthoritativeOverwrite(plan, flags.allowAuthoritativeOverwrite, options.authoritativeGuard ?? "enforce", log);

  for (const e of plan.entries) if (e.change === "UNCHANGED") options.onUnchanged?.(e.file);
  const targets = plan.entries.filter((e) => e.change !== "UNCHANGED").map((e) => e.file);
  log(`R2 と中身が同じ（送らない）: ${plan.entries.length - targets.length}`);
  log(`送信する: ${targets.length}`);
  await options.beforeUpload?.(targets);

  const concurrency = Math.max(1, options.concurrency ?? 8);
  const uploaded: T[] = [];
  let errors = 0;
  for (let i = 0; i < targets.length; i += concurrency) {
    const chunk = targets.slice(i, i + concurrency);
    await Promise.all(chunk.map(async (file) => {
      try {
        await io.put(file);
        uploaded.push(file);
        options.onUploaded?.(file);
      } catch (e: unknown) {
        errors += 1;
        log(`FAIL: ${file.key} - ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`);
      }
    }));
    options.onProgress?.(Math.min(i + concurrency, targets.length), targets.length, uploaded.length, errors);
  }

  assertDiffPushComplete({ attempted: targets.length, success: uploaded.length, errors });

  const order = new Map(targets.map((f, index) => [f.key, index]));
  // 送った順に並べてから抜き取り、抜き取った分だけ MD5 を計算する (全件のファイルを読み直さない)
  const readbackMax = options.readbackMax ?? DEFAULT_READBACK_SAMPLE;
  const sorted = [...uploaded].sort((a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0));
  const readbackTargets = pickReadbackSample(sorted, readbackMax)
    .map((f) => ({ key: f.key, size: f.size, md5: io.md5Of(f) }));
  const readback = await verifyReadback({ targets: readbackTargets, head: io.head, max: readbackMax });
  if (readback.mismatches.length > 0) {
    throw new DiffPushGuardError(
      [`書いた後の読み戻しが一致しません (${readback.mismatches.length}/${readback.checked} 件):`,
        ...readback.mismatches.map((m) => `  ${m}`)].join("\n"),
    );
  }
  log(`読み戻し: ${readback.checked} 件を HEAD で照合し一致`);

  return { plan, attempted: targets.length, success: uploaded.length, errors, readback };
}
