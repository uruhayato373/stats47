import { NextRequest, NextResponse } from "next/server";

import {
  deleteSubcategory,
  findSubcategoryByName,
  updateSubcategory,
} from "@/features/category/repositories/category-repository";

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
    const subcategory = await findSubcategoryByName(subcategoryId);

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

    const subcategory = await updateSubcategory(subcategoryId, {
      subcategoryKey: body.subcategoryKey,
      subcategoryName: body.subcategoryName,
      categoryKey: body.categoryKey,
      displayOrder: body.displayOrder,
    });

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
    const success = await deleteSubcategory(subcategoryId);

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
