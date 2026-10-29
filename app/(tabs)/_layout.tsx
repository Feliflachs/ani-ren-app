import { useCurrentUser } from '../../src/useCurrentUser';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../src/theme';
import { Image } from 'react-native';

export const unstable_settings = { initialRouteName: 'inicio' };

export default function TabLayout() {
  const currentUser = useCurrentUser();

  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primarySoft,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          height: 70 + insets.bottom,
          paddingTop: 7,
          paddingBottom: Math.max(insets.bottom, 7),
        },
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14 },
        tabBarLabelPosition: 'below-icon',
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={focused ? theme.colors.primarySoft : theme.colors.textSecondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explorar"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="search-outline"
              size={size}
              color={focused ? theme.colors.primarySoft : theme.colors.textSecondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="crear"
        options={{
          title: 'Crear',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="add"
              size={size}
              color={focused ? theme.colors.primarySoft : theme.colors.textSecondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="aura"
        options={{
          title: 'Aura',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="flame-outline"
              size={size}
              color={focused ? theme.colors.primarySoft : theme.colors.textSecondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused, size }) => (
            <Image
              source={currentUser.image}
              style={{
                width: size + 2,
                height: size + 2,
                borderRadius: (size + 2) / 2,
                opacity: focused ? 1 : 0.65,
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
