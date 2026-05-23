/* Option C — スティッキー・コントロール・レール (PC最適化)
   左にスティッキー縦型コントロールパネル。すべての切替を視覚的に列挙。
   CSVは「データを取得」プライマリCTAとして大きく。
   中央: 地図 + 表 (横並び)。右: アフィリエイト・AdSenseを整理。 */

function OptionC() {
  const [unit, setUnit] = React.useState("total");
  const [area, setArea] = React.useState("pref");
  const [year, setYear] = React.useState("2024");

  return (
    <div className="page">
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "ランキング" },
          { label: "人口・世帯" }, { label: "総人口", current: true },
        ]} />
      </div>

      <header style={{ padding: "10px 24px 0" }}>
        <h1 className="h1">総人口ランキング</h1>
        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          総務省統計局「人口推計」 · データ年度: 2024年 · 最終更新: 2025-04-12
        </div>
      </header>

      <div style={{ padding: "16px 24px 0", display: "grid", gridTemplateColumns: "228px 1fr 260px", gap: 16, alignItems: "flex-start" }}>
        {/* ★ Left control rail */}
        <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <ControlPanel>
            <Section icon={Icons.Sigma} title="表示単位" subtitle="正規化を選択">
              <Radio name="unit" current={unit} onChange={setUnit} options={[
                { id: "total",    label: "総数",         meta: "そのままの値" },
                { id: "per_pop",  label: "人口あたり",   meta: "1,000人あたり" },
                { id: "per_area", label: "面積あたり",   meta: "1km²あたり" },
              ]} />
            </Section>
            <Section icon={Icons.Pin} title="集計範囲">
              <Radio name="area" current={area} onChange={setArea} compact options={[
                { id: "pref", label: "都道府県（47件）" },
                { id: "city", label: "市区町村（1,741件）" },
              ]} />
            </Section>
            <Section icon={Icons.Calendar} title="年度">
              <select className="select" style={{ width: "100%", padding: "8px 10px" }} value={year} onChange={(e) => setYear(e.target.value)}>
                {["2024", "2023", "2022", "2020", "2015", "2010"].map((y) => <option key={y}>{y}年</option>)}
              </select>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>6年分の時系列を取得できます</div>
            </Section>
          </ControlPanel>

          {/* CSV CTA — prominent */}
          <div className="card" style={{ padding: 14, background: "linear-gradient(180deg, var(--primary-50), #fff)", borderColor: "var(--primary-100)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              {React.cloneElement(Icons.Download, { className: "icon icon-lg", style: { color: "var(--primary)" } })}
              <div className="h3" style={{ color: "var(--primary)" }}>データをダウンロード</div>
            </div>
            <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.5, marginBottom: 10 }}>
              現在表示中の条件で CSV を取得します。
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>CSV をダウンロード</button>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center" }}>JSON</button>
              <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center" }}>Excel</button>
            </div>
            <div className="muted" style={{ fontSize: 10.5, marginTop: 8, textAlign: "center" }}>クレジット表記すれば商用利用可</div>
          </div>

          <div className="card" style={{ padding: 12 }}>
            <div className="h3" style={{ marginBottom: 8 }}>このページを共有</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center" }}>X</button>
              <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center" }}>FB</button>
              <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center" }}>URL</button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="h2">地図と順位</div>
                <span className="pill primary">{unit === "total" ? "総数" : unit === "per_pop" ? "人口あたり" : "面積あたり"}</span>
                <span className="pill">2024年</span>
              </div>
              <MapLegend />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              <div style={{ padding: 14, borderRight: "1px solid var(--border)" }}>
                <JapanMap height={420} />
              </div>
              <div style={{ maxHeight: 460, overflow: "auto" }}>
                <RankingTable rows={TOP_DATA} unit="人" />
              </div>
            </div>
            <div className="card-footer">出典: 総務省統計局「人口推計」 · 推計年: 2024年10月1日時点</div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="h3">時系列の推移</div>
            </div>
            <div className="card-body">
              <MiniTrend />
            </div>
          </div>
        </main>

        {/* Right — sidebar with ads + native */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div className="h3">関連ランキング</div>
              </div>
            </div>
            <div className="card-body" style={{ padding: 6 }}>
              <div className="side-list">
                {[
                  ["人口密度", "人/km²"],
                  ["世帯数", "世帯"],
                  ["年少人口比率", "％"],
                  ["高齢化率", "％"],
                  ["人口増減率", "％"],
                ].map(([t, m], i) => (
                  <a key={i} href="#"><span>{t}</span><span className="meta">{m}</span></a>
                ))}
              </div>
            </div>
          </div>

          <AdSlot height={250} />

          <div className="card">
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div className="h3">トップ県の特産品</div>
                <span className="pill">PR</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 10 }}>
              <AffiliateCard region="東京都" item="東京ばな奈 詰合せ 16個入" price="¥2,160" />
              <AffiliateCard region="神奈川" item="鎌倉ハム 6種化粧箱" price="¥4,800" />
            </div>
          </div>
        </aside>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

