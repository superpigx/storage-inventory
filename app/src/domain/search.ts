import type { Bag, Item, LocationNode } from './types';

// 由压缩袋 ID 回溯完整位置路径：家 › 房间 › 柜子 › 压缩袋
export function locationPath(
  bagId: string | undefined,
  bags: Bag[],
  nodes: LocationNode[]
): string[] {
  if (!bagId) return [];
  const bag = bags.find(b => b.id === bagId);
  if (!bag) return ['（压缩袋已删除）'];
  const path: string[] = [bag.name];
  const byId = new Map(nodes.map(n => [n.id, n]));
  let cursor: LocationNode | undefined = byId.get(bag.cabinetId);
  while (cursor) {
    path.unshift(cursor.name);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  return path;
}

export interface ItemFilter {
  text?: string;
  seasons?: string[];
  colors?: string[];
  categories?: string[];
}

// 反向检索匹配：按文本 + 季节/颜色/类别筛选。空数组 = 不限制。
export function matchItem(item: Item, f: ItemFilter): boolean {
  if (f.seasons && f.seasons.length && (!item.season || !f.seasons.includes(item.season))) return false;
  if (f.colors && f.colors.length && (!item.color || !f.colors.includes(item.color))) return false;
  if (
    f.categories &&
    f.categories.length &&
    (!item.category || !f.categories.includes(item.category))
  )
    return false;
  if (f.text && f.text.trim()) {
    const q = f.text.trim().toLowerCase();
    const hay = [item.name, item.color, item.season, item.category, ...item.tags]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}
