import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/atoms/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/organisms/ui/table";

import { CategoryInfo } from "@/features/estat-api/core/types/meta-info";

interface CategoriesTabProps {
  categories: CategoryInfo[];
}

/**
 * CategoriesTab - 分類情報表示タブ
 *
 * 機能:
 * - 各分類（cat01-cat15）を展開可能なセクションで表示
 * - 分類アイテムをテーブル形式で表示
 * - 分類名、コード、単位、階層レベルなどの情報を整理
 */
export default function CategoriesTab({ categories }: CategoriesTabProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400">
          分類情報がありません
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {categories.length}個の分類項目が見つかりました
      </div>

      <Accordion type="multiple" className="space-y-2">
        {categories.map((category) => {
          const itemCount = category.items.length;

          return (
            <AccordionItem
              key={category.id}
              value={category.id}
              className="border border-gray-200 rounded-lg dark:border-neutral-700"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full mr-4">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {category.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {category.id} • {itemCount}項目
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {itemCount}項目
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>コード</TableHead>
                        <TableHead>名称</TableHead>
                        <TableHead>単位</TableHead>
                        <TableHead>階層レベル</TableHead>
                        <TableHead>親コード</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {category.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">
                            {item.code}
                          </TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.unit || "-"}</TableCell>
                          <TableCell>{item.level || "-"}</TableCell>
                          <TableCell>{item.parentCode || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
