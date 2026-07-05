/**
 * エディトリアルな "広告" ラベル（両側に細い罫線）。
 * AdSense ポリシー（広告と非広告コンテンツの明確な区別）を満たす。
 * InContent / Footer スロット共通。
 */
export function AdSlotLabel() {
  return (
    <div className="mb-1.5 flex items-center gap-2 text-[10.5px] font-semibold uppercase text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      広告
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
