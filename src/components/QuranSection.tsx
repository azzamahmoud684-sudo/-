import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Bookmark,
  Moon,
  Sun,
  Play,
  Pause,
  ChevronDown,
  Plus,
  Minus,
  CheckCircle2,
  X,
  Compass,
  ArrowLeft,
  Volume2,
} from 'lucide-react';
import { ALL_SURAHS, SurahMeta } from '../data/quranData';
import { getSurahByNumber, toArabicNumeral } from '../utils/quranReader';
import { UserProgress } from '../types';
import { QuranPageReader } from './QuranPageReader';
import { SurahSelectionModal } from './SurahSelectionModal';
import { QuranSimpleAudioBar } from './QuranSimpleAudioBar';

interface QuranSectionProps {
  progress?: UserProgress;
  onUpdatePages?: (pages: number) => void;
  onOpenTrackerModal?: () => void;
  onPlaySurahAudio?: (surahNumber: number) => void;
  activeAudioSurah?: number | null;
  isAudioPlaying?: boolean;
}

export const QuranSection: React.FC<QuranSectionProps> = ({
  progress,
  onUpdatePages,
  onOpenTrackerModal,
}) => {
  // Last read position (automatically remembered)
  const [lastRead, setLastRead] = useState<{
    page: number;
    surahNumber: number;
    surahName: string;
    timestamp: number;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('ouns_last_read_quran');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // Manual bookmark position
  const [bookmark, setBookmark] = useState<{
    page: number;
    surahNumber: number;
    surahName: string;
    timestamp: number;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('ouns_quran_bookmark');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // Current physical page (1 to 604)
  const [currentPage, setCurrentPage] = useState<number>(() => {
    try {
      const savedLast = localStorage.getItem('ouns_last_read_quran');
      if (savedLast) {
        const parsed = JSON.parse(savedLast);
        if (parsed.page && parsed.page >= 1 && parsed.page <= 604) {
          return parsed.page;
        }
      }
      const savedBookmark = localStorage.getItem('ouns_quran_bookmark');
      if (savedBookmark) {
        const parsed = JSON.parse(savedBookmark);
        if (parsed.page && parsed.page >= 1 && parsed.page <= 604) {
          return parsed.page;
        }
      }
    } catch {
      // ignore
    }
    return 1;
  });

  // User reading preferences
  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ouns_quran_font_size');
      if (saved) {
        const num = parseInt(saved, 10);
        if (num >= 18 && num <= 42) return num;
      }
    } catch {
      // ignore
    }
    return 26;
  });

  const [isNightMode, setIsNightMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ouns_quran_night_mode');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Controls UI state
  const [isFontSizeOpen, setIsFontSizeOpen] = useState(false);
  const [isSurahModalOpen, setIsSurahModalOpen] = useState(false);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Derive current primary Surah from startPage of ALL_SURAHS
  const surahsStartingOnPage = useMemo(() => {
    return ALL_SURAHS.filter((s) => s.startPage === currentPage);
  }, [currentPage]);

  const currentSurah = useMemo<SurahMeta>(() => {
    if (surahsStartingOnPage.length > 0) {
      return surahsStartingOnPage[0];
    }
    // Find surahs whose startPage <= currentPage, pick the one with highest startPage
    const candidates = ALL_SURAHS.filter((s) => s.startPage <= currentPage);
    if (candidates.length > 0) {
      return candidates[candidates.length - 1];
    }
    return ALL_SURAHS[0];
  }, [surahsStartingOnPage, currentPage]);

  const surahHeaderDisplay = useMemo(() => {
    if (surahsStartingOnPage.length > 1) {
      return `سور ${surahsStartingOnPage.map((s) => s.name).join(' • ')}`;
    }
    return `سورة ${currentSurah.nameWithTashkeel || currentSurah.name}`;
  }, [surahsStartingOnPage, currentSurah]);

  // Derive current Juz from currentPage
  const currentJuz = useMemo<number>(() => {
    return currentSurah.juz || Math.min(30, Math.ceil(currentPage / 20));
  }, [currentSurah, currentPage]);

  // Persist current page as last read whenever page changes
  useEffect(() => {
    const item = {
      page: currentPage,
      surahNumber: currentSurah.number,
      surahName: currentSurah.name,
      timestamp: Date.now(),
    };
    setLastRead(item);
    try {
      localStorage.setItem('ouns_last_read_quran', JSON.stringify(item));
    } catch {
      // ignore
    }
  }, [currentPage, currentSurah]);

  // Persist font size
  const handleFontSizeChange = (size: number) => {
    const safe = Math.min(42, Math.max(18, size));
    setFontSize(safe);
    try {
      localStorage.setItem('ouns_quran_font_size', safe.toString());
    } catch {
      // ignore
    }
  };

  // Toggle night mode
  const handleToggleNightMode = () => {
    setIsNightMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ouns_quran_night_mode', next.toString());
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Toggle manual bookmark on current page
  const handleToggleBookmark = () => {
    const isCurrentlyBookmarked = bookmark?.page === currentPage;
    if (isCurrentlyBookmarked) {
      setBookmark(null);
      try {
        localStorage.removeItem('ouns_quran_bookmark');
      } catch {
        // ignore
      }
      setFeedbackMessage('تمت إزالة علامة القراءة');
    } else {
      const item = {
        page: currentPage,
        surahNumber: currentSurah.number,
        surahName: currentSurah.name,
        timestamp: Date.now(),
      };
      setBookmark(item);
      try {
        localStorage.setItem('ouns_quran_bookmark', JSON.stringify(item));
      } catch {
        // ignore
      }
      setFeedbackMessage(`تم حفظ علامة القراءة في صفحة ${toArabicNumeral(currentPage)} (سورة ${currentSurah.name}) 🤍`);
    }
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Jump to surah from modal
  const handleSelectSurah = (surah: SurahMeta) => {
    setCurrentPage(surah.startPage);
    setIsSurahModalOpen(false);
  };

  const isCurrentPageBookmarked = bookmark?.page === currentPage;

  return (
    <div
      className={`w-full max-w-4xl mx-auto space-y-4 pb-16 transition-colors duration-200 overflow-x-hidden ${
        isNightMode ? 'text-[#EAE6DC]' : 'text-[#1F2421]'
      }`}
      dir="rtl"
    >
      {/* ================= 1. Resume Reading Banner (متابعة القراءة) ================= */}
      {lastRead && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 shadow-xs ${
            isNightMode
              ? 'bg-[#1E2321] border-[#2E3632] text-[#EAE6DC]'
              : 'bg-[#F9F7F1] border-[#E8E2D5] text-[#1F2421]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                isNightMode
                  ? 'bg-[#2D6A4F]/25 text-[#52B788]'
                  : 'bg-[#2D6A4F]/10 text-[#2D6A4F]'
              }`}
            >
              📖
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <span>متابعة القراءة من حيث توقفتِ 🤍</span>
              </h4>
              <p
                className={`text-[11px] sm:text-xs mt-0.5 ${
                  isNightMode ? 'text-[#9FA9A3]' : 'text-[#736B63]'
                }`}
              >
                سورة {lastRead.surahName} · صفحة {toArabicNumeral(lastRead.page)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentPage !== lastRead.page ? (
              <button
                onClick={() => setCurrentPage(lastRead.page)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold hover:bg-[#1E4535] transition-all cursor-pointer shadow-2xs"
              >
                <span>متابعة القراءة</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                  isNightMode ? 'bg-[#252C29] text-[#52B788]' : 'bg-[#EBF7EE] text-[#2D6A4F]'
                }`}
              >
                أنتِ هنا الآن ✓
              </span>
            )}
          </div>
        </div>
      )}

      {/* ================= 2. Top Header & Reading Experience Controls ================= */}
      <div
        className={`rounded-3xl p-3.5 sm:p-5 border shadow-xs transition-colors space-y-3.5 ${
          isNightMode
            ? 'bg-[#1A1D1C] border-[#2A332F]'
            : 'bg-white border-[#E8E2D5]'
        }`}
      >
        {/* Top Info: Surah Name, Juz Number, Page Number, and "اختيار السورة" Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 border-dashed border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* اسم السورة */}
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs ${
                  isNightMode ? 'text-[#9FA9A3]' : 'text-[#736B63]'
                }`}
              >
                السورة:
              </span>
              <h3 className="font-['Amiri',serif] font-bold text-base sm:text-xl text-[#2D6A4F] dark:text-[#52B788]">
                {surahHeaderDisplay}
              </h3>
            </div>

            <span className="text-[#C5BCB2] hidden sm:inline">•</span>

            {/* رقم الجزء */}
            <div className="flex items-center gap-1">
              <span
                className={`text-xs ${
                  isNightMode ? 'text-[#9FA9A3]' : 'text-[#736B63]'
                }`}
              >
                الجزء:
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono">
                {toArabicNumeral(currentJuz)}
              </span>
            </div>

            <span className="text-[#C5BCB2] hidden sm:inline">•</span>

            {/* رقم الصفحة */}
            <div className="flex items-center gap-1">
              <span
                className={`text-xs ${
                  isNightMode ? 'text-[#9FA9A3]' : 'text-[#736B63]'
                }`}
              >
                الصفحة:
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono">
                {toArabicNumeral(currentPage)} من ٦٠٤
              </span>
            </div>
          </div>

          {/* اختيار السورة (114 Surahs) Button */}
          <button
            onClick={() => setIsSurahModalOpen(true)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95 ${
              isNightMode
                ? 'bg-[#252C29] hover:bg-[#2F3834] text-[#EAE6DC] border border-[#36423C]'
                : 'bg-[#FAF7F2] hover:bg-[#F3EFE6] text-[#1F2421] border border-[#E8E2D5]'
            }`}
            title="فتح فهرس جميع سور القرآن الكريم (١١٤ سورة)"
          >
            <BookOpen className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
            <span>اختيار السورة</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>

        {/* Action Controls: Aa Font size, ☾ Night mode, 🔖 Bookmark, ▶️ Recitation Audio */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Left / Right Simple Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Aa تغيير حجم الخط */}
            <div className="relative">
              <button
                onClick={() => setIsFontSizeOpen(!isFontSizeOpen)}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isFontSizeOpen
                    ? 'bg-[#2D6A4F] text-white border-transparent'
                    : isNightMode
                    ? 'bg-[#222725] text-[#EAE6DC] border-[#313B36] hover:bg-[#2B332F]'
                    : 'bg-[#FAF7F2] text-[#403B36] border-[#E8E2D5] hover:bg-[#F3EFE6]'
                }`}
                title="تغيير حجم خط المصحف"
                aria-label="تغيير حجم الخط"
              >
                <span className="font-serif font-bold text-sm">Aa</span>
                <span className="hidden sm:inline">حجم الخط</span>
                <span className="font-mono text-[11px] opacity-75">({toArabicNumeral(fontSize)})</span>
              </button>

              {/* Font Size Dropdown Popover */}
              {isFontSizeOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setIsFontSizeOpen(false)}
                  />
                  <div
                    className={`absolute right-0 top-full mt-2 w-64 p-3.5 rounded-2xl border shadow-xl z-30 space-y-3 animate-in fade-in duration-150 ${
                    isNightMode
                      ? 'bg-[#1E2321] border-[#36423C] text-[#EAE6DC]'
                      : 'bg-white border-[#E8E2D5] text-[#1F2421]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>حجم خط القراءة</span>
                    <span className="font-mono text-[#2D6A4F] dark:text-[#52B788]">
                      {toArabicNumeral(fontSize)} نقطة
                    </span>
                  </div>

                  {/* Stepper buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleFontSizeChange(fontSize - 2)}
                      disabled={fontSize <= 18}
                      className="w-9 h-9 rounded-xl border flex items-center justify-center font-bold hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 cursor-pointer"
                      title="تصغير الخط"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <input
                      type="range"
                      min={18}
                      max={40}
                      step={2}
                      value={fontSize}
                      onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                      className="flex-1 accent-[#2D6A4F] cursor-pointer"
                    />

                    <button
                      onClick={() => handleFontSizeChange(fontSize + 2)}
                      disabled={fontSize >= 40}
                      className="w-9 h-9 rounded-xl border flex items-center justify-center font-bold hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 cursor-pointer"
                      title="تكبير الخط"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick presets */}
                  <div className="grid grid-cols-4 gap-1 text-[11px] font-medium pt-1">
                    {[
                      { size: 22, label: 'صغير' },
                      { size: 26, label: 'متوسط' },
                      { size: 32, label: 'كبير' },
                      { size: 38, label: 'ضخم' },
                    ].map((preset) => (
                      <button
                        key={preset.size}
                        onClick={() => handleFontSizeChange(preset.size)}
                        className={`py-1 rounded-lg border text-center transition-colors cursor-pointer ${
                          fontSize === preset.size
                            ? 'bg-[#2D6A4F] text-white border-transparent'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 border-transparent'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

            {/* ☾ وضع القراءة الليلي */}
            <button
              onClick={handleToggleNightMode}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isNightMode
                  ? 'bg-[#2E3732] text-[#EAE6DC] border-[#3E4A43] hover:bg-[#36423C]'
                  : 'bg-[#FAF7F2] text-[#403B36] border-[#E8E2D5] hover:bg-[#F3EFE6]'
              }`}
              title={isNightMode ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي المريح للعين'}
              aria-label="وضع القراءة الليلي"
            >
              {isNightMode ? (
                <>
                  <Sun className="w-4 h-4 text-[#D4A373]" />
                  <span className="hidden sm:inline">الوضع النهاري</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#2D6A4F]" />
                  <span className="hidden sm:inline">الوضع الليلي</span>
                </>
              )}
            </button>

            {/* 🔖 حفظ العلامة */}
            <button
              onClick={handleToggleBookmark}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isCurrentPageBookmarked
                  ? isNightMode
                    ? 'bg-[#3A3326] text-[#E9D8A6] border-[#66563B]'
                    : 'bg-[#FFF9EC] text-[#B8860B] border-[#D4A373]'
                  : isNightMode
                  ? 'bg-[#222725] text-[#9FA9A3] border-[#313B36] hover:bg-[#2B332F]'
                  : 'bg-[#FAF7F2] text-[#736B63] border-[#E8E2D5] hover:bg-[#F3EFE6]'
              }`}
              title="حفظ علامة القراءة في هذه الصفحة"
              aria-label="حفظ العلامة"
            >
              <Bookmark
                className={`w-4 h-4 ${
                  isCurrentPageBookmarked ? 'fill-[#B8860B] text-[#B8860B]' : ''
                }`}
              />
              <span>{isCurrentPageBookmarked ? 'العلامة محفوظة' : 'حفظ العلامة'}</span>
            </button>
          </div>

          {/* ▶️ تشغيل التلاوة Button */}
          <button
            onClick={() => setIsAudioPlayerOpen(!isAudioPlayerOpen)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 ${
              isAudioPlayerOpen
                ? 'bg-[#1E4535] text-white ring-2 ring-[#D4A373]'
                : isNightMode
                ? 'bg-[#2D6A4F] text-white hover:bg-[#245741]'
                : 'bg-[#2D6A4F] text-white hover:bg-[#1E4535]'
            }`}
            title="الاستماع لتلاوة السورة الحالية"
            aria-label="تشغيل التلاوة"
          >
            {isAudioPlayerOpen ? (
              <>
                <Volume2 className="w-4 h-4 text-[#D4A373] animate-pulse" />
                <span>إخفاء المشغل</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>تشغيل التلاوة 🎧</span>
              </>
            )}
          </button>
        </div>

        {/* Audio Player Bar (Embedded cleanly under controls) */}
        {isAudioPlayerOpen && (
          <div className="pt-2">
            <QuranSimpleAudioBar
              surah={currentSurah}
              isOpen={isAudioPlayerOpen}
              onClose={() => setIsAudioPlayerOpen(false)}
              isNightMode={isNightMode}
            />
          </div>
        )}
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150 ${
            isNightMode
              ? 'bg-[#1B2822] border-[#2E483C] text-[#85E3B3]'
              : 'bg-[#EBF7EE] border-[#B7E4C7] text-[#1E4535]'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="cursor-pointer opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= 3. Digital Mushaf Page Reader ================= */}
      <QuranPageReader
        currentPage={currentPage}
        onPageChange={(p) => setCurrentPage(p)}
        fontSize={fontSize}
        isNightMode={isNightMode}
        isBookmarked={isCurrentPageBookmarked}
        onToggleBookmark={handleToggleBookmark}
        onSelectSurah={handleSelectSurah}
      />

      {/* ================= 4. Surah Selection Modal (114 Surahs) ================= */}
      <SurahSelectionModal
        isOpen={isSurahModalOpen}
        onClose={() => setIsSurahModalOpen(false)}
        onSelectSurah={handleSelectSurah}
        currentSurahNumber={currentSurah.number}
        isNightMode={isNightMode}
      />
    </div>
  );
};
