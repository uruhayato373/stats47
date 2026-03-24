"use client";

interface DataTableEmptyProps {
    message: string;
    colSpan?: number;
}

/**
 * データが空の場合の表示コンポーネント
 */
export function DataTableEmpty({ message, colSpan }: DataTableEmptyProps) {
    if (colSpan !== undefined) {
        return (
            <tr className="border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <td
                    colSpan={colSpan}
                    className="h-10 px-1 py-1 text-xs align-middle [&:has([role=checkbox])]:pr-0 text-center"
                >
                    {message}
                </td>
            </tr>
        );
    }

    return (
        <div className="text-center py-8 text-muted-foreground">{message}</div>
    );
}
