'use client';

import { useRef, useState, useSyncExternalStore } from 'react';

import { Button } from '@stats47/components/atoms/ui/button';
import { BookOpenText, ChartNoAxesColumnIncreasing, ExternalLink } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';

/** 出典 (url の無いものは名前だけ) または指標の定義・ランキングへのリンク */
export interface SourcesSheetLink {
  label: string;
  url?: string | null;
}

/** Sheet の 1 区切り。指標ごとに分けるときは title に指標の名前を入れる */
export interface SourcesSheetGroup {
  title?: string;
  /** 図を読むときの注意 (誤読を防ぐ注記)。Sheet の先頭に出す (2026-11-01。旧: 図の下に段落で出していた) */
  notes?: readonly string[];
  sources: readonly SourcesSheetLink[];
  /** 出典の補足 (集計の条件など) */
  sourceDetail?: string;
  rankings: readonly SourcesSheetLink[];
}

type SheetModule = typeof import('@stats47/components/atoms/ui/sheet');

const LABEL = '出典・指標の定義';

/**
 * Sheet (Base UI Dialog) は初回の pointerenter / focus で読み始め、押されたら開く (配信サイズ策 D。旧 ChartFooter のメニューと同じ)。
 * 閉じている間は同じボタンだけを描き、チャートの初回配信に Sheet の JS を載せない。
 */
let sheetRequest: Promise<void> | null = null;
let loadedSheet: SheetModule | null = null;
const sheetListeners = new Set<() => void>();

function loadSheet(): void {
  sheetRequest ??= import('@stats47/components/atoms/ui/sheet').then((loaded) => {
    loadedSheet = loaded;
    sheetListeners.forEach((listener) => listener());
  });
}

function subscribeSheet(listener: () => void) {
  sheetListeners.add(listener);
  return () => {
    sheetListeners.delete(listener);
  };
}

function useLoadedSheet(): SheetModule | null {
  return useSyncExternalStore(subscribeSheet, () => loadedSheet, () => null);
}

const ROW_CLASS_NAME =
  'inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline';

function SheetRow({ kind, link }: { kind: 'source' | 'ranking'; link: SourcesSheetLink }) {
  const icon =
    kind === 'source' ? (
      <BookOpenText aria-hidden="true" className="size-4 shrink-0" />
    ) : (
      <ChartNoAxesColumnIncreasing aria-hidden="true" className="size-4 shrink-0" />
    );
  const text = kind === 'source' ? `出典: ${link.label}` : link.label;
  if (!link.url) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{text}</span>
      </p>
    );
  }
  return /^https?:\/\//.test(link.url) ? (
    <a href={link.url} target="_blank" rel="noopener noreferrer" className={ROW_CLASS_NAME}>
      {icon}
      <span>{text}</span>
      <ExternalLink aria-hidden="true" className="size-3 shrink-0" />
    </a>
  ) : (
    <Link href={link.url} className={ROW_CLASS_NAME}>
      {icon}
      <span>{text}</span>
    </Link>
  );
}

/**
 * 出典と指標の定義・ランキングへのリンクを、ボタン 1 つから開く右の Sheet に並べる (2026-10-30 オーナー決定)。
 * チャートの下 (ChartFooter) も、テーマの指標カード (数値タイルの右上・切り替えカードのチャートの下) も、この部品 1 つで描く。
 * 開き口は文字付きのボタン (trigger="button") か、本のアイコンだけ (trigger="icon"。数値タイルの右上)。
 */
export function SourcesSheet({
  id,
  groups,
  trigger = 'button',
  label: labelOverride,
}: {
  id?: string;
  groups: readonly SourcesSheetGroup[];
  trigger?: 'button' | 'icon';
  /** 開き口と Sheet の題名 (章の「読むときの注意」など、出典を持たない Sheet に使う) */
  label?: string;
}) {
  const sheet = useLoadedSheet();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const shown = groups.filter(
    (group) =>
      group.sources.length > 0 || group.rankings.length > 0 || group.sourceDetail || (group.notes?.length ?? 0) > 0
  );
  if (shown.length === 0) return null;

  const isIcon = trigger === 'icon';
  // 注意のある図はアイコンに印を付けて、開く前に気づけるようにする
  const hasNotes = shown.some((group) => (group.notes?.length ?? 0) > 0);
  const label = labelOverride ?? (hasNotes ? `${LABEL}・読むときの注意` : LABEL);
  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size={isIcon ? 'icon-sm' : 'sm'}
        id={id ? `${id}-trigger` : undefined}
        aria-label={isIcon ? label : undefined}
        title={isIcon ? label : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="text-muted-foreground"
        onPointerEnter={loadSheet}
        onFocus={loadSheet}
        onClick={() => {
          // 読み込み中に押されたら、読み終わった時点で開いた状態で描く
          loadSheet();
          setOpen(true);
        }}
      >
        <span className="relative inline-flex">
          <BookOpenText aria-hidden="true" />
          {hasNotes ? (
            <span aria-hidden="true" data-sources-notes-marker className="absolute -right-1 -top-1 size-1.5 rounded-full bg-primary" />
          ) : null}
        </span>
        {isIcon ? null : LABEL}
      </Button>
      {sheet && open ? (
        <sheet.Sheet open={open} onOpenChange={setOpen}>
          {/* サイトの上端のヘッダー (sticky・z-200) と Cookie 同意 (z-[1100]) より前に出す。Sheet の既定は z-50 */}
          <sheet.SheetContent side="right" className="z-[1200]! overflow-y-auto" finalFocus={triggerRef}>
            <sheet.SheetHeader>
              <sheet.SheetTitle>{labelOverride ?? LABEL}</sheet.SheetTitle>
              <sheet.SheetDescription>
                {labelOverride
                  ? 'この章の図と数値を読むときの注意です。'
                  : `${hasNotes ? '読むときの注意と、' : ''}出典・指標の定義・都道府県ランキングへのリンクです。`}
              </sheet.SheetDescription>
            </sheet.SheetHeader>
            <ul className="flex flex-col divide-y divide-border px-4 pb-6">
              {shown.map((group, index) => (
                <li key={group.title ?? index} className="flex flex-col gap-2 py-3">
                  {group.title ? <p className="text-sm font-medium text-foreground">{group.title}</p> : null}
                  {group.notes?.map((note) => (
                    <p key={note} className="text-sm leading-relaxed text-foreground" data-sources-note>
                      {note}
                    </p>
                  ))}
                  {group.sources.map((link) => (
                    <SheetRow key={`s-${link.url ?? link.label}`} kind="source" link={link} />
                  ))}
                  {group.sourceDetail ? (
                    <p className="text-xs text-muted-foreground">{group.sourceDetail}</p>
                  ) : null}
                  {group.rankings.map((link) => (
                    <SheetRow key={`r-${link.url ?? link.label}`} kind="ranking" link={link} />
                  ))}
                </li>
              ))}
            </ul>
          </sheet.SheetContent>
        </sheet.Sheet>
      ) : null}
    </>
  );
}
