/** 2 点間の二次ベジェ曲線アーク + パーティクル位置の計算 */

export interface ArcGeom {
  /** 始点 (相手県) */
  p0: [number, number];
  /** 制御点 */
  p1: [number, number];
  /** 終点 (焦点県) */
  p2: [number, number];
}

/**
 * from(相手県) → to(焦点県) を結ぶ弓なりアークを作る。
 * 制御点は中点から進行方向の左手垂直方向へ距離比でオフセット。
 */
export function buildArc(
  from: [number, number],
  to: [number, number],
  bow = 0.16,
): ArcGeom {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dist = Math.hypot(dx, dy) || 1;
  const mid: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  // 進行方向に対する左手垂直単位ベクトル
  const nx = -dy / dist;
  const ny = dx / dist;
  const offset = dist * bow;
  return {
    p0: from,
    p1: [mid[0] + nx * offset, mid[1] + ny * offset],
    p2: to,
  };
}

/** ベジェ曲線上の t∈[0,1] の座標 (t=0 で p0、t=1 で p2) */
export function bezierPoint(arc: ArcGeom, t: number): [number, number] {
  const u = 1 - t;
  return [
    u * u * arc.p0[0] + 2 * u * t * arc.p1[0] + t * t * arc.p2[0],
    u * u * arc.p0[1] + 2 * u * t * arc.p1[1] + t * t * arc.p2[1],
  ];
}

/** SVG path d 文字列 */
export function bezierPath(arc: ArcGeom): string {
  return `M${arc.p0[0]},${arc.p0[1]} Q${arc.p1[0]},${arc.p1[1]} ${arc.p2[0]},${arc.p2[1]}`;
}

export interface Particle {
  x: number;
  y: number;
  /** 端で 0、中央で 1 になるフェード係数 */
  fade: number;
}

/**
 * 指定方向に流れる N 個のパーティクルの、現フレームでの位置を返す。
 * direction "in" は p0→p2 (相手県→焦点県)、"out" は p2→p0。
 * パーティクルはアーク両端で薄く、中央で濃くなる。
 */
export function particlePositions(
  arc: ArcGeom,
  count: number,
  frame: number,
  periodFrames: number,
  direction: "in" | "out",
  /** パーティクルごとの位相をずらすシード */
  seed = 0,
): Particle[] {
  if (count <= 0) return [];
  const phase = ((frame % periodFrames) / periodFrames + seed) % 1;
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const raw = (phase + i / count) % 1;
    const t = direction === "in" ? raw : 1 - raw;
    const [x, y] = bezierPoint(arc, t);
    out.push({ x, y, fade: Math.sin(raw * Math.PI) });
  }
  return out;
}
