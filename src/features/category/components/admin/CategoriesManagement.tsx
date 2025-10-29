"use client";

import { useState } from "react";

import { Edit2, Trash2 } from "lucide-react";

import { Button } from "@/components/atoms/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/atoms/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/atoms/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/atoms/ui/tabs";

import type { Category, Subcategory } from "@/features/category/repositories/category-repository";

interface CategoriesManagementProps {
  categories: Category[];
}

export function CategoriesManagement({ categories }: CategoriesManagementProps) {
  const [activeTab, setActiveTab] = useState("categories");

  const handleEditCategory = (category: Category) => {
    // TODO: 編集モーダルを開く
    console.log("Edit category:", category);
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    // TODO: 編集モーダルを開く
    console.log("Edit subcategory:", subcategory);
  };

  const handleDeleteSubcategory = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/subcategories/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error deleting subcategory:", error);
    }
  };

  // サブカテゴリをフラット化
  const allSubcategories = categories.flatMap((category) =>
    (category.subcategories || []).map((sub) => ({
      ...sub,
      categoryName: category.name,
    }))
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList>
        <TabsTrigger value="categories">カテゴリ</TabsTrigger>
        <TabsTrigger value="subcategories">サブカテゴリ</TabsTrigger>
      </TabsList>

      <TabsContent value="categories">
        <Card>
          <CardHeader>
            <CardTitle>カテゴリ一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>キー</TableHead>
                  <TableHead>名前</TableHead>
                  <TableHead>アイコン</TableHead>
                  <TableHead>色</TableHead>
                  <TableHead>表示順序</TableHead>
                  <TableHead>サブカテゴリ数</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-mono text-sm">
                      {category.categoryKey}
                    </TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.icon || "-"}</TableCell>
                    <TableCell>{category.color || "-"}</TableCell>
                    <TableCell>{category.displayOrder}</TableCell>
                    <TableCell>{category.subcategories?.length || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`「${category.name}」を削除してもよろしいですか？`)) {
                              handleDeleteCategory(category.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="subcategories">
        <Card>
          <CardHeader>
            <CardTitle>サブカテゴリ一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>キー</TableHead>
                  <TableHead>名前</TableHead>
                  <TableHead>カテゴリ</TableHead>
                  <TableHead>href</TableHead>
                  <TableHead>表示順序</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSubcategories.map((subcategory) => (
                  <TableRow key={subcategory.id}>
                    <TableCell className="font-mono text-sm">
                      {subcategory.subcategoryKey}
                    </TableCell>
                    <TableCell>{subcategory.name}</TableCell>
                    <TableCell>{subcategory.categoryName}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {subcategory.href || "-"}
                    </TableCell>
                    <TableCell>{subcategory.displayOrder}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSubcategory(subcategory)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`「${subcategory.name}」を削除してもよろしいですか？`)) {
                              handleDeleteSubcategory(subcategory.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

