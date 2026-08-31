import { Tabs, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Pressable } from 'react-native'

import { Avatar } from '../../src/components/ui'
import { useCurrentAccount } from '../../src/store/session'
import { useTheme } from '../../src/theme/theme'

export default function EmployeeTabs() {
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
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Ionicons name="today-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'My tasks',
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
