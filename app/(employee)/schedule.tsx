import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import {
  Avatar,
  Badge,
  Button,
  Divider,
  Empty,
  Row,
  Screen,
  Section,
  Stat,
  StatGrid,
  Text,
} from '../../src/components/ui'
import { useTheme } from '../../src/theme/theme'
import { space } from '../../src/theme/tokens'
import * as api from '../../src/lib/api'

/**
 * Your meetings, from the server.
 *
 * This screen used to be a constant: three days, four meetings, attendees
 * and times all typed in. It looked like a working schedule and was the
 * same schedule for everybody, on every day, for ever.
 *
 * The backend already scopes this correctly -- a developer is only sent the
 * meetings they are a participant in -- so there is nothing to filter here.
 */

type Day = {
  key: string
  label: string
  sub: string
  meetings: api.ServerMeeting[]
}

const DAY_MS = 86_400_000

function localDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

/**
 * Group into the next week of days, including empty ones.
 *
 * Empty days are kept deliberately: "a clear day" is information, and a list
 * that silently skips to Thursday makes you wonder whether it loaded.
 */
function byDay(meetings: api.ServerMeeting[]): Day[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: Day[] = []
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(today.getTime() + offset * DAY_MS)
    const key = localDay(date)
    days.push({
      key,
      label:
        offset === 0
          ? 'Today'
          : offset === 1
            ? 'Tomorrow'
            : date.toLocaleDateString(undefined, { weekday: 'long' }),
      sub: date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' }),
      meetings: [],
    })
  }

  const index = new Map(days.map((day) => [day.key, day]))
  for (const meeting of meetings) {
    if (!meeting.scheduledDate) continue
    if (meeting.status === 'CANCELLED') continue
    const at = new Date(meeting.scheduledDate)
    if (Number.isNaN(at.getTime())) continue
    const day = index.get(localDay(at))
    if (day) day.meetings.push(meeting)
  }

  for (const day of days) {
    day.meetings.sort((a, b) =>
      String(a.scheduledDate).localeCompare(String(b.scheduledDate))
    )
  }
  return days
}

const timeOf = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : '—'

const nameOf = (person?: { firstName?: string; lastName?: string }) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(' ')

export default function Schedule() {
  const t = useTheme()
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
      setError(cause instanceof Error ? cause.message : 'Could not load your schedule')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const days = byDay(meetings)
  const thisWeek = days.reduce((sum, day) => sum + day.meetings.length, 0)
  const analysed = meetings.filter((meeting) => meeting.aiSummary).length

  return (
    <Screen>
      <StatGrid>
        <Stat
          label="Meetings this week"
          value={loading ? '—' : String(thisWeek)}
          tone="brand"
          caption="next seven days"
        />
        {/*
          This tile used to read "Replaced by AI · 5 · ≈2.5 hrs saved".
          Nothing measures a replaced meeting and nothing measures an hour
          saved, so it was a number with no source. What can be counted is
          how many have been read by a model.
        */}
        <Stat
          label="Read by AI"
          value={loading ? '—' : String(analysed)}
          tone="success"
          caption="notes and tasks written"
        />
      </StatGrid>

      {error ? <Empty title="Nothing to show" body={error} /> : null}

      {loading ? (
        <Text variant="caption" tone="muted">
          Loading your schedule…
        </Text>
      ) : null}

      {!loading && !error
        ? days.map((day) => (
            <Section
              key={day.key}
              title={day.label}
              subtitle={day.sub}
              padded={day.meetings.length === 0}
            >
              {day.meetings.length === 0 ? (
                <Empty
                  title="No meetings"
                  body="A clear day. Your AI check-in still runs at 9:00."
                />
              ) : (
                day.meetings.map((meeting, i) => {
                  const people = (meeting.participants ?? [])
                    .map((entry) => nameOf(entry.user))
                    .filter(Boolean)
                  const host = nameOf(meeting.organizer)
                  const everyone = host ? [host, ...people] : people

                  return (
                    <View key={meeting.id}>
                      {i > 0 ? <Divider /> : null}
                      <View style={{ padding: space.md, gap: space.sm }}>
                        <Row gap={6}>
                          <Text variant="label" style={{ flex: 1 }}>
                            {meeting.title}
                          </Text>
                          {meeting.aiSummary ? (
                            <Badge label="Read" tone="success" />
                          ) : meeting.aiNotesRequested ? (
                            <Badge label="AI" tone="info" />
                          ) : null}
                        </Row>
                        <Row gap={space.md}>
                          <Row gap={4}>
                            <Ionicons name="time-outline" size={13} color={t.mutedText} />
                            <Text variant="caption" tone="muted">
                              {timeOf(meeting.scheduledDate)} · {meeting.duration ?? 30} min
                            </Text>
                          </Row>
                          <Badge
                            label={String(meeting.meetingType ?? 'GENERAL').toLowerCase()}
                            tone="outline"
                          />
                        </Row>
                        <Row gap={space.sm}>
                          <Row gap={-6}>
                            {everyone.slice(0, 3).map((person) => (
                              <Avatar key={person} name={person} size={22} />
                            ))}
                          </Row>
                          <View style={{ flex: 1 }} />
                          {/* No video service is connected, so this does
                              nothing. Disabled says that; a button that
                              silently ignores you does not. */}
                          <Button label="Join" variant="outline" size="sm" disabled />
                        </Row>
                      </View>
                    </View>
                  )
                })
              )}
            </Section>
          ))
        : null}

      <Row gap={space.xs}>
        <Ionicons name="information-circle-outline" size={14} color={t.mutedText} />
        <Text variant="caption" tone="muted" style={{ flex: 1 }}>
          Read from the server. Joining a call is not wired up — there is no
          video service behind it.
        </Text>
      </Row>
    </Screen>
  )
}
