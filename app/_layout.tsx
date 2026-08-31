import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { ThemeProvider, useIsDark, useTheme } from '../src/theme/theme'
import { homeFor, useCurrentAccount, useSession } from '../src/store/session'

/**
 * Route guard. Everything under `(auth)` is public; everything else requires a
 * session. Redirecting from an effect rather than rendering `<Redirect>` keeps
 * the decision in one place, so a new protected route is protected by default.
 */
function useAuthGate() {
  const router = useRouter()
  const segments = useSegments()
  const account = useCurrentAccount()
  const [hydrated, setHydrated] = useState(useSession.persist.hasHydrated())

  useEffect(() => {
    // The session comes from AsyncStorage; redirecting before it lands would
    // bounce a signed-in person back to the sign-in screen on every cold start.
    const unsub = useSession.persist.onFinishHydration(() => setHydrated(true))
    if (useSession.persist.hasHydrated()) setHydrated(true)
    return unsub
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const inAuthGroup = segments[0] === '(auth)'

    if (!account && !inAuthGroup) {
      router.replace('/(auth)/sign-in')
    } else if (account && inAuthGroup) {
      router.replace(homeFor(account.role))
    }
  }, [hydrated, account, segments, router])

  return hydrated
}

function Navigator() {
  const t = useTheme()
  const isDark = useIsDark()
  const hydrated = useAuthGate()

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.background }}>
        <ActivityIndicator color={t.brandInk} />
      </View>
    )
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.background },
          headerTitleStyle: { color: t.text, fontSize: 16, fontWeight: '600' },
          headerTintColor: t.brandInk,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(company)" options={{ headerShown: false }} />
        <Stack.Screen name="(employee)" options={{ headerShown: false }} />
        {/* Things you open, act on and dismiss — not places you stay. */}
        <Stack.Screen name="issue/[key]" options={{ presentation: 'modal', title: 'Issue' }} />
        <Stack.Screen name="check-in" options={{ presentation: 'modal', title: 'Daily check-in' }} />
        <Stack.Screen name="new-issue" options={{ presentation: 'modal', title: 'New issue' }} />
        <Stack.Screen name="account" options={{ presentation: 'modal', title: 'Account' }} />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Navigator />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
