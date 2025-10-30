import { AreaNavigatorWithParams } from "@/features/area/components/AreaNavigatorWithParams";

export default function AreaPage() {
  return (
    <div className="space-y-6">
      {/* 地域ナビゲーション（category/subcategoryパラメータを必ずpropsで供給すること） */}
      <AreaNavigatorWithParams />
    </div>
  );
}
