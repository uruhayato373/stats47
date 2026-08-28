export const LINK_AUDIT_POLICY = Object.freeze({
  timeoutMs: 20_000,
  maxAttempts: 3,
  retryDelayMs: 250,
  staleAfterDays: 120,
});

export type LinkVerdict =
  | "ok"
  | "bot-block"
  | "gone"
  | "server-err"
  | "timeout"
  | "stale";

export interface LinkProbeTarget {
  readonly targetId: string;
  readonly label: string;
  readonly url: string;
  readonly verifiedAt: string;
  readonly alertOwner: string;
}

export interface LinkProbeResult {
  readonly target: LinkProbeTarget;
  readonly verdict: LinkVerdict;
  readonly detail: string;
  readonly attempts: number;
}

export function isVerificationStale(
  verifiedAt: string,
  now: Date,
  staleAfterDays: number = LINK_AUDIT_POLICY.staleAfterDays,
): boolean {
  const verified = Date.parse(`${verifiedAt}T00:00:00Z`);
  if (!Number.isFinite(verified)) return true;
  return now.getTime() - verified > staleAfterDays * 86_400_000;
}

export function classifyLinkStatus(status: number): Exclude<LinkVerdict, "timeout" | "stale"> {
  if (status === 403) return "bot-block";
  if (status === 404 || status === 410 || status >= 400 && status < 500) return "gone";
  if (status >= 500) return "server-err";
  return "ok";
}

export async function probeLinkWithRetry(
  target: LinkProbeTarget,
  options: {
    readonly fetchFn?: typeof fetch;
    readonly sleep?: (milliseconds: number) => Promise<void>;
    readonly now?: Date;
    readonly timeoutMs?: number;
    readonly maxAttempts?: number;
    readonly retryDelayMs?: number;
    readonly staleAfterDays?: number;
    readonly userAgent?: string;
  } = {},
): Promise<LinkProbeResult> {
  const fetchFn = options.fetchFn ?? fetch;
  const sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const now = options.now ?? new Date();
  const timeoutMs = options.timeoutMs ?? LINK_AUDIT_POLICY.timeoutMs;
  const maxAttempts = options.maxAttempts ?? LINK_AUDIT_POLICY.maxAttempts;
  const retryDelayMs = options.retryDelayMs ?? LINK_AUDIT_POLICY.retryDelayMs;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) throw new Error("maxAttempts must be positive");

  let last: LinkProbeResult | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchFn(target.url, {
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { "user-agent": options.userAgent ?? "stats47-link-audit/2.0" },
      });
      await response.body?.cancel();
      const statusVerdict = classifyLinkStatus(response.status);
      const verdict = statusVerdict === "ok" && isVerificationStale(
        target.verifiedAt,
        now,
        options.staleAfterDays,
      ) ? "stale" : statusVerdict;
      last = { target, verdict, detail: `HTTP ${response.status}`, attempts: attempt };
    } catch (error: unknown) {
      last = {
        target,
        verdict: "timeout",
        detail: error instanceof Error ? error.message : String(error),
        attempts: attempt,
      };
    }
    if (last.verdict !== "server-err" && last.verdict !== "timeout") return last;
    if (attempt < maxAttempts) await sleep(retryDelayMs * attempt);
  }
  return last!;
}

export function isAlertVerdict(verdict: LinkVerdict): boolean {
  return verdict === "gone" || verdict === "server-err" || verdict === "timeout" || verdict === "stale";
}
