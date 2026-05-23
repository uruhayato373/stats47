/* Category Option A — 整理改善 (低リスク)
   - h1 を text-lg → 30px に
   - 注目ランキングを TileMap 付きの整理されたコンパクトカードに
   - 全件テーブルに検索・正規化・ソート・CSV ツールバーを追加
   - サイドバーをグルーピング: カテゴリ内ナビ → 新着記事 → 広告 → 調査 */

function CategoryOptionA() {
  const [norm, setNorm] = React.useState("total");
  const [search, setSearch] = React.useState("");
  const filtered = ALL_RANKINGS.filter(r =>
    !search || r.title.includes(search) || r.top.includes(search)
  );

  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "カテゴリ" }, { label: CATEGORY.name, current: true },
        ]} />
      </div>

      <header style={{ padding: "10px 24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span className="pill primary">カテゴリ</span>
        </div>
        <h1 className="h1" style={{ fontSize: 30 }}>
          {CATEGORY.icon} {CATEGORY.name}
          <span className="muted" style={{ fontSize: 15, fontWeight: 500, marginLeft: 10 }}>{CATEGORY.totalRankings}件</span>
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--muted)", maxWidth: 760, lineHeight: 1.65 }}>
          {CATEGORY.description}
        </p>
        <div style={{ marginTop: 8, display: "flex", gap: 14, fontSize: 11.5, color: "var(--muted)" }}>
          <span>🔄 最終更新: {CATEGORY.lastUpdated}</span>
          <span>⭐️ 注目ランキング: {FEATURED_RANKINGS.length}件</span>
        </div>
      </header>

      <div style={{ padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "flex-start" }}>
        <main style={{ minWidth: 0 }}>
          {/* Featured */}
          <section style={{ marginBottom: 24 }}>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="h2">⭐️ 注目のランキング</div>
              <a href="#" className="muted" style={{ fontSize: 12, textDecoration: "none" }}>すべて見る ›</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {FEATURED_RANKINGS.map(r => <FeaturedRankingCardCompact key={r.key} r={r} />)}
            </div>
          </section>

          {/* All rankings table */}
          <section>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="h2">{CATEGORY.name} ランキング 全{CATEGORY.totalRankings}件</div>
            </div>

            {/* ★ Toolbar for table */}
            <div className="card" style={{ padding: "10px 12px", marginBottom: 10, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div className="select" style={{ padding: "6px 10px", width: 220 }}>
                {React.cloneElement(Icons.Search, { className: "icon icon-sm" })}
                <input
                  type="text" placeholder="指標名・都道府県で検索"
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ border: 0, background: "transparent", font: "inherit", width: "100%", outline: "none" }}
                />
              </div>
              <Sep />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div className="eyebrow" style={{ fontSize: 9.5 }}>表示単位</div>
                <div className="seg">
                  {[
                    ["total", "総数"],
                    ["per_pop", "人口あたり"],
                    ["per_area", "面積あたり"],
                  ].map(([k, lbl]) => (
                    <button key={k} className={"item" + (norm === k ? " active" : "")} onClick={() => setNorm(k)}>{lbl}</button>
                  ))}
                </div>
              </div>
              <Sep />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div className="eyebrow" style={{ fontSize: 9.5 }}>並び順</div>
                <select className="select" style={{ padding: "5px 10px", fontSize: 12 }}>
                  <option>注目順</option>
                  <option>更新日順</option>
                  <option>名前順</option>
                </select>
              </div>
              <div style={{ flex: 1 }} />
              <button className="btn btn-primary">
                {React.cloneElement(Icons.Download, { className: "icon" })}
                カテゴリ全件CSV
              </button>
            </div>

            {/* Table */}
            <div className="card">
              <table className="rk">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>指標</th>
                    <th>1位</th>
                    <th style={{ textAlign: "right" }}>値</th>
                    <th style={{ textAlign: "right" }}>年度</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.key}>
                      <td className="mono" style={{ color: "var(--muted)" }}>{i + 1}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, background: r.color, borderRadius: 2 }} />
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              <a href="#" style={{ color: "var(--fg)", textDecoration: "none" }}>{r.title}</a>
                              {r.featured && <span style={{ marginLeft: 6, fontSize: 10 }}>⭐️</span>}
                            </div>
                            {r.sub && <div className="muted" style={{ fontSize: 11 }}>{r.sub}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12.5 }}>{r.top}</td>
                      <td className="mono value" style={{ textAlign: "right" }}>{r.topVal} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 11 }}>{r.unit}</span></td>
                      <td className="muted" style={{ textAlign: "right", fontSize: 11.5 }}>{r.year}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          <button className="btn btn-sm btn-ghost" title="CSV">
                            {React.cloneElement(Icons.Download, { className: "icon icon-sm" })}
                          </button>
                          <a href="#" className="btn btn-sm btn-ghost">→</a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Sibling categories */}
          <div className="card">
            <div className="card-header" style={{ padding: "12px 14px" }}>
              <div className="h3">他のカテゴリ</div>
            </div>
            <div className="card-body" style={{ padding: 6 }}>
              <div className="side-list">
                {CATEGORY.siblings.map(s => (
                  <a key={s.key} href="#">
                    <span>{s.icon} {s.name}</span>
                    <span className="meta">{s.count}件</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Latest articles */}
          <div className="card">
            <div className="card-header" style={{ padding: "12px 14px" }}>
              <div className="h3">新着記事</div>
            </div>
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {LATEST_ARTICLES.map(a => (
                <a key={a.slug} href="#" style={{
                  display: "block", padding: 8,
                  borderRadius: 6, border: "1px solid var(--border)",
                  textDecoration: "none", color: "var(--fg)",
                }}>
                  <div style={{
                    fontSize: 12.5, fontWeight: 500, lineHeight: 1.4,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>{a.title}</div>
                  <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 4 }}>{a.date}</div>
                </a>
              ))}
            </div>
          </div>

          {/* Ad */}
          <div className="card" style={{ padding: 10 }}>
            <div className="div-label" style={{ marginBottom: 8, fontSize: 10 }}>広告</div>
            <AdSlot height={250} label="" />
          </div>

          {/* Survey */}
          <div className="card">
            <div className="card-header" style={{ padding: "12px 14px" }}>
              <div className="h3">調査から探す</div>
            </div>
            <div style={{ padding: 6 }}>
              <div className="side-list">
                {["国勢調査", "住民基本台帳", "人口推計", "人口動態調査"].map(s => (
                  <a key={s} href="#"><span>{s}</span></a>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

function Sep() { return <div style={{ width: 1, alignSelf: "stretch", background: "var(--border)" }} />; }

window.CategoryOptionA = CategoryOptionA;
