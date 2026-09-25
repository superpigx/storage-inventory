/**
 * compress.ts 纯函数单测（框架无关，可在 Node 直接跑，无需浏览器）。
 * 运行：node --experimental-strip-types scripts/test-compress.ts
 */
import { computeScaledSize, bisectQuality, dataUrlBytes, pickFormat, formatBytes } from '../src/domain/compress.ts';

let pass = 0;
let fail = 0;
function assert(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log('  ✓', name);
  } else {
    fail++;
    console.log('  ✗', name);
  }
}

// computeScaledSize：仅在超过 maxEdge 时等比缩放
assert('小图不缩放', JSON.stringify(computeScaledSize(800, 600, 1600)) === JSON.stringify({ w: 800, h: 600 }));
assert('长边4000->1600', JSON.stringify(computeScaledSize(4000, 3000, 1600)) === JSON.stringify({ w: 1600, h: 1200 }));
assert('竖向2000->1600', JSON.stringify(computeScaledSize(600, 2000, 1600)) === JSON.stringify({ w: 480, h: 1600 }));

// pickFormat：WebP 优先，不支持或关闭时回退 JPEG
assert('WebP优先', pickFormat(true) === 'image/webp');
assert('不支持回退JPEG', pickFormat(false) === 'image/jpeg');
assert('关闭prefer回退', pickFormat(true, false) === 'image/jpeg');

// bisectQuality：用线性估算 est(q)=300000*q 模拟（q=1→300KB，q=0.5→150KB），目标 160KB
const est = (q: number) => 300000 * q;
const target = 160 * 1024;
const q = bisectQuality(target, est, 0.82, 0.5);
assert('二分质量在合理区间[0.53,0.56]', q >= 0.53 && q <= 0.56);
assert('结果体积不超过目标(+容差)', est(q) <= target + 2000);
assert('高质量已达标直接返回上限', bisectQuality(500 * 1024, est, 0.82, 0.5) === 0.82);
assert('最低仍超标返回下限', bisectQuality(10 * 1024, est, 0.82, 0.5) === 0.5);

// dataUrlBytes：用 'hello' 的 base64（aGVsbG8=，8字符，1个'='填充）应为 5 字节
const sample = 'data:image/jpeg;base64,' + Buffer.from('hello').toString('base64');
assert('dataUrlBytes 估算正确(hello=5B)', dataUrlBytes(sample) === 5);

// formatBytes
assert('formatBytes 1.5MB', formatBytes(1572864) === '1.5MB');
assert('formatBytes 200KB', formatBytes(200 * 1024) === '200KB');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
