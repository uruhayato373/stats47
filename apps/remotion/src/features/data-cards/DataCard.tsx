import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BRAND as C } from '../../../../web/src/features/ogp/brand';
import { useBuzzMapFonts } from '../buzz-map/useBuzzMapFonts';
import { TileChange } from './TileChange';
import {
  dataCardPropsSchema,
  rankLabelPositions,
  type DataCard as Card,
  type DataCardProps,
} from './model';

const fmt = (v: number) =>
  v.toLocaleString('ja-JP', { maximumFractionDigits: 6 });
const shortSource = (card: Card) =>
  [...new Set(card.sources.map((s) => s.name))].join('、');
const Header = ({ tag }: { tag: string }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 25,
    }}
  >
    <strong style={{ fontSize: 42, letterSpacing: -2 }}>stats47</strong>
    <span style={{ color: C.muted }}>{tag}</span>
  </div>
);
const Footer = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 48,
      left: 64,
      right: 64,
      fontSize: 23,
      lineHeight: 1.6,
      color: C.muted,
      borderTop: `2px solid ${C.line}`,
      paddingTop: 16,
    }}
  >
    {children}
  </div>
);
const Shell = ({
  children,
  background = C.white,
}: {
  children: React.ReactNode;
  background?: string;
}) => (
  <AbsoluteFill
    style={{
      background,
      fontFamily: 'BuzzMapSans, sans-serif',
      color: C.ink,
      padding: 64,
    }}
  >
    {children}
  </AbsoluteFill>
);

