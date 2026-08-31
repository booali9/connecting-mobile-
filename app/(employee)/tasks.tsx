import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Avatar, Badge, Button, Card, Divider, Empty, Input, Row, Screen, Text } from '../../src/components/ui'
import { PRIORITY_ICON, STATUS_TONE, TYPE_ICON } from '../../src/components/issue-meta'
import { useTheme } from '../../src/theme/theme'
import { radius, space } from '../../src/theme/tokens'
import { STATUS_LABEL, useIssuesStore, type Issue } from '../../src/store/issues'

type Filter = 'open' | 'done' | 'all'

export default function MyTasks() {
  const t = useTheme()
  const router = useRouter()
  const issues = useIssuesStore((s) => s.issues)
  const update = useIssuesStore((s) => s.update)

  const [filter, setFilter] = useState<Filter>('open')
  const [query, setQuery] = useState('')

  const visible = useMemo(
    () =>
      issues.filter((issue) => {
        if (issue.type === 'epic') return false
        if (filter === 'open' && issue.status === 'done') return false
        if (filter === 'done' && issue.status !== 'done') return false
        if (query && !`${issue.key} ${issue.title}`.toLowerCase().includes(query.toLowerCase())) return false
        return true
      }),
    [issues, filter, query]
  )

  const counts = {
    open: issues.filter((i) => i.type !== 'epic' && i.status !== 'done').length,
    done: issues.filter((i) => i.type !== 'epic' && i.status === 'done').length,
    all: issues.filter((i) => i.type !== 'epic').length,
  }

  return (
    <Screen>
      <Input value={query} onChangeText={setQuery} placeholder="Search your tasks…" />

      <Row gap={space.sm}>
        {(['open', 'done', 'all'] as Filter[]).map((id) => {
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
                {id === 'open' ? 'Open' : id === 'done' ? 'Done' : 'All'} {counts[id]}
              </Text>
            </Pressable>
          )
        })}
      </Row>

      {visible.length === 0 ? (
        <Empty title="Nothing here" body="No tasks match that filter." />
      ) : (
        <Card padded={false}>
          {visible.map((issue, i) => (
            <View key={issue.key}>
              {i > 0 ? <Divider /> : null}
              <TaskRow
                issue={issue}
                onOpen={() => router.push(`/issue/${issue.key}`)}
                onToggle={() =>
                  update(
                    issue.key,
                    { status: issue.status === 'done' ? 'in_progress' : 'done' },
                    issue.status === 'done' ? 'reopened this' : 'marked this done'
                  )
                }
              />
            </View>
          ))}
        </Card>
      )}
    </Screen>
  )
}

function TaskRow({
  issue,
  onOpen,
  onToggle,
}: {
  issue: Issue
  onOpen: () => void
  onToggle: () => void
}) {
  const t = useTheme()
  const done = issue.status === 'done'
  const typeIcon = TYPE_ICON[issue.type]
  const priorityIcon = PRIORITY_ICON[issue.priority]

  return (
    <Row style={{ padding: space.md, alignItems: 'flex-start' }} gap={space.md}>
      {/* Marking something done is the single most common action here, so it is
          a tap target on the row rather than a trip into the detail screen. */}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={`Mark ${issue.title} as ${done ? 'not done' : 'done'}`}
        onPress={onToggle}
        hitSlop={8}
        style={{
          width: 22,
          height: 22,
          borderRadius: radius.sm,
          borderWidth: 1.5,
          borderColor: done ? t.success : t.borderStrong,
          backgroundColor: done ? t.success : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}
      >
        {done ? <Ionicons name="checkmark" size={14} color={t.successOn} /> : null}
      </Pressable>

      <Pressable accessibilityRole="button" onPress={onOpen} style={{ flex: 1, gap: 4 }}>
        <Text
          variant="body"
          tone={done ? 'muted' : 'default'}
          style={done ? { textDecorationLine: 'line-through' } : undefined}
        >
          {issue.title}
        </Text>
        <Row gap={6}>
          <Ionicons name={typeIcon.name} size={12} color={t[typeIcon.tone] as string} />
          <Text variant="mono" tone="muted">
            {issue.key}
          </Text>
          <Ionicons name={priorityIcon.name} size={12} color={t[priorityIcon.tone] as string} />
          <Badge label={STATUS_LABEL[issue.status]} tone={STATUS_TONE[issue.status]} />
          <View style={{ flex: 1 }} />
          {issue.assignee ? <Avatar name={issue.assignee} size={20} /> : null}
        </Row>
      </Pressable>
    </Row>
  )
}
