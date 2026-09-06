import React, { useState } from 'react';
import { X, RotateCcw, Volume2, VolumeX, Sparkles, Check } from 'lucide-react';

interface TasbeehModalProps {
  onClose: () => void;
  onAddTasbeeh: (count: number) => void;
}

const TASBEEH_PRESETS = [
  'سُبْحَانَ اللَّهِ',
  'الحَمْدُ لِلَّهِ',
  'لاَ إِلَهَ إِلاَّ اللَّهُ',
  'اللَّهُ أَكْبَرُ',
  'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
  'لاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللَّهِ',
  'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
];

export const TasbeehModal: React.FC<TasbeehModalProps> = ({ onClose, onAddTasbeeh }) => {
  const [selectedPreset, setSelectedPreset] = useState(TASBEEH_PRESETS[0]);
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState<number | null>(33);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleTap = () => {
    // Haptic feedback
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch {}
    }

    const nextCount = count + 1;
    const nextSession = sessionTotal + 1;
    setCount(nextCount);
    setSessionTotal(nextSession);
    onAddTasbeeh(1);

    if (target && nextCount >= target) {
      setIsCompleted(true);
    }
  };

  const handleResetCurrent = () => {
    setCount(0);
    setIsCompleted(false);
  };

  const handleSelectPreset = (preset: string) => {
    setSelectedPreset(preset);
    setCount(0);
    setIsCompleted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-[#FBF9F5] rounded-3xl border border-[#E8E2D5] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E2D5] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1F2421]">المسبحة الإلكترونية</h3>
              <p className="text-xs text-[#736B63]">تسبيح وذكر الله في كل وقت</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F3EFE6] text-[#736B63] transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Slider */}
        <div className="p-3 bg-[#FAF7F2] border-b border-[#E8E2D5] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {TASBEEH_PRESETS.map((phrase) => (
            <button
              key={phrase}
              onClick={() => handleSelectPreset(phrase)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedPreset === phrase
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'bg-white text-[#736B63] hover:bg-[#F3EFE6] border border-[#E8E2D5]'
              }`}
            >
              {phrase}
            </button>
          ))}
        </div>

        {/* Target Buttons */}
        <div className="px-5 py-2.5 bg-white border-b border-[#E8E2D5] flex items-center justify-between text-xs">
          <span className="text-[#857B72]">الهدف المطلوب:</span>
          <div className="flex items-center gap-1.5">
            {[33, 100, null].map((t) => (
              <button
                key={t === null ? 'free' : t}
                onClick={() => {
                  setTarget(t);
                  setIsCompleted(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  target === t
                    ? 'bg-[#2D6A4F]/15 text-[#2D6A4F] border border-[#2D6A4F]/30'
                    : 'bg-[#F3EFE6] text-[#736B63]'
                }`}
              >
                {t === null ? 'حر' : `${t}`}
              </button>
            ))}
          </div>
        </div>

        {/* Main Tasbeeh Tap Area */}
        <div className="p-6 sm:p-8 flex flex-col items-center justify-center flex-1">
          {/* Active Phrase */}
          <div className="text-center mb-6 max-w-sm">
            <h2 className="text-2xl sm:text-3xl font-bold font-['Amiri'] text-[#1F2421] leading-relaxed">
              {selectedPreset}
            </h2>
            {target && (
              <p className="text-xs text-[#736B63] mt-1">
                دورة من {target} تسبيحة ({Math.floor(count / target)} دورات مكتملة)
              </p>
            )}
          </div>

          {/* Big Tap Disc */}
          <button
            id="tasbeeh-tap-disc"
            onClick={handleTap}
            className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br from-[#2D6A4F] via-[#234E43] to-[#1E4535] text-white shadow-xl flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer select-none border-4 border-white ring-8 ring-[#2D6A4F]/10 group"
          >
            <span className="text-5xl sm:text-6xl font-bold font-mono tracking-tight group-hover:scale-105 transition-transform">
              {count}
            </span>
            <span className="text-xs text-white/80 mt-2 font-medium">اضغط في أي مكان</span>

            {/* Ripple ring on target completion */}
            {isCompleted && (
              <div className="absolute inset-0 rounded-full border-4 border-[#74C69D] animate-ping pointer-events-none" />
            )}
          </button>

          {/* Total Session counter */}
          <div className="mt-6 flex items-center gap-4 text-xs text-[#736B63]">
            <span>مجموع هذه الجلسة: <strong className="text-[#2D6A4F] font-bold">{sessionTotal}</strong></span>
            <span>•</span>
            <button
              onClick={handleResetCurrent}
              className="flex items-center gap-1 text-[#8C827A] hover:text-[#403B36] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير العداد</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E8E2D5] flex items-center justify-between">
          <span className="text-xs text-[#8C827A]">«ألا بذكر الله تطمئن القلوب»</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold hover:bg-[#1E4535] cursor-pointer"
          >
            تم
          </button>
        </div>
      </div>
    </div>
  );
};
