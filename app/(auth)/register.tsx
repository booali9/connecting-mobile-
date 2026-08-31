import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { AuthScreen, FormError } from '../../src/components/AuthScreen'
import { Button, Card, Input, Progress, Row, Text } from '../../src/components/ui'
import { useTheme } from '../../src/theme/theme'
import { radius, space } from '../../src/theme/tokens'
import {
  ROLE_LABEL,
  STRENGTH_LABEL,
  homeFor,
  passwordStrength,
  useSession,
  validators,
  type Role,
} from '../../src/store/session'

const ROLES: Array<{ value: Role; hint: string }> = [
  { value: 'company_admin', hint: 'Run a team and its board' },
  { value: 'employee', hint: 'Do your own work' },
]

type Field = 'name' | 'email' | 'company' | 'password' | 'confirm'

export default function Register() {
  const t = useTheme()
  const router = useRouter()
  const register = useSession((s) => s.register)

  const [form, setForm] = useState({ name: '', email: '', company: '', password: '', confirm: '' })
  const [role, setRole] = useState<Role>('employee')
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [accepted, setAccepted] = useState(false)

  const set = (key: Field, value: string) => setForm((f) => ({ ...f, [key]: value }))
  const blur = (key: Field) => setTouched((v) => ({ ...v, [key]: true }))

  const errors: Record<Field, string | null> = {
    name: validators.name(form.name),
    email: validators.email(form.email),
    company: validators.company(form.company),
    password: validators.password(form.password),
    confirm: form.confirm !== form.password ? 'The two passwords do not match.' : null,
  }
  const shown = (key: Field) => (touched[key] ? errors[key] : null)

  const strength = passwordStrength(form.password)
  const strengthTone = strength <= 1 ? 'danger' : strength === 2 ? 'warning' : 'success'
  const canSubmit = Object.values(errors).every((e) => e === null) && accepted

  async function submit() {
    setTouched({ name: true, email: true, company: true, password: true, confirm: true })
    if (!canSubmit) {
      setFormError(accepted ? null : 'Please accept the terms to continue.')
      return
    }

    setBusy(true)
    setFormError(null)
    const error = await register({ ...form, role })
    setBusy(false)

    if (error) {
      setFormError(error)
      return
    }
    router.replace(homeFor(role))
  }

  return (
    <AuthScreen
      compactBrand
      onBack={() => router.back()}
      title="Create your account"
      subtitle="14-day trial. No card needed."
      footer={
        <Row style={{ justifyContent: 'center' }} gap={4}>
          <Text variant="body" tone="muted">
            Already have an account?
          </Text>
          <Link href="/(auth)/sign-in" asChild>
            <Text variant="label" tone="brand">
              Sign in
            </Text>
          </Link>
        </Row>
      }
    >
      <Card style={{ gap: space.lg }}>
        {formError ? <FormError message={formError} /> : null}

        <Input
          label="Full name"
          value={form.name}
          onChangeText={(v) => set('name', v)}
          onBlur={() => blur('name')}
          placeholder="Jordan Lee"
          autoCapitalize="words"
          autoComplete="name"
          error={shown('name')}
        />

        <Input
          label="Work email"
          value={form.email}
          onChangeText={(v) => set('email', v)}
          onBlur={() => blur('email')}
          placeholder="jordan@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={shown('email')}
        />

        <Input
          label="Company"
          value={form.company}
          onChangeText={(v) => set('company', v)}
          onBlur={() => blur('company')}
          placeholder="Acme Robotics"
          autoCapitalize="words"
          error={shown('company')}
        />
      </Card>

      <Card style={{ gap: space.md }}>
        <Text variant="label">I am signing up as</Text>
        {ROLES.map((option) => {
          const selected = role === option.value
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setRole(option.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                padding: space.md,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: selected ? t.brand : t.border,
                backgroundColor: selected ? t.brandSubtle : 'transparent',
              }}
            >
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={selected ? t.brandInk : t.mutedText}
              />
              <View style={{ flex: 1 }}>
                <Text variant="label">{ROLE_LABEL[option.value]}</Text>
                <Text variant="caption" tone="muted">
                  {option.hint}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </Card>

      <Card style={{ gap: space.lg }}>
        <Input
          label="Password"
          value={form.password}
          onChangeText={(v) => set('password', v)}
          onBlur={() => blur('password')}
          placeholder="At least 8 characters"
          secureTextEntry
          autoComplete="new-password"
          error={shown('password')}
        />

        {form.password ? (
          <View style={{ gap: space.xs }}>
            <Progress value={(strength + 1) * 20} tone={strengthTone} />
            <Text variant="caption" tone={strengthTone}>
              {STRENGTH_LABEL[strength]}
            </Text>
          </View>
        ) : null}

        <Input
          label="Confirm password"
          value={form.confirm}
          onChangeText={(v) => set('confirm', v)}
          onBlur={() => blur('confirm')}
          placeholder="••••••••"
          secureTextEntry
          autoComplete="new-password"
          error={shown('confirm')}
        />

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          accessibilityLabel="Accept the terms of service and privacy policy"
          onPress={() => setAccepted((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.sm }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: radius.sm,
              borderWidth: 1.5,
              borderColor: accepted ? t.primary : t.borderStrong,
              backgroundColor: accepted ? t.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 1,
            }}
          >
            {accepted ? <Ionicons name="checkmark" size={13} color={t.primaryOn} /> : null}
          </View>
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            I agree to the Terms of Service and Privacy Policy.
          </Text>
        </Pressable>

        <Button label="Create account" onPress={submit} loading={busy} />
      </Card>
    </AuthScreen>
  )
}
