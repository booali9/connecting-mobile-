import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import {
  Badge,
  Button,
  Card,
  Divider,
  Empty,
  Input,
  Row,
  Screen,
  Section,
  Text,
} from '../../src/components/ui'
import { useTheme } from '../../src/theme/theme'
import { space } from '../../src/theme/tokens'
import * as api from '../../src/lib/api'

/**
 * Meetings, and the loop the product is named for.
 *
 * The web app got this first: read a transcript with a model, then turn the
 * action items it found into tasks with real keys and real owners. This is
 * the same three calls on a phone.
 *
 * There was no meetings screen on the manager side at all -- the only one
 * in the app was the employee schedule, whose days and attendees are a
 * hardcoded array -- so this reads the server rather than inheriting that.
 */

type Phase = 'idle' | 'reading' | 'needs-transcript' | 'done'

function when(iso?: string | null): string {
  if (!iso) return 'no date set'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'no date set'
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function MeetingCard({
  meeting,
  onChanged,
}: {
  meeting: api.ServerMeeting
  onChanged: () => void
}) {
  const t = useTheme()
  const [phase, setPhase] = useState<Phase>(
    meeting.aiSummary ? 'done' : 'idle'
  )
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<string | null>(null)
  const [summary, setSummary] = useState(meeting.aiSummary ?? '')
  const [decisions, setDecisions] = useState<string[]>(meeting.aiDecisions ?? [])
  const [items, setItems] = useState(meeting.actionItems ?? [])
  const [tasks, setTasks] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  async function analyse() {
    setPhase('reading')
    setError(null)
    try {
      const answer = await api.analyzeMeeting(meeting.id)
      setSummary(answer.meeting.aiSummary ?? '')
      setDecisions(answer.meeting.aiDecisions ?? [])
      setItems(answer.meeting.actionItems ?? [])
      setUsage(
        `${answer.usage.model} · ${(answer.usage.responseTimeMs / 1000).toFixed(1)}s`
      )
      setPhase('done')
      onChanged()
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Could not read the transcript'
      // A meeting with no transcript is the normal first state, not a
      // failure, and telling somebody on a phone to call PUT is no help.
      if (/no transcript/i.test(message)) {
        setPhase('needs-transcript')
        return
      }
      setError(message)
      setPhase('idle')
    }
  }

  async function saveAndAnalyse() {
    if (!transcript.trim()) {
      setError('Paste the transcript first.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api.uploadTranscript(meeting.id, transcript.trim())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save it')
      setBusy(false)
      return
    }
    setBusy(false)
    await analyse()
  }

  async function makeTasks() {
    setBusy(true)
    try {
      const updated = await api.createTasksFromMeeting(meeting.id)
      const made = (updated.tasksCreated as unknown[]) ?? []
      setTasks(made.length)
      onChanged()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the tasks')
    } finally {
      setBusy(false)
    }
  }

  const assigned = items.filter((item) => item.assignedToId).length

  return (
    <Card style={{ gap: space.sm }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingRight: space.sm }}>
          <Text variant="label">{meeting.title}</Text>
          <Text variant="caption" tone="muted">
            {when(meeting.scheduledDate)} · {meeting.duration ?? 30} min
          </Text>
        </View>
        {meeting.aiNotesRequested ? <Badge tone="brand" label="AI" /> : null}
      </Row>

      {phase === 'idle' || phase === 'reading' ? (
        <Button
          label={phase === 'reading' ? 'Reading the transcript…' : 'Read transcript with AI'}
          size="sm"
          disabled={phase === 'reading'}
          onPress={analyse}
        />
      ) : null}

      {phase === 'needs-transcript' ? (
        <View style={{ gap: space.sm }}>
          <Text variant="caption" tone="muted">
            No transcript yet. Paste one and it will be saved and read.
            Speech-to-text is not connected.
          </Text>
          <Input
            value={transcript}
            onChangeText={setTranscript}
            multiline
            placeholder={'Jordan Lee: Right, invitation flow…'}
          />
          <Button
            label={busy ? 'Saving…' : 'Save transcript and read it'}
            size="sm"
            disabled={busy}
            onPress={saveAndAnalyse}
          />
        </View>
      ) : null}

      {error ? (
        <Text variant="caption" style={{ color: t.danger }}>
          {error}
        </Text>
      ) : null}

      {phase === 'done' ? (
        <View style={{ gap: space.sm }}>
          {usage ? (
            <Text variant="caption" tone="muted">
              {usage}
            </Text>
          ) : null}
          {summary ? <Text>{summary}</Text> : null}

          {decisions.length > 0 ? (
            <View style={{ gap: 2 }}>
              <Text variant="caption" tone="muted">
                DECISIONS
              </Text>
              {decisions.map((entry) => (
                <Text key={entry} variant="caption">
                  · {entry}
                </Text>
              ))}
            </View>
          ) : null}

          {items.length > 0 ? (
            <>
              <Divider />
              <Text variant="caption" tone="muted">
                {items.length} ACTION ITEMS, {assigned} ASSIGNED
              </Text>
              {items.map((item) => (
                <Row key={item.id} style={{ gap: space.xs }}>
                  <Badge label={item.priority} />
                  <Text variant="caption" style={{ flex: 1 }}>
                    {item.description}
                  </Text>
                </Row>
              ))}
              {tasks === null ? (
                <Button
                  label={busy ? 'Creating…' : 'Turn these into tasks'}
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onPress={makeTasks}
                />
              ) : (
                <Text variant="caption">{tasks} tasks created and assigned.</Text>
              )}
            </>
          ) : null}
        </View>
      ) : null}
    </Card>
  )
}

export default function Meetings() {
  const [meetings, setMeetings] = useState<api.ServerMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!api.isConfigured) {
      setLoading(false)
      setError('No backend configured. Set EXPO_PUBLIC_API_URL.')
      return
    }
    try {
      setMeetings(await api.allMeetings())
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load meetings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Screen>
      <Section
        title="Meetings"
        subtitle="Read a transcript, and the work comes out assigned."
      >
        {loading ? (
          <Text variant="caption" tone="muted">
            Loading…
          </Text>
        ) : null}

        {error ? <Empty title="Nothing to show" body={error} /> : null}

        {!loading && !error && meetings.length === 0 ? (
          <Empty
            title="No meetings yet"
            body="Schedule one from the web app and it will appear here."
          />
        ) : null}

        <View style={{ gap: space.md }}>
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} onChanged={load} />
          ))}
        </View>
      </Section>

      <Row style={{ gap: space.xs }}>
        <Ionicons name="information-circle-outline" size={14} />
        <Text variant="caption" tone="muted" style={{ flex: 1 }}>
          Analysis runs on the server with the same model the benchmarks
          measured. Video calls and speech-to-text are not wired up.
        </Text>
      </Row>
    </Screen>
  )
}
