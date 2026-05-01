import { useCallback, useEffect, useState } from 'react';
import type { Hex } from 'viem';
import { getPublicClient } from '@wagmi/core';
import { wagmiConfig } from '@/config/wagmi';
import { UNICHAIN_SEPOLIA_ID } from '@/config/chain';

const STORAGE_KEY = 'swap-history-v1';

export type TxStatus = 'pending' | 'success' | 'failed';

export interface TxRecord {
  hash: Hex;
  chainId: number;
  status: TxStatus;
  createdAt: number;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  amountIn: string;
  amountOut: string;
  walletAddress: string;
}

function readStorage(): TxRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TxRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(items: TxRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota errors */
  }
}

const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

export function useTxHistory() {
  const [items, setItems] = useState<TxRecord[]>(() => readStorage());

  useEffect(() => {
    const sync = () => setItems(readStorage());
    listeners.add(sync);
    window.addEventListener('storage', sync);
    return () => {
      listeners.delete(sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const add = useCallback((record: Omit<TxRecord, 'createdAt' | 'status'>) => {
    const all = readStorage();
    const newRecord: TxRecord = {
      ...record,
      status: 'pending',
      createdAt: Date.now(),
    };
    const next = [newRecord, ...all].slice(0, 50);
    writeStorage(next);
    notify();
    return newRecord;
  }, []);

  const update = useCallback((hash: Hex, patch: Partial<TxRecord>) => {
    const all = readStorage();
    const next = all.map((r) => (r.hash === hash ? { ...r, ...patch } : r));
    writeStorage(next);
    notify();
  }, []);

  const clear = useCallback(() => {
    writeStorage([]);
    notify();
  }, []);

  // Re-check pending txs on mount and at intervals
  useEffect(() => {
    let cancelled = false;
    async function recheck() {
      const all = readStorage();
      const pending = all.filter((r) => r.status === 'pending');
      if (pending.length === 0) return;

      const publicClient = getPublicClient(wagmiConfig, {
        chainId: UNICHAIN_SEPOLIA_ID,
      });
      if (!publicClient) return;

      for (const r of pending) {
        try {
          const receipt = await publicClient.getTransactionReceipt({
            hash: r.hash,
          });
          if (cancelled) return;
          update(r.hash, {
            status: receipt.status === 'success' ? 'success' : 'failed',
          });
        } catch {
          /* still pending */
        }
      }
    }
    recheck();
    const id = window.setInterval(recheck, 8_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [update]);

  return { items, add, update, clear };
}
