/* Compare Option C — マトリックス・テーブル (Power-user)
   - 左カラムに比較設定パネル (リージョン A/B, カテゴリ, 指標フィルタ, データエクスポート)
   - 中央に巨大な指標マトリックステーブル
   - 右に「他の比較」「シェア」「PDF出力」 */

function CompareOptionC() {
  const [A, B] = COMPARE_REGIONS;
  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "14px 20px 0" }}>
        <Breadcrumb items={[{ label: "ホーム" }, { label: "比較ツール" }, { label: COMPARE_CATEGORY.name, current: true }]} />
      </div>

      <header style={{ padding: "8px 20px 0" }}>
        <h1 className="h1" style={{ fontSize: 26 }}>
          {A.name} <span style={{ color: "var(--muted)" }}>vs</span> {B.name}
          <span className="muted" style={{ fontSize: 14, fontWeight: 500, marginLeft: 8 }}>{COMPARE_CATEGORY.name}</span>
        </h1>
      </header>

      <div style={{
        padding: "14px 20px 24px",
        display: "grid", gridTemplateColumns: "260px 1fr 260px", gap: 14, alignItems: "flex-start",
      }}>
        {/* Left: setup panel */}
        <aside style={{ position: "sticky", top: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card">
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <div className="h3">比較設定</div>
            </div>
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div className="eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>地域A</div>
                <RegionPicker side="A" region={A} />
              </div>
              <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>VS</div>
              <div>
                <div className="eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>地域B</div>
                <RegionPicker side="B" region={B} />
              </div>
              <button className="btn btn-sm">+ 地域を追加 (Pro)</button>
            </div>
            <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
              <div className="eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>カテゴリ</div>
              <select className="select" style={{ width: "100%", padding: "7px 10px" }}>
                {COMPARE_CATEGORIES.map(c => <option key={c.key}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
              <div className="eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>表示する指標</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                {["全 12 指標", "差分の大きい順 (上位5)", "Aが優位", "Bが優位"].map((lbl, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="radio" name="filter" defaultChecked={i === 0} />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 12, background: "linear-gradient(180deg, var(--primary-50), #fff)", borderColor: "var(--primary-100)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              {React.cloneElement(Icons.Download, { className: "icon icon-lg", style: { color: "var(--primary)" } })}
              <div className="h3" style={{ color: "var(--primary)" }}>比較を取得</div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginBottom: 6 }}>CSV</button>
            <button className="btn btn-sm" style={{ width: "100%", justifyContent: "center", marginBottom: 6 }}>PDFレポート</button>
            <button className="btn btn-sm" style={{ width: "100%", justifyContent: "center" }}>画像でシェア</button>
          </div>
        </aside>

        {/* Center: matrix table */}
        <main style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* KPI strip */}
          <div className="card" style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 14, alignItems: "center" }}>
            <ScoreSide region={A} score={4} />
            <div style={{ textAlign: "center", fontSize: 16, fontWeight: 800, color: "var(--muted)" }}>
              <div>{COMPARE_KPIS.length}</div>
              <div style={{ fontSize: 10, fontWeight: 500, color: "var(--muted)" }}>指標</div>
            </div>
            <ScoreSide region={B} score={2} reverse />
          </div>

          {/* Big indicator matrix */}
          <div className="card">
            <div className="card-header">
              <div className="h2">指標マトリックス</div>
              <div style={{ display: "flex", gap: 6 }}>
                <select className="select" style={{ padding: "5px 10px", fontSize: 12 }}>
                  <option>差分の大きい順</option>
                  <option>名前順</option>
                </select>
                <button className="btn btn-sm">列のカスタマイズ</button>
              </div>
            </div>
            <table className="rk">
              <thead>
                <tr>
                  <th>指標</th>
                  <th style={{ textAlign: "right", color: A.color }}>{A.name}</th>
                  <th>比較</th>
                  <th style={{ textAlign: "right", color: B.color }}>{B.name}</th>
                  <th style={{ textAlign: "right" }}>差分</th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_INDICATORS.map((r, i) => (
                  <tr key={i}>
                    <td><a href="#" style={{ color: "var(--fg)", textDecoration: "none", fontWeight: 600 }}>{r.name}</a></td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: A.color }}>{r.aVal}</td>
                    <td style={{ width: 140 }}>
                      <DiffBar diff={r.diff} A={A} B={B} />
                    </td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: B.color }}>{r.bVal}</td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 700, fontSize: 12, color: r.diff.startsWith("-") ? "var(--danger)" : "var(--accent)" }}>{r.diff}</td>
                    <td style={{ textAlign: "right" }}><a href="#" className="btn btn-sm btn-ghost">→</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {["年齢階層別人口", "人口推移"].map((t, i) => (
              <ChartCard key={i} title={t} A={A} B={B} />
            ))}
          </div>
        </main>

        {/* Right */}
        <aside style={{ position: "sticky", top: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card">
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <div className="h3">他の比較</div>
            </div>
            <div className="side-list" style={{ padding: 6 }}>
              {[
                ["東京 vs 神奈川", "13 vs 14"],
                ["大阪 vs 兵庫", "27 vs 28"],
                ["愛知 vs 静岡", "23 vs 22"],
                ["北海道 vs 沖縄", "01 vs 47"],
              ].map(([t, m], i) => <a key={i} href="#"><span>{t}</span><span className="meta">{m}</span></a>)}
            </div>
          </div>
          <AdSlot height={250} />
        </aside>
      </div>
    </div>
  );
}

function ScoreSide({ region, score, reverse }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexDirection: reverse ? "row-reverse" : "row" }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: region.color, color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, fontWeight: 800,
      }}>{region.name.slice(0, 1)}</div>
      <div style={{ textAlign: reverse ? "right" : "left" }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{region.name}</div>
        <div className="muted" style={{ fontSize: 10.5 }}>リード指標数</div>
        <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: region.color }}>{score}</div>
      </div>
    </div>
  );
}

function DiffBar({ diff, A, B }) {
  const v = parseFloat(diff);
  const aLeads = !diff.startsWith("-");
  const mag = Math.min(100, Math.abs(v));
  return (
    <div style={{ display: "flex", alignItems: "center", height: 8, background: "var(--bg-muted)", borderRadius: 999, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "var(--border-strong)" }} />
      {aLeads ? (
        <div style={{ position: "absolute", right: "50%", height: "100%", width: `${mag / 2}%`, background: A.color, borderRadius: 999 }} />
      ) : (
        <div style={{ position: "absolute", left: "50%", height: "100%", width: `${mag / 2}%`, background: B.color, borderRadius: 999 }} />
      )}
    </div>
  );
}

window.CompareOptionC = CompareOptionC;
window.ScoreSide = ScoreSide;
window.DiffBar = DiffBar;
