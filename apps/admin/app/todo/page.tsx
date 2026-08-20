import Link from "next/link";

import {
  todoBoard,
  type ImprovementRow,
  type LayerId,
  type Tier,
  type TodoCard,
} from "@/lib/server/todo";

export const dynamic = "force-dynamic";

export const metadata = { title: "TODO — stats47 統合メディアコンソール" };

/**
 * TODO ボード (.claude/todo の読み取り専用ビュー)。doboku-note の admin と同型:
 *
 * - **層 (バックログ/週間/月間/改善) は上部のスイッチャ**が持つ。層は別ファイルで、
 *   週間・月間は backlog の部分集合ではなく pull されたコピー＝「行き先」であって絞り込みではない。
 * - **優先度・種類・実行は本文右のレール**に置く。backlog カードの属性でしかない
 *   (他層には存在しない) ため。クライアント JS を持たず、絞り込みは searchParams に載せる:
 *   f=層 / t=優先度 / k=種類 / e=実行
 * - 件数は**自分以外の絞り込みを当てた集合**で数える (押した先が 0 件になる導線に件数を出さない)。
 * - 読み取り専用。編集は vscode リンクで元ファイルを開く (排他 writer 契約を画面から崩さない)。
 */

type Query = { f?: string; t?: string; k?: string; e?: string };
type TierKey = Tier | "none";

const TIERS: { key: TierKey; label: string; dot: string }[] = [
  { key: "high", label: "高", dot: "bg-console-bad" },
  { key: "mid", label: "中", dot: "bg-console-warn" },
  { key: "low", label: "低", dot: "bg-console-good" },
  { key: "hold", label: "判断待ち", dot: "bg-console-accent" },
  { key: "none", label: "未設定", dot: "bg-console-muted" },
];

const tierKey = (c: TodoCard): TierKey => c.tier ?? "none";

/** vscode://file/<abs>:<line> (Windows パスは / へ正規化) */
function editorHref(abs: string, line: number) {
  return "vscode://file/" + abs.split("\\").join("/") + ":" + line;
}

/** いまの絞り込みを保ったまま一部だけ差し替えた href。空値はパラメータごと落とす。 */
function href(q: Query, patch: Partial<Query>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...q, ...patch })) if (v) p.set(k, v);
  const s = p.toString();
  return s ? "/todo?" + s : "/todo";
}

function countBy(cards: TodoCard[], pick: (c: TodoCard) => string | null): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of cards) {
    const k = pick(c);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

/** 右レールの 1 群。active=null が「すべて」(その軸の解除)。 */
function Facet({
  title,
  param,
  now,
  active,
  total,
  items,
}: {
  title: string;
  param: keyof Query;
  now: Query;
  active: string | null;
  total: number;
  items: { key: string; label: string; count: number; dot?: string }[];
}) {
  const rowCls = (isActive: boolean) =>
    `flex items-center gap-2 rounded px-2 py-1 text-[13px] ${
      isActive
        ? "bg-console-accent/10 font-medium text-console-accent"
        : "text-console-fg hover:bg-console-card"
    }`;
  return (
    <section className="space-y-1">
      <h4 className="px-2 text-[11px] font-bold uppercase tracking-wide text-console-muted">
        {title}
      </h4>
      <Link href={href(now, { [param]: undefined })} className={rowCls(!active)}>
        <span className="flex-1">すべて</span>
        <span className="font-mono text-[11px] text-console-muted">{total}</span>
      </Link>
      {items.map((it) => (
        <Link key={it.key} href={href(now, { [param]: it.key })} className={rowCls(active === it.key)}>
          {it.dot ? <span className={`h-2 w-2 shrink-0 rounded-full ${it.dot}`} /> : null}
          <span className="flex-1">{it.label}</span>
          <span className="font-mono text-[11px] text-console-muted">{it.count}</span>
        </Link>
      ))}
    </section>
  );
}

function Badge({ tone, children }: { tone: "bad" | "warn" | "info" | "accent" | "muted"; children: React.ReactNode }) {
  const cls = {
    bad: "border-console-bad/50 text-console-bad",
    warn: "border-console-warn/50 text-console-warn",
    info: "border-console-info/50 text-console-info",
    accent: "border-console-accent/50 text-console-accent",
    muted: "border-console-border text-console-muted",
  }[tone];
  return <span className={`rounded border px-1.5 py-0.5 text-[11px] ${cls}`}>{children}</span>;
}

function Card({ c, today }: { c: TodoCard; today: string }) {
  const overdue = c.due !== null && c.due < today;
  return (
    <article className="rounded-md border border-console-border bg-console-card p-3">
      <a
        href={editorHref(c.abs, c.line)}
        className="text-sm font-medium text-console-fg hover:text-console-accent hover:underline"
        title={`${c.path}:${c.line} を VS Code で開く`}
      >
        {c.title}
      </a>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {c.id ? <span className="font-mono text-[11px] text-console-muted">{c.id}</span> : null}
        {c.kind ? <Badge tone={c.kind === "不具合" ? "bad" : "muted"}>{c.kind}</Badge> : null}
        {c.executor ? <Badge tone="muted">実行:{c.executor}</Badge> : null}
        {c.wip ? <Badge tone="info">進行中</Badge> : null}
        {c.codex ? <Badge tone="accent">Codex</Badge> : null}
        {c.due ? <Badge tone={overdue ? "bad" : "muted"}>期日 {c.due}</Badge> : null}
        {!c.id && c.layer === "backlog" ? <Badge tone="warn">ID なし</Badge> : null}
      </div>
      {c.body ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] text-console-muted hover:text-console-fg">
            詳細
          </summary>
          {c.verify ? (
            <div className="mt-1.5 font-mono text-[11px] text-console-info">検証: {c.verify}</div>
          ) : null}
          <pre className="mt-1.5 max-h-96 overflow-auto whitespace-pre-wrap rounded bg-console-bg p-2 text-[12px] leading-relaxed text-console-fg">
            {c.body}
          </pre>
        </details>
      ) : null}
    </article>
  );
}

