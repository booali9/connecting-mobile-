/**
 * The one place this app talks to the backend.
 *
 * Until now it talked to nothing: every screen read a seeded array and
 * sign-in matched an email against a list held in the app. The web client
 * was written to use a bearer token rather than a cookie precisely so the
 * same shape would work here, where cookies are not carried.
 *
 * The base URL comes from EXPO_PUBLIC_API_URL. Unset, `isConfigured` is
 * false, nothing is requested and the app behaves exactly as it did —
 * which matters more on a phone than on the web, because a developer
 * running this on a device without a reachable backend should still get a
 * working demo rather than a screen of errors.
 *
 * A note on that URL: `localhost` means the phone, not the machine running
 * the server. On a device or an emulator it has to be the host's LAN
 * address, or 10.0.2.2 on the Android emulator.
 *
 * Two things the SDK 57 docs are explicit about, both of which bite:
 *
 *   The reference has to be static dot notation. `process.env.EXPO_PUBLIC_X`
 *   is replaced at build time; `process.env['EXPO_PUBLIC_X']` and
 *   destructuring are not, and silently read undefined.
 *
 *   The value is inlined into the bundle, not read at runtime, so changing
 *   .env needs a full reload before the app sees it. It is also readable by
 *   anyone with the built app, which is why nothing secret goes here — this
 *   is a base URL and the token is fetched, never shipped.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '')

export const isConfigured = BASE.length > 0

const TOKEN_KEY = 'connecting-token'

/**
 * AsyncStorage is async and `request` is called from places that cannot
 * wait, so the token is mirrored in memory. `restoreToken` fills it on
 * start; everything after reads the copy.
 */
let token: string | null = null

export function currentToken(): string | null {
  return token
}

export async function restoreToken(): Promise<string | null> {
  try {
    token = await AsyncStorage.getItem(TOKEN_KEY)
  } catch {
    token = null
  }
  return token
}

export async function setToken(value: string | null): Promise<void> {
  token = value
  try {
    if (value) await AsyncStorage.setItem(TOKEN_KEY, value)
    else await AsyncStorage.removeItem(TOKEN_KEY)
  } catch {
    // A device with storage full should still have a usable session for
    // as long as the app is open.
  }
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  anonymous?: boolean
}

export async function request<T>(path: string, options: Options = {}): Promise<T> {
  if (!isConfigured) {
    throw new ApiError('No backend configured. Set EXPO_PUBLIC_API_URL.', 0)
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (!options.anonymous && token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    // On a phone this is usually the wrong host rather than a dead server,
    // so the message says which URL was tried.
    throw new ApiError(`Cannot reach ${BASE}. On a device, localhost is the phone.`, 0)
  }

  const text = await response.text()
  let payload: any
  try {
    payload = text ? JSON.parse(text) : undefined
  } catch {
    payload = text
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? payload?.error ?? `Request failed with ${response.status}`,
      response.status
    )
  }
  return payload as T
}

/* ---------------------------------------------------------------- auth --- */

export type ServerRole = 'ADMIN' | 'MANAGER' | 'DEVELOPER'

/**
 * `id`, not `_id`. The backend's `sendTokenResponse` writes `id`; `_id` is
 * only the name of the parameter it takes. Reading `_id` gave every account
 * an undefined id, so a successful sign-in left the app looking signed out.
 *
 * `company` and `companyId` are both optional because the endpoints
 * disagree: login sends a flat id, `/api/auth/me` answers the whole row,
 * where the id is in `companyId` and `company` is an object.
 */
export type ServerUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: ServerRole
  companyId?: string | null
  company?: string | { id?: string; name?: string } | null
}

/** The company id, whichever of the three shapes the server used. */
export function companyIdOf(user: ServerUser): string | null {
  if (typeof user.companyId === 'string') return user.companyId
  if (typeof user.company === 'string') return user.company
  if (user.company && typeof user.company === 'object') return user.company.id ?? null
  return null
}

export async function login(email: string, password: string): Promise<ServerUser> {
  const result = await request<{ token: string; user: ServerUser }>(
    '/api/auth/login',
    { method: 'POST', body: { email, password }, anonymous: true }
  )
  await setToken(result.token)
  return result.user
}

export async function me(): Promise<ServerUser> {
  const result = await request<{ user: ServerUser }>('/api/auth/me')
  return result.user
}

export async function logout(): Promise<void> {
  try {
    await request('/api/auth/logout', { method: 'POST' })
  } catch {
    // Never strand somebody in a signed-in UI because logout failed.
  } finally {
    await setToken(null)
  }
}

/* --------------------------------------------------------------- tasks --- */

// Values copied from prisma/schema.prisma, not guessed. The web client
// shipped TODO and DONE, which the server has never used, and every task
// sorted into one column as a result.
export type TaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'COMPLETED'
  | 'BLOCKED'

export type ServerTask = {
  id: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  progress?: number
  dueDate?: string | null
  key?: string | null
  type?: 'EPIC' | 'STORY' | 'TASK' | 'BUG'
  storyPoints?: number | null
  epicId?: string | null
  sprintId?: string | null
  assignedToId?: string | null
  tags?: string[]
  createdAt: string
  [key: string]: unknown
}

/** The list endpoints put the array under the plural, not under `data`. */
export async function myTasks(): Promise<ServerTask[]> {
  const result = await request<{ tasks?: ServerTask[] }>('/api/tasks/my/tasks')
  return result.tasks ?? []
}

export async function allTasks(limit = 200): Promise<ServerTask[]> {
  const result = await request<{ tasks?: ServerTask[] }>(`/api/tasks?limit=${limit}`)
  return result.tasks ?? []
}

export async function updateTask(
  id: string,
  patch: Partial<ServerTask>
): Promise<ServerTask> {
  const result = await request<{ task: ServerTask }>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: patch,
  })
  return result.task
}
