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

    // メッセージ - 一般的なcalloutスタイルに準拠
    message: {
      success:
        "bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/30 dark:border-green-700",
      error:
        "bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/30 dark:border-red-700",
      info: "bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/30 dark:border-blue-700",
      warning:
        "bg-amber-50 border border-amber-200 rounded-lg p-4 dark:bg-amber-900/30 dark:border-amber-700",
    },

    // メッセージテキスト色 - 一般的なcalloutスタイルに準拠
    messageText: {
      success: "text-green-800 dark:text-green-200",
      error: "text-red-800 dark:text-red-200",
      info: "text-blue-800 dark:text-blue-200",
      warning: "text-amber-800 dark:text-amber-200",
      default: "text-gray-800 dark:text-gray-200",
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
      base: "block text-sm font-medium text-gray-900 dark:text-neutral-300 mb-2",
      required:
        "block text-sm font-medium text-gray-900 dark:text-neutral-300 mb-2 after:content-['*'] after:ml-0.5 after:text-red-500",
    },

    // 見出し
    heading: {
      lg: "text-lg font-medium text-gray-900 dark:text-neutral-100 mb-4",
      md: "text-base font-medium text-gray-800 dark:text-neutral-200 mb-3",
      sm: "text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2",
    },

    // テキスト色の統一定義
    text: {
      // 基本テキスト階層
      primary: "text-gray-800 dark:text-gray-50",      // 見出し、重要なテキスト
      secondary: "text-gray-700 dark:text-gray-200",   // 本文テキスト
      tertiary: "text-gray-500 dark:text-gray-300",    // 補助テキスト、説明文
      muted: "text-gray-400 dark:text-gray-400",       // 非活性、ヒント文字
      
      // 特殊用途
      brand: "text-indigo-600 dark:text-indigo-400",   // ブランドカラー
      success: "text-green-600 dark:text-green-400",   // 成功状態
      warning: "text-amber-600 dark:text-amber-400",   // 警告状態
      error: "text-red-600 dark:text-red-400",         // エラー状態
      
      // 後方互換性（段階的に廃止予定）
      body: "text-gray-700 dark:text-gray-200",        // → secondary に移行
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
