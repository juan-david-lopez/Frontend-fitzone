// core/helpers/storage.helper.ts
export function getLocalStorageItem(key: string): string | null {
  if (typeof window !== 'undefined' && localStorage) {
    return localStorage.getItem(key);
  }
  return null;
}

export function setLocalStorageItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && localStorage) {
    localStorage.setItem(key, value);
  }
}

export function removeLocalStorageItem(key: string): void {
  if (typeof window !== 'undefined' && localStorage) {
    localStorage.removeItem(key);
  }
}
