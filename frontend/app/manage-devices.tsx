import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Appbar, useTheme, Button, Portal, Dialog, TextInput, Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { api, useAuthStore } from '@/store/authStore';
import CustomAlert from '@/components/CustomAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ManageDevicesScreen() {
  const theme = useTheme();
  const currentDeviceId = useAuthStore(state => state.deviceId);
  const [devices, setDevices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  // Revoke Dialog State
  const [revokeDialogVisible, setRevokeDialogVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isRevokeAll, setIsRevokeAll] = useState(false);
  
  const [secKey, setSecKey] = useState('');
  const [revoking, setRevoking] = useState(false);

  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });
  const showAlert = (title: string, message: string) => setAlertConfig({ visible: true, title, message });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/users/devices');
      const rawDevices: string[] = res.data.devices;
      rawDevices.sort((a, b) => {
        const idA = a.includes('::') ? a.split('::')[0] : a;
        const idB = b.includes('::') ? b.split('::')[0] : b;
        if (idA === currentDeviceId) return -1;
        if (idB === currentDeviceId) return 1;
        return 0;
      });
      setDevices(rawDevices);
    } catch (e) {
      showAlert('Error', 'Failed to fetch connected devices');
    } finally {
      setLoading(false);
    }
  };

  const openRevokeDialog = (deviceId: string) => {
    setIsRevokeAll(false);
    setSelectedDevice(deviceId);
    setSecKey('');
    setRevokeDialogVisible(true);
  };

  const openRevokeAllDialog = () => {
    setIsRevokeAll(true);
    setSecKey('');
    setRevokeDialogVisible(true);
  };

  const handleRevoke = async () => {
    if (!secKey.trim()) {
      showAlert('Error', 'Security key is required');
      return;
    }
    setRevoking(true);
    try {
      if (isRevokeAll) {
        await api.post('/users/devices/revoke-all', { currentDeviceId, secKey });
        showAlert('Success', 'All other devices logged out securely');
      } else {
        await api.post('/users/devices/revoke', { deviceId: selectedDevice, secKey });
        showAlert('Success', 'Device revoked successfully');
      }
      setRevokeDialogVisible(false);
      fetchDevices();
    } catch (e: any) {
      if (e.response?.status === 401) {
        showAlert('Error', 'Invalid security key');
      } else {
        showAlert('Error', 'Failed to revoke device(s)');
      }
    } finally {
      setRevoking(false);
    }
  };

  const otherDevicesCount = devices.filter(d => {
    const id = d.includes('::') ? d.split('::')[0] : d;
    return id !== currentDeviceId;
  }).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          header: () => (
            <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 0 }}>
              <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onSurface} />
              <Appbar.Content title="Manage Devices" titleStyle={{ color: theme.colors.primary, fontWeight: 'bold' }} />
            </Appbar.Header>
          )
        }} 
      />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 16 + insets.bottom }]}>
        <View style={styles.headerBox}>
          <MaterialCommunityIcons name="shield-lock-outline" size={32} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
            You can have up to 3 active sessions. If you log in on a 4th device, the oldest active session will be automatically disconnected.
          </Text>
        </View>

        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 24, color: theme.colors.primary }}>Syncing active sessions...</Text>
        ) : (
          <View>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12, color: theme.colors.onSurface }}>
              Active Sessions ({devices.length}/3)
            </Text>
            
            {devices.map((deviceString, index) => {
              const hasName = deviceString.includes('::');
              const deviceId = hasName ? deviceString.split('::')[0] : deviceString;
              const rawDeviceName = hasName ? deviceString.split('::')[1] : null;
              
              const isCurrent = deviceId === currentDeviceId;
              const displayTitle = isCurrent ? "This Device" : (rawDeviceName || `Unknown Device ${index + 1}`);

              return (
                <Surface
                  key={deviceId}
                  style={[styles.deviceCard, { backgroundColor: isCurrent ? theme.colors.primaryContainer : theme.colors.surface }]}
                  elevation={isCurrent ? 2 : 1}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                      <MaterialCommunityIcons 
                        name={isCurrent ? "cellphone-check" : "cellphone"} 
                        size={28} 
                        color={isCurrent ? theme.colors.primary : theme.colors.onSurfaceVariant} 
                      />
                    </View>
                    <View style={styles.deviceInfo}>
                      <Text variant="titleMedium" style={{ fontWeight: 'bold', color: isCurrent ? theme.colors.onPrimaryContainer : theme.colors.onSurface }}>
                        {displayTitle}
                      </Text>
                      <Text variant="bodySmall" style={{ color: isCurrent ? theme.colors.primary : theme.colors.onSurfaceVariant, marginTop: 2 }}>
                        {isCurrent ? "Currently Active" : "Logged in via App"}
                      </Text>
                    </View>
                    {!isCurrent && (
                      <Button 
                        mode="text" 
                        textColor={theme.colors.error} 
                        onPress={() => openRevokeDialog(deviceId)}
                        compact
                      >
                        Logout
                      </Button>
                    )}
                  </View>
                </Surface>
              );
            })}

            {otherDevicesCount > 0 && (
              <View style={styles.footerAction}>
                <Button 
                  mode="outlined" 
                  textColor={theme.colors.error} 
                  style={{ borderColor: theme.colors.error, borderRadius: 12 }}
                  icon="logout"
                  onPress={openRevokeAllDialog}
                >
                  Logout All Other Devices
                </Button>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={revokeDialogVisible} onDismiss={() => setRevokeDialogVisible(false)} style={{ backgroundColor: theme.colors.surface, borderRadius: 16 }}>
          <Dialog.Title style={{ color: theme.colors.error, fontWeight: 'bold' }}>
            {isRevokeAll ? "Logout All Devices" : "Revoke Session"}
          </Dialog.Title>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Dialog.Content>
                <Text variant="bodyMedium" style={{ marginBottom: 16, color: theme.colors.onSurface }}>
                  {isRevokeAll 
                    ? "This will securely disconnect all other devices from your account. Enter your security key to confirm."
                    : "To securely log out this device, please enter your security key."}
                </Text>
                <TextInput
                  label="Security Key"
                  mode="outlined"
                  value={secKey}
                  onChangeText={setSecKey}
                  secureTextEntry
                  autoFocus
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setRevokeDialogVisible(false)} disabled={revoking}>Cancel</Button>
                <Button mode="contained" buttonColor={theme.colors.error} onPress={handleRevoke} loading={revoking} disabled={revoking} style={{ borderRadius: 8 }}>
                  Confirm
                </Button>
              </Dialog.Actions>
            </ScrollView>
          </KeyboardAvoidingView>
        </Dialog>
      </Portal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onDismiss={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  deviceCard: {
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  footerAction: {
    marginTop: 24,
    marginBottom: 40,
  }
});
