"use client";

import React from "react";

export default function ChoroplethInstructions() {
  return (
    <div className="bg-gray-50 rounded-lg p-6 dark:bg-neutral-700">
      <h3 className="font-medium text-gray-900 dark:text-neutral-100 mb-4">
        使用方法
      </h3>
      <div className="space-y-4 text-sm text-gray-700 dark:text-neutral-300">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-neutral-100 mb-2">
            基本的な使い方
          </h4>
          <ol className="ml-4 space-y-1 list-decimal">
            <li>上のフォームで統計表IDを入力</li>
            <li>必要に応じて分類、地域、時間軸を指定</li>
            <li>「データを取得」ボタンをクリック</li>
            <li>コロプレス地図が表示されます</li>
          </ol>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 dark:text-neutral-100 mb-2">
            パラメータ説明
          </h4>
          <div className="space-y-2">
            <div>
              <strong>統計表ID:</strong> 必須項目。e-STAT APIの統計表識別子
              <div className="text-xs text-gray-600 dark:text-neutral-400 ml-2">
                例: 0000010101（人口推計）
              </div>
            </div>
            <div>
              <strong>分類01:</strong> データのカテゴリを指定（カンマ区切り可）
              <div className="text-xs text-gray-600 dark:text-neutral-400 ml-2">
                例: A1101（総人口）, A1102（男性人口）
              </div>
            </div>
            <div>
              <strong>地域:</strong> 特定の地域コードを指定（カンマ区切り可）
              <div className="text-xs text-gray-600 dark:text-neutral-400 ml-2">
                例: 13000（東京都）, 27000（大阪府）
              </div>
            </div>
            <div>
              <strong>時間軸:</strong> 特定の年度や期間を指定（カンマ区切り可）
              <div className="text-xs text-gray-600 dark:text-neutral-400 ml-2">
                例: 2020000000, 2021000000
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 dark:text-neutral-100 mb-2">
            デフォルト設定
          </h4>
          <ul className="ml-4 space-y-1 list-disc">
            <li>統計表ID: 0000010101（人口推計）</li>
            <li>分類01: A1101（総人口）</li>
            <li>地域: 指定なし（全地域）</li>
            <li>時間軸: 指定なし（全期間）</li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 dark:text-neutral-100 mb-2">
            利用可能な統計表例
          </h4>
          <div className="space-y-1 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="bg-white dark:bg-neutral-600 p-2 rounded">
                <strong>0000010101:</strong> 人口推計
              </div>
              <div className="bg-white dark:bg-neutral-600 p-2 rounded">
                <strong>0003412312:</strong> 国勢調査
              </div>
              <div className="bg-white dark:bg-neutral-600 p-2 rounded">
                <strong>0003348237:</strong> 世帯数
              </div>
              <div className="bg-white dark:bg-neutral-600 p-2 rounded">
                <strong>0003160000:</strong> 県民経済計算
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-neutral-600 pt-4">
          <div className="text-xs text-gray-600 dark:text-neutral-400">
            <strong>注意:</strong>
            統計表IDが存在しない場合や、指定したパラメータの組み合わせでデータが見つからない場合は、
            エラーメッセージが表示されます。その場合は、パラメータを調整して再試行してください。
          </div>
        </div>
      </div>
    </div>
  );
}