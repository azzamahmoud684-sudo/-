// Kaaba exact geographical coordinates (Al-Masjid al-Haram, Makkah al-Mukarramah)
export const KAABA_COORDINATES = {
  latitude: 21.422487,
  longitude: 39.826206,
  name: 'الكعبة المشرفة - مكة المكرمة',
};

/**
 * Calculates the forward azimuth / great-circle initial bearing from user coordinates (lat, lon)
 * to the Kaaba in degrees [0°, 360°) relative to True Geographic North (clockwise).
 */
export function calculateQiblaBearing(userLat: number, userLon: number): number {
  const phi1 = (userLat * Math.PI) / 180;
  const phi2 = (KAABA_COORDINATES.latitude * Math.PI) / 180;
  const deltaLambda = ((KAABA_COORDINATES.longitude - userLon) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const rawBearing = (Math.atan2(y, x) * 180) / Math.PI;
  const normalizedBearing = ((rawBearing % 360) + 360) % 360;

  return Math.round(normalizedBearing * 10) / 10;
}

/**
 * Calculates geodesic distance to the Kaaba in kilometers using the Haversine formula.
 */
export function calculateDistanceToKaaba(userLat: number, userLon: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((KAABA_COORDINATES.latitude - userLat) * Math.PI) / 180;
  const dLon = ((KAABA_COORDINATES.longitude - userLon) * Math.PI) / 180;
  const lat1 = (userLat * Math.PI) / 180;
  const lat2 = (KAABA_COORDINATES.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Solves the 0°/360° boundary wrap-around in compass rotation.
 * Ensures CSS animations always take the shortest angular path rather than spinning 350+ degrees.
 */
export function unwrapAngle(prevAngle: number, newTarget: number): number {
  const normalizedPrev = ((prevAngle % 360) + 360) % 360;
  let diff = newTarget - normalizedPrev;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return prevAngle + diff;
}

/**
 * Estimates magnetic declination in degrees for a given latitude and longitude.
 * Used to convert Magnetic North to True Geographic North when the sensor only provides Magnetic heading.
 * Positive value = East declination (Magnetic North is East of True North).
 */
export function estimateMagneticDeclination(lat: number, lon: number): number {
  if (lat >= 15 && lat <= 35 && lon >= 25 && lon <= 55) {
    // Calibrated for Egypt, Saudi Arabia, Gulf, Levant
    const approx = 4.7 + 0.04 * (lon - 35) - 0.02 * (lat - 25);
    return Math.round(approx * 10) / 10;
  }
  return 0;
}

/**
 * Accurately calculates compass heading in degrees [0, 360) from DeviceOrientationEvent.
 * 
 * - iOS: uses webkitCompassHeading (0 = North, 90 = East, 180 = South, 270 = West).
 * - Android & W3C standard: uses alpha from deviceorientation / deviceorientationabsolute.
 *   In W3C spec: alpha = 0 is North, alpha = 270 is East, alpha = 180 is South, alpha = 90 is West.
 *   Therefore: clockwise heading from North = (360 - (alpha % 360)) % 360.
 * - Compensates for magnetic declination when device reports magnetic heading.
 */
export function calculateDeviceHeading(
  event: DeviceOrientationEvent,
  magneticDeclination = 0
): { heading: number; isTrueNorth: boolean } | null {
  // 1. iOS: webkitCompassHeading
  // @ts-expect-error - iOS specific property
  if (typeof event.webkitCompassHeading === 'number' && !isNaN(event.webkitCompassHeading)) {
    // @ts-expect-error - iOS specific property
    let heading: number = event.webkitCompassHeading;
    heading = ((heading % 360) + 360) % 360;

    // @ts-expect-error - iOS accuracy property
    const accuracy = event.webkitCompassAccuracy;
    const isTrueNorth = typeof accuracy === 'number' && accuracy >= 0;

    if (!isTrueNorth && magneticDeclination) {
      heading = ((heading + magneticDeclination) % 360 + 360) % 360;
    }

    return { heading: Math.round(heading * 10) / 10, isTrueNorth };
  }

  // 2. Android & W3C standard: alpha
  if (typeof event.alpha === 'number' && !isNaN(event.alpha)) {
    let heading = (360 - (event.alpha % 360)) % 360;
    const isTrueNorth = Boolean(event.absolute);

    if (!isTrueNorth && magneticDeclination) {
      heading = ((heading + magneticDeclination) % 360 + 360) % 360;
    }

    return { heading: Math.round(heading * 10) / 10, isTrueNorth };
  }

  return null;
}

/**
 * Calculates the relative angle for the needle pointing to the Kaaba from the top of the phone.
 * 
 * - When device is pointing towards North (heading = 0°): relative angle = qiblaBearing.
 * - When device is pointing directly towards the Kaaba (heading = qiblaBearing): relative angle = 0° (STRAIGHT FORWARD).
 * - When device is turned 180° away from the Kaaba (heading = (qiblaBearing + 180) % 360): relative angle = 180° (STRAIGHT BACKWARD).
 * - When device is turned 90° right of Kaaba: relative angle = 270° (POINTING LEFT, indicating turn left).
 * - When device is turned 90° left of Kaaba: relative angle = 90° (POINTING RIGHT, indicating turn right).
 */
export function calculateRelativeNeedleAngle(qiblaBearing: number, deviceHeading: number | null): number {
  if (deviceHeading === null) {
    // Static mode: needle points to qibla bearing on the fixed dial
    return qiblaBearing;
  }
  const angle = ((qiblaBearing - deviceHeading) % 360 + 360) % 360;
  return Math.round(angle * 10) / 10;
}

/**
 * Calculates the dial ring rotation angle so that the "North" marker stays pointing to real Earth North.
 */
export function calculateDialRotationAngle(deviceHeading: number | null): number {
  if (deviceHeading === null) {
    return 0;
  }
  return (-deviceHeading % 360);
}

/**
 * Astronomical Solar Position (Azimuth & Altitude) calculation.
 * The Sun's position is an infallible, 100% reliable physical reference when magnetic sensors are disrupted.
 */
export interface SolarPosition {
  azimuth: number; // 0° - 360° from True North (clockwise)
  altitude: number; // degrees above horizon
  isDay: boolean;
}

export function getSolarPosition(lat: number, lon: number, date: Date = new Date()): SolarPosition {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  const d = date.getTime();
  const jd = d / 86400000 + 2440587.5;
  const dSince2000 = jd - 2451545.0;

  // Mean anomaly and solar coordinates
  const g = (357.529 + 0.98560028 * dSince2000) % 360;
  const q = 280.459 + 0.98564736 * dSince2000;
  const L = (q + 1.915 * Math.sin(g * rad) + 0.020 * Math.sin(2 * g * rad)) % 360;

  const e = 23.439 - 0.00000036 * dSince2000;
  const sinDec = Math.sin(e * rad) * Math.sin(L * rad);
  const dec = Math.asin(sinDec);

  const gmst = (18.697374558 + 24.06570982441908 * dSince2000) % 24;
  const lmst = (gmst + lon / 15) % 24;
  const ra = (Math.atan2(Math.cos(e * rad) * Math.sin(L * rad), Math.cos(L * rad)) * deg) / 15;
  let ha = (lmst - ra) * 15;
  if (ha < -180) ha += 360;
  if (ha > 180) ha -= 360;

  const phi = lat * rad;
  const sinAlt = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha * rad);
  const alt = Math.asin(sinAlt) * deg;

  const cosAz = (Math.sin(dec) - Math.sin(phi) * Math.sin(alt * rad)) / (Math.cos(phi) * Math.cos(alt * rad));
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz))) * deg;
  if (Math.sin(ha * rad) > 0) az = 360 - az;

  return {
    azimuth: Math.round(az * 10) / 10,
    altitude: Math.round(alt * 10) / 10,
    isDay: alt > -0.833, // standard civil sunrise/sunset threshold
  };
}

