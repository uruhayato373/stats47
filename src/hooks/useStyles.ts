// スタイル管理用のカスタムフック
export const useStyles = () => {
  const styles = {
    // Input フィールド
    input: {
      base: "w-full px-3 py-2 border border-gray-200 rounded-lg shadow-xs placeholder-gray-500 bg-white text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100 dark:placeholder-neutral-400",
      disabled: "opacity-50 cursor-not-allowed",
    },

    // ボタン
    button: {
      primary:
        "px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-400 dark:focus:ring-offset-neutral-800",
      secondary:
        "px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:bg-neutral-600 dark:hover:bg-neutral-700 dark:focus:ring-neutral-400 dark:focus:ring-offset-neutral-800",
      small:
        "px-3 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 focus:outline-hidden focus:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600",
    },

    // カード
    card: {
      base: "bg-white border border-gray-200 rounded-lg p-6 dark:bg-neutral-800 dark:border-neutral-700",
      compact:
        "bg-white border border-gray-200 rounded-lg p-4 dark:bg-neutral-800 dark:border-neutral-700",
    },

    // メッセージ
    message: {
      success:
        "bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/30 dark:border-blue-700",
      error:
        "bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/30 dark:border-red-700",
      info: "bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/30 dark:border-blue-700",
      warning:
        "bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900/30 dark:border-yellow-700",
    },

    // ヘッダー
    header: {
      primary:
        "bg-indigo-50 border border-indigo-200 rounded-lg p-4 dark:bg-indigo-900/30 dark:border-indigo-700",
      secondary:
        "bg-gray-50 border border-gray-200 rounded-lg p-4 dark:bg-gray-900/30 dark:border-gray-700",
    },

    // ラベル
    label: {
      base: "block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2",
      required:
        "block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2 after:content-['*'] after:ml-0.5 after:text-red-500",
    },

    // 見出し
    heading: {
      lg: "text-lg font-medium text-gray-900 dark:text-neutral-100 mb-4",
      md: "text-base font-medium text-gray-800 dark:text-neutral-200 mb-3",
      sm: "text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2",
    },

    // テキスト
    text: {
      primary: "text-indigo-900 dark:text-indigo-100",
      secondary: "text-indigo-800 dark:text-indigo-200",
      body: "text-gray-700 dark:text-neutral-300",
      muted: "text-gray-500 dark:text-neutral-400",
    },

    // レイアウト
    layout: {
      section: "space-y-6",
      row: "space-y-4",
      grid: "grid grid-cols-1 md:grid-cols-2 gap-4",
      flex: "flex items-center gap-2",
    },
  };

  return styles;
};
