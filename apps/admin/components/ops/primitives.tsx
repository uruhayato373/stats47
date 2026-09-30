import type { ReactNode } from "react";

import { StatusBadge } from "@/components/admin-ui";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * 管理ページ共通の表示部品 (見出し・エラー表示・未計測・鮮度)。
 * 表・数値タイル・状態バッジ・区画は shadcn ベースの components/admin-ui と layout-primitives へ移した
 * (旧 Section / Stat / Badge / Table / Td / Tr はここに無い。契約: .claude/rules/admin-ui.md)。
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
        真実源: <code className="break-all rounded bg-muted px-1">{source}</code> — 読み取り専用
      </p>
      {children}
    </header>
  );
}

/** 読み取りに失敗したセクションは、無かったことにせず理由を出す */
export function ErrorNote({ error }: { error: string }) {
  return (
    <Alert variant="destructive">
      <AlertDescription>読み取り失敗: {error}</AlertDescription>
    </Alert>
  );
}

/** 「未計測」を「0」と見分けられるようにする */
export function Unmeasured() {
  return <span className="text-console-neutral">—</span>;
}

/** 鮮度バッジ。古い数字を「現在値」と読ませないため */
export function Freshness({ iso }: { iso: string | null }) {
  if (!iso) return <StatusBadge>鮮度不明</StatusBadge>;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (Number.isNaN(days)) return <StatusBadge>{iso}</StatusBadge>;
  const tone = days <= 2 ? "good" : days <= 14 ? "neutral" : "warn";
  return (
    <StatusBadge tone={tone}>
      {iso.slice(0, 10)}
      {days > 2 ? ` (${days}日前)` : ""}
    </StatusBadge>
  );
}
