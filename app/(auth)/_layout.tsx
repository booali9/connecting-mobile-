import { Stack } from 'expo-router'

/** Auth screens carry their own headers, so the stack stays chrome-free. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
