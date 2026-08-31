import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Row, Text } from './ui'
import { useTheme } from '../theme/theme'
import { radius, space } from '../theme/tokens'

/**
 * Shared frame for sign-in, register and reset. One definition means the three
 * cannot drift apart, and the brand block carries near-black copy because white
 * on this orange only reaches 3.1:1.
 */
export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
  onBack,
  compactBrand = false,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
  onBack?: () => void
  /** Registration is long; shrink the header so the form stays above the fold. */
  compactBrand?: boolean
}) {
  const t = useTheme()
  const router = useRouter()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: space.lg, gap: space.lg, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => (onBack ? onBack() : router.back())}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}
            >
              <Ionicons name="chevron-back" size={18} color={t.brandInk} />
              <Text variant="label" tone="brand">
                Back
              </Text>
            </Pressable>
          ) : null}

          <View
            style={{
              backgroundColor: t.brandPanel,
              borderRadius: radius.xxl,
              padding: compactBrand ? space.lg : space.xl,
              gap: space.xs,
            }}
          >
            <Row>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: radius.md,
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="label" style={{ color: t.brandPanelOn }}>
                  C
                </Text>
              </View>
              <Text variant="label" style={{ color: t.brandPanelOn }}>
                Connecting
              </Text>
            </Row>
            {!compactBrand ? (
              <Text variant="title" style={{ color: t.brandPanelOn, marginTop: space.sm }}>
                Stop having status meetings.
              </Text>
            ) : null}
          </View>

          <View style={{ gap: space.xs }}>
            <Text variant="display">{title}</Text>
            <Text variant="body" tone="muted">
              {subtitle}
            </Text>
          </View>

          {children}

          {footer ? <View style={{ marginTop: 'auto', paddingTop: space.lg }}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

/** Inline error banner shared by the auth forms. */
export function FormError({ message }: { message: string }) {
  const t = useTheme()
  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: space.sm,
        backgroundColor: t.dangerSubtle,
        borderColor: t.danger,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: space.md,
      }}
    >
      <Ionicons name="alert-circle" size={16} color={t.danger} />
      <Text variant="body" tone="danger" style={{ flex: 1 }}>
        {message}
      </Text>
    </View>
  )
}
