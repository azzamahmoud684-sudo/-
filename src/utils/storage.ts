import { UserProgress, ReminderSetting, UserProfile, UserTask } from '../types';
import { INITIAL_REMINDERS } from '../data/remindersData';
import { BASE_DAILY_ACTIVITIES } from '../data/dailyWorship';

const STORAGE_KEY_PROGRESS = 'ouns_user_progress_real_v3';
const STORAGE_KEY_REMINDERS = 'ouns_reminders_settings_v3';
const STORAGE_KEY_TASKS_PREFIX = 'ouns_user_tasks_v1_';

export function generateUserId(): string {
  return 'usr_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

export function getTodayDateString(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getArabicDayName(date: Date): string {
  const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return daysOfWeek[date.getDay()];
}

/**
 * Clean initial state for a new user or a new day:
 * STRICT RULE: Starts at ZERO. Nothing is completed or assumed until the user does it.
 */
export function getInitialProgress(): UserProgress {
  const todayStr = getTodayDateString();

  // Clean empty weekly history for the last 7 days
  const weeklyHistory = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weeklyHistory.push({
      date: getTodayDateString(d),
      dayName: getArabicDayName(d),
      completedPercentage: 0,
      prayersCount: 0,
      adhkarDone: false,
      quranPages: 0,
      tasbeehCount: 0,
    });
  }

  const defaultProfile: UserProfile = {
    id: generateUserId(),
    isGuest: true,
    name: 'متابع أُنس',
    createdAt: todayStr,
  };

  return {
    userProfile: defaultProfile,
    streakDays: 0, // Starts at 0 until user records real worship
    lastActiveDate: todayStr,
    prayersCompletedToday: [], // ZERO prayers completed initially
    adhkarItemsCompleted: {
      morning: 0,
      evening: 0,
      sleep: 0,
      after_prayer: 0,
    },
    morningAdhkarCompleted: false, // NOT completed until user does it
    eveningAdhkarCompleted: false,
    sleepAdhkarCompleted: false,
    totalTasbeehCount: 0, // Starts at 0
    quranPagesReadToday: 0, // Starts at 0 pages
    quranGoalPages: 4, // Goal is 4 pages, but progress is 0
    completedActivities: [], // Empty list of completed activities
    skippedActivities: [],
    weeklyHistory,
    unlockedBadges: ['badge-start'], // Start badge only
  };
}

export function loadUserProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    const todayStr = getTodayDateString();

    if (!raw) {
      const initial = getInitialProgress();
      saveUserProgress(initial);
      return initial;
    }

    const parsed: UserProgress = JSON.parse(raw);

    // Ensure backwards compatibility with structure
    if (!parsed.adhkarItemsCompleted) {
      parsed.adhkarItemsCompleted = { morning: 0, evening: 0, sleep: 0, after_prayer: 0 };
    }
    if (!parsed.userProfile) {
      parsed.userProfile = {
        id: generateUserId(),
        isGuest: true,
        name: 'متابع أُنس',
        createdAt: todayStr,
      };
    } else if (!parsed.userProfile.id) {
      parsed.userProfile.id = generateUserId();
    }

    // Check if the calendar day rolled over:
    if (parsed.lastActiveDate !== todayStr) {
      // 1. Calculate yesterday's actual stats and update streak
      const wasYesterdayActive = parsed.completedActivities.length > 0 ||
        parsed.prayersCompletedToday.length > 0 ||
        parsed.quranPagesReadToday > 0;

      // Update weekly history with yesterday's actual numbers
      const prevDateIndex = parsed.weeklyHistory.findIndex((h) => h.date === parsed.lastActiveDate);
      if (prevDateIndex !== -1) {
        const totalItems = BASE_DAILY_ACTIVITIES.length;
        const compPct = Math.min(100, Math.round((parsed.completedActivities.length / totalItems) * 100));
        parsed.weeklyHistory[prevDateIndex] = {
          date: parsed.lastActiveDate,
          dayName: parsed.weeklyHistory[prevDateIndex].dayName,
          completedPercentage: compPct,
          prayersCount: parsed.prayersCompletedToday.length,
          adhkarDone: parsed.morningAdhkarCompleted || parsed.eveningAdhkarCompleted,
          quranPages: parsed.quranPagesReadToday,
          tasbeehCount: parsed.totalTasbeehCount,
        };
      }

      // Check date difference
      const lastDate = new Date(parsed.lastActiveDate);
      const currDate = new Date(todayStr);
      const diffDays = Math.round(Math.abs(currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1 && wasYesterdayActive) {
        parsed.streakDays += 1;
      } else if (diffDays > 1) {
        // Streak interrupted
        parsed.streakDays = wasYesterdayActive ? 1 : 0;
      }

      // 2. Clean slate for TODAY - NEVER carry over completed activities
      parsed.lastActiveDate = todayStr;
      parsed.prayersCompletedToday = [];
      parsed.morningAdhkarCompleted = false;
      parsed.eveningAdhkarCompleted = false;
      parsed.sleepAdhkarCompleted = false;
      parsed.completedActivities = [];
      parsed.skippedActivities = [];
      parsed.quranPagesReadToday = 0;
      parsed.adhkarItemsCompleted = { morning: 0, evening: 0, sleep: 0, after_prayer: 0 };

      // Ensure today is in weekly history
      const todayHistoryIndex = parsed.weeklyHistory.findIndex((h) => h.date === todayStr);
      if (todayHistoryIndex === -1) {
        parsed.weeklyHistory.push({
          date: todayStr,
          dayName: getArabicDayName(currDate),
          completedPercentage: 0,
          prayersCount: 0,
          adhkarDone: false,
          quranPages: 0,
          tasbeehCount: 0,
        });
        // Keep only last 7 days
        if (parsed.weeklyHistory.length > 7) {
          parsed.weeklyHistory = parsed.weeklyHistory.slice(-7);
        }
      }

      saveUserProgress(parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Error loading progress from storage:', err);
    return getInitialProgress();
  }
}

export function saveUserProgress(progress: UserProgress): void {
  try {
    // Also update today's entry in weeklyHistory
    const todayStr = progress.lastActiveDate;
    const historyIndex = progress.weeklyHistory.findIndex((h) => h.date === todayStr);
    const totalActivities = BASE_DAILY_ACTIVITIES.length;
    const currentPct = Math.min(100, Math.round((progress.completedActivities.length / totalActivities) * 100));

    if (historyIndex !== -1) {
      progress.weeklyHistory[historyIndex] = {
        ...progress.weeklyHistory[historyIndex],
        completedPercentage: currentPct,
        prayersCount: progress.prayersCompletedToday.length,
        adhkarDone: progress.morningAdhkarCompleted || progress.eveningAdhkarCompleted,
        quranPages: progress.quranPagesReadToday,
        tasbeehCount: progress.totalTasbeehCount,
      };
    }

    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
  } catch (err) {
    console.error('Error saving progress:', err);
  }
}

export function loadReminders(): ReminderSetting[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REMINDERS);
    if (!raw) return INITIAL_REMINDERS;
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_REMINDERS;
  }
}

