import { useState, type ReactNode } from 'react'
import { Ionicons } from '@expo/vector-icons'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text as RNText,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'

import { useTheme } from '../theme/theme'
import { radius, space, type } from '../theme/tokens'

/* --------------------------------------------------------------------- text */

type Tone = 'default' | 'muted' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'onPrimary'
type Variant = keyof typeof type

export function Text({
  children,
  variant = 'body',
  tone = 'default',
  numberOfLines,
  style,
}: {
  children: ReactNode
  variant?: Variant
  tone?: Tone
  numberOfLines?: number
  style?: StyleProp<TextStyle>
}) {
  const t = useTheme()
  const colors: Record<Tone, string> = {
    default: t.text,
    muted: t.mutedText,
    brand: t.brandInk,
    success: t.success,
    warning: t.warning,
    danger: t.danger,
    info: t.info,
    onPrimary: t.primaryOn,
  }
  return (
    <RNText numberOfLines={numberOfLines} style={[type[variant], { color: colors[tone] }, style]}>
      {children}
    </RNText>
  )
}

/* -------------------------------------------------------------------- layout */

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const t = useTheme()
  if (!scroll) {
    return <View style={{ flex: 1, backgroundColor: t.background }}>{children}</View>
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xxl * 2 }}
    >
      {children}
    </ScrollView>
  )
}

