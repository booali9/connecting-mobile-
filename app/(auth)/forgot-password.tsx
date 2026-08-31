import { useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { AuthScreen } from '../../src/components/AuthScreen'
import { Button, Card, Input, Row, Text } from '../../src/components/ui'
import { useTheme } from '../../src/theme/theme'
import { radius, space } from '../../src/theme/tokens'
import { useSession, validators } from '../../src/store/session'

const STEPS = [
  { title: 'Check your inbox', detail: 'The email comes from no-reply@connecting.com.' },
  { title: 'Open the reset link', detail: 'It expires one hour after it is sent.' },
  { title: 'Choose a new password', detail: 'At least 8 characters, not one you have used before.' },
]

export default function ForgotPassword() {
  const t = useTheme()
  const router = useRouter()
  const requestReset = useSession((s) => s.requestReset)

  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const error = touched ? validators.email(email) : null

  async function submit() {
    setTouched(true)
    if (validators.email(email)) return
    setBusy(true)
    await requestReset(email)
    setBusy(false)
    setSent(true)
  }

  return (
    <AuthScreen
      compactBrand
      onBack={() => router.back()}
      title={sent ? 'Check your email' : 'Reset your password'}
      subtitle={
        sent
          ? `If an account exists for ${email}, a reset link is on its way.`
          : "Enter your email and we'll send you a link."
      }
    >
      {sent ? (
        <Card style={{ gap: space.lg }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.lg,
              backgroundColor: t.successSubtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="mail-outline" size={20} color={t.success} />
          </View>

          {STEPS.map((step, i) => (
            <Row key={step.title} style={{ alignItems: 'flex-start' }} gap={space.md}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: t.muted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="caption" tone="muted">
                  {i + 1}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text variant="label">{step.title}</Text>
                <Text variant="caption" tone="muted">
                  {step.detail}
                </Text>
              </View>
            </Row>
          ))}

          <Button label="Back to sign in" onPress={() => router.replace('/(auth)/sign-in')} />
          <Button label="Try a different email" variant="ghost" onPress={() => setSent(false)} />
        </Card>
      ) : (
        <Card style={{ gap: space.lg }}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            onBlur={() => setTouched(true)}
            placeholder="you@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={error}
            autoFocus
          />
          <Button label="Send reset link" onPress={submit} loading={busy} />
          <Text variant="caption" tone="muted">
            We never say whether an address is registered — that would leak who has an account.
          </Text>
        </Card>
      )}
    </AuthScreen>
  )
}
