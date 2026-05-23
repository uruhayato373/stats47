/* Home Option B — Interactive Map Hero (都道府県起点)
   - メインヒーロー = 大きなインタラクティブ日本地図
   - 「あなたの県を選ぶ」 起点でユーザーを誘導
   - サイドにステータス + クイック検索
   - 下部: テーマナビ → 注目ランキング → 新着 */

function HomeOptionB() {
  return (
    <div className="page" style={{ background: "#fff" }}>
      <section style={{
        padding: "30px 24px",
        background: "linear-gradient(180deg, #f0f4ff 0%, #fff 70%)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 420px", gap: 40, alignItems: "center" }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--primary)" }}>stats47</div>
            <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "8px 0 14px" }}>
              47都道府県を<br/><span style={{ color: "var(--primary)" }}>データで比較</span>する
            </h1>
            <p style={{ fontSize: 15, color: "var(--muted)", margin: "0 0 18px", lineHeight: 1.7, maxWidth: 480 }}>
              年収・人口・観光・教育・医療まで <strong style={{ color: "var(--fg)" }}>1,800以上の統計</strong>を、地図・表・グラフで比較。地図から始めるか、キーワードで探すか、お選びください。
            </p>

            {/* Search box */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 14px", border: "2px solid var(--primary)", borderRadius: 12,
              background: "#fff", boxShadow: "0 8px 24px -12px rgba(29,78,216,0.40)",
              maxWidth: 480,
            }}>
              {React.cloneElement(Icons.Search, { className: "icon", style: { color: "var(--primary)" } })}
              <input placeholder="例: 東京 人口、高齢化率..." style={{
                flex: 1, border: 0, outline: "none", font: "inherit", fontSize: 14, background: "transparent",
              }} />
              <button className="btn btn-primary btn-sm">検索</button>
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span className="muted" style={{ fontSize: 11.5 }}>人気:</span>
              {["東京 人口", "高齢化率", "出生率", "観光客数"].map(t => (
                <a key={t} href="#" style={{ fontSize: 11, padding: "3px 8px", background: "var(--bg-subtle)", borderRadius: 999, color: "var(--fg-2)", textDecoration: "none" }}>{t}</a>
              ))}
            </div>

            {/* Stats */}
            <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, maxWidth: 480 }}>
              {HOME_STATS.map((s, i) => (
                <div key={i}>
                  <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>
                    {s.value}<span style={{ fontSize: 12 }}>{s.suffix}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 10.5, marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive map */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: 20,
            boxShadow: "0 24px 60px -28px rgba(29,78,216,0.25)",
            border: "1px solid var(--border)",
          }}>
            <div className="eyebrow" style={{ textAlign: "center", marginBottom: 4 }}>地図から探す</div>
            <div style={{ fontSize: 15, fontWeight: 700, textAlign: "center", marginBottom: 14 }}>あなたの都道府県をクリック</div>
            <JapanInteractiveMap highlight="13" />
            <div style={{ marginTop: 8, fontSize: 10.5, color: "var(--muted)", textAlign: "center" }}>クリックでその都道府県のデータダッシュボードへ</div>
          </div>
        </div>
      </section>

      {/* Themes */}
      <section style={{ padding: "40px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="between" style={{ marginBottom: 16 }}>
            <div>
              <h2 className="h2" style={{ fontSize: 22 }}>🔬 テーマで探す</h2>
              <p className="muted" style={{ fontSize: 12, margin: "4px 0 0" }}>テーマ別ダッシュボードで横断分析</p>
            </div>
            <a href="#" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>テーマ一覧 →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
            {HOME_THEMES.slice(0, 12).map(t => (
              <a key={t.key} href="#" className="card" style={{
                padding: 14, textAlign: "center",
                textDecoration: "none", color: "var(--fg)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                borderLeft: `3px solid ${t.color}`,
              }}>
                <div style={{ fontSize: 24 }}>{t.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{t.name}</div>
                <div className="muted" style={{ fontSize: 10 }}>{t.count}指標</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Featured rankings */}
      <section style={{ padding: "40px 24px", background: "#fafbfc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="between" style={{ marginBottom: 16 }}>
            <h2 className="h2" style={{ fontSize: 22 }}>⭐️ 注目のランキング</h2>
            <a href="#" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>すべて見る →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {HOME_FEATURED.map(r => <FeaturedHomeCard key={r.key} r={r} />)}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section style={{ padding: "40px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="between" style={{ marginBottom: 16 }}>
            <h2 className="h2" style={{ fontSize: 22 }}>📝 新着ブログ</h2>
            <a href="#" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>すべての記事 →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {HOME_ARTICLES.map(a => (
              <a key={a.slug} href="#" className="card" style={{ padding: 0, textDecoration: "none", color: "var(--fg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ aspectRatio: "1200/630", background: a.thumb }} />
                <div style={{ padding: 12 }}>
                  <span className="pill">{a.category}</span>
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.4, marginTop: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{a.title}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>{a.date}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

window.HomeOptionB = HomeOptionB;
