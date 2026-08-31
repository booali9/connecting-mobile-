import { useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Badge, Button, Card, Input, Progress, Row, Text } from '../src/components/ui'
import { useTheme } from '../src/theme/theme'
import { radius, space } from '../src/theme/tokens'
import { QUESTIONS, useCheckInStore, type Answer, type Verdict } from '../src/store/checkin'

const VERDICT: Record<
  Verdict,
  { icon: 'checkmark-circle' | 'help-circle' | 'warning'; tone: 'success' | 'warning' | 'danger'; label: string }
> = {
  verified: { icon: 'checkmark-circle', tone: 'success', label: 'Verified' },
  unconfirmed: { icon: 'help-circle', tone: 'warning', label: 'Unconfirmed' },
  blocked: { icon: 'warning', tone: 'danger', label: 'Escalated' },
}

/**
 * The AI check-in, one question per screen. On a phone this is the right shape:
 * a single question with the keyboard up beats a scrolling form, and the
 * verification result gets a screen of its own because it is the payoff.
 */
export default function CheckIn() {
  const t = useTheme()
  const router = useRouter()
  const submit = useCheckInStore((s) => s.submit)

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [verifying, setVerifying] = useState(false)
  const [results, setResults] = useState<Answer[] | null>(null)

  const question = QUESTIONS[step]
  const isLast = step === QUESTIONS.length - 1
  const progress = results ? 100 : (step / QUESTIONS.length) * 100

  async function finish() {
    setVerifying(true)
    await new Promise((r) => setTimeout(r, 900))
    setResults(submit(QUESTIONS.map((q) => ({ questionId: q.id, text: answers[q.id] ?? '' }))))
    setVerifying(false)
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={{ padding: space.lg, gap: space.lg }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: space.xs }}>
        <Row>
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            {results ? 'Filed' : `Question ${step + 1} of ${QUESTIONS.length}`}
          </Text>
          <Text variant="caption" tone="muted">
            {Math.round(progress)}%
          </Text>
        </Row>
        <Progress value={progress} />
      </View>

      {results ? (
        <Results results={results} onDone={() => router.back()} />
      ) : verifying ? (
        <Card style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xxl }}>
          <ActivityIndicator color={t.brandInk} />
          <Text variant="label">Checking your answers</Text>
          <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
            Reconciling against your commits and the issue tracker.
          </Text>
        </Card>
      ) : (
        <>
          <Card style={{ gap: space.md }}>
            <Text variant="title">{question.prompt}</Text>
            <Text variant="caption" tone="muted">
              {question.hint}
            </Text>
            <Input
              value={answers[question.id] ?? ''}
              onChangeText={(v) => setAnswers((a) => ({ ...a, [question.id]: v }))}
              placeholder={question.id === 'blocker' ? 'Nothing today' : 'A sentence is plenty…'}
              multiline
              autoFocus
            />
            <Row gap={6}>
              <Ionicons name="sparkles" size={12} color={t.brandInk} />
              <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                {question.verifiedBy}
              </Text>
            </Row>
          </Card>

          <Row gap={space.sm}>
            <Button
              label="Back"
              variant="outline"
              disabled={step === 0}
              onPress={() => setStep((s) => s - 1)}
              style={{ flex: 1 }}
            />
            <Button
              label={isLast ? 'File check-in' : 'Next'}
              onPress={isLast ? finish : () => setStep((s) => s + 1)}
              style={{ flex: 2 }}
            />
          </Row>
        </>
      )}
    </ScrollView>
  )
}

function Results({ results, onDone }: { results: Answer[]; onDone: () => void }) {
  const t = useTheme()
  const blocked = results.filter((r) => r.verdict === 'blocked').length
  const unconfirmed = results.filter((r) => r.verdict === 'unconfirmed').length

  const summaryTone = blocked ? t.dangerSubtle : unconfirmed ? t.warningSubtle : t.successSubtle
  const summaryBorder = blocked ? t.danger : unconfirmed ? t.warning : t.success

  return (
    <View style={{ gap: space.lg }}>
      <Card style={{ backgroundColor: summaryTone, borderColor: summaryBorder, gap: space.sm }}>
        <Row>
          <Ionicons name="checkmark-circle" size={18} color={summaryBorder} />
          <Text variant="label" style={{ flex: 1 }}>
            {blocked
              ? 'Filed. Your blocker went straight to the person who can clear it.'
              : unconfirmed
                ? `Filed. ${unconfirmed} answer${unconfirmed > 1 ? 's' : ''} couldn't be confirmed.`
                : 'Filed and fully verified.'}
          </Text>
        </Row>
      </Card>

      {results.map((result) => {
        const question = QUESTIONS.find((q) => q.id === result.questionId)
        const meta = VERDICT[result.verdict]
        return (
          <Card key={result.questionId} style={{ gap: space.xs }}>
            <Text variant="caption" tone="muted">
              {question?.prompt}
            </Text>
            <Text variant="body">{result.text || 'No answer'}</Text>
            <Row gap={4}>
              <Ionicons name={meta.icon} size={13} color={t[meta.tone]} />
              <Text variant="caption" tone={meta.tone}>
                {meta.label}
              </Text>
              <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                — {result.evidence}
              </Text>
            </Row>
          </Card>
        )
      })}

      <Row gap={space.sm}>
        <Badge label="No standup needed" tone="info" />
        <View style={{ flex: 1 }} />
        <Button label="Done" onPress={onDone} />
      </Row>
    </View>
  )
}
