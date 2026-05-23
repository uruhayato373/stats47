/* Category Option C — ナビゲーション・ハブ (横断回遊)
   - 左に「カテゴリ・ナビゲーション」(現在カテゴリ + 隣接カテゴリ + クイックジャンプ)
   - 中央: 注目ランキング (大カード) + 全件テーブル
   - 右: 表示ツール + CSV + 統計サービス + 広告
   - カテゴリ横断の回遊を強化 */

function CategoryOptionC() {
  const [norm, setNorm] = React.useState("total");

  return (
    <div className="page" style={{ background: "#f5f7fa" }}>
      <div style={{ padding: "14px 20px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "カテゴリ" }, { label: CATEGORY.name, current: true },
        ]} />
      </div>

      <header style={{ padding: "8px 20px 0" }}>
        <h1 className="h1" style={{ fontSize: 26 }}>
          {CATEGORY.icon} {CATEGORY.name}
          <span className="muted" style={{ fontSize: 14, fontWeight: 500, marginLeft: 8 }}>{CATEGORY.totalRankings}件のランキング</span>
        </h1>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{CATEGORY.description}</p>
      </header>

      <div style={{
        padding: "14px 20px 24px",
        display: "grid", gridTemplateColumns: "230px 1fr 280px", gap: 16, alignItems: "flex-start",
      }}>
        {/* ★ Left: category navigation hub */}
        <aside style={{ position: "sticky", top: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Current category */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", background: "linear-gradient(135deg, var(--primary-50), #fff)", borderBottom: "1px solid var(--border)" }}>
              <div className="eyebrow" style={{ fontSize: 10, color: "var(--primary)" }}>現在のカテゴリ</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--primary)", marginTop: 2 }}>
                {CATEGORY.icon} {CATEGORY.name}
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{CATEGORY.totalRankings}件のランキング</div>
            </div>
            {/* Quick jump to featured rankings within this category */}
            <div style={{ padding: 6 }}>
              <div className="eyebrow" style={{ fontSize: 9.5, padding: "6px 8px" }}>注目ランキングへ</div>
              {FEATURED_RANKINGS.map(r => (
                <a key={r.key} href={`#${r.key}`} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "5px 8px", borderRadius: 4,
                  fontSize: 12, color: "var(--fg-2)", textDecoration: "none",
                  borderLeft: `2px solid ${r.color}`,
                  marginBottom: 1,
                }}>
                  <span style={{ flex: 1 }}>{r.title}</span>
                  <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{r.year}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Sibling categories */}
          <div className="card">
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <div className="h3">他のカテゴリ</div>
            </div>
            <div style={{ padding: 4 }}>
              {CATEGORY.siblings.map(s => (
                <a key={s.key} href="#" style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 10px", borderRadius: 6,
                  color: "var(--fg)", textDecoration: "none",
                  transition: "background .12s",
                }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-subtle)"}
                   onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ width: 20, textAlign: "center" }}>{s.icon}</span>
                  <span style={{ flex: 1, fontSize: 12.5 }}>{s.name}</span>
                  <span className="muted" style={{ fontSize: 11 }}>{s.count}</span>
                </a>
              ))}
              <a href="#" style={{
                display: "block", textAlign: "center", padding: "8px",
                fontSize: 11.5, color: "var(--primary)", textDecoration: "none",
                marginTop: 4, borderTop: "1px solid var(--border)",
              }}>すべてのカテゴリ →</a>
            </div>
          </div>

          {/* Themes */}
          <div className="card">
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <div className="h3">関連テーマ</div>
            </div>
            <div style={{ padding: 6, display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { name: "人口動態", icon: "📈" },
                { name: "高齢化社会", icon: "👴" },
                { name: "外国人住民", icon: "🌏" },
              ].map(t => (
                <a key={t.name} href="#" className="card" style={{
                  padding: "8px 10px",
                  display: "flex", alignItems: "center", gap: 8,
                  textDecoration: "none", color: "var(--fg)",
                  borderRadius: 6, fontSize: 12,
                }}>
                  <span>{t.icon}</span>
                  <span style={{ flex: 1, fontWeight: 500 }}>{t.name}</span>
                  <span style={{ color: "var(--primary)" }}>→</span>
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <section>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="h2">⭐️ 注目のランキング</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {FEATURED_RANKINGS.slice(0, 3).map(r => <FeaturedRankingCardCompact key={r.key} r={r} />)}
            </div>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {FEATURED_RANKINGS.slice(3, 6).map(r => <FeaturedRankingCardCompact key={r.key} r={r} />)}
            </div>
          </section>

          <section>
            <div className="h2" style={{ marginBottom: 10 }}>全{CATEGORY.totalRankings}件のランキング</div>
            <div className="card">
              <table className="rk">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>指標</th>
                    <th>1位</th>
                    <th style={{ textAlign: "right" }}>値</th>
                    <th>推移</th>
                    <th style={{ textAlign: "right" }}>年度</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_RANKINGS.map((r, i) => (
                    <tr key={r.key}>
                      <td className="mono" style={{ color: "var(--muted)" }}>{i + 1}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, background: r.color, borderRadius: 2 }} />
                          <a href="#" style={{ color: "var(--fg)", textDecoration: "none", fontWeight: 600 }}>{r.title}</a>
                          {r.featured && <span style={{ fontSize: 10 }}>⭐️</span>}
                        </div>
                      </td>
                      <td style={{ fontSize: 12.5 }}>{r.top}</td>
                      <td className="mono value" style={{ textAlign: "right" }}>{r.topVal} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 11 }}>{r.unit}</span></td>
                      <td><Sparkline data={r.trend} color={r.color} w={60} h={20} fill={false} /></td>
                      <td className="muted" style={{ textAlign: "right", fontSize: 11.5 }}>{r.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {/* Right tools */}
        <aside style={{ position: "sticky", top: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card">
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <div className="h3">表示設定</div>
            </div>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <div className="eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>表示単位</div>
              <div className="seg" style={{ width: "100%" }}>
                <button className={"item" + (norm === "total" ? " active" : "")} style={{ flex: 1, justifyContent: "center" }} onClick={() => setNorm("total")}>総数</button>
                <button className={"item" + (norm === "per_pop" ? " active" : "")} style={{ flex: 1, justifyContent: "center" }} onClick={() => setNorm("per_pop")}>/人口</button>
                <button className={"item" + (norm === "per_area" ? " active" : "")} style={{ flex: 1, justifyContent: "center" }} onClick={() => setNorm("per_area")}>/面積</button>
              </div>
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div className="eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>並び順</div>
              <select className="select" style={{ width: "100%", padding: "6px 10px", fontSize: 12 }}>
                <option>更新日順</option>
                <option>注目順</option>
                <option>名前順</option>
              </select>
            </div>
          </div>

          <div className="card" style={{ padding: 12, background: "linear-gradient(180deg, var(--primary-50), #fff)", borderColor: "var(--primary-100)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {React.cloneElement(Icons.Download, { className: "icon icon-lg", style: { color: "var(--primary)" } })}
              <div className="h3" style={{ color: "var(--primary)" }}>データを取得</div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginBottom: 6 }}>
              全{CATEGORY.totalRankings}件 CSV (zip)
            </button>
            <button className="btn" style={{ width: "100%", justifyContent: "center", marginBottom: 6 }}>注目6件のみ CSV</button>
            <div className="muted" style={{ fontSize: 10.5, textAlign: "center", marginTop: 4 }}>クレジット表記で商用利用可</div>
          </div>

          <div className="card">
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <div className="h3">調査から探す</div>
            </div>
            <div className="side-list" style={{ padding: 6 }}>
              {["国勢調査", "住民基本台帳", "人口推計", "人口動態調査"].map(s => (
                <a key={s} href="#"><span>{s}</span></a>
              ))}
            </div>
          </div>

          <AdSlot height={250} />
        </aside>
      </div>
    </div>
  );
}

window.CategoryOptionC = CategoryOptionC;
