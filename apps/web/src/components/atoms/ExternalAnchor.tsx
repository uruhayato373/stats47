import type { AnchorHTMLAttributes } from "react";

type ExternalAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "target">;

/**
 * 外部サイトへのリンク。サイト全体の規約として必ず新しいタブで開く。
 *
 * - `rel` は `noopener noreferrer` を常に含める (`sponsored` など用途別の値は追加で渡す)
 * - サイト内のページは `next/link` の `Link` を使い、この部品は使わない
 * - 手書きの `<a href="https://…">` は契約テスト (`external-link-contract.test.ts`) が止める
 *
 * 正典: `docs/01_技術設計/04_デザインシステム.md`「外部リンク」
 */
export function ExternalAnchor({ rel, ...props }: ExternalAnchorProps) {
  const extra = [...new Set((rel ?? "").split(/\s+/).filter((v) => v && v !== "noopener" && v !== "noreferrer"))].join(" ");
  // 静的アクセシビリティ検査 (check-accessibility-static の BLANK_REL_MISSING) が読めるよう、
  // noopener noreferrer は組み立てずに文字列リテラルで書く
  return <a {...props} target="_blank" rel={extra ? `noopener noreferrer ${extra}` : "noopener noreferrer"} />;
}
