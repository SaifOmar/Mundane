# ProjectTasks — Daily Task Tracker with Analytics

A personal task management app built around one core idea: **recurring daily tasks should be stupidly easy to manage and track over time.**

## User Review Required

> [!IMPORTANT]
> **Auth Provider: Better Auth** — Self-hosted, TypeScript-first, works with Prisma, no external service dependency. Your data stays in your DB. This replaces Clerk which you used in the CV project. Are you okay with this?

> [!IMPORTANT]
> **Database: SQLite via Prisma** — Since this is a personal app ("just for my use case"), SQLite keeps things simple — no Postgres/MySQL server to manage. If you want to deploy this on a VPS later, we can easily swap to Postgres. Good with SQLite for now?

> [!WARNING]
> **Notifications approach**: Browser Push Notifications via the Web Push API + Service Worker. This means notifications work even when the tab is closed (as long as the browser is running). No email service, no Twilio, no third-party dependency. The tradeoff: they only work in the browser, not on your phone unless you use the app as a PWA. Is that acceptable, or do you also need mobile push?

## Open Questions

1. **Recurring task frequency** — Is it always "every single day"? Or do you also need "every weekday", "Mon/Wed/Fri", "weekly on Sundays", etc.? This affects the data model.

2. **Time tracking** — When you say "what time" in analytics, do you mean:
   - (a) What time of day you typically complete tasks? (auto-tracked when you check them off)
   - (b) How long each task takes? (requires a start/stop timer)
   - I'm assuming (a) — just timestamp when you check off.

3. **Task categories/tags** — Do you want to group recurring tasks? (e.g., "Health", "Work", "Learning") Or is a flat list fine?

4. **Multiple "lists"** — Do you ever want separate sets of daily tasks? (e.g., "Workday routine" vs "Weekend routine") Or one global list?

