import { SnsView } from "@/components/sns/sns-view";

export default function SnsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-console-fg">📮 SNS 投稿ギャラリー</h1>
        <p className="mt-1 text-sm text-console-muted">
          投稿・予約・caption・メトリクス (X / Instagram / note)
        </p>
      </div>
      <SnsView />
    </div>
  );
}
