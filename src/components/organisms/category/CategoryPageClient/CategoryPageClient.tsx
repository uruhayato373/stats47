"use client";

import React from "react";
import { CategoryPageLayout } from "../CategoryPageLayout";
import { CategoryPageHeader } from "../CategoryPageHeader";
import { SubcategoryList } from "../SubcategoryList";

interface SubcategoryItem {
  id: string;
  name: string;
  href: string;
}

interface CategoryPageClientProps {
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
    subcategories?: SubcategoryItem[];
  };
}

export const CategoryPageClient: React.FC<CategoryPageClientProps> = ({
  category,
}) => {
  return (
    <CategoryPageLayout>
      <CategoryPageHeader category={category} />
      <SubcategoryList
        subcategories={category.subcategories || []}
        category={category}
      />
    </CategoryPageLayout>
  );
};
