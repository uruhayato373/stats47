'use client';
import { useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Template } from '../../../../.claude/scripts/media/lib/workspace.mjs';
import { TEMPLATE_GROUPS, templateGroup } from '@/lib/image-template-basics';
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@stats47/components';

function FoldedGroup({ label, count, active, children }: { label: string; count: number; active: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(active);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger render={<Button variant="ghost" size="sm" className="group w-full justify-start" aria-label={label + 'を開閉'} />}>
        <ChevronRight aria-hidden="true" strokeWidth={1.5} className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
        <span className="truncate">{label}</span>
        <span className="ml-auto text-xs text-muted-foreground">{count}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** One entry per visual form, grouped as the ledger declares; main charts stay open. */
export function ImageTemplateTree({
  templates,
  selected,
  dirty,
  onSelect,
}: {
  templates: Template[];
  selected?: string;
  dirty: Set<string>;
  onSelect: (template: Template) => void;
}) {
  const active = templates.find((template) => template.id === selected);
  return (
    <nav aria-label="図の型" className="space-y-3">
      {TEMPLATE_GROUPS.map((group) => {
        const members = templates.filter((template) => templateGroup(template) === group.id);
        if (!members.length) return null;
        const list = (
          <ul className="space-y-1">
            {members.map((template) => (
              <li key={template.id}>
                <Button
                  variant={selected === template.id ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  aria-pressed={selected === template.id}
                  onClick={() => onSelect(template)}
                >
                  <span className="truncate">
                    {template.label}
                    {dirty.has(template.id) ? ' ＊' : ''}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        );
        return group.id === 'chart' ? (
          <section key={group.id} aria-label={group.label} className="space-y-1">
            <h3 className="px-2 text-xs font-medium text-muted-foreground">{group.label}</h3>
            {list}
          </section>
        ) : (
          <FoldedGroup key={group.id + String(active && templateGroup(active) === group.id)} label={group.label} count={members.length} active={!!active && templateGroup(active) === group.id}>
            {list}
          </FoldedGroup>
        );
      })}
      {!templates.length && <p className="text-sm text-muted-foreground">該当する型はありません。</p>}
    </nav>
  );
}
