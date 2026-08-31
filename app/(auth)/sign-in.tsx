import { useState } from 'react'
import { View } from 'react-native'
import { Link, useRouter } from 'expo-router'

import { AuthScreen, FormError } from '../../src/components/AuthScreen'
import { Button, Card, Input, Row, Text } from '../../src/components/ui'
import { useTheme } from '../../src/theme/theme'
import { space } from '../../src/theme/tokens'
import { homeFor, useSession, validators } from '../../src/store/session'

const DEMO = [
  { email: 'jordan@acme.com', label: 'Company Manager' },
  { email: 'sam@acme.com', label: 'Employee' },
]

export default function SignIn() {
  const t = useTheme()
  const router = useRouter()
  const signIn = useSession((s) => s.signIn)
  const accounts = useSession((s) => s.accounts)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Field errors appear on blur or on submit, never while someone is mid-word.
  const emailError = touched.email ? validators.email(email) : null
  const passwordError = touched.password ? (password ? null : 'Enter your password.') : null

  async function submit() {
    setTouched({ email: true, password: true })
    const invalid = validators.email(email) ?? (password ? null : 'Enter your password.')
    if (invalid) {
      setFormError(null)
      return
    }

    setBusy(true)
    setFormError(null)
    const error = await signIn(email, password)
    setBusy(false)

    if (error) {
      setFormError(error)
      return
    }
    const account = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
    router.replace(homeFor(account?.role ?? 'employee'))
  }

  return (
    <AuthScreen
      title="Sign in"
      subtitle="Welcome back."
      footer={
        <Row style={{ justifyContent: 'center' }} gap={4}>
          <Text variant="body" tone="muted">
            No account yet?
          </Text>
          <Link href="/(auth)/register" asChild>
            <Text variant="label" tone="brand">
              Create one
            </Text>
          </Link>
        </Row>
      }
    >
      <Card style={{ gap: space.lg }}>
        {formError ? <FormError message={formError} /> : null}

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          onBlur={() => setTouched((v) => ({ ...v, email: true }))}
          placeholder="you@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={emailError}
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          onBlur={() => setTouched((v) => ({ ...v, password: true }))}
          placeholder="••••••••"
          secureTextEntry
          autoComplete="password"
          error={passwordError}
        />

        <Button label="Sign in" onPress={submit} loading={busy} />

        <Link href="/(auth)/forgot-password" asChild>
          <Text variant="label" tone="brand" style={{ textAlign: 'center' }}>
            Forgot your password?
          </Text>
        </Link>
      </Card>

      <Card style={{ gap: space.sm }}>
        <Text variant="label">Demo accounts</Text>
        <Text variant="caption" tone="muted">
          Password is “password” for both.
        </Text>
        <View style={{ gap: space.sm }}>
          {DEMO.map((demo) => (
            <Button
              key={demo.email}
              label={`${demo.label} — ${demo.email}`}
              variant="outline"
              size="sm"
              onPress={() => {
                setEmail(demo.email)
                setPassword('password')
                setTouched({})
                setFormError(null)
              }}
            />
          ))}
        </View>
      </Card>
    </AuthScreen>
  )
}
