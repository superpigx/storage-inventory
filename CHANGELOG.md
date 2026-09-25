# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]
### Fixed
- **CI 跨平台构建修复**：lockfile 缺失 Linux/macOS 平台原生包（@swc/core、@tarojs/binding、@tarojs/plugin-doctor），CI 上回退旧版 wasm 报 `unknown field cwd` / `Cannot find module`；将各平台包显式加入 `optionalDependencies`（仅入 lock，Windows 不安装），GitHub Actions 与 CNB 流水线均通过
- 双源仓库 slug 落地（CNB `crazypigx/storage-inventory` / GitHub `superpigx/storage-inventory`）
### Added
- 腾讯 CNB 双源 CI 配置 `.cnb.yml`（push 冒烟 + tag 发版建 Release 并上传附件）
- 双源更新清单生成脚本 `app/scripts/gen-manifest.js`（产出含 CNB/GitHub 双下载地址的 `manifest.json`）
- GitHub `release.yml` 增补打包 + 生成 manifest + 上传双源产物
- 双库备份（GitHub + CNB）git 双 push 配置说明与双源自动更新架构文档
- **P2 衣物录入**：`item-edit` 页（拍照/选图 + H5 canvas 压缩为 dataURL、名称/类别/季节/颜色/标签、所属压缩袋选择）；领域层 Item CRUD；照片工具 `src/infra/photo.ts`
- **P3 反向检索 / 浏览**：`items` 页（文本搜索 + 季节/颜色/类别筛选 chips + 照片网格）；卡片展示位置路径「家 › 房间 › 柜子 › 压缩袋」（Killer Feature）；首页新增「衣物检索」入口
- 检索纯函数 `src/domain/search.ts`（`matchItem` / `locationPath`，框架无关可迁移）
- **P4 照片高压缩高保真**：框架无关压缩纯函数 `src/domain/compress.ts`（长边缩放 / WebP 优先 / 目标体积质量二分，附 node 单测 13/13）；`src/infra/photo.ts` 升级 H5 canvas 智能压缩（长边 1600px → WebP → ≤160KB）；`item-edit` 显示压缩结果（格式/体积/质量）
- **P4 照片存储抽象 `src/infra/photoStore.ts`**：IndexedDB 实现，`exportAll`/`importAll` 为坚果云同步对接点
- **P4 Capacitor 就绪**：`capacitor.config.ts` + `@capacitor/*` 依赖，本机 `npx cap add android` 出真机 APK；README 补 P4 实战步骤（Capacitor 真机 / 坚果云同步）
- **P3 检索体验打磨**：文本搜索现可匹配位置名（搜「主卧」即列出主卧所有衣物，强化反向检索）；新增「按位置分组」视图（按 家›房间›柜子›袋 分组并标注每组数量）；排序（最近录入/名称/位置）；已选条件清除条；分组标题计数与改进空状态；检索单测 `scripts/test-search.ts`（11/11 覆盖位置名匹配与筛选逻辑）
- **UI 全面重设计（设计系统）**：`app.css` 建立设计令牌（CSS 变量：调色板/圆角/阴影/缓动）、共享组件类（btn/chip/field/card/icon-btn/empty）、GPU 友好微动效（fadeUp 入场 + :active 按压缩放）与 `prefers-reduced-motion` 降级；新增 `src/components/Icon.tsx` 内联 SVG 图标集（21 个，替代全部 emoji）；三页（位置树/检索/录入）统一套用，桌面预览模拟 600px 手机列宽
- **P4 用户自配坚果云 WebDAV 同步**：新增设置页 `pages/settings`（服务器地址/目录/账号/应用密码 + 测试连接 + 上传备份 + 下载合并）；WebDAV 客户端 `src/infra/webdav.ts`（HTTP 适配层可注入，H5 走 fetch，Capacitor 原生自动切 CapacitorHttp 绕过 CORS）；合并纯函数 `src/domain/sync.ts`（按 id 本地优先合并 + 依赖顺序，node 单测 8/8）；仓储新增 `importData` 批量导入；首页新增设置入口。密码仅存本地设备，账号由用户自带

## [0.1.0] - 2026-09-25
### Added
- 项目初始化：Taro 3（React 18 + TypeScript）脚手架
- 框架无关数据模型（位置树 Home/Room/Cabinet/Bag + Item，`src/domain`）
- 本地持久化层（离线优先）
- 位置树 CRUD 界面（H5 可预览）
- Git 初始化 + CHANGELOG 工程规范
- GitHub Actions：CI（push 触发 lint + build h5 冒烟）、Release（打 tag 触发，H5 产物上传，Android APK 步骤预留）
