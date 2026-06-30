import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Text, useTheme, Surface, Appbar } from 'react-native-paper';
import { useThemeStore, predefinedThemes, AppTheme } from '@/store/themeStore';
import { router } from 'expo-router';
import CustomAlert from '@/components/CustomAlert';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ThemeCard = ({ appTheme, selected, onPress }: { appTheme: AppTheme, selected: boolean, onPress: () => void }) => {
  return (
    <TouchableOpacity onPress={onPress} style={{ width: '48%', marginBottom: 16 }}>
      <Surface 
        style={{
          flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20,
          backgroundColor: appTheme.colors.surface,
          borderWidth: 2,
          borderColor: selected ? appTheme.colors.primary : 'transparent'
        }}
        elevation={0}
      >
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: appTheme.colors.primary, marginRight: 12 }} />
        <Text style={{ flex: 1, color: appTheme.colors.onSurface, fontWeight: 'bold', fontSize: 16 }} numberOfLines={1}>
          {appTheme.name}
        </Text>
        <Text style={{ fontSize: 16 }}>{appTheme.emoji}</Text>
      </Surface>
    </TouchableOpacity>
  );
};

export default function ThemeSelectorScreen() {
  const theme = useTheme();
  const { currentThemeId, setTheme, setPreviewTheme } = useThemeStore();
  const currentAppTheme = predefinedThemes.find(t => t.id === currentThemeId);
  const insets = useSafeAreaInsets();

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

  const handleThemeSelect = (t: AppTheme) => {
    setPreviewTheme(t.id);
    showAlert({
      title: 'Preview Theme',
      message: `Do you want to apply the ${t.name} theme?`,
      showCancel: true,
      confirmText: 'Apply',
      onConfirm: () => {
        setTheme(t.id);
        setPreviewTheme(null);
        router.back();
      },
      onDismiss: () => {
        setPreviewTheme(null);
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
        <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onBackground} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 + insets.bottom }]}>
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 }}>
          <Text variant="displayMedium" style={{ fontWeight: 'bold', color: theme.colors.onBackground, marginBottom: 16 }}>Settings</Text>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Current: <Text style={{ color: currentAppTheme?.colors.primary, fontWeight: 'bold' }}>{currentAppTheme?.name} {currentAppTheme?.emoji}</Text>
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16 }}>
          {predefinedThemes.map(t => (
            <ThemeCard 
              key={t.id} 
              appTheme={t} 
              selected={t.id === currentThemeId} 
              onPress={() => handleThemeSelect(t)} 
            />
          ))}
        </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  }
});