export function Card({
  children,
  style,
  padded = true,
}: {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  padded?: boolean
}) {
  const t = useTheme()
  return (
    <View
      style={[
        {
          backgroundColor: t.card,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: radius.xl,
          padding: padded ? space.lg : 0,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

export function Section({
  title,
  subtitle,
  action,
  children,
  padded = true,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  padded?: boolean
}) {
  const t = useTheme()
  return (
    <Card padded={false}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="heading">{title}</Text>
          {subtitle ? (
            <Text variant="caption" tone="muted">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {action}
      </View>
      <View style={padded ? { padding: space.lg, gap: space.md } : undefined}>{children}</View>
    </Card>
  )
}

export function Row({
  children,
  gap = space.sm,
  style,
}: {
  children: ReactNode
  gap?: number
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>
  )
}

export function Divider() {
  const t = useTheme()
  return <View style={{ height: 1, backgroundColor: t.border }} />
}

/* ------------------------------------------------------------------- button */

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  icon,
  style,
}: {
  label: string
  onPress?: () => void
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const height = size === 'sm' ? 34 : 44

  const styles: Record<string, { bg: string; fg: string; border: string }> = {
    primary: { bg: t.primary, fg: t.primaryOn, border: 'transparent' },
    outline: { bg: 'transparent', fg: t.text, border: t.borderStrong },
    ghost: { bg: 'transparent', fg: t.mutedText, border: 'transparent' },
    danger: { bg: t.dangerSubtle, fg: t.danger, border: 'transparent' },
  }
  const s = styles[variant]

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        {
          height,
          paddingHorizontal: size === 'sm' ? space.md : space.lg,
          borderRadius: radius.lg,
          backgroundColor: s.bg,
          borderWidth: 1,
          borderColor: s.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.sm,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={s.fg} /> : icon}
      <RNText style={[type.label, { color: s.fg }]}>{label}</RNText>
    </Pressable>
  )
}

/* -------------------------------------------------------------------- badge */

export function Badge({
  label,
  tone = 'default',
}: {
  label: string
  tone?: 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
}) {
  const t = useTheme()
  const map: Record<string, { bg: string; fg: string; border: string }> = {
    default: { bg: t.muted, fg: t.text, border: 'transparent' },
    brand: { bg: t.primary, fg: t.primaryOn, border: 'transparent' },
    success: { bg: t.successSubtle, fg: t.success, border: 'transparent' },
    warning: { bg: t.warningSubtle, fg: t.warning, border: 'transparent' },
    danger: { bg: t.dangerSubtle, fg: t.danger, border: 'transparent' },
    info: { bg: t.infoSubtle, fg: t.info, border: 'transparent' },
    outline: { bg: 'transparent', fg: t.mutedText, border: t.borderStrong },
  }
  const s = map[tone]
  return (
    <View
      style={{
        backgroundColor: s.bg,
        borderColor: s.border,
        borderWidth: 1,
        borderRadius: radius.sm,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: 'flex-start',
      }}
    >
      <RNText style={[type.caption, { color: s.fg, fontWeight: '500' }]}>{label}</RNText>
    </View>
  )
}

/* ------------------------------------------------------------------- avatar */

const AVATAR_TONES = ['brandSubtle', 'infoSubtle', 'successSubtle', 'warningSubtle'] as const
const AVATAR_INK = ['brandInk', 'info', 'success', 'warning'] as const

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const t = useTheme()
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  const idx = Math.abs(hash) % AVATAR_TONES.length

  const initials = name
    .split(/[\s.@_-]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <View
      accessibilityLabel={name}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t[AVATAR_TONES[idx]],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <RNText style={{ fontSize: size * 0.38, fontWeight: '600', color: t[AVATAR_INK[idx]] }}>
        {initials}
      </RNText>
    </View>
  )
}

/* ----------------------------------------------------------------- progress */

export function Progress({
  value,
  max = 100,
  tone = 'brand',
}: {
  value: number
  max?: number
  tone?: 'brand' | 'success' | 'warning' | 'danger'
}) {
  const t = useTheme()
  const pct = Math.min(100, Math.max(0, (value / (max || 1)) * 100))
  const colors = { brand: t.primary, success: t.success, warning: t.warning, danger: t.danger }
  return (
    <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: t.muted, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: colors[tone] }} />
    </View>
  )
}

/* -------------------------------------------------------------------- input */

export function Input({
  value,
  onChangeText,
  placeholder,
  multiline,
  secureTextEntry,
  autoFocus,
  label,
  error,
  hint,
  keyboardType,
  autoCapitalize,
  autoComplete,
  onBlur,
}: {
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  multiline?: boolean
  secureTextEntry?: boolean
  autoFocus?: boolean
  label?: string
  error?: string | null
  hint?: string
  keyboardType?: 'default' | 'email-address'
  autoCapitalize?: 'none' | 'words' | 'sentences'
  autoComplete?: 'email' | 'password' | 'new-password' | 'name' | 'off'
  onBlur?: () => void
}) {
  const t = useTheme()
  const [reveal, setReveal] = useState(false)
  const isPassword = Boolean(secureTextEntry)

  return (
    <View style={{ gap: space.xs }}>
      {label ? <Text variant="label">{label}</Text> : null}

      <View style={{ justifyContent: 'center' }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={t.mutedText}
          multiline={multiline}
          secureTextEntry={isPassword && !reveal}
          autoFocus={autoFocus}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          accessibilityLabel={label ?? placeholder}
          // The error is announced with the field rather than only as colour.
          accessibilityHint={error ?? hint}
          style={{
            minHeight: multiline ? 88 : 44,
            borderWidth: 1,
            borderColor: error ? t.danger : t.borderStrong,
            borderRadius: radius.lg,
            paddingHorizontal: space.md,
            paddingRight: isPassword ? 44 : space.md,
            paddingVertical: space.sm,
            color: t.text,
            backgroundColor: t.card,
            textAlignVertical: multiline ? 'top' : 'center',
            ...type.body,
          }}
        />

        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={reveal ? 'Hide password' : 'Show password'}
            onPress={() => setReveal((v) => !v)}
            hitSlop={8}
            style={{ position: 'absolute', right: space.md }}
          >
            <Ionicons name={reveal ? 'eye-off-outline' : 'eye-outline'} size={18} color={t.mutedText} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  )
}

/* ---------------------------------------------------------------- stat tile */

export function Stat({
  label,
  value,
  caption,
  tone = 'brand',
  progress,
}: {
  label: string
  value: string | number
  caption?: string
  tone?: 'brand' | 'success' | 'warning' | 'info'
  progress?: { value: number; max: number }
}) {
  const t = useTheme()
  const accents = { brand: t.brandInk, success: t.success, warning: t.warning, info: t.info }
  return (
    <Card style={{ flex: 1, minWidth: 150, gap: space.sm, padding: space.md }}>
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </Text>
      <RNText style={[type.title, { color: accents[tone] }]}>{value}</RNText>
      {progress ? <Progress value={progress.value} max={progress.max} tone={tone === 'info' ? 'brand' : tone} /> : null}
      {caption ? (
        <Text variant="caption" tone="muted" numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
    </Card>
  )
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>{children}</View>
  )
}

/* --------------------------------------------------------------- empty state */

export function Empty({ title, body }: { title: string; body?: string }) {
  const t = useTheme()
  return (
    <View
      style={{
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: t.border,
        borderRadius: radius.lg,
        padding: space.xl,
        alignItems: 'center',
        gap: space.xs,
      }}
    >
      <Text variant="label">{title}</Text>
      {body ? (
        <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
          {body}
        </Text>
      ) : null}
    </View>
  )
}
