import type { ReactNode } from "react";

/**
 * 管理ページ共通の表示部品。
 * 色は console-* トークンのみ使う (Tailwind の *-400 系はライト地で読めない)。
 */

export function PageHeading({
  title,
  source,
  children,
}: {
  title: string;
  source: string;
  children?: ReactNode;
}) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-bold text-console-fg">{title}</h1>
      <p className="text-sm text-console-muted">
        真実源: <code className="break-all rounded bg-console-card px-1">{source}</code> — 読み取り専用
      </p>
      {children}
    </header>
  );
}

export function Section({
  id,
  title,
  count,
  children,
}: {
  id?: string;
  title: string;
  count?: number | string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 space-y-2">
      <h2 className="text-sm font-bold text-console-fg">
        {title}
        {count !== undefined ? (
          <span className="ml-2 font-normal text-console-muted">({count})</span>
        ) : null}
      </h2>
      {children}
    </section>
  );
}

/** 読み取りに失敗したセクションは、無かったことにせず理由を出す */
export function ErrorNote({ error }: { error: string }) {
  return (
    <p className="rounded-md border border-console-bad/40 bg-console-bad/10 px-3 py-2 text-sm text-console-bad">
      読み取り失敗: {error}
    </p>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
}) {
  const toneClass = {
    neutral: "text-console-fg",
    good: "text-console-good",
    warn: "text-console-warn",
    bad: "text-console-bad",
    info: "text-console-info",
  }[tone];
  return (
    <div className="rounded-md border border-console-border bg-console-card p-3">
      <div className="text-[11px] text-console-muted">{label}</div>
      <div className={`mt-1 text-xl font-bold ${toneClass}`}>{value}</div>
      {sub ? <div className="mt-1 text-[11px] text-console-muted">{sub}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
}) {
  const cls = {
    neutral: "border-console-border text-console-muted",
    good: "border-console-good text-console-good",
    warn: "border-console-warn text-console-warn",
    bad: "border-console-bad text-console-bad",
    info: "border-console-info text-console-info",
  }[tone];
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[11px] ${cls}`}>{children}</span>
  );
}

/** 「未計測」を「0」と見分けられるようにする */
export function Unmeasured() {
  return <span className="text-console-neutral">—</span>;
}

export function Table({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-console-border bg-console-card">
      <table className="w-full text-[13px]">
        <thead className="border-b border-console-border text-left text-[11px] text-console-muted">
          <tr>
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-2 py-1.5 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({
  children,
  nowrap,
  muted,
}: {
  children: ReactNode;
  nowrap?: boolean;
  muted?: boolean;
}) {
  return (
    <td
      className={[
        "px-2 py-1.5 align-top",
        nowrap ? "whitespace-nowrap" : "",
        muted ? "text-console-muted" : "text-console-fg",
      ].join(" ")}
    >
      {children}
    </td>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="border-b border-console-border/50">{children}</tr>;
}

/** 鮮度バッジ。古い数字を「現在値」と読ませないため */
export function Freshness({ iso }: { iso: string | null }) {
  if (!iso) return <Badge>鮮度不明</Badge>;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (Number.isNaN(days)) return <Badge>{iso}</Badge>;
  const tone = days <= 2 ? "good" : days <= 14 ? "neutral" : "warn";
  return (
    <Badge tone={tone}>
      {iso.slice(0, 10)}
      {days > 2 ? ` (${days}日前)` : ""}
    </Badge>
  );
}
