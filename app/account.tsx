import { ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Avatar, Badge, Button, Card, Divider, Row, Text } from '../src/components/ui'
import { useTheme } from '../src/theme/theme'
import { space } from '../src/theme/tokens'
import { ROLE_LABEL, useCurrentAccount, useSession } from '../src/store/session'
import { useCheckInStore } from '../src/store/checkin'

export default function AccountScreen() {
  const t = useTheme()
  const router = useRouter()
  const account = useCurrentAccount()
  const signOut = useSession((s) => s.signOut)
  const streak = useCheckInStore((s) => s.streak)

  if (!account) return null

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={{ padding: space.lg, gap: space.lg }}
    >
      <Card style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xl }}>
        <Avatar name={account.name} size={64} />
        <Text variant="title">{account.name}</Text>
        <Text variant="body" tone="muted">
          {account.email}
        </Text>
        <Badge label={ROLE_LABEL[account.role]} tone="info" />
      </Card>

      <Card padded={false}>
        <Field label="Company" value={account.company} icon="business-outline" />
        <Divider />
        <Field label="Role" value={ROLE_LABEL[account.role]} icon="person-outline" />
        <Divider />
        <Field label="Check-in streak" value={`${streak} days`} icon="flame-outline" />
      </Card>

      <Card style={{ gap: space.sm }}>
        <Row>
          <Ionicons name="phone-portrait-outline" size={16} color={t.mutedText} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            Appearance follows your device's light or dark setting.
          </Text>
        </Row>
      </Card>

      <Button
        label="Sign out"
        variant="danger"
        icon={<Ionicons name="log-out-outline" size={16} color={t.danger} />}
        onPress={() => {
          signOut()
          router.replace('/(auth)/sign-in')
        }}
      />
    </ScrollView>
  )
}

function Field({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: 'business-outline' | 'person-outline' | 'flame-outline'
}) {
  const t = useTheme()
  return (
    <Row style={{ padding: space.md }} gap={space.md}>
      <Ionicons name={icon} size={16} color={t.mutedText} />
      <Text variant="body" tone="muted" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="label">{value}</Text>
    </Row>
  )
}
