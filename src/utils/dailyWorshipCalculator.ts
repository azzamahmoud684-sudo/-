import { UserProgress } from '../types';

export interface WorshipProgressDetail {
  id: string;
  name: string;
  category: 'prayer' | 'adhkar' | 'quran' | 'tasbeeh' | 'goodness';
  completed: boolean;
}

/**
 * Calculates today's 14 core Islamic acts of worship:
 * 1. صلاة الفجر
 * 2. صلاة الظهر
 * 3. صلاة العصر
 * 4. صلاة المغرب
 * 5. صلاة العشاء
 * 6. صلاة الوتر
 * 7. قيام الليل
 * 8. أذكار الصباح
 * 9. أذكار المساء
 * 10. أذكار النوم
 * 11. ورد القرآن اليومي
 * 12. أذكار بعد الصلاة
 * 13. التسبيح والاستغفار
 * 14. عبادة اليوم / عمل بر
 */
export function getDaily14Worships(progress: UserProgress): {
  completedCount: number;
  totalCount: number;
  percentage: number;
  items: WorshipProgressDetail[];
} {
  const prayers = progress.prayersCompletedToday || [];
  const completedActs = progress.completedActivities || [];

  const items: WorshipProgressDetail[] = [
    // 1-5: الصلوات الخمس المفروضة
    {
      id: 'fajr',
      name: 'صلاة الفجر',
      category: 'prayer',
      completed: prayers.includes('fajr') || completedActs.includes('act-fajr'),
    },
    {
      id: 'dhuhr',
      name: 'صلاة الظهر',
      category: 'prayer',
      completed: prayers.includes('dhuhr') || completedActs.includes('act-dhuhr'),
    },
    {
      id: 'asr',
      name: 'صلاة العصر',
      category: 'prayer',
      completed: prayers.includes('asr') || completedActs.includes('act-asr'),
    },
    {
      id: 'maghrib',
      name: 'صلاة المغرب',
      category: 'prayer',
      completed: prayers.includes('maghrib') || completedActs.includes('act-maghrib'),
    },
    {
      id: 'isha',
      name: 'صلاة العشاء',
      category: 'prayer',
      completed: prayers.includes('isha') || completedActs.includes('act-isha'),
    },

    // 6-7: الوتر وقيام الليل
    {
      id: 'witr',
      name: 'صلاة الوتر',
      category: 'prayer',
      completed: prayers.includes('witr') || completedActs.includes('act-witr'),
    },
    {
      id: 'qiyam',
      name: 'قيام الليل',
      category: 'prayer',
      completed: prayers.includes('qiyam') || completedActs.includes('act-qiyam'),
    },

    // 8-10: أذكار اليوم والليلة
    {
      id: 'morning_adhkar',
      name: 'أذكار الصباح',
      category: 'adhkar',
      completed:
        progress.morningAdhkarCompleted ||
        completedActs.includes('act-morning-adhkar') ||
        (progress.adhkarItemsCompleted?.morning || 0) >= 10,
    },
    {
      id: 'evening_adhkar',
      name: 'أذكار المساء',
      category: 'adhkar',
      completed:
        progress.eveningAdhkarCompleted ||
        completedActs.includes('act-evening-adhkar') ||
        (progress.adhkarItemsCompleted?.evening || 0) >= 10,
    },
    {
      id: 'sleep_adhkar',
      name: 'أذكار النوم',
      category: 'adhkar',
      completed:
        progress.sleepAdhkarCompleted ||
        completedActs.includes('act-sleep-adhkar') ||
        (progress.adhkarItemsCompleted?.sleep || 0) >= 5,
    },

    // 11: ورد القرآن اليومي
    {
      id: 'quran_wird',
      name: 'وردي اليوم (القرآن)',
      category: 'quran',
      completed:
        (progress.quranPagesReadToday > 0 &&
          progress.quranPagesReadToday >= (progress.quranGoalPages || 4)) ||
        completedActs.includes('act-quran-morning'),
    },

    // 12: أذكار ما بعد الصلاة
    {
      id: 'after_prayer_adhkar',
      name: 'أذكار بعد الصلاة',
      category: 'adhkar',
      completed:
        (progress.adhkarItemsCompleted?.after_prayer || 0) > 0 ||
        completedActs.includes('act-adhkar-after-prayer'),
    },

    // 13: التسبيح والاستغفار
    {
      id: 'tasbeeh',
      name: 'التسبيح والذكر (33+)',
      category: 'tasbeeh',
      completed:
        progress.totalTasbeehCount >= 33 ||
        completedActs.includes('act-tasbeeh-midday'),
    },

    // 14: عبادة اليوم / عمل بر وصدقة
    {
      id: 'daily_worship',
      name: 'عبادة اليوم / عمل بر',
      category: 'goodness',
      completed: completedActs.includes('act-daily-worship'),
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = 14;
  const percentage = Math.min(100, Math.round((completedCount / totalCount) * 100));

  return { completedCount, totalCount, percentage, items };
}
