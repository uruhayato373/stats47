"use client";

import Link from "next/link";

import { ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/atoms/ui/badge";
import { DataTable } from "@/components/molecules/data-table/data-table";

import type { Article } from "@/features/blog/types/article.types";

/**
 * ブログ記事テーブルのカラム定義
 */
const columns: ColumnDef<Article>[] = [
  {
    accessorKey: "frontmatter.title",
    header: "タイトル",
    cell: ({ row }) => {
      const article = row.original;
      const href = `/blog/${article.actualCategory}/${article.slug}/${article.time}`;
      return (
        <div className="max-w-md">
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline flex items-center gap-2"
          >
            {article.frontmatter.title}
            <ExternalLink className="size-3 opacity-50" />
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "slug",
    header: "スラッグ",
    cell: ({ row }) => {
      return <div className="font-mono text-sm">{row.original.slug}</div>;
    },
  },
  {
    accessorKey: "time",
    header: "時間（年度など）",
    cell: ({ row }) => {
      return <div className="text-sm">{row.original.time || "-"}</div>;
    },
  },
];

interface BlogArticlesTableProps {
  articles: Article[];
}

/**
 * ブログ記事テーブルコンポーネント
 */
export function BlogArticlesTable({ articles }: BlogArticlesTableProps) {
  return <DataTable columns={columns} data={articles} showIndex={false} />;
}