function ImprovementsTable({ rows, abs, today }: { rows: ImprovementRow[]; abs: string; today: string }) {
  const groups = [...new Set(rows.map((r) => r.tierLabel))];
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g} className="space-y-1">
          <h3 className="text-[13px] font-medium text-console-muted">
            {g} ({rows.filter((r) => r.tierLabel === g).length})
          </h3>
          <div className="overflow-x-auto rounded-md border border-console-border bg-console-card">
            <table className="w-full text-[13px]">
              <thead className="border-b border-console-border text-left text-[11px] text-console-muted">
                <tr>
                  {["ID", "タイトル", "Status", "Due", "Owner", "Metric"].map((h) => (
                    <th key={h} className="px-2 py-1.5 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((r) => r.tierLabel === g)
                  .map((r) => (
                    <tr key={r.id} className="border-b border-console-border/50 align-top">
                      <td className="whitespace-nowrap px-2 py-1.5">
                        <a
                          href={editorHref(abs, r.line)}
                          className="font-mono text-[11px] text-console-accent hover:underline"
                        >
                          {r.id}
                        </a>
                      </td>
                      <td className="px-2 py-1.5 text-console-fg">{r.title}</td>
                      <td className="whitespace-nowrap px-2 py-1.5">
                        <Badge tone={r.status === "in-progress" ? "info" : "muted"}>{r.status}</Badge>
                      </td>
                      <td
                        className={`whitespace-nowrap px-2 py-1.5 ${
                          r.due && r.due < today ? "text-console-bad" : "text-console-muted"
                        }`}
                      >
                        {r.due}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-console-muted">{r.owner}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-console-muted">{r.metric}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function TodoPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const board = todoBoard();
  const today = new Date().toISOString().slice(0, 10);

  if (board.error) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">TODO</h1>
        <p className="text-sm text-console-bad">読み取り失敗: {board.error}</p>
      </div>
    );
  }

  const layer: LayerId = board.layers.some((l) => l.id === q.f) ? (q.f as LayerId) : "backlog";
  const layerMeta = board.layers.find((l) => l.id === layer);
  const layerCards = board.items.filter((c) => c.layer === layer);
  // 種類・実行のタグ行を持つのは backlog だけ。他層で空の絞り込みを出さない
  const faceted = layer === "backlog";

  const tier = TIERS.some((t) => t.key === q.t) ? (q.t as TierKey) : null;
  const kind = faceted && q.k && layerCards.some((c) => c.kind === q.k) ? q.k : null;
  const executor = faceted && q.e && layerCards.some((c) => c.executor === q.e) ? q.e : null;

  const byTier = (cs: TodoCard[]) => (tier ? cs.filter((c) => tierKey(c) === tier) : cs);
  const byKind = (cs: TodoCard[]) => (kind ? cs.filter((c) => c.kind === kind) : cs);
  const byExecutor = (cs: TodoCard[]) => (executor ? cs.filter((c) => c.executor === executor) : cs);

  // 各軸のスコープ＝自分以外の絞り込みだけを当てた集合
  const tierScope = byKind(byExecutor(layerCards));
  const kindScope = byTier(byExecutor(layerCards));
  const executorScope = byTier(byKind(layerCards));
  const tierCounts = countBy(tierScope, tierKey);
  const kindCounts = countBy(kindScope, (c) => c.kind);
  const executorCounts = countBy(executorScope, (c) => c.executor);
  const items = byTier(tierScope);

  const now: Query = {
    f: layer === "backlog" ? undefined : layer,
    t: tier ?? undefined,
    k: kind ?? undefined,
    e: executor ?? undefined,
  };

  // 優先度を選んでいなければ tier ごとに見出しを立てる (1 グループなら見出しは要らない)
  const groups = TIERS.filter((t) => tierCounts.has(t.key) && (!tier || tier === t.key));
  // 語彙の宣言順で並べる (件数順にすると押すたびに行が動く)
  const kindKeys = board.kinds.filter((k) => kindCounts.has(k) || kind === k);
  const executorKeys = board.executors.filter((e) => executorCounts.has(e) || executor === e);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-console-fg">TODO ボード</h1>
        <p className="text-sm text-console-muted">
          真実源: <code className="rounded bg-console-card px-1">.claude/todo/</code> (構文の正典:
          todo-standards.md・doboku-note と統一) — 読み取り専用。編集はタイトルのリンクからエディタで開く。
        </p>
      </header>

      {/* 層スイッチャ */}
      <nav className="flex flex-wrap items-center gap-2">
        {board.layers.map((l) => (
          <Link
            key={l.id}
            href={href({}, { f: l.id === "backlog" ? undefined : l.id })}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              l.id === layer
                ? "border-console-accent bg-console-accent/10 font-medium text-console-accent"
                : "border-console-border text-console-fg hover:border-console-accent/50"
            }`}
          >
            {l.label} <span className="font-mono text-[11px] text-console-muted">{l.count}</span>
          </Link>
        ))}
        {layerMeta ? (
          <a
            href={editorHref(layerMeta.abs, 1)}
            className="ml-auto text-[11px] text-console-muted hover:text-console-accent"
            title={layerMeta.rel}
          >
            {layerMeta.file} を開く{layerMeta.updated ? ` (更新 ${layerMeta.updated})` : ""}
          </a>
        ) : null}
      </nav>

      {layer === "improvements" ? (
        <>
          <p className="text-[11px] text-console-muted">
            improvement-triage の排他 write。effect 判定つき施策の 6 列テーブル (v3-unified カードの対象外)。
          </p>
          <ImprovementsTable rows={board.improvements} abs={layerMeta?.abs ?? ""} today={today} />
        </>
      ) : (
        <div className="flex gap-5">
          {/* 本文: tier グループのカード */}
          <div className="min-w-0 flex-1 space-y-5">
            {items.length === 0 ? (
              <p className="text-sm text-console-muted">該当するカードはありません。</p>
            ) : (
              groups.map((g) => (
                <section key={g.key} className="space-y-2">
                  {groups.length > 1 ? (
                    <h3 className="flex items-center gap-2 text-[13px] font-medium text-console-fg">
                      <span className={`h-2 w-2 rounded-full ${g.dot}`} />
                      {g.label}
                      <span className="font-mono text-[11px] text-console-muted">
                        {tierCounts.get(g.key)}
                      </span>
                    </h3>
                  ) : null}
                  <div className="space-y-2">
                    {items
                      .filter((c) => tierKey(c) === g.key)
                      .map((c) => (
                        <Card key={c.path + c.line} c={c} today={today} />
                      ))}
                  </div>
                </section>
              ))
            )}
          </div>

          {/* 右レール: 優先度・種類・実行のファセット */}
          <aside className="w-52 shrink-0 space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-bold text-console-muted">絞り込み</span>
              {tier || kind || executor ? (
                <Link
                  href={href({}, { f: now.f })}
                  className="text-[11px] text-console-accent hover:underline"
                >
                  すべて解除
                </Link>
              ) : null}
            </div>

            <Facet
              title="優先度"
              param="t"
              now={now}
              active={tier}
              total={tierScope.length}
              items={TIERS.filter((t) => tierCounts.has(t.key) || tier === t.key).map((t) => ({
                key: t.key,
                label: t.label,
                count: tierCounts.get(t.key) ?? 0,
                dot: t.dot,
              }))}
            />

            {faceted ? (
              <>
                <Facet
                  title="種類"
                  param="k"
                  now={now}
                  active={kind}
                  total={kindScope.length}
                  items={kindKeys.map((v) => ({ key: v, label: v, count: kindCounts.get(v) ?? 0 }))}
                />
                <Facet
                  title="実行"
                  param="e"
                  now={now}
                  active={executor}
                  total={executorScope.length}
                  items={executorKeys.map((v) => ({
                    key: v,
                    label: v,
                    count: executorCounts.get(v) ?? 0,
                  }))}
                />
              </>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}
