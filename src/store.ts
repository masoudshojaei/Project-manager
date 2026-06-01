import { create } from 'zustand';
import type { ProjectData } from './types';

interface AppStore {
  data: ProjectData | null;
  filePath: string | null;
  isModified: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  
  setData: (data: ProjectData) => void;
  setFilePath: (path: string) => void;
  setIsModified: (modified: boolean) => void;
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
}

export const useAppStore = create<AppStore>((set) => ({
  data: null,
  filePath: null,
  isModified: false,
  saveStatus: 'idle',
  
  setData: (data) => set({ data }),
  setFilePath: (filePath) => set({ filePath }),
  setIsModified: (isModified) => set({ isModified }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
}));
