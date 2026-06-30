import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    // Adding a short timeout to prevent router from navigating before layout mounts
    const timeout = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [isAuthenticated]);

  return null;
}
