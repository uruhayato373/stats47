/**
 * 分野説明コンポーネント
 * 責務: 分野説明の表示のみ
 */

/**
 * 分野説明コンポーネント
 */
export function FieldDescription() {
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-sm font-medium text-gray-700 mb-2">分野の説明</h3>
      <div className="text-xs text-gray-600 space-y-1">
        <p>
          • <strong>国土・気象:</strong> 地理、気象、災害に関する統計
        </p>
        <p>
          • <strong>人口・世帯:</strong> 人口動態、世帯構成に関する統計
        </p>
        <p>
          • <strong>労働・賃金:</strong> 就業状況、賃金水準に関する統計
        </p>
        <p>
          • <strong>企業・家計・経済:</strong> 経済活動、企業活動に関する統計
        </p>
        <p>
          • <strong>社会保障・衛生:</strong> 医療、福祉、健康に関する統計
        </p>
      </div>
    </div>
  );
}
