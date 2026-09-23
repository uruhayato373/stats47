/**
 * SNS 投稿画像の週次確認 (review-sns-images.ts) の純粋関数。I/O を持たない。
 * 正典: .claude/rules/sns-content-standards.md §5.6
 */

export type SnsPlatform = "x" | "threads" | "instagram";

export interface ReviewItem {
  /** posts.json の id (`post-<id>`) か Instagram 予約の `ig-<日付>-<content_key>`。 */
  id: string;
  platform: SnsPlatform;
  scheduledAt: string;
  domain: string;
  contentKey: string;
  caption: string;
  /** 画像の取得元 (リポジトリ相対のローカルパス、または R2 のキー)。表示順。 */
  imageSources: string[];
  /** 動画 (リール) など画像確認の対象外。理由を報告に出す。 */
  skipped?: string;
}

interface PostRecord {
  id: number;
  platform: string;
  status: string;
  scheduled_at?: string | null;
  domain?: string;
  content_key?: string;
  caption?: string | null;
  media_path?: string | null;
}

interface IgScheduleEntry {
  date: string;
  time?: string;
  type: string;
  domain: string;
  content_key: string;
  slides?: string[];
}

/** 期間内に予約・下書きがある X / Threads 投稿。Instagram は予約ファイル側を正とする (重複を避ける)。 */
export function itemsFromPosts(posts: PostRecord[], from: Date, to: Date): ReviewItem[] {
  return posts
    .filter((p) => (p.platform === "x" || p.platform === "threads") && ["scheduled", "draft"].includes(p.status))
    .filter((p) => p.scheduled_at && new Date(p.scheduled_at) >= from && new Date(p.scheduled_at) < to)
    .map((p) => ({
      id: `post-${p.id}`,
      platform: p.platform as SnsPlatform,
      scheduledAt: p.scheduled_at as string,
      domain: p.domain ?? "",
      contentKey: p.content_key ?? "",
      caption: p.caption ?? "",
      imageSources: p.media_path ? [p.media_path] : [],
    }));
}

/** Instagram の予約ファイルから期間内のエントリ。画像と本文は R2 の instagram/ 以下にある。 */
export function itemsFromIgSchedule(entries: IgScheduleEntry[], from: Date, to: Date): ReviewItem[] {
  return entries
    .filter((e) => {
      const at = new Date(`${e.date}T${e.time ?? "12:00"}:00+09:00`);
      return at >= from && at < to;
    })
    .map((e) => {
      const base = `sns/${e.domain}/${e.content_key}/instagram`;
      const item: ReviewItem = {
        id: `ig-${e.date}-${e.content_key}`,
        platform: "instagram",
        scheduledAt: `${e.date}T${e.time ?? "12:00"}:00+09:00`,
        domain: e.domain,
        contentKey: e.content_key,
        caption: "",
        imageSources: (e.slides ?? []).map((slide) => `${base}/stills/${slide}`),
      };
      if (e.type === "reels") item.skipped = "リール (動画) は画像確認の対象外";
      return item;
    });
}

export const CAPTION_LIMITS = { threads: 500, instagram: 2200 } as const;
export const IG_SLIDE_SIZE = { width: 1080, height: 1350 } as const;

export interface MechanicalFinding {
  itemId: string;
  issue: string;
}

/**
 * 決定的に判定できる問題。画像の欠落、Instagram 画像の寸法、本文の長さ (X は重み付き 280)。
 * `imageSizes` は取得できた画像の寸法、取得できなかった画像は含めない。
 */
export function mechanicalFindings(
  item: ReviewItem,
  resolved: Array<{ source: string; width?: number; height?: number; ok: boolean }>,
  xWeightedLength: (text: string) => number,
  xMax: number
): MechanicalFinding[] {
  const out: MechanicalFinding[] = [];
  if (item.skipped) return out;
  if (item.imageSources.length === 0) out.push({ itemId: item.id, issue: "画像が登録されていない" });
  for (const r of resolved) {
    if (!r.ok) out.push({ itemId: item.id, issue: `画像が見つからない: ${r.source}` });
    else if (item.platform === "instagram" && (r.width !== IG_SLIDE_SIZE.width || r.height !== IG_SLIDE_SIZE.height)) {
      out.push({ itemId: item.id, issue: `Instagram 画像の寸法が ${r.width}x${r.height} (1080x1350 でない): ${r.source}` });
    }
  }
  if (item.platform === "x" && xWeightedLength(item.caption) > xMax) {
    out.push({ itemId: item.id, issue: `X の本文が重み付き ${xWeightedLength(item.caption)} (上限 ${xMax})` });
  }
  if (item.platform === "threads" && [...item.caption].length > CAPTION_LIMITS.threads) {
    out.push({ itemId: item.id, issue: `Threads の本文が ${[...item.caption].length} 字 (上限 ${CAPTION_LIMITS.threads})` });
  }
  if (item.platform === "instagram" && [...item.caption].length > CAPTION_LIMITS.instagram) {
    out.push({ itemId: item.id, issue: `Instagram の本文が ${[...item.caption].length} 字 (上限 ${CAPTION_LIMITS.instagram})` });
  }
  return out;
}

