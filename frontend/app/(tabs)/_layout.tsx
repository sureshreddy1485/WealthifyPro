import { Tabs, router, Redirect } from 'expo-router';
import { useTheme } from 'react-native-paper';
import * as import_paper from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

import { TouchableOpacity } from 'react-native';

export default function TabLayout() {
  const theme = useTheme();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const syncStatus = useSyncStore(state => state.syncStatus);
  const insets = useSafeAreaInsets();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceVariant,
          height: 65 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        },
        headerShown: true,
        headerTitle: 'WealthifyPro',
        headerStyle: {
          backgroundColor: theme.colors.surface, // Differentiate from background
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme.colors.primary,
        },
        headerTitleAlign: 'left',
        headerTintColor: theme.colors.onSurface,
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push('/settings')} style={{ marginRight: 16 }}>
            {user?.profilePictureUrl ? (
              <import_paper.Avatar.Image size={32} source={{ uri: user.profilePictureUrl }} />
            ) : (
              <import_paper.Avatar.Text 
                size={32} 
                label={(user?.name?.substring(0, 2) || 'U').toUpperCase()} 
                style={{ backgroundColor: theme.colors.primary }} 
              />
            )}
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          tabBarLabel: 'Notes',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="note-multiple" color={color} size={26} />
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          tabBarLabel: 'Ledger',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="book-open-page-variant" color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="emi"
        options={{
          tabBarLabel: 'EMI',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="calculator" color={color} size={26} />
        }}
      />
    </Tabs>

      {syncStatus === 'syncing' && (
        <View style={{
          position: 'absolute',
          bottom: 80 + Math.max(insets.bottom, 8), // Float just above the tab bar
          alignSelf: 'center',
          backgroundColor: theme.colors.primaryContainer,
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 30,
          flexDirection: 'row',
          alignItems: 'center',
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 5,
        }}>
          <import_paper.ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 12 }} />
          <import_paper.Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
            Connecting to Cloud...
          </import_paper.Text>
        </View>
      )}
    </View>
  );
}
