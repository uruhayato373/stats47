"use client";

import { Building2, MapPin } from "lucide-react";

import { SingleSelectToggleGroup } from "@/components/molecules/SingleSelectToggleGroup";

import type { AreaType } from "@/features/area";

interface AreaTypeToggleProps {
  value: AreaType;
  onChange: (value: AreaType) => void;
  disabled?: boolean;
}

export function AreaTypeToggle({ value, onChange, disabled }: AreaTypeToggleProps) {
  return (
    <SingleSelectToggleGroup
      aria-label="地域単位"
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      options={[
        { value: "prefecture", label: <><MapPin aria-hidden="true" />都道府県</> },
        { value: "city", label: <><Building2 aria-hidden="true" />市区町村</> },
      ]}
    />
  );
}
