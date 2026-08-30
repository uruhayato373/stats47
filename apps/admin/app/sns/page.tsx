import { SnsView } from "@/components/sns/sns-view";

export default function SnsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-console-fg">📮 SNS 投稿ギャラリー</h1>
        <p className="mt-1 text-sm text-console-muted">
          caption・投稿状態・Geo分類・メトリクス (X / Instagram / YouTube) — 読み取り専用
        </p>
      </div>
      <SnsView />
    </div>
  );
}
