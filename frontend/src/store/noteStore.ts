import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NoteFolder {
  id: string;
  name: string;
  createdAt: number;
}

export interface NoteItem {
  id: string;
  folderId: string | null;
  name: string;
  amount: number;
  startDate: number;
  durationType: 'days' | 'months' | 'years';
  duration: number;
  endDate: number;
  reminderDate: number;
  createdAt: number;
  isGiven?: boolean;
}

interface NoteState {
  folders: NoteFolder[];
  notes: NoteItem[];
  addFolder: (name: string) => string;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, newName: string) => void;
  addNote: (note: Omit<NoteItem, 'id' | 'createdAt'>) => void;
  deleteNote: (id: string) => void;
  editNote: (id: string, updates: Partial<NoteItem>) => void;
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set) => ({
      folders: [],
      notes: [],
      addFolder: (name) => {
        const id = Math.random().toString();
        set((state) => ({
          folders: [...state.folders, { id, name, createdAt: Date.now() }]
        }));
        return id;
      },
      deleteFolder: (id) => set((state) => ({
        folders: state.folders.filter(f => f.id !== id),
        notes: state.notes.filter(n => n.folderId !== id) // Cascade delete
      })),
      renameFolder: (id, newName) => set((state) => ({
        folders: state.folders.map(f => f.id === id ? { ...f, name: newName } : f)
      })),
      addNote: (note) => set((state) => ({
        notes: [...state.notes, { ...note, id: Math.random().toString(), createdAt: Date.now() }]
      })),
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter(n => n.id !== id)
      })),
      editNote: (id, updates) => set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n)
      })),
    }),
    {
      name: 'note-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
