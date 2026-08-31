import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Empty,
  Input,
  Row,
  Text,
} from '../../src/components/ui'
import { PRIORITY_ICON, STATUS_TONE, TYPE_ICON } from '../../src/components/issue-meta'
import { useTheme } from '../../src/theme/theme'
import { radius, space } from '../../src/theme/tokens'
import {
  PEOPLE,
  STATUSES,
  STATUS_LABEL,
  useIssuesStore,
  type Status,
} from '../../src/store/issues'

/**
 * Issue detail. This screen is where the three things asked of a tracker on a
 * phone actually happen: review it, mark it done, hand it to someone else.
 */
export default function IssueScreen() {
  const t = useTheme()
  const router = useRouter()
  const { key } = useLocalSearchParams<{ key: string }>()

  const issues = useIssuesStore((s) => s.issues)
  const update = useIssuesStore((s) => s.update)
  const comment = useIssuesStore((s) => s.comment)

  const [tab, setTab] = useState<'comments' | 'activity'>('comments')
  const [draft, setDraft] = useState('')
  const [assigning, setAssigning] = useState(false)

  const issue = issues.find((i) => i.key === key)
  if (!issue) {
    return (
      <View style={{ flex: 1, backgroundColor: t.background, padding: space.lg }}>
        <Empty title="Issue not found" body={`No issue with the key ${key}.`} />
      </View>
    )
  }

  const typeIcon = TYPE_ICON[issue.type]
  const priorityIcon = PRIORITY_ICON[issue.priority]
  const isDone = issue.status === 'done'

  function setStatus(next: Status) {
    if (!issue) return
    update(issue.key, { status: next }, `moved this from ${STATUS_LABEL[issue.status]} to ${STATUS_LABEL[next]}`)
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xxl * 2 }}
    >
      <View style={{ gap: space.sm }}>
        <Row>
          <Ionicons name={typeIcon.name} size={16} color={t[typeIcon.tone] as string} />
          <Text variant="mono" tone="muted">
            {issue.key}
          </Text>
          <Badge label={STATUS_LABEL[issue.status]} tone={STATUS_TONE[issue.status]} />
          <View style={{ flex: 1 }} />
          <Ionicons name={priorityIcon.name} size={16} color={t[priorityIcon.tone] as string} />
        </Row>
        <Text variant="title">{issue.title}</Text>
      </View>

      {/* The two actions that matter most on a phone, up top and full width. */}
      <Row gap={space.sm}>
        <Button
          label={isDone ? 'Reopen' : 'Mark as done'}
          variant={isDone ? 'outline' : 'primary'}
          onPress={() => setStatus(isDone ? 'in_progress' : 'done')}
          icon={
            <Ionicons
              name={isDone ? 'refresh' : 'checkmark-circle'}
              size={16}
              color={isDone ? t.text : t.primaryOn}
            />
          }
          style={{ flex: 1 }}
        />
        <Button
          label="Assign"
          variant="outline"
          onPress={() => setAssigning((v) => !v)}
          icon={<Ionicons name="person-add-outline" size={16} color={t.text} />}
          style={{ flex: 1 }}
        />
      </Row>

      {assigning ? (
        <Card padded={false}>
          {PEOPLE.map((person, i) => (
            <View key={person}>
              {i > 0 ? <Divider /> : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  update(issue.key, { assignee: person }, `assigned this to ${person}`)
                  setAssigning(false)
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.sm,
                  padding: space.md,
                  backgroundColor: pressed ? t.muted : 'transparent',
                })}
              >
                <Avatar name={person} size={26} />
                <Text variant="body">{person}</Text>
                <View style={{ flex: 1 }} />
                {issue.assignee === person ? (
                  <Ionicons name="checkmark" size={16} color={t.success} />
                ) : null}
              </Pressable>
            </View>
          ))}
        </Card>
      ) : null}

      {/* Status is a row of chips rather than a picker: on a phone the whole
          workflow fits on one line and skipping a step is legitimate. */}
      <Card style={{ gap: space.sm }}>
        <Text variant="caption" tone="muted">
          Status
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {STATUSES.map((s) => {
            const active = s.id === issue.status
            return (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setStatus(s.id)}
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
                  {s.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </Card>

      <Card style={{ gap: space.md }}>
        <Field label="Assignee">
          {issue.assignee ? (
            <Row>
              <Avatar name={issue.assignee} size={24} />
              <Text variant="body">{issue.assignee}</Text>
            </Row>
          ) : (
            <Text variant="body" tone="muted">
              Unassigned
            </Text>
          )}
        </Field>
        <Divider />
        <Field label="Priority">
          <Row>
            <Ionicons name={priorityIcon.name} size={14} color={t[priorityIcon.tone] as string} />
            <Text variant="body">{priorityIcon.label}</Text>
          </Row>
        </Field>
        <Divider />
        <Field label="Story points">
          <Text variant="body">{issue.points ?? 'Not estimated'}</Text>
        </Field>
        <Divider />
        <Field label="Sprint">
          <Text variant="body">{issue.sprint ?? 'Backlog'}</Text>
        </Field>
      </Card>

      {issue.description ? (
        <Card style={{ gap: space.sm }}>
          <Text variant="caption" tone="muted">
            Description
          </Text>
          <Text variant="body">{issue.description}</Text>
        </Card>
      ) : null}

      {issue.links.length > 0 ? (
        <Card style={{ gap: space.sm }}>
          <Text variant="caption" tone="muted">
            Linked issues
          </Text>
          {issue.links.map((link) => {
            const target = issues.find((i) => i.key === link.key)
            return (
              <Pressable
                key={link.key}
                onPress={() => router.push(`/issue/${link.key}`)}
                accessibilityRole="button"
              >
                <Row>
                  <Text variant="caption" tone="muted">
                    {link.type.replace(/_/g, ' ')}
                  </Text>
                  <Text variant="mono" tone="brand">
                    {link.key}
                  </Text>
                  <Text variant="caption" numberOfLines={1} style={{ flex: 1 }}>
                    {target?.title ?? ''}
                  </Text>
                </Row>
              </Pressable>
            )
          })}
        </Card>
      ) : null}

      <Card padded={false}>
        <Row style={{ padding: space.md, gap: space.sm }}>
          {(['comments', 'activity'] as const).map((id) => (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === id }}
              onPress={() => setTab(id)}
              style={{
                paddingHorizontal: space.md,
                paddingVertical: 6,
                borderRadius: radius.pill,
                backgroundColor: tab === id ? t.brandSubtle : 'transparent',
              }}
            >
              <Text variant="label" tone={tab === id ? 'brand' : 'muted'}>
                {id === 'comments' ? `Comments ${issue.comments.length}` : `Activity ${issue.activity.length}`}
              </Text>
            </Pressable>
          ))}
        </Row>
        <Divider />

        <View style={{ padding: space.md, gap: space.md }}>
          {tab === 'comments' ? (
            <>
              {issue.comments.map((c) => (
                <Row key={c.id} style={{ alignItems: 'flex-start' }}>
                  <Avatar name={c.author} size={26} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="caption" tone="muted">
                      {c.author} · {c.at}
                    </Text>
                    <Text variant="body">{c.body}</Text>
                  </View>
                </Row>
              ))}

              <Input value={draft} onChangeText={setDraft} placeholder="Leave a comment…" multiline />
              <Button
                label="Comment"
                size="sm"
                disabled={!draft.trim()}
                onPress={() => {
                  comment(issue.key, draft.trim())
                  setDraft('')
                }}
                style={{ alignSelf: 'flex-start' }}
              />
            </>
          ) : (
            issue.activity.map((entry) => (
              <Row key={entry.id} style={{ alignItems: 'flex-start' }}>
                <Ionicons name="time-outline" size={14} color={t.mutedText} style={{ marginTop: 2 }} />
                <Text variant="caption" style={{ flex: 1 }}>
                  <Text variant="caption" style={{ fontWeight: '600' }}>
                    {entry.actor}
                  </Text>{' '}
                  <Text variant="caption" tone="muted">
                    {entry.summary} · {entry.at}
                  </Text>
                </Text>
              </Row>
            ))
          )}
        </View>
      </Card>
    </ScrollView>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      {children}
    </View>
  )
}
