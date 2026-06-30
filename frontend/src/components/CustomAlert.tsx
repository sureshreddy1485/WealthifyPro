import React from 'react';
import { Portal, Dialog, Button, Text, useTheme } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  onConfirm?: () => void;
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
  requireAuth?: boolean;
}

export default function CustomAlert({ 
  visible, 
  title, 
  message, 
  onDismiss, 
  onConfirm, 
  showCancel = false,
  confirmText = "OK",
  cancelText = "Cancel",
  requireAuth = false
}: CustomAlertProps) {
  const theme = useTheme();
  
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: theme.colors.surface, borderRadius: 24, paddingBottom: 8 }}>
        <Dialog.Title style={{ color: theme.colors.onSurface, fontWeight: 'bold', fontSize: 22 }}>
          {title}
        </Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 24 }}>
            {message}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          {showCancel && (
            <Button 
              onPress={onDismiss} 
              textColor={theme.colors.onSurfaceVariant}
              style={{ marginRight: 8 }}
            >
              {cancelText}
            </Button>
          )}
          <Button 
            mode="contained" 
            onPress={async () => {
              if (requireAuth) {
                const result = await LocalAuthentication.authenticateAsync({
                  promptMessage: 'Security PIN / Biometrics required to confirm',
                  fallbackLabel: 'Use PIN',
                });
                if (!result.success) return;
              }
              if (onConfirm) onConfirm();
              else onDismiss();
            }} 
            style={{ borderRadius: 12, paddingHorizontal: 16 }}
            textColor={theme.colors.onPrimary}
          >
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
