/**
 * 記事本文の callout (`> [!NOTE]` 等) の種類ごとの定義。ラベル・色・優先度の単一定義。
 *
 * 表示 (`Callout.tsx`) と、連続 callout を通常本文へ戻す前処理 (`md-preprocessor.ts`) の両方がここを読む。
 * 表示ラベルと本文へ戻したときのラベルを別々に持つと、同じ注記が画面によって別の名前で出る。
 */

export const CALLOUT_TYPES = ["NOTE", "TIP", "WARNING", "IMPORTANT", "CAUTION"] as const;
export type CalloutType = (typeof CALLOUT_TYPES)[number];

interface CalloutDefinition {
    /** 見出し行に出す日本語ラベル (英語の NOTE / TIP は読者に意味が伝わらないので出さない) */
    label: string;
    /** 地の色 */
    surfaceClass: string;
    /** アイコンとラベルの色 */
    accentClass: string;
    /** 連続したとき、どれをカードに残すか (大きいほど残る) */
    priority: number;
}

export const CALLOUT_DEFINITIONS: Record<CalloutType, CalloutDefinition> = {
    TIP: { label: "読み解きのポイント", surfaceClass: "bg-positive-soft", accentClass: "text-positive", priority: 1 },
    NOTE: { label: "補足", surfaceClass: "bg-info-soft", accentClass: "text-info", priority: 2 },
    IMPORTANT: { label: "重要", surfaceClass: "bg-primary/10", accentClass: "text-primary", priority: 3 },
    WARNING: { label: "注意", surfaceClass: "bg-warning-soft", accentClass: "text-warning", priority: 4 },
    CAUTION: { label: "要注意", surfaceClass: "bg-negative-soft", accentClass: "text-negative", priority: 5 },
};

export function toCalloutType(value: unknown): CalloutType | null {
    const upper = typeof value === "string" ? value.toUpperCase() : "";
    return (CALLOUT_TYPES as readonly string[]).includes(upper) ? (upper as CalloutType) : null;
}
