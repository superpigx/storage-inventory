// 框架无关领域模型 —— 不依赖任何 UI 框架，未来可整体迁移

export type LocationType = 'home' | 'room' | 'cabinet';

export interface LocationNode {
  id: string;
  type: LocationType;
  name: string;
  parentId: string | null; // home 的 parentId 为 null
  createdAt: number;
}

export interface Bag {
  id: string;
  name: string;
  cabinetId: string; // 挂在柜子下
  photoPath?: string;
  createdAt: number;
}

export interface Item {
  id: string;
  name: string;
  category: string; // 上衣/裤/外套…
  season?: string; // 春/夏/秋/冬
  color?: string;
  tags: string[];
  bagId: string;
  photoPath?: string;
  createdAt: number;
}

// 持久化抽象：业务层只依赖此接口，具体实现可替换（Taro / localStorage / IndexedDB）
export interface KVStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
}
