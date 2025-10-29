import { NextRequest, NextResponse } from "next/server";

import { CategoryRepository } from "@/features/category/repositories/category-repository";

interface RouteContext {
  params: Promise<{ subcategoryId: string }>;
}

/**
 * GET /api/admin/subcategories/[subcategoryId]
 * サブカテゴリを取得
 */
export async function GET(_: NextRequest, { params }: RouteContext) {
  try {
    const { subcategoryId } = await params;
    const repository = await CategoryRepository.create();

    const subcategory = await repository.getSubcategoryById(
      parseInt(subcategoryId, 10)
    );

    if (!subcategory) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ subcategory }, { status: 200 });
  } catch (error) {
    console.error("Error fetching subcategory:", error);
    return NextResponse.json(
      { error: "Failed to fetch subcategory" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/subcategories/[subcategoryId]
 * サブカテゴリを更新
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { subcategoryId } = await params;
    const body = await request.json();
    const repository = await CategoryRepository.create();

    const subcategory = await repository.updateSubcategory(
      parseInt(subcategoryId, 10),
      {
        subcategoryKey: body.subcategoryKey,
        name: body.name,
        categoryId: body.categoryId,
        href: body.href,
        displayOrder: body.displayOrder,
        isActive: body.isActive,
      }
    );

    return NextResponse.json({ subcategory }, { status: 200 });
  } catch (error) {
    console.error("Error updating subcategory:", error);
    return NextResponse.json(
      { error: "Failed to update subcategory" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/subcategories/[subcategoryId]
 * サブカテゴリを削除
 */
export async function DELETE(_: NextRequest, { params }: RouteContext) {
  try {
    const { subcategoryId } = await params;
    const repository = await CategoryRepository.create();

    const success = await repository.deleteSubcategory(
      parseInt(subcategoryId, 10)
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete subcategory" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    return NextResponse.json(
      { error: "Failed to delete subcategory" },
      { status: 500 }
    );
  }
}
