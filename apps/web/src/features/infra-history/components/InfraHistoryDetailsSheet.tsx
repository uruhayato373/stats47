'use client';

import { useState, type ReactNode } from 'react';

import { Button } from '@stats47/components/atoms/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@stats47/components/atoms/ui/sheet';
import { Info } from 'lucide-react';

interface InfraHistoryDetailsSheetProps {
  readonly title: string;
  readonly description: string;
  /** 地図の読み方・出典の詳細・利用条件・検算 (サーバーで組み立てる) */
  readonly children: ReactNode;
}

/**
 * 地図の読み方と出典の詳細を右から開くパネル。画面には地図・数字と出典の 1 行だけを出し、
 * 長い説明はここへ寄せる。出典の 1 行 (データ名・提供者・版・取得日・加工) は画面に残す
 * (Google は見えない内容への構造化データを認めず、原典の出典表示も読者への表示が要るため)。
 */
export function InfraHistoryDetailsSheet({ title, description, children }: InfraHistoryDetailsSheetProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="link" size="xs" onClick={() => setOpen(true)}>
        <Info aria-hidden="true" />
        地図の読み方・出典の詳細
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        {/* サイトの上端のヘッダー (sticky・z-200) と Cookie 同意 (z-[1100]) より前に出す。Sheet の既定は z-50 */}
        <SheetContent side="right" className="z-[1200]! w-full! overflow-y-auto sm:max-w-md!">
          <SheetHeader className="border-b pr-12!">
            <SheetTitle className="text-base!">{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4 pb-6 text-sm leading-relaxed">{children}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