function ControlPanel({ children }) {
  return <div className="card" style={{ overflow: "hidden" }}>{children}</div>;
}

function Section({ icon, title, subtitle, children }) {
  return (
    <div style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        {React.cloneElement(icon, { className: "icon", style: { color: "var(--muted)" } })}
        <div className="h3">{title}</div>
      </div>
      {subtitle && <div className="muted" style={{ fontSize: 11, marginBottom: 8 }}>{subtitle}</div>}
      {children}
    </div>
  );
}

function Radio({ name, current, onChange, options, compact }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {options.map((o) => {
        const active = current === o.id;
        return (
          <label key={o.id} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: compact ? "6px 8px" : "8px 10px",
            borderRadius: 6,
            background: active ? "var(--primary-50)" : "transparent",
            border: `1px solid ${active ? "var(--primary-100)" : "transparent"}`,
            cursor: "pointer",
          }}>
            <input
              type="radio" name={name} checked={active}
              onChange={() => onChange(o.id)}
              style={{ accentColor: "var(--primary)" }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "var(--primary)" : "var(--fg)" }}>{o.label}</div>
              {o.meta && <div className="muted" style={{ fontSize: 11 }}>{o.meta}</div>}
            </div>
          </label>
        );
      })}
    </div>
  );
}

function MiniTrend() {
  // tiny line chart
  const w = 760, h = 140, pad = 20;
  const data = [
    [2010, 1.28], [2015, 1.27], [2020, 1.26], [2022, 1.25], [2023, 1.245], [2024, 1.24]
  ];
  const xs = data.map((d) => d[0]);
  const ys = data.map((d) => d[1]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = 1.20, yMax = 1.30;
  const px = (x) => pad + (w - pad * 2) * (x - xMin) / (xMax - xMin);
  const py = (y) => h - pad - (h - pad * 2) * (y - yMin) / (yMax - yMin);
  const path = data.map((d, i) => `${i ? "L" : "M"}${px(d[0])},${py(d[1])}`).join(" ");
  const areaPath = `${path} L${px(xMax)},${h - pad} L${px(xMin)},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 160 }}>
      <defs>
        <linearGradient id="grad-c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#grad-c)" />
      <path d={path} stroke="#1d4ed8" strokeWidth="2" fill="none" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={px(d[0])} cy={py(d[1])} r="3" fill="#1d4ed8" />
          <text x={px(d[0])} y={h - 4} fontSize="10" textAnchor="middle" fill="#6b7280">{d[0]}</text>
          <text x={px(d[0])} y={py(d[1]) - 8} fontSize="10" textAnchor="middle" fill="#0b1220" fontWeight="600">{d[1]}億</text>
        </g>
      ))}
    </svg>
  );
}

window.OptionC = OptionC;
