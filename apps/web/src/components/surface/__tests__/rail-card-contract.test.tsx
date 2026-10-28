import { CARD_SURFACE_CLASS } from '@stats47/components';
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('見出しは text-foreground font-medium で、アイコンを左に置ける', () => {
    render(
      <RailCard title="タイトル" icon={<svg data-testid="icon" />}>
        本文
      </RailCard>
    );
    const heading = screen.getByRole('heading', { name: 'タイトル' });
    expect(heading).toHaveClass('text-foreground', 'font-medium');
    expect(heading).not.toHaveClass('text-muted-foreground');
    expect(heading.previousElementSibling).toContainElement(
      screen.getByTestId('icon')
    );
  });

  it('本文が空のカードは CardContent を描かない', () => {
    const { container } = render(<RailCard title="見出しだけ" />);
    expect(
      container.querySelector('[data-slot="card-content"]')
    ).toBeNull();
  });

  it('collapsible は既定閉で、h3 見出しの中の開閉ボタンが本文を隠す', () => {
    render(
      <RailCard title="折りたたみ" collapsible>
        本文
      </RailCard>
    );
    const heading = screen.getByRole('heading', { name: '折りたたみ', level: 3 });
    const trigger = screen.getByRole('button', { name: '折りたたみ' });
    expect(heading).toContainElement(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // 閉じた本文も DOM に残し (リンクをクロールさせる)、hidden で見出し行の高さだけにする
    const body = screen.getByText('本文').closest('[data-slot="collapsible-content"]');
    expect(body).not.toBeNull();
    expect(body).toHaveAttribute('hidden');
  });

  it('defaultOpen を渡すと開いた状態で描画され、押すと閉じる', () => {
    render(
      <RailCard title="折りたたみ" collapsible defaultOpen>
        本文
      </RailCard>
    );
    const trigger = screen.getByRole('button', { name: '折りたたみ' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
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
