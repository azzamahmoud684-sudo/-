export type TimePeriod = 'morning' | 'dhuhr' | 'asr' | 'maghrib' | 'night';

export type ActivityStatus = 'completed' | 'current' | 'not_started' | 'skipped';

export interface DailyActivity {
  id: string;
  title: string;
  period: TimePeriod;
  status: ActivityStatus;
  type: 'prayer' | 'adhkar' | 'quran' | 'tasbeeh' | 'worship';
  iconName: string;
  subtitle?: string;
  actionTarget?: string; // route or modal target e.g. 'adhkar_morning', 'tasbeeh', 'quran', 'charity', etc.
  defaultTimeRange?: string; // e.g. "04:30 - 11:30"
}

export interface DhikrItem {
  id: string;
  text: string;
  count: number;
  currentCount?: number;
  virtue?: string;
  reference?: string;
}

export interface DhikrCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  items: DhikrItem[];
}

export interface ReminderSetting {
  id: string;
  title: string;
  enabled: boolean;
  time: string; // HH:mm format
  message: string;
  isPrayerTime?: boolean;
  prayerName?: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
}

export interface CharityCause {
  id: string;
  category: string;
  categoryIcon: string;
  orgName: string;
  causeTitle: string;
  shortDescription: string;
  donationUrl: string;
  verifiedBadge?: boolean;
}

export interface UserProfile {
  id: string;
  isGuest: boolean;
  name: string;
  email?: string;
  createdAt: string;
}

export interface UserTask {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

export interface UserProgress {
  userProfile: UserProfile;
  streakDays: number;
  lastActiveDate: string;
  prayersCompletedToday: string[]; // ['fajr', 'dhuhr', ...]
  adhkarItemsCompleted: Record<string, number>; // { morning: 3, evening: 0, sleep: 0, after_prayer: 0 }
  morningAdhkarCompleted: boolean;
  eveningAdhkarCompleted: boolean;
  sleepAdhkarCompleted: boolean;
  totalTasbeehCount: number;
  quranPagesReadToday: number;
  quranGoalPages: number;
  completedActivities: string[]; // IDs of DailyActivity completed today
  skippedActivities: string[];
  weeklyHistory: {
    date: string; // YYYY-MM-DD
    dayName: string;
    completedPercentage: number;
    prayersCount: number;
    adhkarDone: boolean;
    quranPages: number;
    tasbeehCount: number;
  }[];
  unlockedBadges: string[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progressText?: string;
}
