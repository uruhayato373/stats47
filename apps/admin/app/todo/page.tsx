import Link from "next/link";
import { redirect } from "next/navigation";
import { BugIcon, CalendarClockIcon, CircleAlertIcon, ListTodoIcon } from "lucide-react";

import { Cell, DataGrid, DataTable, Row, StatCard, StatusBadge, type Tone } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { Button, buttonVariants, Collapsible, CollapsibleContent, CollapsibleTrigger } from "@stats47/components";
import { todoBoard, type ImprovementRow, type LayerId, type Tier, type TodoCard } from "@/lib/server/todo";

export const dynamic = "force-dynamic";

export const metadata = { title: "TODO — stats47 統合メディアコンソール" };

/**
 * TODO ボード (.claude/todo の読み取り専用ビュー・型 B: 一覧・キュー)。doboku-note の admin と同型:
 *
 * - **役割 (実行/計画/検証) は共通サイドバーの TODO 階層**が持つ。台帳は別ファイルで、
 *   週間・月間は backlog の部分集合ではなく pull されたコピー＝「行き先」であって絞り込みではない。
 * - **優先度・種類・待ちの理由は一覧の上の絞り込み**に置く。backlog カードの属性でしかない
 *   (他層には存在しない) ため。絞り込みは searchParams に載せる (リンクで共有できる):
 *   f=層 / t=優先度 / k=種類 / w=待ちの理由 (none = 待ちなし)。実行タグは自動処理の内部契約で、読者向け分類には使わない。
 * - 年間計画 (f=annual) は月見出しごとに表を分け、期日と待ちの理由を出す (時期・観測を待つカードの置き場)。
 * - 件数は**自分以外の絞り込みを当てた集合**で数える (押した先が 0 件になる導線に件数を出さない)。
 * - 読み取り専用。編集は vscode リンクで元ファイルを開く (排他 writer 契約を画面から崩さない)。
 */

type Query = { f?: string; t?: string; k?: string; w?: string; e?: string };
type TierKey = Tier | "none";

const TIERS: { key: TierKey; label: string; tone: Tone }[] = [
  { key: "high", label: "高", tone: "bad" },
  { key: "mid", label: "中", tone: "warn" },
  { key: "low", label: "低", tone: "good" },
  { key: "hold", label: "判断待ち", tone: "info" },
  { key: "none", label: "未設定", tone: "neutral" },
];
const TIER_ORDER = new Map(TIERS.map((t, i) => [t.key, i]));

const LAYER_TITLES: Record<LayerId, string> = {
  backlog: "実行バックログ",
  annual: "計画 — 年間",
  weekly: "計画 — 今週",
  monthly: "計画 — 今月",
  improvements: "効果測定・改善",
};

const LAYER_HINTS: Record<LayerId, string> = {
  backlog: "未完了タスクの全量を持つマスタ・唯一の起票先",
  annual: "時期や判定日が来るまで着手できないカードを月ごとに置いた計画。週次・月次の計画が期日で引く",
  weekly: "バックログから今週実行する項目を選んだ計画",
  monthly: "バックログから選んだ今月の重点とゴール",
  improvements: "実装後の効果判定・期限・Owner・Metricを持つ専用台帳",
};

const LINK = "font-medium underline-offset-4 hover:underline";

const tierKey = (c: TodoCard): TierKey => c.tier ?? "none";

/** 待ちの理由の絞り込みで「待ちなし (いま着手できる)」を表すキー */
const NO_WAIT = "none";
/** 承認はオーナーが週次レビューでまとめて可否を出すので目立たせる。ほかは人の操作・決定・時間を待つ */
const WAIT_TONE: Record<string, Tone> = { 承認: "warn", ログイン: "info", 判断: "info" };

const isOverdue = (c: { due: string | null }, today: string) => c.due !== null && c.due < today;

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

/** 待ちの理由ごとの枚数。1 枚が複数の理由を持てるので countBy と別に数える (待ちなしは NO_WAIT) */
function countWaits(cards: TodoCard[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of cards) {
    for (const w of c.waits.length ? c.waits : [NO_WAIT]) m.set(w, (m.get(w) ?? 0) + 1);
  }
  return m;
}

function countBy(cards: TodoCard[], pick: (c: TodoCard) => string | null): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of cards) {
    const k = pick(c);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

/** 絞り込みの 1 軸 (リンクのボタン列)。active=null が「すべて」(その軸の解除)。 */
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
  items: { key: string; label: string; count: number }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <Link href={href(now, { [param]: undefined })} className={buttonVariants({ variant: !active ? "default" : "outline", size: "sm" })}>
        すべて ({total})
      </Link>
      {items.map((it) => (
        <Link key={it.key} href={href(now, { [param]: it.key })} className={buttonVariants({ variant: active === it.key ? "default" : "outline", size: "sm" })}>
          {it.label} ({it.count})
        </Link>
      ))}
    </div>
  );
}

