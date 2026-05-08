"use client";

import { ToggleGroup, ToggleGroupItem } from "@stats47/components/atoms/ui/toggle-group";

import type { NormalizationOption } from "@stats47/ranking";

interface NormalizationToggleProps {
  options: NormalizationOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function NormalizationToggle({ options, value, onChange, disabled }: NormalizationToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v);
      }}
      className="bg-muted p-0.5 rounded-xs h-6"
    >
      <ToggleGroupItem
        value="original"
        disabled={disabled}
        className="text-xs px-2 h-5 data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm rounded-xs transition-all"
      >
        総数
      </ToggleGroupItem>
      {options.map((opt) => (
        <ToggleGroupItem
          key={opt.type}
          value={opt.type}
          disabled={disabled}
          className="text-xs px-2 h-5 data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm rounded-xs transition-all"
        >
          {opt.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
