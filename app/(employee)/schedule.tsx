import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Avatar, Badge, Button, Divider, Empty, Row, Screen, Section, Stat, StatGrid, Text } from '../../src/components/ui'
import { useTheme } from '../../src/theme/theme'
import { space } from '../../src/theme/tokens'

type Meeting = {
  title: string
  time: string
  length: string
  kind: string
  ai: boolean
  people: string[]
}

const DAYS: Array<{ day: string; date: string; meetings: Meeting[] }> = [
  {
    day: 'Today',
    date: 'Monday',
    meetings: [
      {
        title: 'Sprint planning — Mobile',
        time: '2:00 PM',
        length: '1 hr',
        kind: 'Planning',
        ai: true,
        people: ['Amara Chen', 'Ivy Zhang', 'Noah Bergström'],
      },
    ],
  },
  {
    day: 'Tomorrow',
    date: 'Tuesday',
    meetings: [
      { title: '1:1 with manager', time: '10:00 AM', length: '30 min', kind: '1:1', ai: false, people: ['Jordan Lee'] },
      {
        title: 'Retrospective — Backend',
        time: '3:00 PM',
        length: '45 min',
        kind: 'Retro',
        ai: true,
        people: ['Diego Ruiz', 'Tariq Hassan', 'Maya Patel'],
      },
    ],
  },
  { day: 'Wednesday', date: 'Clear', meetings: [] },
]

export default function Schedule() {
  const t = useTheme()

  return (
    <Screen>
      <StatGrid>
        <Stat label="Meetings this week" value="12" tone="brand" caption="3 still upcoming" />
        <Stat label="Replaced by AI" value="5" tone="success" caption="≈2.5 hrs saved" />
      </StatGrid>

      {DAYS.map((day) => (
        <Section key={day.day} title={day.day} subtitle={day.date} padded={day.meetings.length === 0}>
          {day.meetings.length === 0 ? (
            <Empty title="No meetings" body="A clear day. Your AI check-in still runs at 9:00." />
          ) : (
            day.meetings.map((meeting, i) => (
              <View key={meeting.title}>
                {i > 0 ? <Divider /> : null}
                <View style={{ padding: space.md, gap: space.sm }}>
                  <Row gap={6}>
                    <Text variant="label" style={{ flex: 1 }}>
                      {meeting.title}
                    </Text>
                    {meeting.ai ? <Badge label="AI" tone="info" /> : null}
                  </Row>
                  <Row gap={space.md}>
                    <Row gap={4}>
                      <Ionicons name="time-outline" size={13} color={t.mutedText} />
                      <Text variant="caption" tone="muted">
                        {meeting.time} · {meeting.length}
                      </Text>
                    </Row>
                    <Badge label={meeting.kind} tone="outline" />
                  </Row>
                  <Row gap={space.sm}>
                    <Row gap={-6}>
                      {meeting.people.slice(0, 3).map((person) => (
                        <Avatar key={person} name={person} size={22} />
                      ))}
                    </Row>
                    <View style={{ flex: 1 }} />
                    <Button label="Join" variant="outline" size="sm" />
                  </Row>
                </View>
              </View>
            ))
          )}
        </Section>
      ))}
    </Screen>
  )
}
