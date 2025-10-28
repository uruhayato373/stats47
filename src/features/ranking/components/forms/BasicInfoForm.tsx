"use client";

interface BasicInfoFormProps {
  item?: any;
  mode: "create" | "edit";
}

export function BasicInfoForm({ item, mode }: BasicInfoFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">基本情報</h3>
      <p className="text-sm text-muted-foreground">
        基本情報フォームは後ほど実装します。
      </p>
      {item && (
        <pre className="text-xs bg-muted p-4 rounded overflow-auto">
          {JSON.stringify(item, null, 2)}
        </pre>
      )}
    </div>
  );
}

