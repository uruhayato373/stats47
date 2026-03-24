import Link from 'next/link';
import { Button } from "@stats47/components";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h2 className="text-2xl font-bold mb-4">ページが見つかりません</h2>
      <p className="text-muted-foreground mb-8">
        お探しのページは削除されたか、URLが変更された可能性があります。
      </p>
      <Button asChild>
        <Link href="/">トップページに戻る</Link>
      </Button>
    </div>
  );
}
