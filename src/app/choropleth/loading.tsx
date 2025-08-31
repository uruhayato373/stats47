export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        {/* ヘッダー部分 */}
        <div className="mb-8">
          <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>

        {/* メイン地図エリア */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="w-full h-96 bg-gray-200 rounded flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">地図データを読み込み中...</p>
            </div>
          </div>
          
          {/* データセット情報部分 */}
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <div className="h-5 bg-gray-300 rounded w-48 mb-2"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="h-4 bg-gray-300 rounded w-20"></div>
              <div className="h-4 bg-gray-300 rounded w-16"></div>
              <div className="h-4 bg-gray-300 rounded w-16"></div>
              <div className="h-4 bg-gray-300 rounded w-16"></div>
            </div>
          </div>
        </div>

        {/* フィルター情報部分 */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="h-5 bg-gray-300 rounded w-32 mb-3"></div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-4 bg-gray-300 rounded w-8"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-300 rounded w-28"></div>
                <div className="h-4 bg-gray-300 rounded w-8"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-4 bg-gray-300 rounded w-8"></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="h-5 bg-gray-300 rounded w-28 mb-3"></div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-300 rounded w-16"></div>
                <div className="h-4 bg-gray-300 rounded w-8"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-300 rounded w-16"></div>
                <div className="h-4 bg-gray-300 rounded w-8"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-300 rounded w-16"></div>
                <div className="h-4 bg-gray-300 rounded w-8"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}