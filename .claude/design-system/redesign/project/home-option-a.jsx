/* Home Option A — 整理改善 (低リスク)
   - h1 を text-2xl → 44px に
   - "1,800以上の統計" を 4-stat バナーに昇格
   - 「3つの切り口」を本当に3つ (現行は2つ)
   - 注目ランキングをカード化 (現行は FeaturedRankings コンポーネント)
   - 新着記事に「タイトル+メタ」を表示 (現行はサムネのみ) */

function HomeOptionA() {
  return (
    <div className="page" style={{ background: "#fff" }}>
      {/* Hero */}
      <section style={{
        padding: "60px 24px 50px", position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, #eff6ff 0%, #fff 50%, #faf5ff 100%)",
      }}>
        <div style={{ maxWidth: 920, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: 12, color: "var(--primary)" }}>stats47 ─ 47都道府県データ</div>
          <h1 style={{
            fontSize: 48, fontWeight: 800, letterSpacing: "-0.02em",
            margin: 0, lineHeight: 1.15,
          }}>
            あなたの県は<span style={{ color: "var(--primary)", position: "relative" }}>
              何位？
              <svg style={{ position: "absolute", width: "100%", height: 10, bottom: -4, left: 0, opacity: 0.3 }} viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5 L 100 10 L 0 10 Z" fill="currentColor" />
              </svg>
            </span>
          </h1>
          <p style={{ fontSize: 16, color: "var(--muted)", margin: "16px 0 24px", lineHeight: 1.65 }}>
            年収・人口・消費から教育・医療まで、<strong style={{ color: "var(--fg)" }}>1,800以上の統計</strong>で47都道府県をランキング。
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            <button className="btn btn-primary" style={{ padding: "10px 18px", fontSize: 14 }}>
              {React.cloneElement(Icons.Trend, { className: "icon" })}
              ランキングを見る
            </button>
            <button className="btn" style={{ padding: "10px 18px", fontSize: 14 }}>
              {React.cloneElement(Icons.Search, { className: "icon" })}
              キーワードで探す
            </button>
          </div>

          {/* Stats banner */}
          <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, maxWidth: 720, margin: "32px auto 0" }}>
            {HOME_STATS.map((s, i) => (
              <div key={i} style={{
                padding: 14, borderRadius: 12,
                background: "rgba(255,255,255,0.7)",
                border: "1px solid var(--border)",
                backdropFilter: "blur(4px)",
              }}>
                <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: "var(--primary)" }}>
                  {s.value}<span style={{ fontSize: 14 }}>{s.suffix}</span>
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured rankings */}
      <section style={{ padding: "40px 24px", background: "#fafbfc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="between" style={{ marginBottom: 16 }}>
            <div>
              <h2 className="h2" style={{ fontSize: 22 }}>⭐️ 注目のランキング</h2>
              <p className="muted" style={{ fontSize: 12, margin: "4px 0 0" }}>編集部が選んだ今月の注目ランキング</p>
            </div>
            <a href="#" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>すべて見る →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {HOME_FEATURED.map(r => <FeaturedHomeCard key={r.key} r={r} />)}
          </div>
        </div>
      </section>

      {/* 3つの切り口 — actually 3 */}
      <section style={{ padding: "40px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 className="h2" style={{ fontSize: 22, marginBottom: 16 }}>3つの切り口でデータを探す</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { icon: "📊", title: "ランキングで探す", desc: "1,800以上のランキングを地図・表で比較。CSVダウンロードも可", color: "#1d4ed8" },
              { icon: "📍", title: "都道府県で探す", desc: "あなたの県のKPI・チャートで、全国での立ち位置をひと目で把握", color: "#0f766e" },
              { icon: "🔬", title: "テーマで探す", desc: "人口動態・高齢化・観光など、テーマ別にダッシュボードで横断分析", color: "#7c3aed" },
            ].map((c, i) => (
              <a key={i} href="#" className="card" style={{
                padding: 0, textDecoration: "none", color: "var(--fg)",
                display: "flex", flexDirection: "column", overflow: "hidden",
                transition: "all .15s",
              }}>
                <div style={{
                  height: 140, background: `linear-gradient(135deg, ${c.color}33, ${c.color}11)`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56,
                }}>{c.icon}</div>
                <div style={{ padding: 18 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{c.title}</div>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>{c.desc}</p>
                  <div style={{ marginTop: 10, fontSize: 12, color: c.color, fontWeight: 600 }}>探す →</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Latest articles — with titles */}
      <section style={{ padding: "40px 24px", background: "#fafbfc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="between" style={{ marginBottom: 16 }}>
            <h2 className="h2" style={{ fontSize: 22 }}>統計ブログ</h2>
            <a href="#" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>すべての記事 →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {HOME_ARTICLES.map(a => (
              <a key={a.slug} href="#" className="card" style={{
                padding: 0, textDecoration: "none", color: "var(--fg)",
                overflow: "hidden", display: "flex", flexDirection: "column",
              }}>
                <div style={{ aspectRatio: "1200/630", background: a.thumb }} />
                <div style={{ padding: 12 }}>
                  <span className="pill" style={{ marginBottom: 4 }}>{a.category}</span>
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.4, marginTop: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{a.title}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>{a.date}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <div style={{ padding: "20px 24px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div className="div-label" style={{ marginBottom: 8 }}>広告</div>
        <AdSlot height={120} label="" />
      </div>
    </div>
  );
}

window.HomeOptionA = HomeOptionA;
