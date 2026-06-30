import { Tabs, router, Redirect } from 'expo-router';
import { useTheme } from 'react-native-paper';
import * as import_paper from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TouchableOpacity } from 'react-native';

export default function TabLayout() {
  const theme = useTheme();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const insets = useSafeAreaInsets();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
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
  );
}
