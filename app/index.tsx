import { Redirect } from 'expo-router'

import { homeFor, useCurrentAccount } from '../src/store/session'

/**
 * Entry point. The real decision lives in the root layout's guard; this just
 * points at wherever the current session belongs so a cold start on `/` does
 * not flash an empty screen first.
 */
export default function Index() {
  const account = useCurrentAccount()
  return <Redirect href={account ? homeFor(account.role) : '/(auth)/sign-in'} />
}
