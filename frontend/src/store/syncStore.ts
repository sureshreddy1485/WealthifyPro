import { create } from 'zustand';

interface SyncState {
  lastSyncTime: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  setSyncStatus: (status: 'idle' | 'syncing' | 'success' | 'error', time?: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  lastSyncTime: null,
  syncStatus: 'idle',
  setSyncStatus: (status, time) => set((state) => ({ 
    syncStatus: status, 
    lastSyncTime: time !== undefined ? time : state.lastSyncTime 
  })),
}));
