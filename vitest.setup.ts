import '@testing-library/jest-dom';

// Vitest 4 runs service-layer tests in a node-pool worker that provides a
// bare localStorage shim (via --localstorage-file) without the full Web
// Storage API. Replace it with a complete in-memory implementation so that
// tests can call getItem / setItem / removeItem / clear freely.
if (typeof localStorage === 'undefined' || typeof localStorage.removeItem !== 'function') {
  const store: Record<string, string> = {};
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => { store[key] = String(value); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { for (const k of Object.keys(store)) delete store[k]; },
      get length() { return Object.keys(store).length; },
      key: (i: number) => Object.keys(store)[i] ?? null,
    },
    writable: true,
    configurable: true,
  });
}
