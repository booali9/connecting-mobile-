import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Avatar, Button, Card, Input, Row, Text } from '../src/components/ui'
import { PRIORITY_ICON, TYPE_ICON } from '../src/components/issue-meta'
import { useTheme } from '../src/theme/theme'
import { radius, space } from '../src/theme/tokens'
import {
  ISSUE_TYPES,
  PEOPLE,
  PRIORITIES,
  SPRINTS,
  useIssuesStore,
  type IssueType,
  type Priority,
} from '../src/store/issues'

const POINTS = [1, 2, 3, 5, 8, 13]

/** Creating and handing out work — "give new task" — as a single screen. */
export default function NewIssue() {
  const t = useTheme()
  const router = useRouter()
  const create = useIssuesStore((s) => s.create)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<IssueType>('task')
  const [priority, setPriority] = useState<Priority>('medium')
  const [assignee, setAssignee] = useState<string | null>(null)
  const [points, setPoints] = useState<number | null>(null)
  const [toSprint, setToSprint] = useState(true)

  function submit() {
    if (!title.trim()) return
    const key = create({
      type,
      title: title.trim(),
      description: description.trim(),
      priority,
      assignee,
      points,
      status: 'todo',
      sprint: toSprint ? SPRINTS[0].id : null,
    })
    router.replace(`/issue/${key}`)
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xxl * 2 }}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={{ gap: space.lg }}>
        <Input label="Summary" value={title} onChangeText={setTitle} placeholder="What needs doing?" autoFocus />
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Any detail worth capturing…"
          multiline
        />
      </Card>

      <Card style={{ gap: space.md }}>
        <Text variant="label">Type</Text>
        <Row gap={space.sm}>
          {ISSUE_TYPES.filter((x) => x !== 'epic').map((option) => {
            const meta = TYPE_ICON[option]
            const active = type === option
            return (
              <Chip key={option} active={active} onPress={() => setType(option)}>
                <Ionicons name={meta.name} size={13} color={t[meta.tone] as string} />
                <Text variant="caption" tone={active ? 'brand' : 'muted'}>
                  {meta.label}
                </Text>
              </Chip>
            )
          })}
        </Row>

        <Text variant="label">Priority</Text>
        <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
          {PRIORITIES.map((option) => {
            const meta = PRIORITY_ICON[option]
            const active = priority === option
            return (
              <Chip key={option} active={active} onPress={() => setPriority(option)}>
                <Ionicons name={meta.name} size={13} color={t[meta.tone] as string} />
                <Text variant="caption" tone={active ? 'brand' : 'muted'}>
                  {meta.label}
                </Text>
              </Chip>
            )
          })}
        </Row>

        <Text variant="label">Story points</Text>
        <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
          {POINTS.map((option) => (
            <Chip key={option} active={points === option} onPress={() => setPoints(points === option ? null : option)}>
              <Text variant="caption" tone={points === option ? 'brand' : 'muted'}>
                {option}
              </Text>
            </Chip>
          ))}
        </Row>
      </Card>

      <Card style={{ gap: space.md }}>
        <Text variant="label">Assign to</Text>
        <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
          <Chip active={assignee === null} onPress={() => setAssignee(null)}>
            <Text variant="caption" tone={assignee === null ? 'brand' : 'muted'}>
              Unassigned
            </Text>
          </Chip>
          {PEOPLE.map((person) => (
            <Chip key={person} active={assignee === person} onPress={() => setAssignee(person)}>
              <Avatar name={person} size={18} />
              <Text variant="caption" tone={assignee === person ? 'brand' : 'muted'}>
                {person.split(' ')[0]}
              </Text>
            </Chip>
          ))}
        </Row>
      </Card>

      <Card style={{ gap: space.md }}>
        <Row>
          <View style={{ flex: 1 }}>
            <Text variant="label">Add to {SPRINTS[0].name}</Text>
            <Text variant="caption" tone="muted">
              Otherwise it lands in the backlog.
            </Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: toSprint }}
            accessibilityLabel={`Add to ${SPRINTS[0].name}`}
            onPress={() => setToSprint((v) => !v)}
            style={{
              width: 46,
              height: 26,
              borderRadius: radius.pill,
              backgroundColor: toSprint ? t.primary : t.muted,
              padding: 3,
              justifyContent: 'center',
              alignItems: toSprint ? 'flex-end' : 'flex-start',
            }}
          >
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' }} />
          </Pressable>
        </Row>
      </Card>

      <Row gap={space.sm}>
        <Button label="Cancel" variant="outline" onPress={() => router.back()} style={{ flex: 1 }} />
        <Button label="Create issue" onPress={submit} disabled={!title.trim()} style={{ flex: 2 }} />
      </Row>
    </ScrollView>
  )
}

function Chip({
  active,
  onPress,
  children,
}: {
  active: boolean
  onPress: () => void
  children: React.ReactNode
}) {
  const t = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        borderRadius: radius.pill,
        backgroundColor: active ? t.brandSubtle : t.muted,
        borderWidth: 1,
        borderColor: active ? t.brand : 'transparent',
      }}
    >
      {children}
    </Pressable>
  )
}
