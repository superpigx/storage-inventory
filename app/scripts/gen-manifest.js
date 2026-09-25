#!/usr/bin/env node
/**
 * 生成双源自动更新清单 manifest.json
 * 由 CI（GitHub Actions / CNB）在打 tag 时调用，产物随 Release 附件分发。
 *
 * App 端更新服务逻辑：
 *   1. 依次请求 sources 列表中的源，取首个可用清单；
 *   2. 用 manifest.version 与本地 version 比对，更新版本则拉取对应 h5Bundle / androidApk；
 *   3. 任一源失败自动 fallback 到下一个，实现「双源自动更新」。
 *
 * 环境变量（CI 注入，缺省为占位符，需在仓库设置中填写真实 slug）：
 *   GITHUB_REPO_SLUG  e.g. octocat/storage-inventory
 *   CNB_REPO_SLUG     e.g. mygroup/storage-inventory
 *   RELEASE_NOTES    可选，更新说明
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const version = pkg.version;
const tag = `v${version}`;

const githubSlug = process.env.GITHUB_REPO_SLUG || 'superpigx/storage-inventory';
const cnbSlug = process.env.CNB_REPO_SLUG || 'crazypigx/storage-inventory';

const manifest = {
  app: 'storage-inventory',
  version,
  generatedAt: new Date().toISOString(),
  // 下载源优先级（App 按顺序尝试，前一个失败则 fallback 到下一个）
  sources: ['cnb', 'github'],
  androidApk: {
    cnb: `https://cnb.cool/${cnbSlug}/-/releases/${tag}/download/app-release.apk`,
    github: `https://github.com/${githubSlug}/releases/download/${tag}/app-release.apk`,
  },
  h5Bundle: {
    cnb: `https://cnb.cool/${cnbSlug}/-/releases/${tag}/download/dist-h5.tar.gz`,
    github: `https://github.com/${githubSlug}/releases/download/${tag}/dist-h5.tar.gz`,
  },
  notes: process.env.RELEASE_NOTES || '',
};

const distDir = path.join(root, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`[gen-manifest] wrote dist/manifest.json @ ${version} (sources: ${manifest.sources.join(', ')})`);