export type Severity = "high" | "medium" | "low";

export interface AgentFinding {
  itemId: string;
  severity: Severity;
  issue: string;
  suggestion: string;
}

/** agent の出力を入力と突き合わせる。見せていない投稿を指す指摘や形の崩れた指摘は採用しない。 */
export function validateAgentReview(
  raw: unknown,
  reviewedIds: Set<string>
): { status: string; summary: string; findings: AgentFinding[]; rejected: string[] } {
  const r = raw as { status?: string; summary?: string; findings?: AgentFinding[] } | null;
  if (!r || !["reviewed", "no-issues", "blocked"].includes(String(r.status))) throw new Error("review output has no valid status");
  const findings: AgentFinding[] = [];
  const rejected: string[] = [];
  for (const f of Array.isArray(r.findings) ? r.findings : []) {
    if (!reviewedIds.has(f?.itemId)) rejected.push(`見せていない投稿を指す指摘: ${f?.itemId}`);
    else if (!["high", "medium", "low"].includes(String(f.severity)) || !f.issue) rejected.push(`形の崩れた指摘: ${f.itemId}`);
    else findings.push(f);
  }
  return { status: String(r.status), summary: String(r.summary ?? ""), findings, rejected };
}

const LABEL: Record<Severity, string> = { high: "🔴 高", medium: "🟡 中", low: "🟢 低" };

/** 通知 Issue の本文。機械検出も agent の指摘も無く agent も実行できていれば null (Issue を閉じる)。 */
export function buildSnsReport(params: {
  date: string;
  from: string;
  to: string;
  items: ReviewItem[];
  mechanical: MechanicalFinding[];
  agent: { findings: AgentFinding[]; summary: string } | null;
  agentError: string | null;
}): string | null {
  const agentFindings = params.agent?.findings ?? [];
  if (params.mechanical.length === 0 && agentFindings.length === 0 && !params.agentError) return null;
  const byId = new Map(params.items.map((i) => [i.id, i]));
  const label = (id: string) => {
    const i = byId.get(id);
    return i ? `${i.platform} ${i.scheduledAt.slice(0, 16).replace("T", " ")} \`${i.contentKey}\`` : id;
  };
  const lines: string[] = [];
  lines.push(`## SNS 投稿画像の週次確認 (${params.date})`);
  lines.push("");
  lines.push(`対象: ${params.from} 〜 ${params.to} に予約・下書きがある投稿 ${params.items.length} 件。直すものは予約を差し替えるか、バックログへカードにする。`);
  lines.push("");
  lines.push("### 機械検査");
  lines.push("");
  if (params.mechanical.length === 0) lines.push("なし");
  for (const m of params.mechanical) lines.push(`- ${label(m.itemId)}: ${m.issue}`);
  lines.push("");
  lines.push("### 画像を見た agent の指摘");
  lines.push("");
  if (params.agentError) lines.push(`agent の確認は実行できなかった: ${params.agentError}`);
  else if (agentFindings.length === 0) lines.push(`なし (${params.agent?.summary ?? ""})`);
  for (const f of [...agentFindings].sort((a, b) => ["high", "medium", "low"].indexOf(a.severity) - ["high", "medium", "low"].indexOf(b.severity))) {
    lines.push(`- ${LABEL[f.severity]} ${label(f.itemId)}: ${f.issue}`);
    if (f.suggestion) lines.push(`  - 案: ${f.suggestion}`);
  }
  const skipped = params.items.filter((i) => i.skipped);
  if (skipped.length > 0) {
    lines.push("");
    lines.push(`対象外 ${skipped.length} 件: ${skipped.map((i) => `${label(i.id)} (${i.skipped})`).join(" / ")}`);
  }
  lines.push("");
  lines.push("正典: `.claude/rules/sns-content-standards.md` §5.6");
  return lines.join("\n");
}
