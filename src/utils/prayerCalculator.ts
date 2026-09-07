// Astronomical solar calculation for Islamic Prayer Times
// Standard methods: Egyptian, Umm Al-Qura, Muslim World League, ISNA, Karachi

export interface UserLocationConfig {
  name: string;
  country: string;
  lat: number;
  lon: number;
  isGps: boolean;
  method: CalculationMethodId;
  madhab: 'shafii' | 'hanafi'; // shafii (standard shadow ratio 1) or hanafi (ratio 2)
  timeZoneOffset?: number; // In hours, defaults to browser local timezone
}

export type CalculationMethodId =
  | 'Egyptian' // الهيئة المصرية العامة للمساحة (Fajr 19.5°, Isha 17.5°)
  | 'Makkah' // جامعة أم القرى - مكة المكرمة (Fajr 18.5°, Isha 90 min)
  | 'MWL' // رابطة العالم الإسلامي (Fajr 18°, Isha 17°)
  | 'ISNA' // الجمعية الإسلامية لأمريكا الشمالية (Fajr 15°, Isha 15°)
  | 'Karachi' // جامعة العلوم الإسلامية بكراتشي (Fajr 18°, Isha 18°)
  | 'Gulf'; // دبي ودول الخليج (Fajr 18.2°, Isha 18.2°)

export interface CalculationMethodInfo {
  id: CalculationMethodId;
  name: string;
  fajrAngle: number;
  ishaAngle?: number;
  ishaIntervalMinutes?: number; // For Makkah method
}

export const CALCULATION_METHODS: Record<CalculationMethodId, CalculationMethodInfo> = {
  Egyptian: {
    id: 'Egyptian',
    name: 'الهيئة المصرية العامة للمساحة (مصر والدول المجاورة)',
    fajrAngle: 19.5,
    ishaAngle: 17.5,
  },
  Makkah: {
    id: 'Makkah',
    name: 'جامعة أم القرى - مكة المكرمة (السعودية والخليج)',
    fajrAngle: 18.5,
    ishaIntervalMinutes: 90,
  },
  MWL: {
    id: 'MWL',
    name: 'رابطة العالم الإسلامي (أوروبا والعالم)',
    fajrAngle: 18.0,
    ishaAngle: 17.0,
  },
  ISNA: {
    id: 'ISNA',
    name: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)',
    fajrAngle: 15.0,
    ishaAngle: 15.0,
  },
  Karachi: {
    id: 'Karachi',
    name: 'جامعة العلوم الإسلامية بكراتشي (باكستان والهند)',
    fajrAngle: 18.0,
    ishaAngle: 18.0,
  },
  Gulf: {
    id: 'Gulf',
    name: 'دائرة الشؤون الإسلامية (الإمارات والخليج)',
    fajrAngle: 18.2,
    ishaAngle: 18.2,
  },
};

export interface CityPreset {
  name: string;
  country: string;
  lat: number;
  lon: number;
  method: CalculationMethodId;
}

