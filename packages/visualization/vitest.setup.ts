import "@testing-library/jest-dom";

// D3 のレイアウト計算やトランジションで使われる SVG プロパティをモック化
if (typeof SVGElement !== "undefined") {
  // getBBox (レイアウト計算用)
  if (!(SVGElement.prototype as any).getBBox) {
    (SVGElement.prototype as any).getBBox = function () {
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        toJSON: () => {},
      };
    };
  }

  // transform.baseVal (トランジション・アニメーション用)
  // jsdom は transform プロパティを持っていないため、最小限の構造をモック
  if (!(SVGElement.prototype as any).transform) {
    Object.defineProperty(SVGElement.prototype, "transform", {
      get() {
        return {
          baseVal: {
            numberOfItems: 0,
            getItem: () => ({ matrix: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } }),
            consolidate: () => null,
            appendItem: () => {},
            clear: () => {},
            initialize: () => {},
            insertItemBefore: () => {},
            removeItem: () => {},
            replaceItem: () => {},
          },
        };
      },
      configurable: true,
    });
  }

  // getComputedTextLength (テキスト幅の計算用)
  if (!(SVGElement.prototype as any).getComputedTextLength) {
    (SVGElement.prototype as any).getComputedTextLength = function () {
      return 0;
    };
  }
}

// SVGSVGElement 固有のメソッド
if (typeof SVGSVGElement !== "undefined") {
  if (!SVGSVGElement.prototype.createSVGMatrix) {
    SVGSVGElement.prototype.createSVGMatrix = () => ({
      a: 1, b: 0, c: 0, d: 1, e: 0, f: 0,
      multiply: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    } as any);
  }
  if (!SVGSVGElement.prototype.createSVGPoint) {
    SVGSVGElement.prototype.createSVGPoint = () => ({
      x: 0, y: 0, matrixTransform: () => ({ x: 0, y: 0 }),
    } as any);
  }
  if (!SVGSVGElement.prototype.createSVGTransform) {
    SVGSVGElement.prototype.createSVGTransform = () => ({
      type: 0, matrix: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      setMatrix: () => {},
    } as any);
  }
}

// ResizeObserver (Radix UI 等で使用)
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
