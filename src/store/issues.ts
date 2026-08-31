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
 * The issue tracker. This is a module of the product, not a connector to
 * someone else's — so it owns the full shape: issue types, a workflow, epics,
 * sprints, comments and an activity trail.
 *
 * One store backs the board, the backlog, the sprint view and the issue detail
 * panel, so a status change made in any of them is the same write.
 */

export type IssueType = 'epic' | 'story' | 'task' | 'bug'
export type Status = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
export type Priority = 'lowest' | 'low' | 'medium' | 'high' | 'highest'

export type Comment = {
  id: string
  author: string
  at: string
  body: string
}

export type ActivityEntry = {
  id: string
  actor: string
  at: string
  /** Rendered as "<actor> <summary>" in the activity trail. */
  summary: string
}

export type Issue = {
  /** Human key, e.g. CN-101. The id users actually speak out loud. */
  key: string
  type: IssueType
  title: string
  description: string
  status: Status
  priority: Priority
  assignee: string | null
  reporter: string
  points: number | null
  labels: string[]
  /** Key of the epic this rolls up to. */
  epic: string | null
  /** Keys of issues this one blocks or relates to. */
  links: Array<{ type: 'blocks' | 'blocked_by' | 'relates_to'; key: string }>
  sprint: string | null
  created: string
  comments: Comment[]
  activity: ActivityEntry[]
}

export const STATUSES: Array<{ id: Status; label: string; wipLimit?: number }> = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To do' },
  { id: 'in_progress', label: 'In progress', wipLimit: 3 },
  { id: 'review', label: 'In review', wipLimit: 2 },
  { id: 'done', label: 'Done' },
]

export const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.id, s.label])) as Record<Status, string>

export const PRIORITIES: Priority[] = ['highest', 'high', 'medium', 'low', 'lowest']
export const ISSUE_TYPES: IssueType[] = ['epic', 'story', 'task', 'bug']

export const PEOPLE = [
  'Amara Chen',
  'Diego Ruiz',
  'Priya Nair',
  'Ivy Zhang',
  'Tariq Hassan',
  'Lena Kowalski',
  'Noah Bergström',
  'Maya Patel',
]

export const SPRINTS = [
  { id: 'S24', name: 'Sprint 24', state: 'active' as const, window: 'Dec 1 – Dec 15' },
  { id: 'S25', name: 'Sprint 25', state: 'planned' as const, window: 'Dec 16 – Dec 30' },
]

const now = '2026-08-31'

function seed(
  key: string,
  type: IssueType,
  title: string,
  overrides: Partial<Issue> = {}
): Issue {
  return {
    key,
    type,
    title,
    description: '',
    status: 'backlog',
    priority: 'medium',
    assignee: null,
    reporter: 'Jordan Lee',
    points: null,
    labels: [],
    epic: null,
    links: [],
    sprint: null,
    created: now,
    comments: [],
    activity: [{ id: `${key}-a0`, actor: 'Jordan Lee', at: now, summary: 'created this issue' }],
    ...overrides,
  }
}

const SEED: Issue[] = [
  seed('CN-1', 'epic', 'Mobile app redesign', {
    description: 'Rebuild the mobile experience on the new design system.',
    status: 'in_progress',
    priority: 'high',
    labels: ['Q4'],
  }),
  seed('CN-2', 'epic', 'Platform hardening', {
    description: 'Performance, auth and observability work.',
    status: 'in_progress',
    priority: 'high',
    labels: ['Q4'],
  }),

  seed('CN-101', 'story', 'Implement dark mode', {
    description:
      'Token pass across the app shell and charts. Must cover the marketing pages as well as the product.',
    status: 'backlog',
    priority: 'medium',
    assignee: 'Amara Chen',
    points: 5,
    labels: ['UI'],
    epic: 'CN-1',
    sprint: 'S25',
    comments: [
      {
        id: 'c1',
        author: 'Ivy Zhang',
        at: '2 days ago',
        body: 'Charts need their own step values — a straight invert looks wrong on the orange.',
      },
    ],
  }),
  seed('CN-102', 'story', 'Authentication refactor', {
    description: 'Split roles into three tiers and add second-factor support.',
    status: 'backlog',
    priority: 'highest',
    assignee: 'Diego Ruiz',
    points: 8,
    labels: ['Backend', 'Security'],
    epic: 'CN-2',
    links: [{ type: 'blocks', key: 'CN-105' }],
  }),
  seed('CN-103', 'task', 'Write API documentation', {
    description: 'Cover every REST endpoint and its error shape.',
    status: 'todo',
    priority: 'medium',
    assignee: 'Priya Nair',
    points: 3,
    labels: ['Docs'],
    epic: 'CN-2',
    sprint: 'S24',
  }),
  seed('CN-104', 'bug', 'Stat cards overflow below 380px', {
    description: 'The dashboard grid does not collapse on small phones; cards clip at the right edge.',
    status: 'todo',
    priority: 'high',
    assignee: 'Ivy Zhang',
    points: 5,
    labels: ['Mobile'],
    epic: 'CN-1',
    sprint: 'S24',
  }),
  seed('CN-105', 'story', 'Optimise dashboard queries', {
    description: 'Dashboard load is 2.4s at p95. Target is under one second.',
    status: 'in_progress',
    priority: 'highest',
    assignee: 'Tariq Hassan',
    points: 8,
    labels: ['Performance'],
    epic: 'CN-2',
    sprint: 'S24',
    links: [{ type: 'blocked_by', key: 'CN-102' }],
    comments: [
      { id: 'c2', author: 'Tariq Hassan', at: '4 hrs ago', body: 'Down to 1.3s after indexing. Caching next.' },
    ],
  }),
  seed('CN-106', 'task', 'Sprint report export', {
    description: 'PDF and CSV from the sprint detail page.',
    status: 'review',
    priority: 'medium',
    assignee: 'Lena Kowalski',
    points: 5,
    labels: ['Feature'],
    epic: 'CN-2',
    sprint: 'S24',
  }),
  seed('CN-107', 'task', 'Set up CI/CD pipeline', {
    description: 'Test, build and deploy on merge to main.',
    status: 'done',
    priority: 'high',
    assignee: 'Noah Bergström',
    points: 13,
    labels: ['DevOps'],
    epic: 'CN-2',
    sprint: 'S24',
  }),
  seed('CN-108', 'task', 'Add empty states', {
    description: 'Every list needs a first-run state.',
    status: 'done',
    priority: 'low',
    assignee: 'Maya Patel',
    points: 2,
    labels: ['UI'],
    epic: 'CN-1',
    sprint: 'S24',
  }),
  seed('CN-109', 'task', 'Audit log retention policy', {
    description: 'Decide how long platform events are kept and who can export them.',
    status: 'backlog',
    priority: 'low',
    assignee: 'Maya Patel',
    points: 3,
    labels: ['Compliance'],
    epic: 'CN-2',
  }),
  seed('CN-110', 'bug', 'Check-in reminder fires twice', {
    description: 'People on two teams get the 11:00 nudge from both.',
    status: 'backlog',
    priority: 'high',
    assignee: null,
    points: 2,
    labels: ['Bug'],
    epic: null,
  }),
  seed('CN-111', 'story', 'Offline draft for check-ins', {
    description: 'Answers should survive a dropped connection.',
    status: 'backlog',
    priority: 'low',
    assignee: null,
    points: 5,
    labels: ['Mobile'],
    epic: 'CN-1',
  }),
]

