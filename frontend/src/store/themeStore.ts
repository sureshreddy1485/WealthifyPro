import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppTheme = {
  id: string;
  name: string;
  emoji: string;
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    surface: string;
    onSurface: string;
    onPrimary: string;
    secondary: string;
    onSecondary: string;
    surfaceVariant: string;
  };
};

export const predefinedThemes: AppTheme[] = [
  // Dark Themes
  { id: 'dark', name: 'Dark', emoji: '🌑', dark: true, colors: { primary: '#3B82F6', background: '#121212', surface: '#1E1E1E', onSurface: '#FFFFFF', onPrimary: '#FFFFFF', secondary: '#10B981', onSecondary: '#FFFFFF', surfaceVariant: '#2A2A2A' } },
  { id: 'emerald_night', name: 'Emerald Night', emoji: '🌿', dark: true, colors: { primary: '#10B981', background: '#022C22', surface: '#064E3B', onSurface: '#ECFDF5', onPrimary: '#FFFFFF', secondary: '#3B82F6', onSecondary: '#FFFFFF', surfaceVariant: '#047857' } },
  { id: 'rust_orange', name: 'Rust Orange', emoji: '🧡', dark: true, colors: { primary: '#F97316', background: '#2B1408', surface: '#431407', onSurface: '#FFF7ED', onPrimary: '#FFFFFF', secondary: '#F59E0B', onSecondary: '#FFFFFF', surfaceVariant: '#7C2D12' } },
  { id: 'charcoal_violet', name: 'Charcoal Violet', emoji: '🟣', dark: true, colors: { primary: '#8B5CF6', background: '#0B0F19', surface: '#111827', onSurface: '#F8FAFC', onPrimary: '#FFFFFF', secondary: '#10B981', onSecondary: '#FFFFFF', surfaceVariant: '#1F2937' } },
  { id: 'deep_plum', name: 'Deep Plum', emoji: '🟣', dark: true, colors: { primary: '#D946EF', background: '#380436', surface: '#4A044E', onSurface: '#FDF4FF', onPrimary: '#FFFFFF', secondary: '#F43F5E', onSecondary: '#FFFFFF', surfaceVariant: '#701A75' } },
  { id: 'midnight_blue', name: 'Midnight Blue', emoji: '🌌', dark: true, colors: { primary: '#3B82F6', background: '#0A1128', surface: '#172554', onSurface: '#EFF6FF', onPrimary: '#FFFFFF', secondary: '#06B6D4', onSecondary: '#FFFFFF', surfaceVariant: '#1E3A8A' } },
  { id: 'wine_red', name: 'Wine Red', emoji: '🍷', dark: true, colors: { primary: '#EF4444', background: '#240404', surface: '#3E0808', onSurface: '#FEF2F2', onPrimary: '#FFFFFF', secondary: '#F59E0B', onSecondary: '#FFFFFF', surfaceVariant: '#5D0E0E' } },
  { id: 'onyx_shadow', name: 'Onyx Shadow', emoji: '⚫', dark: true, colors: { primary: '#71717A', background: '#09090B', surface: '#18181B', onSurface: '#FAFAFA', onPrimary: '#FFFFFF', secondary: '#A1A1AA', onSecondary: '#000000', surfaceVariant: '#27272A' } },
  { id: 'deep_sea', name: 'Deep Sea', emoji: '🌊', dark: true, colors: { primary: '#06B6D4', background: '#082F49', surface: '#0C4A6E', onSurface: '#ECFEFF', onPrimary: '#000000', secondary: '#3B82F6', onSecondary: '#FFFFFF', surfaceVariant: '#075985' } },
  { id: 'amber_gold', name: 'Amber Gold', emoji: '🟡', dark: true, colors: { primary: '#F59E0B', background: '#291400', surface: '#451A03', onSurface: '#FFFBEB', onPrimary: '#000000', secondary: '#EA580C', onSecondary: '#FFFFFF', surfaceVariant: '#78350F' } },
  { id: 'storm_grey', name: 'Storm Grey', emoji: '🌪️', dark: true, colors: { primary: '#94A3B8', background: '#020617', surface: '#0F172A', onSurface: '#F8FAFC', onPrimary: '#000000', secondary: '#64748B', onSecondary: '#FFFFFF', surfaceVariant: '#1E293B' } },
  { id: 'forest_pine', name: 'Forest Pine', emoji: '🌲', dark: true, colors: { primary: '#10B981', background: '#022C22', surface: '#064E3B', onSurface: '#ECFDF5', onPrimary: '#000000', secondary: '#34D399', onSecondary: '#000000', surfaceVariant: '#047857' } },
  { id: 'mocha_brown', name: 'Mocha Brown', emoji: '☕', dark: true, colors: { primary: '#B45309', background: '#271710', surface: '#3B2015', onSurface: '#FFF7ED', onPrimary: '#FFFFFF', secondary: '#EA580C', onSecondary: '#FFFFFF', surfaceVariant: '#5B3322' } },
  { id: 'copper_dust', name: 'Copper Dust', emoji: '🧱', dark: true, colors: { primary: '#EA580C', background: '#2B1408', surface: '#431407', onSurface: '#FFF7ED', onPrimary: '#FFFFFF', secondary: '#F97316', onSecondary: '#000000', surfaceVariant: '#7C2D12' } },
  { id: 'twilight_purple', name: 'Twilight Purple', emoji: '🌗', dark: true, colors: { primary: '#A855F7', background: '#190835', surface: '#2E1065', onSurface: '#FAF5FF', onPrimary: '#FFFFFF', secondary: '#C084FC', onSecondary: '#000000', surfaceVariant: '#3B0764' } },

  // Light Themes
  { id: 'light', name: 'Light', emoji: '☀️', dark: false, colors: { primary: '#3B82F6', background: '#F8FAFC', surface: '#FFFFFF', onSurface: '#0F172A', onPrimary: '#FFFFFF', secondary: '#10B981', onSecondary: '#FFFFFF', surfaceVariant: '#E2E8F0' } },
  { id: 'mint_cream', name: 'Mint Cream', emoji: '🍃', dark: false, colors: { primary: '#059669', background: '#ECFDF5', surface: '#FFFFFF', onSurface: '#022C22', onPrimary: '#FFFFFF', secondary: '#2563EB', onSecondary: '#FFFFFF', surfaceVariant: '#D1FAE5' } },
  { id: 'warm_beige', name: 'Warm Beige', emoji: '☕', dark: false, colors: { primary: '#B45309', background: '#FFFBEB', surface: '#FFFFFF', onSurface: '#451A03', onPrimary: '#FFFFFF', secondary: '#C2410C', onSecondary: '#FFFFFF', surfaceVariant: '#FEF3C7' } },
  { id: 'soft_teal', name: 'Soft Teal', emoji: '💧', dark: false, colors: { primary: '#0891B2', background: '#ECFEFF', surface: '#FFFFFF', onSurface: '#164E63', onPrimary: '#FFFFFF', secondary: '#2563EB', onSecondary: '#FFFFFF', surfaceVariant: '#CFFAFE' } },
  { id: 'lavender_mist', name: 'Lavender Mist', emoji: '🌸', dark: false, colors: { primary: '#9333EA', background: '#FAF5FF', surface: '#FFFFFF', onSurface: '#3B0764', onPrimary: '#FFFFFF', secondary: '#C084FC', onSecondary: '#FFFFFF', surfaceVariant: '#F3E8FF' } },
  { id: 'sky_breeze', name: 'Sky Breeze', emoji: '🌤️', dark: false, colors: { primary: '#2563EB', background: '#EFF6FF', surface: '#FFFFFF', onSurface: '#1E3A8A', onPrimary: '#FFFFFF', secondary: '#0891B2', onSecondary: '#FFFFFF', surfaceVariant: '#DBEAFE' } },
  { id: 'blush_rose', name: 'Blush Rose', emoji: '🌷', dark: false, colors: { primary: '#E11D48', background: '#FFF1F2', surface: '#FFFFFF', onSurface: '#881337', onPrimary: '#FFFFFF', secondary: '#F43F5E', onSecondary: '#FFFFFF', surfaceVariant: '#FFE4E6' } },
  { id: 'ivory_glow', name: 'Ivory Glow', emoji: '🤍', dark: false, colors: { primary: '#CA8A04', background: '#FEFCE8', surface: '#FFFFFF', onSurface: '#713F12', onPrimary: '#FFFFFF', secondary: '#D97706', onSecondary: '#FFFFFF', surfaceVariant: '#FEF08A' } },
  { id: 'ocean_pearl', name: 'Ocean Pearl', emoji: '🐚', dark: false, colors: { primary: '#0369A1', background: '#F0F9FF', surface: '#FFFFFF', onSurface: '#0C4A6E', onPrimary: '#FFFFFF', secondary: '#0284C7', onSecondary: '#FFFFFF', surfaceVariant: '#E0F2FE' } },
  { id: 'lemon_frost', name: 'Lemon Frost', emoji: '🍋', dark: false, colors: { primary: '#D97706', background: '#FEFCE8', surface: '#FFFFFF', onSurface: '#713F12', onPrimary: '#FFFFFF', secondary: '#EAB308', onSecondary: '#FFFFFF', surfaceVariant: '#FEF9C3' } },
  { id: 'cloud_drift', name: 'Cloud Drift', emoji: '☁️', dark: false, colors: { primary: '#475569', background: '#F8FAFC', surface: '#FFFFFF', onSurface: '#0F172A', onPrimary: '#FFFFFF', secondary: '#64748B', onSecondary: '#FFFFFF', surfaceVariant: '#E2E8F0' } },
  { id: 'frost_mint', name: 'Frost Mint', emoji: '❄️', dark: false, colors: { primary: '#0D9488', background: '#F0FDFA', surface: '#FFFFFF', onSurface: '#134E4A', onPrimary: '#FFFFFF', secondary: '#14B8A6', onSecondary: '#FFFFFF', surfaceVariant: '#CCFBF1' } },
  { id: 'peach_glow', name: 'Peach Glow', emoji: '🍑', dark: false, colors: { primary: '#EA580C', background: '#FFF7ED', surface: '#FFFFFF', onSurface: '#7C2D12', onPrimary: '#FFFFFF', secondary: '#F97316', onSecondary: '#FFFFFF', surfaceVariant: '#FFEDD5' } },
  { id: 'sand_dune', name: 'Sand Dune', emoji: '🏜️', dark: false, colors: { primary: '#78716C', background: '#FAFAF9', surface: '#FFFFFF', onSurface: '#1C1917', onPrimary: '#FFFFFF', secondary: '#A8A29E', onSecondary: '#FFFFFF', surfaceVariant: '#E7E5E4' } },
  { id: 'snow_lilac', name: 'Snow Lilac', emoji: '❄️🌸', dark: false, colors: { primary: '#A855F7', background: '#FAF5FF', surface: '#FFFFFF', onSurface: '#4A044E', onPrimary: '#FFFFFF', secondary: '#C084FC', onSecondary: '#FFFFFF', surfaceVariant: '#F3E8FF' } },
];

interface ThemeState {
  currentThemeId: string;
  previewThemeId: string | null;
  setTheme: (id: string) => void;
  setPreviewTheme: (id: string | null) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentThemeId: 'charcoal_violet',
      previewThemeId: null,
      setTheme: (id) => set({ currentThemeId: id }),
      setPreviewTheme: (id) => set({ previewThemeId: id }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ currentThemeId: state.currentThemeId }), // don't persist preview
    }
  )
);
