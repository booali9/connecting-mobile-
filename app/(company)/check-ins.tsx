import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Avatar, Badge, Card, Divider, Empty, Row, Screen, Stat, StatGrid, Text } from '../../src/components/ui'
import { useTheme } from '../../src/theme/theme'
import { radius, space } from '../../src/theme/tokens'
import { QUESTIONS, useTeamCheckIns, type CheckIn, type Verdict } from '../../src/store/checkin'

const VERDICT: Record<Verdict, { icon: 'checkmark-circle' | 'help-circle' | 'warning'; tone: 'success' | 'warning' | 'danger'; label: string }> = {
  verified: { icon: 'checkmark-circle', tone: 'success', label: 'Verified' },
  unconfirmed: { icon: 'help-circle', tone: 'warning', label: 'Unconfirmed' },
  blocked: { icon: 'warning', tone: 'danger', label: 'Blocked' },
}

type Filter = 'all' | 'attention' | 'waiting'

export default function CheckIns() {
  const t = useTheme()
  const team = useTeamCheckIns()
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const responded = team.filter((c) => c.status === 'complete').length
  const needsAttention = useMemo(
    () => team.filter((c) => c.blocker || c.answers?.some((a) => a.verdict === 'unconfirmed')),
    [team]
  )
  const waiting = team.filter((c) => c.status !== 'complete')

  const list = filter === 'attention' ? needsAttention : filter === 'waiting' ? waiting : team

  return (
    <Screen>
      <StatGrid>
        <Stat
          label="Responded"
          value={`${responded}/${team.length}`}
          tone="success"
          progress={{ value: responded, max: team.length }}
        />
        <Stat
          label="Needs you"
          value={needsAttention.length}
          tone="warning"
          caption={`${team.filter((c) => c.blocker).length} blocked`}
        />
      </StatGrid>

      <Row gap={space.sm}>
        {(
          [
            ['all', `All ${team.length}`],
            ['attention', `Needs you ${needsAttention.length}`],
            ['waiting', `Waiting ${waiting.length}`],
          ] as Array<[Filter, string]>
        ).map(([id, label]) => {
          const active = filter === id
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(id)}
              style={{
                paddingHorizontal: space.md,
                paddingVertical: space.sm,
                borderRadius: radius.pill,
                backgroundColor: active ? t.brandSubtle : t.muted,
                borderWidth: 1,
                borderColor: active ? t.brand : 'transparent',
              }}
            >
              <Text variant="caption" tone={active ? 'brand' : 'muted'}>
                {label}
              </Text>
            </Pressable>
          )
        })}
      </Row>

      {list.length === 0 ? (
        <Empty title="Nothing here" body="Every answer checked out today." />
      ) : (
        <Card padded={false}>
          {list.map((person, i) => (
            <View key={person.personId}>
              {i > 0 ? <Divider /> : null}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: expanded === person.personId }}
                onPress={() => setExpanded(expanded === person.personId ? null : person.personId)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.sm,
                  padding: space.md,
                  backgroundColor: pressed ? t.muted : 'transparent',
                })}
              >
                <Avatar name={person.name} size={30} />
                <View style={{ flex: 1 }}>
                  <Text variant="label">{person.name}</Text>
                  <Text variant="caption" tone="muted">
                    {person.department}
                    {person.completedAt ? ` · ${person.completedAt}` : ''}
                  </Text>
                </View>
                {person.blocker ? (
                  <Badge label="Blocked" tone="danger" />
                ) : person.status === 'complete' ? (
                  <Badge label="Done" tone="success" />
                ) : person.status === 'in_progress' ? (
                  <Badge label="Answering" tone="brand" />
                ) : (
                  <Badge label="Waiting" tone="outline" />
                )}
              </Pressable>

              {expanded === person.personId ? <Answers person={person} /> : null}
            </View>
          ))}
        </Card>
      )}
    </Screen>
  )
}

function Answers({ person }: { person: CheckIn }) {
  const t = useTheme()

  if (!person.answers) {
    return (
      <View style={{ padding: space.md, backgroundColor: t.surface }}>
        <Text variant="caption" tone="muted">
          {person.status === 'in_progress'
            ? 'Answering now — this fills in as they go.'
            : 'Has not started. A reminder goes out at 11:00.'}
        </Text>
      </View>
    )
  }

  return (
    <View style={{ padding: space.md, backgroundColor: t.surface, gap: space.md }}>
      {person.answers.map((answer) => {
        const question = QUESTIONS.find((q) => q.id === answer.questionId)
        const meta = VERDICT[answer.verdict]
        return (
          <View key={answer.questionId} style={{ gap: 2 }}>
            <Text variant="caption" tone="muted">
              {question?.prompt}
            </Text>
            <Text variant="body">{answer.text || 'Nothing raised'}</Text>
            <Row gap={4}>
              <Ionicons name={meta.icon} size={13} color={t[meta.tone === 'danger' ? 'danger' : meta.tone]} />
              <Text variant="caption" tone={meta.tone}>
                {meta.label}
              </Text>
              <Text variant="caption" tone="muted" numberOfLines={1} style={{ flex: 1 }}>
                — {answer.evidence}
              </Text>
            </Row>
          </View>
        )
      })}
      {person.escalatedTo ? (
        <Text variant="caption" tone="muted">
          Blocker routed to {person.escalatedTo}
        </Text>
      ) : null}
    </View>
  )
}
