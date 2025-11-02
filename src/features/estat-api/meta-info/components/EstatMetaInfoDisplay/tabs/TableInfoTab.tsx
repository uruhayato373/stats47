import type { TableInfo } from "@/features/estat-api/meta-info/types";

interface TableInfoTabProps {
  tableInfo: TableInfo;
}

/**
 * TableInfoTab - 統計表情報表示タブ
 *
 * 機能:
 * - 統計表の基本情報を整理して表示
 * - 統計表ID、タイトル、政府統計名、作成機関などの詳細情報
 * - 調査周期、公開日、レコード数などのメタデータ
 */
export default function TableInfoTab({ tableInfo }: TableInfoTabProps) {
  return (
    <div className="space-y-8">
      {/* 基本情報セクション */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
          基本情報
        </h3>
        <dl className="space-y-3">
          <InfoRow label="統計表ID" value={tableInfo.id} />
          <InfoRow label="統計表題名" value={tableInfo.title} />
          <InfoRow label="政府統計名" value={tableInfo.statName} />
          <InfoRow label="作成機関" value={tableInfo.organization} />
          <InfoRow label="統計調査名" value={tableInfo.statisticsName} />
          <InfoRow label="調査周期" value={tableInfo.cycle} />
          <InfoRow
            label="調査年月日"
            value={tableInfo.surveyDate ? String(tableInfo.surveyDate) : "-"}
          />
          <InfoRow label="公開日" value={tableInfo.openDate} />
          <InfoRow label="更新日" value={tableInfo.updatedDate} />
          <InfoRow
            label="小地域集計"
            value={tableInfo.smallArea ? "あり" : "なし"}
          />
          <InfoRow label="集計地域" value={tableInfo.collectArea} />
          <InfoRow
            label="総レコード数"
            value={tableInfo.totalRecords.toLocaleString()}
          />
        </dl>
      </div>

      {/* 分類情報セクション */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
          分類情報
        </h3>
        <dl className="space-y-3">
          <CategoryRow
            label="大分類"
            value={tableInfo.mainCategory.name}
            code={tableInfo.mainCategory.code}
          />
          {tableInfo.subCategory && (
            <CategoryRow
              label="小分類"
              value={tableInfo.subCategory.name}
              code={tableInfo.subCategory.code}
            />
          )}
        </dl>
      </div>

      {/* 説明セクション */}
      {tableInfo.explanation && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            説明
          </h3>
          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {tableInfo.explanation}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * InfoRow - 情報行表示コンポーネント
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground sm:w-40 flex-shrink-0">
        {label}
      </dt>
      <dd className="text-sm mt-1 sm:mt-0 text-foreground">{value || "-"}</dd>
    </div>
  );
}

/**
 * CategoryRow - 分類情報行表示コンポーネント
 */
function CategoryRow({
  label,
  value,
  code,
}: {
  label: string;
  value: string;
  code: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground sm:w-40 flex-shrink-0">
        {label}
      </dt>
      <dd className="text-sm mt-1 sm:mt-0 text-foreground">
        {value}
        {code && (
          <span className="ml-2 text-xs text-muted-foreground">
            (コード: {code})
          </span>
        )}
      </dd>
    </div>
  );
}