export const POPULAR_CITIES: CityPreset[] = [
  { name: 'القاهرة', country: 'مصر', lat: 30.0444, lon: 31.2357, method: 'Egyptian' },
  { name: 'الإسكندرية', country: 'مصر', lat: 31.2001, lon: 29.9187, method: 'Egyptian' },
  { name: 'الجيزة', country: 'مصر', lat: 30.0131, lon: 31.2089, method: 'Egyptian' },
  { name: 'طنطا', country: 'مصر', lat: 30.7865, lon: 31.0004, method: 'Egyptian' },
  { name: 'المنصورة', country: 'مصر', lat: 31.0409, lon: 31.3785, method: 'Egyptian' },
  { name: 'أسيوط', country: 'مصر', lat: 27.1809, lon: 31.1837, method: 'Egyptian' },
  { name: 'الأقصر', country: 'مصر', lat: 25.6872, lon: 32.6396, method: 'Egyptian' },
  { name: 'أسوان', country: 'مصر', lat: 24.0889, lon: 32.8998, method: 'Egyptian' },
  { name: 'مكة المكرمة', country: 'السعودية', lat: 21.3891, lon: 39.8579, method: 'Makkah' },
  { name: 'المدينة المنورة', country: 'السعودية', lat: 24.5247, lon: 39.5692, method: 'Makkah' },
  { name: 'الرياض', country: 'السعودية', lat: 24.7136, lon: 46.6753, method: 'Makkah' },
  { name: 'جدة', country: 'السعودية', lat: 21.5433, lon: 39.1728, method: 'Makkah' },
  { name: 'الدمام', country: 'السعودية', lat: 26.4207, lon: 50.0888, method: 'Makkah' },
  { name: 'القدس الشريف', country: 'فلسطين', lat: 31.7683, lon: 35.2137, method: 'MWL' },
  { name: 'غزة', country: 'فلسطين', lat: 31.5017, lon: 34.4668, method: 'Egyptian' },
  { name: 'دبي', country: 'الإمارات', lat: 25.2048, lon: 55.2708, method: 'Gulf' },
  { name: 'أبوظبي', country: 'الإمارات', lat: 24.4539, lon: 54.3773, method: 'Gulf' },
  { name: 'عمان', country: 'الأردن', lat: 31.9454, lon: 35.9284, method: 'MWL' },
  { name: 'دمشق', country: 'سوريا', lat: 33.5138, lon: 36.2765, method: 'MWL' },
  { name: 'بيروت', country: 'لبنان', lat: 33.8938, lon: 35.5018, method: 'MWL' },
  { name: 'بغداد', country: 'العراق', lat: 33.3152, lon: 44.3661, method: 'MWL' },
  { name: 'الكويت', country: 'الكويت', lat: 29.3759, lon: 47.9774, method: 'Makkah' },
  { name: 'الدوحة', country: 'قطر', lat: 25.2854, lon: 51.531, method: 'Makkah' },
  { name: 'المنامة', country: 'البحرين', lat: 26.2285, lon: 50.586, method: 'Makkah' },
  { name: 'مسقط', country: 'عمان', lat: 23.588, lon: 58.3829, method: 'MWL' },
  { name: 'صنعاء', country: 'اليمن', lat: 15.3694, lon: 44.191, method: 'Makkah' },
  { name: 'طرابلس', country: 'ليبيا', lat: 32.8872, lon: 13.1913, method: 'MWL' },
  { name: 'تونس', country: 'تونس', lat: 36.8065, lon: 10.1815, method: 'MWL' },
  { name: 'الجزائر', country: 'الجزائر', lat: 36.7538, lon: 3.0588, method: 'MWL' },
  { name: 'الرباط', country: 'المغرب', lat: 34.0209, lon: -6.8416, method: 'MWL' },
  { name: 'الدار البيضاء', country: 'المغرب', lat: 33.5731, lon: -7.5898, method: 'MWL' },
  { name: 'الخرطوم', country: 'السودان', lat: 15.5007, lon: 32.5599, method: 'Egyptian' },
  { name: 'إسطنبول', country: 'تركيا', lat: 41.0082, lon: 28.9784, method: 'MWL' },
  { name: 'لندن', country: 'بريطانيا', lat: 51.5074, lon: -0.1278, method: 'MWL' },
  { name: 'باريس', country: 'فرنسا', lat: 48.8566, lon: 2.3522, method: 'MWL' },
  { name: 'نيويورك', country: 'أمريكا', lat: 40.7128, lon: -74.006, method: 'ISNA' },
];

export const DEFAULT_LOCATION: UserLocationConfig = {
  name: 'القاهرة',
  country: 'مصر',
  lat: 30.0444,
  lon: 31.2357,
  isGps: false,
  method: 'Egyptian',
  madhab: 'shafii',
};

// Math helpers for astronomical calculations
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

function sinD(deg: number): number {
  return Math.sin(deg * D2R);
}
function cosD(deg: number): number {
  return Math.cos(deg * D2R);
}
function tanD(deg: number): number {
  return Math.tan(deg * D2R);
}
function asinD(x: number): number {
  return Math.asin(x) * R2D;
}
function acosD(x: number): number {
  return Math.acos(x) * R2D;
}
function atanD(x: number): number {
  return Math.atan(x) * R2D;
}
function fixHour(h: number): number {
  return (h % 24 + 24) % 24;
}

/**
 * Astronomical solar calculation for a given date, coordinates and timezone
 */
