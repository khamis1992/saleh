// Generic localStorage-based data service for all modules
// Works standalone - no backend required
import { logAudit } from '@/utils/exportUtils';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export interface StoreConfig<T> {
  key: string;
  seed: T[];
}

export function createStore<T extends { id: string }>(config: StoreConfig<T>) {
  const { key, seed } = config;

  // Derive module name from localStorage key (e.g. 'erp_leases' → 'leases')
  const moduleName = key.startsWith('erp_') ? key.slice(4) : key;

  function getAll(): T[] {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {}
    localStorage.setItem(key, JSON.stringify(seed));
    return [...seed];
  }

  function saveAll(items: T[]) {
    localStorage.setItem(key, JSON.stringify(items));
  }

  function getById(id: string): T | undefined {
    return getAll().find((item) => item.id === id);
  }

  function create(item: Omit<T, 'id'>): T {
    const items = getAll();
    const newItem = { ...item, id: generateId() } as T;
    items.push(newItem);
    saveAll(items);
    logAudit('create', moduleName, newItem.id);
    return newItem;
  }

  function update(id: string, updates: Partial<T>): T | undefined {
    const items = getAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    const oldItem = items[index];
    items[index] = { ...items[index], ...updates };
    saveAll(items);
    logAudit('update', moduleName, id);
    return items[index];
  }

  function remove(id: string): boolean {
    const items = getAll();
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;
    saveAll(filtered);
    logAudit('delete', moduleName, id);
    return true;
  }

  function reset(): void {
    localStorage.setItem(key, JSON.stringify(seed));
  }

  return { getAll, getById, create, update, remove, reset };
}

export { generateId };
