/* Search Option A — 整理改善 (低リスク)
   - h1 を text-lg → 28px に
   - 検索ボックスをでかく
   - 結果カードを type 別に強化 (ランキングには TOP1 / ブログにはサムネ)
   - フィルタは現行の右サイドバーを綺麗に */

function SearchOptionA() {
  const [type, setType] = React.useState("all");
  const counts = {
    all: SEARCH_RESULTS.length,
    ranking: SEARCH_RESULTS.filter(r => r.type === "ranking").length,
    blog: SEARCH_RESULTS.filter(r => r.type === "blog").length,
  };

  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[{ label: "ホーム" }, { label: "検索", current: true }]} />
      </div>

      <header style={{ padding: "12px 24px 0", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <h1 className="h1" style={{ fontSize: 28 }}>検索</h1>
        <div className="muted" style={{ fontSize: 12 }}>ランキング・ブログ記事をキーワードで検索</div>
      </header>

      {/* Search box */}
      <div style={{ padding: "16px 24px 0" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", border: "2px solid var(--primary)", borderRadius: 12,
          background: "#fff", boxShadow: "0 4px 12px -6px rgba(29,78,216,0.25)",
        }}>
          {React.cloneElement(Icons.Search, { className: "icon icon-lg", style: { color: "var(--primary)" } })}
          <input value={SEARCH_QUERY} readOnly style={{
            flex: 1, border: 0, outline: "none", font: "inherit",
            fontSize: 17, fontWeight: 500, background: "transparent",
          }} />
          <button className="btn btn-sm btn-ghost" title="クリア">×</button>
          <button className="btn btn-primary">検索</button>
        </div>
        {/* Type tabs */}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {[
            ["all", "すべて", null],
            ["ranking", "ランキング", Icons.Trend],
            ["blog", "ブログ", null],
          ].map(([k, lbl, ic]) => (
            <button key={k} onClick={() => setType(k)} style={{
              cursor: "pointer", font: "inherit",
              padding: "7px 14px", borderRadius: 999,
              border: `1px solid ${type === k ? "var(--primary)" : "var(--border)"}`,
              background: type === k ? "var(--primary-50)" : "#fff",
              color: type === k ? "var(--primary)" : "var(--fg-2)",
              fontSize: 12.5, fontWeight: type === k ? 700 : 500,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              {ic && React.cloneElement(ic, { className: "icon icon-sm" })}
              {lbl}
              <span style={{
                fontSize: 10, padding: "1px 6px", borderRadius: 999,
                background: type === k ? "var(--primary)" : "var(--bg-muted)",
                color: type === k ? "#fff" : "var(--muted)",
                fontWeight: 600,
              }}>{counts[k]}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 24px 24px", display: "grid", gridTemplateColumns: "1fr 260px", gap: 20, alignItems: "flex-start" }}>
        {/* Results */}
        <main style={{ minWidth: 0 }}>
          <div className="between" style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13 }}>
              「<strong>{SEARCH_QUERY}</strong>」の検索結果 <span className="muted">{counts.all}件</span>
            </div>
            <select className="select" style={{ padding: "5px 10px", fontSize: 12 }}>
              <option>関連度順</option>
              <option>新着順</option>
              <option>人気順</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SEARCH_RESULTS.map(r => (
              <a key={r.id} href="#" className="card" style={{
                display: "flex", gap: 12, padding: 14,
                textDecoration: "none", color: "var(--fg)",
                transition: "all .12s",
              }}>
                {/* Type icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                  background: r.type === "ranking" ? "var(--primary-50)" : "#fce7f3",
                  color: r.type === "ranking" ? "var(--primary)" : "#9d174d",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>
                  {React.cloneElement(r.type === "ranking" ? Icons.Trend : Icons.External, { className: "icon icon-lg" })}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span className="pill" style={{
                      background: r.type === "ranking" ? "var(--primary-50)" : "#fce7f3",
                      color: r.type === "ranking" ? "var(--primary)" : "#9d174d",
                    }}>{r.type === "ranking" ? "ランキング" : "ブログ"}</span>
                    <span className="muted" style={{ fontSize: 11 }}>{r.category}</span>
                    {r.publishedAt && <span className="muted" style={{ fontSize: 11 }}>· {r.publishedAt}</span>}
                    {r.latestYear && <span className="muted" style={{ fontSize: 11 }}>· {r.latestYear}年</span>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{r.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 4 }}>
                    <Highlighted html={r.snippet || r.description} />
                  </div>
                  {r.type === "blog" && r.tags && (
                    <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
                      {r.tags.slice(0, 3).map(t => <Tag key={t}>{t}</Tag>)}
                      <span className="muted" style={{ fontSize: 10.5, marginLeft: 6 }}>読了 {r.readMinutes}分</span>
                    </div>
                  )}
                </div>
                {r.type === "ranking" && (
                  <div style={{ flexShrink: 0, padding: 8, background: "var(--bg-subtle)", borderRadius: 8, textAlign: "center", width: 110 }}>
                    <div className="muted" style={{ fontSize: 10 }}>1位</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{r.top1}</div>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)", marginTop: 2 }}>{r.top1Val}</div>
                  </div>
                )}
              </a>
            ))}
          </div>
        </main>

        {/* Sidebar filters */}
        <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div className="card-header" style={{ padding: "10px 12px" }}>
              <div className="h3">絞り込み</div>
              <button className="btn btn-sm btn-ghost">クリア</button>
            </div>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <div className="eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>カテゴリ</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {SEARCH_CATEGORIES.slice(0, 5).map(c => (
                  <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                    <input type="checkbox" defaultChecked={c.key === "population-households"} />
                    <span>{c.icon} {c.name}</span>
                    <span className="muted" style={{ marginLeft: "auto", fontSize: 11 }}>{c.count}</span>
                  </label>
                ))}
                <a href="#" style={{ fontSize: 11, color: "var(--primary)", textDecoration: "none", marginTop: 4 }}>すべて表示 →</a>
              </div>
            </div>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <div className="eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>年度 (ブログ)</div>
              <select className="select" style={{ width: "100%", padding: "5px 10px", fontSize: 12 }}>
                <option>すべての年</option>
                <option>2025年</option>
                <option>2024年</option>
              </select>
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div className="eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>タグ</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {SEARCH_TAGS.slice(0, 8).map(t => <Tag key={t}>{t}</Tag>)}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 10 }}>
            <div className="div-label" style={{ marginBottom: 8, fontSize: 10 }}>広告</div>
            <AdSlot height={250} label="" />
          </div>
        </aside>
      </div>
    </div>
  );
}

window.SearchOptionA = SearchOptionA;
