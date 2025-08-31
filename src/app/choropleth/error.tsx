'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Choropleth page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-medium text-red-800">
                コロプレス地図の表示でエラーが発生しました
              </h1>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-red-700">
              統計データの取得または地図の描画中に問題が発生しました。
            </p>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-red-700 hover:text-red-800">
                詳細なエラー情報を表示
              </summary>
              <div className="mt-2 p-3 bg-red-100 rounded text-sm font-mono text-red-800">
                {error.message}
                {error.digest && (
                  <div className="mt-1 text-red-600">
                    Error ID: {error.digest}
                  </div>
                )}
              </div>
            </details>
          </div>

          <div className="space-y-3">
            <button
              onClick={reset}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              再試行
            </button>

            <a
              href="/choropleth"
              className="inline-flex items-center ml-3 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              初期ページに戻る
            </a>
          </div>

          <div className="mt-6 pt-4 border-t border-red-200">
            <h3 className="text-sm font-medium text-red-800 mb-2">考えられる原因:</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• e-STAT APIサーバーが一時的に利用できない状態</li>
              <li>• 指定した統計データIDが存在しない</li>
              <li>• ネットワーク接続に問題がある</li>
              <li>• TopoJSONファイルの読み込みに失敗した</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}