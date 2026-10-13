import { SnsView } from "@/components/sns/sns-view";

export default function SnsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-console-fg">SNS 投稿台帳</h1>
        <p className="mt-1 text-sm text-console-muted">
          投稿IDで画像・本文・予約日時を管理。下書きは画像を確認しながら本文を編集できます。
        </p>
      </div>
      <SnsView />
    </div>
  );
}
