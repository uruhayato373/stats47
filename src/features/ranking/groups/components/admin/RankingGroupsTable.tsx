"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { Pencil } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/ui/table";

import { listCategoriesAction } from "@/features/category/actions";
import type { Category } from "@/features/category/types/category.types";

import type { RankingGroup } from "../../types";

interface RankingGroupsTableProps {
  groups: RankingGroup[];
}

export function RankingGroupsTable({ groups }: RankingGroupsTableProps) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  // カテゴリ一覧を取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await listCategoriesAction();
        setCategoriesList(categoriesData);
      } catch (error) {
        console.error("カテゴリ取得エラー:", error);
      }
    };

    fetchCategories();
  }, []);

  // サブカテゴリIDからサブカテゴリ名を取得するヘルパー関数
  const getSubcategoryName = (subcategoryId: string): string => {
    for (const category of categoriesList) {
      const subcategory = category.subcategories?.find(
        (sub) => sub.subcategoryKey === subcategoryId
      );
      if (subcategory) {
        return subcategory.subcategoryName;
      }
    }
    return subcategoryId; // 見つからない場合はIDをそのまま返す
  };

  // サブカテゴリIDと名前のマッピングを作成
  const subcategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categoriesList.forEach((category) => {
      category.subcategories?.forEach((sub) => {
        if (sub.subcategoryKey) {
          map.set(sub.subcategoryKey, sub.subcategoryName);
        }
      });
    });
    return map;
  }, [categoriesList]);

  // サブカテゴリでフィルタリング（いずれかのサブカテゴリに一致するグループを表示）
  const filteredGroups =
    selectedSubcategory === "all"
      ? groups
      : groups.filter((group) =>
          group.subcategoryIds.includes(selectedSubcategory)
        );

  // ユニークなサブカテゴリIDを取得（表示用に名前付き）
  const subcategories = Array.from(
    new Set(groups.flatMap((group) => group.subcategoryIds))
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
              {subcategoryMap.get(subcategoryId) || subcategoryId}
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
            <TableHead>編集</TableHead>
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
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell>
                  {group.subcategoryIds
                    .map((id) => getSubcategoryName(id))
                    .join(", ")}
                </TableCell>
                <TableCell>{group.items.length}</TableCell>
                <TableCell>
                  <Link
                    href={`/admin/dev-tools/ranking-groups/${group.groupKey}`}
                    className="inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">編集</span>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
