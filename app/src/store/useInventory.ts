import { useCallback, useEffect, useState } from 'react';
import { repo } from '../infra';
import type { Bag, Item, LocationNode, LocationType } from '../domain/types';
import { matchItem, type ItemFilter } from '../domain/search';

// 轻量状态层：直接从仓储读写并触发刷新（P2 可换 zustand）
export function useInventory() {
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [bags, setBags] = useState<Bag[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const refresh = useCallback(() => {
    setLocations(repo.getLocations());
    setBags(repo.getBags());
    setItems(repo.getItems());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const searchItems = useCallback(
    (f: ItemFilter): Item[] => repo.getItems().filter(i => matchItem(i, f)),
    []
  );

  return {
    locations,
    bags,
    items,
    refresh,
    searchItems,
    // ---- 位置树 ----
    addLocation: (type: LocationType, name: string, parentId: string | null) => {
      const n = repo.addLocation(type, name, parentId);
      refresh();
      return n;
    },
    updateLocation: (id: string, name: string) => {
      repo.updateLocation(id, name);
      refresh();
    },
    deleteLocation: (id: string) => {
      repo.deleteLocation(id);
      refresh();
    },
    // ---- 压缩袋 ----
    addBag: (name: string, cabinetId: string) => {
      const b = repo.addBag(name, cabinetId);
      refresh();
      return b;
    },
    updateBag: (id: string, name: string) => {
      repo.updateBag(id, name);
      refresh();
    },
    deleteBag: (id: string) => {
      repo.deleteBag(id);
      refresh();
    },
    // ---- 衣物 ----
    getItem: (id: string) => repo.getItems().find(i => i.id === id),
    addItem: (input: Omit<Item, 'id' | 'createdAt'>) => {
      const it = repo.addItem(input);
      refresh();
      return it;
    },
    updateItem: (id: string, patch: Partial<Omit<Item, 'id' | 'createdAt'>>) => {
      repo.updateItem(id, patch);
      refresh();
    },
    deleteItem: (id: string) => {
      repo.deleteItem(id);
      refresh();
    },
    locationPathOfBag: (bagId: string) => repo.locationPathOfBag(bagId)
  };
}
