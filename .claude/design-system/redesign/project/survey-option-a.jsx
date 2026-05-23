/* Survey Option A — 整理改善 (低リスク・現行構造踏襲)
   - h1: text-lg → 30px
   - メタ情報を整理 (実施機関・実施周期・初回・最新年・調査方法・指標数)
   - 注目ランキングを TileMap 付きの色付きカードに強化
   - 全件テーブルにカテゴリ・検索・正規化・CSV ツールバー
   - 右サイドバーに「この調査について」「他の調査」「広告」 */

function SurveyOptionA() {
  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "調査一覧" }, { label: SURVEY.name, current: true },
        ]} />
      </div>

      <header style={{ padding: "12px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span className="pill primary">統計調査</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{SURVEY.organization}</span>
        </div>
        <h1 className="h1" style={{ fontSize: 30 }}>
          {SURVEY.name}
          <span className="muted" style={{ fontSize: 15, fontWeight: 500, marginLeft: 10 }}>{SURVEY.rankingCount}件のランキング</span>
        </h1>
        <p style={{ margin: "8px 0 12px", fontSize: 13.5, color: "var(--muted)", maxWidth: 760, lineHeight: 1.7 }}>
          {SURVEY.description}
        </p>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--muted)", flexWrap: "wrap" }}>
          <span>📅 実施周期: <strong style={{ color: "var(--fg)" }}>{SURVEY.cycle}</strong></span>
          <span>🗓 初回 {SURVEY.firstYear}年 → 最新 {SURVEY.latestYear}年</span>
          <span>📋 方式: {SURVEY.method}</span>
          <a href={SURVEY.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "none" }}>
            🌐 公式サイト ↗
          </a>
        </div>
      </header>

      <div style={{ padding: "20px 24px 24px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "flex-start" }}>
        <main style={{ minWidth: 0 }}>
          {/* Featured */}
          <section style={{ marginBottom: 20 }}>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="h2">⭐️ 注目のランキング</div>
              <span className="muted" style={{ fontSize: 12 }}>{SURVEY.featuredCount}件</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {SURVEY_FEATURED.map(r => (
                <a key={r.key} href="#" className="card" style={{
                  display: "block", padding: 12,
                  textDecoration: "none", color: "var(--fg)",
                }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 50, flexShrink: 0 }}>
                      <TileMapMini color={r.color} size={6} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 2 }}>
                        <span style={{ width: 6, height: 6, background: r.color, borderRadius: 2 }} />
                        <span className="muted" style={{ fontSize: 10 }}>{r.category} · {r.year}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>{r.title}</div>
                      <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: 11.5, fontWeight: 600 }}>1位 {r.top}</span>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.topVal}</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* All rankings */}
          <section>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="h2">{SURVEY.name}に基づく全{SURVEY.rankingCount}件のランキング</div>
            </div>
            <div className="card" style={{ padding: "10px 12px", marginBottom: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div className="select" style={{ padding: "6px 10px", width: 220 }}>
                {React.cloneElement(Icons.Search, { className: "icon icon-sm" })}
                <input placeholder="ランキングを検索" style={{ flex: 1, border: 0, outline: "none", font: "inherit", background: "transparent" }} />
              </div>
              <div style={{ width: 1, alignSelf: "stretch", background: "var(--border)" }} />
              <select className="select" style={{ padding: "5px 10px", fontSize: 12 }}>
                <option>カテゴリ: すべて</option>
                {SURVEY.categoryDistribution.map(c => <option key={c.name}>{c.name} ({c.count})</option>)}
              </select>
              <select className="select" style={{ padding: "5px 10px", fontSize: 12 }}>
                <option>並び順: 注目順</option>
                <option>名前順</option>
                <option>更新日順</option>
              </select>
              <div style={{ flex: 1 }} />
              <button className="btn btn-primary">
                {React.cloneElement(Icons.Download, { className: "icon" })}
                調査全件CSV
              </button>
            </div>

            <div className="card">
              <table className="rk">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>指標</th>
                    <th>カテゴリ</th>
                    <th>1位</th>
                    <th style={{ textAlign: "right" }}>値</th>
                    <th style={{ textAlign: "right" }}>年度</th>
                  </tr>
                </thead>
                <tbody>
                  {SURVEY_RANKINGS.slice(0, 12).map((r, i) => (
                    <tr key={r.key}>
                      <td className="mono" style={{ color: "var(--muted)" }}>{i + 1}</td>
                      <td>
                        <a href="#" style={{ color: "var(--fg)", textDecoration: "none", fontWeight: 600 }}>{r.title}</a>
                        {r.featured && <span style={{ marginLeft: 6, fontSize: 10 }}>⭐️</span>}
                      </td>
                      <td className="muted" style={{ fontSize: 11.5 }}>{r.category}</td>
                      <td style={{ fontSize: 12.5 }}>{r.top}</td>
                      <td className="mono value" style={{ textAlign: "right" }}>{r.topVal} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 11 }}>{r.unit}</span></td>
                      <td className="muted" style={{ textAlign: "right", fontSize: 11.5 }}>{r.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <button className="btn">残り {SURVEY.rankingCount - 12}件を表示</button>
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* About this survey */}
          <div className="card">
            <div className="card-header" style={{ padding: "12px 14px" }}>
              <div className="h3">📋 この調査について</div>
            </div>
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
              <div className="between"><span className="muted">実施機関</span><span style={{ fontWeight: 600, textAlign: "right" }}>{SURVEY.organization}</span></div>
              <div className="between"><span className="muted">実施周期</span><span style={{ fontWeight: 600 }}>{SURVEY.cycle}</span></div>
              <div className="between"><span className="muted">調査方式</span><span style={{ fontWeight: 600 }}>{SURVEY.method}</span></div>
              <div className="between"><span className="muted">初回</span><span className="mono" style={{ fontWeight: 600 }}>{SURVEY.firstYear}年</span></div>
              <div className="between"><span className="muted">最新</span><span className="mono" style={{ fontWeight: 600 }}>{SURVEY.latestYear}年</span></div>
              <div className="between"><span className="muted">次回予定</span><span className="mono" style={{ fontWeight: 600, color: "var(--primary)" }}>{SURVEY.nextYear}年</span></div>
              <a href={SURVEY.url} className="btn btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
                {React.cloneElement(Icons.External, { className: "icon icon-sm" })}
                公式サイトへ
              </a>
            </div>
          </div>

          {/* Other surveys */}
          <div className="card">
            <div className="card-header" style={{ padding: "12px 14px" }}>
              <div className="h3">他の調査</div>
            </div>
            <div className="card-body" style={{ padding: 6 }}>
              <div className="side-list">
                {RELATED_SURVEYS.map(s => (
                  <a key={s.name} href="#"><span>{s.name}</span><span className="meta">{s.rankingCount}件</span></a>
                ))}
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

window.SurveyOptionA = SurveyOptionA;
