# 收纳库存 App

把「翻柜子找衣服」变成「先查后找」。一套代码（**Taro 3 + React 18 + TypeScript**）覆盖
**Android 应用（主）/ H5·PWA（iPhone 偶尔用）/ 微信小程序（后期）**。

## 技术栈
- Taro 3.6 + React 18 + TypeScript
- **业务逻辑与 UI 解耦**：`src/domain`（框架无关数据模型 + 仓储）、`src/infra`（KV 持久化实现）、`src/store`（状态）、`src/pages`（UI）
- 本地离线优先；后期接云同步
- Android App 经 **Capacitor** 封装 H5（便于 OTA 自动更新）

## 本地运行
```bash
cd app
npm install
npm run dev:h5      # 本地 H5 开发预览
npm run build:h5    # 产物输出到 app/dist
```

## 构建各端
- **H5 / PWA**：`npm run build:h5`（iPhone 用 Safari「添加到主屏幕」即用）
- **微信小程序**：`npm run build:weapp`，用微信开发者工具打开 `app/dist`
- **Android APK**：`npm run build:h5` 后用 Capacitor 封装（见 `.github/workflows/release.yml` 注释）

## 数据与自动更新
- MVP 数据存本机（Taro Storage），离线可用，无账号
- 自动更新：Android 端接 **Capacitor + Capgo**，以 `package.json` 的 `version` 为基线；
  CI 构建新包推送后，App 启动自动拉取热更新（用户无感）

## CI / 发版（GitHub + 腾讯 CNB 双源）
- `.github/workflows/ci.yml`：push 到 main → 安装依赖 + 构建 H5（冒烟测试）
- `.github/workflows/release.yml`：打 `v*` tag → 构建 H5 + 打包 + 生成 `manifest.json`（双源下载地址）并上传产物；Android APK 步骤已预留
  （需先在 `app/` 执行 `npx cap add android` 接入 Capacitor 平台目录）
- `.cnb.yml`（腾讯云原生构建）：与 GitHub 双源镜像。push 到 main 做冒烟；打 tag 自动建 CNB Release 并上传 `dist-h5.tar.gz` + `manifest.json`
- 两平台的 tag 发版产物一致，互为备份与 fallback

## 双库备份与双源自动更新
代码仓库**双库热备**：GitHub（主/备份）+ 腾讯 CNB（国内快、免 GFW，作为主构建分发源）。
一条 `git push` 同时推两家，避免单点丢失：

```bash
# 1) 先各自添加为独立 remote（便于区分）
git remote add github <你的-github-仓库.git>
git remote add cnb    <你的-cnb-仓库.git>

# 2) 或：单 origin 配双 push URL，一次推送两家（推荐）
git remote set-url origin <github-仓库.git>
git remote set-url --add --push origin <github-仓库.git>
git remote set-url --add --push origin <cnb-仓库.git>
git push origin --tags        # 一次性推送到 GitHub + CNB
```

**双源自动更新**架构：
- CI 在打 tag 时生成 `app/dist/manifest.json`，内含 `version` 与 `androidApk`/`h5Bundle` 在
  **CNB 与 GitHub 两份下载地址**，以及 `sources: ["cnb","github"]` 优先级。
- App 端更新服务（P4 接入）按顺序请求各源，取首个可用清单；比对本地 `version`，
  有更新则拉取对应包并应用（H5 走 Capacitor OTA，Android 提示装 APK），任一源失败自动 fallback。
- ⚠️ 区分：代码仓库双库 ≠ **照片数据同步**。衣物照片的多设备同步仍按原计划走**坚果云**等网盘，两者是不同层。

## 数据与自动更新
- MVP 数据存本机（Taro Storage），离线可用，无账号
- 自动更新：Android 端接 **Capacitor + Capgo**（或自建 OTA）；以 `package.json` 的 `version` 为基线；
  CI 构建新包推送后，App 启动自动拉取热更新（用户无感）；双源 manifest 提供 CNB/GitHub 冗余下载

## 目录
```
app/
├─ src/domain/      框架无关领域模型与仓储（不依赖任何 UI 框架）
├─ src/infra/       Taro KV 持久化实现 + 仓储单例
├─ src/store/       React 状态层
├─ src/pages/       页面（index = 位置树 CRUD）
├─ config/          Taro 编译配置
└─ README.md

## P4：照片高压缩 + Capacitor 真机 + 坚果云同步（实战步骤）

### 1) 照片高压缩高保真（已完成）
- 算法在 `src/domain/compress.ts`（框架无关纯函数：缩放 / 格式选择 / 质量二分），由 `src/infra/photo.ts` 在 H5 用 canvas 执行。
- 策略：最长边缩到 1600px → 优先 WebP（Android 全支持，比 JPEG 小 25-35%）→ 二分质量使单图 ≤160KB。
- 衣物照片多时，可改用 `src/infra/photoStore.ts`（IndexedDB，不占 localStorage 5MB 配额）。

### 2) Android 真机 APK（需本机）
```bash
cd app
npm install
npx cap add android     # 生成 android/ 原生工程（仅需一次，需 Android SDK）
npx cap sync            # 把 dist/ 同步进 android 工程
cd android && ./gradlew assembleRelease   # 产出 app-release.apk
```
首次 `npx cap add android` 需在已装 Android SDK 的机器执行；GitHub/CNB Actions 已配置自动出包（打 tag 触发）。

### 3) 坚果云照片同步（对接点）
- `src/infra/photoStore.ts` 提供 `exportAll()`（导出全部照片 JSON）与 `importAll(json)`（合并导入）。
- 手动方案：把导出 JSON 放进坚果云同步目录，换设备后 `importAll` 恢复；多设备冲突按 id 覆盖合并。
- 端到端自动同步需后续接入坚果云 WebDAV API（需账号），本版提供本地导出/导入作为手动同步基础。
```
