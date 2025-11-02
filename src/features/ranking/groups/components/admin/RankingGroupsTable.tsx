/**
 * Ranking Groups Domain - Admin Components
 *
 * ランキンググループ管理画面用のコンポーネントを提供。
 */

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
  /** 表示するランキンググループの配列 */
  groups: RankingGroup[];
}

/**
 * ランキンググループ一覧テーブル
 *
 * ランキンググループを一覧表示し、サブカテゴリでフィルタリングできる。
 * グループ名、サブカテゴリ、項目数、編集リンクを表示する。
 *
 * @param props - コンポーネントの props
 * @param props.groups - 表示するランキンググループの配列
 *
 * @example
 * ```tsx
 * const groups = await repository.getAllRankingGroups();
 * <RankingGroupsTable groups={groups} />
 * ```
 */
export function RankingGroupsTable({ groups }: RankingGroupsTableProps) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

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

  /**
   * サブカテゴリIDからサブカテゴリ名を取得
   *
   * @param subcategoryId - サブカテゴリID
   * @returns サブカテゴリ名。見つからない場合はIDをそのまま返す
   */
  const getSubcategoryName = (subcategoryId: string): string => {
    for (const category of categoriesList) {
      const subcategory = category.subcategories?.find(
        (sub) => sub.subcategoryKey === subcategoryId
      );
      if (subcategory) {
        return subcategory.subcategoryName;
      }
    }
    return subcategoryId;
  };

  /**
   * サブカテゴリIDと名前のマッピング
   *
   * カテゴリ一覧からサブカテゴリIDと名前の対応関係を作成し、
   * フィルター選択肢の表示に使用する。
   */
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

  /**
   * フィルタリングされたグループ一覧
   *
   * 選択されたサブカテゴリに一致するグループのみを表示する。
   * "all"が選択されている場合はすべてのグループを表示。
   */
  const filteredGroups =
    selectedSubcategory === "all"
      ? groups
      : groups.filter((group) =>
          group.subcategoryIds.includes(selectedSubcategory)
        );

  /**
   * ユニークなサブカテゴリIDの配列
   *
   * フィルター選択肢として使用するため、全グループから
   * サブカテゴリIDを抽出し、重複を除去した配列。
   */
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
