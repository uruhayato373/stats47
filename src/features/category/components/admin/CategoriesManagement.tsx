"use client";

import React, { useState } from "react";

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
  onSave: (formData: {
    categoryKey?: string;
    categoryName?: string;
    icon?: string;
    displayOrder?: number;
    subcategoryKey?: string;
    subcategoryName?: string;
  }) => void;
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
  
  // フォーム状態管理
  const [formData, setFormData] = useState<{
    categoryKey: string;
    categoryName: string;
    icon: string;
    displayOrder: string;
    subcategoryKey: string;
    subcategoryName: string;
  }>(() => {
    if (isCategory && category) {
      return {
        categoryKey: category.categoryKey,
        categoryName: category.categoryName,
        icon: category.icon || "",
        displayOrder: category.displayOrder.toString(),
        subcategoryKey: "",
        subcategoryName: "",
      };
    } else if (subcategory) {
      return {
        categoryKey: subcategory.categoryKey,
        categoryName: "",
        icon: "",
        displayOrder: subcategory.displayOrder.toString(),
        subcategoryKey: subcategory.subcategoryKey,
        subcategoryName: subcategory.subcategoryName,
      };
    }
    return {
      categoryKey: "",
      categoryName: "",
      icon: "",
      displayOrder: "0",
      subcategoryKey: "",
      subcategoryName: "",
    };
  });

  // カテゴリまたはサブカテゴリが変更されたときにフォームをリセット
  React.useEffect(() => {
    if (isCategory && category) {
      setFormData({
        categoryKey: category.categoryKey,
        categoryName: category.categoryName,
        icon: category.icon || "",
        displayOrder: category.displayOrder.toString(),
        subcategoryKey: "",
        subcategoryName: "",
      });
    } else if (subcategory) {
      setFormData({
        categoryKey: subcategory.categoryKey,
        categoryName: "",
        icon: "",
        displayOrder: subcategory.displayOrder.toString(),
        subcategoryKey: subcategory.subcategoryKey,
        subcategoryName: subcategory.subcategoryName,
      });
    }
  }, [category, subcategory, isCategory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isCategory ? "カテゴリ編集" : "サブカテゴリ編集"}
          </DialogTitle>
          <DialogDescription>
            {isCategory
              ? `カテゴリ「${formData.categoryName}」を編集します`
              : `サブカテゴリ「${formData.subcategoryName}」を編集します`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">名前</Label>
            <Input
              id="name"
              value={isCategory ? formData.categoryName : formData.subcategoryName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  ...(isCategory
                    ? { categoryName: e.target.value }
                    : { subcategoryName: e.target.value }),
                }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="key">
              {isCategory ? "カテゴリキー" : "サブカテゴリキー"}
            </Label>
            <Input
              id="key"
              value={isCategory ? formData.categoryKey : formData.subcategoryKey}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  ...(isCategory
                    ? { categoryKey: e.target.value }
                    : { subcategoryKey: e.target.value }),
                }))
              }
              className="font-mono"
            />
          </div>

          {isCategory && (
            <div className="grid gap-2">
              <Label htmlFor="icon">アイコン</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, icon: e.target.value }))
                }
                placeholder="Users, MapPin, etc."
              />
            </div>
          )}

          {!isCategory && categoryName && (
            <div className="grid gap-2">
              <Label htmlFor="categoryKey">カテゴリキー</Label>
              <Input
                id="categoryKey"
                value={formData.categoryKey}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, categoryKey: e.target.value }))
                }
                className="font-mono"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="displayOrder">表示順序</Label>
            <Input
              id="displayOrder"
              type="number"
              value={formData.displayOrder}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, displayOrder: e.target.value }))
              }
            />
          </div>
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
              <Button
                type="button"
                onClick={() => {
                  const submitData = isCategory
                    ? {
                        categoryKey: formData.categoryKey,
                        categoryName: formData.categoryName,
                        icon: formData.icon || undefined,
                        displayOrder: parseInt(formData.displayOrder, 10),
                      }
                    : {
                        subcategoryKey: formData.subcategoryKey,
                        subcategoryName: formData.subcategoryName,
                        categoryKey: formData.categoryKey,
                        displayOrder: parseInt(formData.displayOrder, 10),
                      };
                  onSave(submitData);
                }}
              >
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


  const handleSaveCategory = async (formData: {
    categoryKey?: string;
    categoryName?: string;
    icon?: string;
    displayOrder?: number;
  }) => {
    if (!editingCategory) return;
    
    try {
      const response = await fetch(`/api/admin/categories/${editingCategory.categoryKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      const response = await fetch(`/api/admin/categories/${editingCategory.categoryKey}`, {
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

  const handleSaveSubcategory = async (formData: {
    subcategoryKey?: string;
    subcategoryName?: string;
    categoryKey?: string;
    displayOrder?: number;
  }) => {
    if (!editingSubcategory) return;
    
    try {
      const response = await fetch(
        `/api/admin/subcategories/${editingSubcategory.subcategory.subcategoryKey}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
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
        `/api/admin/subcategories/${editingSubcategory.subcategory.subcategoryKey}`,
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
                key={category.categoryKey} 
                value={`category-${category.categoryKey}`}
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
                          <CardTitle className="text-lg">{category.categoryName}</CardTitle>
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
                              key={subcategory.subcategoryKey}
                              className="group relative flex items-center rounded-lg border border-gray-300 p-3 hover:bg-accent"
                            >
                              <span className="text-sm">{subcategory.subcategoryName}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={() => handleEditSubcategory(subcategory, category.categoryName)}
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
