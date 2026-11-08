import AsyncStorage from '@react-native-async-storage/async-storage'
import * as api from '../lib/api'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Accounts and the signed-in session.
 *
 * Credentials are checked on the device against a local list, which is only
 * acceptable because there is no server yet. Nothing here is a security
 * boundary — when the API lands, `signIn` and `register` become calls that
 * return a token and every check below moves behind it. The shapes are chosen
 * so that swap is a change of body, not of signature.
 */

export type Role = 'company_admin' | 'employee'
export type Portal = 'company' | 'employee'

export type Account = {
  id: string
  name: string
  email: string
  /** Plain text, deliberately: see the note above. Never do this with a server. */
  password: string
  role: Role
  company: string
}

export const ROLE_LABEL: Record<Role, string> = {
  company_admin: 'Company Manager',
  employee: 'Employee',
}

const SEEDED: Account[] = [
  {
    id: 'a1',
    name: 'Jordan Lee',
    email: 'jordan@acme.com',
    password: 'password',
    role: 'company_admin',
    company: 'Acme Robotics',
  },
  {
    id: 'a2',
    name: 'Sam Wright',
    email: 'sam@acme.com',
    password: 'password',
    role: 'employee',
    company: 'Acme Robotics',
  },
]

/* ------------------------------------------------------------- validation */

export const validators = {
  email(value: string): string | null {
    if (!value.trim()) return 'Enter your email address.'
    // Deliberately loose. Over-strict email regexes reject valid addresses, and
    // the only real test is whether a message arrives.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'That does not look like an email address.'
    return null
  },
  password(value: string): string | null {
    if (!value) return 'Enter a password.'
    if (value.length < 8) return 'Use at least 8 characters.'
    return null
  },
  name(value: string): string | null {
    if (!value.trim()) return 'Enter your name.'
    if (value.trim().length < 2) return 'That name looks too short.'
    return null
  },
  company(value: string): string | null {
    if (!value.trim()) return 'Enter your company.'
    return null
  },
}

/** 0–4. Guidance for the person, not a gate. */
export function passwordStrength(password: string): number {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return Math.min(score, 4)
}

export const STRENGTH_LABEL = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']

/* ----------------------------------------------------------------- store */

type SessionState = {
  accounts: Account[]
  currentId: string | null
  /** Emails that have requested a reset. Stands in for a mail queue. */
  resetRequests: string[]

  signIn: (email: string, password: string) => Promise<string | null>
  restore: () => Promise<void>
  register: (input: {
    name: string
    email: string
    company: string
    password: string
    role: Role
  }) => Promise<string | null>
  requestReset: (email: string) => Promise<void>
  signOut: () => void
}

/**
 * The server knows three roles, this app knows two: it has no platform
 * admin screens. ADMIN lands on the manager side, which is the most it can
 * usefully do here, rather than being refused a session it is entitled to.
 */
function accountFromServer(user: api.ServerUser): Account {
  return {
    id: user._id,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    email: user.email,
    // Never the real one. A server account has no password this app should
    // hold, and the seeded ones only have it because they are seeds.
    password: '',
    role: user.role === 'DEVELOPER' ? 'employee' : 'company_admin',
    company: user.company ?? '',
  }
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      accounts: SEEDED,
      currentId: null,
      resetRequests: [],

      signIn: async (email, password) => {
        // A configured backend is the real thing. No falling back to the
        // seeded list on failure: that would sign somebody in with a wrong
        // password and look like success.
        if (api.isConfigured) {
          try {
            const user = await api.login(email.trim(), password)
            const account = accountFromServer(user)
            set((state) => ({
              accounts: [
                ...state.accounts.filter((a) => a.id !== account.id),
                account,
              ],
              currentId: account.id,
            }))
            return null
          } catch (error) {
            return error instanceof Error
              ? error.message
              : 'That email and password do not match.'
          }
        }

        await new Promise((r) => setTimeout(r, 500))
        const account = get().accounts.find(
          (a) => a.email.toLowerCase() === email.trim().toLowerCase()
        )
        // One message for both cases: saying "no such account" tells an attacker
        // which addresses are registered.
        if (!account || account.password !== password) {
          return 'That email and password do not match.'
        }
        set({ currentId: account.id })
        return null
      },

      /** Turn a stored token back into a session, once, on start. */
      restore: async () => {
        if (!api.isConfigured) return
        if (!(await api.restoreToken())) return
        try {
          const user = await api.me()
          const account = accountFromServer(user)
          set((state) => ({
            accounts: [
              ...state.accounts.filter((a) => a.id !== account.id),
              account,
            ],
            currentId: account.id,
          }))
        } catch {
          // A rejected token must not leave the app looking signed in.
          await api.setToken(null)
          set({ currentId: null })
        }
      },

      register: async ({ name, email, company, password, role }) => {
        await new Promise((r) => setTimeout(r, 600))
        const exists = get().accounts.some(
          (a) => a.email.toLowerCase() === email.trim().toLowerCase()
        )
        if (exists) return 'An account already exists for that email.'

        const account: Account = {
          id: `a${Date.now()}`,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          company: company.trim(),
          password,
          role,
        }
        set((state) => ({ accounts: [...state.accounts, account], currentId: account.id }))
        return null
      },

      requestReset: async (email) => {
        await new Promise((r) => setTimeout(r, 500))
        // Always "succeeds", whether or not the address is registered.
        set((state) => ({ resetRequests: [...state.resetRequests, email.trim().toLowerCase()] }))
      },

      signOut: () => {
        if (api.isConfigured) void api.logout()
        set({ currentId: null })
      },
    }),
    {
      name: 'connecting-session',
      storage: createJSONStorage(() => AsyncStorage),
      // Registered accounts and the session persist; nothing else needs to.
      partialize: (state) => ({ accounts: state.accounts, currentId: state.currentId }),
    }
  )
)

/** The signed-in account, or null. */
export function useCurrentAccount(): Account | null {
  const accounts = useSession((s) => s.accounts)
  const currentId = useSession((s) => s.currentId)
  return accounts.find((a) => a.id === currentId) ?? null
}

export function portalFor(role: Role): Portal {
  return role === 'company_admin' ? 'company' : 'employee'
}

export function homeFor(role: Role): '/(company)' | '/(employee)' {
  return role === 'company_admin' ? '/(company)' : '/(employee)'
}
