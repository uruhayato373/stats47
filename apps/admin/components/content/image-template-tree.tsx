'use client';
import { useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Template } from '../../../../.claude/scripts/media/lib/workspace.mjs';
import { IMAGE_PURPOSES } from '../../../../.claude/scripts/media/lib/taxonomy.mjs';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export type GalleryBranch = {
  key: string;
  templateId: string;
  purpose: string;
  template: Template;
};

function ClassificationGroup({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(active);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="group w-full justify-start"
          aria-label={label + 'の分類を開閉'}
        >
          <ChevronRight
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-4 shrink-0 text-console-muted transition-transform group-data-[state=open]:rotate-90"
          />
          <span className="truncate">{label}</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** The left menu navigates purpose + visual type independently of existing images. */
export function ImageTemplateTree({
  branches,
  selected,
  dirty,
  onSelect,
}: {
  branches: GalleryBranch[];
  selected?: string;
  dirty: Set<string>;
  onSelect: (branch: GalleryBranch) => void;
}) {
  const active = branches.find((branch) => branch.key === selected);
  return (
    <nav aria-label="型分類" className="space-y-1">
      {Object.entries(IMAGE_PURPOSES).map(([purpose, label]) => {
        const children = branches.filter(
          (branch) => branch.purpose === purpose
        );
        if (!children.length) return null;
        return (
          <ClassificationGroup
            key={purpose + String(active?.purpose === purpose)}
            label={label}
            active={active?.purpose === purpose}
          >
            <ul className="space-y-1">
              {children.map((branch) => (
                <li key={branch.key}>
                  <Button
                    variant={selected === branch.key ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    aria-pressed={selected === branch.key}
                    onClick={() => onSelect(branch)}
                  >
                    <span className="truncate">
                      {branch.template.label}
                      {dirty.has(branch.templateId) ? ' ＊' : ''}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </ClassificationGroup>
        );
      })}
      {!branches.length && (
        <p className="text-sm text-console-muted">該当する分類はありません。</p>
      )}
    </nav>
  );
}
