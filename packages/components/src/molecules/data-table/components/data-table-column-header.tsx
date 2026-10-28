"use client";

import * as React from "react";

import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, EyeOff } from "lucide-react";

import { Button } from "../../../atoms/ui/button";
import { cn } from "../../../lib/cn";

interface DataTableColumnHeaderProps<TData, TValue>
    extends React.HTMLAttributes<HTMLDivElement> {
    column: Column<TData, TValue>;
    title: string;
}

type DropdownMenuModule = typeof import("../../../atoms/ui/dropdown-menu");

const TRIGGER_CLASS_NAME = "-ml-3 h-8 data-open:bg-accent";

/**
 * DropdownMenu (Base UI Menu) は初回の pointerenter / focus で読み始め、押されたら本物に置き換えて開く
 * (配信サイズ策 D)。閉じている間は同じ Button を同じクラス・aria で描き、表の初回配信にメニューの JS を載せない。
 * 置き換えは押したときだけにする (hover で置き換えると、押す途中でボタンの要素が入れ替わり押下が失われる)。
 */
let dropdownMenuRequest: Promise<void> | null = null;
let loadedDropdownMenu: DropdownMenuModule | null = null;
const dropdownMenuListeners = new Set<() => void>();

function loadDropdownMenu(): void {
    dropdownMenuRequest ??= import("../../../atoms/ui/dropdown-menu").then((loaded) => {
        loadedDropdownMenu = loaded;
        dropdownMenuListeners.forEach((listener) => listener());
    });
}

function subscribeDropdownMenu(listener: () => void) {
    dropdownMenuListeners.add(listener);
    return () => {
        dropdownMenuListeners.delete(listener);
    };
}

interface SortMenuProps {
    menu: DropdownMenuModule;
    label: React.ReactNode;
    onSort: (desc: boolean) => void;
    onHide: () => void;
}

/** 押されたあとに描く本物のメニュー。押した操作の続きとして開いた状態で始める。 */
function SortMenu({ menu, label, onSort, onHide }: SortMenuProps) {
    const {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
    } = menu;
    return (
        <DropdownMenu defaultOpen>
            <DropdownMenuTrigger
                render={<Button variant="ghost" size="sm" className={TRIGGER_CLASS_NAME} />}
            >
                {label}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => onSort(false)}>
                    <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                    昇順
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSort(true)}>
                    <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                    降順
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onHide}>
                    <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                    非表示
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function DataTableColumnHeader<TData, TValue>({
    column,
    title,
    className,
}: DataTableColumnHeaderProps<TData, TValue>) {
    const [activated, setActivated] = React.useState(false);
    const menu = React.useSyncExternalStore(
        subscribeDropdownMenu,
        () => loadedDropdownMenu,
        () => null,
    );

    if (!column.getCanSort()) {
        return <div className={cn(className)}>{title}</div>;
    }

    const sorted = column.getIsSorted();
    const label = (
        <>
            <span>{title}</span>
            {sorted === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
            ) : sorted === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
        </>
    );

    return (
        <div className={cn("flex items-center space-x-2", className)}>
            {menu && activated ? (
                <SortMenu
                    menu={menu}
                    label={label}
                    onSort={(desc) => column.toggleSorting(desc)}
                    onHide={() => column.toggleVisibility(false)}
                />
            ) : (
                <Button
                    variant="ghost"
                    size="sm"
                    className={TRIGGER_CLASS_NAME}
                    aria-haspopup="menu"
                    aria-expanded={false}
                    onPointerEnter={loadDropdownMenu}
                    onFocus={loadDropdownMenu}
                    onClick={() => {
                        // 読み込み中に押されたら、読み終わった時点で開いた状態で描く
                        setActivated(true);
                        loadDropdownMenu();
                    }}
                >
                    {label}
                </Button>
            )}
        </div>
    );
}
