// ═══════════════════════════════════════
// Enums
// ═══════════════════════════════════════

export type Frequency = 'DAILY' | 'WEEKDAYS' | 'WEEKENDS' | 'CUSTOM';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

// ═══════════════════════════════════════
// Categories
// ═══════════════════════════════════════

export interface Category {
  id: string;
  name: string;
  color: string;      // hex color
  icon: string;        // emoji
  isDefault: boolean;
  userId: string | null;
}

// ═══════════════════════════════════════
// Task Lists
// ═══════════════════════════════════════

export interface TaskList {
  id: string;
  name: string;
  icon: string;
  userId: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
}

// ═══════════════════════════════════════
// Recurring Tasks
// ═══════════════════════════════════════

export interface RecurringTask {
  id: string;
  userId: string;
  listId: string | null;
  categoryId: string | null;
  title: string;
  icon: string;
  frequency: Frequency;
  daysOfWeek: number[];     // 0=Sun, 1=Mon, ..., 6=Sat
  timesPerDay: number;       // default 1, for "drink water x8" etc.
  timeOfDay: string | null;  // "09:00" — suggested time
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
  sortOrder: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations (optional, populated on fetch)
  category?: Category;
  list?: TaskList;
  completions?: TaskCompletion[];
}

export interface CreateRecurringTaskInput {
  title: string;
  icon?: string;
  listId?: string;
  categoryId?: string;
  frequency?: Frequency;
  daysOfWeek?: number[];
  timesPerDay?: number;
  timeOfDay?: string;
  reminderEnabled?: boolean;
  reminderMinutesBefore?: number;
}

export interface UpdateRecurringTaskInput extends Partial<CreateRecurringTaskInput> {
  archived?: boolean;
  sortOrder?: number;
}

// ═══════════════════════════════════════
// Task Completions
// ═══════════════════════════════════════

export interface TaskCompletion {
  id: string;
  recurringTaskId: string;
  userId: string;
  date: string;              // ISO date, normalized to midnight
  completedCount: number;    // how many times completed (for multi-per-day)
  skipped: boolean;
  completedAt: string | null;
  note: string | null;
  // Relations
  recurringTask?: RecurringTask;
}

export interface ToggleCompletionInput {
  action: 'complete' | 'skip' | 'reset';
}

// ═══════════════════════════════════════
// One-off Tasks
// ═══════════════════════════════════════

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  dueDate: string | null;
  priority: Priority;
  status: TaskStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  categoryId?: string;
  dueDate?: string;
  priority?: Priority;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: TaskStatus;
}

// ═══════════════════════════════════════
// Today View
// ═══════════════════════════════════════

export interface TodayData {
  date: string;
  recurringTasks: (RecurringTask & {
    todayCompletion: TaskCompletion;
  })[];
  dueTasks: Task[];
  stats: {
    totalRecurring: number;
    completedRecurring: number;
    skippedRecurring: number;
  };
}

// ═══════════════════════════════════════
// Analytics
// ═══════════════════════════════════════

export interface HeatmapDay {
  date: string;
  completionRate: number;   // 0-1
  completed: number;
  total: number;
}

export interface PerTaskAnalytics {
  taskId: string;
  taskTitle: string;
  taskIcon: string;
  completedDays: number;
  skippedDays: number;
  missedDays: number;
  totalDays: number;
  completionRate: number;    // 0-1
  currentStreak: number;
  longestStreak: number;
}

export interface DailyTrend {
  date: string;
  completionRate: number;
  completed: number;
  total: number;
}

export interface TimeDistribution {
  hour: number;              // 0-23
  count: number;
}

export interface SkipAnalysis {
  taskId: string;
  taskTitle: string;
  taskIcon: string;
  completed: number;
  skipped: number;
  missed: number;
}

export interface AnalyticsData {
  heatmap: HeatmapDay[];
  perTask: PerTaskAnalytics[];
  dailyTrend: DailyTrend[];
  timeDistribution: TimeDistribution[];
  skipAnalysis: SkipAnalysis[];
}

// ═══════════════════════════════════════
// API Response wrapper
// ═══════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ═══════════════════════════════════════
// Notifications / Reminders
// ═══════════════════════════════════════

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  icon: string | null;
  url: string | null;
  source: string;
  sentAt: string;
  deliveredAt: string | null;
  clickedAt: string | null;
  read: boolean;
  errorText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RemindersResponse {
  notifications: Notification[];
  meta: {
    nextCursor: string | null;
    total: number;
    unreadCount: number;
  };
}