export interface CityLocation {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
}

/**
 * Finds the nearest named city from coordinate latitude and longitude.
 */
export function findNearestPresetCity(lat: number, lon: number): { city: CityLocation; distanceKm: number } {
  let nearestCity = PRESET_CITIES[0];
  let minDistance = Infinity;

  for (const city of PRESET_CITIES) {
    const dLat = ((city.lat - lat) * Math.PI) / 180;
    const dLon = ((city.lon - lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((city.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (dist < minDistance) {
      minDistance = dist;
      nearestCity = city;
    }
  }

  return { city: nearestCity, distanceKm: Math.round(minDistance) };
}

/**
 * Comprehensive Preset Cities for Egypt, Saudi Arabia, Gulf, Levant, North Africa, and Global.
 */
export const PRESET_CITIES: CityLocation[] = [
  // مصر - كافة المحافظات والمدن الرئيسية
  { id: 'cairo', name: 'القاهرة', country: 'مصر', lat: 30.0444, lon: 31.2357 },
  { id: 'giza', name: 'الجيزة', country: 'مصر', lat: 30.0131, lon: 31.2089 },
  { id: 'alex', name: 'الإسكندرية', country: 'مصر', lat: 31.2001, lon: 29.9187 },
  { id: 'mansoura', name: 'المنصورة (الدقهلية)', country: 'مصر', lat: 31.0409, lon: 31.3785 },
  { id: 'tanta', name: 'طنطا (الغربية)', country: 'مصر', lat: 30.7865, lon: 31.0004 },
  { id: 'zagazig', name: 'الزقازيق (الشرقية)', country: 'مصر', lat: 30.5877, lon: 31.5020 },
  { id: 'ismailia', name: 'الإسماعيلية', country: 'مصر', lat: 30.5965, lon: 32.2715 },
  { id: 'portsaid', name: 'بورسعيد', country: 'مصر', lat: 31.2653, lon: 32.3019 },
  { id: 'suez', name: 'السويس', country: 'مصر', lat: 29.9668, lon: 32.5498 },
  { id: 'damanhur', name: 'دمنهور (البحيرة)', country: 'مصر', lat: 31.0409, lon: 30.4700 },
  { id: 'kafr-el-sheikh', name: 'كفر الشيخ', country: 'مصر', lat: 31.1107, lon: 30.9388 },
  { id: 'damietta', name: 'دمياط', country: 'مصر', lat: 31.4175, lon: 31.8144 },
  { id: 'fayoum', name: 'الفيوم', country: 'مصر', lat: 29.3084, lon: 30.8428 },
  { id: 'beni-suef', name: 'بني سويف', country: 'مصر', lat: 29.0661, lon: 31.0994 },
  { id: 'minya', name: 'المنيا', country: 'مصر', lat: 28.0871, lon: 30.7618 },
  { id: 'asyut', name: 'أسيوط', country: 'مصر', lat: 27.1809, lon: 31.1837 },
  { id: 'sohag', name: 'سوهاج', country: 'مصر', lat: 26.5569, lon: 31.6948 },
  { id: 'qena', name: 'قنا', country: 'مصر', lat: 26.1551, lon: 32.7160 },
  { id: 'luxor', name: 'الأقصر', country: 'مصر', lat: 25.6872, lon: 32.6396 },
  { id: 'aswan', name: 'أسوان', country: 'مصر', lat: 24.0889, lon: 32.8998 },
  { id: 'hurghada', name: 'الغردقة (البحر الأحمر)', country: 'مصر', lat: 27.2579, lon: 33.8116 },
  { id: 'sharm', name: 'شرم الشيخ (جنوب سيناء)', country: 'مصر', lat: 27.9158, lon: 34.3299 },
  { id: 'matruh', name: 'مرسى مطروح', country: 'مصر', lat: 31.3543, lon: 27.2373 },
  { id: 'arish', name: 'العريش (شمال سيناء)', country: 'مصر', lat: 31.1325, lon: 33.7984 },
  { id: 'october', name: 'مدينة 6 أكتوبر', country: 'مصر', lat: 29.9737, lon: 30.9529 },
  { id: 'new-cairo', name: 'القاهرة الجديدة (التجمع)', country: 'مصر', lat: 30.0300, lon: 31.4700 },

  // السعودية - المدن والمحافظات
  { id: 'makkah', name: 'مكة المكرمة', country: 'السعودية', lat: 21.3891, lon: 39.8579 },
  { id: 'madinah', name: 'المدينة المنورة', country: 'السعودية', lat: 24.5247, lon: 39.5692 },
  { id: 'riyadh', name: 'الرياض', country: 'السعودية', lat: 24.7136, lon: 46.6753 },
  { id: 'jeddah', name: 'جدة', country: 'السعودية', lat: 21.4858, lon: 39.1925 },
  { id: 'dammam', name: 'الدمام', country: 'السعودية', lat: 26.4207, lon: 50.0888 },
  { id: 'khobar', name: 'الخبر', country: 'السعودية', lat: 26.2172, lon: 50.1971 },
  { id: 'dhahran', name: 'الظهران', country: 'السعودية', lat: 26.2361, lon: 50.1140 },
  { id: 'taif', name: 'الطائف', country: 'السعودية', lat: 21.2854, lon: 40.4222 },
  { id: 'tabuk', name: 'تبوك', country: 'السعودية', lat: 28.3835, lon: 36.5662 },
  { id: 'buraidah', name: 'بريدة (القصيم)', country: 'السعودية', lat: 26.3592, lon: 43.9818 },
  { id: 'unaizah', name: 'عنيزة', country: 'السعودية', lat: 26.0843, lon: 43.9936 },
  { id: 'abha', name: 'أبها (عسير)', country: 'السعودية', lat: 18.2164, lon: 42.5053 },
  { id: 'khamis', name: 'خميس مشيط', country: 'السعودية', lat: 18.3000, lon: 42.7333 },
  { id: 'jizan', name: 'جازان', country: 'السعودية', lat: 16.8892, lon: 42.5706 },
  { id: 'najran', name: 'نجران', country: 'السعودية', lat: 17.4933, lon: 44.1277 },
  { id: 'hail', name: 'حائل', country: 'السعودية', lat: 27.5219, lon: 41.6907 },
  { id: 'sakaka', name: 'سكاكا (الجوف)', country: 'السعودية', lat: 29.9697, lon: 40.2064 },
  { id: 'yanbu', name: 'ينبع', country: 'السعودية', lat: 24.0891, lon: 38.0637 },
  { id: 'jubail', name: 'الجبيل', country: 'السعودية', lat: 27.0174, lon: 49.6225 },
  { id: 'ahsa', name: 'الأحساء (الهفوف)', country: 'السعودية', lat: 25.3800, lon: 49.5855 },

  // الخليج العربي
  { id: 'dubai', name: 'دبي', country: 'الإمارات', lat: 25.2048, lon: 55.2708 },
  { id: 'abudhabi', name: 'أبوظبي', country: 'الإمارات', lat: 24.4539, lon: 54.3773 },
  { id: 'sharjah', name: 'الشارقة', country: 'الإمارات', lat: 25.3463, lon: 55.4209 },
  { id: 'ajman', name: 'عجمان', country: 'الإمارات', lat: 25.4052, lon: 55.5136 },
  { id: 'rak', name: 'رأس الخيمة', country: 'الإمارات', lat: 25.6741, lon: 55.9804 },
  { id: 'doha', name: 'الدوحة', country: 'قطر', lat: 25.2854, lon: 51.5310 },
  { id: 'kuwait', name: 'مدينة الكويت', country: 'الكويت', lat: 29.3759, lon: 47.9774 },
  { id: 'manama', name: 'المنامة', country: 'البحرين', lat: 26.2285, lon: 50.5860 },
  { id: 'muscat', name: 'مسقط', country: 'عُمان', lat: 23.5880, lon: 58.3829 },
  { id: 'salalah', name: 'صلالة', country: 'عُمان', lat: 17.0151, lon: 54.0924 },

  // الشام والعراق
  { id: 'jerusalem', name: 'القدس الشريف', country: 'فلسطين', lat: 31.7683, lon: 35.2137 },
  { id: 'gaza', name: 'غزة', country: 'فلسطين', lat: 31.5017, lon: 34.4668 },
  { id: 'ramallah', name: 'رام الله', country: 'فلسطين', lat: 31.9038, lon: 35.2034 },
  { id: 'hebron', name: 'الخليل', country: 'فلسطين', lat: 31.5326, lon: 35.0998 },
  { id: 'nablus', name: 'نابلس', country: 'فلسطين', lat: 32.2227, lon: 35.2621 },
  { id: 'amman', name: 'عمّان', country: 'الأردن', lat: 31.9454, lon: 35.9284 },
  { id: 'zarqa', name: 'الزرقاء', country: 'الأردن', lat: 32.0728, lon: 36.0880 },
  { id: 'irbid', name: 'إربد', country: 'الأردن', lat: 32.5568, lon: 35.8469 },
  { id: 'aqaba', name: 'العقبة', country: 'الأردن', lat: 29.5319, lon: 35.0061 },
  { id: 'damascus', name: 'دمشق', country: 'سوريا', lat: 33.5138, lon: 36.2765 },
  { id: 'aleppo', name: 'حلب', country: 'سوريا', lat: 36.2021, lon: 37.1343 },
  { id: 'homs', name: 'حمص', country: 'سوريا', lat: 34.7324, lon: 36.7137 },
  { id: 'latakia', name: 'اللاذقية', country: 'سوريا', lat: 35.5317, lon: 35.7900 },
  { id: 'beirut', name: 'بيروت', country: 'لبنان', lat: 33.8938, lon: 35.5018 },
  { id: 'tripoli-lb', name: 'طرابلس', country: 'لبنان', lat: 34.4367, lon: 35.8497 },
  { id: 'sidon', name: 'صيدا', country: 'لبنان', lat: 33.5631, lon: 35.3689 },
  { id: 'baghdad', name: 'بغداد', country: 'العراق', lat: 33.3152, lon: 44.3661 },
  { id: 'basra', name: 'البصرة', country: 'العراق', lat: 30.5085, lon: 47.7804 },
  { id: 'mosul', name: 'الموصل', country: 'العراق', lat: 36.3400, lon: 43.1300 },
  { id: 'erbil', name: 'أربيل', country: 'العراق', lat: 36.1911, lon: 44.0092 },
  { id: 'najaf', name: 'النجف الأشرف', country: 'العراق', lat: 32.0259, lon: 44.3463 },
  { id: 'karbala', name: 'كربلاء', country: 'العراق', lat: 32.6160, lon: 44.0249 },

  // شمال إفريقيا
  { id: 'tripoli', name: 'طرابلس', country: 'ليبيا', lat: 32.8872, lon: 13.1913 },
  { id: 'benghazi', name: 'بنغازي', country: 'ليبيا', lat: 32.1167, lon: 20.0667 },
  { id: 'misrata', name: 'مصراتة', country: 'ليبيا', lat: 32.3754, lon: 15.0925 },
  { id: 'tunis', name: 'تونس العاصمة', country: 'تونس', lat: 36.8065, lon: 10.1815 },
  { id: 'sfax', name: 'صفاقس', country: 'تونس', lat: 34.7406, lon: 10.7603 },
  { id: 'sousse', name: 'سوسة', country: 'تونس', lat: 35.8256, lon: 10.6369 },
  { id: 'algiers', name: 'الجزائر العاصمة', country: 'الجزائر', lat: 36.7538, lon: 3.0588 },
  { id: 'oran', name: 'وهران', country: 'الجزائر', lat: 35.6987, lon: -0.6349 },
  { id: 'constantine', name: 'قسنطينة', country: 'الجزائر', lat: 36.3650, lon: 6.6147 },
  { id: 'rabat', name: 'الرباط', country: 'المغرب', lat: 34.0209, lon: -6.8416 },
  { id: 'casablanca', name: 'الدار البيضاء', country: 'المغرب', lat: 33.5731, lon: -7.5898 },
  { id: 'marrakech', name: 'مراكش', country: 'المغرب', lat: 31.6295, lon: -7.9811 },
  { id: 'fes', name: 'فاس', country: 'المغرب', lat: 34.0181, lon: -5.0078 },
  { id: 'tangier', name: 'طنجة', country: 'المغرب', lat: 35.7595, lon: -5.8340 },
  { id: 'agadir', name: 'أكادير', country: 'المغرب', lat: 30.4278, lon: -9.5981 },
  { id: 'khartoum', name: 'الخرطوم', country: 'السودان', lat: 15.5007, lon: 32.5599 },
  { id: 'omdurman', name: 'أم درمان', country: 'السودان', lat: 15.6500, lon: 32.4800 },
  { id: 'nouakchott', name: 'نواكشوط', country: 'موريتانيا', lat: 18.0735, lon: -15.9582 },

  // اليمن والقرن الإفريقي
  { id: 'sanaa', name: 'صنعاء', country: 'اليمن', lat: 15.3694, lon: 44.1910 },
  { id: 'aden', name: 'عدن', country: 'اليمن', lat: 12.7797, lon: 45.0367 },
  { id: 'taiz', name: 'تعز', country: 'اليمن', lat: 13.5795, lon: 44.0209 },
  { id: 'djibouti', name: 'جيبوتي', country: 'جيبوتي', lat: 11.8251, lon: 42.5903 },
  { id: 'mogadishu', name: 'مقديشو', country: 'الصومال', lat: 2.0469, lon: 45.3182 },

  // عواصم ومدن إسلامية وعالمية
  { id: 'istanbul', name: 'إسطنبول', country: 'تركيا', lat: 41.0082, lon: 28.9784 },
  { id: 'ankara', name: 'أنقرة', country: 'تركيا', lat: 39.9334, lon: 32.8597 },
  { id: 'jakarta', name: 'جاكرتا', country: 'إندونيسيا', lat: -6.2088, lon: 106.8456 },
  { id: 'kualalumpur', name: 'كوالالمبور', country: 'ماليزيا', lat: 3.1390, lon: 101.6869 },
  { id: 'islamabad', name: 'إسلام آباد', country: 'باكستان', lat: 33.6844, lon: 73.0479 },
  { id: 'london', name: 'لندن', country: 'بريطانيا', lat: 51.5074, lon: -0.1278 },
  { id: 'paris', name: 'باريس', country: 'فرنسا', lat: 48.8566, lon: 2.3522 },
  { id: 'berlin', name: 'برلين', country: 'ألمانيا', lat: 52.5200, lon: 13.4050 },
  { id: 'newyork', name: 'نيويورك', country: 'أمريكا', lat: 40.7128, lon: -74.0060 },
  { id: 'chicago', name: 'شيكاغو', country: 'أمريكا', lat: 41.8781, lon: -87.6298 },
  { id: 'toronto', name: 'تورونتو', country: 'كندا', lat: 43.6532, lon: -79.3832 },
  { id: 'sydney', name: 'سيدني', country: 'أستراليا', lat: -33.8688, lon: 151.2093 },
];
