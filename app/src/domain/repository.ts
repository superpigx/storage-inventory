import type { Bag, Item, KVStore, LocationNode, LocationType } from './types';
import { locationPath } from './search';

const KEYS = {
  locations: 'si:locations',
  bags: 'si:bags',
  items: 'si:items'
};

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function defaultName(type: LocationType): string {
  return type === 'home' ? '我的家' : type === 'room' ? '房间' : '柜子';
}

// 纯逻辑仓储层：依赖 KVStore 接口，不耦合任何框架
export class Repository {
  constructor(private store: KVStore) {}

  private read<T>(key: string): T[] {
    const raw = this.store.get(key);
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  private write<T>(key: string, value: T[]): void {
    this.store.set(key, JSON.stringify(value));
  }

  // ---------- Locations ----------
  getLocations(): LocationNode[] {
    return this.read<LocationNode>(KEYS.locations);
  }

  addLocation(type: LocationType, name: string, parentId: string | null): LocationNode {
    const node: LocationNode = {
      id: uid(),
      type,
      name: name.trim() || defaultName(type),
      parentId,
      createdAt: Date.now()
    };
    const list = this.getLocations();
    list.push(node);
    this.write(KEYS.locations, list);
    return node;
  }

  updateLocation(id: string, name: string): void {
    const list = this.getLocations().map(n =>
      n.id === id ? { ...n, name: name.trim() || n.name } : n
    );
    this.write(KEYS.locations, list);
  }

  deleteLocation(id: string): void {
    const all = this.getLocations();
    const toDelete = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of all) {
        if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
          toDelete.add(n.id);
          changed = true;
        }
      }
    }
    this.write(KEYS.locations, all.filter(n => !toDelete.has(n.id)));
    // 级联删除关联的压缩袋
    const bags = this.getBags().filter(b => !toDelete.has(b.cabinetId));
    this.write(KEYS.bags, bags);
  }

  childrenOf(parentId: string | null): LocationNode[] {
    return this.getLocations().filter(n => n.parentId === parentId);
  }

  // ---------- Bags ----------
  getBags(): Bag[] {
    return this.read<Bag>(KEYS.bags);
  }

  addBag(name: string, cabinetId: string): Bag {
    const bag: Bag = {
      id: uid(),
      name: name.trim() || '未命名压缩袋',
      cabinetId,
      createdAt: Date.now()
    };
    const list = this.getBags();
    list.push(bag);
    this.write(KEYS.bags, list);
    return bag;
  }

  updateBag(id: string, name: string): void {
    const list = this.getBags().map(b =>
      b.id === id ? { ...b, name: name.trim() || b.name } : b
    );
    this.write(KEYS.bags, list);
  }

  deleteBag(id: string): void {
    this.write(KEYS.bags, this.getBags().filter(b => b.id !== id));
  }

  bagsOf(cabinetId: string): Bag[] {
    return this.getBags().filter(b => b.cabinetId === cabinetId);
  }

  // ---------- Items ----------
  getItems(): Item[] {
    return this.read<Item>(KEYS.items);
  }

  addItem(input: Omit<Item, 'id' | 'createdAt'>): Item {
    const item: Item = { ...input, id: uid(), createdAt: Date.now() };
    const list = this.getItems();
    list.push(item);
    this.write(KEYS.items, list);
    return item;
  }

  updateItem(id: string, patch: Partial<Omit<Item, 'id' | 'createdAt'>>): void {
    const list = this.getItems().map(i => (i.id === id ? { ...i, ...patch } : i));
    this.write(KEYS.items, list);
  }

  deleteItem(id: string): void {
    this.write(KEYS.items, this.getItems().filter(i => i.id !== id));
  }

  locationPathOfBag(bagId: string): string[] {
    return locationPath(bagId, this.getBags(), this.getLocations());
  }

  // 所有压缩袋 -> 位置路径 的映射，供检索时的分组与路径匹配一次性计算
  locationPathMap(): Record<string, string[]> {
    const bags = this.getBags();
    const nodes = this.getLocations();
    const map: Record<string, string[]> = {};
    for (const b of bags) map[b.id] = locationPath(b.id, bags, nodes);
    return map;
  }

  // 同步合并：整批写回（已由 domain/sync.mergeRemote 合并好）
  importData(locations: LocationNode[], bags: Bag[], items: Item[]): void {
    this.write(KEYS.locations, locations);
    this.write(KEYS.bags, bags);
    this.write(KEYS.items, items);
  }
}
