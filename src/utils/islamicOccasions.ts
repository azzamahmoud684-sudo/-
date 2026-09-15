/**
 * Calculation of upcoming Islamic Occasions using browser's native Intl Islamic (Umm al-Qura) calendar.
 * Completely dynamic: calculates current Hijri date and determines exact next occurrence of each occasion.
 */

export interface IslamicOccasion {
  id: string;
  name: string;
  hijriDay: number;
  hijriMonth: number;
  hijriDateText: string;
  icon: string;
  shortMessage: string;
  description: string;
  gregorianDate: Date;
  daysRemaining: number;
  isNearest?: boolean;
  needsMoonSighting: boolean;
  hijriYear: number;
}

export const HIJRI_MONTH_NAMES: Record<number, string> = {
  1: 'محرم',
  2: 'صفر',
  3: 'ربيع الأول',
  4: 'ربيع الآخر',
  5: 'جمادى الأولى',
  6: 'جمادى الآخرة',
  7: 'رجب',
  8: 'شعبان',
  9: 'رمضان',
  10: 'شوال',
  11: 'ذو القعدة',
  12: 'ذو الحجة',
};

/**
 * Extracts { hDay, hMonth, hYear } from a Gregorian date using Umm al-Qura calendar.
 */
export function getHijriParts(date: Date): { hDay: number; hMonth: number; hYear: number } {
  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    let hDay = 1;
    let hMonth = 1;
    let hYear = 1448;

    for (const p of parts) {
      if (p.type === 'day') hDay = parseInt(p.value, 10);
      if (p.type === 'month') hMonth = parseInt(p.value, 10);
      if (p.type === 'year') hYear = parseInt(p.value, 10);
    }

    return { hDay, hMonth, hYear };
  } catch {
    // Fallback if Intl is unavailable in environment
    const approxHijriYear = 1448;
    return { hDay: 1, hMonth: 1, hYear: approxHijriYear };
  }
}

/**
 * Finds the next Gregorian date when the Hijri calendar reaches targetMonth and targetDay.
 * If that date has already passed in the current Hijri year, finds it in the next year.
 */
export function findNextHijriOccasion(
  baseDate: Date,
  targetMonth: number,
  targetDay: number
): { gregorianDate: Date; hijriYear: number } {
  const current = getHijriParts(baseDate);
  let targetYear = current.hYear;

  // If already passed this Hijri year, move to next Hijri year
  if (
    targetMonth < current.hMonth ||
    (targetMonth === current.hMonth && targetDay < current.hDay)
  ) {
    targetYear += 1;
  }

  // An average Hijri year has ~354.367 days (~29.53 days per month)
  const monthDiff = (targetYear - current.hYear) * 12 + (targetMonth - current.hMonth);
  const approxDays = Math.round(monthDiff * 29.530588 + (targetDay - current.hDay));

  const candidate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  candidate.setDate(candidate.getDate() + approxDays);

  // Exact search within a window of +/- 6 days
  for (let offset = -6; offset <= 6; offset++) {
    const testDate = new Date(candidate);
    testDate.setDate(testDate.getDate() + offset);
    const hp = getHijriParts(testDate);
    if (hp.hYear === targetYear && hp.hMonth === targetMonth && hp.hDay === targetDay) {
      return { gregorianDate: testDate, hijriYear: targetYear };
    }
  }

  // If the target day was 30 but the month ended on 29th
  for (let offset = -6; offset <= 6; offset++) {
    const testDate = new Date(candidate);
    testDate.setDate(testDate.getDate() + offset);
    const hp = getHijriParts(testDate);
    if (
      hp.hYear === targetYear &&
      hp.hMonth === targetMonth &&
      Math.abs(hp.hDay - targetDay) <= 1
    ) {
      return { gregorianDate: testDate, hijriYear: targetYear };
    }
  }

  return { gregorianDate: candidate, hijriYear: targetYear };
}

/**
 * Determines the next White Days (الأيام البيض: 13, 14, 15 of Hijri month).
 */
export function findNextWhiteDays(baseDate: Date): {
  gregorianDate: Date;
  hijriYear: number;
  hijriMonth: number;
  hijriDay: number;
} {
  const current = getHijriParts(baseDate);
  let targetMonth = current.hMonth;
  let targetYear = current.hYear;

  // If we are currently on day 13, 14, or 15, we can show ongoing or next month
  if (current.hDay > 15) {
    targetMonth += 1;
    if (targetMonth > 12) {
      targetMonth = 1;
      targetYear += 1;
    }
  }

  const { gregorianDate, hijriYear } = findNextHijriOccasion(baseDate, targetMonth, 13);
  return {
    gregorianDate,
    hijriYear,
    hijriMonth: targetMonth,
    hijriDay: 13,
  };
}

