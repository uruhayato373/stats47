import { SnsView } from "@/components/sns/sns-view";

export const metadata = { title: "Instagram運用 — stats47 admin" };

export default function InstagramContentPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-console-fg">Instagram運用</h1>
        <p className="mt-1 text-sm text-console-muted">投稿原稿・予定・公開実績・メトリクス（読み取り専用）</p>
      </div>
      <SnsView initialPlatform="instagram" />
    </div>
  );
}
