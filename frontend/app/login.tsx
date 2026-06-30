import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, Surface, Checkbox, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore, api } from '@/store/authStore';
import * as Device from 'expo-device';
import { useNoteStore } from '@/store/noteStore';
import { useLedgerStore } from '@/store/ledgerStore';
import { useEmiStore } from '@/store/emiStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const theme = useTheme();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSecurityKey, setShowSecurityKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('saved_email');
        const savedPassword = await AsyncStorage.getItem('saved_password');
        if (savedEmail && savedPassword) {
          setEmailOrPhone(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (e) {}
    })();
  }, []);

  const login = useAuthStore(state => state.login);

  const handleLogin = async () => {
    if (!emailOrPhone || !password || !securityKey) {
      alert('Please fill email/phone, password, and security key fields');
      return;
    }
    
    setLoading(true);
    try {
      useAuthStore.getState().ensureDeviceId();
      const deviceId = useAuthStore.getState().deviceId;
      const deviceName = Device.deviceName || Device.modelName || 'Unknown Device';

      const response = await api.post('/auth/login', {
        emailOrPhone,
        password,
        securityKey: securityKey || undefined,
        deviceId,
        deviceName
      });
      
      const { accessToken, user } = response.data;
      
      if (rememberMe) {
        await AsyncStorage.setItem('saved_email', emailOrPhone);
        await AsyncStorage.setItem('saved_password', password);
      } else {
        await AsyncStorage.removeItem('saved_email');
        await AsyncStorage.removeItem('saved_password');
      }

      login(accessToken, user);

      // Hydrate local stores with cloud data
      try {
        const syncResponse = await api.get('/sync');
        const cloudData = syncResponse.data?.data;
        if (cloudData) {
          if (cloudData.notes) useNoteStore.setState(cloudData.notes);
          if (cloudData.ledgers) useLedgerStore.setState(cloudData.ledgers);
          if (cloudData.emis) useEmiStore.setState(cloudData.emis);
        }
      } catch (e) {
        console.log('Failed to pull initial sync', e);
      }

      router.replace('/(tabs)');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Login failed. Please check your credentials.');
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
          <Text variant="displaySmall" style={{ color: theme.colors.onBackground, fontWeight: '800', marginTop: 16 }}>WealthifyPro</Text>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>Welcome back! Please login.</Text>
        </View>

        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
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
            label="Security Key (Required)"
            value={securityKey}
            onChangeText={setSecurityKey}
            mode="flat"
            secureTextEntry={!showSecurityKey}
            left={<TextInput.Icon icon="key-outline" color={theme.colors.primary} />}
            right={<TextInput.Icon icon={showSecurityKey ? "eye-off" : "eye"} onPress={() => setShowSecurityKey(!showSecurityKey)} />}
            style={[styles.input, { backgroundColor: 'transparent' }]}
            activeUnderlineColor={theme.colors.primary}
          />

          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7}>
              <Checkbox.Android
                status={rememberMe ? 'checked' : 'unchecked'}
                onPress={() => setRememberMe(!rememberMe)}
                color={theme.colors.primary}
              />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Remember Me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotPassword}>
              <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <Button 
            mode="contained" 
            loading={loading} 
            disabled={loading} 
            onPress={handleLogin} 
            style={styles.button} 
            labelStyle={styles.buttonText}
          >
            {loading ? 'CONNECTING...' : 'LOGIN'}
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
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text variant="bodyLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Sign Up</Text>
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    marginTop: -8,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },
  forgotPassword: {
    paddingVertical: 8,
  },
  button: {
    borderRadius: 30,
    paddingVertical: 6,
    elevation: 2,
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

