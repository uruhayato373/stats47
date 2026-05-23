import { AdSenseAd } from "@/lib/google-adsense";

import type { AdFormat } from "@/lib/google-adsense/types";

interface InfeedAdProps {
  slotId: string;
  format: AdFormat;
  /** "広告" ラベルを非表示にしたい場合 */
  hideLabel?: boolean;
}

/**
 * D-System In-feed AdSense
 *
 * 本文導線中に "広告" ラベル付きで AdSense ユニットを配置する。
 * AdSense ポリシー (広告と非広告コンテンツの明確な区別) を満たす。
 */
export function InfeedAd({ slotId, format, hideLabel = false }: InfeedAdProps) {
  return (
    <div className="my-2">
      {!hideLabel && (
        <div className="mb-1.5 flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-normal text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          広告
          <span className="h-px flex-1 bg-border" />
        </div>
      )}
      <AdSenseAd slotId={slotId} format={format} />
    </div>
  );
}
