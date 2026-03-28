"use client";

import { ToggleGroup, ToggleGroupItem } from "@stats47/components/atoms/ui/toggle-group";
import { Building2, MapPin } from "lucide-react";

import type { AreaType } from "@/features/area";

interface AreaTypeToggleProps {
  value: AreaType;
  onChange: (value: AreaType) => void;
  disabled?: boolean;
}

export function AreaTypeToggle({ value, onChange, disabled }: AreaTypeToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as AreaType);
      }}
      className="bg-muted p-0.5 rounded-xs h-6"
    >
      <ToggleGroupItem
        value="prefecture"
        disabled={disabled}
        className="text-xs px-1.5 h-5 flex items-center gap-1 data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm rounded-xs transition-all"
        aria-label="都道府県"
      >
        <MapPin className="w-3 h-3" />
        <span>都道府県</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="city"
        disabled={disabled}
        className="text-xs px-1.5 h-5 flex items-center gap-1 data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm rounded-xs transition-all"
        aria-label="市区町村"
      >
        <Building2 className="w-3 h-3" />
        <span>市区町村</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
