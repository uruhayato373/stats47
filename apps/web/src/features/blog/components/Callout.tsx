import type { ReactNode } from "react";

import { CircleAlert, Info, Lightbulb, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";

import { CALLOUT_DEFINITIONS, type CalloutType } from "./callout-config";

const CALLOUT_ICONS: Record<CalloutType, LucideIcon> = {
    NOTE: Info,
    TIP: Lightbulb,
    IMPORTANT: CircleAlert,
    WARNING: TriangleAlert,
    CAUTION: OctagonAlert,
};

/**
 * 記事本文の callout。アイコン + 日本語ラベルの 1 行と本文だけで組み、余白を最小にする。
 *
 * - 角は `rounded-content` (本文の中の部品の役割トークン)。レイアウトのカード外枠 (`--card-radius`) とは別。
 * - 種類は地の色・アイコン・ラベルの 3 つで伝える (色やアイコンだけに頼らない)。左の色バーは使わない。
 * - 本文段落の余白 (`my-4` / `p+p` の `mt-6`) は callout の中では打ち消す。外側の余白は自分だけが持つ。
 */
export function Callout({ type, children }: { type: CalloutType; children: ReactNode }) {
    const { label, surfaceClass, accentClass } = CALLOUT_DEFINITIONS[type];
    const Icon = CALLOUT_ICONS[type];
    return (
        <aside
            aria-label={label}
            className={`my-6 rounded-content px-4 py-3 text-[15px] leading-[1.8] text-foreground ${surfaceClass} [&>div>ol]:my-1 [&>div>p+p]:mt-2 [&>div>p]:my-0 [&>div>p]:leading-[1.8] [&>div>ul]:my-1`}
        >
            {/* 段落ではないので <p> にしない (記事本文の段落余白が効いてしまう) */}
            <div className={`mb-1 flex items-center gap-1.5 text-xs font-bold leading-5 ${accentClass}`}>
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {label}
            </div>
            <div>{children}</div>
        </aside>
    );
}
