import { NextRequest, NextResponse } from "next/server";

import { CategoryRepository } from "@/features/category/repositories/category-repository";

/**
 * GET /api/admin/subcategories
 * 全サブカテゴリを取得
 */
export async function GET() {
  try {
    const repository = await CategoryRepository.create();
    const subcategories = await repository.getAllSubcategories();

    return NextResponse.json({ subcategories }, { status: 200 });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    return NextResponse.json(
      { error: "Failed to fetch subcategories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/subcategories
 * サブカテゴリを作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const repository = await CategoryRepository.create();

    const subcategory = await repository.createSubcategory({
      subcategoryKey: body.subcategoryKey,
      name: body.name,
      categoryId: body.categoryId,
      href: body.href,
      displayOrder: body.displayOrder || 0,
    });

    return NextResponse.json({ subcategory }, { status: 201 });
  } catch (error) {
    console.error("Error creating subcategory:", error);
    return NextResponse.json(
      { error: "Failed to create subcategory" },
      { status: 500 }
    );
  }
}
