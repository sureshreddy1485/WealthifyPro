import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { router } from 'expo-router';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [securityKey, setSecurityKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showSecurityKey, setShowSecurityKey] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleReset = () => {
    if (!securityKey || !newPassword || !confirmPassword) {
      alert('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Mock reset success
    alert('Password reset successfully!');
    router.replace('/login');
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerContainer}>
        <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Reset Password</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
          Enter your security key and new password.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          label="Current Security Key"
          value={securityKey}
          onChangeText={setSecurityKey}
          mode="flat"
          secureTextEntry={!showSecurityKey}
          right={<TextInput.Icon icon={showSecurityKey ? "eye-off" : "eye"} onPress={() => setShowSecurityKey(!showSecurityKey)} />}
          style={styles.input}
        />

        <TextInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          mode="flat"
          secureTextEntry={!showNewPassword}
          right={<TextInput.Icon icon={showNewPassword ? "eye-off" : "eye"} onPress={() => setShowNewPassword(!showNewPassword)} />}
          style={styles.input}
        />

        <TextInput
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          mode="flat"
          secureTextEntry={!showConfirmPassword}
          right={<TextInput.Icon icon={showConfirmPassword ? "eye-off" : "eye"} onPress={() => setShowConfirmPassword(!showConfirmPassword)} />}
          style={styles.input}
        />

        <Button mode="contained" onPress={handleReset} style={styles.button} contentStyle={{ paddingVertical: 8 }}>
          Reset Password
        </Button>

        <TouchableOpacity onPress={() => router.back()} style={styles.backToLogin}>
          <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  backToLogin: {
    alignItems: 'center',
  }
});
