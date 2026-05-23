/* Option B — メトリクス・カードタブ (Bold)
   「総数 / 人口あたり / 面積あたり」を3枚の大きなメトリックカードに格上げ。
   各カードに現在値・1位の都道府県を表示し、クリックで切替。
   CSV ダウンロードは "データを取得" CTA として大きく見せる。 */

function OptionB() {
  const [unit, setUnit] = React.useState("total");
  const [year, setYear] = React.useState("2024");
  const [area, setArea] = React.useState("pref");

  // metric definitions
  const metrics = [
    { id: "total",   icon: Icons.Sigma,  label: "総数",
      value: "1.24億人",   sub: "全国合計",
      top: { name: "東京都", v: "1,401万人" } },
    { id: "per_pop", icon: Icons.Users,  label: "人口1人あたり",
      value: "—",           sub: "ベース：総人口",
      top: { name: "東京都", v: "1.00 ratio" } },
    { id: "per_area", icon: Icons.Area,  label: "面積1km²あたり",
      value: "335 人/km²",  sub: "全国平均",
      top: { name: "東京都", v: "6,398 人/km²" } },
  ];

  return (
    <div className="page">
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "ランキング" },
          { label: "人口・世帯" }, { label: "総人口", current: true },
        ]} />
      </div>

      <header style={{ padding: "12px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
        <div>
          <h1 className="h1">総人口</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            総務省統計局「人口推計」 · データ年度 2024 · 最終更新 2025-04-12
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="select" style={{ padding: "8px 12px" }}>
            {React.cloneElement(Icons.Calendar, { className: "icon icon-sm" })}
            <select style={{ border: 0, background: "transparent", font: "inherit" }} value={year} onChange={(e) => setYear(e.target.value)}>
              {["2024", "2023", "2022", "2020", "2015"].map((y) => <option key={y}>{y}年</option>)}
            </select>
          </div>
          <div className="seg">
            <button className={"item" + (area === "pref" ? " active" : "")} onClick={() => setArea("pref")}>都道府県</button>
            <button className={"item" + (area === "city" ? " active" : "")} onClick={() => setArea("city")}>市区町村</button>
          </div>
        </div>
      </header>

      {/* ★ Metric tabs as cards */}
      <div style={{ padding: "16px 24px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>表示する指標</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {metrics.map((m) => {
            const active = unit === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setUnit(m.id)}
                style={{
                  textAlign: "left", cursor: "pointer", font: "inherit",
                  padding: 16,
                  borderRadius: 12,
                  border: `1.5px solid ${active ? "var(--primary)" : "var(--border)"}`,
                  background: active ? "var(--primary-50)" : "var(--bg)",
                  display: "flex", flexDirection: "column", gap: 10,
                  position: "relative",
                  boxShadow: active ? "0 6px 24px -10px rgba(29, 78, 216, 0.30)" : "var(--shadow-sm)",
                  transition: "all .15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: active ? "var(--primary)" : "var(--bg-muted)",
                    color: active ? "#fff" : "var(--muted)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {React.cloneElement(m.icon, { className: "icon icon-lg" })}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: active ? "var(--primary)" : "var(--fg)" }}>
                      {m.label}
                    </div>
                    <div className="muted" style={{ fontSize: 11 }}>{m.sub}</div>
                  </div>
                  {active && (
                    <span className="pill primary" style={{ marginLeft: "auto" }}>表示中</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: active ? "var(--primary)" : "var(--fg)" }} className="mono">{m.value}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "right" }}>
                    1位 {m.top.name}<br />
                    <span className="mono" style={{ color: "var(--fg-2)" }}>{m.top.v}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-row: CSV CTA + small actions */}
      <div style={{ padding: "12px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-primary" style={{ padding: "9px 14px" }}>
            {React.cloneElement(Icons.Download, { className: "icon" })}
            このデータを CSV で取得
          </button>
          <button className="btn">
            {React.cloneElement(Icons.Share, { className: "icon" })}
            共有
          </button>
          <button className="btn">
            {React.cloneElement(Icons.Bookmark, { className: "icon" })}
            保存
          </button>
        </div>
        <div className="muted" style={{ fontSize: 12 }}>
          47都道府県 · 6年分の時系列を含む · 5.6KB
        </div>
      </div>

      {/* Map + Table */}
      <div style={{ padding: "16px 24px 0", display: "flex", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="card">
              <div className="card-header">
                <div className="h2">地図で見る</div>
                <MapLegend />
              </div>
              <div className="jp-map" style={{ padding: 12 }}>
                <JapanMap height={400} />
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <div className="h2">順位表</div>
                <div className="muted" style={{ fontSize: 12 }}>47位まで · スクロール</div>
              </div>
              <div style={{ maxHeight: 430, overflow: "auto" }}>
                <RankingTable rows={TOP_DATA} unit="人" />
              </div>
            </div>
          </div>

          {/* Native affiliate strip */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="h3">ランキング上位の都道府県から</div>
                <span className="pill">PR</span>
              </div>
              <a href="#" className="btn btn-sm btn-ghost">
                もっと見る
                {React.cloneElement(Icons.ChevronRight, { className: "icon icon-sm" })}
              </a>
            </div>
            <div className="card-body" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: 12 }}>
              <AffiliateCard region="東京都" item="東京駅限定 銘菓詰め合わせ 12個入" price="¥3,240" />
              <AffiliateCard region="神奈川県" item="鎌倉ハム 6種詰め合わせ 化粧箱" price="¥4,800" />
              <AffiliateCard region="大阪府" item="551蓬莱 豚まん 10個セット" price="¥3,500" />
            </div>
          </div>
        </div>

        <aside style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <RelatedSidebar>
            <AdSlot height={250} />
          </RelatedSidebar>
        </aside>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

window.OptionB = OptionB;
