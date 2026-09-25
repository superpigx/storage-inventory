import Taro from '@tarojs/taro';
import type { KVStore } from '../domain/types';

// Taro 平台的 KV 实现（离线优先，写入设备本地存储）
export class TaroKV implements KVStore {
  get(key: string): string | null {
    try {
      const v = Taro.getStorageSync(key);
      return v == null ? null : String(v);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      Taro.setStorageSync(key, value);
    } catch {
      // 忽略配额超限 / 隐私模式等异常
    }
  }
}
