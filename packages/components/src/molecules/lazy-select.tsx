"use client";

/**
 * 配信サイズ策 D の部品 (選択肢・補助ラベルの JS を初回配信に載せない)。
 *
 * - LazySelect: 閉じている間は SelectTrigger と同じ見た目の静的ボタンを描き、pointerenter / focus で
 *   Select (Base UI) を読み始め、押されたら本物に置き換えて開いた状態 (defaultOpen) で始める。
 *   置き換えは押したときだけにする (hover で置き換えると、押す途中でボタンの要素が入れ替わり押下が失われる)。
 * - LazyTooltip: 初めは TooltipTrigger と同じ属性の静的要素だけを描き、マウスの pointerenter か
 *   キーボードの focus で Tooltip を読み、読み終わったら本物に置き換える (TooltipProvider も遅延側に置く)。
 *   触れた操作 (タップ) では読まない。補助ラベルは hover / キーボード用で、タップの途中で要素を入れ替えないため。
 */

import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/cn";

/** モジュールを 1 度だけ動的 import し、読み終わりを購読できるようにする。 */
export function createLazyModule<T>(loader: () => Promise<T>) {
  let request: Promise<void> | null = null;
  let loaded: T | null = null;
  const listeners = new Set<() => void>();

  function load(): void {
    request ??= loader().then((value) => {
      loaded = value;
      listeners.forEach((listener) => listener());
    });
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function useModule(): T | null {
    return React.useSyncExternalStore(subscribe, () => loaded, () => null);
  }

  return { load, useModule };
}

/* ------------------------------------------------------------------ */
/* LazySelect                                                          */
/* ------------------------------------------------------------------ */

/**
 * 閉じている間の見た目。SelectTrigger (atoms/ui/select.tsx) と同じクラス。
 * cn-select-trigger は style-lyra.used.css の抽出対象なので文字列のまま書く。
 */
const SELECT_TRIGGER_CLASS_NAME =
  "cn-select-trigger flex w-fit items-center justify-between gap-1.5 border border-input bg-transparent py-2 pr-2 pl-2.5 whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

const SELECT_VALUE_CLASS_NAME = "flex flex-1 text-left";

const selectModule = createLazyModule(() => import("../atoms/ui/select"));

export interface LazySelectItem {
  value: string;
  label: string;
}

export interface LazySelectProps {
  /** 現在値。省略すると選んだ値を Select 自身が持つ (非制御) */
  value?: string;
  items: readonly LazySelectItem[];
  onValueChange: (value: string) => void;
  /** 値が無いときの表示 */
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "default";
  "aria-label"?: string;
  triggerClassName?: string;
  contentClassName?: string;
  side?: "top" | "bottom";
}

export function LazySelect({
  value,
  items,
  onValueChange,
  placeholder,
  disabled,
  size = "default",
  "aria-label": ariaLabel,
  triggerClassName,
  contentClassName,
  side,
}: LazySelectProps) {
  const [activated, setActivated] = React.useState(false);
  const select = selectModule.useModule();

  if (select && activated) {
    const { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } = select;
    return (
      <Select
        {...(value !== undefined ? { value } : {})}
        defaultOpen
        disabled={disabled}
        items={items}
        onValueChange={(next: string | null) => {
          if (next !== null) onValueChange(next);
        }}
      >
        <SelectTrigger aria-label={ariaLabel} size={size} className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent side={side} className={contentClassName}>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const selectedLabel =
    value === undefined ? undefined : items.find((item) => item.value === value)?.label;

  return (
    <button
      type="button"
      role="combobox"
      aria-label={ariaLabel}
      aria-haspopup="listbox"
      aria-expanded={false}
      disabled={disabled}
      data-slot="select-trigger"
      data-size={size}
      data-placeholder={selectedLabel === undefined ? "" : undefined}
      className={cn(SELECT_TRIGGER_CLASS_NAME, triggerClassName)}
      onPointerEnter={selectModule.load}
      onFocus={selectModule.load}
      onClick={() => {
        // 読み込み中に押されたら、読み終わった時点で開いた状態で描く
        setActivated(true);
        selectModule.load();
      }}
    >
      <span data-slot="select-value" className={SELECT_VALUE_CLASS_NAME}>
        {selectedLabel ?? placeholder}
      </span>
      <ChevronDownIcon aria-hidden="true" className="pointer-events-none size-4 text-muted-foreground" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* LazyTooltip                                                         */
/* ------------------------------------------------------------------ */

const tooltipModule = createLazyModule(() => import("../atoms/ui/tooltip"));

type TriggerElementProps = {
  onPointerEnter?: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (event: React.PointerEvent<HTMLElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
};

export interface LazyTooltipProps {
  /** トリガーにする要素 (Button / a / Link)。TooltipTrigger の render と同じ */
  render: React.ReactElement<TriggerElementProps>;
  /** トリガーの中身 */
  children?: React.ReactNode;
  /** 補助ラベル */
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  contentClassName?: string;
  /** 表示までの待ち (TooltipProvider の delay) */
  delay?: number;
}

function isKeyboardFocus(element: HTMLElement): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    return false;
  }
}

export function LazyTooltip({
  render,
  children,
  content,
  side = "top",
  contentClassName,
  delay = 0,
}: LazyTooltipProps) {
  const tooltip = tooltipModule.useModule();
  const [activated, setActivated] = React.useState<"hover" | "focus" | null>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const setTriggerElement = React.useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
  }, []);
  const isSwapped = Boolean(tooltip && activated);

  // キーボードで focus して置き換えたときは、入れ替わった要素へ focus を戻す
  React.useEffect(() => {
    if (isSwapped && activated === "focus") triggerRef.current?.focus();
  }, [isSwapped, activated]);

  if (tooltip && activated) {
    const { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } = tooltip;
    return (
      <TooltipProvider delay={delay}>
        <Tooltip defaultOpen={activated === "focus" || isHovered}>
          <TooltipTrigger ref={setTriggerElement} render={render}>
            {children}
          </TooltipTrigger>
          <TooltipContent side={side} className={contentClassName}>
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const ownProps = render.props;
  return React.cloneElement(
    render,
    {
      "data-slot": "tooltip-trigger",
      onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
        ownProps.onPointerEnter?.(event);
        if (event.pointerType === "touch") return;
        setIsHovered(true);
        setActivated((current) => current ?? "hover");
        tooltipModule.load();
      },
      onPointerLeave: (event: React.PointerEvent<HTMLElement>) => {
        ownProps.onPointerLeave?.(event);
        setIsHovered(false);
      },
      onFocus: (event: React.FocusEvent<HTMLElement>) => {
        ownProps.onFocus?.(event);
        if (!isKeyboardFocus(event.currentTarget)) return;
        setActivated("focus");
        tooltipModule.load();
      },
    } as TriggerElementProps,
    children,
  );
}
