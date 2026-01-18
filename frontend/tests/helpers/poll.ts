import { expect } from '@playwright/test';

export function pollFor<T>(fn: () => Promise<T> | T, options?: { timeout?: number; intervals?: number[] }) {
  return expect.poll(fn, options);
}
