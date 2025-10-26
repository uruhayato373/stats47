import { quickActionsConfig } from "@/infrastructure/navigation/sidebar-config";

/**
 * Quick Actionsボタンコンポーネント
 * 
 * サイドバー上部のクイックアクション用ボタンです。
 * 将来的にドロップダウンメニューなどの機能を追加することを想定しています。
 */
export function QuickActionsButton() {
  const { icon: Icon, label, chevronIcon: ChevronIcon } = quickActionsConfig;

  return (
    <button
      type="button"
      className="p-1.5 ps-2.5 w-full inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-background border border-border text-foreground shadow-sm hover:bg-accent focus:outline-hidden focus:bg-accent transition-colors"
    >
      <Icon className="size-3.5" />
      <span className="text-muted-foreground">{label}</span>
      <ChevronIcon className="ms-auto size-2.5" />
    </button>
  );
}
