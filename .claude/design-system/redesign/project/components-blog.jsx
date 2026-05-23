/* Shared components & content for stats47 blog redesign options. */

const { useState: useStateBlog, useMemo: useMemoBlog } = React;

// ---------- Sample article content (stats47-ish) ----------
const ARTICLE = {
  slug: "tokyo-population-trend-2024",
  title: "東京都の人口推移と一極集中の現状",
  subtitle: "2024年データで読み解く、47都道府県の人口動態と地方の人口減少",
  publishedAt: "2025-04-12",
  updatedAt: "2025-05-02",
  author: "stats47 編集部",
  reviewedBy: "山田 太郎（人口学）",
  readingMinutes: 7,
  category: "人口・世帯",
  tags: ["人口", "東京都", "都市集中", "地方創生"],
  toc: [
    { id: "s1", title: "東京都の人口は今どこに?", anchor: "#s1", depth: 1 },
    { id: "s2", title: "上位3都府県に集中する人口", anchor: "#s2", depth: 1 },
    { id: "s3", title: "人口減少が加速する地方の現状", anchor: "#s3", depth: 1 },
    { id: "s3-1", title: "減少率トップは秋田県", anchor: "#s3-1", depth: 2 },
    { id: "s3-2", title: "地方都市の二極化", anchor: "#s3-2", depth: 2 },
    { id: "s4", title: "今後の予測と政策の方向性", anchor: "#s4", depth: 1 },
    { id: "s5", title: "まとめ", anchor: "#s5", depth: 1 },
  ],
  related: [
    { slug: "regional-decline", title: "地方衰退の構造的要因 ─ 47都道府県データで見る課題", date: "2025-03-28", tags: ["地方創生", "人口"] },
    { slug: "tokyo-concentration", title: "東京一極集中はなぜ進むのか — 人口・経済・産業の3視点", date: "2025-03-15", tags: ["東京都", "経済"] },
    { slug: "akita-population", title: "秋田県の人口減少率はなぜ全国最大なのか", date: "2025-02-20", tags: ["秋田県", "人口"] },
    { slug: "city-vs-rural", title: "都市と地方で異なる年齢構成のリアル", date: "2025-02-05", tags: ["人口", "高齢化"] },
    { slug: "metro-areas-ranking", title: "三大都市圏ランキング 2024 ─ 人口・GDP・通勤率", date: "2025-01-30", tags: ["都市圏"] },
  ],
  relatedRankings: [
    { key: "population", title: "総人口", unit: "人" },
    { key: "population-density", title: "人口密度", unit: "人/km²" },
    { key: "population-change", title: "人口増減率", unit: "％" },
    { key: "aging-rate", title: "高齢化率", unit: "％" },
  ],
  books: [
    { title: "人口減少社会のデザイン", author: "広井良典", price: "¥1,980", thumb: "linear-gradient(135deg, #fde68a, #f59e0b)" },
    { title: "地方消滅 ─ 東京一極集中が招く人口急減", author: "増田寛也 編著", price: "¥902", thumb: "linear-gradient(135deg, #bfdbfe, #3b82f6)" },
    { title: "未来の年表 ─ 人口減少日本でこれから起きること", author: "河合雅司", price: "¥880", thumb: "linear-gradient(135deg, #fbcfe8, #ec4899)" },
  ],
};

