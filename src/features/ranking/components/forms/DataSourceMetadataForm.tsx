"use client";

interface DataSourceMetadataFormProps {
  item?: any;
}

export function DataSourceMetadataForm({ item }: DataSourceMetadataFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">データソース設定</h3>
      <p className="text-sm text-muted-foreground">
        データソース設定フォームは後ほど実装します。
      </p>
      <p className="text-sm text-muted-foreground">
        - area_type (prefecture/city/national)
      </p>
      <p className="text-sm text-muted-foreground">
        - calculation_type (direct/ratio/aggregate)
      </p>
      <p className="text-sm text-muted-foreground">- metadata JSON</p>
    </div>
  );
}

