# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-09-25
### Added
- 项目初始化：Taro 3（React 18 + TypeScript）脚手架
- 框架无关数据模型（位置树 Home/Room/Cabinet/Bag + Item，`src/domain`）
- 本地持久化层（离线优先）
- 位置树 CRUD 界面（H5 可预览）
- Git 初始化 + CHANGELOG 工程规范
- GitHub Actions：CI（push 触发 lint + build h5 冒烟）、Release（打 tag 触发，H5 产物上传，Android APK 步骤预留）
