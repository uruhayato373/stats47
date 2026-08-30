import { AssetsView } from "@/components/assets/assets-view";

export default function AssetsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-console-fg">画像資産</h1>
        <p className="mt-1 text-sm text-console-muted">
          OGP・リンクカード・note カバー・記事内画像/動画の読み取り専用ギャラリー。
        </p>
      </div>
      <AssetsView />
    </div>
  );
}
