"use client";

import { TableCell, TableRow } from "../../../atoms/ui/table";

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
            <TableRow>
                <TableCell
                    colSpan={colSpan}
                    className="text-center text-muted-foreground"
                >
                    {message}
                </TableCell>
            </TableRow>
        );
    }

    return (
        <div className="py-8 text-center text-[13px] text-muted-foreground">
            {message}
        </div>
    );
}
