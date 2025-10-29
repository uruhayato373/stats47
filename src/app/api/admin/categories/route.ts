import { NextRequest, NextResponse } from "next/server";

import {
  createCategory,
  listCategories,
} from "@/features/category/repositories/category-repository";

/**
 * GET /api/admin/categories
 * 全カテゴリとサブカテゴリを取得
 */
export async function GET() {
  try {
    const categories = await listCategories();

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/categories
 * カテゴリを作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const category = await createCategory({
      categoryKey: body.categoryKey,
      name: body.name,
      icon: body.icon,
      displayOrder: body.displayOrder || 0,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
