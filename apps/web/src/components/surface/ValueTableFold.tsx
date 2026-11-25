'use client';

import { useState, type ReactNode } from 'react';

import { Button } from '@stats47/components/atoms/ui/button';

interface ValueTableFoldProps {
  /** 畳んでいる行の数 (ボタンの文言に出す) */
  hiddenCount: number;
  /** 畳んだ表 (サーバーで描いた ValueTable。畳む行は data-fold 付き) */
  children: ReactNode;
}

/**
 * ValueTable の `fold` の開閉 (2026-11-16)。畳んだ行は HTML に残し、CSS だけで隠す
 * (検索エンジンと JavaScript を読み込む前の画面には全行がある。畳む行の class は親に 1 回だけ書く)。
 * 表は閉じた状態でサーバーが描くので、開くまでの間に高さが跳ねない。
 */
export function ValueTableFold({ hiddenCount, children }: ValueTableFoldProps) {
  const [open, setOpen] = useState(false);
  return (
    <div data-folded={!open} className="data-[folded=true]:[&_tr[data-fold]]:hidden">
      {children}
      {/* 上の線は表の最後の行の下線が兼ねる (自分でも border-t を持つと 2 重になる。2026-11-25) */}
      <div className="flex justify-center py-1">
        <Button type="button" variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? '折りたたむ' : `全件を見る（残り ${hiddenCount} 件）`}
        </Button>
      </div>
    </div>
  );
}
