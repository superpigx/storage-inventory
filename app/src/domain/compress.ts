/**
 * 框架无关的图像压缩决策逻辑（不依赖任何运行时 / 浏览器 API）。
 * 真实的像素缩放与编码在 src/infra/photo.ts 用 canvas 完成；
 * 此处的纯函数只负责「算多大、选什么格式、用什么质量」，便于单测与未来框架迁移。
 *
 * 衣物照片特征：色彩相对简单、无需原图分辨率（原图 3000px+ 纯属浪费），
 * 故策略为「先等比缩放 → 再按目标体积二分质量」，在肉眼几乎无差的前提下把体积压到极小。
 */

export interface CompressOptions {
  maxEdge?: number; // 最长边像素上限，默认 1600（手机屏 1080p 足够，再大观感无提升）
  targetBytes?: number; // 目标体积上限，默认 160KB
  qualityHigh?: number; // 起始/最高质量，默认 0.82
  qualityLow?: number; // 质量下限，默认 0.5（再低肉眼可见劣化，无意义）
  preferWebp?: boolean; // 是否优先 WebP（Android 全支持、比 JPEG 小 25-35%），默认 true
}

export const DEFAULT_COMPRESS: Required<CompressOptions> = {
  maxEdge: 1600,
  targetBytes: 160 * 1024,
  qualityHigh: 0.82,
  qualityLow: 0.5,
  preferWebp: true,
};

/** 计算等比缩放后的尺寸（仅在超过 maxEdge 时缩放，避免小图被放大） */
export function computeScaledSize(w: number, h: number, maxEdge: number): { w: number; h: number } {
  const long = Math.max(w, h);
  if (long <= maxEdge) return { w, h };
  const scale = maxEdge / long;
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
}

/** 选编码格式：WebP 优先；不支持或明确关闭时回退 JPEG */
export function pickFormat(webpSupported: boolean, preferWebp = true): 'image/webp' | 'image/jpeg' {
  return preferWebp && webpSupported ? 'image/webp' : 'image/jpeg';
}

/**
 * 二分质量搜索：给定估算函数 estimate(quality) => 字节数，
 * 找到满足「字节数 <= targetBytes」的最高质量。
 * 若最高质量已达标直接返回；若最低质量仍超标则返回下限（宁可小不可挂）。
 */
export function bisectQuality(
  targetBytes: number,
  estimate: (q: number) => number,
  high = 0.82,
  low = 0.5
): number {
  if (estimate(high) <= targetBytes) return high;
  if (estimate(low) > targetBytes) return low;
  let lo = low;
  let hi = high;
  for (let i = 0; i < 6; i++) {
    const mid = (lo + hi) / 2;
    // 质量越低体积越小：达标就试着提高质量(lo=mid)，超标就降低质量(hi=mid)
    if (estimate(mid) <= targetBytes) lo = mid;
    else hi = mid;
  }
  return Math.round(lo * 100) / 100;
}

/** 预估 dataURL 的字节数（Base64 解码估算，无需浏览器环境，可用于运行时统计与单测） */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return 0;
  const b64 = dataUrl.slice(comma + 1);
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

/** 人类可读体积 */
export function formatBytes(n: number): string {
  if (!n) return '0B';
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}
