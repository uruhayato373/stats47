"use client";
import { useParams } from "next/navigation";
import { AreaNavigator } from "./AreaNavigator";

export function AreaNavigatorWithParams() {
  const params = useParams();

  if (!params.category || !params.subcategory) {
    return <div>カテゴリ情報未指定</div>;
  }

  return (
    <AreaNavigator
      category={String(params.category)}
      subcategory={String(params.subcategory)}
    />
  );
}
