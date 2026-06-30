import { create } from 'zustand';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  showCancel: boolean;
  confirmText: string;
  cancelText?: string;
  requireAuth?: boolean;
  onConfirm: () => void;
  showAlert: (config: Partial<Omit<AlertState, 'visible' | 'showAlert' | 'hideAlert'>>) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: '',
  showCancel: false,
  confirmText: 'OK',
  onConfirm: () => {},
  showAlert: (config) => set({ 
    title: config.title || '',
    message: config.message || '',
    showCancel: config.showCancel || false,
    confirmText: config.confirmText || 'OK',
    cancelText: config.cancelText,
    requireAuth: config.requireAuth || false,
    onConfirm: config.onConfirm || (() => {}),
    visible: true 
  }),
  hideAlert: () => set({ visible: false, requireAuth: false }),
}));
