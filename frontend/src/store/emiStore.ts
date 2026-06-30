import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EmiItem {
  id: string;
  folderId: string | null;
  customerName?: string;
  principal: number;
  rate: number; // Annual interest rate
  durationMonths: number; // Tenure in months
  emi: number; // Monthly installment
  totalInterest: number;
  totalPayment: number;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

interface EmiState {
  folders: Folder[];
  emis: EmiItem[];
  addFolder: (name: string) => void;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, newName: string) => void;
  addEmi: (emi: Omit<EmiItem, 'id' | 'createdAt'>) => void;
  deleteEmi: (id: string) => void;
  editEmi: (id: string, updates: Partial<EmiItem>) => void;
}

export const useEmiStore = create<EmiState>()(
  persist(
    (set) => ({
      folders: [],
      emis: [],
      addFolder: (name) => set((state) => ({
        folders: [...state.folders, { id: Math.random().toString(), name, createdAt: Date.now() }]
      })),
      deleteFolder: (id) => set((state) => ({
        folders: state.folders.filter(f => f.id !== id),
        emis: state.emis.filter(e => e.folderId !== id) // Cascade delete
      })),
      renameFolder: (id, newName) => set((state) => ({
        folders: state.folders.map(f => f.id === id ? { ...f, name: newName } : f)
      })),
      addEmi: (emi) => set((state) => ({
        emis: [...state.emis, { ...emi, id: Math.random().toString(), createdAt: Date.now() }]
      })),
      deleteEmi: (id) => set((state) => ({
        emis: state.emis.filter(e => e.id !== id)
      })),
      editEmi: (id, updates) => set((state) => ({
        emis: state.emis.map(e => e.id === id ? { ...e, ...updates } : e)
      })),
    }),
    {
      name: 'emi-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
