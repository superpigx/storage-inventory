import Taro from '@tarojs/taro';
import {
  DEFAULT_COMPRESS,
  computeScaledSize,
  pickFormat,
  bisectQuality,
  dataUrlBytes,
  type CompressOptions,
} from '../domain/compress';

export interface PhotoResult {
  dataUrl: string;
  bytes: number;
  width: number;
  height: number;
  format: 'image/webp' | 'image/jpeg' | 'native';
  quality: number;
}

/**
 * 选取照片并按「高压缩高保真」策略压缩：
 * 1) 等比缩放到最长边 maxEdge（默认 1600px）
 * 2) 优先 WebP（Android 全支持，比 JPEG 小 25-35%），否则 JPEG
 * 3) 二分质量，使体积 <= targetBytes（默认 160KB）
 * H5：canvas 编码；非 H5（原生/小程序）：暂返回原始路径，原生持久化留待后续。
 */
export async function pickPhoto(opts?: CompressOptions): Promise<PhotoResult | null> {
  try {
    const res: any = await Taro.chooseImage({ count: 1, sizeType: ['compressed', 'original'] });
    const path = res?.tempFiles?.[0]?.path || res?.tempFilePaths?.[0] || null;
    if (!path) return null;
    return compressFromSrc(path, opts);
  } catch {
    return null; // 用户取消或无相机权限
  }
}

export async function compressFromSrc(src: string, opts?: CompressOptions): Promise<PhotoResult | null> {
  const o: Required<CompressOptions> = { ...DEFAULT_COMPRESS, ...opts };
  if (typeof document === 'undefined') {
    // 非 H5 环境：保留原始路径（原生 FileSystem / 小程序临时路径）
    return { dataUrl: src, bytes: 0, width: 0, height: 0, format: 'native', quality: 1 };
  }
  try {
    const blob = await (await fetch(src)).blob();
    const bitmap = await createImageBitmap(blob);
    const { w, h } = computeScaledSize(bitmap.width, bitmap.height, o.maxEdge);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { dataUrl: src, bytes: 0, width: 0, height: 0, format: 'native', quality: 1 };
    ctx.drawImage(bitmap, 0, 0, w, h);

    let webpSupported = false;
    try {
      webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
    } catch {
      webpSupported = false;
    }
    const format = pickFormat(webpSupported, o.preferWebp);
    const estimate = (q: number) => dataUrlBytes(canvas.toDataURL(format, q));
    const quality = bisectQuality(o.targetBytes, estimate, o.qualityHigh, o.qualityLow);

    const dataUrl = canvas.toDataURL(format, quality);
    return {
      dataUrl,
      bytes: dataUrlBytes(dataUrl),
      width: w,
      height: h,
      format,
      quality,
    };
  } catch {
    return null;
  }
}
