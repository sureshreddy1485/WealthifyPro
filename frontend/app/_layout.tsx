import { Stack } from 'expo-router';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useDueNotifications, setupNotificationChannel } from '@/hooks/useDueNotifications';
import AppLockGuard from '@/components/AppLockGuard';
import CustomAlert from '@/components/CustomAlert';
import { useAlertStore } from '@/store/alertStore';
import { useNoteStore } from '@/store/noteStore';
import { useLedgerStore } from '@/store/ledgerStore';
import { useEmiStore } from '@/store/emiStore';
import { useSyncStore } from '@/store/syncStore';
import { api } from '@/store/authStore';

function GlobalAlert() {
  const alertState = useAlertStore();
  return (
    <CustomAlert
      visible={alertState.visible}
      title={alertState.title}
      message={alertState.message}
      showCancel={alertState.showCancel}
      confirmText={alertState.confirmText}
      cancelText={alertState.cancelText}
      onConfirm={() => {
        alertState.onConfirm();
        alertState.hideAlert();
      }}
      onDismiss={alertState.hideAlert}
    />
  );
}

const queryClient = new QueryClient();

import { useThemeStore, predefinedThemes } from '@/store/themeStore';

function useAutoSync() {
  useEffect(() => {
    let timeoutId: any;
    
    const syncData = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const notesState = useNoteStore.getState();
        const ledgerState = useLedgerStore.getState();
        const emiState = useEmiStore.getState();
        
        const { setSyncStatus } = useSyncStore.getState();
        setSyncStatus('syncing');

        const data = {
          notes: { folders: notesState.folders, notes: notesState.notes },
          ledgers: { folders: ledgerState.folders, ledgers: ledgerState.ledgers },
          emis: { folders: emiState.folders, emis: emiState.emis }
        };
        
        api.post('/sync', { data })
          .then(() => setSyncStatus('success', new Date().toISOString()))
          .catch(e => {
            console.log('Auto sync failed', e);
            setSyncStatus('error');
          });
      }, 3000); // 3 seconds debounce
    };

    const unsubNote = useNoteStore.subscribe(syncData);
    const unsubLedger = useLedgerStore.subscribe(syncData);
    const unsubEmi = useEmiStore.subscribe(syncData);

    return () => {
      unsubNote();
      unsubLedger();
      unsubEmi();
      clearTimeout(timeoutId);
    }
  }, []);
}

function AppInitializer() {
  useDueNotifications();
  useAutoSync();

  useEffect(() => {
    setupNotificationChannel();
  }, []);

  return null;
}

export default function RootLayout() {
  const currentThemeId = useThemeStore(state => state.currentThemeId);
  const previewThemeId = useThemeStore(state => state.previewThemeId);
  const activeThemeId = previewThemeId || currentThemeId;
  const appTheme = predefinedThemes.find(t => t.id === activeThemeId) || predefinedThemes[0];
  
  const baseTheme = appTheme.dark ? MD3DarkTheme : MD3LightTheme;
  
  const customTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...appTheme.colors,
      error: '#EF4444',
      errorContainer: 'rgba(239, 68, 68, 0.1)',
      onError: '#FFFFFF',
      elevation: appTheme.dark ? {
        level0: 'transparent',
        level1: '#1E293B',
        level2: '#334155',
        level3: '#475569',
        level4: '#64748B',
        level5: '#94A3B8',
      } : {
        level0: 'transparent',
        level1: '#F1F5F9',
        level2: '#E2E8F0',
        level3: '#CBD5E1',
        level4: '#94A3B8',
        level5: '#64748B',
      },
    },
  };

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={customTheme}>
          <AppInitializer />
          <GlobalAlert />
          <StatusBar style={appTheme.dark ? "light" : "dark"} />
          <AppLockGuard>
          <Stack screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: customTheme.colors.background },
            animation: 'slide_from_right',
            headerStyle: { backgroundColor: customTheme.colors.surface },
            headerTitleStyle: { fontWeight: 'bold', color: customTheme.colors.primary },
            headerTintColor: customTheme.colors.onSurface,
            headerTitleAlign: 'left'
          }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen 
              name="settings" 
              options={{ 
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="interest-calculator" 
              options={{ 
                headerShown: true, 
                title: 'Interest Calculator'
              }} 
            />
            <Stack.Screen 
              name="note-calculator" 
              options={{ 
                headerShown: true, 
                title: 'Calculate Interest'
              }} 
            />
            <Stack.Screen 
              name="folder/[id]" 
              options={{ 
                headerShown: true
              }} 
            />
            <Stack.Screen 
              name="emi-calculator" 
              options={{ 
                headerShown: true, 
                title: 'EMI Calculator'
              }} 
            />
            <Stack.Screen 
              name="emi-folder/[id]" 
              options={{ 
                headerShown: true
              }} 
            />
            <Stack.Screen 
              name="note-folder/[id]" 
              options={{ 
                headerShown: true
              }} 
            />
            <Stack.Screen 
              name="create-note" 
              options={{ 
                headerShown: true, 
                title: 'Create Note'
              }} 
            />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
            <Stack.Screen 
              name="profile" 
              options={{ 
                headerShown: true, 
                title: 'Profile'
              }} 
            />
          </Stack>
          </AppLockGuard>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
