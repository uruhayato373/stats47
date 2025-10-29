"use client";

import { useState } from "react";

import * as LucideReact from "lucide-react";
import { Edit2 } from "lucide-react";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/atoms/ui/accordion";
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

interface CategoriesManagementProps {
  categories: Category[];
}

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

          {!isCategory && (
            <div className="grid gap-2">
              <Label htmlFor="href">URL</Label>
              <Input
                id="href"
                defaultValue={subcategory?.href || ""}
                className="font-mono"
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

export function CategoriesManagement({ categories }: CategoriesManagementProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<{
    subcategory: Subcategory;
    categoryName: string;
  } | null>(null);


  const handleSaveCategory = async () => {
    // TODO: API呼び出し
    console.log("Save category:", editingCategory);
    window.location.reload();
  };

  const handleDeleteCategory = async () => {
    if (!editingCategory) return;
    try {
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        window.location.reload();
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
    // TODO: API呼び出し
    console.log("Save subcategory:", editingSubcategory);
    window.location.reload();
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
        window.location.reload();
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
