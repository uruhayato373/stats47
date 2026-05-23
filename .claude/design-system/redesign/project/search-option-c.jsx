/* Search Option C — Power-Search (ファセット検索強化)
   - 左カラムに完全展開されたフィルタ (タイプ・カテゴリ・年・タグ)
   - 中央に密度の高い結果リスト (rich card)
   - 右に表示設定・CSV エクスポート・関連検索
   - 検索結果の絞り込みと取得を最大化 */

function SearchOptionC() {
  const [type, setType] = React.useState("all");
  const [view, setView] = React.useState("rich");

  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "14px 20px 0" }}>
        <Breadcrumb items={[{ label: "ホーム" }, { label: "検索", current: true }]} />
      </div>

      {/* Top search bar */}
      <header style={{ padding: "10px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: 8,
            padding: "8px 14px", border: "1px solid var(--border)", borderRadius: 10,
            background: "#fff", boxShadow: "var(--shadow-sm)",
          }}>
            {React.cloneElement(Icons.Search, { className: "icon", style: { color: "var(--muted)" } })}
            <input value={SEARCH_QUERY} readOnly style={{
              flex: 1, border: 0, outline: "none", font: "inherit",
              fontSize: 15, background: "transparent",
            }} />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{SEARCH_RESULTS.length}件</span>
            <button className="btn btn-sm btn-ghost">×</button>
          </div>
          <button className="btn btn-primary">検索</button>
        </div>
      </header>

      <div style={{ padding: "16px 20px 24px", display: "grid", gridTemplateColumns: "240px 1fr 240px", gap: 16, alignItems: "flex-start" }}>
        {/* ★ Left filter panel */}
        <aside style={{ position: "sticky", top: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card">
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="h3">絞り込み</div>
              <button className="btn btn-sm btn-ghost">クリア</button>
            </div>
            {/* Type facet */}
            <FacetGroup title="コンテンツタイプ">
              {[
                ["all", "すべて", 6, null],
                ["ranking", "ランキング", 4, Icons.Trend],
                ["blog", "ブログ記事", 2, null],
              ].map(([k, lbl, count, ic]) => (
                <FacetItem key={k} active={type === k} count={count} onClick={() => setType(k)}>
                  {ic && React.cloneElement(ic, { className: "icon icon-sm" })}
                  {lbl}
                </FacetItem>
              ))}
            </FacetGroup>
            {/* Category facet */}
            <FacetGroup title="カテゴリ">
              {SEARCH_CATEGORIES.slice(0, 5).map(c => (
                <FacetItem key={c.key} count={c.count} active={c.key === "population-households"}>
                  <span style={{ marginRight: 4 }}>{c.icon}</span>{c.name}
                </FacetItem>
              ))}
              <a href="#" style={{ fontSize: 11, padding: "4px 10px", color: "var(--primary)", textDecoration: "none" }}>+ もっと見る (3)</a>
            </FacetGroup>
            {/* Year facet (blog only) */}
            <FacetGroup title="公開年度" subtitle="ブログ記事">
              {["2025", "2024", "2023"].map(y => (
                <FacetItem key={y} count={Math.floor(Math.random() * 20 + 5)} active={y === "2025"}>{y}年</FacetItem>
              ))}
            </FacetGroup>
            {/* Tags */}
            <FacetGroup title="タグ" subtitle="複数選択可">
              <div style={{ padding: "0 10px 10px", display: "flex", flexWrap: "wrap", gap: 4 }}>
                {SEARCH_TAGS.slice(0, 8).map((t, i) => (
                  <button key={t} style={{
                    cursor: "pointer", font: "inherit",
                    padding: "3px 8px", borderRadius: 999,
                    border: `1px solid ${i < 2 ? "var(--primary)" : "var(--border)"}`,
                    background: i < 2 ? "var(--primary-50)" : "#fff",
                    color: i < 2 ? "var(--primary)" : "var(--fg-2)",
                    fontSize: 11, fontWeight: i < 2 ? 700 : 500,
                  }}>#{t}</button>
                ))}
              </div>
            </FacetGroup>
          </div>
        </aside>

        {/* Center results */}
        <main style={{ minWidth: 0 }}>
          <div className="between" style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13 }}>
              「<strong>{SEARCH_QUERY}</strong>」の検索結果 <span className="muted">{SEARCH_RESULTS.length}件</span>
              <span className="muted" style={{ marginLeft: 8 }}>· 0.12秒</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select className="select" style={{ padding: "5px 10px", fontSize: 12 }}>
                <option>関連度順</option>
                <option>新着順</option>
                <option>人気順</option>
              </select>
              <div className="seg">
                <button className={"item" + (view === "rich" ? " active" : "")} onClick={() => setView("rich")}>詳細</button>
                <button className={"item" + (view === "compact" ? " active" : "")} onClick={() => setView("compact")}>コンパクト</button>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            <FilterChip label="人口・世帯" />
            <FilterChip label="#人口" />
            <FilterChip label="#東京都" />
          </div>

          {/* Result list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SEARCH_RESULTS.map(r => (
              <a key={r.id} href="#" className="card" style={{
                display: "flex", gap: 14, padding: 14,
                textDecoration: "none", color: "var(--fg)",
              }}>
                {/* Preview */}
                <div style={{
                  width: 100, flexShrink: 0, alignSelf: "stretch",
                  background: r.type === "ranking" ? "var(--bg-subtle)" : "linear-gradient(135deg, #fbcfe8, #ec4899)",
                  borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}>
                  {r.type === "ranking" ? (
                    <TileMapMini color={SEARCH_CATEGORIES[0].color} size={8} />
                  ) : (
                    <span style={{ color: "#fff", fontSize: 24 }}>📝</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span className="pill" style={{
                      background: r.type === "ranking" ? "var(--primary-50)" : "#fce7f3",
                      color: r.type === "ranking" ? "var(--primary)" : "#9d174d",
                    }}>{r.type === "ranking" ? "ランキング" : "ブログ"}</span>
                    <span className="muted" style={{ fontSize: 11 }}>{r.category}</span>
                    {r.latestYear && <><span className="muted" style={{ fontSize: 11 }}>·</span><span className="muted" style={{ fontSize: 11 }}>{r.latestYear}年</span></>}
                    {r.publishedAt && <><span className="muted" style={{ fontSize: 11 }}>·</span><span className="muted" style={{ fontSize: 11 }}>{r.publishedAt}</span></>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{r.title}</div>
                  {r.subtitle && <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{r.subtitle}</div>}
                  <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 4 }}>
                    <Highlighted html={r.snippet || r.description} />
                  </div>
                  <div style={{ marginTop: 6, display: "flex", gap: 4, alignItems: "center" }}>
                    {r.type === "ranking" && r.top1 && (
                      <span style={{ fontSize: 11, padding: "2px 8px", background: "#fef3c7", color: "#92400e", borderRadius: 4, fontWeight: 600 }}>
                        1位 {r.top1} · {r.top1Val}
                      </span>
                    )}
                    {r.tags?.slice(0, 3).map(t => <Tag key={t}>{t}</Tag>)}
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <button className="btn">もっと結果を見る (12件残り)</button>
          </div>
        </main>

        {/* Right tools */}
        <aside style={{ position: "sticky", top: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* CSV export */}
          <div className="card" style={{ padding: 12, background: "linear-gradient(180deg, var(--primary-50), #fff)", borderColor: "var(--primary-100)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              {React.cloneElement(Icons.Download, { className: "icon icon-lg", style: { color: "var(--primary)" } })}
              <div className="h3" style={{ color: "var(--primary)" }}>検索結果を取得</div>
            </div>
            <div className="muted" style={{ fontSize: 11, marginBottom: 8 }}>
              ヒット中のランキング 4件 のデータ
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginBottom: 6 }}>CSV (zip)</button>
            <button className="btn btn-sm" style={{ width: "100%", justifyContent: "center" }}>検索クエリを保存</button>
          </div>

          {/* Related searches */}
          <div className="card">
            <div className="card-header" style={{ padding: "10px 12px" }}>
              <div className="h3">関連する検索</div>
            </div>
            <div style={{ padding: 6 }}>
              <div className="side-list">
                {["東京都 人口推移", "人口 全国平均", "東京 高齢化", "人口密度 ランキング", "東京 出生率"].map(q => (
                  <a key={q} href="#"><span>{q}</span><span className="meta">→</span></a>
                ))}
              </div>
            </div>
          </div>

          <AdSlot height={250} />
        </aside>
      </div>
    </div>
  );
}

function FacetGroup({ title, subtitle, children }) {
  return (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "10px 0" }}>
      <div style={{ padding: "0 12px", marginBottom: 6 }}>
        <div className="eyebrow" style={{ fontSize: 10 }}>{title}</div>
        {subtitle && <div className="muted" style={{ fontSize: 10, marginTop: 1 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function FacetItem({ active, count, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", cursor: "pointer", font: "inherit",
      padding: "5px 12px", border: 0, background: active ? "var(--primary-50)" : "transparent",
      borderLeft: `2px solid ${active ? "var(--primary)" : "transparent"}`,
      display: "flex", alignItems: "center", gap: 6,
      fontSize: 12, color: active ? "var(--primary)" : "var(--fg-2)",
      fontWeight: active ? 700 : 500,
      textAlign: "left",
    }}>
      <input type="checkbox" checked={!!active} readOnly style={{ accentColor: "var(--primary)" }} />
      <span style={{ flex: 1 }}>{children}</span>
      <span className="muted" style={{ fontSize: 11 }}>{count}</span>
    </button>
  );
}

function FilterChip({ label }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 4px 3px 10px", borderRadius: 999,
      background: "var(--primary-50)", color: "var(--primary)",
      fontSize: 12, fontWeight: 600, border: "1px solid var(--primary-100)",
    }}>
      {label}
      <button style={{
        cursor: "pointer", font: "inherit", border: 0,
        background: "transparent", color: "inherit",
        width: 18, height: 18, borderRadius: "50%",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>×</button>
    </span>
  );
}

window.SearchOptionC = SearchOptionC;
