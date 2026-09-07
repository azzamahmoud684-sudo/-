import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  MapPin,
  Compass,
  Volume2,
  VolumeX,
  Play,
  Pause,
  CheckCircle2,
  Check,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronDown,
  Navigation,
  Bell,
  BellRing,
  BookOpen,
  Calendar,
  AlertCircle,
  Loader2,
  X,
  Search,
  Sliders,
} from 'lucide-react';
import {
  UserLocationConfig,
  CalculationMethodId,
  CALCULATION_METHODS,
  POPULAR_CITIES,
  DEFAULT_LOCATION,
  calculatePrayerTimes,
  getDetailedPrayerList,
  DetailedPrayerItem,
  formatTime12,
  formatTime24,
  ATHAN_AUDIOS,
  AthanAudioOption,
  loadUserPrayerLocation,
  saveUserPrayerLocation,
  findNearestCity,
} from '../utils/prayerCalculator';
import { UserProgress } from '../types';

interface PrayerSectionProps {
  progress: UserProgress;
  onUpdatePrayersCompleted: (prayers: string[]) => void;
  onOpenQibla: () => void;
  onOpenAdhkarAfterPrayer: () => void;
}

export const PrayerSection: React.FC<PrayerSectionProps> = ({
  progress,
  onUpdatePrayersCompleted,
  onOpenQibla,
  onOpenAdhkarAfterPrayer,
}) => {
  // Location config
  const [location, setLocation] = useState<UserLocationConfig>(() => loadUserPrayerLocation());
  const [isLocating, setIsLocating] = useState(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);

  // Modals
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [isMethodPickerOpen, setIsMethodPickerOpen] = useState(false);

  // Current time & real-time countdown
  const [currentTime, setCurrentTime] = useState(new Date());

  // Athan Audio Player
  const [selectedAthan, setSelectedAthan] = useState<AthanAudioOption>(ATHAN_AUDIOS[0]);
  const [isPlayingAthan, setIsPlayingAthan] = useState(false);
  const [isLoadingAthan, setIsLoadingAthan] = useState(false);
  const [athanError, setAthanError] = useState<string | null>(null);
  const [isAthanModalOpen, setIsAthanModalOpen] = useState(false);
  const [athanProgress, setAthanProgress] = useState(0);
  const athanAudioRef = useRef<HTMLAudioElement | null>(null);

  // Success toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-time tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute prayer list dynamically
  const prayerList = useMemo(() => {
    return getDetailedPrayerList(location, currentTime);
  }, [location, currentTime]);

  // Extra beneficial prayer times
  const extraTimes = useMemo(() => {
    const calculated = calculatePrayerTimes(
      currentTime,
      location.lat,
      location.lon,
      location.method,
      location.madhab
    );
    return {
      duha: formatTime12(calculated.duha),
      midnight: formatTime12(calculated.midnight),
      qiyam: formatTime12(calculated.qiyam),
    };
  }, [location, currentTime]);

  // Next prayer computation and countdown
  const nextPrayerInfo = useMemo(() => {
    const next = prayerList.find((p) => p.isNext) || prayerList[0];
    if (!next) {
      return {
        item: null,
        formattedCountdown: '00:00:00',
        remainingHours: 0,
        remainingMinutes: 0,
        remainingSeconds: 0,
      };
    }

    let targetMs = next.timestamp.getTime();
    const nowMs = currentTime.getTime();

    // If target is in the past (e.g. tomorrow Fajr)
    if (targetMs < nowMs) {
      const tomorrow = new Date(currentTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowTimes = calculatePrayerTimes(
        tomorrow,
        location.lat,
        location.lon,
        location.method,
        location.madhab
      );
      targetMs = tomorrowTimes.fajr.getTime();
    }

    const diffMs = Math.max(0, targetMs - nowMs);
    const totalSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const formattedCountdown = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return {
      item: next,
      formattedCountdown,
      remainingHours: hours,
      remainingMinutes: minutes,
      remainingSeconds: seconds,
    };
  }, [prayerList, currentTime, location]);

  // Handle GPS location auto-detect
  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      setLocatingError('المتصفح لا يدعم تحديد الموقع التلقائي');
      setTimeout(() => setLocatingError(null), 4000);
      return;
    }

    setIsLocating(true);
    setLocatingError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const nearest = findNearestCity(lat, lon);

        const newLoc: UserLocationConfig = {
          name: nearest ? `${nearest.name} (عبر GPS)` : 'موقعي الحالي',
          country: nearest ? nearest.country : '',
          lat,
          lon,
          isGps: true,
          method: nearest ? nearest.method : location.method,
          madhab: location.madhab,
        };

        setLocation(newLoc);
        saveUserPrayerLocation(newLoc);
        setIsLocating(false);
        setToastMessage(`تم تحديد موقعك بدقة: ${newLoc.name} ✓`);
        setTimeout(() => setToastMessage(null), 3500);
      },
      (err) => {
        setIsLocating(false);
        setLocatingError('تعذر الحصول على إذن الموقع. يمكنك اختيار مدينتك من القائمة يدويًا.');
        setTimeout(() => setLocatingError(null), 4500);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Select city from presets
  const handleSelectCity = (city: typeof POPULAR_CITIES[0]) => {
    const updated: UserLocationConfig = {
      name: city.name,
      country: city.country,
      lat: city.lat,
      lon: city.lon,
      isGps: false,
      method: city.method,
      madhab: location.madhab,
    };
    setLocation(updated);
    saveUserPrayerLocation(updated);
    setIsCityPickerOpen(false);
    setToastMessage(`تم ضبط مواقيت الصلاة على: ${city.name}، ${city.country} ✓`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Select calculation method
  const handleSelectMethod = (methodId: CalculationMethodId) => {
    const updated: UserLocationConfig = {
      ...location,
      method: methodId,
    };
    setLocation(updated);
    saveUserPrayerLocation(updated);
    setIsMethodPickerOpen(false);
    setToastMessage(`تم تغيير طريقة الحساب إلى: ${CALCULATION_METHODS[methodId].name} ✓`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Prayer completion toggle
  const handleTogglePrayerCompleted = (prayerId: string) => {
    const currentList = progress.prayersCompletedToday || [];
    let updated: string[];
    if (currentList.includes(prayerId)) {
      updated = currentList.filter((id) => id !== prayerId);
    } else {
      updated = [...currentList, prayerId];
      setToastMessage(`تقبل الله طاعتكم وصالح أعمالكم 🤲`);
      setTimeout(() => setToastMessage(null), 3000);
    }
    onUpdatePrayersCompleted(updated);
  };

  // Athan audio management
  const handlePlayAthan = (athanOption: AthanAudioOption = selectedAthan) => {
    setSelectedAthan(athanOption);
    setIsAthanModalOpen(true);
    setIsLoadingAthan(true);
    setAthanError(null);

    if (athanAudioRef.current) {
      athanAudioRef.current.pause();
      athanAudioRef.current = null;
    }

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = athanOption.audioUrl;
    athanAudioRef.current = audio;

    audio.onplay = () => {
      setIsLoadingAthan(false);
      setIsPlayingAthan(true);
      setAthanError(null);
    };
    audio.onpause = () => setIsPlayingAthan(false);
    audio.oncanplay = () => {
      setIsLoadingAthan(false);
    };
    audio.onwaiting = () => {
      setIsLoadingAthan(true);
    };
    audio.onended = () => {
      setIsPlayingAthan(false);
      setIsLoadingAthan(false);
      setAthanProgress(0);
    };
    audio.ontimeupdate = () => {
      if (audio.duration) {
        setAthanProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    audio.onerror = () => {
      setIsLoadingAthan(false);
      setIsPlayingAthan(false);
      setAthanError('تعذر تشغيل هذا الأذان، يرجى اختيار مؤذن آخر من القائمة أدناه.');
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsLoadingAthan(false);
          setIsPlayingAthan(true);
        })
        .catch((err) => {
          console.warn('Athan playback notice:', err);
          setIsLoadingAthan(false);
          if (err.name !== 'AbortError') {
            setIsPlayingAthan(false);
            setAthanError('اضغط على زر التشغيل لبدء سماع الأذان.');
          }
        });
    }
  };

  const handleToggleAthanPlayback = () => {
    if (!athanAudioRef.current) {
      handlePlayAthan(selectedAthan);
      return;
    }
    if (isPlayingAthan) {
      athanAudioRef.current.pause();
    } else {
      setIsLoadingAthan(true);
      setAthanError(null);
      athanAudioRef.current
        .play()
        .then(() => {
          setIsLoadingAthan(false);
          setIsPlayingAthan(true);
        })
        .catch(() => {
          setIsLoadingAthan(false);
          setAthanError('تعذر استئناف الأذان، يرجى المحاولة مرة أخرى.');
        });
    }
  };

  const handleCloseAthanModal = () => {
    if (athanAudioRef.current) {
      athanAudioRef.current.pause();
      athanAudioRef.current = null;
    }
    setIsPlayingAthan(false);
    setIsLoadingAthan(false);
    setAthanError(null);
    setIsAthanModalOpen(false);
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (athanAudioRef.current) {
        athanAudioRef.current.pause();
        athanAudioRef.current = null;
      }
    };
  }, []);

  // Filter cities for search
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return POPULAR_CITIES;
    const query = citySearch.trim().toLowerCase();
    return POPULAR_CITIES.filter(
      (c) => c.name.includes(query) || c.country.includes(query)
    );
  }, [citySearch]);

  const completedCount = progress.prayersCompletedToday?.filter(
    (p) => p === 'fajr' || p === 'dhuhr' || p === 'asr' || p === 'maghrib' || p === 'isha'
  ).length || 0;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1E4535] text-white px-5 py-2.5 rounded-2xl shadow-xl border border-white/20 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-[#D4A373]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Prayer Card & Countdown */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#1E4535] text-white p-6 sm:p-7 shadow-xl border border-[#2D6A4F]/30">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D4A373]/10 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

        <div className="relative z-10">
          {/* Top meta: Location & Qibla shortcut */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/15">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#D4A373]">
                <MapPin className="w-4 h-4" />
              </div>
              <button
                id="btn-open-city-picker"
                onClick={() => setIsCityPickerOpen(true)}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white hover:text-[#D4A373] transition-colors cursor-pointer"
              >
                <span>{location.name}</span>
                {location.country && <span className="text-white/70">، {location.country}</span>}
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Qibla compass shortcut button */}
              <button
                id="btn-prayer-to-qibla"
                onClick={onOpenQibla}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all backdrop-blur-xs cursor-pointer active:scale-95"
              >
                <Compass className="w-4 h-4 text-[#D4A373]" />
                <span>اتجاه القبلة 🕋</span>
              </button>
            </div>
          </div>

          {/* Main Hero Countdown & Next Prayer */}
          <div className="pt-5 pb-2 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold text-white/90 mb-2">
                <Clock className="w-3.5 h-3.5 text-[#D4A373]" />
                <span>الصلاة القادمة بإذن الله</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold font-['Amiri',serif] tracking-wide mb-1">
                {nextPrayerInfo.item ? nextPrayerInfo.item.arabicName : 'صلاة الفجر'}
              </h2>

              <p className="text-xs sm:text-sm text-white/80">
                يحين الأذان عند الساعة{' '}
                <span className="font-bold text-[#FDE047] font-mono text-base">
                  {nextPrayerInfo.item ? nextPrayerInfo.item.timeString12 : '--:--'}
                </span>
              </p>
            </div>

            {/* Countdown Box */}
            <div className="bg-black/25 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 text-center min-w-[240px]">
              <div className="text-[11px] font-semibold text-[#D4A373] uppercase tracking-wider mb-1">
                الوقت المتبقي حتى الأذان
              </div>
              <div className="font-mono text-3xl sm:text-4xl font-black text-white tracking-widest text-center" dir="ltr">
                {nextPrayerInfo.formattedCountdown}
              </div>
              <div className="flex justify-between text-[10px] text-white/70 pt-1 px-3">
                <span>ساعة</span>
                <span>دقيقة</span>
                <span>ثانية</span>
              </div>
            </div>
          </div>

          {/* Action Row: Listen to Athan & GPS Refresh */}
          <div className="pt-4 mt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Play Athan Button */}
              <button
                id="btn-play-athan-now"
                onClick={() => handlePlayAthan(selectedAthan)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#1E4535] hover:bg-[#FAF7F2] active:scale-95 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-[#2D6A4F]" />
                <span>استمع للأذان 📢</span>
              </button>

              {/* Adhkar after prayer shortcut */}
              <button
                onClick={onOpenAdhkarAfterPrayer}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
                <span>أذكار بعد الصلاة</span>
              </button>
            </div>

            {/* GPS Auto Detect */}
            <button
              id="btn-detect-gps-prayer"
              onClick={handleDetectGpsLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white/90 text-xs transition-colors cursor-pointer"
              title="تحديد الموقع الجغرافي بدقة بواسطة GPS"
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4A373]" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-[#D4A373]" />
              )}
              <span>{isLocating ? 'جارٍ التحديد...' : 'تحديث الموقع عبر GPS'}</span>
            </button>
          </div>

          {locatingError && (
            <div className="mt-3 p-2.5 rounded-xl bg-red-500/25 border border-red-500/30 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{locatingError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Prayers Completed Daily Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8E2D5] shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center font-bold text-base">
            🕌
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1F2421]">صلوات اليوم الخمس</h4>
            <p className="text-xs text-[#857B72]">
              أديت <span className="font-bold text-[#2D6A4F]">{completedCount}</span> من أصل 5 صلوات اليوم
            </p>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center gap-1.5">
          {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((pId) => {
            const isDone = progress.prayersCompletedToday?.includes(pId);
            return (
              <div
                key={pId}
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  isDone
                    ? 'bg-[#2D6A4F] ring-2 ring-[#2D6A4F]/30 scale-110'
                    : 'bg-[#E8E2D5]'
                }`}
                title={pId}
              />
            );
          })}
        </div>
      </div>

      {/* Main Prayer Times List */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-bold text-base text-[#1F2421] flex items-center gap-2">
            <span>مواقيت الأذان والصلوات اليوم</span>
            <span className="text-xs font-normal text-[#857B72]">
              ({new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }).format(currentTime)})
            </span>
          </h3>

          <button
            onClick={() => setIsMethodPickerOpen(true)}
            className="text-xs text-[#2D6A4F] hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <Sliders className="w-3 h-3" />
            <span>طريقة الحساب</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {prayerList.map((item) => {
            const isCompleted = progress.prayersCompletedToday?.includes(item.id);
            const isNext = item.isNext;

            return (
              <div
                key={item.id}
                id={`prayer-card-${item.id}`}
                className={`relative rounded-2xl p-4 transition-all border ${
                  isNext
                    ? 'bg-gradient-to-br from-white to-[#F0FDF4] border-[#2D6A4F] shadow-md ring-2 ring-[#2D6A4F]/20'
                    : item.isPassed
                    ? 'bg-white/80 border-[#E8E2D5] text-[#554E47]'
                    : 'bg-white border-[#E8E2D5] shadow-xs'
                }`}
              >
                {/* Header of card */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                        isNext
                          ? 'bg-[#2D6A4F] text-white shadow-sm'
                          : isCompleted
                          ? 'bg-[#E8F5E9] text-[#2D6A4F]'
                          : 'bg-[#FAF7F2] text-[#857B72]'
                      }`}
                    >
                      {item.id === 'fajr'
                        ? '🌅'
                        : item.id === 'shuruq'
                        ? '☀️'
                        : item.id === 'dhuhr'
                        ? '☀️'
                        : item.id === 'asr'
                        ? '🌤️'
                        : item.id === 'maghrib'
                        ? '🌇'
                        : '🌙'}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-base text-[#1F2421] font-['Amiri',serif]">
                          {item.name}
                        </h4>
                        {isNext && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2D6A4F] text-white font-bold animate-pulse">
                            الأذان القادم
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#857B72]">{item.virtue.slice(0, 36)}...</span>
                    </div>
                  </div>

                  {/* Checkbox to mark as prayed (except Shuruq which is sunrise) */}
                  {item.id !== 'shuruq' && (
                    <button
                      onClick={() => handleTogglePrayerCompleted(item.id)}
                      className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-[#2D6A4F] text-white shadow-xs'
                          : 'bg-[#FAF7F2] hover:bg-[#E8E2D5] text-[#857B72] border border-[#E8E2D5]'
                      }`}
                      title={isCompleted ? 'تمت الصلاة (انقر للإلغاء)' : 'تسجيل أداء الصلاة'}
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                </div>

                {/* Time Display */}
                <div className="flex items-baseline justify-between pt-2 border-t border-[#F0EBE1] mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono text-[#1F2421]">
                      {item.timeString12}
                    </span>
                    <span className="text-[10px] text-[#857B72] font-mono">({item.timeString24})</span>
                  </div>

                  {/* Play Athan Button for this specific prayer */}
                  {item.id !== 'shuruq' && (
                    <button
                      onClick={() => {
                        const athanToPlay =
                          item.id === 'fajr'
                            ? ATHAN_AUDIOS.find((a) => a.id === 'fajr') || selectedAthan
                            : selectedAthan;
                        handlePlayAthan(athanToPlay);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#2D6A4F] hover:text-white text-[#2D6A4F] text-xs font-semibold transition-all border border-[#E8E2D5] cursor-pointer"
                      title="استمع لصوت الأذان لهذه الصلاة"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>الأذان</span>
                    </button>
                  )}
                </div>

                {/* Sunnah details badge */}
                {item.id !== 'shuruq' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed border-[#F0EBE1] text-[10px] text-[#736B63]">
                    <span>الفرض: {item.rakaat} ركعات</span>
                    {item.sunnahBefore > 0 && <span>• قبلها: {item.sunnahBefore}</span>}
                    {item.sunnahAfter > 0 && <span>• بعدها: {item.sunnahAfter}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Extra Voluntary Prayer Times (الضحى، قيام الليل، منتصف الليل) */}
      <div className="bg-white rounded-3xl p-5 border border-[#E8E2D5] shadow-xs">
        <h4 className="font-bold text-sm text-[#1F2421] mb-3 flex items-center gap-2">
          <span>أوقات النوافل وقيام الليل المباركة</span>
          <span className="text-xs font-normal text-[#857B72]">(محسوبة فلكياً لموقعك)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#FAF7F2] rounded-2xl p-3.5 border border-[#E8E2D5]">
            <div className="text-xs font-bold text-[#2D6A4F] mb-1">صلاة الضحى ☀️</div>
            <div className="text-lg font-black font-mono text-[#1F2421]">{extraTimes.duha}</div>
            <div className="text-[11px] text-[#857B72] mt-0.5">يبدأ وقتها بعد الشروق بـ 20 دقيقة</div>
          </div>

          <div className="bg-[#FAF7F2] rounded-2xl p-3.5 border border-[#E8E2D5]">
            <div className="text-xs font-bold text-[#A25A19] mb-1">منتصف الليل الإسلامي 🌓</div>
            <div className="text-lg font-black font-mono text-[#1F2421]">{extraTimes.midnight}</div>
            <div className="text-[11px] text-[#857B72] mt-0.5">نهاية وقت صلاة العشاء الاختياري</div>
          </div>

          <div className="bg-[#FAF7F2] rounded-2xl p-3.5 border border-[#E8E2D5]">
            <div className="text-xs font-bold text-[#1E4535] mb-1">الثلث الأخير (قيام الليل) ✨</div>
            <div className="text-lg font-black font-mono text-[#1F2421]">{extraTimes.qiyam}</div>
            <div className="text-[11px] text-[#857B72] mt-0.5">أرجى أوقات استجابة الدعاء والنزول الإلهي</div>
          </div>
        </div>
      </div>

      {/* Athan Modal / Sound Player */}
      {isAthanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8E2D5] text-[#2C2825] relative">
            <button
              onClick={handleCloseAthanModal}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#F0EBE1] flex items-center justify-center text-[#857B72]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center pb-4">
              <div className="w-16 h-16 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center mx-auto text-3xl mb-3 shadow-inner">
                🕌
              </div>
              <h3 className="text-xl font-bold font-['Amiri',serif] text-[#1F2421]">
                {selectedAthan.name}
              </h3>
              <p className="text-xs text-[#857B72] mt-0.5">{selectedAthan.subname}</p>
            </div>

            {/* Audio Progress Bar */}
            <div className="w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden mb-4 border border-[#E8E2D5]">
              <div
                className="bg-[#2D6A4F] h-full transition-all duration-200"
                style={{ width: `${athanProgress}%` }}
              />
            </div>

            {/* Playback Controls */}
            <div className="flex flex-col items-center justify-center gap-2 mb-4">
              <button
                onClick={handleToggleAthanPlayback}
                disabled={isLoadingAthan}
                className="w-14 h-14 rounded-full bg-[#2D6A4F] hover:bg-[#1E4535] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-80"
                title={isPlayingAthan ? 'إيقاف مؤقت' : 'تشغيل الأذان'}
              >
                {isLoadingAthan ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : isPlayingAthan ? (
                  <Pause className="w-6 h-6 fill-white" />
                ) : (
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                )}
              </button>

              {/* Optional error banner */}
              {athanError && (
                <div className="mt-2 w-full p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{athanError}</span>
                  </div>
                  <button
                    onClick={() => handlePlayAthan(selectedAthan)}
                    className="underline text-[11px] font-bold text-red-800 shrink-0 cursor-pointer"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              )}
            </div>

            {/* Choice of Mu'adhin */}
            <div className="border-t border-[#F0EBE1] pt-4 mb-4">
              <label className="text-xs font-bold text-[#1F2421] block mb-2">
                اختر صوت الأذان المفضل:
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {ATHAN_AUDIOS.map((opt) => {
                  const isCur = opt.id === selectedAthan.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handlePlayAthan(opt)}
                      className={`w-full text-right p-2.5 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isCur
                          ? 'bg-[#2D6A4F] text-white font-bold'
                          : 'bg-[#FAF7F2] hover:bg-[#F3EFEA] text-[#2C2825]'
                      }`}
                    >
                      <div>
                        <div>{opt.name}</div>
                        <div className={`text-[10px] ${isCur ? 'text-white/80' : 'text-[#857B72]'}`}>
                          {opt.subname}
                        </div>
                      </div>
                      {isCur && <Check className="w-4 h-4 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Du'a after Athan */}
            <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D5] text-center">
              <span className="text-[11px] font-bold text-[#2D6A4F] block mb-1">
                دعاء ما بعد الأذان المستجاب:
              </span>
              <p className="text-xs text-[#403B36] font-['Amiri',serif] leading-relaxed">
                «اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ»
              </p>
            </div>
          </div>
        </div>
      )}

      {/* City Picker Modal */}
      {isCityPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#E8E2D5] text-[#2C2825] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1] mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#2D6A4F]" />
                <h3 className="font-bold text-base text-[#1F2421]">اختر مدينتك لحساب مواقيت الأذان</h3>
              </div>
              <button
                onClick={() => setIsCityPickerOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#F0EBE1] flex items-center justify-center text-[#857B72]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* GPS Auto Button inside Modal */}
            <button
              onClick={() => {
                handleDetectGpsLocation();
                setIsCityPickerOpen(false);
              }}
              className="w-full mb-3 p-3 rounded-2xl bg-[#2D6A4F]/10 hover:bg-[#2D6A4F]/20 text-[#2D6A4F] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#2D6A4F]/20 transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>تحديد موقعي الحالي تلقائياً عبر الـ GPS</span>
            </button>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-[#857B72] absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="ابحث عن مدينة (مثال: القاهرة، مكة، دبي، القدس، الرياض)..."
                className="w-full bg-[#FAF7F2] border border-[#E8E2D5] rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1F2421]"
              />
            </div>

            {/* Cities Grid */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-80">
              {filteredCities.map((c) => {
                const isCurrent = location.name === c.name && !location.isGps;
                return (
                  <button
                    key={`${c.name}-${c.country}`}
                    onClick={() => handleSelectCity(c)}
                    className={`w-full text-right p-3 rounded-xl text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#2D6A4F] text-white font-bold'
                        : 'bg-[#FAF7F2] hover:bg-[#F0EBE1] text-[#1F2421]'
                    }`}
                  >
                    <div>
                      <span className="font-bold">{c.name}</span>
                      <span className={`text-xs mr-2 ${isCurrent ? 'text-white/80' : 'text-[#857B72]'}`}>
                        ({c.country})
                      </span>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Calculation Method Picker Modal */}
      {isMethodPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#E8E2D5] text-[#2C2825]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1] mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#2D6A4F]" />
                <h3 className="font-bold text-base text-[#1F2421]">طريقة حساب مواقيت الصلاة الفلكية</h3>
              </div>
              <button
                onClick={() => setIsMethodPickerOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#F0EBE1] flex items-center justify-center text-[#857B72]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {(Object.keys(CALCULATION_METHODS) as CalculationMethodId[]).map((key) => {
                const meth = CALCULATION_METHODS[key];
                const isSelected = location.method === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectMethod(key)}
                    className={`w-full text-right p-3 rounded-xl text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2D6A4F] text-white font-bold'
                        : 'bg-[#FAF7F2] hover:bg-[#F0EBE1] text-[#1F2421] border border-[#E8E2D5]'
                    }`}
                  >
                    <div>
                      <div>{meth.name}</div>
                      <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#857B72]'}`}>
                        الفجر: {meth.fajrAngle}° {meth.ishaAngle ? `• العشاء: ${meth.ishaAngle}°` : '• العشاء: 90 دقيقة'}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
