# Connecting — mobile

React Native (Expo SDK 57, expo-router) app for the **Company** and **Employee**
portals. Platform Admin stays web-only: nobody suspends a tenant from a phone.

```bash
npm run web        # runs in a browser via react-native-web
npm run ios        # needs macOS
npm run android
```

## Screens

| Route | What it does |
|---|---|
| `(auth)/sign-in` | Email + password, field validation, demo accounts |
| `(auth)/register` | Name, email, company, role, password + strength, terms |
| `(auth)/forgot-password` | Reset request, with a neutral "if an account exists" reply |
| `/account` | Profile and **sign out** |
| `(company)/index` | Team overview — check-in stats, blockers, review queue, sprint burn |
| `(company)/check-ins` | Who responded, expand anyone to read their verified answers |
| `(company)/board` | Sprint board, one status at a time |
| `(company)/backlog` | Epic-grouped backlog, sprint capacity |
| `(employee)/index` | Today — check-in prompt or summary, tasks, schedule |
| `(employee)/tasks` | My tasks, tap the checkbox to mark done |
| `(employee)/schedule` | Meetings, with AI-run ones marked |
| `/issue/[key]` | Issue detail — **review, mark done, reassign**, comment, activity |
| `/check-in` | The AI check-in: three questions, then the verification result |
| `/new-issue` | **Give someone a new task** — type, priority, points, assignee, sprint |

## Auth

`app/_layout.tsx` holds a single guard: anything under `(auth)` is public,
everything else needs a session. Adding a route makes it protected by default.
The guard waits for AsyncStorage to hydrate before redirecting — otherwise a
signed-in person gets bounced to sign-in on every cold start.

Sign-in and register land on the dashboard for the account's **role**, not the
one picked on the form.

**Credentials are checked on the device**, which is only acceptable because
there is no server. Passwords sit in AsyncStorage in plain text. `signIn` and
`register` are shaped as async calls returning an error string, so replacing
their bodies with API calls is a change of body, not of signature. Do that
before this goes anywhere near a real user.

## Decisions worth knowing

**The board is paged, not columned.** Five side-by-side columns on a 390px
screen means everything is either unreadable or needs two-axis scrolling. Status
is a chip row; moving an issue is `Back` / `Advance` on the card, because there
is nothing to drag *to* in a paged view.

**Marking done is on the row.** It is the most common action in the app, so it
is a tap target in the task list rather than a trip into the detail screen.

**The stores are hand-copied from the web app** (`src/store/issues.ts`,
`src/store/checkin.ts`). Both are mock data standing in for the API, so wiring a
shared package for something with a known expiry date is not worth it — when the
backend lands, both apps call it and these become thin query layers. Until then,
**keep any model change in step across the two.**

**Tokens are ported, not shared** (`src/theme/tokens.ts`) — React Native has no
CSS custom properties. The four-way split of the brand orange
(`brand` / `brandInk` / `primary` / `brandPanel`) is carried over deliberately;
see the web app's `UI_GUIDE.md` for why each step exists.

## Not done yet

- Only run on **web** (react-native-web). Not yet built or tested on a real
  iOS/Android device or simulator.
- No push notifications, offline cache or biometric sign-in.
- Sprint history and burndown charts are web-only.
