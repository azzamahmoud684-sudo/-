import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  X,
  ChevronUp,
  ChevronDown,
  SkipForward,
  SkipBack,
  User,
  Music,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  QURAN_RECITERS,
  QuranReciter,
  DEFAULT_RECITER_ID,
  getSurahAudioUrl,
  formatAudioTime,
} from '../utils/quranAudio';
import { ALL_SURAHS, SurahMeta } from '../data/quranData';

export interface QuranAudioState {
  surahNumber: number;
  surahName: string;
  isPlaying: boolean;
  reciterId: string;
}

interface QuranAudioPlayerBarProps {
  currentSurahNumber?: number | null;
  surahNumber?: number | null;
  isPlaying?: boolean;
  reciterId?: string;
  onTogglePlay?: () => void;
  onChangeSurah?: (surahNumber: number) => void;
  onChangeReciter?: (reciterId: string) => void;
  onClose: () => void;
  onNavigateToSurah?: () => void;
}

export const QuranAudioPlayerBar: React.FC<QuranAudioPlayerBarProps> = ({
  currentSurahNumber,
  surahNumber,
  isPlaying = true,
  reciterId = DEFAULT_RECITER_ID,
  onTogglePlay,
  onChangeSurah,
  onChangeReciter,
  onClose,
  onNavigateToSurah,
}) => {
  const effectiveSurahNumber = currentSurahNumber ?? surahNumber ?? null;
  const effectiveReciterId = reciterId || DEFAULT_RECITER_ID;

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const [internalPlaying, setInternalPlaying] = useState(isPlaying);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const surahMeta = useMemo(() => {
    if (!effectiveSurahNumber) return null;
    return ALL_SURAHS.find((s) => s.number === effectiveSurahNumber) || null;
  }, [effectiveSurahNumber]);

  const activeReciter = useMemo(() => {
    return QURAN_RECITERS.find((r) => r.id === effectiveReciterId) || QURAN_RECITERS[0];
  }, [effectiveReciterId]);

  // Sync internalPlaying when isPlaying prop changes
  useEffect(() => {
    setInternalPlaying(isPlaying);
  }, [isPlaying]);

  // Audio setup and URL changes
  useEffect(() => {
    if (!effectiveSurahNumber) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const url = getSurahAudioUrl(effectiveSurahNumber, effectiveReciterId);
    setIsLoading(true);
    setHasError(false);

    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audio.preload = 'auto';
      audioRef.current = audio;
    }

    audio.src = url;
    audio.load();
    audio.playbackRate = playbackRate;
    audio.muted = isMuted;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      if (isPlaying) {
        audio.play().catch((err) => {
          console.warn('Playback on canplay prevented:', err);
        });
      }
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setHasError(false);
      setInternalPlaying(true);
    };

    const handlePause = () => {
      setInternalPlaying(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
      setInternalPlaying(false);
    };

    const handleEnded = () => {
      // Auto-advance to next Surah if available
      if (effectiveSurahNumber < 114 && onChangeSurah) {
        onChangeSurah(effectiveSurahNumber + 1);
      } else {
        setInternalPlaying(false);
        if (onTogglePlay) onTogglePlay();
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    if (isPlaying) {
      const p = audio.play();
      if (p !== undefined) {
        p.catch((err) => {
          console.warn('Initial play notice:', err);
          setIsLoading(false);
        });
      }
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [effectiveSurahNumber, effectiveReciterId]);

  // Sync isPlaying state with audio element
  useEffect(() => {
    if (!audioRef.current || !effectiveSurahNumber) return;

    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, effectiveSurahNumber]);

  // Direct toggle play that immediately executes play/pause on click
  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      setIsLoading(true);
      setHasError(false);
      audioRef.current.play()
        .then(() => {
          setIsLoading(false);
          setInternalPlaying(true);
        })
        .catch((err) => {
          console.warn('Playback error:', err);
          setIsLoading(false);
          setHasError(true);
        });
    } else {
      audioRef.current.pause();
      setInternalPlaying(false);
    }
    if (onTogglePlay) {
      onTogglePlay();
    }
  };

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Sync mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Skip time forward or backward
  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Seek via progress bar click/drag
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    // RTL direction: right is 0, left is 100%
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 0.75];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    setPlaybackRate(rates[nextIdx]);
  };

  if (!effectiveSurahNumber || !surahMeta) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-[68px] left-0 right-0 z-40 px-3 py-1 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        {/* Reciter Picker Dropup Modal */}
        {showReciterPicker && (
          <div className="mb-2 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-[#E8E2D5] text-[#2C2825] animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1] mb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#2D6A4F]" />
                <h4 className="font-bold text-sm text-[#1F2421]">اختر القارئ المفضل للقرآن</h4>
              </div>
              <button
                onClick={() => setShowReciterPicker(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#857B72] hover:bg-[#F3EFEA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {QURAN_RECITERS.map((r) => {
                const isSelected = r.id === effectiveReciterId;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      if (onChangeReciter) onChangeReciter(r.id);
                      setShowReciterPicker(false);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-right transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2D6A4F] text-white font-bold shadow-xs'
                        : 'bg-[#FAF7F2] hover:bg-[#F3EFEA] text-[#2C2825] border border-[#E8E2D5]/70'
                    }`}
                  >
                    <div>
                      <div className="text-xs sm:text-sm">{r.name}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[#857B72]'}`}>
                        {r.subname}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Floating Audio Container */}
        <div className="bg-[#1E4535]/95 backdrop-blur-md text-white rounded-2xl sm:rounded-3xl shadow-2xl border border-white/15 overflow-hidden transition-all duration-300">
          {/* Progress Bar (Clickable) */}
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className="w-full h-2 bg-white/20 hover:h-2.5 cursor-pointer transition-all relative group"
            title="انقر للتنقل في السورة"
          >
            <div
              className="h-full bg-gradient-to-r from-[#52B788] to-[#D4A373] relative transition-all"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Player Content Bar */}
          <div className="p-3 sm:p-3.5 flex flex-col gap-2">
            {/* Top row: Surah & Reciter Info + Expand/Close */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  onClick={onNavigateToSurah}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 text-lg border border-white/10 cursor-pointer transition-colors"
                  title="فتح السورة في المصحف"
                >
                  📖
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onNavigateToSurah}
                      className="font-bold text-sm sm:text-base text-white hover:text-[#D4A373] transition-colors truncate font-['Amiri',serif] text-right cursor-pointer"
                      title="عرض صفحة السورة"
                    >
                      سورة {surahMeta.name}
                    </button>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/15 text-white/90 font-mono">
                      {surahMeta.numberOfAyahs} آية
                    </span>
                  </div>
                  <button
                    onClick={() => setShowReciterPicker(!showReciterPicker)}
                    className="flex items-center gap-1 text-xs text-[#D4A373] hover:text-[#F3C28D] transition-colors truncate text-right cursor-pointer"
                  >
                    <span className="truncate">بصوت الشيخ: {activeReciter.name}</span>
                    <ChevronDown className="w-3 h-3 shrink-0" />
                  </button>
                </div>
              </div>

              {/* Time display */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/80 font-mono shrink-0">
                <span>{formatAudioTime(currentTime)}</span>
                <span>/</span>
                <span>{duration > 0 ? formatAudioTime(duration) : '--:--'}</span>
              </div>

              {/* Action buttons (Close / Expand) */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 transition-colors cursor-pointer"
                  title={isExpanded ? 'تصغير' : 'توسيع أدوات التحكم'}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500/30 hover:text-red-200 flex items-center justify-center text-white/80 transition-colors cursor-pointer"
                  title="إغلاق المشغل"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom row / Primary controls */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {/* Prev / Next Surah */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => effectiveSurahNumber > 1 && onChangeSurah && onChangeSurah(effectiveSurahNumber - 1)}
                  disabled={!effectiveSurahNumber || effectiveSurahNumber <= 1}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-white transition-colors cursor-pointer"
                  title="السورة السابقة"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleSkip(-10)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors text-xs cursor-pointer"
                  title="تأخير 10 ثوانٍ"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Primary Play/Pause Button */}
              <div className="flex items-center gap-2">
                <button
                  id="btn-quran-audio-play-pause"
                  onClick={handleTogglePlay}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-[#1E4535] hover:bg-[#F3EFEA] hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg transition-all cursor-pointer"
                  title={internalPlaying ? 'إيقاف مؤقت' : 'تشغيل التلاوة'}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#1E4535]" />
                  ) : internalPlaying ? (
                    <Pause className="w-5 h-5 fill-[#1E4535]" />
                  ) : (
                    <Play className="w-5 h-5 fill-[#1E4535] ml-0.5" />
                  )}
                </button>
              </div>

              {/* Fast-forward and Next Surah */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSkip(10)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors text-xs cursor-pointer"
                  title="تقديم 10 ثوانٍ"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => effectiveSurahNumber < 114 && onChangeSurah && onChangeSurah(effectiveSurahNumber + 1)}
                  disabled={!effectiveSurahNumber || effectiveSurahNumber >= 114}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-white transition-colors cursor-pointer"
                  title="السورة التالية"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Speed Toggle */}
                <button
                  onClick={cyclePlaybackRate}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-mono font-bold text-white transition-colors cursor-pointer"
                  title="سرعة التلاوة"
                >
                  {playbackRate}x
                </button>

                {/* Mute Toggle */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                  title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-300" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error banner if network fails */}
            {hasError && (
              <div className="mt-1 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-xs text-red-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>تعذر تشغيل التسجيل الصوتي، يمكنك إعادة المحاولة أو اختيار قارئ آخر.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 mr-2">
                  <button
                    onClick={handleTogglePlay}
                    className="underline text-[11px] font-bold text-white hover:text-green-200 cursor-pointer"
                  >
                    إعادة المحاولة
                  </button>
                  <button
                    onClick={() => setShowReciterPicker(true)}
                    className="underline text-[11px] font-bold cursor-pointer"
                  >
                    تغيير القارئ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
