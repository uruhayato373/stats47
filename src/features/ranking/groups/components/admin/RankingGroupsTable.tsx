"use client";

import { useState } from "react";

import Link from "next/link";

import { MoreVertical } from "lucide-react";

import { Button } from "@/components/atoms/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/ui/table";

import type { RankingGroup } from "../../types";

interface RankingGroupsTableProps {
  groups: RankingGroup[];
}

export function RankingGroupsTable({ groups }: RankingGroupsTableProps) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  // サブカテゴリでフィルタリング
  const filteredGroups =
    selectedSubcategory === "all"
      ? groups
      : groups.filter((group) => group.subcategoryId === selectedSubcategory);

  // ユニークなサブカテゴリIDを取得
  const subcategories = Array.from(
    new Set(groups.map((group) => group.subcategoryId))
  );

  return (
    <div className="space-y-4">
      {/* フィルター */}
      <div className="flex items-center gap-4">
        <label htmlFor="subcategory-filter" className="text-sm font-medium">
          サブカテゴリでフィルタ:
        </label>
        <select
          id="subcategory-filter"
          value={selectedSubcategory}
          onChange={(e) => setSelectedSubcategory(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="all">全て</option>
          {subcategories.map((subcategoryId) => (
            <option key={subcategoryId} value={subcategoryId}>
              {subcategoryId}
            </option>
          ))}
        </select>
      </div>

      {/* グループテーブル */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>グループ名</TableHead>
            <TableHead>サブカテゴリ</TableHead>
            <TableHead>項目数</TableHead>
            <TableHead>アクション</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredGroups.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                グループがありません
              </TableCell>
            </TableRow>
          ) : (
            filteredGroups.map((group) => (
              <TableRow key={group.groupKey}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {group.icon && <span>{group.icon}</span>}
                    <span>{group.name}</span>
                  </div>
                </TableCell>
                <TableCell>{group.subcategoryId}</TableCell>
                <TableCell>{group.items.length}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">アクションメニュー</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/admin/dev-tools/ranking-groups/${group.groupKey}`}
                        >
                          編集
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
