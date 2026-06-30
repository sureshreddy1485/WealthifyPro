import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LedgerItem {
  id: string;
  folderId: string | null;
  customerName?: string;
  principal: number;
  rate: number;
  duration: number;
  interest: number;
  total: number;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

interface LedgerState {
  folders: Folder[];
  ledgers: LedgerItem[];
  addFolder: (name: string) => void;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, newName: string) => void;
  addLedger: (ledger: Omit<LedgerItem, 'id' | 'createdAt'>) => void;
  deleteLedger: (id: string) => void;
  editLedger: (id: string, updates: Partial<LedgerItem>) => void;
}

export const useLedgerStore = create<LedgerState>()(
  persist(
    (set) => ({
      folders: [],
      ledgers: [],
      addFolder: (name) => set((state) => ({
        folders: [...state.folders, { id: Math.random().toString(), name, createdAt: Date.now() }]
      })),
      deleteFolder: (id) => set((state) => ({
        folders: state.folders.filter(f => f.id !== id),
        ledgers: state.ledgers.filter(l => l.folderId !== id) // Cascade delete
      })),
      renameFolder: (id, newName) => set((state) => ({
        folders: state.folders.map(f => f.id === id ? { ...f, name: newName } : f)
      })),
      addLedger: (ledger) => set((state) => ({
        ledgers: [...state.ledgers, { ...ledger, id: Math.random().toString(), createdAt: Date.now() }]
      })),
      deleteLedger: (id) => set((state) => ({
        ledgers: state.ledgers.filter(l => l.id !== id)
      })),
      editLedger: (id, updates) => set((state) => ({
        ledgers: state.ledgers.map(l => l.id === id ? { ...l, ...updates } : l)
      })),
    }),
    {
      name: 'ledger-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
