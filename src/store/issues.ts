import { create } from 'zustand'
import * as api from '../lib/api'

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

/* ----------------------------------------------------- server mapping --- */

/**
 * The same mapping the web app uses, and the same two gaps worth naming.
 *
 * The board has a `backlog` column the server has no status for; treating
 * "not in a sprint" as the backlog is how a backlog works, so that half is
 * honest. The server has BLOCKED and the board has no column for it, so a
 * blocked task lands in `todo` with nothing on the card saying so. That
 * needs a column, which is a design decision rather than a mapping one.
 */
function statusFromServer(status: string, sprintId: string | null): Status {
  if (status === 'COMPLETED') return 'done'
  if (status === 'REVIEW') return 'review'
  if (status === 'IN_PROGRESS') return 'in_progress'
  return sprintId ? 'todo' : 'backlog'
}

function statusToServer(status: Status): api.TaskStatus {
  if (status === 'done') return 'COMPLETED'
  if (status === 'review') return 'REVIEW'
  if (status === 'in_progress') return 'IN_PROGRESS'
  return 'PENDING'
}

function priorityFromServer(priority: string): Priority {
  if (priority === 'URGENT') return 'highest'
  if (priority === 'HIGH') return 'high'
  if (priority === 'LOW') return 'low'
  return 'medium'
}

export function issueFromTask(task: api.ServerTask): Issue {
  const sprintId = task.sprintId ?? null
  return {
    key: task.key ?? `#${task.id.slice(0, 6)}`,
    // The uuid, kept because `key` is what people say and not what the API
    // takes. Without it no edit made here could reach the server.
    serverId: task.id,
    type: ((task.type ?? 'TASK').toLowerCase()) as IssueType,
    title: task.title,
    description: task.description ?? '',
    status: statusFromServer(task.status, sprintId),
    priority: priorityFromServer(task.priority),
    assignee: task.assignedToId ?? null,
    reporter: 'Unknown',
    points: task.storyPoints ?? null,
    labels: task.tags ?? [],
    epic: task.epicId ?? null,
    links: [],
    sprint: sprintId,
    created: String(task.createdAt ?? '').slice(0, 10),
    comments: [],
    // Nothing on the server records an activity trail. Empty on a live
    // issue rather than invented history beside real work.
    activity: [],
  }
}

export type Issue = {
  /** Human key, e.g. CN-101. The id users actually speak out loud. */
  key: string
  /** The server's uuid, when this issue came from one. */
  serverId?: string
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

export type SprintSummary = {
  id: string
  name: string
  state: 'planned' | 'active' | 'closed'
  /** "4 Nov – 18 Nov", or a note when the sprint has no dates. */
  window: string
  goal?: string | null
  capacity?: number | null
}

/** A sprint's dates as the board header writes them. */
function sprintWindow(start?: string | null, end?: string | null): string {
  const label = (value?: string | null) =>
    value
      ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : null
  const from = label(start)
  const to = label(end)
  if (from && to) return `${from} – ${to}`
  return from ?? to ?? 'no dates set'
}

type IssuesState = {
  issues: Issue[]
  /**
   * What the board can choose between: the server's sprints, or SPRINTS.
   *
   * The screens read a hardcoded pair dated Dec 1 to Dec 15 while every task
   * from the server carried a sprint uuid, so the header named a sprint
   * nothing belonged to and the burn-down read 0 of 0 points.
   */
  sprints: SprintSummary[]
  /** 'demo' until the server answers; nothing writes through in demo. */
  source: 'demo' | 'server'
  loading: boolean
  error: string | null
  hydrate: () => Promise<void>
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

export const useIssuesStore = create<IssuesState>((set, get) => ({
  issues: SEED,
  sprints: SPRINTS,
  source: 'demo',
  loading: false,
  error: null,

  hydrate: async () => {
    // A token as well as a backend. Without this, a cold start on the
    // sign-in screen fired /api/tasks and /api/sprints with no
    // Authorization header, took two 401s, and put them in the console --
    // then repeated both successfully a second later once somebody signed
    // in. Nothing was broken by it; nothing was gained either.
    if (!api.isConfigured || !api.currentToken()) return
    set({ loading: true, error: null })
    try {
      const [tasks, sprints] = await Promise.all([api.allTasks(200), api.allSprints()])
      set({
        issues: tasks.map(issueFromTask),
        sprints: sprints.map((sprint) => ({
          id: sprint.id,
          name: sprint.name,
          state: sprint.state.toLowerCase() as 'planned' | 'active' | 'closed',
          window: sprintWindow(sprint.startDate, sprint.endDate),
          goal: sprint.goal ?? null,
          capacity: sprint.capacity ?? null,
        })),
        source: 'server',
        loading: false,
      })
    } catch (cause) {
      // The seed stays visible, but `source` does not become 'server', so
      // nothing below tries to post an edit that would fail anyway.
      set({
        loading: false,
        error: cause instanceof Error ? cause.message : 'Could not load issues',
      })
    }
  },

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
