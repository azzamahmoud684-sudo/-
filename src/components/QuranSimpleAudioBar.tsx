import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, X, RotateCcw, RotateCw, Loader2 } from 'lucide-react';
import { getSurahAudioUrl, formatAudioTime } from '../utils/quranAudio';
import { toArabicNumeral } from '../utils/quranReader';
import { SurahMeta } from '../data/quranData';

interface QuranSimpleAudioBarProps {
  surah: SurahMeta;
  isOpen: boolean;
  onClose: () => void;
  isNightMode?: boolean;
}

export const QuranSimpleAudioBar: React.FC<QuranSimpleAudioBarProps> = ({
  surah,
  isOpen,
  onClose,
  isNightMode = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio setup when surah changes - DO NOT AUTOPLAY
  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const audioUrl = getSurahAudioUrl(surah.number, 'afs');
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onwaiting = () => setIsLoading(true);
    audio.onplaying = () => setIsLoading(false);

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    // Note: strictly NO autoplay!
    setIsPlaying(false);

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
      setIsPlaying(false);
    };
  }, [surah.number, isOpen]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
          setIsPlaying(false);
        });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const skipTime = (seconds: number) => {
    if (!audioRef.current) return;
    const target = Math.min(duration, Math.max(0, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`rounded-2xl border p-3 sm:p-4 transition-all shadow-md animate-in fade-in slide-in-from-top-2 duration-200 ${
        isNightMode
          ? 'bg-[#1C201E] border-[#2F3834] text-[#EAE6DC]'
          : 'bg-[#F3EFE6] border-[#DED7C8] text-[#1F2421]'
      }`}
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Surah and Reciter info */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                isNightMode
                  ? 'bg-[#2D6A4F]/30 text-[#52B788]'
                  : 'bg-[#2D6A4F] text-white'
              }`}
            >
              🎧
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold font-['Tajawal'] flex items-center gap-1.5">
                <span>تلاوة سورة {surah.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isNightMode ? 'bg-[#252B28] text-[#9FA9A3]' : 'bg-white text-[#736B63]'
                  }`}
                >
                  صفحة {toArabicNumeral(surah.startPage)}
                </span>
              </h4>
              <p
                className={`text-[11px] ${
                  isNightMode ? 'text-[#9FA9A3]' : 'text-[#736B63]'
                }`}
              >
                بصوت الشيخ مشاري بن راشد العفاسي
              </p>
            </div>
          </div>

          {/* Close audio button */}
          <button
            onClick={onClose}
            className={`sm:hidden p-1.5 rounded-lg transition-colors cursor-pointer ${
              isNightMode ? 'hover:bg-[#2A312E] text-[#9FA9A3]' : 'hover:bg-white text-[#8C827A]'
            }`}
            title="إغلاق مشغل التلاوة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Audio Scrubber & Controls */}
        <div className="flex-1 w-full sm:max-w-md flex flex-col gap-1.5">
          {/* Progress bar */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className={`w-10 text-right ${isNightMode ? 'text-[#9FA9A3]' : 'text-[#736B63]'}`}>
              {formatAudioTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              disabled={duration === 0}
              className="flex-1 h-1.5 bg-black/10 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#2D6A4F]"
            />
            <span className={`w-10 text-left ${isNightMode ? 'text-[#9FA9A3]' : 'text-[#736B63]'}`}>
              {formatAudioTime(duration)}
            </span>
          </div>

          {/* Play / Skip / Volume buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => skipTime(-10)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isNightMode ? 'hover:bg-[#252B28] text-[#9FA9A3]' : 'hover:bg-white text-[#736B63]'
              }`}
              title="تراجع 10 ثوانٍ"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center hover:bg-[#1E4535] active:scale-95 transition-transform cursor-pointer shadow-xs"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل التلاوة'}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => skipTime(10)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isNightMode ? 'hover:bg-[#252B28] text-[#9FA9A3]' : 'hover:bg-white text-[#736B63]'
              }`}
              title="تقديم 10 ثوانٍ"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={toggleMute}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer mr-2 ${
                isNightMode ? 'hover:bg-[#252B28] text-[#9FA9A3]' : 'hover:bg-white text-[#736B63]'
              }`}
              title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Desktop Close button */}
        <button
          onClick={onClose}
          className={`hidden sm:flex p-2 rounded-xl transition-colors cursor-pointer ${
            isNightMode ? 'hover:bg-[#2A312E] text-[#9FA9A3]' : 'hover:bg-white text-[#8C827A]'
          }`}
          title="إغلاق مشغل التلاوة"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
