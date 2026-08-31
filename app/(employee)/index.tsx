import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import {
  Badge,
  Button,
  Card,
  Divider,
  Row,
  Screen,
  Section,
  Stat,
  StatGrid,
  Text,
} from '../../src/components/ui'
import { useTheme } from '../../src/theme/theme'
import { radius, space } from '../../src/theme/tokens'
import { QUESTIONS, useCheckInStore } from '../../src/store/checkin'
import { useIssuesStore } from '../../src/store/issues'
import { useCurrentAccount } from '../../src/store/session'

const SCHEDULE = [
  { title: 'Sprint planning', time: '2:00 PM', ai: true },
  { title: '1:1 with manager', time: 'Tomorrow, 10:00 AM', ai: false },
]

export default function Today() {
  const t = useTheme()
  const router = useRouter()
  const account = useCurrentAccount()

  const mine = useCheckInStore((s) => s.mine)
  const streak = useCheckInStore((s) => s.streak)
  const issues = useIssuesStore((s) => s.issues)

  const done = mine.status === 'complete'
  const myIssues = issues.filter((i) => i.type !== 'epic' && i.status !== 'done')
  const dueToday = myIssues.slice(0, 4)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Text variant="display">
          {greeting}, {account?.name?.split(' ')[0] ?? 'there'}
        </Text>
        <Text variant="body" tone="muted">
          Everything assigned to you, and what's coming up.
        </Text>
      </View>

      {done ? (
        <Card style={{ gap: space.sm }}>
          <Row>
            <Ionicons name="checkmark-circle" size={18} color={t.success} />
            <Text variant="label">Check-in filed at {mine.completedAt}</Text>
            <View style={{ flex: 1 }} />
            {mine.blocker ? <Badge label="Escalated" tone="danger" /> : <Badge label="Verified" tone="success" />}
          </Row>
          {mine.answers?.map((a) => {
            const q = QUESTIONS.find((x) => x.id === a.questionId)
            return (
              <View key={a.questionId} style={{ gap: 1 }}>
                <Text variant="caption" tone="muted">
                  {q?.prompt}
                </Text>
                <Text variant="body" numberOfLines={1}>
                  {a.text || 'Nothing raised'}
                </Text>
              </View>
            )
          })}
        </Card>
      ) : (
        <Card
          style={{
            gap: space.md,
            backgroundColor: t.brandSubtle,
            borderColor: t.brand,
          }}
        >
          <Row>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: radius.lg,
                backgroundColor: t.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="sparkles" size={16} color={t.primaryOn} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="label">Your daily check-in is ready</Text>
              <Text variant="caption" tone="muted">
                Three questions, about two minutes.
              </Text>
            </View>
          </Row>
          <Button label="Start check-in" onPress={() => router.push('/check-in')} />
        </Card>
      )}

      <StatGrid>
        <Stat label="Open tasks" value={myIssues.length} tone="brand" />
        <Stat label="Check-in streak" value={`${streak} days`} tone="success" />
      </StatGrid>

      <Section
        title="My tasks"
        subtitle="Highest priority first"
        padded={false}
        action={<Button label="All" variant="ghost" size="sm" onPress={() => router.push('/(employee)/tasks')} />}
      >
        {dueToday.map((issue, i) => (
          <View key={issue.key}>
            {i > 0 ? <Divider /> : null}
            <View style={{ padding: space.md, gap: space.xs }}>
              <Row gap={6}>
                <Text variant="mono" tone="muted">
                  {issue.key}
                </Text>
                <View style={{ flex: 1 }} />
                {issue.points != null ? <Badge label={`${issue.points} pts`} tone="outline" /> : null}
              </Row>
              <Text variant="body">{issue.title}</Text>
              <Button
                label="Open"
                variant="outline"
                size="sm"
                onPress={() => router.push(`/issue/${issue.key}`)}
                style={{ alignSelf: 'flex-start' }}
              />
            </View>
          </View>
        ))}
      </Section>

      <Section title="Up next" subtitle="Your schedule today" padded={false}>
        {SCHEDULE.map((item, i) => (
          <View key={item.title}>
            {i > 0 ? <Divider /> : null}
            <View style={{ padding: space.md, gap: 2 }}>
              <Row gap={6}>
                <Text variant="label">{item.title}</Text>
                {item.ai ? <Badge label="AI" tone="info" /> : null}
              </Row>
              <Text variant="caption" tone="muted">
                {item.time}
              </Text>
            </View>
          </View>
        ))}
      </Section>
    </Screen>
  )
}
