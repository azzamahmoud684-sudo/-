import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Compass,
  MapPin,
  RotateCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Sparkles,
  Sun,
  Map,
  Info,
  Check,
  ArrowUp,
  Sliders,
} from 'lucide-react';
import {
  calculateQiblaBearing,
  calculateDistanceToKaaba,
  unwrapAngle,
  calculateDeviceHeading,
  calculateRelativeNeedleAngle,
  calculateDialRotationAngle,
  estimateMagneticDeclination,
  getSolarPosition,
  findNearestPresetCity,
  PRESET_CITIES,
  CityLocation,
  KAABA_COORDINATES,
} from '../utils/qibla';

interface QiblaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type QiblaTab = 'compass' | 'solar' | 'map';

const STORAGE_KEY = 'ouns_qibla_location_v2';

export const QiblaModal: React.FC<QiblaModalProps> = ({ isOpen, onClose }) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<QiblaTab>('compass');

  // Location state
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'requesting' | 'granted' | 'denied' | 'manual'>('prompt');
  const [locationError, setLocationError] = useState<string>('');
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);

  // Manual city selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);

  // Compass / Sensor state
  const [rawHeading, setRawHeading] = useState<number | null>(null);
  const [smoothedHeading, setSmoothedHeading] = useState<number | null>(null);
  const [devicePitch, setDevicePitch] = useState<number>(0); // beta
  const [deviceRoll, setDeviceRoll] = useState<number>(0); // gamma
  const [hasCompassSensor, setHasCompassSensor] = useState<boolean | null>(null);
  const [isTrueNorth, setIsTrueNorth] = useState<boolean>(true);
  const [showCalibrationGuide, setShowCalibrationGuide] = useState(false);

  // Unwrapped smooth rotation angles for CSS transitions (avoids 360° jump)
  const [unwrappedDialAngle, setUnwrappedDialAngle] = useState(0);
  const [unwrappedNeedleAngle, setUnwrappedNeedleAngle] = useState(0);

  // Refs
  const headingRef = useRef<number | null>(null);
  const unwrappedDialRef = useRef(0);
  const unwrappedNeedleRef = useRef(0);
  const lastVibrateRef = useRef<number>(0);
  const watchIdRef = useRef<number | null>(null);

  // Guess sensible default city based on user's timezone if GPS is not yet granted
  const detectTimezoneDefaultCity = (): CityLocation => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase();
      if (tz.includes('cairo') || tz.includes('egypt')) {
        return PRESET_CITIES.find((c) => c.id === 'cairo') || PRESET_CITIES[0];
      }
      if (tz.includes('riyadh') || tz.includes('saudi')) {
        return PRESET_CITIES.find((c) => c.id === 'riyadh') || PRESET_CITIES[26];
      }
      if (tz.includes('dubai')) {
        return PRESET_CITIES.find((c) => c.id === 'dubai') || PRESET_CITIES[46];
      }
      if (tz.includes('baghdad')) {
        return PRESET_CITIES.find((c) => c.id === 'baghdad') || PRESET_CITIES[0];
      }
      if (tz.includes('amman')) {
        return PRESET_CITIES.find((c) => c.id === 'amman') || PRESET_CITIES[0];
      }
      if (tz.includes('jerusalem') || tz.includes('gaza')) {
        return PRESET_CITIES.find((c) => c.id === 'jerusalem') || PRESET_CITIES[0];
      }
      if (tz.includes('casablanca')) {
        return PRESET_CITIES.find((c) => c.id === 'casablanca') || PRESET_CITIES[0];
      }
    } catch {
      // ignore
    }
    return PRESET_CITIES[0]; // Default Cairo
  };

  // Restore saved location or auto-request on open
  useEffect(() => {
    if (!isOpen) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lon) {
          setCoords({ lat: parsed.lat, lon: parsed.lon });
          setLocationName(parsed.name || 'موقع محفوظ');
          setLocationStatus(parsed.isGPS ? 'granted' : 'manual');
          return;
        }
      }
    } catch {
      // ignore
    }

    // Default to timezone or request GPS
    requestLocation();
  }, [isOpen]);

  // Request browser geolocation with high accuracy
  const requestLocation = () => {
    setLocationStatus('requesting');
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setLocationError('المتصفح لا يدعم تحديد الموقع الجغرافي.');
      const fallback = detectTimezoneDefaultCity();
      selectPresetCity(fallback, false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const nearest = findNearestPresetCity(latitude, longitude);

        const displayName =
          nearest.distanceKm <= 35
            ? `${nearest.city.name}، ${nearest.city.country} (GPS)`
            : `موقعك عبر GPS (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`;

        setCoords({ lat: latitude, lon: longitude });
        setLocationName(displayName);
        setLocationStatus('granted');
        setAccuracyMeters(Math.round(accuracy));

        // Save in localStorage
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              lat: latitude,
              lon: longitude,
              name: displayName,
              isGPS: true,
            })
          );
        } catch {
          // ignore
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setLocationStatus('denied');
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('تم رفض إذن الموقع. تم اختيار أقرب مدينة مقترحة، ويمكنك تغييرها بالأسفل.');
        } else {
          setLocationError('تعذر الحصول على إشارة GPS بدقة. تم اختيار المدينة المقترحة تلقائياً.');
        }

        if (!coords) {
          const fallback = detectTimezoneDefaultCity();
          selectPresetCity(fallback, false);
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  const selectPresetCity = (city: CityLocation, persist = true) => {
    setCoords({ lat: city.lat, lon: city.lon });
    setLocationName(`${city.name}، ${city.country}`);
    setLocationStatus('manual');
    setAccuracyMeters(null);
    setShowCityPicker(false);

    if (persist) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            lat: city.lat,
            lon: city.lon,
            name: `${city.name}، ${city.country}`,
            isGPS: false,
          })
        );
      } catch {
        // ignore
      }
    }
  };

  // Device orientation sensor with tilt compensation & angle unwrapping
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (!isSubscribed) return;

      if (event.beta !== null && typeof event.beta !== 'undefined') setDevicePitch(event.beta);
      if (event.gamma !== null && typeof event.gamma !== 'undefined') setDeviceRoll(event.gamma);

      const declination = coords ? estimateMagneticDeclination(coords.lat, coords.lon) : 0;
      const headingResult = calculateDeviceHeading(event, declination);

      let compassDeg: number | null = null;
      if (headingResult !== null) {
        compassDeg = headingResult.heading;
        setIsTrueNorth(headingResult.isTrueNorth);
      }

      if (compassDeg !== null && !isNaN(compassDeg)) {
        setHasCompassSensor(true);
        setRawHeading(compassDeg);

        // Exponential Moving Average (EMA) smoothing for stability (reduces sensor jitter)
        const prev = headingRef.current;
        let smoothed = compassDeg;
        if (prev !== null) {
          const diff = ((compassDeg - prev + 540) % 360) - 180;
          smoothed = (prev + diff * 0.25 + 360) % 360;
        }
        headingRef.current = smoothed;
        setSmoothedHeading(Math.round(smoothed));
      } else if (hasCompassSensor === null) {
        setHasCompassSensor(false);
      }
    };

    const win = window as any;

    // Check for Android deviceorientationabsolute or iOS permission
    if (typeof win.DeviceOrientationEvent !== 'undefined' && typeof win.DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ permission flow
      win.DeviceOrientationEvent.requestPermission()
        .then((perm: string) => {
          if (perm === 'granted' && isSubscribed) {
            win.addEventListener('deviceorientation', onOrientation, true);
            setHasCompassSensor(true);
          } else {
            setHasCompassSensor(false);
          }
        })
        .catch(() => {
          if (isSubscribed) setHasCompassSensor(false);
        });
    } else {
      // Try absolute orientation first (Android Chrome)
      if ('ondeviceorientationabsolute' in win) {
        win.addEventListener('deviceorientationabsolute', onOrientation, true);
      }
      win.addEventListener('deviceorientation', onOrientation, true);
    }

    // Sensor check fallback timer: if no orientation within 1.5s, report sensor unavailable
    const timer = setTimeout(() => {
      if (isSubscribed && headingRef.current === null) {
        setHasCompassSensor(false);
      }
    }, 1800);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
      if ('ondeviceorientationabsolute' in win) {
        win.removeEventListener('deviceorientationabsolute', onOrientation, true);
      }
      win.removeEventListener('deviceorientation', onOrientation, true);
    };
  }, [isOpen]);

  // Calculate Qibla bearing and distance
  const qiblaBearing = coords ? calculateQiblaBearing(coords.lat, coords.lon) : 136;
  const distanceKm = coords ? calculateDistanceToKaaba(coords.lat, coords.lon) : 0;

  // Real-time Solar position for the user's location
  const solarPosition = useMemo(() => {
    if (!coords) return { azimuth: 180, altitude: 45, isDay: true };
    return getSolarPosition(coords.lat, coords.lon, new Date());
  }, [coords]);

  // Continuous Angle Unwrapping for Dial and Needle to prevent 360° spin-back animations
  useEffect(() => {
    if (smoothedHeading === null) {
      // Static mode (no active compass sensor)
      const targetNeedle = qiblaBearing;
      const unwrappedN = unwrapAngle(unwrappedNeedleRef.current, targetNeedle);
      unwrappedNeedleRef.current = unwrappedN;
      setUnwrappedNeedleAngle(unwrappedN);
      setUnwrappedDialAngle(0);
      return;
    }

    // 1. Dial Ring rotation: rotates by -deviceHeading so that North stays pinned to true North
    const targetDial = -smoothedHeading;
    const unwrappedD = unwrapAngle(unwrappedDialRef.current, targetDial);
    unwrappedDialRef.current = unwrappedD;
    setUnwrappedDialAngle(unwrappedD);

    // 2. Needle angle: points from the top of the phone towards Qibla
    const targetNeedle = (qiblaBearing - smoothedHeading + 360) % 360;
    const unwrappedN = unwrapAngle(unwrappedNeedleRef.current, targetNeedle);
    unwrappedNeedleRef.current = unwrappedN;
    setUnwrappedNeedleAngle(unwrappedN);
  }, [smoothedHeading, qiblaBearing]);

  // Is phone currently pointing at Qibla? (within ±3.5 degrees)
  const angleDifferenceToQibla =
    smoothedHeading !== null
      ? Math.abs(((qiblaBearing - smoothedHeading + 540) % 360) - 180)
      : null;
  const isFacingQibla = angleDifferenceToQibla !== null && angleDifferenceToQibla <= 3.5;

  // Phone level check: Is phone held reasonably flat?
  const isDeviceFlat = Math.abs(devicePitch) < 22 && Math.abs(deviceRoll) < 22;

  // Haptic Feedback on successful Qibla alignment
  useEffect(() => {
    if (isFacingQibla && typeof navigator !== 'undefined' && navigator.vibrate) {
      const now = Date.now();
      if (now - lastVibrateRef.current > 2000) {
        lastVibrateRef.current = now;
        try {
          navigator.vibrate([40, 60, 40]);
        } catch {
          // ignore
        }
      }
    }
  }, [isFacingQibla]);

  // Filtered cities list for manual search
  const filteredCities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return PRESET_CITIES;
    return PRESET_CITIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Solar Guidance Text
  const solarGuidance = useMemo(() => {
    if (!solarPosition.isDay) {
      return {
        title: 'الشمس غاربة حالياً (ليلاً)',
        desc: 'اعتمد على البوصلة الذكية أو الشمال الجغرافي أو الخريطة لتحديد القبلة بدقة.',
        diffAngle: 0,
        direction: 'night',
      };
    }

    // Calculate angular difference between Sun and Qibla
    const diff = ((qiblaBearing - solarPosition.azimuth + 540) % 360) - 180;
    const absDiff = Math.abs(Math.round(diff));

    if (absDiff <= 5) {
      return {
        title: 'الشمس باتجاه القبلة تماماً الآن!',
        desc: 'وجّه نظرك باتجاه قرص الشمس مباشرة (أو أمامك)، وستكون متجهاً للقبلة المشرفة بدقة 100%.',
        diffAngle: absDiff,
        direction: 'direct',
      };
    } else if (absDiff >= 175) {
      return {
        title: 'الشمس خلفك تماماً بالنسبة للقبلة',
        desc: 'اجعل ظهرك للشمس مباشرة، وسيكون وجهك متجهاً نحو القبلة المشرفة بدقة تامة.',
        diffAngle: absDiff,
        direction: 'back',
      };
    } else if (diff > 0) {
      return {
        title: `القبلة إلى يسار الشمس بـ ${absDiff}°`,
        desc: `قف مستقبلاً الشمس، ثم انحرف يساراً بزاوية ${absDiff}° تقريباً لتكون في مواجهة الكعبة المشرفة.`,
        diffAngle: absDiff,
        direction: 'left',
      };
    } else {
      return {
        title: `القبلة إلى يمين الشمس بـ ${absDiff}°`,
        desc: `قف مستقبلاً الشمس، ثم انحرف يميناً بزاوية ${absDiff}° تقريباً لتكون في مواجهة الكعبة المشرفة.`,
        diffAngle: absDiff,
        direction: 'right',
      };
    }
  }, [solarPosition, qiblaBearing]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-lg bg-[#FDFCF7] rounded-3xl border border-[#E8E2D5] shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* ================= Header ================= */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E8E2D5] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center shadow-xs">
              <span className="text-xl">🕋</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#1F2421]">اتجاه القبلة الشريفة</h3>
                {isFacingQibla && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF7EE] text-[#2D6A4F] border border-[#B7E4C7] animate-pulse">
                    مواجه للقبلة ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-[#736B63] mt-0.5">
                الكعبة المشرفة: {qiblaBearing}° من الشمال الجغرافي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F3EFE6] text-[#736B63] transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= Location Bar ================= */}
        <div className="px-5 py-2.5 bg-[#FAF7F2] border-b border-[#E8E2D5] flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-[#2D6A4F] shrink-0" />
            <span className="font-bold text-[#1F2421] truncate">
              {coords ? locationName : 'جاري تحديد موقعك...'}
            </span>
            {accuracyMeters && (
              <span className="text-[10px] text-[#736B63] hidden sm:inline">
                (دقة GPS: ±{accuracyMeters}م)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowCityPicker(!showCityPicker)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F3EFE6] border border-[#E8E2D5] text-[#403B36] font-bold transition-colors cursor-pointer"
            >
              تغيير المدينة
            </button>
            <button
              onClick={requestLocation}
              title="تحديث الموقع الجغرافي عبر GPS"
              className="p-1.5 rounded-lg bg-white hover:bg-[#F3EFE6] border border-[#E8E2D5] text-[#2D6A4F] transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ================= Navigation Tabs ================= */}
        <div className="px-5 pt-3 pb-2 bg-white border-b border-[#E8E2D5] flex items-center justify-center gap-2">
          <button
            onClick={() => setActiveTab('compass')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'compass'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#736B63] hover:bg-[#F3EFE6] border border-[#E8E2D5]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>البوصلة الذكية</span>
          </button>

          <button
            onClick={() => setActiveTab('solar')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'solar'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#736B63] hover:bg-[#F3EFE6] border border-[#E8E2D5]'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>دليل الشمس (100% يقين)</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#736B63] hover:bg-[#F3EFE6] border border-[#E8E2D5]'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>خريطة القبلة</span>
          </button>
        </div>

        {/* ================= Main Scrollable Content ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* City Selection Dropdown / Accordion */}
          {showCityPicker && (
            <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] shadow-md space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1F2421]">اختر مدينتك من القائمة المعتمدة:</h4>
                <button
                  onClick={() => setShowCityPicker(false)}
                  className="text-xs text-[#736B63] hover:text-[#1F2421] font-bold"
                >
                  إغلاق
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن المحافظة أو المدينة (مصر، السعودية، العالم)..."
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] focus:outline-none focus:border-[#2D6A4F]"
                />
                <Search className="w-3.5 h-3.5 text-[#857B72] absolute right-2.5 top-2.5" />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 divide-y divide-[#F0ECE1]">
                {filteredCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => selectPresetCity(city)}
                    className="w-full text-right px-3 py-2 text-xs hover:bg-[#FAF7F2] flex items-center justify-between text-[#403B36] transition-colors cursor-pointer rounded-lg"
                  >
                    <span className="font-bold">{city.name}</span>
                    <span className="text-[11px] text-[#8C827A]">{city.country}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 1: Smart Compass */}
          {activeTab === 'compass' && (
            <div className="space-y-4">
              {/* Guidance Banner */}
              <div className="text-center space-y-1">
                {isFacingQibla ? (
                  <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#EBF7EE] border border-[#A7E0BA] text-[#1E4535] text-xs font-bold shadow-xs animate-bounce">
                    <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                    <span>أنت الآن في اتجاه القبلة تماماً 🕋✨</span>
                  </div>
                ) : hasCompassSensor && smoothedHeading !== null ? (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E8E2D5] text-xs text-[#554E46]">
                    <span>وجّه أعلى هاتفك حتى ينطبق السهم على الكعبة</span>
                    <span className="font-bold text-[#2D6A4F] font-mono">
                      (الفرق: {angleDifferenceToQibla}°)
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E8E2D5] text-xs text-[#554E46]">
                    <span>زاوية القبلة:</span>
                    <span className="font-bold text-[#2D6A4F] font-mono">{qiblaBearing}°</span>
                    <span>بالنسبة للشمال الجغرافي</span>
                  </div>
                )}
              </div>

              {/* Dial Container */}
              <div className="relative flex flex-col items-center justify-center py-2">
                <div
                  className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 flex items-center justify-center transition-colors duration-300 ${
                    isFacingQibla
                      ? 'border-[#2D6A4F] shadow-[0_0_35px_rgba(45,106,79,0.35)] bg-gradient-to-b from-[#EBF7EE] to-white'
                      : 'border-[#E8E2D5] shadow-inner bg-white'
                  }`}
                >
                  {/* Rotating Dial Ring (Stays aligned with True Earth North) */}
                  <div
                    className="absolute inset-0 rounded-full transition-transform duration-150 ease-out"
                    style={{
                      transform: `rotate(${unwrappedDialAngle}deg)`,
                    }}
                  >
                    {/* North (N) */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                      <span className="text-xs font-black text-[#C84B31]">شمال N</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C84B31] mt-0.5" />
                    </div>

                    {/* East (E) */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                      <span className="text-xs font-bold text-[#8C827A]">شرق E</span>
                    </div>

                    {/* South (S) */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8C827A] mb-0.5" />
                      <span className="text-xs font-bold text-[#8C827A]">جنوب S</span>
                    </div>

                    {/* West (W) */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                      <span className="text-xs font-bold text-[#8C827A]">غرب W</span>
                    </div>

                    {/* Degree Ticks */}
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                      <div
                        key={deg}
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-[#D1C7BA] origin-[50%_128px] sm:origin-[50%_144px]"
                        style={{ transform: `rotate(${deg}deg)` }}
                      />
                    ))}

                    {/* Target Kaaba Icon on Dial Ring */}
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 origin-[50%_128px] sm:origin-[50%_144px]"
                      style={{ transform: `rotate(${qiblaBearing}deg)` }}
                    >
                      <div className="flex flex-col items-center -mt-3.5">
                        <span className="text-xl filter drop-shadow-md animate-pulse">🕋</span>
                      </div>
                    </div>
                  </div>

                  {/* Center Needle (Points directly to Qibla relative to top of phone) */}
                  <div
                    className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-150 ease-out"
                    style={{
                      transform: `rotate(${unwrappedNeedleAngle}deg)`,
                    }}
                  >
                    {/* Arrow Pointer */}
                    <div className="absolute top-6 flex flex-col items-center">
                      <div
                        className={`w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-b-[30px] drop-shadow-md transition-colors ${
                          isFacingQibla ? 'border-b-[#1E4535]' : 'border-b-[#2D6A4F]'
                        }`}
                      />
                      <div
                        className={`w-2 h-16 rounded-full mt-[-2px] transition-colors ${
                          isFacingQibla ? 'bg-[#1E4535]' : 'bg-[#2D6A4F]'
                        }`}
                      />
                    </div>

                    {/* Needle Counterweight */}
                    <div className="absolute bottom-9 w-1.5 h-11 bg-[#C84B31]/80 rounded-full" />

                    {/* Center Pin */}
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-[#2D6A4F] shadow-md flex items-center justify-center z-20">
                      <div
                        className={`w-3 h-3 rounded-full transition-colors ${
                          isFacingQibla ? 'bg-[#1E4535]' : 'bg-[#2D6A4F]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Phone Top Direction Reference Marker */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
                    <ArrowUp className="w-4 h-4 text-[#2D6A4F] drop-shadow-xs animate-pulse" />
                  </div>
                </div>

                {/* Accuracy & Bearing Readout Card */}
                <div className="mt-4 text-center space-y-1.5">
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-[#E8E2D5] shadow-2xs">
                    <div className="text-right">
                      <span className="text-[11px] text-[#736B63] block">زاوية القبلة:</span>
                      <span className="text-base font-bold font-mono text-[#2D6A4F]" dir="ltr">
                        {qiblaBearing}°
                      </span>
                    </div>

                    {smoothedHeading !== null && (
                      <>
                        <div className="w-px h-7 bg-[#E8E2D5]" />
                        <div className="text-right">
                          <span className="text-[11px] text-[#736B63] block">وجهة هاتفك:</span>
                          <span className="text-base font-bold font-mono text-[#403B36]" dir="ltr">
                            {smoothedHeading}°
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Level status indicator */}
                  {hasCompassSensor && (
                    <div className="flex items-center justify-center gap-2 text-[11px]">
                      <span className={`w-2 h-2 rounded-full ${isDeviceFlat ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className={isDeviceFlat ? 'text-[#2D6A4F] font-bold' : 'text-[#854D0E]'}>
                        {isDeviceFlat
                          ? 'الهاتف في وضع أفقي مستوٍ ممتاز للدقة'
                          : 'امسك الهاتف بوضع أفقي مسطح لدقة أعلى'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Calibration Notice and Toggle */}
              <div className="bg-[#FAF7F2] rounded-2xl p-3.5 border border-[#E8E2D5] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#403B36] flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#B8860B]" />
                    <span>ملاحظات هامة لدقة البوصلة:</span>
                  </span>
                  <button
                    onClick={() => setShowCalibrationGuide(!showCalibrationGuide)}
                    className="text-[#2D6A4F] font-bold underline cursor-pointer"
                  >
                    {showCalibrationGuide ? 'إخفاء الإرشادات' : 'كيفية المعايرة'}
                  </button>
                </div>

                {showCalibrationGuide && (
                  <div className="text-[#554E46] space-y-1.5 pt-1 border-t border-[#E8E2D5] text-[11px] leading-relaxed">
                    <p>
                      <strong>1. ابتعد عن المعادن والمغناطيس:</strong> حافظات الهواتف المغناطيسية، أجهزة اللابتوب، والأسطح المعدنية تشوش مستشعر البوصلة بشدة.
                    </p>
                    <p>
                      <strong>2. معايرة المستشعر:</strong> حرّك هاتفك في الهواء بهدوء على شكل رقم ثمانية بالإنجليزية (∞) عدة مرات لإعادة ضبط المغناطيسية.
                    </p>
                    <p>
                      <strong>3. الدليل الشرعي اليقيني:</strong> إذا كنت داخل مبنى به حديد تسليح، يمكنك استخدام تبويب <strong>«دليل الشمس»</strong> أو <strong>«خريطة القبلة»</strong> بالأعلى لتحديد الاتجاه يقيناً 100%.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Solar Qibla Guide (100% Infallible Astronomical Reference) */}
          {activeTab === 'solar' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] rounded-3xl p-5 border border-[#FDE68A] text-right space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <Sun className="w-5 h-5 text-amber-600 animate-spin" style={{ animationDuration: '20s' }} />
                  <span className="text-sm">طريقة الشمس والظل (الدليل القطعي الشرعي)</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  حركة الشمس في السماء هي المرجع الفلكي والشرعي الموثوق 100% الذي لا يتأثر بأي تشويش إلكتروني أو مجالات مغناطيسية.
                </p>
              </div>

              {/* Real-time Solar Reading Card */}
              <div className="bg-white rounded-3xl p-5 border border-[#E8E2D5] shadow-xs space-y-4 text-center">
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-[#1F2421]">
                    {solarGuidance.title}
                  </h4>
                  <p className="text-xs text-[#554E46] leading-relaxed max-w-md mx-auto">
                    {solarGuidance.desc}
                  </p>
                </div>

                {/* Solar vs Qibla Gauge Visualizer */}
                <div className="relative w-full max-w-xs mx-auto py-4 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full border-2 border-dashed border-[#E8E2D5] bg-[#FAF7F2] relative flex items-center justify-center">
                    {/* Center Person Pin */}
                    <div className="w-7 h-7 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center text-xs font-bold z-10 shadow-sm">
                      أنت
                    </div>

                    {/* Sun Position Marker */}
                    {solarPosition.isDay && (
                      <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 origin-[50%_96px]"
                        style={{ transform: `rotate(${solarPosition.azimuth}deg)` }}
                      >
                        <div className="flex flex-col items-center -mt-4">
                          <Sun className="w-6 h-6 text-amber-500 filter drop-shadow-sm" />
                          <span className="text-[10px] font-bold text-amber-700 bg-white px-1.5 py-0.5 rounded-full border border-amber-200 mt-0.5">
                            الشمس ({solarPosition.azimuth}°)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Kaaba Position Marker */}
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 origin-[50%_96px]"
                      style={{ transform: `rotate(${qiblaBearing}deg)` }}
                    >
                      <div className="flex flex-col items-center -mt-4">
                        <span className="text-xl filter drop-shadow-sm">🕋</span>
                        <span className="text-[10px] font-bold text-[#2D6A4F] bg-white px-1.5 py-0.5 rounded-full border border-[#B7E4C7] mt-0.5">
                          القبلة ({qiblaBearing}°)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Solar Data Specs */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#F0ECE1]">
                  <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5]">
                    <span className="text-[11px] text-[#736B63] block">زاوية الشمس الآن:</span>
                    <span className="text-sm font-bold font-mono text-amber-700" dir="ltr">
                      {solarPosition.azimuth}°
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5]">
                    <span className="text-[11px] text-[#736B63] block">ارتفاع الشمس:</span>
                    <span className="text-sm font-bold font-mono text-[#2D6A4F]" dir="ltr">
                      {solarPosition.altitude}°
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Qibla Map Alignment */}
          {activeTab === 'map' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-5 border border-[#E8E2D5] shadow-xs space-y-4 text-center">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#1F2421]">
                    خط القبلة المباشر من موقعك إلى مكة المكرمة
                  </h4>
                  <p className="text-xs text-[#736B63]">
                    يساعدك على مطابقة القبلة مع اتجاه النوافذ وشوارع مدينتك مباشرة.
                  </p>
                </div>

                {/* Interactive Map Frame / Static Visualization */}
                {coords && (
                  <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-[#E8E2D5] bg-[#F5F2EB] flex items-center justify-center shadow-inner">
                    <iframe
                      title="خريطة القبلة"
                      width="100%"
                      height="100%"
                      className="border-0"
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - 0.04}%2C${coords.lat - 0.04}%2C${coords.lon + 0.04}%2C${coords.lat + 0.04}&layer=mapnik&marker=${coords.lat}%2C${coords.lon}`}
                    />

                    {/* Overlay Directional Beam Vector towards Kaaba */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div
                        className="w-1 h-36 bg-gradient-to-t from-[#2D6A4F] to-transparent origin-bottom animate-pulse"
                        style={{ transform: `rotate(${qiblaBearing}deg)` }}
                      />
                      <div className="absolute w-4 h-4 rounded-full bg-[#2D6A4F] ring-4 ring-white shadow-md" />
                    </div>

                    {/* Floating Kaaba Direction Badge */}
                    <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-[#E8E2D5] text-[11px] font-bold text-[#2D6A4F] shadow-xs flex items-center gap-1">
                      <span>🕋 اتجاه الكعبة: {qiblaBearing}°</span>
                    </div>
                  </div>
                )}

                {/* External Maps Quick Link */}
                {coords && (
                  <div className="pt-1 flex justify-center">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lon}&destination=${KAABA_COORDINATES.latitude},${KAABA_COORDINATES.longitude}&travelmode=driving`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFE6] border border-[#E8E2D5] text-xs font-bold text-[#2D6A4F] transition-all cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>فتح مسار الكعبة على خرائط Google</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================= Footer ================= */}
        <div className="p-4 bg-white border-t border-[#E8E2D5] flex items-center justify-between text-xs">
          <div className="text-[#736B63] flex items-center gap-1.5">
            <span className="font-bold text-[#2D6A4F]">المسافة للكعبة:</span>
            <span>حوالي {distanceKm.toLocaleString('ar-EG')} كم</span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-[#2D6A4F] text-white font-bold hover:bg-[#1E4535] cursor-pointer transition-all shadow-xs"
          >
            تم
          </button>
        </div>
      </div>
    </div>
  );
};
