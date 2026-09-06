// Kaaba exact geographical coordinates (Al-Masjid al-Haram, Makkah al-Mukarramah)
export const KAABA_COORDINATES = {
  latitude: 21.422487,
  longitude: 39.826206,
  name: 'الكعبة المشرفة - مكة المكرمة',
};

/**
 * Calculates the forward azimuth / great-circle bearing from user coordinates to the Kaaba in degrees (0° - 360° from True North).
 */
export function calculateQiblaBearing(userLat: number, userLon: number): number {
  const phi1 = (userLat * Math.PI) / 180;
  const phi2 = (KAABA_COORDINATES.latitude * Math.PI) / 180;
  const deltaLambda = ((KAABA_COORDINATES.longitude - userLon) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const rawBearing = (Math.atan2(y, x) * 180) / Math.PI;
  const normalizedBearing = (rawBearing + 360) % 360;

  return Math.round(normalizedBearing * 10) / 10;
}

/**
 * Calculates geodesic distance to the Kaaba in kilometers.
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

export interface CityLocation {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export const PRESET_CITIES: CityLocation[] = [
  // مصر
  { id: 'cairo', name: 'القاهرة', country: 'مصر', lat: 30.0444, lon: 31.2357 },
  { id: 'alex', name: 'الإسكندرية', country: 'مصر', lat: 31.2001, lon: 29.9187 },
  { id: 'giza', name: 'الجيزة', country: 'مصر', lat: 30.0131, lon: 31.2089 },
  { id: 'mansoura', name: 'المنصورة', country: 'مصر', lat: 31.0409, lon: 31.3785 },
  { id: 'tanta', name: 'طنطا', country: 'مصر', lat: 30.7865, lon: 31.0004 },
  { id: 'aswan', name: 'أسوان', country: 'مصر', lat: 24.0889, lon: 32.8998 },
  
  // السعودية
  { id: 'makkah', name: 'مكة المكرمة', country: 'السعودية', lat: 21.3891, lon: 39.8579 },
  { id: 'madinah', name: 'المدينة المنورة', country: 'السعودية', lat: 24.5247, lon: 39.5692 },
  { id: 'riyadh', name: 'الرياض', country: 'السعودية', lat: 24.7136, lon: 46.6753 },
  { id: 'jeddah', name: 'جدة', country: 'السعودية', lat: 21.4858, lon: 39.1925 },
  { id: 'dammam', name: 'الدمام', country: 'السعودية', lat: 26.4207, lon: 50.0888 },
  { id: 'khobar', name: 'الخبر', country: 'السعودية', lat: 26.2172, lon: 50.1971 },
  { id: 'tabuk', name: 'تبوك', country: 'السعودية', lat: 28.3835, lon: 36.5662 },
  { id: 'abha', name: 'أبها', country: 'السعودية', lat: 18.2164, lon: 42.5053 },

  // الخليج
  { id: 'dubai', name: 'دبي', country: 'الإمارات', lat: 25.2048, lon: 55.2708 },
  { id: 'abudhabi', name: 'أبوظبي', country: 'الإمارات', lat: 24.4539, lon: 54.3773 },
  { id: 'sharjah', name: 'الشارقة', country: 'الإمارات', lat: 25.3463, lon: 55.4209 },
  { id: 'doha', name: 'الدوحة', country: 'قطر', lat: 25.2854, lon: 51.5310 },
  { id: 'kuwait', name: 'الكويت', country: 'الكويت', lat: 29.3759, lon: 47.9774 },
  { id: 'manama', name: 'المنامة', country: 'البحرين', lat: 26.2285, lon: 50.5860 },
  { id: 'muscat', name: 'مسقط', country: 'عُمان', lat: 23.5880, lon: 58.3829 },

  // الشام والعراق
  { id: 'jerusalem', name: 'القدس الشريف', country: 'فلسطين', lat: 31.7683, lon: 35.2137 },
  { id: 'gaza', name: 'غزة', country: 'فلسطين', lat: 31.5017, lon: 34.4668 },
  { id: 'amman', name: 'عمّان', country: 'الأردن', lat: 31.9454, lon: 35.9284 },
  { id: 'zarqa', name: 'الزرقاء', country: 'الأردن', lat: 32.0728, lon: 36.0880 },
  { id: 'damascus', name: 'دمشق', country: 'سوريا', lat: 33.5138, lon: 36.2765 },
  { id: 'aleppo', name: 'حلب', country: 'سوريا', lat: 36.2021, lon: 37.1343 },
  { id: 'beirut', name: 'بيروت', country: 'لبنان', lat: 33.8938, lon: 35.5018 },
  { id: 'baghdad', name: 'بغداد', country: 'العراق', lat: 33.3152, lon: 44.3661 },
  { id: 'basra', name: 'البصرة', country: 'العراق', lat: 30.5085, lon: 47.7804 },
  { id: 'erbil', name: 'أربيل', country: 'العراق', lat: 36.1911, lon: 44.0092 },

  // شمال إفريقيا
  { id: 'tripoli', name: 'طرابلس', country: 'ليبيا', lat: 32.8872, lon: 13.1913 },
  { id: 'benghazi', name: 'بنغازي', country: 'ليبيا', lat: 32.1167, lon: 20.0667 },
  { id: 'tunis', name: 'تونس', country: 'تونس', lat: 36.8065, lon: 10.1815 },
  { id: 'sfax', name: 'صفاقس', country: 'تونس', lat: 34.7406, lon: 10.7603 },
  { id: 'algiers', name: 'الجزائر', country: 'الجزائر', lat: 36.7538, lon: 3.0588 },
  { id: 'oran', name: 'وهران', country: 'الجزائر', lat: 35.6987, lon: -0.6349 },
  { id: 'rabat', name: 'الرباط', country: 'المغرب', lat: 34.0209, lon: -6.8416 },
  { id: 'casablanca', name: 'الدار البيضاء', country: 'المغرب', lat: 33.5731, lon: -7.5898 },
  { id: 'marrakech', name: 'مراكش', country: 'المغرب', lat: 31.6295, lon: -7.9811 },
  { id: 'fes', name: 'فاس', country: 'المغرب', lat: 34.0181, lon: -5.0078 },
  { id: 'khartoum', name: 'الخرطوم', country: 'السودان', lat: 15.5007, lon: 32.5599 },

  // اليمن والقرن الإفريقي
  { id: 'sanaa', name: 'صنعاء', country: 'اليمن', lat: 15.3694, lon: 44.1910 },
  { id: 'aden', name: 'عدن', country: 'اليمن', lat: 12.7797, lon: 45.0367 },

  // مدن عالمية
  { id: 'istanbul', name: 'إسطنبول', country: 'تركيا', lat: 41.0082, lon: 28.9784 },
  { id: 'jakarta', name: 'جاكرتا', country: 'إندونيسيا', lat: -6.2088, lon: 106.8456 },
  { id: 'kualalumpur', name: 'كوالالمبور', country: 'ماليزيا', lat: 3.1390, lon: 101.6869 },
  { id: 'london', name: 'لندن', country: 'بريطانيا', lat: 51.5074, lon: -0.1278 },
  { id: 'paris', name: 'باريس', country: 'فرنسا', lat: 48.8566, lon: 2.3522 },
  { id: 'berlin', name: 'برلين', country: 'ألمانيا', lat: 52.5200, lon: 13.4050 },
  { id: 'newyork', name: 'نيويورك', country: 'أمريكا', lat: 40.7128, lon: -74.0060 },
];