export function calculatePrayerTimes(
  date: Date,
  lat: number,
  lon: number,
  methodId: CalculationMethodId = 'Egyptian',
  madhab: 'shafii' | 'hanafi' = 'shafii'
): {
  fajr: Date;
  shuruq: Date;
  duha: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  midnight: Date;
  qiyam: Date;
} {
  const method = CALCULATION_METHODS[methodId] || CALCULATION_METHODS.Egyptian;

  // Local timezone offset in hours
  const tzOffset = -date.getTimezoneOffset() / 60;

  // Julian Day
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;
  let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  let d = jdn - 2451545.0 + 0.5;

  // Solar coordinates
  let g = (357.529 + 0.98560028 * d) % 360;
  let q = (280.459 + 0.98564736 * d) % 360;
  let L = (q + 1.915 * sinD(g) + 0.02 * sinD(2 * g)) % 360;
  let e = 23.439 - 0.00000036 * d;

  let sinDec = sinD(e) * sinD(L);
  let dec = asinD(sinDec);

  let RA = atanD(cosD(e) * tanD(L));
  // Adjust quadrant
  if (L >= 0 && L < 180) {
    if (RA < 0) RA += 180;
  } else {
    if (RA > 0) RA += 180;
    else RA += 360;
  }

  // Equation of time (hours)
  let eot = (q - RA) / 15;

  // Solar noon (Dhuhr) in local hours
  let solarNoon = 12 + tzOffset - lon / 15 - eot;

  // Hour angle helper for a given solar altitude angle
  function hourAngle(alpha: number): number {
    let top = sinD(alpha) - sinD(lat) * sinD(dec);
    let bottom = cosD(lat) * cosD(dec);
    let val = top / bottom;
    if (val > 1) return 0; // never rises
    if (val < -1) return 180; // never sets
    return acosD(val);
  }

  // 1. Shuruq (Sunrise) and Maghrib (Sunset): altitude = -0.833°
  let sunRiseSetAngle = -0.833;
  let h0 = hourAngle(sunRiseSetAngle);
  let shuruqHour = solarNoon - h0 / 15;
  let maghribHour = solarNoon + h0 / 15;

  // 2. Fajr: altitude = -fajrAngle
  let hFajr = hourAngle(-method.fajrAngle);
  let fajrHour = solarNoon - hFajr / 15;

  // 3. Asr: shadow length factor = 1 for Shafi'i, 2 for Hanafi
  let t = madhab === 'hanafi' ? 2 : 1;
  let asrAlt = -atanD(1 / (t + tanD(Math.abs(lat - dec))));
  // Invert altitude sign convention
  let asrAltitude = 90 - atanD(t + tanD(Math.abs(lat - dec)));
  let hAsr = hourAngle(asrAltitude);
  let asrHour = solarNoon + hAsr / 15;

  // 4. Isha
  let ishaHour: number;
  if (method.ishaIntervalMinutes) {
    ishaHour = maghribHour + method.ishaIntervalMinutes / 60;
  } else {
    let ishaAng = method.ishaAngle || 17.5;
    let hIsha = hourAngle(-ishaAng);
    ishaHour = solarNoon + hIsha / 15;
  }

  // Helper to convert fractional hours to Date
  function hourToDate(h: number): Date {
    const fixedH = fixHour(h);
    const hours = Math.floor(fixedH);
    const minsFloat = (fixedH - hours) * 60;
    const minutes = Math.floor(minsFloat);
    const seconds = Math.floor((minsFloat - minutes) * 60);

    const res = new Date(year, month - 1, day, hours, minutes, seconds);
    return res;
  }

  const fajrDate = hourToDate(fajrHour);
  const shuruqDate = hourToDate(shuruqHour);
  const dhuhrDate = hourToDate(solarNoon);
  const asrDate = hourToDate(asrHour);
  const maghribDate = hourToDate(maghribHour);
  const ishaDate = hourToDate(ishaHour);

  // Duha: approximately 20 mins after sunrise
  const duhaDate = new Date(shuruqDate.getTime() + 20 * 60 * 1000);

  // Night duration between Maghrib and tomorrow's Fajr (approx)
  // Midnight is midpoint between Maghrib and Fajr
  let nightMs = fajrDate.getTime() + 24 * 3600 * 1000 - maghribDate.getTime();
  if (nightMs < 0) nightMs += 24 * 3600 * 1000;

  const midnightDate = new Date(maghribDate.getTime() + nightMs / 2);
  const qiyamDate = new Date(maghribDate.getTime() + (nightMs * 2) / 3); // Last third of night

  return {
    fajr: fajrDate,
    shuruq: shuruqDate,
    duha: duhaDate,
    dhuhr: dhuhrDate,
    asr: asrDate,
    maghrib: maghribDate,
    isha: ishaDate,
    midnight: midnightDate,
    qiyam: qiyamDate,
  };
}

