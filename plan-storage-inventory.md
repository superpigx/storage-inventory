# 收纳库存 App — 实施计划 v0.2

## 一、产品定位
把「翻柜子找衣服」变成「先查后找」。
MVP 聚焦：压缩袋里的衣物管理；架构预留扩展：柜内任意物品。

## 二、技术栈（已定）
- **框架：Taro 3（React 18 + TypeScript + Vite）**——一套代码出 **微信小程序（后期）+ H5/PWA（iPhone 偶尔用）+ Android App（主）**
- **业务逻辑与 UI 解耦**：数据模型 / 检索 / 持久化写成**框架无关的纯 TS 模块**（`src/domain/`），UI 用 Taro React。哪天 Taro 不香了，核心代码直接搬。
- 本地存储：Taro Storage + 轻量持久化层（离线优先），照片存本地；后期接云同步
- 状态管理：Zustand（或 React Context，轻量优先）
- Android App：Taro 编译 + Capacitor 壳（便于 OTA 自动更新）
- iPhone 交付：H5 构建为 **PWA** 加到主屏（免 Apple 账号）

## 三、数据模型（框架无关 TS）
- Location 树：Home 1—* Room 1—* Cabinet 1—* Bag 1—* Item
- Item：id, name, category(上衣/裤/外套…), season, color, photoPath, tags[], bagId, createdAt
- Bag：id, name, photoPath, cabinetId, createdAt
- Location 节点（Home/Room/Cabinet）：id, type, name, parentId
- 反向检索：对 Item 做 (season/type/color/keyword) 过滤，沿外键回溯 Home→…→Bag 位置路径（Killer Feature）

## 四、MVP 范围（第一版）
1. 位置树管理（家/房间/柜子/袋子 增删改）
2. 衣物录入（拍照 + 选属性 + 选所在袋子）
3. 照片网格浏览（按袋子 / 按房间）
4. 反向检索（搜 颜色/季节/类型/关键词 → 显示位置路径）
5. 本地离线，无账号

## 五、暂不在 MVP（路线规划）
- 云同步 / 多设备
- 二维码扫码开袋（先手动选）
- NFC、家人共享、统计报表
- 微信小程序（后期目标，Taro 原生支持，非 MVP）

## 六、默认假设（已确认）
1. 平台权重：主用 **Android App**；iPhone 偶尔用走 **H5/PWA**；后期扩展 **微信小程序**
2. 同步：MVP 本地离线，后期云同步
3. 袋子对应：MVP 纯照片+手动，QR 留作后续
4. 框架：**Taro（React+TS+Vite）**——标准 React 通吃小程序+H5+App，比 uni-app 厂商抽象更主流不易过时；业务逻辑写框架无关 TS 防过时
5. iOS：无账号不能直接装 IPA，须 Apple 签名；iPhone 走 PWA 绕开此墙
6. **代码托管 GitHub + CI 自动打包 + App 自动更新（用户确认）**：见第九节

## 七、阶段里程碑
- P1 脚手架（Taro）+ **Git 初始化 + CHANGELOG.md** + 框架无关数据模型 + 位置树 CRUD（先跑 H5/PWA 预览）
- P2 衣物录入 + 照片（≈1 周）
- P3 检索 + 浏览网格（≈1 周）
- P4 打磨 + Android 真机打包 + 接 Capgo OTA（需 Android SDK / Capgo 账号）

> 注：本环境可开发并预览 H5/PWA；**Android APK 与微信小程序的实际打包**需在本机安装 Android Studio / 微信开发者工具后执行（或走 GitHub Actions CI 自动出包）。

## 八、工程规范
- **Git**：根目录 `git init`，功能分支开发，提交信息清晰（feat/fix/docs…）
- **Changelog**：维护 `CHANGELOG.md`（Keep a Changelog 格式）
- 目录：Taro 约定（src/pages / src/components / src/domain / src/store / config）

## 九、GitHub CI / 自动更新（新增）
- 托管：GitHub 仓库；本地 `git remote add origin` 后 push 即触发
- `.github/workflows/ci.yml`：push 到 main → lint + `taro build --type h5` 冒烟
- `.github/workflows/release.yml`：打 tag（如 v0.1.0）→ `taro build --type android`（Capacitor）→ 上传 APK 到 GitHub Release
- 自动更新：Android 端接 **Capacitor + Capgo**（或自建 OTA）；以 `package.json` 的 `version` 为基线，CI 构建产物推送后 App 启动自动拉取热更新
- 小程序更新由微信平台管，不由 GitHub 控制
- 限制：GitHub Actions 免费额度对个人够用；APK 构建需在 CI 配 Android SDK（runner 脚本装，可行）
