import type { Metadata } from "next";

type PageParams = {
  params: {
    areaType: "national" | "prefecture" | "city";
    areaCode: string;
  };
};

export const metadata: Metadata = {
  title: "Land Area Dashboard",
};

export default async function Page({ params }: PageParams) {
  const { areaType, areaCode } = params;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold">Land Area Dashboard</h1>
      <div className="mt-2 text-sm text-muted-foreground">
        <span>Area Type: </span>
        <code className="font-mono">{areaType}</code>
        <span className="ml-3">Area Code: </span>
        <code className="font-mono">{areaCode}</code>
      </div>

      {/* TODO: 実データの可視化をここに実装（ランキング/地図 等） */}
      <div className="mt-6 rounded-md border p-4">
        このエリアでダッシュボードコンテンツを表示します。
      </div>
    </div>
  );
}


