import { CARD_SURFACE_CLASS } from '@stats47/components';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RailCard, RailNavRow, RailNavRowButton } from '../SurfaceCard';

describe('RailCard', () => {
  it('外枠は共通の CARD_SURFACE_CLASS (角丸・線色をトークンで決める) を持つ', () => {
    const { container } = render(
      <RailCard title="タイトル">本文</RailCard>
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass(...CARD_SURFACE_CLASS.split(' '));
  });

  it('外枠に角丸・線色のリテラルを持たず、トークン (rounded-card / border-card-outline) だけで決まる', () => {
    const { container } = render(
      <RailCard title="タイトル">本文</RailCard>
    );
    const root = container.firstElementChild as HTMLElement;
    // リテラルが混ざると --card-radius / --card-outline を変えてもカードが追従しない
    expect(root).toHaveClass('rounded-card', 'border-card-outline');
    expect(root).not.toHaveClass('rounded-none', 'border-border', 'border-transparent');
  });

  it('ヘッダーは border-b を持つ', () => {
    render(<RailCard title="タイトル">本文</RailCard>);
    const heading = screen.getByRole('heading', { name: 'タイトル' });
    const header = heading.parentElement?.parentElement as HTMLElement;
    expect(header).toHaveClass('border-b');
  });

  it('collapsible は details/summary で既定閉、summary に h3 見出しを持つ', () => {
    const { container } = render(
      <RailCard title="折りたたみ" collapsible>
        本文
      </RailCard>
    );
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute('open');
    const heading = screen.getByRole('heading', { name: '折りたたみ', level: 3 });
    expect(heading.closest('summary')).not.toBeNull();
  });

  it('defaultOpen を渡すと details が開いた状態で描画される', () => {
    const { container } = render(
      <RailCard title="折りたたみ" collapsible defaultOpen>
        本文
      </RailCard>
    );
    expect(container.querySelector('details')).toHaveAttribute('open');
  });
});

describe('RailNavRow', () => {
  it('active のとき aria-current="page" を持つ', () => {
    render(
      <RailNavRow href="/current" active>
        現在地
      </RailNavRow>
    );
    expect(screen.getByRole('link', { name: '現在地' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('通常行は bg-muted を持たない', () => {
    render(<RailNavRow href="/other">その他</RailNavRow>);
    expect(screen.getByRole('link', { name: 'その他' })).not.toHaveClass(
      'bg-muted'
    );
  });
});

describe('RailNavRowButton', () => {
  it('pressed のとき aria-pressed="true" を持つ', () => {
    render(<RailNavRowButton pressed>選択中</RailNavRowButton>);
    expect(screen.getByRole('button', { name: '選択中' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('未選択は aria-pressed="false" で bg-muted を持たない', () => {
    render(<RailNavRowButton>未選択</RailNavRowButton>);
    const button = screen.getByRole('button', { name: '未選択' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).not.toHaveClass('bg-muted');
  });
});
