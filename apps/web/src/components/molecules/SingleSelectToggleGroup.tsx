'use client';

import type { ReactNode } from 'react';

import { ToggleGroup, ToggleGroupItem } from '@stats47/components/atoms/ui/toggle-group';
import { cn } from '@stats47/components/lib/cn';

interface Option<Value extends string> {
  value: Value;
  label: ReactNode;
  title?: string;
  disabled?: boolean;
}

interface Props<Value extends string> {
  'aria-label': string;
  value: Value;
  options: readonly Option<Value>[];
  onValueChange: (value: Value) => void;
  disabled?: boolean;
  /** 外側の配置だけを指定する。選択色・寸法は共通部品が持つ。 */
  className?: string;
}

/** 表示条件を必ず1つ選ぶ操作。パネルの切替は Tabs、ページ移動はリンクを使う。 */
export function SingleSelectToggleGroup<Value extends string>({
  value, options, onValueChange, disabled, className, ...label
}: Props<Value>) {
  return (
    <ToggleGroup
      {...label}
      variant="outline"
      spacing={0}
      multiple={false}
      value={[value]}
      disabled={disabled}
      className={cn('max-w-full flex-wrap', className)}
      onValueChange={([next]) => {
        const option = options.find(item => item.value === next);
        if (option && !option.disabled && option.value !== value) onValueChange(option.value);
      }}
    >
      {options.map(option => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          title={option.title}
          disabled={option.disabled}
          className="min-h-11 sm:min-h-0"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