// ---------- Article body (HTML-ish JSX) ----------
function ArticleBody() {
  return (
    <article className="prose">
      <p>2024年10月時点で東京都の人口は<strong>約1,401万人</strong>に達し、全国合計の約11.3%を1都が占める計算になります。一方、最も人口の少ない鳥取県は約53万人。<strong>東京都は鳥取県のおよそ26倍</strong>の人口を抱えています。</p>

      <h2 id="s1">東京都の人口は今どこに?</h2>
      <p>都道府県別人口は上位ほど近接しています。2位の神奈川県（924万人）、3位の大阪府（878万人）、4位の愛知県（749万人）と続き、上位5都府県で全国の約36%を占める集中度の高い構造になっています。</p>

      <FigureChart />

      <h2 id="s2">上位3都府県に集中する人口</h2>
      <p>東京都・神奈川県・大阪府の人口の合計は約3,212万人で、全国人口の<strong>約25.9%</strong>を占めます。これは「上位3都府県だけで日本人の4人に1人が住んでいる」計算であり、人口集中の度合いを端的に表す数字です。</p>
      <Callout type="info">
        <strong>用語</strong>：「人口集中」は地理学・人口学の文脈で、一定の指標値（例：上位X地域の人口シェア）で測定されます。米国センサスでは「都市圏」が同様の概念に該当します。
      </Callout>

      <h2 id="s3">人口減少が加速する地方の現状</h2>
      <p>全国の人口減少が顕在化する一方で、地域間の格差は拡大しています。2010年から2024年にかけて、人口が増加したのは東京都・沖縄県を含む数県のみで、ほとんどの道府県で減少しています。</p>

      <h3 id="s3-1">減少率トップは秋田県</h3>
      <p>2010年比で人口減少率が最も大きいのは<strong>秋田県（▲14.5%）</strong>。次いで青森県（▲12.8%）、岩手県（▲10.6%）と東北各県が続きます。これは少子化に加え、進学・就職に伴う若年層の県外流出が大きな要因となっています。</p>

      <h3 id="s3-2">地方都市の二極化</h3>
      <p>地方の中でも、福岡県（+0.4%）・沖縄県（+2.7%）など人口が維持・微増している地域と、東北・四国の人口急減地域とで二極化が進んでいます。中核市レベルでの「ミニ集中」も観察され、県内格差も拡大しています。</p>

      <h2 id="s4">今後の予測と政策の方向性</h2>
      <p>国立社会保障・人口問題研究所の推計によれば、2050年時点で東京都の人口は約1,398万人（2024年比でほぼ横ばい）、秋田県は約60万人（同▲36%）と予測されています。</p>

      <h2 id="s5">まとめ</h2>
      <p>東京都の人口集中は、相対的にはこれからも継続が見込まれます。地方圏の人口維持には、若年層が定着する就業・教育環境の整備が不可欠です。</p>
    </article>
  );
}

