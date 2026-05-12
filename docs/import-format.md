# JSON Import Format

Send a `POST /api/tasks/import` request with `Content-Type: application/json`.

## Top-level structure

```json
{
  "tasks": [...],
  "recurringTasks": [...]
}
```

Both arrays are optional — include only what you need.

---

## Default Categories

These categories are available out of the box. Reference them by name using `categoryName`:

| Icon | Name |
|------|------|
| 🏃 | Health |
| 💼 | Work |
| 📚 | Learning |
| 🧘 | Mindfulness |
| 👥 | Social |
| 💰 | Finance |
| 🏠 | Home |
| 🎨 | Creative |

---

## One-off Tasks (`tasks`)

| Field | Type | Default | Required |
|-------|------|---------|----------|
| `title` | string | — | **yes** |
| `categoryName` | string (default category name) | `null` | no |
| `description` | string or null | `null` | no |
| `priority` | `"LOW"` \| `"MEDIUM"` \| `"HIGH"` | `"MEDIUM"` | no |
| `status` | `"TODO"` \| `"IN_PROGRESS"` \| `"DONE"` | `"TODO"` | no |
| `dueDate` | string (ISO date) or null | `null` | no |
| `completedAt` | string (ISO datetime) or null | `null` | no |

**Example:**
```json
{
  "tasks": [
    { "title": "Fix login bug", "priority": "HIGH", "categoryName": "Work" },
    { "title": "Buy groceries", "priority": "MEDIUM", "status": "DONE" }
  ]
}
```

---

## Recurring Tasks (`recurringTasks`)

| Field | Type | Default | Required |
|-------|------|---------|----------|
| `title` | string | — | **yes** |
| `categoryName` | string (default category name) | `null` | no |
| `icon` | string (emoji) | `"✅"` | no |
| `frequency` | `"DAILY"` \| `"WEEKDAYS"` \| `"WEEKENDS"` \| `"CUSTOM"` | `"DAILY"` | no |
| `daysOfWeek` | number[] | `[]` | no |
| `timesPerDay` | number | `1` | no |
| `timeOfDay` | string or null | `null` | no |
| `reminderEnabled` | boolean | `false` | no |
| `reminderMinutesBefore` | number | `15` | no |
| `archived` | boolean | `false` | no |

### `daysOfWeek`

Only used when `frequency` is `"CUSTOM"`. Values:

| Number | Day |
|--------|-----|
| `0` | Sunday |
| `1` | Monday |
| `2` | Tuesday |
| `3` | Wednesday |
| `4` | Thursday |
| `5` | Friday |
| `6` | Saturday |

**Example:**
```json
{
  "recurringTasks": [
    { "title": "Workout", "frequency": "DAILY", "timeOfDay": "06:00", "icon": "🏋️", "categoryName": "Health" },
    { "title": "Standup", "frequency": "WEEKDAYS", "timeOfDay": "09:30", "categoryName": "Work" },
    { "title": "Weekly review", "frequency": "CUSTOM", "daysOfWeek": [0], "timeOfDay": "10:00" }
  ]
}
```

---

## Full example

```json
{
  "tasks": [
    { "title": "Fix bug", "priority": "HIGH", "categoryName": "Work" }
  ],
  "recurringTasks": [
    { "title": "Workout", "frequency": "DAILY", "timeOfDay": "06:00", "categoryName": "Health" },
    { "title": "HMH 1", "frequency": "DAILY" },
    { "title": "HMH 2", "frequency": "DAILY" }
  ]
}
```
