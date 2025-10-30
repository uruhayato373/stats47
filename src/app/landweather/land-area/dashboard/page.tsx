import { AreaNavigator } from "@/features/area/components/AreaNavigator";

export default function DashboardLandingPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold">Land Area Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        地域タイプを選択し、必要な情報を指定してからダッシュボードへ遷移します。
      </p>
      <div className="mt-6">
        <AreaNavigator />
      </div>
    </div>
  );
}


