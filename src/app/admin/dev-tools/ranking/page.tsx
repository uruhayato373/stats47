import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/ui/table";

import { RankingRepository } from "@/features/ranking/repositories/ranking-repository";

/**
 * ランキング項目管理画面
 */
export default async function RankingsPage() {
  const repository = await RankingRepository.create();
  const items = await repository.getAllRankingItems();

  return (
    <div className="max-w-7xl mx-auto px-2 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">ランキング項目一覧</h2>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            新規作成
          </button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ランキングキー</TableHead>
              <TableHead>ラベル</TableHead>
              <TableHead>単位</TableHead>
              <TableHead>状態</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.rankingKey}>
                <TableCell className="font-mono">
                  {item.rankingKey}
                </TableCell>
                <TableCell>{item.label}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      item.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {item.isActive ? "有効" : "無効"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      編集
                    </button>
                    <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                      削除
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="text-center text-sm text-muted-foreground">
          合計 {items.length} 件のランキング項目
        </div>
    </div>
  );
}
