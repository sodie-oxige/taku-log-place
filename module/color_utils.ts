/**
 * 色の扱いを簡略化するモジュール
 */
export class ColorUtils {
  /**
   * カラーコードからrgbに変換を行う
   * @param code カラーコード文字列
   * @returns rgbオブジェクト
   */
  public static code2rgb(code: ColorUtils.Code): ColorUtils.RGB {
    const r = parseInt(code.slice(1, 3), 16);
    const g = parseInt(code.slice(3, 5), 16);
    const b = parseInt(code.slice(5, 7), 16);
    return {
      r: r,
      g: g,
      b: b,
    };
  }

  /**
   * カラーコードからhsvに変換を行う
   * @param code カラーコード文字列
   * @returns hsvオブジェクト
   */
  public static code2hsl(code: ColorUtils.Code) {
    const rgb = this.code2rgb(code);
    const a = Math.max(rgb.r, rgb.g, rgb.b);
    const n = Math.min(rgb.r, rgb.g, rgb.b);
    const h =
      a == n
        ? 0
        : rgb.r == a
        ? 60 * ((rgb.g - rgb.b) / (a - n))
        : rgb.g == a
        ? 60 * ((rgb.b - rgb.r) / (a - n)) + 120
        : rgb.b == a
        ? 60 * ((rgb.r - rgb.g) / (a - n)) + 240
        : 0;
    const l = ((a + n) / 2) * (100 / 255);
    const s = ((a - n) / Math.min(a + n, 510 - a - n)) * 100;
    return {
      h: h,
      s: s,
      l: l,
    };
  }

  public static hsl2code(hsl: ColorUtils.HSL): ColorUtils.Code {
    const a = 2.55 * (hsl.l + (Math.min(100 - hsl.l, hsl.l) * hsl.s) / 100);
    const n = 2.55 * (hsl.l - (Math.min(100 - hsl.l, hsl.l) * hsl.s) / 100);
    const [r, g, b] =
      hsl.h <= 60
        ? [a, (hsl.h / 60) * (a - n) + n, n]
        : hsl.h <= 120
        ? [((120 - hsl.h) / 60) * (a - n) + n, a, n]
        : hsl.h <= 180
        ? [n, a, ((hsl.h - 120) / 60) * (a - n) + n]
        : hsl.h <= 240
        ? [n, ((240 - hsl.h) / 60) * (a - n) + n, a]
        : hsl.h <= 300
        ? [((hsl.h - 240) / 60) * (a - n) + n, n, a]
        : [a, n, ((360 - hsl.h) / 60) * (a - n) + n];
    const H = (n: number): string =>
      Math.round(n).toString(16).padStart(2, "0");
    const colorcode: ColorUtils.Code = `#${H(r)}${H(g)}${H(b)}`;
    return colorcode;
  }

  public static hsl2hsv(hsl: ColorUtils.HSL): ColorUtils.HSV {
    const v = hsl.l + (hsl.s * Math.min(hsl.l, 100 - hsl.l)) / 100;
    const s = ((2 * (v - hsl.l)) / v) * 100;
    return {
      h: hsl.h,
      s: s,
      v: v,
    };
  }
  public static hsv2hsl(hsv: ColorUtils.HSV): ColorUtils.HSL {
    const l = hsv.v * (1 - hsv.s / 200);
    const s = ((hsv.v - l) / Math.min(l, 100 - l)) * 100;
    return {
      h: hsv.h,
      s: s,
      l: l,
    };
  }
}

export namespace ColorUtils {
  /**
   * カラーコード型
   */
  export type Code = `#${string}`;

  /**
   * HSL型
   * @property {int<0,360>} h - angle
   * @property {int<0,100>} s - percentage
   * @property {int<0,100>} l - percentage
   */
  export interface HSL {
    h: number;
    s: number;
    l: number;
  }

  /**
   * HSV型
   * @property {int<0,360>} h - angle
   * @property {int<0,100>} s - percentage
   * @property {int<0,100>} v - percentage
   */
  export interface HSV {
    h: number;
    s: number;
    v: number;
  }

  /**
   * RGB型
   * @property {int<0,255>} r - number
   * @property {int<0,255>} g - number
   * @property {int<0,255>} b - number
   */
  export interface RGB {
    r: number;
    g: number;
    b: number;
  }
}
