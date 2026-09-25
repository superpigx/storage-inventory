import Taro from '@tarojs/taro';

// 选取照片并压缩为 dataURL，便于 KV 存储与跨端预览。
// H5：用 canvas 压缩（maxSize 限制长边、quality 控制 JPEG 质量）。
// 非 H5（原生/小程序）：直接返回原始路径，原生持久化留待 P4。
export async function pickPhoto(maxSize = 1024, quality = 0.72): Promise<string | null> {
  try {
    const res: any = await Taro.chooseImage({ count: 1, sizeType: ['compressed', 'original'] });
    const path = res?.tempFiles?.[0]?.path || res?.tempFilePaths?.[0] || null;
    if (!path) return null;
    return compressToDataURL(path, maxSize, quality);
  } catch {
    return null; // 用户取消或无相机权限
  }
}

async function compressToDataURL(src: string, maxSize: number, quality: number): Promise<string> {
  if (typeof document === 'undefined') return src; // 非 H5 环境：保留原始路径
  const blob = await (await fetch(src)).blob();
  const bitmap = await createImageBitmap(blob);
  let { width, height } = bitmap;
  const scale = Math.min(1, maxSize / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}
