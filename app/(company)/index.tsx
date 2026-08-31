import { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'

import {
  Avatar,
  Badge,
  Button,
  Divider,
  Progress,
  Row,
  Screen,
  Section,
  Stat,
  StatGrid,
  Text,
} from '../../src/components/ui'
import { useTheme } from '../../src/theme/theme'
import { space } from '../../src/theme/tokens'
import { STATUS_LABEL, useIssuesStore, SPRINTS } from '../../src/store/issues'
import { useTeamCheckIns } from '../../src/store/checkin'

export default function CompanyOverview() {
  const t = useTheme()
  const router = useRouter()
  const issues = useIssuesStore((s) => s.issues)
  const team = useTeamCheckIns()

  const sprint = SPRINTS[0]
  const sprintIssues = useMemo(
    () => issues.filter((i) => i.sprint === sprint.id && i.type !== 'epic'),
    [issues, sprint.id]
  )

  const committed = sprintIssues.reduce((sum, i) => sum + (i.points ?? 0), 0)
  const done = sprintIssues.filter((i) => i.status === 'done').reduce((s, i) => s + (i.points ?? 0), 0)
  const progress = committed ? Math.round((done / committed) * 100) : 0

  const responded = team.filter((c) => c.status === 'complete').length
  const needsAttention = team.filter(
    (c) => c.blocker || c.answers?.some((a) => a.verdict === 'unconfirmed')
  )

  const inReview = issues.filter((i) => i.status === 'review')

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Text variant="display">Team overview</Text>
        <Text variant="body" tone="muted">
          {sprint.name} · {sprint.window}
        </Text>
      </View>

      <StatGrid>
        <Stat
          label="Check-ins today"
          value={`${responded}/${team.length}`}
          tone="success"
          progress={{ value: responded, max: team.length }}
          caption={`${needsAttention.length} need you`}
        />
        <Stat
          label="Sprint progress"
          value={`${progress}%`}
          tone="brand"
          progress={{ value: done, max: Math.max(1, committed) }}
          caption={`${done} of ${committed} pts`}
        />
        <Stat label="In review" value={inReview.length} tone="warning" caption="Waiting on a reviewer" />
        <Stat label="Open issues" value={issues.filter((i) => i.status !== 'done' && i.type !== 'epic').length} tone="info" />
      </StatGrid>

      <Section
        title="Needs your attention"
        subtitle="Blockers and unverified answers"
        padded={false}
        action={<Button label="All" variant="ghost" size="sm" onPress={() => router.push('/(company)/check-ins')} />}
      >
        {needsAttention.length === 0 ? (
          <View style={{ padding: space.lg }}>
            <Text variant="body" tone="muted">
              Nothing outstanding — every answer checked out today.
            </Text>
          </View>
        ) : (
          needsAttention.map((person, i) => (
            <View key={person.personId}>
              {i > 0 ? <Divider /> : null}
              <View style={{ padding: space.lg, gap: space.xs }}>
                <Row>
                  <Text variant="label">{person.name}</Text>
                  {person.blocker ? <Badge label="Blocked" tone="danger" /> : <Badge label="Unconfirmed" tone="warning" />}
                </Row>
                <Text variant="caption" tone="muted">
                  {person.blocker ?? 'Claimed work the AI could not confirm.'}
                </Text>
              </View>
            </View>
          ))
        )}
      </Section>

      <Section title="Review queue" subtitle="Approve or send back" padded={false}>
        {inReview.length === 0 ? (
          <View style={{ padding: space.lg }}>
            <Text variant="body" tone="muted">
              Nothing waiting on review.
            </Text>
          </View>
        ) : (
          inReview.map((issue, i) => (
            <View key={issue.key}>
              {i > 0 ? <Divider /> : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/issue/${issue.key}`)}
                style={({ pressed }) => ({
                  padding: space.lg,
                  gap: space.xs,
                  backgroundColor: pressed ? t.muted : 'transparent',
                })}
              >
                <Row>
                  <Text variant="mono" tone="muted">
                    {issue.key}
                  </Text>
                  <Badge label={STATUS_LABEL[issue.status]} tone="warning" />
                  {issue.assignee ? <Avatar name={issue.assignee} size={22} /> : null}
                </Row>
                <Text variant="label">{issue.title}</Text>
              </Pressable>
            </View>
          ))
        )}
      </Section>

      <Section title="Sprint burn" subtitle={`${done} of ${committed} points`}>
        <Progress value={done} max={Math.max(1, committed)} />
        <Row gap={space.md}>
          <Text variant="caption" tone="muted">
            {sprintIssues.filter((i) => i.status === 'done').length} done
          </Text>
          <Text variant="caption" tone="muted">
            {sprintIssues.filter((i) => i.status === 'in_progress').length} in progress
          </Text>
          <Text variant="caption" tone="muted">
            {sprintIssues.filter((i) => i.status === 'todo').length} to do
          </Text>
        </Row>
      </Section>
    </Screen>
  )
}
