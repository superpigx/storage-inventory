# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]
### Added
- 腾讯 CNB 双源 CI 配置 `.cnb.yml`（push 冒烟 + tag 发版建 Release 并上传附件）
- 双源更新清单生成脚本 `app/scripts/gen-manifest.js`（产出含 CNB/GitHub 双下载地址的 `manifest.json`）
- GitHub `release.yml` 增补打包 + 生成 manifest + 上传双源产物
- 双库备份（GitHub + CNB）git 双 push 配置说明与双源自动更新架构文档
- **P2 衣物录入**：`item-edit` 页（拍照/选图 + H5 canvas 压缩为 dataURL、名称/类别/季节/颜色/标签、所属压缩袋选择）；领域层 Item CRUD；照片工具 `src/infra/photo.ts`
- **P3 反向检索 / 浏览**：`items` 页（文本搜索 + 季节/颜色/类别筛选 chips + 照片网格）；卡片展示位置路径「家 › 房间 › 柜子 › 压缩袋」（Killer Feature）；首页新增「衣物检索」入口
- 检索纯函数 `src/domain/search.ts`（`matchItem` / `locationPath`，框架无关可迁移）

## [0.1.0] - 2026-09-25
### Added
- 项目初始化：Taro 3（React 18 + TypeScript）脚手架
- 框架无关数据模型（位置树 Home/Room/Cabinet/Bag + Item，`src/domain`）
- 本地持久化层（离线优先）
- 位置树 CRUD 界面（H5 可预览）
- Git 初始化 + CHANGELOG 工程规范
- GitHub Actions：CI（push 触发 lint + build h5 冒烟）、Release（打 tag 触发，H5 产物上传，Android APK 步骤预留）
