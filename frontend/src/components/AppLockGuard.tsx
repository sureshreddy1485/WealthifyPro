import React, { useState, useEffect } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AppLockGuard({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const [isLocked, setIsLocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkLock = async () => {
    try {
      const enabled = await AsyncStorage.getItem('app_lock_enabled');
      if (enabled === 'true') {
        setIsLocked(true);
        promptAuth();
      } else {
        setIsLocked(false);
      }
    } catch (e) {
      setIsLocked(false);
    } finally {
      setIsChecking(false);
    }
  };

  const promptAuth = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (!hasHardware || !isEnrolled) {
      // If hardware isn't available or no PIN is set, bypass lock for safety
      setIsLocked(false);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock WealthifyPro',
      fallbackLabel: 'Use PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      setIsLocked(false);
    }
  };

  useEffect(() => {
    checkLock();

    let lastBackgroundTime: number | null = null;

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (!lastBackgroundTime) {
          lastBackgroundTime = Date.now();
        }
      } else if (nextAppState === 'active') {
        if (lastBackgroundTime) {
          const timeAway = Date.now() - lastBackgroundTime;
          if (timeAway > 45 * 1000) { // 45 seconds
            checkLock();
          }
          lastBackgroundTime = null;
        } else {
          checkLock();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (isChecking) return null;

  return (
    <View style={{ flex: 1 }}>
      {children}
      {isLocked && (
        <View style={[styles.overlay, { backgroundColor: theme.colors.background }]}>
          <MaterialCommunityIcons name="lock" size={64} color={theme.colors.primary} />
          <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, marginTop: 16, fontWeight: 'bold' }}>
            App Locked
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, marginBottom: 32 }}>
            Please authenticate to continue
          </Text>
          <Button mode="contained" onPress={promptAuth} style={{ borderRadius: 8 }}>
            Unlock
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill as any,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  }
});
