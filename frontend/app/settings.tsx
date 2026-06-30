import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, List, Switch, useTheme, Appbar, Surface } from 'react-native-paper';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from '@/components/CustomAlert';
import { sendTestNotification } from '@/hooks/useDueNotifications';
import { useThemeStore, predefinedThemes } from '@/store/themeStore';
import { useNoteStore } from '@/store/noteStore';
import { useLedgerStore } from '@/store/ledgerStore';
import { useEmiStore } from '@/store/emiStore';
import { useSyncStore } from '@/store/syncStore';
import { api } from '@/store/authStore';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';

export default function SettingsScreen() {
  const theme = useTheme();
  const { currentThemeId } = useThemeStore();
  const currentAppTheme = predefinedThemes.find(t => t.id === currentThemeId);
  const [isAppLockEnabled, setIsAppLockEnabled] = useState(false);
  const { syncStatus, lastSyncTime, setSyncStatus } = useSyncStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    AsyncStorage.getItem('app_lock_enabled').then(val => {
      setIsAppLockEnabled(val === 'true');
    });
  }, []);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onDismiss: () => {},
    showCancel: false,
    confirmText: 'OK',
  });

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const showAlert = (config: any) => {
    setAlertConfig({ 
      visible: true, 
      showCancel: false, 
      confirmText: 'OK', 
      ...config,
      onConfirm: () => {
        if (config.onConfirm) config.onConfirm();
        hideAlert();
      },
      onDismiss: () => {
        if (config.onDismiss) config.onDismiss();
        hideAlert();
      }
    });
  };

  const toggleAppLock = async (value: boolean) => {
    setIsAppLockEnabled(value);
    await AsyncStorage.setItem('app_lock_enabled', value ? 'true' : 'false');
    if (value) {
      showAlert({ title: 'App Lock Enabled', message: 'The app will now require authentication to open.', confirmText: 'OK' });
    } else {
      showAlert({ title: 'App Lock Disabled', message: 'Authentication removed.', confirmText: 'OK' });
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
    } catch (e) {
      showAlert({ title: 'Error', message: 'Failed to send notification.' });
    }
  };

  const handleCloudSync = async () => {
    setSyncStatus('syncing');
    try {
      const notesState = useNoteStore.getState();
      const ledgerState = useLedgerStore.getState();
      const emiState = useEmiStore.getState();

      const data = {
        notes: { folders: notesState.folders, notes: notesState.notes },
        ledgers: { folders: ledgerState.folders, ledgers: ledgerState.ledgers },
        emis: { folders: emiState.folders, emis: emiState.emis }
      };

      await api.post('/sync', { data });
      setSyncStatus('success', new Date().toISOString());
      showAlert({ title: 'Sync Successful', message: 'All your data has been securely backed up to the cloud.' });
    } catch (e) {
      setSyncStatus('error');
      showAlert({ title: 'Sync Failed', message: 'Could not connect to cloud. Please try again later.' });
    }
  };

  const handleCheckUpdates = async () => {
    if (__DEV__) {
      showAlert({ title: 'Development Mode', message: 'OTA updates are not available in Expo Go or development builds. Please test this in the compiled APK.' });
      return;
    }
    try {
      showAlert({ title: 'Checking...', message: 'Checking for new updates...' });
      
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        // Download the update
        await Updates.fetchUpdateAsync();
        
        // Ask user to restart to apply
        showAlert({
          title: 'Update Downloaded!',
          message: 'Restart your app to install the latest update.',
          confirmText: 'Restart Now',
          showCancel: true,
          onConfirm: () => Updates.reloadAsync(),
        });
      } else {
        showAlert({ title: 'Up to Date', message: 'You are already on the latest version.' });
      }
    } catch (error) {
      showAlert({ title: 'Update Error', message: 'Failed to check for updates. Make sure you have an active internet connection.' });
    }
  };

  let syncDescription = 'Backup data to cloud manually';
  if (syncStatus === 'syncing') syncDescription = 'Syncing...';
  else if (syncStatus === 'success' && lastSyncTime) syncDescription = `Last synced: ${new Date(lastSyncTime).toLocaleTimeString()}`;
  else if (syncStatus === 'error') syncDescription = 'Auto sync failed! Tap to retry';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 0 }}>
        <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onSurface} />
        <Appbar.Content title="Settings" titleStyle={{ color: theme.colors.primary, fontWeight: 'bold' }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}>
        <List.Section>
          <List.Subheader>Account</List.Subheader>
          <List.Item
            title="Profile"
            description="Manage your account details and password"
            left={props => <List.Icon {...props} icon="account" />}
            onPress={() => router.push('/profile')}
          />
          <List.Item
            title="Cloud Sync"
            description={syncDescription}
            left={props => <List.Icon {...props} icon={syncStatus === 'error' ? "cloud-alert" : "cloud-sync"} color={syncStatus === 'error' ? theme.colors.error : theme.colors.primary} />}
            onPress={handleCloudSync}
            disabled={syncStatus === 'syncing'}
          />
          <List.Item
            title="Manage Devices"
            description="View and logout other connected devices"
            left={props => <List.Icon {...props} icon="devices" />}
            onPress={() => router.push('/manage-devices')}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <List.Item
            title="Themes"
            description={`Current: ${currentAppTheme?.name} ${currentAppTheme?.emoji}`}
            left={props => <List.Icon {...props} icon="palette" />}
            onPress={() => router.push('/theme-selector')}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Web Version</List.Subheader>
          <List.Item
            title="Open Web App"
            description="Access WealthifyPro on your desktop"
            left={props => <List.Icon {...props} icon="web" />}
            right={props => <List.Icon {...props} icon="open-in-new" />}
            onPress={() => Linking.openURL('https://wealthifypro.netlify.app/')}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Security</List.Subheader>
          <List.Item
            title="App Lock"
            description="Require PIN or biometrics to open app"
            left={props => <List.Icon {...props} icon="fingerprint" />}
            right={() => <Switch value={isAppLockEnabled} onValueChange={toggleAppLock} />}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Help & Tutorials</List.Subheader>
          <List.Item
            title="How to use WealthifyPro"
            description="Quick guide for Notes, Ledger & EMI"
            left={props => <List.Icon {...props} icon="help-circle" />}
            onPress={() => {
              showAlert({
                title: 'Welcome to WealthifyPro',
                message: '1. Notes: Create text records and assign values.\n2. Ledger: Calculate simple or compound interest.\n3. EMI: Generate loan amortization schedules.\nUse the folder icons to organize your data!',
                confirmText: 'Got it!'
              });
            }}
          />
          <List.Item
            title="Check for Updates"
            description="Manually check for and install OTA updates"
            left={props => <List.Icon {...props} icon="cellphone-arrow-down" />}
            onPress={handleCheckUpdates}
          />
        </List.Section>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onDismiss={alertConfig.onDismiss}
        onConfirm={alertConfig.onConfirm}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  }
});
