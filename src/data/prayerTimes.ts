import {
  calculatePrayerTimes,
  loadUserPrayerLocation,
  formatTime24,
  UserLocationConfig,
} from '../utils/prayerCalculator';

export interface PrayerTimeInfo {
  id: 'fajr' | 'shuruq' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  name: string;
  time: string; // "04:42"
  timestamp: Date;
  isPassed: boolean;
  isNext: boolean;
}

export function getTodayPrayerTimes(
  baseDate: Date = new Date(),
  customLocation?: UserLocationConfig
): PrayerTimeInfo[] {
  const loc = customLocation || loadUserPrayerLocation();
  const times = calculatePrayerTimes(baseDate, loc.lat, loc.lon, loc.method, loc.madhab);
  const now = baseDate.getTime();

  const prayers: { id: PrayerTimeInfo['id']; name: string; date: Date }[] = [
    { id: 'fajr', name: 'الفجر', date: times.fajr },
    { id: 'shuruq', name: 'الشروق', date: times.shuruq },
    { id: 'dhuhr', name: 'الظهر', date: times.dhuhr },
    { id: 'asr', name: 'العصر', date: times.asr },
    { id: 'maghrib', name: 'المغرب', date: times.maghrib },
    { id: 'isha', name: 'العشاء', date: times.isha },
  ];

  const list: PrayerTimeInfo[] = prayers.map((p) => {
    return {
      id: p.id,
      name: p.name,
      time: formatTime24(p.date),
      timestamp: p.date,
      isPassed: p.date.getTime() < now,
      isNext: false,
    };
  });

  // Find next prayer (excluding shuruq for prayer obligations, but shuruq is useful)
  const nextIdx = list.findIndex((p) => p.timestamp.getTime() > now);
  if (nextIdx !== -1) {
    list[nextIdx].isNext = true;
  } else if (list.length > 0) {
    // next is tomorrow's Fajr
    list[0].isNext = true;
  }

  return list;
}

export function getNextPrayerCountdown(
  baseDate: Date = new Date(),
  customLocation?: UserLocationConfig
): {
  nextPrayerName: string;
  nextPrayerTime: string;
  remainingHours: number;
  remainingMinutes: number;
  remainingSeconds: number;
  formattedCountdown: string;
} {
  const loc = customLocation || loadUserPrayerLocation();
  const prayers = getTodayPrayerTimes(baseDate, loc);
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
    const tomorrow = new Date(baseDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = calculatePrayerTimes(tomorrow, loc.lat, loc.lon, loc.method, loc.madhab);
    targetTime = tomorrowTimes.fajr.getTime();
    prayerName = 'الفجر';
    prayerTimeStr = formatTime24(tomorrowTimes.fajr);
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