function Receipt({
  card,
}: {
  card: Extract<Card, { kind: 'household-receipt' }>;
}) {
  return (
    <Shell background={C.wash}>
      <Header tag={`暮らしの明細 / ${card.areaName}`} />
      <div
        style={{
          position: 'absolute',
          left: 104,
          right: 104,
          top: 164,
          bottom: 170,
          background: C.white,
          padding: '30px 54px 52px',
          clipPath:
            'polygon(0 0,100% 0,100% 98%,96% 100%,92% 98%,88% 100%,84% 98%,80% 100%,76% 98%,72% 100%,68% 98%,64% 100%,60% 98%,56% 100%,52% 98%,48% 100%,44% 98%,40% 100%,36% 98%,32% 100%,28% 98%,24% 100%,20% 98%,16% 100%,12% 98%,8% 100%,4% 98%,0 100%)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            fontSize: 54,
            fontWeight: 700,
            lineHeight: 1.35,
            letterSpacing: -2,
            whiteSpace: 'pre-line',
          }}
        >
          {card.title}
        </div>
        <div
          style={{
            textAlign: 'center',
            fontSize: 25,
            lineHeight: 1.5,
            color: C.muted,
            marginTop: 15,
          }}
        >
          {card.period}
          <br />
          {card.scope}
        </div>
        <div
          style={{
            borderTop: `2px dashed ${C.line}`,
            marginTop: 20,
            paddingTop: 17,
          }}
        >
          {card.rows.map((r) => (
            <div
              key={r.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                fontSize: 31,
                lineHeight: 1.35,
                padding: '2px 0',
              }}
            >
              <span>{r.label}</span>
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fmt(r.value)}
                <span style={{ fontSize: 24, marginLeft: 8, fontWeight: 400 }}>
                  {r.unit}
                </span>
              </strong>
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderTop: `3px solid ${C.ink}`,
            paddingTop: 17,
            marginTop: 16,
          }}
        >
          <strong style={{ fontSize: 28 }}>消費支出 / 月</strong>
          <strong style={{ fontSize: 76, letterSpacing: -3 }}>
            {fmt(card.total)}
            <span style={{ fontSize: 30, marginLeft: 8 }}>円</span>
          </strong>
        </div>
        <div
          style={{
            fontSize: 22,
            color: C.muted,
            lineHeight: 1.65,
            marginTop: 10,
          }}
        >
          {card.notes.map((note) => (
            <div key={note}>{note}</div>
          ))}
        </div>
      </div>
      <Footer>
        出典：{shortSource(card)}
        <br />
        {card.period}　/　stats47.jp
      </Footer>
    </Shell>
  );
}
function Atlas({ card }: { card: Extract<Card, { kind: 'area-atlas' }> }) {
  return (
    <Shell background={C.paper}>
      <Header tag={`地域のデータアトラス / ${card.areaCode.slice(0, 2)}`} />
      <div style={{ position: 'absolute', left: 64, top: 192 }}>
        <div style={{ fontSize: 26, letterSpacing: 6, color: C.primary }}>
          PREFECTURE FILE
        </div>
        <div
          style={{
            fontSize: 112,
            fontWeight: 700,
            letterSpacing: -6,
            marginTop: 7,
          }}
        >
          {card.areaName}
        </div>
        <div style={{ fontSize: 38, lineHeight: 1.65, marginTop: 16 }}>
          ひとつの県を、
          <br />
          4つの数字で読む。
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 78,
          top: 176,
          width: 320,
          height: 340,
        }}
      >
        <svg width="320" height="320" viewBox="0 0 320 320">
          <path d={card.shape} fill={C.primary} />
        </svg>
        <div
          style={{
            textAlign: 'center',
            fontSize: 21,
            color: C.muted,
            marginTop: 5,
          }}
        >
          {card.shapeNote}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 64,
          right: 64,
          top: 604,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          borderTop: `3px solid ${C.ink}`,
          borderBottom: `3px solid ${C.ink}`,
        }}
      >
        {card.rows.map((a, i) => (
          <div
            key={a.key}
            style={{
              padding: '28px 24px',
              height: 244,
              boxSizing: 'border-box',
              borderRight: i % 2 === 0 ? `2px solid ${C.line}` : undefined,
              borderBottom: i < 2 ? `2px solid ${C.line}` : undefined,
            }}
          >
            <div style={{ fontSize: 29, color: C.muted }}>{a.label}</div>
            <div
              style={{
                fontSize: fmt(a.value).length > 9 ? 47 : 57,
                fontWeight: 700,
                lineHeight: 1.8,
                letterSpacing: -2,
                whiteSpace: 'nowrap',
              }}
            >
              {fmt(a.value)}
              <span
                style={{
                  fontSize: 27,
                  marginLeft: 8,
                  fontWeight: 400,
                  letterSpacing: 0,
                }}
              >
                {a.unit.normalize('NFKC')}
              </span>
            </div>
            <div style={{ fontSize: 24, color: C.muted }}>
              {a.year}　/　県全域
            </div>
          </div>
        ))}
      </div>
      <Footer>
        出典：{shortSource(card)}
        <br />
        項目ごとの対象年を併記　/　stats47.jp{card.canonicalPath}
      </Footer>
    </Shell>
  );
}
function RankRoutes({
  card,
}: {
  card: Extract<Card, { kind: 'rank-routes' }>;
}) {
  const colors = [C.primary, C.ink, C.muted, C.vermilion];
  const maxRank = Math.max(
    ...card.routes.flatMap((r) => [r.before.rank, r.after.rank])
  );
  const y = (rank: number) =>
    52 + ((rank - 1) / Math.max(1, maxRank - 1)) * 470;
  const beforeLabels = rankLabelPositions(
    card.routes.map((r) => r.before.rank),
    y
  );
  const afterLabels = rankLabelPositions(
    card.routes.map((r) => r.after.rank),
    y
  );
  const ranks = [
    ...new Set([
      1,
      ...card.routes.flatMap((r) => [r.before.rank, r.after.rank]),
    ]),
  ].sort((a, b) => a - b);
  return (
    <Shell>
      <Header tag="順位の乗り換え図" />
      <div
        style={{
          fontSize: card.title.length > 37 ? 48 : 62,
          fontWeight: 700,
          lineHeight: 1.45,
          letterSpacing: -2,
          marginTop: 40,
          whiteSpace: 'pre-line',
        }}
      >
        {card.title}
      </div>
      <div
        style={{ fontSize: 28, color: C.muted, lineHeight: 1.6, marginTop: 17 }}
      >
        {card.scope}
        <br />
        47地域の順位から{card.routes.length}地域を抜粋・
        {card.direction === 'descending'
          ? '支出額が多い順'
          : '支出額が少ない順'}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 43,
          fontWeight: 700,
          position: 'absolute',
          top: 463,
          left: 68,
          right: 68,
        }}
      >
        {card.beforeYear}
        <span>{card.afterYear}</span>
      </div>
      <svg
        width="952"
        height="606"
        viewBox="0 0 952 606"
        style={{ position: 'absolute', left: 64, top: 535 }}
      >
        {ranks.map((rank) => (
          <g key={rank}>
            <line
              x1="220"
              x2="665"
              y1={y(rank)}
              y2={y(rank)}
              stroke={C.wash}
              strokeWidth="2"
            />
            <text
              x="457"
              y={y(rank) - 8}
              textAnchor="middle"
              fontSize="18"
              fill={C.muted}
            >
              {rank}位
            </text>
          </g>
        ))}
        {card.routes.map((r, i) => (
          <g key={r.code}>
            <path
              d={`M245 ${y(r.before.rank)} C390 ${y(r.before.rank)} 510 ${y(r.after.rank)} 652 ${y(r.after.rank)}`}
              stroke={colors[i]}
              strokeWidth={i === 0 ? 9 : 6}
              fill="none"
            />
            <path
              d={`M220 ${beforeLabels[i]} L245 ${y(r.before.rank)} M652 ${y(r.after.rank)} L677 ${afterLabels[i]}`}
              stroke={colors[i]}
              fill="none"
              strokeWidth="2"
            />
            <circle
              cx="245"
              cy={y(r.before.rank)}
              r="9"
              fill={C.white}
              stroke={colors[i]}
              strokeWidth="4"
            />
            <circle
              cx="652"
              cy={y(r.after.rank)}
              r="9"
              fill={C.white}
              stroke={colors[i]}
              strokeWidth="4"
            />
            <text
              x="0"
              y={beforeLabels[i] - 6}
              fill={colors[i]}
              fontSize="29"
              fontWeight="700"
            >
              {r.before.rank}位 {r.name}
            </text>
            <text x="0" y={beforeLabels[i] + 24} fill={C.muted} fontSize="24">
              {fmt(r.before.value)} {card.unit}
            </text>
            <text
              x="687"
              y={afterLabels[i] - 6}
              fill={colors[i]}
              fontSize="29"
              fontWeight="700"
            >
              {r.after.rank}位 {r.name}
            </text>
            <text x="687" y={afterLabels[i] + 24} fill={C.muted} fontSize="24">
              {fmt(r.after.value)} {card.unit}
            </text>
          </g>
        ))}
      </svg>
      <Footer>
        出典：{shortSource(card)}　{card.beforeYear}・{card.afterYear}
        <br />
        {card.notes.map((note) => (
          <div key={note}>{note}</div>
        ))}
      </Footer>
    </Shell>
  );
}
function CarouselPage({
  card,
  slide,
}: {
  card: Card;
  slide: 'cover' | 'source';
}) {
  const cover = slide === 'cover';
  return (
    <Shell background={C.paper}>
      <Header tag={cover ? 'データで読む、地域の暮らし' : '出典と読み方'} />
      <div
        style={{
          fontSize:
            cover &&
            Math.max(...card.title.split('\n').map((line) => line.length)) < 20
              ? 76
              : 58,
          fontWeight: 700,
          whiteSpace: 'pre-line',
          lineHeight: 1.5,
          marginTop: 100,
        }}
      >
        {cover ? card.title : '数字の背景まで、\n確かめる。'}
      </div>
      <div
        style={{ fontSize: 32, lineHeight: 1.7, marginTop: 52, color: C.muted }}
      >
        {card.scope}
        <br />
        {card.kind === 'household-receipt'
          ? card.period
          : card.kind === 'rank-routes' || card.kind === 'tile-change'
            ? `${card.beforeYear} → ${card.afterYear}`
            : 'それぞれの項目に対象年を表示'}
      </div>
      {cover ? (
        <div
          style={{
            marginTop: 100,
            borderTop: `3px solid ${C.primary}`,
            paddingTop: 40,
            fontSize: 44,
            color: C.primary,
            fontWeight: 700,
          }}
        >
          スワイプして、データを見る →
        </div>
      ) : (
        <div style={{ marginTop: 40, fontSize: 29, lineHeight: 1.8 }}>
          <div>出典：{shortSource(card)}</div>
          {card.notes.map((note) => (
            <div key={note} style={{ marginTop: 15 }}>
              {note}
            </div>
          ))}
        </div>
      )}
      <Footer>
        {cover
          ? '保存して、地域の違いを見比べよう。'
          : '詳しいデータと出典リンクは、プロフィールのリンクから。'}
        <br />
        stats47.jp{card.canonicalPath}
      </Footer>
    </Shell>
  );
}
export function DataCard(props: DataCardProps) {
  useBuzzMapFonts();
  const { card, slide } = dataCardPropsSchema.parse(props);
  if (!card)
    return (
      <Shell>
        <Header tag="SNSデータカード" />
        <p style={{ marginTop: 160, fontSize: 38 }}>
          render-data-card.ts で実データの props.json を生成してください。
        </p>
      </Shell>
    );
  if (slide !== 'detail') return <CarouselPage card={card} slide={slide} />;
  if (card.kind === 'household-receipt') return <Receipt card={card} />;
  if (card.kind === 'area-atlas') return <Atlas card={card} />;
  if (card.kind === 'tile-change') return <TileChange card={card} />;
  return <RankRoutes card={card} />;
}