export interface DetailedPrayerItem {
  id: 'fajr' | 'shuruq' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  name: string;
  arabicName: string;
  timeString12: string; // e.g. "04:38 ص"
  timeString24: string; // e.g. "04:38"
  timestamp: Date;
  isPassed: boolean;
  isCurrent: boolean;
  isNext: boolean;
  rakaat: number;
  sunnahBefore: number;
  sunnahAfter: number;
  virtue: string;
}

/**
 * Format a Date to 12h Arabic time string, e.g. "04:38 ص" or "01:15 م"
 */
export function formatTime12(date: Date): string {
  let h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'م' : 'ص';
  h = h % 12;
  if (h === 0) h = 12;
  const hStr = h.toString().padStart(2, '0');
  return `${hStr}:${m} ${period}`;
}

export function formatTime24(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Get detailed prayer schedule list for a location config and date
 */
export function getDetailedPrayerList(
  location: UserLocationConfig,
  baseDate: Date = new Date()
): DetailedPrayerItem[] {
  const times = calculatePrayerTimes(
    baseDate,
    location.lat,
    location.lon,
    location.method,
    location.madhab
  );

  const nowMs = baseDate.getTime();

  const rawList: Omit<DetailedPrayerItem, 'isPassed' | 'isCurrent' | 'isNext'>[] = [
    {
      id: 'fajr',
      name: 'الفجر',
      arabicName: 'صلاة الفجر',
      timeString12: formatTime12(times.fajr),
      timeString24: formatTime24(times.fajr),
      timestamp: times.fajr,
      rakaat: 2,
      sunnahBefore: 2,
      sunnahAfter: 0,
      virtue: 'ركعتا الفجر خير من الدنيا وما فيها',
    },
    {
      id: 'shuruq',
      name: 'الشروق',
      arabicName: 'شروق الشمس',
      timeString12: formatTime12(times.shuruq),
      timeString24: formatTime24(times.shuruq),
      timestamp: times.shuruq,
      rakaat: 0,
      sunnahBefore: 0,
      sunnahAfter: 0,
      virtue: 'وقت شروق الشمس، ينتهي به وقت الفجر وتستحب بعده صلاة الضحى',
    },
    {
      id: 'dhuhr',
      name: 'الظهر',
      arabicName: 'صلاة الظهر',
      timeString12: formatTime12(times.dhuhr),
      timeString24: formatTime24(times.dhuhr),
      timestamp: times.dhuhr,
      rakaat: 4,
      sunnahBefore: 4,
      sunnahAfter: 2,
      virtue: 'تفتح فيها أبواب السماء، ويستحب أن يرفع فيها عمل صالح',
    },
    {
      id: 'asr',
      name: 'العصر',
      arabicName: 'صلاة العصر',
      timeString12: formatTime12(times.asr),
      timeString24: formatTime24(times.asr),
      timestamp: times.asr,
      rakaat: 4,
      sunnahBefore: 4,
      sunnahAfter: 0,
      virtue: 'الصلاة الوسطى: "حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ"',
    },
    {
      id: 'maghrib',
      name: 'المغرب',
      arabicName: 'صلاة المغرب',
      timeString12: formatTime12(times.maghrib),
      timeString24: formatTime24(times.maghrib),
      timestamp: times.maghrib,
      rakaat: 3,
      sunnahBefore: 0,
      sunnahAfter: 2,
      virtue: 'وقت إفطار الصائم وإجابة الدعاء عند غروب الشمس',
    },
    {
      id: 'isha',
      name: 'العشاء',
      arabicName: 'صلاة العشاء',
      timeString12: formatTime12(times.isha),
      timeString24: formatTime24(times.isha),
      timestamp: times.isha,
      rakaat: 4,
      sunnahBefore: 0,
      sunnahAfter: 2,
      virtue: 'من صلى العشاء في جماعة فكأنما قام نصف الليل',
    },
  ];

  // Determine isPassed, isNext, isCurrent
  let nextFound = false;
  const result: DetailedPrayerItem[] = rawList.map((item) => {
    const isPassed = item.timestamp.getTime() < nowMs;
    let isNext = false;
    if (!isPassed && !nextFound) {
      isNext = true;
      nextFound = true;
    }
    return {
      ...item,
      isPassed,
      isNext,
      isCurrent: false,
    };
  });

  // If all prayers today have passed, next is tomorrow's Fajr
  if (!nextFound && result.length > 0) {
    result[0].isNext = true;
  }

  return result;
}

/**
 * Audio recitations of the Athan (الأذان)
 */
export interface AthanAudioOption {
  id: string;
  name: string;
  subname: string;
  audioUrl: string;
}

export const ATHAN_AUDIOS: AthanAudioOption[] = [
  {
    id: 'fajr',
    name: 'أذان صلاة الفجر (الصلاة خير من النوم)',
    subname: 'أذان الفجر الخاشع بصوت ندي ومهيب',
    audioUrl: 'https://cdn.aladhan.com/audio/adhans/a8.mp3',
  },
  {
    id: 'makkah',
    name: 'أذان المسجد الحرام (مكة المكرمة)',
    subname: 'أذان مهيب خاشع من رحاب الحرم المكي',
    audioUrl: 'https://cdn.aladhan.com/audio/adhans/a8.mp3',
  },
  {
    id: 'madina',
    name: 'أذان المسجد النبوي الشريف (المدينة)',
    subname: 'أذان ندي من رحاب الحرم النبوي العطر',
    audioUrl: 'https://cdn.aladhan.com/audio/adhans/a10.mp3',
  },
  {
    id: 'afasy_1',
    name: 'أذان الشيخ مشاري راشد العفاسي (خاشع)',
    subname: 'تلاوة وأذان يملأ النفس سكينة وطمأنينة',
    audioUrl: 'https://cdn.aladhan.com/audio/adhans/a7.mp3',
  },
  {
    id: 'afasy_2',
    name: 'أذان الشيخ مشاري العفاسي (تلفزيون دبي)',
    subname: 'أذان عذب وواضح بأعلى نقاوة صوتية',
    audioUrl: 'https://cdn.aladhan.com/audio/adhans/a4.mp3',
  },
  {
    id: 'nafees',
    name: 'أذان الشيخ أحمد النفيس',
    subname: 'صوت شجي مؤثر وندي',
    audioUrl: 'https://cdn.aladhan.com/audio/adhans/a1.mp3',
  },
  {
    id: 'zahrani',
    name: 'أذان الشيخ منصور الزهراني',
    subname: 'أذان حجازي عطر',
    audioUrl: 'https://cdn.aladhan.com/audio/adhans/a11-mansour-al-zahrani.mp3',
  },
  {
    id: 'afasy_3',
    name: 'أذان الحرمين - مشاري العفاسي',
    subname: 'تسجيل استوديو عالي الجودة',
    audioUrl: 'https://cdn.aladhan.com/audio/adhans/a9.mp3',
  },
  {
    id: 'turkey',
    name: 'أذان الحافظ مصطفى أوزجان',
    subname: 'أذان على الطراز العثماني الخاشع',
    audioUrl: 'https://cdn.aladhan.com/audio/adhans/a2.mp3',
  },
];

/**
 * Storage helpers for user prayer location config
 */
const STORAGE_KEY_LOCATION = 'ouns_user_prayer_location';

export function loadUserPrayerLocation(): UserLocationConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCATION);
    if (raw) {
      return { ...DEFAULT_LOCATION, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_LOCATION;
}

export function saveUserPrayerLocation(loc: UserLocationConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(loc));
  } catch {
    // ignore
  }
}

/**
 * Find nearest preset city given coordinates
 */
export function findNearestCity(lat: number, lon: number): CityPreset {
  let closest = POPULAR_CITIES[0];
  let minD = Infinity;

  for (const city of POPULAR_CITIES) {
    const dLat = city.lat - lat;
    const dLon = city.lon - lon;
    const dist = dLat * dLat + dLon * dLon;
    if (dist < minD) {
      minD = dist;
      closest = city;
    }
  }
  return closest;
}
