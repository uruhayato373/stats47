// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102・Base UI) の table.tsx をそのまま使う。変えたのは import 先 (相対パス) と
// Table の containerClassName / scrollRegion (サイトのアクセシビリティ契約) の追加だけ。取り直すときは同じコミットの components/ui/ から写す (packages/ui-theme/README.md)。
// lyra の cn-* 規則が別の値で上書きする素のクラス (rounded-xl・text-sm 等) は消してある (packages/ui-theme/README.md の差の一覧)。
"use client"

import * as React from "react"

import { cn } from "../../lib/cn"

function Table({
  className,
  containerClassName,
  scrollRegion = false,
  ...props
}: React.ComponentProps<"table"> & {
  /** 横スクロールを担う外側コンテナへの追加クラス */
  containerClassName?: string
  /**
   * 幅を絞って横スクロールさせる表で true にする。スクロール領域をキーボードで
   * フォーカス・スクロールできるようにし、表の aria-label を領域名に使う
   * (axe scrollable-region-focusable / WCAG 2.1.1)。
   */
  scrollRegion?: boolean
}) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        "cn-table-container relative w-full overflow-x-auto",
        scrollRegion && "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        containerClassName,
        /* lyra */ "relative w-full overflow-x-auto"
      )}
      {...(scrollRegion
        ? { role: "region", tabIndex: 0, "aria-label": props["aria-label"] ?? "表" }
        : {})}
    >
      <table
        data-slot="table"
        className={cn("cn-table w-full caption-bottom", className, /* lyra */ "w-full caption-bottom text-xs")}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("cn-table-header [&_tr]:border-b", className, /* lyra */ "[&_tr]:border-b")}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("cn-table-body [&_tr:last-child]:border-0", className, /* lyra */ "[&_tr:last-child]:border-0")}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "cn-table-footer border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className,
        /* lyra */ "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0"
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "cn-table-row border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className,
        /* lyra */ "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "cn-table-head h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className,
        /* lyra */ "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0"
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "cn-table-cell p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className,
        /* lyra */ "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0"
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("cn-table-caption mt-4 text-muted-foreground", className, /* lyra */ "text-muted-foreground mt-4 text-xs")}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
