import { useMemo, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Avatar, Badge, Button, Card, Empty, Row, Text } from '../../src/components/ui'
import { useTheme } from '../../src/theme/theme'
import { radius, space } from '../../src/theme/tokens'
import {
  SPRINTS,
  STATUSES,
  selectBoard,
  useIssuesStore,
  type Issue,
  type Status,
} from '../../src/store/issues'
import { TYPE_ICON, PRIORITY_ICON } from '../../src/components/issue-meta'

/**
 * The board, adapted for a phone: one status at a time rather than five columns
 * side by side. Horizontal card columns on a 390px screen means everything is
 * either too narrow to read or needs two-axis scrolling, which is miserable.
 *
 * Moving an issue is a tap on the next/previous status rather than a drag —
 * dragging across a paged view has nothing to drag *to*.
 */
export default function Board() {
  const t = useTheme()
  const router = useRouter()
  const issues = useIssuesStore((s) => s.issues)
  const move = useIssuesStore((s) => s.move)

  const [status, setStatus] = useState<Status>('todo')
  const sprint = SPRINTS[0]

  const board = useMemo(() => selectBoard(issues, sprint.id), [issues, sprint.id])
  const current = board[status]
  const statusIndex = STATUSES.findIndex((s) => s.id === status)
  const meta = STATUSES[statusIndex]
  const overLimit = meta.wipLimit != null && current.length > meta.wipLimit

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      {/* Status pager doubles as the column picker and the count readout. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ padding: space.md, gap: space.sm }}
        style={{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: t.border }}
      >
        {STATUSES.map((s) => {
          const active = s.id === status
          const count = board[s.id].length
          return (
            <Pressable
              key={s.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setStatus(s.id)}
              style={{
                paddingHorizontal: space.md,
                paddingVertical: space.sm,
                borderRadius: radius.pill,
                backgroundColor: active ? t.brandSubtle : t.muted,
                borderWidth: 1,
                borderColor: active ? t.brand : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Text variant="label" tone={active ? 'brand' : 'muted'}>
                {s.label}
              </Text>
              <Text variant="caption" tone="muted">
                {count}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl * 2 }}>
        {overLimit ? (
          <Card style={{ padding: space.md, backgroundColor: t.warningSubtle, borderColor: t.warning }}>
            <Row>
              <Ionicons name="warning-outline" size={16} color={t.warning} />
              <Text variant="caption" tone="warning">
                {current.length} issues here, over the WIP limit of {meta.wipLimit}.
              </Text>
            </Row>
          </Card>
        ) : null}

        {current.length === 0 ? (
          <Empty title="Nothing here" body={`No issues in ${meta.label} for ${sprint.name}.`} />
        ) : (
          current.map((issue) => (
            <IssueCard
              key={issue.key}
              issue={issue}
              statusIndex={statusIndex}
              onOpen={() => router.push(`/issue/${issue.key}`)}
              onMove={(direction) => {
                const next = STATUSES[statusIndex + direction]
                if (next) move(issue.key, next.id, board[next.id].length)
              }}
            />
          ))
        )}

        <Button
          label="New issue"
          variant="outline"
          icon={<Ionicons name="add" size={16} color={t.text} />}
          onPress={() => router.push('/new-issue')}
        />
      </ScrollView>
    </View>
  )
}

function IssueCard({
  issue,
  statusIndex,
  onOpen,
  onMove,
}: {
  issue: Issue
  statusIndex: number
  onOpen: () => void
  onMove: (direction: -1 | 1) => void
}) {
  const t = useTheme()
  const typeIcon = TYPE_ICON[issue.type]
  const priorityIcon = PRIORITY_ICON[issue.priority]

  return (
    <Card style={{ gap: space.md, padding: space.md }}>
      <Pressable onPress={onOpen} accessibilityRole="button" style={{ gap: space.sm }}>
        <Row>
          <Ionicons name={typeIcon.name} size={14} color={t[typeIcon.tone]} />
          <Text variant="mono" tone="muted">
            {issue.key}
          </Text>
          <View style={{ flex: 1 }} />
          <Ionicons name={priorityIcon.name} size={14} color={t[priorityIcon.tone]} />
        </Row>

        <Text variant="label">{issue.title}</Text>

        <Row>
          {issue.assignee ? (
            <>
              <Avatar name={issue.assignee} size={22} />
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {issue.assignee}
              </Text>
            </>
          ) : (
            <Text variant="caption" tone="muted">
              Unassigned
            </Text>
          )}
          <View style={{ flex: 1 }} />
          {issue.points != null ? <Badge label={`${issue.points} pts`} tone="outline" /> : null}
        </Row>
      </Pressable>

      {/* Moving a card is the most common board action, so it is one tap from
          the card rather than buried in the detail screen. */}
      <Row gap={space.sm}>
        <Button
          label="Back"
          variant="outline"
          size="sm"
          disabled={statusIndex === 0}
          onPress={() => onMove(-1)}
          icon={<Ionicons name="arrow-back" size={14} color={t.text} />}
          style={{ flex: 1 }}
        />
        <Button
          label={statusIndex >= STATUSES.length - 2 ? 'Mark done' : 'Advance'}
          size="sm"
          disabled={statusIndex === STATUSES.length - 1}
          onPress={() => onMove(1)}
          icon={
            <Ionicons
              name={statusIndex >= STATUSES.length - 2 ? 'checkmark' : 'arrow-forward'}
              size={14}
              color={t.primaryOn}
            />
          }
          style={{ flex: 1 }}
        />
      </Row>
    </Card>
  )
}
