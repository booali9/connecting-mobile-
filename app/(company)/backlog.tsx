import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Empty,
  Input,
  Progress,
  Row,
  Screen,
  Section,
  Text,
} from '../../src/components/ui'
import { PRIORITY_ICON, TYPE_ICON } from '../../src/components/issue-meta'
import { useTheme } from '../../src/theme/theme'
import { space } from '../../src/theme/tokens'
import { SPRINTS, selectEpics, useIssuesStore, type Issue } from '../../src/store/issues'

const CAPACITY = 50

export default function Backlog() {
  const t = useTheme()
  const router = useRouter()
  const issues = useIssuesStore((s) => s.issues)
  const assignToSprint = useIssuesStore((s) => s.assignToSprint)

  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const sprint = SPRINTS[0]
  const epics = useMemo(() => selectEpics(issues), [issues])

  const matches = (issue: Issue) =>
    issue.type !== 'epic' &&
    (!query || `${issue.key} ${issue.title}`.toLowerCase().includes(query.toLowerCase()))

  const inSprint = issues.filter((i) => i.sprint === sprint.id && matches(i))
  const backlog = issues.filter((i) => i.sprint === null && matches(i))

  const committed = inSprint.reduce((sum, i) => sum + (i.points ?? 0), 0)
  const over = committed > CAPACITY

  const grouped = useMemo(() => {
    const groups = new Map<string, Issue[]>()
    for (const issue of backlog) {
      const epicKey = issue.epic ?? 'none'
      groups.set(epicKey, [...(groups.get(epicKey) ?? []), issue])
    }
    return groups
  }, [backlog])

  return (
    <Screen>
      <Input value={query} onChangeText={setQuery} placeholder="Search the backlog…" />

      <Section
        title={sprint.name}
        subtitle={`${inSprint.length} issues · ${committed} of ${CAPACITY} pts`}
        padded={false}
      >
        <View style={{ padding: space.md, gap: space.sm }}>
          <Progress value={committed} max={CAPACITY} tone={over ? 'warning' : 'brand'} />
          <Text variant="caption" tone={over ? 'warning' : 'muted'}>
            {over ? `Over capacity by ${committed - CAPACITY} pts` : `${CAPACITY - committed} pts of headroom`}
          </Text>
        </View>
        <Divider />
        {inSprint.length === 0 ? (
          <View style={{ padding: space.md }}>
            <Empty title="Nothing committed" body="Pull issues up from the backlog." />
          </View>
        ) : (
          inSprint.map((issue, i) => (
            <View key={issue.key}>
              {i > 0 ? <Divider /> : null}
              <IssueRow
                issue={issue}
                onOpen={() => router.push(`/issue/${issue.key}`)}
                actionLabel="Remove"
                onAction={() => assignToSprint(issue.key, null)}
              />
            </View>
          ))
        )}
      </Section>

      <Section title="Backlog" subtitle={`${backlog.length} issues, grouped by epic`} padded={false}>
        {backlog.length === 0 ? (
          <View style={{ padding: space.md }}>
            <Empty title="Backlog is empty" body="Everything is in a sprint." />
          </View>
        ) : (
          [...grouped.entries()].map(([epicKey, list]) => {
            const epic = epics.find((e) => e.key === epicKey)
            const isCollapsed = collapsed.has(epicKey)
            const points = list.reduce((sum, i) => sum + (i.points ?? 0), 0)

            return (
              <View key={epicKey}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: !isCollapsed }}
                  onPress={() =>
                    setCollapsed((current) => {
                      const next = new Set(current)
                      if (next.has(epicKey)) next.delete(epicKey)
                      else next.add(epicKey)
                      return next
                    })
                  }
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.sm,
                    padding: space.md,
                    backgroundColor: t.surface,
                  }}
                >
                  <Ionicons
                    name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
                    size={14}
                    color={t.mutedText}
                  />
                  <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>
                    {epic?.title ?? 'No epic'}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {list.length} · {points} pts
                  </Text>
                </Pressable>

                {!isCollapsed
                  ? list.map((issue) => (
                      <View key={issue.key}>
                        <Divider />
                        <IssueRow
                          issue={issue}
                          onOpen={() => router.push(`/issue/${issue.key}`)}
                          actionLabel="Add"
                          onAction={() => assignToSprint(issue.key, sprint.id)}
                        />
                      </View>
                    ))
                  : null}
              </View>
            )
          })
        )}
      </Section>

      <Button
        label="New issue"
        variant="outline"
        icon={<Ionicons name="add" size={16} color={t.text} />}
        onPress={() => router.push('/new-issue')}
      />
    </Screen>
  )
}

function IssueRow({
  issue,
  onOpen,
  actionLabel,
  onAction,
}: {
  issue: Issue
  onOpen: () => void
  actionLabel: string
  onAction: () => void
}) {
  const t = useTheme()
  const typeIcon = TYPE_ICON[issue.type]
  const priorityIcon = PRIORITY_ICON[issue.priority]

  return (
    <View style={{ padding: space.md, gap: space.sm }}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={{ gap: 4 }}>
        <Row gap={6}>
          <Ionicons name={typeIcon.name} size={13} color={t[typeIcon.tone] as string} />
          <Text variant="mono" tone="muted">
            {issue.key}
          </Text>
          <Ionicons name={priorityIcon.name} size={13} color={t[priorityIcon.tone] as string} />
          <View style={{ flex: 1 }} />
          {issue.points != null ? <Badge label={`${issue.points}`} tone="outline" /> : null}
          {issue.assignee ? <Avatar name={issue.assignee} size={20} /> : null}
        </Row>
        <Text variant="body">{issue.title}</Text>
      </Pressable>
      <Button label={actionLabel} variant="outline" size="sm" onPress={onAction} style={{ alignSelf: 'flex-start' }} />
    </View>
  )
}