export function saveReminders(reminders: ReminderSetting[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(reminders));
  } catch (err) {
    console.error('Error saving reminders:', err);
  }
}

export function resetTodayProgress(current: UserProgress): UserProgress {
  const reset: UserProgress = {
    ...current,
    prayersCompletedToday: [],
    quranPagesReadToday: 0,
    completedActivities: [],
    skippedActivities: [],
    morningAdhkarCompleted: false,
    eveningAdhkarCompleted: false,
    sleepAdhkarCompleted: false,
    adhkarItemsCompleted: { morning: 0, evening: 0, sleep: 0, after_prayer: 0 },
  };
  saveUserProgress(reset);
  return reset;
}

// ---------------------------------------------------------------------------
// Personal Daily Tasks Storage (Isolated per User & Scoped by Date)
// ---------------------------------------------------------------------------

export function getUserTasksStorageKey(userId: string): string {
  const safeId = (userId || 'guest').trim();
  return `${STORAGE_KEY_TASKS_PREFIX}${safeId}`;
}

export function loadAllUserTasks(userId: string): UserTask[] {
  try {
    const raw = localStorage.getItem(getUserTasksStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as UserTask[];
  } catch (err) {
    console.error('Error loading tasks for user:', userId, err);
    return [];
  }
}

export function saveAllUserTasks(userId: string, tasks: UserTask[]): void {
  try {
    localStorage.setItem(getUserTasksStorageKey(userId), JSON.stringify(tasks));
  } catch (err) {
    console.error('Error saving tasks for user:', userId, err);
  }
}

export function loadUserTasksForDate(userId: string, dateStr: string = getTodayDateString()): UserTask[] {
  const all = loadAllUserTasks(userId);
  return all.filter((t) => t.date === dateStr);
}

export function createUserTask(
  userId: string,
  text: string,
  dateStr: string = getTodayDateString()
): { newTask: UserTask; allTasks: UserTask[] } {
  const all = loadAllUserTasks(userId);
  const newTask: UserTask = {
    id: 'tsk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
    userId,
    date: dateStr,
    text: text.trim(),
    completed: false, // strictly false initially; never auto-completed
    createdAt: Date.now(),
  };
  const updated = [newTask, ...all];
  saveAllUserTasks(userId, updated);
  return { newTask, allTasks: updated };
}

export function updateUserTaskText(userId: string, taskId: string, newText: string): UserTask[] {
  const all = loadAllUserTasks(userId);
  const updated = all.map((task) => {
    if (task.id === taskId) {
      return { ...task, text: newText.trim() };
    }
    return task;
  });
  saveAllUserTasks(userId, updated);
  return updated;
}

export function toggleUserTaskCompleted(userId: string, taskId: string): UserTask[] {
  const all = loadAllUserTasks(userId);
  const updated = all.map((task) => {
    if (task.id === taskId) {
      const nextCompleted = !task.completed;
      return {
        ...task,
        completed: nextCompleted,
        completedAt: nextCompleted ? Date.now() : undefined,
      };
    }
    return task;
  });
  saveAllUserTasks(userId, updated);
  return updated;
}

export function deleteUserTask(userId: string, taskId: string): UserTask[] {
  const all = loadAllUserTasks(userId);
  const updated = all.filter((task) => task.id !== taskId);
  saveAllUserTasks(userId, updated);
  return updated;
}
