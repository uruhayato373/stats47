/* Category Option B — Featured ヒーロー + 全件強化テーブル
   - 注目ランキングを「リーダーボード」風の大カード3枚（mini bar chart 付き）
   - 全件テーブルにスパークライン列・正規化トグル・CSV を追加
   - 右サイドバーは "縦コンパクト" でランキングの邪魔をしない */

function CategoryOptionB() {
  const [norm, setNorm] = React.useState("total");
  const [view, setView] = React.useState("table"); // table or grid

  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "カテゴリ" }, { label: CATEGORY.name, current: true },
        ]} />
      </div>

      <header style={{ padding: "10px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span className="pill primary">カテゴリ</span>
            </div>
            <h1 className="h1" style={{ fontSize: 32 }}>
              {CATEGORY.icon} {CATEGORY.name}
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--muted)", maxWidth: 720, lineHeight: 1.65 }}>
              {CATEGORY.description}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn">
              {React.cloneElement(Icons.Share, { className: "icon" })}
              共有
            </button>
            <button className="btn btn-primary">
              {React.cloneElement(Icons.Download, { className: "icon" })}
              全{CATEGORY.totalRankings}件をCSV
            </button>
          </div>
        </div>
      </header>

      {/* ★ Featured: 3 large "leaderboard" cards */}
      <section style={{ padding: "20px 24px 0" }}>
        <div className="between" style={{ marginBottom: 12 }}>
          <div className="h2">⭐️ 注目のランキング</div>
          <a href="#" className="muted" style={{ fontSize: 12, textDecoration: "none" }}>注目を全て見る ›</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {FEATURED_RANKINGS.slice(0, 3).map(r => <FeaturedRankingCardLarge key={r.key} r={r} />)}
        </div>
      </section>

      {/* All rankings as a power-user table */}
      <section style={{ padding: "24px 24px 0" }}>
        <div className="between" style={{ marginBottom: 10 }}>
          <div className="h2">{CATEGORY.name} の全ランキング</div>
          <div style={{ display: "flex", gap: 8 }}>
            <div className="seg">
              <button className={"item" + (view === "table" ? " active" : "")} onClick={() => setView("table")}>
                {React.cloneElement(Icons.Table, { className: "icon icon-sm" })}
                テーブル
              </button>
              <button className={"item" + (view === "grid" ? " active" : "")} onClick={() => setView("grid")}>
                {React.cloneElement(Icons.Layer, { className: "icon icon-sm" })}
                カード
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "10px 14px", marginBottom: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div className="select" style={{ padding: "6px 10px", width: 220 }}>
            {React.cloneElement(Icons.Search, { className: "icon icon-sm" })}
            <input placeholder="指標名で絞り込み" style={{ border: 0, background: "transparent", font: "inherit", width: "100%", outline: "none" }} />
          </div>
          <Sep2 />
          <div style={{ fontSize: 11, color: "var(--muted)" }}>表示単位</div>
          <div className="seg">
            {[
              ["total", "総数", Icons.Sigma],
              ["per_pop", "人口あたり", Icons.Users],
              ["per_area", "面積あたり", Icons.Area],
            ].map(([k, lbl, ic]) => (
              <button key={k} className={"item" + (norm === k ? " active" : "")} onClick={() => setNorm(k)}>
                {React.cloneElement(ic, { className: "icon icon-sm" })}{lbl}
              </button>
            ))}
          </div>
          <Sep2 />
          <select className="select" style={{ padding: "5px 10px", fontSize: 12 }}>
            <option>更新日順</option>
            <option>注目順</option>
            <option>名前順</option>
          </select>
          <div style={{ flex: 1 }} />
          <div className="muted" style={{ fontSize: 12 }}>{ALL_RANKINGS.length}件表示</div>
        </div>

        {view === "table" ? (
          <div className="card">
            <table className="rk">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>指標</th>
                  <th>1位</th>
                  <th style={{ textAlign: "right" }}>値</th>
                  <th>推移 (6年)</th>
                  <th style={{ textAlign: "right" }}>年度</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {ALL_RANKINGS.map((r, i) => (
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
                    <td><Sparkline data={r.trend} color={r.color} w={80} h={24} /></td>
                    <td className="muted" style={{ textAlign: "right", fontSize: 11.5 }}>{r.year}</td>
                    <td style={{ textAlign: "right" }}>
                      <a href="#" className="btn btn-sm">→</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {ALL_RANKINGS.map((r) => (
              <IndicatorCard key={r.key} ind={{ ...r, title: r.title, top1: r.top, top1Val: r.topVal }} onClick={() => {}} />
            ))}
          </div>
        )}
      </section>

      <div style={{ height: 24 }} />
    </div>
  );
}

function Sep2() { return <div style={{ width: 1, alignSelf: "stretch", background: "var(--border)" }} />; }

window.CategoryOptionB = CategoryOptionB;
