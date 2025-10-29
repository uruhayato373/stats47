import { NextRequest, NextResponse } from "next/server";

import {
  deleteCategory,
  findCategoryByName,
  updateCategory,
} from "@/features/category/repositories/category-repository";

interface RouteContext {
  params: Promise<{ categoryId: string }>;
}

/**
 * GET /api/admin/categories/[categoryId]
 * カテゴリを取得
 */
export async function GET(_: NextRequest, { params }: RouteContext) {
  try {
    const { categoryId } = await params;
    const category = await findCategoryByName(categoryId);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/categories/[categoryId]
 * カテゴリを更新
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { categoryId } = await params;
    const body = await request.json();

    const category = await updateCategory(categoryId, {
      categoryKey: body.categoryKey,
      categoryName: body.categoryName,
      icon: body.icon,
      displayOrder: body.displayOrder,
    });

    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/categories/[categoryId]
 * カテゴリを削除
 */
export async function DELETE(_: NextRequest, { params }: RouteContext) {
  try {
    const { categoryId } = await params;
    const success = await deleteCategory(categoryId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete category" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