// Inline figure: a simple bar chart
function FigureChart() {
  const data = [
    ["東京", 1401, "#1d4ed8"],
    ["神奈川", 924, "#3b82f6"],
    ["大阪", 878, "#60a5fa"],
    ["愛知", 749, "#93c5fd"],
    ["埼玉", 733, "#93c5fd"],
    ["千葉", 628, "#bfdbfe"],
    ["…", 0, "transparent"],
    ["鳥取", 53, "#94a3b8"],
  ];
  const max = 1500;
  return (
    <figure style={{
      margin: "20px 0 24px",
      padding: 16,
      border: "1px solid var(--border)",
      borderRadius: 10,
      background: "var(--bg-subtle)",
    }}>
      <figcaption style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>
        Fig.1 — 都道府県別 総人口 (万人 / 2024年)
      </figcaption>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.map(([name, val, color], i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px", alignItems: "center", gap: 10, fontSize: 12 }}>
            <span style={{ color: name === "東京" ? "var(--primary)" : "var(--fg-2)", fontWeight: name === "東京" ? 700 : 500 }}>{name}</span>
            <div style={{ height: 14, background: "#fff", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${(val / max) * 100}%`, height: "100%", background: color, transition: "width .3s" }} />
            </div>
            <span className="mono" style={{ textAlign: "right", color: "var(--fg)" }}>
              {val ? `${val.toLocaleString()} 万` : ""}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: "var(--muted)" }}>
        出典: 総務省統計局「人口推計」(2024年10月1日時点)
      </div>
    </figure>
  );
}

function Callout({ type = "info", children }) {
  const palette = {
    info: { bg: "#eff6ff", border: "#bfdbfe", icon: "💡", text: "#1e3a8a" },
    warn: { bg: "#fef3c7", border: "#fcd34d", icon: "⚠️", text: "#92400e" },
  }[type] || {};
  return (
    <aside style={{
      background: palette.bg, border: `1px solid ${palette.border}`,
      borderLeft: `3px solid ${palette.border}`,
      borderRadius: 8, padding: "10px 14px",
      margin: "16px 0", fontSize: 13.5,
      color: palette.text, lineHeight: 1.6,
    }}>
      {children}
    </aside>
  );
}

// ---------- Common UI ----------
function Tag({ children, color = "default" }) {
  const c = {
    default: { bg: "var(--bg-muted)", fg: "var(--muted)" },
    primary: { bg: "var(--primary-50)", fg: "var(--primary)" },
  }[color];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 11, fontWeight: 600,
      padding: "3px 8px", borderRadius: 999,
      background: c.bg, color: c.fg,
    }}>#{children}</span>
  );
}

function MetaRow({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, color: "var(--muted)", fontSize: 12.5 }}>
      {children}
    </div>
  );
}

function MetaItem({ icon, children }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {icon && React.cloneElement(icon, { className: "icon icon-sm" })}
      {children}
    </span>
  );
}

// Related rankings card list (small)
function RelatedRankingsCard({ items, compact = false }) {
  return (
    <div className="card">
      <div className="card-header" style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {React.cloneElement(Icons.Trend, { className: "icon", style: { color: "var(--primary)" } })}
          <div className="h3">関連ランキング</div>
        </div>
      </div>
      <div className="card-body" style={{ padding: 6 }}>
        <div className="side-list">
          {items.map((r, i) => (
            <a key={i} href="#">
              <span>{r.title}</span>
              <span className="meta">{r.unit}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// Related articles compact list
function RelatedArticlesCompact({ articles }) {
  return (
    <div className="card">
      <div className="card-header" style={{ padding: "12px 14px" }}>
        <div className="h3">関連記事</div>
      </div>
      <div className="card-body" style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
        {articles.slice(0, 5).map((a) => (
          <a key={a.slug} href="#" style={{
            display: "block",
            padding: "8px 10px", borderRadius: 6,
            border: "1px solid var(--border)",
            textDecoration: "none",
            color: "var(--fg)",
            transition: "background .15s",
          }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-subtle)"}
             onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <div style={{
              fontSize: 12.5, fontWeight: 500, lineHeight: 1.4,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            }}>{a.title}</div>
            <div style={{ display: "flex", gap: 4, marginTop: 4, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{a.date}</span>
              {a.tags?.slice(0, 1).map((t) => <Tag key={t}>{t}</Tag>)}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// Book card (affiliate)
function BookCard({ book, compact = false }) {
  return (
    <a href="#" style={{
      display: "flex", gap: 10, padding: 10,
      border: "1px solid var(--border)", borderRadius: 8,
      background: "var(--bg)", textDecoration: "none",
      color: "var(--fg)",
    }}>
      <div style={{
        width: compact ? 44 : 56, height: compact ? 60 : 76,
        background: book.thumb, borderRadius: 4,
        boxShadow: "var(--shadow-sm)", flexShrink: 0,
      }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
          <span style={{ fontSize: 10, padding: "1px 5px", background: "var(--bg-muted)", color: "var(--muted)", borderRadius: 3, fontWeight: 600 }}>PR</span>
          <span style={{ fontSize: 10.5, color: "var(--muted)" }}>Amazon</span>
        </div>
        <div style={{
          fontSize: compact ? 12 : 13, fontWeight: 600, lineHeight: 1.35,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{book.title}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{book.author}</div>
        <div style={{ fontSize: 12, color: "var(--danger)", fontWeight: 700, marginTop: 2 }}>{book.price}</div>
      </div>
    </a>
  );
}

Object.assign(window, {
  ARTICLE, ArticleBody, FigureChart, Callout,
  Tag, MetaRow, MetaItem,
  RelatedRankingsCard, RelatedArticlesCompact, BookCard,
});
