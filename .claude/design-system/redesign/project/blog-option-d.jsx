/* Blog Option D — データストーリー + ネイティブ収益最大化
   左浮遊シェアレール / 上部 KPI ヒーロー (記事中の主要数字をハイライト)
   本文中にネイティブカード（書籍 / 関連ランキング / メルマガ）を周期的に挿入
   末尾に強烈な「次に読む」+「メルマガ登録」+「広告」のフィナーレ */

function BlogOptionD() {
  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "ブログ" },
          { label: "人口・世帯" }, { label: ARTICLE.title, current: true },
        ]} />
      </div>

      {/* Reading progress (top sticky) */}
      <div style={{ padding: "8px 24px 0", maxWidth: 1280, margin: "0 auto" }}>
        <div className="reading-progress" style={{ height: 3 }}><div style={{ width: "34%" }} /></div>
      </div>

      <div style={{
        padding: "16px 24px 24px", maxWidth: 1280, margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "56px 1fr 300px",
        gap: 20, alignItems: "flex-start",
      }}>
        {/* ★ Floating share rail */}
        <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          <RailBtn icon={Icons.Share} label="X" />
          <RailBtn icon={Icons.Mail} label="LINE" />
          <RailBtn icon={Icons.Bookmark} label="保存" />
          <RailBtn icon={Icons.External} label="URL" />
          <div style={{ height: 12 }} />
          <div style={{
            fontSize: 9, fontWeight: 700,
            writingMode: "vertical-rl", color: "var(--muted)",
            letterSpacing: "0.1em",
          }}>READ 34%</div>
        </aside>

        {/* Main column */}
        <main style={{ minWidth: 0 }}>
          {/* Hero card with KPI strip */}
          <header style={{
            border: "1px solid var(--border)",
            borderRadius: 16,
            background: "#fff",
            padding: 0, overflow: "hidden",
          }}>
            <div style={{
              background: "linear-gradient(135deg, #0b1220, #1e3a8a)",
              color: "#fff", padding: "28px 32px 24px",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", inset: 0, opacity: 0.08, background: "radial-gradient(circle at 30% 50%, #fff, transparent 60%)" }} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,0.18)" }}>{ARTICLE.category}</span>
                {ARTICLE.tags.slice(0, 3).map((t) => (
                  <span key={t} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,0.08)" }}>#{t}</span>
                ))}
              </div>
              <h1 style={{
                fontSize: 30, lineHeight: 1.35, fontWeight: 800,
                letterSpacing: "-0.01em", margin: "0 0 10px",
              }}>{ARTICLE.title}</h1>
              <p style={{ fontSize: 14.5, opacity: 0.8, lineHeight: 1.65, margin: "0 0 14px", maxWidth: 760 }}>{ARTICLE.subtitle}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12, opacity: 0.85 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>編</span>
                  {ARTICLE.author}
                </span>
                <span>監修: {ARTICLE.reviewedBy}</span>
                <span>公開: {ARTICLE.publishedAt}</span>
                <span>更新: {ARTICLE.updatedAt}</span>
                <span>読了: 約{ARTICLE.readingMinutes}分</span>
              </div>
            </div>

            {/* KPI strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid var(--border)" }}>
              {[
                ["全国人口", "1.24億", "人"],
                ["東京都", "1,401万", "人 (1位)"],
                ["秋田県の減少率", "▲14.5", "% (2010→2024)"],
                ["上位3都府県シェア", "25.9", "%"],
              ].map(([k, v, u], i) => (
                <div key={i} style={{
                  padding: "14px 18px",
                  borderRight: i < 3 ? "1px solid var(--border)" : 0,
                }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.04em" }}>{k}</div>
                  <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--fg)", marginTop: 2 }}>{v}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{u}</div>
                </div>
              ))}
            </div>
          </header>

          {/* Article body */}
          <article className="card" style={{ marginTop: 16, padding: "28px 32px" }}>
            <ArticleBody />

            {/* Native injection 1: ranking CTA */}
            <div className="rk-cta" style={{ margin: "8px 0 28px" }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: "var(--primary)", color: "#fff",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>{React.cloneElement(Icons.Trend, { className: "icon icon-lg" })}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>📊 「総人口」ランキングをインタラクティブに見る</div>
                <div className="muted" style={{ fontSize: 12 }}>47都道府県・地図/表/CSV対応 · 6年分の時系列</div>
              </div>
              <a href="#" className="btn btn-primary btn-sm">ランキングへ →</a>
            </div>
          </article>

          {/* Native injection 2: books strip */}
          <section style={{ marginTop: 20 }}>
            <div className="between" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="h2">この記事を深掘りする3冊</div>
                <span className="pill">PR</span>
              </div>
              <a href="#" className="muted" style={{ fontSize: 12, textDecoration: "none" }}>Amazon で見る ›</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {ARTICLE.books.map((b, i) => <BookCard key={i} book={b} />)}
            </div>
          </section>

          {/* In-feed AdSense */}
          <section style={{ marginTop: 20 }}>
            <div className="div-label" style={{ marginBottom: 8 }}>広告</div>
            <AdSlot height={120} label="" />
          </section>

          {/* Native injection 3: related rankings as cards */}
          <section style={{ marginTop: 24 }}>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="h2">記事に登場したデータ</div>
              <a href="#" className="muted" style={{ fontSize: 12, textDecoration: "none" }}>カテゴリ一覧 ›</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {ARTICLE.relatedRankings.map((r, i) => (
                <a key={r.key} href="#" className="card" style={{
                  padding: 14, textDecoration: "none", color: "var(--fg)",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: "var(--primary-50)",
                    color: "var(--primary)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {React.cloneElement([Icons.Users, Icons.Area, Icons.Trend, Icons.Sigma][i] || Icons.Sigma, { className: "icon icon-lg" })}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{r.title}</div>
                    <div className="muted" style={{ fontSize: 11 }}>単位: {r.unit} · 47都道府県</div>
                  </div>
                  {React.cloneElement(Icons.ChevronRight, { className: "icon", style: { color: "var(--muted)" } })}
                </a>
              ))}
            </div>
          </section>

          {/* Newsletter CTA */}
          <section style={{ marginTop: 24, padding: 20, border: "1px solid var(--primary-100)", borderRadius: 14, background: "linear-gradient(135deg, var(--primary-50), #fff)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--primary)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {React.cloneElement(Icons.Mail, { className: "icon icon-lg" })}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--primary)" }}>新着ランキング & 記事を毎週お届け</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>47都道府県のデータが更新されたら、まずメールで。いつでも解除可能。</div>
              </div>
              <input type="email" placeholder="you@example.com" style={{
                padding: "9px 12px", border: "1px solid var(--border)",
                borderRadius: 8, font: "inherit", fontSize: 13, width: 220,
              }} />
              <button className="btn btn-primary">無料で登録</button>
            </div>
          </section>

          {/* Next-up grid */}
          <section style={{ marginTop: 32 }}>
            <div className="between" style={{ marginBottom: 12 }}>
              <div className="h2">この記事を読んだ人はこちらも</div>
              <a href="#" className="muted" style={{ fontSize: 12, textDecoration: "none" }}>すべて ›</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {ARTICLE.related.slice(0, 3).map((a, i) => (
                <a key={a.slug} href="#" className="card" style={{ padding: 14, textDecoration: "none", color: "var(--fg)", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{
                    height: 80, borderRadius: 8,
                    background: [
                      "linear-gradient(135deg, #fde68a, #f59e0b)",
                      "linear-gradient(135deg, #bfdbfe, #1d4ed8)",
                      "linear-gradient(135deg, #fbcfe8, #ec4899)",
                    ][i],
                  }} />
                  <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.4 }}>{a.title}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: "auto" }}>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{a.date}</span>
                    {a.tags.slice(0, 1).map((t) => <Tag key={t}>{t}</Tag>)}
                  </div>
                </a>
              ))}
            </div>
          </section>
        </main>

        {/* Right rail */}
        <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6 }}>
              {React.cloneElement(Icons.Table, { className: "icon icon-sm" })}
              <div className="h3">目次</div>
            </div>
            <nav className="toc" style={{ padding: 6 }}>
              {ARTICLE.toc.slice(0, 6).map((t, i) => (
                <a key={t.id} href={t.anchor} className={(i === 2 ? "active " : "") + "depth-" + t.depth}>
                  {t.title}
                </a>
              ))}
            </nav>
          </div>
          <RelatedRankingsCard items={ARTICLE.relatedRankings} />
          <RelatedArticlesCompact articles={ARTICLE.related} />
          <div className="card" style={{ padding: 10 }}>
            <div className="div-label" style={{ marginBottom: 8, fontSize: 10 }}>広告</div>
            <AdSlot height={250} label="" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function RailBtn({ icon, label }) {
  return (
    <button title={label} style={{
      width: 40, height: 40, borderRadius: 10,
      border: "1px solid var(--border)", background: "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      color: "var(--muted)", cursor: "pointer",
      boxShadow: "var(--shadow-sm)",
    }}>
      {React.cloneElement(icon, { className: "icon" })}
    </button>
  );
}

window.BlogOptionD = BlogOptionD;
