import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ページが見つかりません
        </h1>

        <p className="text-gray-600 dark:text-neutral-400 mb-6">
          指定されたカテゴリまたはサブカテゴリは存在しないか、削除された可能性があります。
        </p>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            ホームに戻る
          </Link>

          <div>
            <Link
              href="/"
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}