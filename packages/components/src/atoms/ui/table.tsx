// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102・Base UI) の table.tsx をそのまま使う。変えたのは import 先 (相対パス) と
// Table の containerClassName / scrollRegion (サイトのアクセシビリティ契約) の追加だけ。正の写し: .claude/config/shadcn-reference/。
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
        containerClassName
      )}
      {...(scrollRegion
        ? { role: "region", tabIndex: 0, "aria-label": props["aria-label"] ?? "表" }
        : {})}
    >
      <table
        data-slot="table"
        className={cn("cn-table w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("cn-table-header [&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("cn-table-body [&_tr:last-child]:border-0", className)}
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
        className
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
        className
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
        className
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
        className
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
      className={cn("cn-table-caption mt-4 text-sm text-muted-foreground", className)}
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