let sequence = 200

type IssuesState = {
  issues: Issue[]
  update: (key: string, patch: Partial<Issue>, activitySummary?: string) => void
  move: (key: string, status: Status, index: number) => void
  comment: (key: string, body: string) => void
  create: (draft: Pick<Issue, 'type' | 'title'> & Partial<Issue>) => string
  assignToSprint: (key: string, sprint: string | null) => void
}

/** Newest first, so a fresh comment or activity entry reads at the top. */
function stamp(actor: string, summary: string): ActivityEntry {
  return { id: `a${Math.random().toString(36).slice(2, 9)}`, actor, at: 'just now', summary }
}

export const useIssuesStore = create<IssuesState>((set) => ({
  issues: SEED,

  update: (key, patch, activitySummary) =>
    set((state) => ({
      issues: state.issues.map((issue) =>
        issue.key === key
          ? {
              ...issue,
              ...patch,
              activity: activitySummary
                ? [stamp('You', activitySummary), ...issue.activity]
                : issue.activity,
            }
          : issue
      ),
    })),

  // Board order is the array order within a status, so a move is a splice.
  move: (key, status, index) =>
    set((state) => {
      const issue = state.issues.find((i) => i.key === key)
      if (!issue) return state

      const rest = state.issues.filter((i) => i.key !== key)
      const moved: Issue = {
        ...issue,
        status,
        activity:
          issue.status === status
            ? issue.activity
            : [stamp('You', `moved this from ${STATUS_LABEL[issue.status]} to ${STATUS_LABEL[status]}`), ...issue.activity],
      }

      // Rebuild the flat list so the target column ends up in the right order.
      const inTarget = rest.filter((i) => i.status === status)
      const others = rest.filter((i) => i.status !== status)
      const clamped = Math.min(index, inTarget.length)
      const reordered = [...inTarget.slice(0, clamped), moved, ...inTarget.slice(clamped)]

      return { issues: [...others, ...reordered] }
    }),

  comment: (key, body) =>
    set((state) => ({
      issues: state.issues.map((issue) =>
        issue.key === key
          ? {
              ...issue,
              comments: [
                ...issue.comments,
                { id: `c${Math.random().toString(36).slice(2, 9)}`, author: 'You', at: 'just now', body },
              ],
              activity: [stamp('You', 'commented'), ...issue.activity],
            }
          : issue
      ),
    })),

  create: (draft) => {
    const key = `CN-${++sequence}`
    set((state) => ({
      issues: [
        ...state.issues,
        seed(key, draft.type, draft.title, { ...draft, status: draft.status ?? 'backlog' }),
      ],
    }))
    return key
  },

  assignToSprint: (key, sprint) =>
    set((state) => ({
      issues: state.issues.map((issue) =>
        issue.key === key
          ? {
              ...issue,
              sprint,
              activity: [
                stamp('You', sprint ? `added this to ${sprint}` : 'removed this from the sprint'),
                ...issue.activity,
              ],
            }
          : issue
      ),
    })),
}))

/** Issues grouped by status, in board order. Epics are excluded — they are containers. */
export function selectBoard(issues: Issue[], sprint?: string) {
  const board = {} as Record<Status, Issue[]>
  for (const status of STATUSES) board[status.id] = []
  for (const issue of issues) {
    if (issue.type === 'epic') continue
    if (sprint && issue.sprint !== sprint) continue
    board[issue.status].push(issue)
  }
  return board
}

export function selectEpics(issues: Issue[]) {
  return issues.filter((i) => i.type === 'epic')
}
