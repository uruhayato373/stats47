'use client';

import { useId } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@stats47/components/atoms/ui/select';

import {
  SEX_LABELS,
  isPopulationSex,
  type PopulationSex,
} from '../lib/population-profile-view';

export function PopulationProfileSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { code: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="min-w-40 space-y-1">
      <label htmlFor={id} className="block text-sm text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} aria-label={label} className="h-11 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export function PopulationSexSelect({
  value,
  onChange,
}: {
  value: PopulationSex;
  onChange: (sex: PopulationSex) => void;
}) {
  return (
    <PopulationProfileSelect
      label="男女"
      value={value}
      options={(['0', '1', '2'] as const).map((code) => ({
        code,
        label: SEX_LABELS[code],
      }))}
      onChange={(sex) => {
        if (isPopulationSex(sex)) onChange(sex);
      }}
    />
  );
}
