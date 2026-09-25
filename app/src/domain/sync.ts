// 同步合并纯函数（框架无关，可单测）
// 合并策略：按 id 去重，本地已有 → 保留本地（本地优先）；远端多出 → 加入本地
// 依赖顺序：先位置、再压缩袋（cabinetId 引用位置）、最后衣物（bagId 引用压缩袋）

import type { Bag, Item, LocationNode } from './types';

export interface SyncPayload {
  version: 1;
  exportedAt: number;
  locations: LocationNode[];
  bags: Bag[];
  items: Item[];
}

export interface SyncStats {
  added: { locations: number; bags: number; items: number };
}

function mergeById<T extends { id: string }>(local: T[], remote: T[]): { list: T[]; added: number } {
  const ids = new Set(local.map(x => x.id));
  const list = [...local];
  let added = 0;
  for (const r of remote) {
    if (!ids.has(r.id)) {
      list.push(r);
      ids.add(r.id);
      added++;
    }
  }
  return { list, added };
}

export function mergeRemote(
  local: { locations: LocationNode[]; bags: Bag[]; items: Item[] },
  remote: SyncPayload
): { locations: LocationNode[]; bags: Bag[]; items: Item[] } & SyncStats {
  const loc = mergeById(local.locations, remote.locations || []);
  const bags = mergeById(local.bags, remote.bags || []);
  const items = mergeById(local.items, remote.items || []);
  return {
    locations: loc.list,
    bags: bags.list,
    items: items.list,
    added: { locations: loc.added, bags: bags.added, items: items.added }
  };
}

export function buildPayload(
  locations: LocationNode[],
  bags: Bag[],
  items: Item[]
): SyncPayload {
  return { version: 1, exportedAt: Date.now(), locations, bags, items };
}
