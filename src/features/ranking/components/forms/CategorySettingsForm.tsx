"use client";

interface CategorySettingsFormProps {
  item?: any;
}

export function CategorySettingsForm({ item }: CategorySettingsFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">カテゴリ設定</h3>
      <p className="text-sm text-muted-foreground">
        カテゴリ設定フォームは後ほど実装します。
      </p>
      <p className="text-sm text-muted-foreground">
        - ranking_groups との紐付け
      </p>
      <p className="text-sm text-muted-foreground">
        - ranking_group_items の設定
      </p>
      <p className="text-sm text-muted-foreground">- display_order</p>
    </div>
  );
}

