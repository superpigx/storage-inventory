import { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor 配置：把 Taro H5 构建产物（dist/）打包为 Android 原生壳。
 * 真机打包步骤（需在本机执行，见 README）：
 *   npm i && npx cap add android && npx cap sync
 */
const config: CapacitorConfig = {
  appId: 'com.example.storageinventory',
  appName: '收纳库存',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
