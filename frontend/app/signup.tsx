import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, Surface, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore, api } from '@/store/authStore';
import * as Device from 'expo-device';

export default function SignupScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showSecurityKey, setShowSecurityKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = useAuthStore(state => state.login);

  const handleSignup = async () => {
    if (!name || !emailOrPhone || !password || !confirmPassword || !securityKey) {
      alert('Please fill all fields');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      useAuthStore.getState().ensureDeviceId();
      const deviceId = useAuthStore.getState().deviceId;
      const deviceName = Device.deviceName || Device.modelName || 'Unknown Device';
      
      // 1. Create the account
      await api.post('/auth/register', {
        name,
        emailOrPhone,
        password,
        securityKey,
        deviceId,
        deviceName
      });
      
      // 2. Automatically log them in
      const loginResponse = await api.post('/auth/login', {
        emailOrPhone,
        password,
        securityKey,
        deviceId,
        deviceName
      });

      const { accessToken, user } = loginResponse.data;
      login(accessToken, user);
      
      // 3. Navigate straight to the app
      router.replace('/(tabs)');
      
    } catch (error: any) {
      alert(error.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: theme.colors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        <View style={styles.headerContainer}>
          <View style={[styles.logoPlaceholder, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text variant="displayMedium" style={{ color: theme.colors.primary, fontWeight: '900' }}>W</Text>
          </View>
          <Text variant="displaySmall" style={{ color: theme.colors.onBackground, fontWeight: '800', marginTop: 16 }}>Create Account</Text>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>Join WealthifyPro today.</Text>
        </View>

        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            mode="flat"
            style={[styles.input, { backgroundColor: 'transparent' }]}
            left={<TextInput.Icon icon="account-outline" color={theme.colors.primary} />}
            activeUnderlineColor={theme.colors.primary}
          />

          <TextInput
            label="Email or Phone"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            mode="flat"
            style={[styles.input, { backgroundColor: 'transparent' }]}
            autoCapitalize="none"
            keyboardType="email-address"
            left={<TextInput.Icon icon="email-outline" color={theme.colors.primary} />}
            activeUnderlineColor={theme.colors.primary}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="flat"
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock-outline" color={theme.colors.primary} />}
            right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
            style={[styles.input, { backgroundColor: 'transparent' }]}
            activeUnderlineColor={theme.colors.primary}
          />

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="flat"
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock-check-outline" color={theme.colors.primary} />}
            style={[styles.input, { backgroundColor: 'transparent' }]}
            activeUnderlineColor={theme.colors.primary}
          />

          <TextInput
            label="Security Key (Required for Login)"
            value={securityKey}
            onChangeText={setSecurityKey}
            mode="flat"
            secureTextEntry={!showSecurityKey}
            left={<TextInput.Icon icon="key-outline" color={theme.colors.primary} />}
            right={<TextInput.Icon icon={showSecurityKey ? "eye-off" : "eye"} onPress={() => setShowSecurityKey(!showSecurityKey)} />}
            style={[styles.input, { backgroundColor: 'transparent', marginBottom: 24 }]}
            activeUnderlineColor={theme.colors.primary}
          />

          <Button 
            mode="contained" 
            loading={loading} 
            disabled={loading} 
            onPress={handleSignup} 
            style={styles.button} 
            labelStyle={styles.buttonText}
          >
            {loading ? 'CONNECTING...' : 'SIGN UP'}
          </Button>

          {loading && (
            <View style={{ marginTop: 24, alignItems: 'center' }}>
              <ActivityIndicator animating={true} color={theme.colors.primary} size="large" />
              <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold', marginTop: 16, textAlign: 'center' }}>
                Connecting to Cloud...
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6, textAlign: 'center', paddingHorizontal: 10 }}>
                Please hold on! Free cloud servers may take up to 50 seconds to wake up from sleep.
              </Text>
            </View>
          )}
        </Surface>

        <View style={styles.footerContainer}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text variant="bodyLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Login</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    borderRadius: 30,
    paddingVertical: 6,
    elevation: 2,
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 20,
  }
});

