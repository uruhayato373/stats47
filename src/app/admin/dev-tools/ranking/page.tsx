import { RankingRepository } from "@/features/ranking/repositories/ranking-repository";

/**
 * ランキング項目管理画面
 */
export default async function RankingsPage() {
  const repository = await RankingRepository.create();
  const items = await repository.getAllRankingItems();

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              ランキング項目管理
            </h1>
            <p className="text-muted-foreground mt-2">
              統計項目の設定と管理を行います
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">ランキング項目一覧</h2>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                新規作成
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">ID</th>
                    <th className="text-left p-2 font-medium">
                      ランキングキー
                    </th>
                    <th className="text-left p-2 font-medium">ラベル</th>
                    <th className="text-left p-2 font-medium">単位</th>
                    <th className="text-left p-2 font-medium">状態</th>
                    <th className="text-left p-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.rankingKey}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="p-2 text-sm">{item.rankingKey}</td>
                      <td className="p-2 text-sm font-mono">
                        {item.rankingKey}
                      </td>
                      <td className="p-2">{item.label}</td>
                      <td className="p-2 text-sm">{item.unit}</td>
                      <td className="p-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            item.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.isActive ? "有効" : "無効"}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            編集
                          </button>
                          <button className="text-red-600 hover:text-red-800 text-sm">
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              合計 {items.length} 件のランキング項目
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
