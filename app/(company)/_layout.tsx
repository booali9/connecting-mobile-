import { Tabs, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Pressable } from 'react-native'

import { Avatar } from '../../src/components/ui'
import { useCurrentAccount } from '../../src/store/session'
import { useTheme } from '../../src/theme/theme'

export default function CompanyTabs() {
  const t = useTheme()
  const router = useRouter()
  const account = useCurrentAccount()

  // An account button on every tab: without it there is no way to sign out.
  const headerRight = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Account"
      onPress={() => router.push('/account')}
      hitSlop={8}
      style={{ marginRight: 16 }}
    >
      <Avatar name={account?.name ?? 'You'} size={28} />
    </Pressable>
  )

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.background },
        headerTitleStyle: { color: t.text, fontSize: 16, fontWeight: '600' },
        headerShadowVisible: false,
        headerRight,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border },
        tabBarActiveTintColor: t.brandInk,
        tabBarInactiveTintColor: t.mutedText,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        sceneStyle: { backgroundColor: t.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="check-ins"
        options={{
          title: 'Check-ins',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="board"
        options={{
          title: 'Board',
          tabBarIcon: ({ color, size }) => <Ionicons name="albums-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="backlog"
        options={{
          title: 'Backlog',
          tabBarIcon: ({ color, size }) => <Ionicons name="layers-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