5. **Design vibe** — Your CV app uses a clean/minimal style. For this app, are you thinking:
   - Dark mode by default? Light mode? Both with toggle?
   - Any color preferences? (I'm thinking a warm dark theme with amber/orange accents — feels productive without being sterile)

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | React 19 + Vite + TypeScript | Matches your existing stack |
| **Styling** | Tailwind CSS v4 | Matches your existing stack |
| **Backend** | Express 5 + TypeScript | Matches your existing stack |
| **ORM** | Prisma | Matches your existing stack |
| **Database** | SQLite (dev) / Postgres (prod-ready) | Zero setup, swap later |
| **Auth** | Better Auth | Self-hosted, Prisma adapter, no vendor lock-in |
| **Charts** | Recharts + custom heatmap | Lightweight, React-native, great for Wakatime-style viz |
| **Notifications** | Web Push API + Service Worker | No third-party, works with browser closed |
| **Monorepo** | npm workspaces | Same pattern as your CV project |

---

## Data Model

```prisma
// Managed by Better Auth
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sessions       Session[]
  accounts       Account[]
  recurringTasks RecurringTask[]
  tasks          Task[]
  completions    TaskCompletion[]
  pushSubs       PushSubscription[]
}

// Better Auth managed
model Session { ... }
model Account { ... }

// ═══════════════════════════════════════
// CORE: Recurring Tasks
// ═══════════════════════════════════════

model RecurringTask {
  id          String   @id @default(cuid())
  userId      String
  title       String
  icon        String?           // emoji for quick visual scanning
  frequency   Frequency @default(DAILY)
  daysOfWeek  Int[]             // [0-6] for custom schedules, empty = every day
  timeOfDay   String?           // "09:00" — suggested time / reminder anchor
  reminderEnabled Boolean @default(false)
  reminderMinutesBefore Int @default(15)
  sortOrder   Int      @default(0)
  archived    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])
  completions TaskCompletion[]
}

enum Frequency {
  DAILY
  WEEKDAYS
  WEEKENDS
  CUSTOM     // uses daysOfWeek
}

// One row per task per day — the heart of analytics
model TaskCompletion {
  id              String   @id @default(cuid())
  recurringTaskId String
  userId          String
  date            DateTime // normalized to midnight, e.g. 2026-05-12T00:00:00Z
  completed       Boolean  @default(false)
  skipped         Boolean  @default(false)
  completedAt     DateTime?
  note            String?

  recurringTask   RecurringTask @relation(fields: [recurringTaskId], references: [id])
  user            User          @relation(fields: [userId], references: [id])

  @@unique([recurringTaskId, date])
}

// ═══════════════════════════════════════
// SECONDARY: One-off Tasks
// ═══════════════════════════════════════

model Task {
  id          String    @id @default(cuid())
  userId      String
  title       String
  description String?
  dueDate     DateTime?
  priority    Priority  @default(MEDIUM)
  status      TaskStatus @default(TODO)
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id])
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

// ═══════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
}
```

---

## UX Flow — The Core Experience

### Home Screen: "Today"

This is what you see when you open the app. Nothing else. Just today.

```
┌──────────────────────────────────────────┐
│  ☀️ Tuesday, May 12            [≡] [👤] │
│                                          │
│  ─── Daily Tasks ──────────── 3/5 done ──│
│                                          │
│  [✓] 🏋️ Exercise                        │
│  [✓] 📖 Read 30 min                     │
│  [✓] 💻 Code review                     │
│  [ ] 🧘 Meditate                        │
│  [ ] 📝 Journal                         │
│                                          │
│  ─── Other Tasks ────────────────────────│
│                                          │
│  [ ] Fix auth bug in CV app     🔴 High │
│  [ ] Buy groceries              🟡 Med  │
│                                          │
│  ──────────────────── [+ Add Task] ──────│
└──────────────────────────────────────────┘
```

**Key interactions:**
- **Tap checkbox** → done. That's it. One tap.
- **Long press / right-click** → skip (marks as intentionally skipped, different from not done)
- **"+ Add Task"** → inline quick-add for one-off tasks
- **Swipe right on a daily task** → add a note for today's completion
- **[≡] menu** → Manage recurring tasks, Analytics, Settings

### Manage Recurring Tasks

Dead simple form:
- Title + emoji picker
- Frequency dropdown (Daily / Weekdays / Weekends / Custom)
- Optional: time of day + reminder toggle
- Drag to reorder

### Analytics Dashboard

Wakatime-inspired. Four main visualizations:

1. **Activity Heatmap** (GitHub-style contribution grid)
   - Color intensity = completion percentage for that day
   - Hover shows "4/5 tasks completed"

2. **Per-Task Completion Rate** (horizontal bar chart)
   - Each task as a bar, showing % completed over last 30/90/all days
   - Sorted by completion rate — see your strongest and weakest habits

3. **Daily Completion Trend** (line/area chart)
   - X-axis: days, Y-axis: completion %
   - Shows your consistency over time

4. **Time-of-Day Distribution** (radial or bar chart)
   - When do you typically check things off?
   - "You're most productive at 10am"

5. **Skip Analysis** (donut chart)
   - Per task: completed vs skipped vs missed
   - "You skip Meditation 40% of the time"

**Time range selector**: 7d / 30d / 90d / All

---

## Project Structure

```
ProjectTasks/
├── package.json              # workspace root
├── types/                    # shared TypeScript types
│   ├── package.json
│   └── index.ts
├── Back-End/
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── index.ts          # Express app entry
│       ├── auth.ts           # Better Auth config
│       ├── routes/
│       │   ├── recurring.routes.ts
│       │   ├── tasks.routes.ts
│       │   ├── completions.routes.ts
│       │   ├── analytics.routes.ts
│       │   └── notifications.routes.ts
│       ├── controllers/
│       │   ├── recurring.controller.ts
│       │   ├── tasks.controller.ts
│       │   ├── completions.controller.ts
│       │   ├── analytics.controller.ts
│       │   └── notifications.controller.ts
│       ├── services/
│       │   ├── analytics.service.ts    # heavy aggregation logic
│       │   ├── scheduler.service.ts    # cron for daily task generation + reminders
│       │   └── push.service.ts         # web-push wrapper
│       └── middleware/
│           └── auth.middleware.ts
└── Front-End/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    ├── public/
    │   └── sw.js             # Service Worker for push notifications
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css         # Tailwind + design tokens
        ├── lib/
        │   ├── auth-client.ts    # Better Auth React client
        │   └── api.ts            # fetch wrapper
        ├── hooks/
        │   ├── useToday.ts       # today's tasks + completions
        │   ├── useRecurring.ts   # CRUD recurring tasks
        │   ├── useTasks.ts       # CRUD one-off tasks
        │   └── useAnalytics.ts   # fetch analytics data
        ├── pages/
        │   ├── TodayPage.tsx     # THE main page
        │   ├── ManagePage.tsx    # manage recurring tasks
        │   ├── AnalyticsPage.tsx # charts dashboard
        │   ├── TasksPage.tsx     # one-off tasks list
        │   ├── SettingsPage.tsx  # notifications, account
        │   ├── LoginPage.tsx
        │   └── SignupPage.tsx
        └── components/
            ├── layout/
            │   ├── Sidebar.tsx
            │   └── TopBar.tsx
            ├── today/
            │   ├── DailyChecklist.tsx
            │   ├── TaskCheckItem.tsx
            │   └── QuickAddTask.tsx
            ├── recurring/
            │   ├── RecurringTaskForm.tsx
            │   └── RecurringTaskList.tsx
            ├── tasks/
            │   ├── TaskCard.tsx
            │   └── TaskForm.tsx
            ├── analytics/
            │   ├── ActivityHeatmap.tsx
            │   ├── CompletionRateChart.tsx
            │   ├── DailyTrendChart.tsx
            │   ├── TimeDistributionChart.tsx
            │   └── SkipAnalysisChart.tsx
            └── ui/
                ├── Button.tsx
                ├── Input.tsx
                ├── Modal.tsx
                ├── EmojiPicker.tsx
                └── DateRangeSelector.tsx
```

---

## Proposed Changes — Build Phases

### Phase 1: Foundation (scaffold + auth + DB)

#### [NEW] Root workspace setup
- `package.json` with npm workspaces (`types`, `Back-End`, `Front-End`)
- Shared `types/` package

#### [NEW] Back-End scaffold
- Express 5 + TypeScript + Prisma + SQLite
- Better Auth integration with Prisma adapter
- Auth middleware for protecting routes
- Basic health check endpoint

#### [NEW] Front-End scaffold  
- Vite + React 19 + TypeScript + Tailwind v4
- Better Auth React client setup
- Login/Signup pages
- Route protection (redirect to login if not authed)
- Design system: color tokens, typography, base components

---

### Phase 2: Core — Recurring Tasks + Today View

#### [NEW] Recurring Tasks CRUD
- Backend: full CRUD routes + controllers for `RecurringTask`
- Frontend: `ManagePage.tsx` with form + sortable list
- Emoji picker for task icons

#### [NEW] Today Page + Daily Completions
- Backend: `GET /api/today` — returns today's recurring tasks with completion status, auto-creates `TaskCompletion` rows for today if they don't exist
- Backend: `PATCH /api/completions/:id` — toggle complete/skip
- Frontend: `TodayPage.tsx` — the checklist UI (see mockup above)
- Single-click complete, right-click skip

---

### Phase 3: One-off Tasks

#### [NEW] Tasks CRUD
- Backend: CRUD for `Task` model
- Frontend: `TasksPage.tsx` — simple list with quick-add
- Show on Today page if due today

---

### Phase 4: Analytics Dashboard

#### [NEW] Analytics API
- `GET /api/analytics/heatmap?range=90d` — daily completion percentages
- `GET /api/analytics/per-task?range=30d` — per-task completion/skip rates  
- `GET /api/analytics/trend?range=30d` — daily trend line
- `GET /api/analytics/time-distribution?range=30d` — hour-of-day histogram
- `GET /api/analytics/skip-analysis?range=30d` — per-task skip breakdown

#### [NEW] Analytics Frontend
- Recharts-based visualizations
- Activity heatmap (custom component)
- Date range selector (7d / 30d / 90d / All)

---

### Phase 5: Notifications

#### [NEW] Push Notifications
- Backend: `web-push` library + VAPID key generation
- Service Worker registration
- Backend scheduler: node-cron job that checks upcoming reminders and sends push
- Frontend: notification permission request flow in Settings
- Reminder preferences per recurring task

---

### Phase 6: Polish

- PWA manifest (installable on phone)
- Responsive mobile layout
- Keyboard shortcuts (space to toggle, arrow keys to navigate)
- Dark/light mode toggle
- Loading states, error boundaries, empty states

---

## Verification Plan

### Automated Tests
- Backend: test auth flow, CRUD operations, analytics aggregation queries
- Run `npm run build` on both packages to verify TypeScript compilation

### Manual Verification
- Browser testing via browser tool:
  - Sign up → create recurring tasks → check off today → verify analytics
  - Test notification permission flow
  - Test responsive layout
- Verify Service Worker registration in DevTools