function getExecutorStatus(executor: string | null) {
  if (executor === "対話") return { label: "確認が必要", tone: "warn" as const };
  if (executor === "ユーザー" || executor === "windows" || executor === "別環境") {
    return { label: "外部作業あり", tone: "info" as const };
  }
  return null;
}

/** カードのタイトル・状態バッジ・詳細 (本文は Collapsible で開く) */
function TodoCardCell({ c, today }: { c: TodoCard; today: string }) {
  const overdue = isOverdue(c, today);
  const executorStatus = getExecutorStatus(c.executor);
  return (
    <div className="flex flex-col gap-1.5">
      <a href={editorHref(c.abs, c.line)} className={LINK} title={`${c.path}:${c.line} を VS Code で開く`}>
        {c.title}
      </a>
      <div className="flex flex-wrap items-center gap-1.5">
        {c.kind ? <StatusBadge tone={c.kind === "不具合" ? "bad" : "neutral"}>{c.kind}</StatusBadge> : null}
        {executorStatus ? <StatusBadge tone={executorStatus.tone}>{executorStatus.label}</StatusBadge> : null}
        {c.waits.map((w) => (
          <StatusBadge key={w} tone={WAIT_TONE[w] ?? "neutral"}>
            {w}待ち
          </StatusBadge>
        ))}
        {c.wip ? <StatusBadge tone="info">進行中</StatusBadge> : null}
        {c.codex ? <StatusBadge tone="info">Codex</StatusBadge> : null}
        {overdue ? <StatusBadge tone="bad">期日超過</StatusBadge> : null}
        {!c.id && c.layer === "backlog" ? <StatusBadge tone="warn">ID なし</StatusBadge> : null}
      </div>
      {c.body ? (
        <Collapsible className="flex flex-col gap-1.5">
          <CollapsibleTrigger render={<Button variant="ghost" size="sm" className="self-start" />}>詳細</CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-1.5">
            {c.verify ? <div className="font-mono text-xs text-muted-foreground">検証: {c.verify}</div> : null}
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 font-mono text-xs leading-relaxed text-foreground">{c.body}</pre>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}

/** 年間計画: 月見出しごとに 1 つの表。月の中は期日の早い順 (期日が同じなら台帳の順) */
function AnnualMonths({ cards, today }: { cards: TodoCard[]; today: string }) {
  const months = [...new Set(cards.map((c) => c.month ?? "月なし"))].sort();
  return (
    <>
      {months.map((month) => {
        const inMonth = cards
          .filter((c) => (c.month ?? "月なし") === month)
          .sort((x, y) => (x.due ?? "9999").localeCompare(y.due ?? "9999") || x.line - y.line);
        return (
          <Section key={month} id={`month-${month}`} title={month} count={`${inMonth.length} 件`}>
            {/* 狭い幅で長い ID が列を占めてタスクが押し出されないよう、ID はタスクの列の先頭に置く */}
            <DataTable columns={["期日", "タスク"]}>
              {inMonth.map((c) => (
                <Row key={c.path + c.line}>
                  <Cell nowrap className={isOverdue(c, today) ? "text-negative" : "text-muted-foreground"}>
                    {c.due ?? "—"}
                  </Cell>
                  {/* 待ちの理由と期日超過はタスクの列のバッジで出す (backlog と同じ見せ方) */}
                  <Cell>
                    <div className="flex flex-col gap-1">
                      <span className="break-all font-mono text-xs text-muted-foreground">{c.id ?? "—"}</span>
                      <TodoCardCell c={c} today={today} />
                    </div>
                  </Cell>
                </Row>
              ))}
            </DataTable>
          </Section>
        );
      })}
    </>
  );
}

function ImprovementsGrid({ rows, abs, today }: { rows: ImprovementRow[]; abs: string; today: string }) {
  const groups = [...new Set(rows.map((r) => r.tierLabel))];
  return (
    <DataGrid
      columns={[
        { id: "id", header: "ID", sortable: true, nowrap: true },
        { id: "title", header: "タイトル", sortable: true },
        { id: "tier", header: "区分", sortable: true, nowrap: true },
        { id: "status", header: "Status", sortable: true, nowrap: true },
        { id: "due", header: "Due", sortable: true, nowrap: true },
        { id: "owner", header: "Owner", sortable: true, nowrap: true },
        { id: "metric", header: "Metric", nowrap: true },
      ]}
      rows={rows.map((r) => {
        const overdue = !!r.due && r.due < today;
        return {
          id: r.id,
          cells: [
            <a key="i" href={editorHref(abs, r.line)} className={`${LINK} font-mono text-xs`}>
              {r.id}
            </a>,
            r.title,
            <span key="t" className="text-muted-foreground">
              {r.tierLabel}
            </span>,
            <StatusBadge key="s" tone={r.status === "in-progress" ? "info" : "neutral"}>
              {r.status}
            </StatusBadge>,
            <span key="d" className={overdue ? "text-negative" : "text-muted-foreground"}>
              {r.due}
            </span>,
            <span key="o" className="text-muted-foreground">
              {r.owner}
            </span>,
            <span key="m" className="text-muted-foreground">
              {r.metric}
            </span>,
          ],
          sort: [r.id, r.title, r.tierLabel, r.status, r.due || null, r.owner, null],
          search: `${r.id} ${r.title} ${r.owner} ${r.metric}`,
          facet: r.tierLabel,
          tone: overdue ? ("bad" as const) : undefined,
        };
      })}
      facets={groups.map((g) => ({ value: g, label: g }))}
      searchPlaceholder="ID・タイトル・Owner で絞り込み"
    />
  );
}

export default async function TodoPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;

  // 旧「実行」ファセットの URL は、内部タグで表示を絞らず現在の URL 契約へ正規化する。
  if (q.e) redirect(href(q, { e: undefined }));

  const board = todoBoard();
  const today = new Date().toISOString().slice(0, 10);

  if (board.error) {
    return (
      <>
        <PageHeading title="TODO ボード" source=".claude/todo/" />
        <ErrorNote error={board.error} />
      </>
    );
  }

  const layer: LayerId = board.layers.some((l) => l.id === q.f) ? (q.f as LayerId) : "backlog";
  const layerMeta = board.layers.find((l) => l.id === layer);
  const layerCards = board.items.filter((c) => c.layer === layer);
  // 種類タグを持つのは backlog だけ。他層で空の絞り込みを出さない
  const faceted = layer === "backlog";

  const tier = TIERS.some((t) => t.key === q.t) ? (q.t as TierKey) : null;
  const kind = faceted && q.k && layerCards.some((c) => c.kind === q.k) ? q.k : null;
  const wait = faceted && q.w && (q.w === NO_WAIT || board.waits.includes(q.w)) ? q.w : null;

  const byTier = (cs: TodoCard[]) => (tier ? cs.filter((c) => tierKey(c) === tier) : cs);
  const byKind = (cs: TodoCard[]) => (kind ? cs.filter((c) => c.kind === kind) : cs);
  const byWait = (cs: TodoCard[]) =>
    wait ? cs.filter((c) => (wait === NO_WAIT ? c.waits.length === 0 : c.waits.includes(wait))) : cs;

  // 各軸のスコープ＝自分以外の絞り込みだけを当てた集合
  const tierScope = byKind(byWait(layerCards));
  const kindScope = byTier(byWait(layerCards));
  const waitScope = byTier(byKind(layerCards));
  const tierCounts = countBy(tierScope, tierKey);
  const kindCounts = countBy(kindScope, (c) => c.kind);
  const waitCounts = countWaits(waitScope);
  const items = byTier(tierScope);

  const now: Query = {
    f: layer === "backlog" ? undefined : layer,
    t: tier ?? undefined,
    k: kind ?? undefined,
    w: wait ?? undefined,
  };

  // 語彙の宣言順で並べる (件数順にすると押すたびに行が動く)。待ちなしは最後
  const kindKeys = board.kinds.filter((k) => kindCounts.has(k) || kind === k);
  const waitKeys = [...board.waits, NO_WAIT].filter((w) => waitCounts.has(w) || wait === w);
  const overdueCount = items.filter((c) => isOverdue(c, today)).length;
  const tierLabel = new Map(TIERS.map((t) => [t.key, t]));
  // 優先度の宣言順 (高 → 未設定) に並べる。同じ優先度の中は台帳の順のまま
  const byTierOrder = (cs: TodoCard[]) => [...cs].sort((x, y) => (TIER_ORDER.get(tierKey(x)) ?? 0) - (TIER_ORDER.get(tierKey(y)) ?? 0));

  return (
    <>
      <PageHeading title="TODO ボード" source=".claude/todo/ (構文の正典: todo-standards.md・doboku-note と統一)" accessLabel="読み取り専用。編集はタイトルのリンクからエディタで開く" />

      <Section
        title={LAYER_TITLES[layer]}
        count={`${layerMeta?.count ?? 0} 件`}
        note={
          layerMeta ? (
            <a href={editorHref(layerMeta.abs, 1)} className={LINK} title={layerMeta.rel}>
              {layerMeta.file} を開く{layerMeta.updated ? ` (更新 ${layerMeta.updated})` : ""}
            </a>
          ) : undefined
        }
      >
        <p className="text-xs text-muted-foreground">{LAYER_HINTS[layer]}</p>
      </Section>

      {layer === "annual" ? (
        <>
          <Grid min="sm">
            <StatCard label="カード" icon={<ListTodoIcon />} value={layerCards.length} sub={`${new Set(layerCards.map((c) => c.month)).size} か月`} />
            <StatCard label="期日超過" icon={<CalendarClockIcon />} value={layerCards.filter((c) => isOverdue(c, today)).length} tone={layerCards.some((c) => isOverdue(c, today)) ? "bad" : "good"} />
          </Grid>
          <AnnualMonths cards={layerCards} today={today} />
        </>
      ) : layer === "improvements" ? (
        <>
          <Grid min="sm">
            <StatCard label="施策" icon={<ListTodoIcon />} value={board.improvements.length} />
            <StatCard
              label="期日超過"
              icon={<CalendarClockIcon />}
              value={board.improvements.filter((r) => r.due && r.due < today).length}
              tone={board.improvements.some((r) => r.due && r.due < today) ? "bad" : "good"}
            />
          </Grid>
          <p className="text-xs text-muted-foreground">improvement-triage の排他 write。効果測定項目の 6 列テーブル (v3-unified カードの対象外)。</p>
          <ImprovementsGrid rows={board.improvements} abs={layerMeta?.abs ?? ""} today={today} />
        </>
      ) : (
        <>
          <Grid min="sm">
            <StatCard label="表示中のカード" icon={<ListTodoIcon />} value={items.length} sub={`この台帳 ${layerCards.length} 件`} />
            <StatCard
              label="優先度 高"
              icon={<CircleAlertIcon />}
              value={items.filter((c) => c.tier === "high").length}
              tone={items.some((c) => c.tier === "high") ? "warn" : "neutral"}
            />
            <StatCard label="期日超過" icon={<CalendarClockIcon />} value={overdueCount} tone={overdueCount ? "bad" : "good"} />
            <StatCard
              label="不具合"
              icon={<BugIcon />}
              value={items.filter((c) => c.kind === "不具合").length}
              tone={items.some((c) => c.kind === "不具合") ? "bad" : "good"}
            />
          </Grid>

          <div className="flex flex-col gap-2">
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
              }))}
            />
            {faceted ? (
              <Facet
                title="種類"
                param="k"
                now={now}
                active={kind}
                total={kindScope.length}
                items={kindKeys.map((v) => ({ key: v, label: v, count: kindCounts.get(v) ?? 0 }))}
              />
            ) : null}
            {faceted ? (
              <Facet
                title="待ち"
                param="w"
                now={now}
                active={wait}
                total={waitScope.length}
                items={waitKeys.map((v) => ({ key: v, label: v === NO_WAIT ? "なし" : v, count: waitCounts.get(v) ?? 0 }))}
              />
            ) : null}
            {tier || kind || wait ? (
              <Link href={href({}, { f: now.f })} className={`${LINK} self-start text-xs`}>
                すべて解除
              </Link>
            ) : null}
          </div>

          <DataGrid
            columns={[
              { id: "tier", header: "優先度", sortable: true, nowrap: true },
              { id: "id", header: "ID", sortable: true, nowrap: true },
              { id: "title", header: "タスク" },
              { id: "due", header: "期日", sortable: true, nowrap: true },
            ]}
            rows={byTierOrder(items).map((c) => {
              const t = tierLabel.get(tierKey(c));
              const overdue = isOverdue(c, today);
              return {
                id: c.path + c.line,
                cells: [
                  <StatusBadge key="t" tone={t?.tone ?? "neutral"}>
                    {t?.label ?? "未設定"}
                  </StatusBadge>,
                  <span key="i" className="font-mono text-xs text-muted-foreground">
                    {c.id ?? "—"}
                  </span>,
                  <TodoCardCell key="c" c={c} today={today} />,
                  <span key="d" className={overdue ? "text-negative" : "text-muted-foreground"}>
                    {c.due ?? "—"}
                  </span>,
                ],
                sort: [TIER_ORDER.get(tierKey(c)) ?? null, c.id, null, c.due],
                search: `${c.id ?? ""} ${c.title} ${c.kind ?? ""} ${c.waits.join(" ")}`,
                tone: overdue ? ("bad" as const) : undefined,
              };
            })}
            searchPlaceholder="ID・タスク名で絞り込み"
            empty="該当するカードはありません。"
          />
        </>
      )}
    </>
  );
}
