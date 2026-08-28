import { SnsView } from "@/components/sns/sns-view";

export const metadata = { title: "X運用 — stats47 admin" };

export default function XContentPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-console-fg">X運用</h1>
        <p className="mt-1 text-sm text-console-muted">投稿原稿・予約・公開実績・メトリクス</p>
      </div>
      <SnsView initialPlatform="x" />
    </div>
  );
}
