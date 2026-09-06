export interface PrayerTimeInfo {
  id: 'fajr' | 'shuruq' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  name: string;
  time: string; // "04:42"
  timestamp: Date;
  isPassed: boolean;
  isNext: boolean;
}

export function getTodayPrayerTimes(baseDate: Date = new Date()): PrayerTimeInfo[] {
  // Approximate standard calculation for Cairo / Mecca standard times (adaptable offset)
  // fajr ~ 04:35, shuruq ~ 06:00, dhuhr ~ 12:45, asr ~ 16:15, maghrib ~ 19:10, isha ~ 20:30
  const y = baseDate.getFullYear();
  const m = baseDate.getMonth();
  const d = baseDate.getDate();

  const prayers = [
    { id: 'fajr' as const, name: 'الفجر', h: 4, min: 38 },
    { id: 'shuruq' as const, name: 'الشروق', h: 6, min: 2 },
    { id: 'dhuhr' as const, name: 'الظهر', h: 12, min: 46 },
    { id: 'asr' as const, name: 'العصر', h: 16, min: 18 },
    { id: 'maghrib' as const, name: 'المغرب', h: 19, min: 14 },
    { id: 'isha' as const, name: 'العشاء', h: 20, min: 32 },
  ];

  const now = baseDate.getTime();

  const list: PrayerTimeInfo[] = prayers.map((p) => {
    const pDate = new Date(y, m, d, p.h, p.min, 0);
    const timeStr = `${String(p.h).padStart(2, '0')}:${String(p.min).padStart(2, '0')}`;
    return {
      id: p.id,
      name: p.name,
      time: timeStr,
      timestamp: pDate,
      isPassed: pDate.getTime() < now,
      isNext: false,
    };
  });

  // Find next prayer (excluding shuruq for prayer obligations, but shuruq is useful)
  const nextIdx = list.findIndex((p) => p.timestamp.getTime() > now);
  if (nextIdx !== -1) {
    list[nextIdx].isNext = true;
  } else {
    // next is tomorrow's Fajr
    list[0].isNext = true;
  }

  return list;
}

export function getNextPrayerCountdown(baseDate: Date = new Date()): {
  nextPrayerName: string;
  nextPrayerTime: string;
  remainingHours: number;
  remainingMinutes: number;
  remainingSeconds: number;
  formattedCountdown: string;
} {
  const prayers = getTodayPrayerTimes(baseDate);
  const now = baseDate.getTime();

  let next = prayers.find((p) => p.id !== 'shuruq' && p.timestamp.getTime() > now);

  let targetTime: number;
  let prayerName: string;
  let prayerTimeStr: string;

  if (next) {
    targetTime = next.timestamp.getTime();
    prayerName = next.name;
    prayerTimeStr = next.time;
  } else {
    // Tomorrow Fajr
    const tomorrowFajr = new Date(baseDate);
    tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
    tomorrowFajr.setHours(4, 38, 0, 0);
    targetTime = tomorrowFajr.getTime();
    prayerName = 'الفجر';
    prayerTimeStr = '04:38';
  }

  const diffMs = Math.max(0, targetTime - now);
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedCountdown = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    nextPrayerName: prayerName,
    nextPrayerTime: prayerTimeStr,
    remainingHours: hours,
    remainingMinutes: minutes,
    remainingSeconds: seconds,
    formattedCountdown,
  };
}