export function formatDaysRemaining(days: number): string {
  if (days <= 0) return 'اليوم المبارك';
  if (days === 1) return 'غداً';
  if (days === 2) return 'باقي يومان';
  if (days >= 3 && days <= 10) return `باقي ${days} أيام`;
  return `باقي ${days} يوماً`;
}

export function formatGregorianDateArabic(date: Date): string {
  return new Intl.DateTimeFormat('ar-EG', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Calculates all upcoming Islamic occasions sorted by nearest occurrence.
 */
export function getUpcomingIslamicOccasions(now: Date = new Date()): IslamicOccasion[] {
  // Normalize base date to midnight local time for day difference calculations
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // 1. Ramadan (1 Ramadan)
  const ramadanRes = findNextHijriOccasion(now, 9, 1);
  const ramadanDays = Math.max(
    0,
    Math.round((ramadanRes.gregorianDate.getTime() - todayMidnight) / (1000 * 60 * 60 * 24))
  );

  // 2. Day of Arafah (9 Dhul-Hijjah)
  const arafahRes = findNextHijriOccasion(now, 12, 9);
  const arafahDays = Math.max(
    0,
    Math.round((arafahRes.gregorianDate.getTime() - todayMidnight) / (1000 * 60 * 60 * 24))
  );

  // 3. Eid al-Adha (10 Dhul-Hijjah)
  const eidAdhaRes = findNextHijriOccasion(now, 12, 10);
  const eidAdhaDays = Math.max(
    0,
    Math.round((eidAdhaRes.gregorianDate.getTime() - todayMidnight) / (1000 * 60 * 60 * 24))
  );

  // 4. Eid al-Fitr (1 Shawwal)
  const eidFitrRes = findNextHijriOccasion(now, 10, 1);
  const eidFitrDays = Math.max(
    0,
    Math.round((eidFitrRes.gregorianDate.getTime() - todayMidnight) / (1000 * 60 * 60 * 24))
  );

  // 5. Ashura (10 Muharram)
  const ashuraRes = findNextHijriOccasion(now, 1, 10);
  const ashuraDays = Math.max(
    0,
    Math.round((ashuraRes.gregorianDate.getTime() - todayMidnight) / (1000 * 60 * 60 * 24))
  );

  // 6. Islamic New Year (1 Muharram)
  const hijriNewYearRes = findNextHijriOccasion(now, 1, 1);
  const hijriNewYearDays = Math.max(
    0,
    Math.round((hijriNewYearRes.gregorianDate.getTime() - todayMidnight) / (1000 * 60 * 60 * 24))
  );

  // 7. Mawlid al-Nabi (12 Rabi' al-Awwal)
  const mawlidRes = findNextHijriOccasion(now, 3, 12);
  const mawlidDays = Math.max(
    0,
    Math.round((mawlidRes.gregorianDate.getTime() - todayMidnight) / (1000 * 60 * 60 * 24))
  );

  // 8. The White Days (13, 14, 15)
  const whiteDaysRes = findNextWhiteDays(now);
  const whiteDaysDays = Math.max(
    0,
    Math.round((whiteDaysRes.gregorianDate.getTime() - todayMidnight) / (1000 * 60 * 60 * 24))
  );

  const rawOccasions: IslamicOccasion[] = [
    {
      id: 'ramadan',
      name: 'رمضان المبارك',
      icon: '🌙',
      hijriDay: 1,
      hijriMonth: 9,
      hijriYear: ramadanRes.hijriYear,
      hijriDateText: `1 رمضان ${ramadanRes.hijriYear} هـ`,
      shortMessage: 'رمضان يقترب 🤍 اللهم بلغنا رمضان',
      description: 'شهر القرآن والصيام والقيام وليلة القدر المباركة',
      gregorianDate: ramadanRes.gregorianDate,
      daysRemaining: ramadanDays,
      needsMoonSighting: true,
    },
    {
      id: 'arafah',
      name: 'يوم عرفة',
      icon: '🕋',
      hijriDay: 9,
      hijriMonth: 12,
      hijriYear: arafahRes.hijriYear,
      hijriDateText: `9 ذو الحجة ${arafahRes.hijriYear} هـ`,
      shortMessage: 'يوم عرفة يقترب 🕋 استعد ليوم عظيم',
      description: 'أفضل أيام العام، وصيامه يُكفّر ذنوب سنتين',
      gregorianDate: arafahRes.gregorianDate,
      daysRemaining: arafahDays,
      needsMoonSighting: true,
    },
    {
      id: 'eid_adha',
      name: 'عيد الأضحى المبارك',
      icon: '🐑',
      hijriDay: 10,
      hijriMonth: 12,
      hijriYear: eidAdhaRes.hijriYear,
      hijriDateText: `10 ذو الحجة ${eidAdhaRes.hijriYear} هـ`,
      shortMessage: 'العيد يقترب ✨ كل عام وأنتم بخير',
      description: 'يوم الحج الأكبر ونحر الأضاحي والفرح بإتمام المناسك',
      gregorianDate: eidAdhaRes.gregorianDate,
      daysRemaining: eidAdhaDays,
      needsMoonSighting: true,
    },
    {
      id: 'eid_fitr',
      name: 'عيد الفطر المبارك',
      icon: '🤍',
      hijriDay: 1,
      hijriMonth: 10,
      hijriYear: eidFitrRes.hijriYear,
      hijriDateText: `1 شوال ${eidFitrRes.hijriYear} هـ`,
      shortMessage: 'العيد يقترب ✨ تقبل الله طاعاتكم',
      description: 'فرحة إتمام الصيام وجائزة الصائمين بفضل الله ورحمته',
      gregorianDate: eidFitrRes.gregorianDate,
      daysRemaining: eidFitrDays,
      needsMoonSighting: true,
    },
    {
      id: 'white_days',
      name: 'الأيام البيض',
      icon: '🌕',
      hijriDay: 13,
      hijriMonth: whiteDaysRes.hijriMonth,
      hijriYear: whiteDaysRes.hijriYear,
      hijriDateText: `13-15 ${HIJRI_MONTH_NAMES[whiteDaysRes.hijriMonth]} ${whiteDaysRes.hijriYear} هـ`,
      shortMessage: 'الأيام البيض تقترب 🌕 صيام ثلاثة أيام من كل شهر صيام الدهر',
      description: 'صيام اليوم 13 و14 و15 سُنة نبوية مؤكدة كصيام الدهر كله',
      gregorianDate: whiteDaysRes.gregorianDate,
      daysRemaining: whiteDaysDays,
      needsMoonSighting: true,
    },
    {
      id: 'ashura',
      name: 'يوم عاشوراء',
      icon: '🌿',
      hijriDay: 10,
      hijriMonth: 1,
      hijriYear: ashuraRes.hijriYear,
      hijriDateText: `10 محرم ${ashuraRes.hijriYear} هـ`,
      shortMessage: 'عاشوراء تقترب 🌿 يوم نجا الله فيه موسى وصيامه يكفر سنة',
      description: 'اليوم العاشر من محرم، صيامه يُكفّر السنة الماضية',
      gregorianDate: ashuraRes.gregorianDate,
      daysRemaining: ashuraDays,
      needsMoonSighting: true,
    },
    {
      id: 'hijri_new_year',
      name: 'رأس السنة الهجرية',
      icon: '✨',
      hijriDay: 1,
      hijriMonth: 1,
      hijriYear: hijriNewYearRes.hijriYear,
      hijriDateText: `1 محرم ${hijriNewYearRes.hijriYear} هـ`,
      shortMessage: 'عام هجري جديد يقترب ✨ جعله الله عام خير وتوفيق وبركة',
      description: 'ذكرى الهجرة النبوية المباركة واستفتاح العام الهجري الجديد',
      gregorianDate: hijriNewYearRes.gregorianDate,
      daysRemaining: hijriNewYearDays,
      needsMoonSighting: true,
    },
    {
      id: 'mawlid',
      name: 'المولد النبوي الشريف',
      icon: '🤍',
      hijriDay: 12,
      hijriMonth: 3,
      hijriYear: mawlidRes.hijriYear,
      hijriDateText: `12 ربيع الأول ${mawlidRes.hijriYear} هـ`,
      shortMessage: 'ذكرى المولد النبوي تقترب 🤍 صلّوا عليه وسلّموا تسليماً',
      description: 'ذكرى مولد الحبيب المصطفى ورحمة الله للعالمين ﷺ',
      gregorianDate: mawlidRes.gregorianDate,
      daysRemaining: mawlidDays,
      needsMoonSighting: false,
    },
  ];

  // Sort by nearest occasion (ascending daysRemaining)
  rawOccasions.sort((a, b) => a.daysRemaining - b.daysRemaining);

  if (rawOccasions.length > 0) {
    rawOccasions[0].isNearest = true;
  }

  return rawOccasions;
}
