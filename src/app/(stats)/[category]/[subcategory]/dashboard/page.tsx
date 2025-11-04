import { AreaNavigator } from "@/features/area/components/AreaNavigator";

export const runtime = "edge";

export default function AreaPage() {
  return (
    <div className="space-y-6">
      <AreaNavigator />
    </div>
  );
}
