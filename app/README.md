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

## CI / 发版（GitHub）
- `.github/workflows/ci.yml`：push 到 main → 安装依赖 + 构建 H5（冒烟测试）
- `.github/workflows/release.yml`：打 `v*` tag → 构建并上传 H5 产物；Android APK 步骤已预留
  （需先在 `app/` 执行 `npx cap add android` 接入 Capacitor 平台目录）

## 目录
```
app/
├─ src/domain/      框架无关领域模型与仓储（不依赖任何 UI 框架）
├─ src/infra/       Taro KV 持久化实现 + 仓储单例
├─ src/store/       React 状态层
├─ src/pages/       页面（index = 位置树 CRUD）
├─ config/          Taro 编译配置
└─ README.md
```
