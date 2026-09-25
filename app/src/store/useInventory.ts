import { useCallback, useEffect, useState } from 'react';
import { repo } from '../infra';
import type { Bag, LocationNode, LocationType } from '../domain/types';

// 轻量状态层：直接从仓储读写并触发刷新（P2 可换 zustand）
export function useInventory() {
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [bags, setBags] = useState<Bag[]>([]);

  const refresh = useCallback(() => {
    setLocations(repo.getLocations());
    setBags(repo.getBags());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    locations,
    bags,
    refresh,
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
    }
  };
}
