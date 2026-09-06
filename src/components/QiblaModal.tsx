import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Compass,
  MapPin,
  RotateCw,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Navigation,
  Sparkles,
} from 'lucide-react';
import {
  calculateQiblaBearing,
  calculateDistanceToKaaba,
  KAABA_COORDINATES,
  PRESET_CITIES,
  CityLocation,
} from '../utils/qibla';

interface QiblaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QiblaModal: React.FC<QiblaModalProps> = ({ isOpen, onClose }) => {
  // Location state
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'requesting' | 'granted' | 'denied' | 'manual'>('prompt');
  const [locationError, setLocationError] = useState<string>('');

  // Manual city selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);

  // Compass / Sensor state
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [hasCompassSensor, setHasCompassSensor] = useState<boolean | null>(null);
  const [isPermissionRequested, setIsPermissionRequested] = useState(false);

  // Vibration throttle ref
  const lastVibrateRef = useRef<number>(0);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen && !coords) {
      requestLocation();
    }
  }, [isOpen]);

  // Request browser geolocation
  const requestLocation = () => {
    setLocationStatus('requesting');
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setLocationError('المتصفح لا يدعم تحديد الموقع الجغرافي.');
      // Default to Cairo as sensible fallback
      selectPresetCity(PRESET_CITIES[0]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lon: longitude });
        setLocationName('موقعك الحالي (GPS)');
        setLocationStatus('granted');
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setLocationStatus('denied');
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('تم رفض إذن تحديد الموقع. يمكنك اختيار مدينتك يدوياً أدناه.');
        } else {
          setLocationError('تعذر تحديد الموقع تلقائياً. يمكنك اختيار مدينتك يدوياً.');
        }
        // Fallback default city (Cairo)
        if (!coords) {
          selectPresetCity(PRESET_CITIES[0]);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const selectPresetCity = (city: CityLocation) => {
    setCoords({ lat: city.lat, lon: city.lon });
    setLocationName(`${city.name}، ${city.country}`);
    setLocationStatus('manual');
    setShowCityPicker(false);
  };

  // Setup device orientation sensor listener
  useEffect(() => {
    if (!isOpen) return;

    let orientationHandler: ((e: DeviceOrientationEvent) => void) | null = null;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      // iOS webkitCompassHeading vs Android absolute
      let heading: number | null = null;

      // @ts-expect-error - iOS specific property
      if (typeof event.webkitCompassHeading !== 'undefined') {
        // @ts-expect-error - iOS specific property
        heading = event.webkitCompassHeading;
      } else if (event.alpha !== null) {
        // Android or standard: alpha is rotation around z axis
        // When deviceorientationabsolute is available, 360 - alpha gives compass heading
        heading = 360 - event.alpha;
      }

      if (heading !== null && !isNaN(heading)) {
        setHasCompassSensor(true);
        setDeviceHeading(Math.round(heading));
      } else {
        // If values are null or undefined
        if (hasCompassSensor === null) {
          setHasCompassSensor(false);
        }
      }
    };

    // Check if we need to request permission for iOS 13+
    const requestDeviceOrientation = async () => {
      const win = window as any;
      if (typeof win.DeviceOrientationEvent !== 'undefined' && typeof win.DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permission = await win.DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            win.addEventListener('deviceorientation', handleOrientation, true);
            orientationHandler = handleOrientation;
          } else {
            setHasCompassSensor(false);
          }
        } catch (err) {
          console.warn('DeviceOrientation permission error:', err);
          setHasCompassSensor(false);
        }
      } else if ('ondeviceorientationabsolute' in win) {
        win.addEventListener('deviceorientationabsolute', handleOrientation, true);
        orientationHandler = handleOrientation;
      } else if ('ondeviceorientation' in win) {
        win.addEventListener('deviceorientation', handleOrientation, true);
        orientationHandler = handleOrientation;
      } else {
        setHasCompassSensor(false);
      }
    };

    requestDeviceOrientation();

    // Fallback timer: if no orientation event fired within 1.5s, sensor is not available
    const sensorCheckTimer = setTimeout(() => {
      setHasCompassSensor((prev) => (prev === null ? false : prev));
    }, 1500);

    return () => {
      clearTimeout(sensorCheckTimer);
      const win = window as any;
      if (orientationHandler) {
        win.removeEventListener('deviceorientation', orientationHandler, true);
        win.removeEventListener('deviceorientationabsolute', orientationHandler, true);
      }
    };
  }, [isOpen, isPermissionRequested]);

  // Request sensor permission explicitly on mobile button press if needed
  const handleEnableSensor = async () => {
    setIsPermissionRequested(true);
    const win = window as any;
    if (typeof win.DeviceOrientationEvent !== 'undefined' && typeof win.DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const res = await win.DeviceOrientationEvent.requestPermission();
        if (res === 'granted') {
          setHasCompassSensor(true);
        } else {
          setHasCompassSensor(false);
        }
      } catch (err) {
        setHasCompassSensor(false);
      }
    }
  };

  if (!isOpen) return null;

  // Qibla calculations
  const qiblaBearing = coords ? calculateQiblaBearing(coords.lat, coords.lon) : 136;
  const distanceKm = coords ? calculateDistanceToKaaba(coords.lat, coords.lon) : 0;

  // Needle angle relative to current phone direction
  // If sensor available: needle rotation = (qiblaBearing - deviceHeading)
  // If sensor not available: static needle pointing at qiblaBearing
  const needleAngle = deviceHeading !== null ? (qiblaBearing - deviceHeading + 360) % 360 : qiblaBearing;

  // Is facing Qibla? (within ±4 degrees)
  const angleDiff = deviceHeading !== null ? Math.abs((qiblaBearing - deviceHeading + 540) % 360 - 180) : null;
  const isFacingQibla = angleDiff !== null && angleDiff <= 4;

  // Haptic feedback when facing Qibla
  if (isFacingQibla && typeof navigator !== 'undefined' && navigator.vibrate) {
    const now = Date.now();
    if (now - lastVibrateRef.current > 1500) {
      lastVibrateRef.current = now;
      try {
        navigator.vibrate([40, 50, 40]);
      } catch (e) {
        // ignore
      }
    }
  }

  // Filtered preset cities for manual picker
  const filteredCities = PRESET_CITIES.filter(
    (c) => c.name.includes(searchQuery.trim()) || c.country.includes(searchQuery.trim())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white rounded-3xl border border-[#E8E2D5] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0ECE1] bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center shadow-xs">
              <span className="text-lg">🕋</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1F2421]">اتجاه القبلة</h3>
              <p className="text-[11px] text-[#736B63]">نحو الكعبة المشرفة بمكة المكرمة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#EAE4D7] text-[#736B63] transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Location Bar & Status */}
          <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs">
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-4 h-4 text-[#2D6A4F] shrink-0" />
              <span className="font-semibold text-[#1F2421] truncate">
                {coords ? locationName : 'لم يُحدد الموقع بعد'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowCityPicker(!showCityPicker)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F3EFE6] border border-[#E8E2D5] text-[#554E46] font-medium transition-colors cursor-pointer"
              >
                تغيير المدينة
              </button>
              <button
                onClick={requestLocation}
                title="تحديث الموقع الجغرافي عبر GPS"
                className="p-1 rounded-lg bg-white hover:bg-[#F3EFE6] border border-[#E8E2D5] text-[#2D6A4F] transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Location Permission Prompt (if denied or prompt) */}
          {locationStatus === 'denied' && (
            <div className="p-3.5 rounded-2xl bg-[#FFF8EE] border border-[#F3DFC1] text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#A25A19] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#A25A19]">
                    نحتاج إلى موقعك لتحديد اتجاه القبلة بدقة.
                  </p>
                  <p className="text-[#855B32] mt-0.5 leading-relaxed">
                    {locationError || 'يمكنك منح الإذن أو اختيار مدينتك الحالية من القائمة يدوياً.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={requestLocation}
                  className="px-3 py-1.5 rounded-xl bg-[#A25A19] text-white font-bold hover:bg-[#854711] transition-colors cursor-pointer"
                >
                  السماح بالموقع
                </button>
                <button
                  onClick={() => setShowCityPicker(true)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E8D4BE] text-[#A25A19] font-medium hover:bg-[#FAF0E6] transition-colors cursor-pointer"
                >
                  اختيار المدينة يدوياً
                </button>
              </div>
            </div>
          )}

          {/* City Selection Accordion */}
          {showCityPicker && (
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1F2421]">اختر مدينتك لتحديد القبلة:</h4>
                <button
                  onClick={() => setShowCityPicker(false)}
                  className="text-xs text-[#736B63] hover:text-[#1F2421]"
                >
                  إغلاق
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن اسم المدينة أو الدولة..."
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-[#E8E2D5] bg-white focus:outline-none focus:border-[#2D6A4F]"
                />
                <Search className="w-3.5 h-3.5 text-[#857B72] absolute right-2.5 top-2.5" />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {filteredCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => selectPresetCity(city)}
                    className="w-full text-right px-3 py-1.5 rounded-lg text-xs hover:bg-white flex items-center justify-between text-[#403B36] transition-colors cursor-pointer"
                  >
                    <span className="font-medium">{city.name}</span>
                    <span className="text-[11px] text-[#8C827A]">{city.country}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Compass Display Area */}
          <div className="relative flex flex-col items-center justify-center py-4 sm:py-6">
            {/* Status indicator banner */}
            <div className="mb-4 text-center">
              {isFacingQibla ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8F5E9] border border-[#A5D6A7] text-[#1B5E20] text-xs font-bold shadow-xs animate-bounce">
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                  <span>أنت تواجه القبلة الآن 🕋✨</span>
                </div>
              ) : hasCompassSensor ? (
                <p className="text-xs text-[#6A635B] font-medium">
                  حرّك هاتفك حتى يشير السهم نحو القبلة 🕋
                </p>
              ) : (
                <p className="text-xs text-[#6A635B] font-medium">
                  زاوية القبلة: <span className="font-bold text-[#2D6A4F]">{qiblaBearing}°</span> بالنسبة للشمال الجغرافي (N)
                </p>
              )}
            </div>

            {/* Circular Compass Dial */}
            <div
              className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                isFacingQibla
                  ? 'border-[#2D6A4F] shadow-[0_0_30px_rgba(45,106,79,0.35)] bg-gradient-to-b from-[#E8F5E9]/50 to-white'
                  : 'border-[#E8E2D5] shadow-inner bg-[#FAF7F2]'
              }`}
            >
              {/* Compass Cardinal Points Ring */}
              <div
                className="absolute inset-0 rounded-full transition-transform duration-200 ease-out"
                style={{
                  transform: hasCompassSensor && deviceHeading !== null ? `rotate(${-deviceHeading}deg)` : 'rotate(0deg)',
                }}
              >
                {/* North marker (N) */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="text-xs font-black text-[#C84B31]">شمال N</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C84B31] mt-0.5" />
                </div>

                {/* East marker (E) */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                  <span className="text-xs font-bold text-[#8C827A]">شرق E</span>
                </div>

                {/* South marker (S) */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8C827A] mb-0.5" />
                  <span className="text-xs font-bold text-[#8C827A]">جنوب S</span>
                </div>

                {/* West marker (W) */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                  <span className="text-xs font-bold text-[#8C827A]">غرب W</span>
                </div>

                {/* Dial ticks */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <div
                    key={deg}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-[#D1C7BA] origin-[50%_128px] sm:origin-[50%_144px]"
                    style={{ transform: `rotate(${deg}deg)` }}
                  />
                ))}

                {/* Fixed Kaaba Target indicator on the dial ring */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 origin-[50%_128px] sm:origin-[50%_144px]"
                  style={{ transform: `rotate(${qiblaBearing}deg)` }}
                >
                  <div className="flex flex-col items-center -mt-3.5">
                    <span className="text-lg filter drop-shadow-sm">🕋</span>
                  </div>
                </div>
              </div>

              {/* Center Needle (Pointing to Qibla) */}
              <div
                className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-200 ease-out"
                style={{
                  transform: `rotate(${needleAngle}deg)`,
                }}
              >
                {/* Arrow Pointer to Qibla */}
                <div className="absolute top-7 flex flex-col items-center">
                  <div
                    className={`w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[28px] ${
                      isFacingQibla ? 'border-b-[#2D6A4F]' : 'border-b-[#2D6A4F]'
                    } drop-shadow-md`}
                  />
                  <div className="w-1.5 h-16 bg-[#2D6A4F] rounded-full mt-[-2px]" />
                </div>

                {/* Counterweight */}
                <div className="absolute bottom-10 w-1.5 h-10 bg-[#C84B31]/70 rounded-full" />

                {/* Center Pivot Pin */}
                <div className="w-7 h-7 rounded-full bg-white border-2 border-[#2D6A4F] shadow-md flex items-center justify-center z-20">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F]" />
                </div>
              </div>
            </div>

            {/* Bearing Display Box */}
            <div className="mt-5 text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
                <span className="text-xs text-[#736B63] font-medium">اتجاه القبلة:</span>
                <span className="text-lg font-bold font-mono text-[#2D6A4F]" dir="ltr">
                  {qiblaBearing}°
                </span>
                {deviceHeading !== null && (
                  <span className="text-[11px] text-[#8C827A] border-r border-[#E8E2D5] pr-2 mr-1">
                    وجهتك: {deviceHeading}°
                  </span>
                )}
              </div>

              {distanceKm > 0 && (
                <p className="text-[11px] text-[#8C827A]">
                  المسافة إلى الكعبة المشرفة: حوالي{' '}
                  <span className="font-semibold text-[#554E46]">{distanceKm.toLocaleString('ar-EG')}</span> كم
                </p>
              )}
            </div>
          </div>

          {/* Compass Sensor Notice (Required fallback handling) */}
          {hasCompassSensor === false && (
            <div className="p-3.5 rounded-2xl bg-[#F7F6F2] border border-[#E8E2D5] text-xs text-[#554E46] space-y-1.5">
              <div className="flex items-center gap-2 text-[#A25A19] font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>جهازك لا يدعم مستشعر الاتجاه المطلوب للبوصلة الحية.</span>
              </div>
              <p className="text-[#736B63] leading-relaxed">
                لا بأس! تم احتساب زاوية القبلة بدقة: وجه نفسك بزاوية{' '}
                <strong className="text-[#2D6A4F]">{qiblaBearing}°</strong> بالنسبة لجهة الشمال الجغرافي، أو استعن بجهة شروق/غروب الشمس.
              </p>
            </div>
          )}

          {/* iOS permission prompt button if available */}
          {hasCompassSensor === null && (
            <div className="text-center pt-1">
              <button
                onClick={handleEnableSensor}
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFE6] border border-[#E8E2D5] text-xs font-semibold text-[#2D6A4F] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Compass className="w-4 h-4" />
                <span>تفعيل مستشعر البوصلة الحية</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#F0ECE1] flex items-center justify-between">
          <span className="text-[11px] text-[#736B63] flex items-center gap-1">
            <span>﴿فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ﴾</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4535] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            تم
          </button>
        </div>
      </div>
    </div>
  );
};
