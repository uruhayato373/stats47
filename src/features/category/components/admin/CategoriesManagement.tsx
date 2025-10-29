"use client";

import { useState } from "react";

import * as LucideReact from "lucide-react";
import { AlertCircle, Edit2, Loader2 } from "lucide-react";
import useSWR from "swr";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/atoms/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/atoms/ui/alert";
import { Button } from "@/components/atoms/ui/button";
import {
    Card,
    CardContent,
    CardTitle,
} from "@/components/atoms/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/atoms/ui/dialog";
import { Input } from "@/components/atoms/ui/input";
import { Label } from "@/components/atoms/ui/label";

import type { Category, Subcategory } from "@/features/category/types/category.types";

interface EditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  subcategory?: Subcategory;
  categoryName?: string;
  onSave: () => void;
  onDelete: () => void;
}

function EditDialog({
  open,
  onOpenChange,
  category,
  subcategory,
  categoryName,
  onSave,
  onDelete,
}: EditDialogProps) {
  const isCategory = !!category;
  const item = isCategory ? category : subcategory;

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isCategory ? "カテゴリ編集" : "サブカテゴリ編集"}
          </DialogTitle>
          <DialogDescription>
            {isCategory
              ? `カテゴリ「${item.name}」を編集します`
              : `サブカテゴリ「${item.name}」を編集します`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">名前</Label>
            <Input id="name" defaultValue={item.name} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="key">
              {isCategory ? "カテゴリキー" : "サブカテゴリキー"}
            </Label>
            <Input
              id="key"
              defaultValue={
                isCategory ? category.categoryKey : subcategory?.subcategoryKey || ""
              }
              className="font-mono"
            />
          </div>

          {isCategory && (
            <div className="grid gap-2">
              <Label htmlFor="icon">アイコン</Label>
              <Input
                id="icon"
                defaultValue={category.icon || ""}
                placeholder="Users, MapPin, etc."
              />
            </div>
          )}


          {!isCategory && categoryName && (
            <div className="grid gap-2">
              <Label>カテゴリ</Label>
              <Input defaultValue={categoryName} disabled />
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex w-full justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (confirm("削除してもよろしいですか？")) {
                  onDelete();
                  onOpenChange(false);
                }
              }}
            >
              削除
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button type="button" onClick={onSave}>
                保存
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * カテゴリデータ取得用のフェッチャー関数
 */
async function fetchCategories(): Promise<Category[]> {
  const response = await fetch("/api/admin/categories");
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  const data = (await response.json()) as { categories: Category[] };
  return data.categories;
}

export function CategoriesManagement() {
  // useSWRでデータ取得
  const {
    data: categories,
    error,
    isLoading,
    mutate,
  } = useSWR<Category[]>("/api/admin/categories", fetchCategories, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 300000, // 5分間キャッシュ
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  });

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<{
    subcategory: Subcategory;
    categoryName: string;
  } | null>(null);


  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    
    try {
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryKey: editingCategory.categoryKey,
          name: editingCategory.name,
          icon: editingCategory.icon,
          displayOrder: editingCategory.displayOrder,
        }),
      });
      
      if (response.ok) {
        setEditingCategory(null);
        await mutate(); // データ再取得
      }
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleDeleteCategory = async () => {
    if (!editingCategory) return;
    try {
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setEditingCategory(null);
        await mutate(); // データ再取得
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleEditSubcategory = (
    subcategory: Subcategory,
    categoryName: string
  ) => {
    setEditingSubcategory({ subcategory, categoryName });
  };

  const handleSaveSubcategory = async () => {
    if (!editingSubcategory) return;
    
    try {
      const response = await fetch(
        `/api/admin/subcategories/${editingSubcategory.subcategory.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subcategoryKey: editingSubcategory.subcategory.subcategoryKey,
            name: editingSubcategory.subcategory.name,
            categoryId: editingSubcategory.subcategory.categoryId,
            displayOrder: editingSubcategory.subcategory.displayOrder,
          }),
        }
      );
      
      if (response.ok) {
        setEditingSubcategory(null);
        await mutate(); // データ再取得
      }
    } catch (error) {
      console.error("Error saving subcategory:", error);
    }
  };

  const handleDeleteSubcategory = async () => {
    if (!editingSubcategory) return;
    try {
      const response = await fetch(
        `/api/admin/subcategories/${editingSubcategory.subcategory.id}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setEditingSubcategory(null);
        await mutate(); // データ再取得
      }
    } catch (error) {
      console.error("Error deleting subcategory:", error);
    }
  };

  // アイコンコンポーネントの取得
  const getIconComponent = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (LucideReact as unknown as Record<string, React.ComponentType<{
      className?: string;
    }>>)[iconName];
    return IconComponent || null;
  };

  // ローディング状態
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">読み込み中...</span>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>エラー</AlertTitle>
        <AlertDescription>
          カテゴリデータの取得に失敗しました。ページをリロードしてください。
        </AlertDescription>
      </Alert>
    );
  }

  // データがない場合
  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        カテゴリがありません
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Accordion type="multiple" className="w-full space-y-2">
          {categories.map((category) => {
            const IconComponent = getIconComponent(category.icon);

            return (
              <AccordionItem 
                key={category.id} 
                value={`category-${category.id}`}
                className="border-gray-300"
              >
                <Card>
                  <div className="flex items-center gap-2 px-4">
                    <AccordionTrigger className="flex-1 hover:no-underline">
                      <div className="flex flex-1 items-center gap-3">
                        {IconComponent && (
                          <IconComponent className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="text-left">
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <p className="text-sm font-mono text-muted-foreground">
                            {category.categoryKey}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCategory(category)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <AccordionContent>
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="grid grid-cols-3 gap-3">
                        {category.subcategories && category.subcategories.length > 0 ? (
                          category.subcategories.map((subcategory) => (
                            <div
                              key={subcategory.id}
                              className="group relative flex items-center rounded-lg border border-gray-300 p-3 hover:bg-accent"
                            >
                              <span className="text-sm">{subcategory.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={() => handleEditSubcategory(subcategory, category.name)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="col-span-3 text-center text-sm text-muted-foreground py-4">
                            サブカテゴリがありません
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* カテゴリ編集ダイアログ */}
      <EditDialog
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        category={editingCategory || undefined}
        onSave={handleSaveCategory}
        onDelete={handleDeleteCategory}
      />

      {/* サブカテゴリ編集ダイアログ */}
      <EditDialog
        open={!!editingSubcategory}
        onOpenChange={(open) => !open && setEditingSubcategory(null)}
        subcategory={editingSubcategory?.subcategory}
        categoryName={editingSubcategory?.categoryName}
        onSave={handleSaveSubcategory}
        onDelete={handleDeleteSubcategory}
      />
    </>
  );
}
