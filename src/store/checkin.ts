import { create } from 'zustand'

/*
 * NOTE: this is a deliberate copy of the web app's store of the same name.
 *
 * Both are mock data standing in for the API. Rather than wire up a shared
 * package for something with a known expiry date, the two are kept identical
 * by hand — when the backend lands, both apps call it and this file becomes a
 * thin query layer instead. Keep any model change in step across the two.
 */

/**
 * The daily check-in — the thing the whole product is about. One store backs
 * both sides of it: the employee answering, and the manager watching responses
 * land. Keeping them on one source is what makes the manager board update the
 * moment someone finishes.
 */

export type Verdict = 'verified' | 'unconfirmed' | 'blocked'

export type Answer = {
  questionId: string
  text: string
  verdict: Verdict
  /** What the AI reconciled the answer against. */
  evidence: string
}

export type CheckIn = {
  personId: string
  name: string
  department: string
  /** Undefined until they start. */
  answers?: Answer[]
  status: 'pending' | 'in_progress' | 'complete'
  completedAt?: string
  blocker?: string
  /** Who a blocker was escalated to. */
  escalatedTo?: string
}

export type Question = {
  id: string
  prompt: string
  hint: string
  /** What the AI will check the answer against. */
  verifiedBy: string
}

export const QUESTIONS: Question[] = [
  {
    id: 'progress',
    prompt: 'What moved since yesterday?',
    hint: 'One line is enough — the AI fills in the detail from your commits.',
    verifiedBy: 'GitHub commits and pull requests',
  },
  {
    id: 'today',
    prompt: 'What are you on today?',
    hint: 'This becomes your assigned work for the day.',
    verifiedBy: 'Your sprint board',
  },
  {
    id: 'blocker',
    prompt: 'Anything in your way?',
    hint: 'Leave empty if nothing. Anything here is routed within the hour.',
    verifiedBy: 'Routed to whoever owns the dependency',
  },
]

const TEAM: Array<Pick<CheckIn, 'personId' | 'name' | 'department'>> = [
  { personId: 'p1', name: 'Amara Chen', department: 'Engineering' },
  { personId: 'p2', name: 'Diego Ruiz', department: 'Engineering' },
  { personId: 'p3', name: 'Priya Nair', department: 'Engineering' },
  { personId: 'p4', name: 'Sam Okafor', department: 'Sales' },
  { personId: 'p5', name: 'Lena Kowalski', department: 'Sales' },
  { personId: 'p6', name: 'Tariq Hassan', department: 'Engineering' },
  { personId: 'p7', name: 'Ivy Zhang', department: 'Marketing' },
  { personId: 'p8', name: 'Noah Bergström', department: 'Marketing' },
  { personId: 'p9', name: 'Fatima Al-Sayed', department: 'HR' },
  { personId: 'p10', name: 'Maya Patel', department: 'Support' },
]

/** Seed the board so a manager opening it mid-morning sees a realistic spread. */
const SEEDED: CheckIn[] = TEAM.map((person, i) => {
  if (i < 4) {
    return {
      ...person,
      status: 'complete',
      completedAt: ['09:02', '09:07', '09:14', '09:21'][i],
      answers: [
        {
          questionId: 'progress',
          text: 'Finished the auth flow, opened PR #412 for review.',
          verdict: 'verified',
          evidence: 'PR #412 open · 2 approvals · CI green',
        },
        {
          questionId: 'today',
          text: 'Caching layer for the dashboard queries.',
          verdict: 'verified',
          evidence: 'CN-206 assigned · 8 pts · due Friday',
        },
        { questionId: 'blocker', text: '', verdict: 'verified', evidence: 'Nothing raised' },
      ],
    }
  }
  if (i === 4) {
    return {
      ...person,
      status: 'complete',
      completedAt: '09:26',
      blocker: 'Waiting on staging credentials from infra.',
      escalatedTo: 'Tariq Hassan',
      answers: [
        {
          questionId: 'progress',
          text: 'Drafted the migration plan.',
          verdict: 'unconfirmed',
          evidence: 'No linked commits or tickets found',
        },
        {
          questionId: 'today',
          text: 'Run the migration against staging.',
          verdict: 'verified',
          evidence: 'CN-118 assigned · 5 pts',
        },
        {
          questionId: 'blocker',
          text: 'Waiting on staging credentials from infra.',
          verdict: 'blocked',
          evidence: 'Escalated to Tariq Hassan at 09:26',
        },
      ],
    }
  }
  if (i === 5) return { ...person, status: 'in_progress' }
  return { ...person, status: 'pending' }
})

/**
 * Stand-in for the verification step. Real reconciliation happens server-side
 * against source control and our own issue tracker; this mirrors the shape so
 * the UI is built against what the API will actually return.
 */
function verify(questionId: string, text: string): Answer {
  const trimmed = text.trim()

  if (questionId === 'blocker') {
    return trimmed
      ? { questionId, text: trimmed, verdict: 'blocked', evidence: 'Routed to the owner of the dependency' }
      : { questionId, text: '', verdict: 'verified', evidence: 'Nothing raised' }
  }

  if (!trimmed) {
    return { questionId, text: '', verdict: 'unconfirmed', evidence: 'No answer given' }
  }

  // A claim that names a concrete artefact is the kind the AI can reconcile.
  const referencesWork = /\b(pr|#\d+|cn-\d+|commit|merged|deployed|ticket|branch)\b/i.test(trimmed)
  return referencesWork
    ? { questionId, text: trimmed, verdict: 'verified', evidence: 'Matched against your commits and board activity' }
    : { questionId, text: trimmed, verdict: 'unconfirmed', evidence: 'Nothing found to confirm this — flagged for review' }
}

type CheckInState = {
  checkIns: CheckIn[]
  /** The signed-in person's own record, kept separate from the seeded team. */
  mine: CheckIn
  streak: number
  submit: (answers: Array<{ questionId: string; text: string }>) => Answer[]
  reset: () => void
  escalate: (personId: string, to: string) => void
}

const MY_BASE: CheckIn = {
  personId: 'me',
  name: 'You',
  department: 'Engineering',
  status: 'pending',
}

export const useCheckInStore = create<CheckInState>((set) => ({
  checkIns: SEEDED,
  mine: MY_BASE,
  streak: 14,
  submit: (raw) => {
    const answers = raw.map((a) => verify(a.questionId, a.text))
    const blocker = answers.find((a) => a.verdict === 'blocked')

    set((state) => ({
      streak: state.mine.status === 'complete' ? state.streak : state.streak + 1,
      mine: {
        ...state.mine,
        status: 'complete',
        completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        answers,
        blocker: blocker?.text,
        escalatedTo: blocker ? 'Jordan Lee' : undefined,
      },
    }))

    return answers
  },
  reset: () =>
    set((state) => ({ mine: MY_BASE, streak: Math.max(0, state.streak - 1) })),
  escalate: (personId, to) =>
    set((state) => ({
      checkIns: state.checkIns.map((c) =>
        c.personId === personId ? { ...c, escalatedTo: to } : c
      ),
    })),
}))

/** The manager's view: the seeded team plus the signed-in person. */
export function useTeamCheckIns(): CheckIn[] {
  const checkIns = useCheckInStore((s) => s.checkIns)
  const mine = useCheckInStore((s) => s.mine)
  return [{ ...mine, name: 'You' }, ...checkIns]
}
