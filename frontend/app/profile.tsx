import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, Avatar, Surface, List, Portal, Dialog } from 'react-native-paper';
import { useAuthStore, api } from '@/store/authStore';
import { useAlertStore } from '@/store/alertStore';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, updateUser, logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  
  // Modals state
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [emailOrPhone, setEmailOrPhone] = useState(user?.emailOrPhone || '');
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!name) {
      useAlertStore.getState().showAlert({ title: 'Error', message: 'Name cannot be empty' });
      return;
    }
    setLoadingProfile(true);
    try {
      if (user) {
        const response = await api.put('/users/profile', { name });
        updateUser({ ...user, ...response.data });
      }
      setEditProfileVisible(false);
    } catch (e) {
      useAlertStore.getState().showAlert({ title: 'Error', message: 'Failed to update profile' });
    } finally {
      setLoadingProfile(false);
    }
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const base64Image = `data:image/jpeg;base64,${asset.base64}`;
      try {
        const response = await api.put('/users/profile', { profilePictureUrl: base64Image });
        if (user) {
           updateUser({ ...user, ...response.data });
        }
      } catch (e) {
        useAlertStore.getState().showAlert({ title: 'Error', message: 'Failed to upload profile picture' });
      }
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !securityKey) {
      useAlertStore.getState().showAlert({ title: 'Error', message: 'Please fill all fields' });
      return;
    }
    setLoadingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        securityKey
      });
      useAlertStore.getState().showAlert({ title: 'Success', message: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setSecurityKey('');
      setChangePasswordVisible(false);
    } catch (e: any) {
      useAlertStore.getState().showAlert({ title: 'Error', message: e.response?.data?.message || 'Failed to change password. Endpoint might not be available yet.' });
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleLogout = () => {
    useAlertStore.getState().showAlert({
      title: "Logout",
      message: "Are you sure you want to logout?",
      showCancel: true,
      cancelText: "Cancel",
      confirmText: "Logout",
      onConfirm: () => {
        logout();
        router.replace('/login');
      }
    });
  };

  const handleDeleteAccount = () => {
    useAlertStore.getState().showAlert({
      title: "Delete Account",
      message: "Are you absolutely sure you want to permanently delete your account and all its data? This action cannot be undone.",
      showCancel: true,
      cancelText: "Cancel",
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          await api.delete('/users/profile');
          logout();
          router.replace('/login');
        } catch (e) {
          useAlertStore.getState().showAlert({ title: 'Error', message: 'Failed to delete account. Please try again.' });
        }
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 16 + insets.bottom }]}>
        
        {/* Header Profile Section */}
        <Surface style={[styles.headerCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <TouchableOpacity onPress={pickImage} style={{ position: 'relative', marginBottom: 16 }}>
            {user?.profilePictureUrl ? (
              <Avatar.Image size={90} source={{ uri: user.profilePictureUrl }} />
            ) : (
              <Avatar.Text 
                size={90} 
                label={(user?.name?.substring(0, 2) || 'U').toUpperCase()} 
                style={{ backgroundColor: theme.colors.primary }} 
              />
            )}
            <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.colors.secondary, borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' }}>
              <MaterialCommunityIcons name="camera" size={16} color={theme.colors.onPrimary} />
            </View>
          </TouchableOpacity>
          <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
            {user?.name || 'User'}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            {user?.emailOrPhone || 'No Email'}
          </Text>
        </Surface>

        {/* Actions List */}
        <Surface style={[styles.listCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <List.Item
            title="Edit Profile"
            description="Change your name"
            left={props => <List.Icon {...props} icon="account-edit-outline" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              setName(user?.name || '');
              setEmailOrPhone(user?.emailOrPhone || '');
              setEditProfileVisible(true);
            }}
            titleStyle={{ color: theme.colors.onSurface, fontWeight: '500' }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          />
          
          <List.Item
            title="Change Password"
            description="Requires Security Key"
            left={props => <List.Icon {...props} icon="lock-reset" color={theme.colors.secondary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              setCurrentPassword('');
              setNewPassword('');
              setSecurityKey('');
              setChangePasswordVisible(true);
            }}
            titleStyle={{ color: theme.colors.onSurface, fontWeight: '500' }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          />

          <List.Item
            title="Logout"
            left={props => <List.Icon {...props} icon="logout" color={theme.colors.onSurfaceVariant} />}
            onPress={handleLogout}
            titleStyle={{ color: theme.colors.onSurfaceVariant, fontWeight: '500' }}
          />

          <List.Item
            title="Delete Account"
            description="Permanently delete data"
            left={props => <List.Icon {...props} icon="delete-forever" color="#EF4444" />}
            onPress={handleDeleteAccount}
            titleStyle={{ color: '#EF4444', fontWeight: '500' }}
            descriptionStyle={{ color: '#EF4444', opacity: 0.8 }}
          />
        </Surface>

      </ScrollView>

      {/* Edit Profile Dialog */}
      <Portal>
        <Dialog visible={editProfileVisible} onDismiss={() => setEditProfileVisible(false)} style={{ backgroundColor: theme.colors.surface, borderRadius: 16 }}>
          <Dialog.Title style={{ color: theme.colors.primary }}>Edit Profile</Dialog.Title>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Dialog.Content>
                <TextInput
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  mode="flat"
                  style={styles.input}
                  left={<TextInput.Icon icon="account-outline" />}
                />
                <TextInput
                  label="Email or Phone"
                  value={emailOrPhone}
                  mode="flat"
                  style={[styles.input, { opacity: 0.6 }]}
                  left={<TextInput.Icon icon="email-outline" />}
                  disabled={true}
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setEditProfileVisible(false)}>Cancel</Button>
                <Button mode="contained" loading={loadingProfile} onPress={handleSaveProfile}>Save</Button>
              </Dialog.Actions>
            </ScrollView>
          </KeyboardAvoidingView>
        </Dialog>
      </Portal>

      {/* Change Password Dialog */}
      <Portal>
        <Dialog visible={changePasswordVisible} onDismiss={() => setChangePasswordVisible(false)} style={{ backgroundColor: theme.colors.surface, borderRadius: 16 }}>
          <Dialog.Title style={{ color: theme.colors.secondary }}>Change Password</Dialog.Title>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Dialog.Content>
                <TextInput
                  label="Current Password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  mode="flat"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  left={<TextInput.Icon icon="lock-outline" />}
                  right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
                />
                <TextInput
                  label="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  mode="flat"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  left={<TextInput.Icon icon="lock-reset" />}
                  right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
                />
                <TextInput
                  label="Security Key"
                  value={securityKey}
                  onChangeText={setSecurityKey}
                  mode="flat"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  left={<TextInput.Icon icon="key-outline" />}
                  right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setChangePasswordVisible(false)} textColor={theme.colors.onSurfaceVariant}>Cancel</Button>
                <Button mode="contained" buttonColor={theme.colors.secondary} loading={loadingPassword} onPress={handleChangePassword}>Update</Button>
              </Dialog.Actions>
            </ScrollView>
          </KeyboardAvoidingView>
        </Dialog>
      </Portal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    marginBottom: 16,
  },
  listCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  }
});
