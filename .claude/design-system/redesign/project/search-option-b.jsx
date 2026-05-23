/* Search Option B — 大型ヒーロー + ディスカバリー
   - 空のクエリやブラウズ用に最適化された画面
   - 中央に大きな検索バー + 人気の検索 + トレンディング
   - カテゴリでブラウズ + 注目記事
   - クエリありの状態と空状態を切替可能(ここでは空寄り) */

function SearchOptionB() {
  const [q, setQ] = React.useState("");

  return (
    <div className="page" style={{ background: "linear-gradient(180deg, #f0f4ff 0%, #fff 220px)" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[{ label: "ホーム" }, { label: "検索", current: true }]} />
      </div>

      {/* HERO search */}
      <header style={{ padding: "30px 24px 12px", textAlign: "center" }}>
        <div className="eyebrow" style={{ color: "var(--primary)" }}>stats47 ─ Search</div>
        <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.01em", margin: "8px 0 6px" }}>
          知りたい統計を見つける
        </h1>
        <p className="muted" style={{ fontSize: 14, margin: 0 }}>
          47都道府県の<strong style={{ color: "var(--fg)" }}>1,200件以上のランキング</strong>と<strong style={{ color: "var(--fg)" }}>800件超のブログ記事</strong>から検索
        </p>

        <div style={{ maxWidth: 720, margin: "20px auto 0" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "14px 18px", border: "2px solid var(--primary)", borderRadius: 16,
            background: "#fff", boxShadow: "0 12px 32px -16px rgba(29,78,216,0.40)",
          }}>
            {React.cloneElement(Icons.Search, { className: "icon icon-lg", style: { color: "var(--primary)", width: 22, height: 22 } })}
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="例: 東京 人口、高齢化率、出生率 ランキング..." style={{
              flex: 1, border: 0, outline: "none", font: "inherit",
              fontSize: 18, fontWeight: 500, background: "transparent",
            }} />
            <button className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 14 }}>検索</button>
          </div>
          {/* Quick chips */}
          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            <span style={{ fontSize: 11.5, color: "var(--muted)", padding: "5px 0", fontWeight: 600 }}>人気の検索:</span>
            {POPULAR_SEARCHES.slice(0, 6).map(p => (
              <button key={p} onClick={() => setQ(p)} style={{
                cursor: "pointer", font: "inherit",
                padding: "5px 12px", borderRadius: 999,
                border: "1px solid var(--border)", background: "#fff",
                fontSize: 12, color: "var(--fg-2)",
              }}>{p}</button>
            ))}
          </div>
        </div>
      </header>

      <div style={{ padding: "30px 24px 24px", maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 320px", gap: 30, alignItems: "flex-start" }}>
        {/* Discovery columns */}
        <main style={{ display: "flex", flexDirection: "column", gap: 28, minWidth: 0 }}>
          {/* Trending */}
          <section>
            <div className="between" style={{ marginBottom: 12 }}>
              <div className="h2">📈 急上昇の検索</div>
              <span className="muted" style={{ fontSize: 12 }}>過去7日間</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              {SEARCH_TRENDING.map((t, i) => (
                <a key={i} href="#" className="card" style={{
                  padding: 14, textDecoration: "none", color: "var(--fg)",
                  display: "flex", flexDirection: "column", gap: 6,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--muted)" }}>{i + 1}</span>
                    <span style={{ fontSize: 11, color: t.trend === "up" ? "var(--accent)" : t.trend === "down" ? "var(--danger)" : "var(--muted)" }}>
                      {t.trend === "up" ? "▲" : t.trend === "down" ? "▼" : "▬"}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{t.q}</div>
                  <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: "auto" }}>{t.hits} 検索</div>
                </a>
              ))}
            </div>
          </section>

          {/* Browse by category */}
          <section>
            <div className="between" style={{ marginBottom: 12 }}>
              <div className="h2">🗂 カテゴリで探す</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {SEARCH_CATEGORIES.map(c => (
                <a key={c.key} href="#" className="card" style={{
                  padding: 14, textDecoration: "none", color: "var(--fg)",
                  display: "flex", alignItems: "center", gap: 12,
                  borderLeft: `4px solid ${c.color}`,
                }}>
                  <div style={{ fontSize: 22 }}>{c.icon}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{c.count}件のランキング</div>
                  </div>
                  <span style={{ color: c.color, fontWeight: 700 }}>→</span>
                </a>
              ))}
            </div>
          </section>

          {/* Featured */}
          <section>
            <div className="between" style={{ marginBottom: 12 }}>
              <div className="h2">✨ 注目のコンテンツ</div>
              <a href="#" className="muted" style={{ fontSize: 12, textDecoration: "none" }}>もっと見る ›</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { title: "東京都の人口推移と一極集中の現状", type: "blog", category: "人口・世帯", date: "2025-04-12" },
                { title: "高齢化率 47都道府県ランキング", type: "ranking", category: "人口・世帯", date: "2024年データ" },
                { title: "ふるさと納税ランキング", type: "ranking", category: "経済", date: "2024年データ" },
              ].map((c, i) => (
                <a key={i} href="#" className="card" style={{
                  padding: 14, textDecoration: "none", color: "var(--fg)",
                  display: "flex", flexDirection: "column", gap: 8,
                }}>
                  <div style={{
                    height: 120, borderRadius: 8,
                    background: ["linear-gradient(135deg, #dbeafe, #1d4ed8)", "linear-gradient(135deg, #fde68a, #f59e0b)", "linear-gradient(135deg, #bbf7d0, #16a34a)"][i],
                  }} />
                  <div>
                    <span className="pill" style={{ background: c.type === "blog" ? "#fce7f3" : "var(--primary-50)", color: c.type === "blog" ? "#9d174d" : "var(--primary)" }}>
                      {c.type === "blog" ? "ブログ" : "ランキング"}
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, marginTop: 6 }}>{c.title}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{c.category} · {c.date}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </main>

        <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Tags cloud */}
          <div className="card">
            <div className="card-header" style={{ padding: "10px 12px" }}>
              <div className="h3">よく検索されるタグ</div>
            </div>
            <div style={{ padding: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SEARCH_TAGS.map(t => {
                const size = 11 + Math.floor(Math.random() * 5);
                return <a key={t} href="#" style={{
                  padding: "3px 10px", borderRadius: 999,
                  background: "var(--bg-subtle)", border: "1px solid var(--border)",
                  fontSize: size, color: "var(--fg-2)", textDecoration: "none",
                  fontWeight: size > 14 ? 700 : 500,
                }}>#{t}</a>;
              })}
            </div>
          </div>

          {/* Newsletter */}
          <div className="card" style={{ padding: 14, background: "linear-gradient(135deg, var(--primary-50), #fff)", borderColor: "var(--primary-100)" }}>
            <div className="h3" style={{ color: "var(--primary)", marginBottom: 6 }}>📧 新着データのお知らせ</div>
            <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.5, marginBottom: 8 }}>
              気になるテーマのランキング更新をメールで受け取れます
            </div>
            <input placeholder="you@example.com" style={{ width: "100%", padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 6, font: "inherit", fontSize: 12, marginBottom: 6 }} />
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>登録する</button>
          </div>

          <AdSlot height={250} />
        </aside>
      </div>
    </div>
  );
}

window.SearchOptionB = SearchOptionB;
