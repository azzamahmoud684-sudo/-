import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Bookmark,
  Sparkles,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  Check,
  X,
  Volume2,
  Pause,
  Play,
  Mic,
  Copy,
  Layers,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Share2,
} from 'lucide-react';
import {
  getQuranPage,
  preloadAdjacentPages,
  QuranPageData,
  QuranAyah,
  toArabicNumeral,
  getSurahByNumber,
} from '../utils/quranReader';
import { ALL_SURAHS, SurahMeta } from '../data/quranData';
import { QuranVoiceReciter } from './QuranVoiceReciter';

interface QuranPageReaderProps {
  initialPage?: number;
  onUpdatePagesRead?: (newTotal: number) => void;
  pagesReadToday?: number;
  onSaveBookmark?: (page: number, surahName: string) => void;
  savedBookmarkPage?: number;
  onPlaySurahAudio?: (surahNumber: number) => void;
  isAudioPlaying?: boolean;
  currentAudioSurah?: number | null;
}

export const QuranPageReader: React.FC<QuranPageReaderProps> = ({
  initialPage = 1,
  onUpdatePagesRead,
  pagesReadToday = 0,
  onSaveBookmark,
  savedBookmarkPage = 1,
  onPlaySurahAudio,
  isAudioPlaying = false,
  currentAudioSurah = null,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const p = Math.min(604, Math.max(1, initialPage));
    return p;
  });

  const [pageData, setPageData] = useState<QuranPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState<number>(24);
  const [selectedAyah, setSelectedAyah] = useState<QuranAyah | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Jump by page or surah controls
  const [isJumpOpen, setIsJumpOpen] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState(currentPage.toString());

  // Swipe gesture tracking
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Load page data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getQuranPage(currentPage)
      .then((data) => {
        if (isMounted) {
          setPageData(data);
          setIsLoading(false);
          // Preload adjacent pages in background for instant flipping
          preloadAdjacentPages(currentPage);
          // Default selected ayah to first ayah of page
          if (data.ayahs && data.ayahs.length > 0) {
            setSelectedAyah(data.ayahs[0]);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching page:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage]);

  // Sync jump input
  useEffect(() => {
    setJumpPageInput(currentPage.toString());
  }, [currentPage]);

  // Page Navigation Handlers
  const handleGoToNextPage = useCallback(() => {
    if (currentPage < 604) {
      setCurrentPage((p) => p + 1);
    }
  }, [currentPage]);

  const handleGoToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  }, [currentPage]);

  const handleJumpToPage = (pageNumber: number) => {
    const valid = Math.min(604, Math.max(1, pageNumber));
    setCurrentPage(valid);
    setIsJumpOpen(false);
  };

  const handleJumpToSurah = (surah: SurahMeta) => {
    setCurrentPage(surah.startPage);
    setIsJumpOpen(false);
  };

  // Keyboard navigation listener (RTL: Left Arrow = Next page, Right Arrow = Prev page)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        handleGoToNextPage();
      } else if (e.key === 'ArrowRight') {
        handleGoToPrevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGoToNextPage, handleGoToPrevPage]);

  // Touch Swipe Gesture Handlers (Smooth Page Flipping)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;

    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartXRef.current;
    const diffY = touch.clientY - touchStartYRef.current;

    // Ensure it's mostly a horizontal swipe, not a vertical scroll
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      // In RTL Arabic layout:
      // Swiping to the left (negative diffX) means moving forward to Next Page
      // Swiping to the right (positive diffX) means moving backward to Prev Page
      if (diffX < 0) {
        handleGoToNextPage();
      } else {
        handleGoToPrevPage();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Bookmark current page
  const handleSavePageBookmark = () => {
    const primarySurah = pageData?.surahsOnPage[0]?.name || 'القرآن الكريم';
    if (onSaveBookmark) {
      onSaveBookmark(currentPage, primarySurah);
    } else {
      try {
        localStorage.setItem(
          'ouns_quran_bookmark',
          JSON.stringify({
            surahNumber: pageData?.surahsOnPage[0]?.number || 1,
            surahName: primarySurah,
            page: currentPage,
          })
        );
      } catch {
        // ignore
      }
    }
    setFeedbackMessage(`تم حفظ علامة القراءة في صفحة ${currentPage} (${primarySurah}) بنجاح ✓`);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Record 1 page read in ورد اليوم
  const handleRecordPageRead = () => {
    if (onUpdatePagesRead) {
      const updated = pagesReadToday + 1;
      onUpdatePagesRead(updated);
      setFeedbackMessage(`تم تسجيل صفحة ${currentPage} في ورد اليوم (+1 صفحة) ✓`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  // Copy Ayah text
  const handleCopyAyah = (ayah: QuranAyah) => {
    const textToCopy = `${ayah.cleanText} ﴿${toArabicNumeral(ayah.numberInSurah)}﴾ [${ayah.surahName}]`;
    navigator.clipboard.writeText(textToCopy);
    setFeedbackMessage(`تم نسخ الآية (${ayah.numberInSurah} من ${ayah.surahName}) إلى الحافظة ✓`);
    setTimeout(() => setFeedbackMessage(null), 2500);
  };

  // Group ayahs by Surah so we can render traditional Surah Headers
  const groupedAyahs = useMemo(() => {
    if (!pageData || !pageData.ayahs) return [];

    const groups: {
      surahNumber: number;
      surahName: string;
      isSurahStartOnPage: boolean;
      ayahs: QuranAyah[];
    }[] = [];

    let currentGroup: {
      surahNumber: number;
      surahName: string;
      isSurahStartOnPage: boolean;
      ayahs: QuranAyah[];
    } | null = null;

    for (const ayah of pageData.ayahs) {
      if (!currentGroup || currentGroup.surahNumber !== ayah.surahNumber) {
        currentGroup = {
          surahNumber: ayah.surahNumber,
          surahName: ayah.surahName,
          isSurahStartOnPage: ayah.numberInSurah === 1,
          ayahs: [ayah],
        };
        groups.push(currentGroup);
      } else {
        currentGroup.ayahs.push(ayah);
      }
    }

    return groups;
  }, [pageData]);

  // Primary Surah and Juz labels for the physical header
  const headerSurahTitle = useMemo(() => {
    if (!pageData || !pageData.surahsOnPage.length) return '';
    return pageData.surahsOnPage.map((s) => s.name).join(' • ');
  }, [pageData]);

  const isCurrentPageBookmarked = savedBookmarkPage === currentPage;

  // Selected Ayah Index within Page for Voice Reciter Next/Prev
  const currentAyahIndexOnPage = useMemo(() => {
    if (!pageData || !selectedAyah) return -1;
    return pageData.ayahs.findIndex((a) => a.number === selectedAyah.number);
  }, [pageData, selectedAyah]);

  const handleNextAyahInReciter = () => {
    if (!pageData) return;
    if (currentAyahIndexOnPage >= 0 && currentAyahIndexOnPage < pageData.ayahs.length - 1) {
      setSelectedAyah(pageData.ayahs[currentAyahIndexOnPage + 1]);
    } else if (currentPage < 604) {
      // Flip to next page
      setCurrentPage((p) => p + 1);
    }
  };

  const handlePrevAyahInReciter = () => {
    if (!pageData) return;
    if (currentAyahIndexOnPage > 0) {
      setSelectedAyah(pageData.ayahs[currentAyahIndexOnPage - 1]);
    }
  };

  return (
    <div className="w-full space-y-4 select-none">
      {/* ================= Feedback Toast ================= */}
      {feedbackMessage && (
        <div className="p-3.5 rounded-2xl bg-[#EBF7EE] border border-[#B7E4C7] text-xs font-bold text-[#1E4535] flex items-center justify-between gap-2 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-[#2D6A4F] hover:text-[#1E4535] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= Reader Top Action Bar ================= */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 border border-[#E8E2D5] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Page Jump & Surah Directory Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsJumpOpen(!isJumpOpen)}
            className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFE6] border border-[#E8E2D5] text-xs font-bold text-[#1F2421] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>انتقال سريع لصفحة / سورة</span>
          </button>

          <span className="text-[#8C827A] font-mono hidden sm:inline">
            صفحة {toArabicNumeral(currentPage)} من ٦٠٤
          </span>
        </div>

        {/* Font Size controls */}
        <div className="flex items-center gap-2">
          <span className="text-[#8C827A] text-[11px]">حجم الخط:</span>
          <button
            onClick={() => setFontSize((s) => Math.max(18, s - 2))}
            className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#E8E2D5] hover:bg-[#F3EFE6] text-[#403B36] flex items-center justify-center cursor-pointer"
            title="تصغير الخط"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono font-bold text-[#2D6A4F] min-w-[20px] text-center text-xs">
            {fontSize}
          </span>
          <button
            onClick={() => setFontSize((s) => Math.min(38, s + 2))}
            className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#E8E2D5] hover:bg-[#F3EFE6] text-[#403B36] flex items-center justify-center cursor-pointer"
            title="تكبير الخط"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons: Voice Corrector, Surah Audio Reciter, Bookmark, Record */}
        <div className="flex items-center gap-2">
          {/* Audio Recitation of Primary Surah on page */}
          {onPlaySurahAudio && pageData && pageData.surahsOnPage.length > 0 && (
            <button
              onClick={() => onPlaySurahAudio(pageData.surahsOnPage[0].number)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 ${
                currentAudioSurah === pageData.surahsOnPage[0].number && isAudioPlaying
                  ? 'bg-[#1E4535] text-white ring-2 ring-[#D4A373]'
                  : 'bg-[#D4A373] text-[#1F2421] hover:bg-[#c49260]'
              }`}
              title={`استمع لصوت الشيخ لسورة ${pageData.surahsOnPage[0].name}`}
            >
              {currentAudioSurah === pageData.surahsOnPage[0].number && isAudioPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>إيقاف التلاوة</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>صوت الشيخ 🎧</span>
                </>
              )}
            </button>
          )}

          {/* Tarteel Voice Tester Trigger */}
          <button
            onClick={() => {
              if (!selectedAyah && pageData && pageData.ayahs.length > 0) {
                setSelectedAyah(pageData.ayahs[0]);
              }
              setIsVoiceModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#2D6A4F] text-white hover:bg-[#1E4535] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
            title="ابدأ التسميع الصوتي المباشر واختبار التلاوة وتصحيحها عبر Web Speech API"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <Mic className="w-3.5 h-3.5" />
            <span>تسميع صوتي وتصحيح ذكي</span>
          </button>

          {/* Bookmark page */}
          <button
            onClick={handleSavePageBookmark}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              isCurrentPageBookmarked
                ? 'bg-[#FFFCF5] border-[#B8860B] text-[#B8860B]'
                : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#736B63] hover:bg-[#F3EFE6]'
            }`}
            title="حفظ علامة القراءة في هذه الصفحة"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isCurrentPageBookmarked ? 'fill-[#B8860B]' : ''}`} />
            <span className="hidden sm:inline">
              {isCurrentPageBookmarked ? 'صفحتك المحفوظة' : 'حفظ علامة'}
            </span>
          </button>

          {/* Record 1 page read */}
          {onUpdatePagesRead && (
            <button
              onClick={handleRecordPageRead}
              className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFE6] border border-[#E8E2D5] text-xs font-bold text-[#403B36] cursor-pointer inline-flex items-center gap-1"
              title="سجّل هذه الصفحة في ورد اليوم"
            >
              <Plus className="w-3 h-3 text-[#2D6A4F]" />
              <span className="hidden sm:inline">سجّل في الورد</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= Jump Modal / Drawer ================= */}
      {isJumpOpen && (
        <div className="bg-white rounded-3xl p-5 border border-[#E8E2D5] shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
            <h4 className="text-sm font-bold text-[#1F2421]">الانتقال السريع لصفحة أو سورة</h4>
            <button
              onClick={() => setIsJumpOpen(false)}
              className="text-[#736B63] hover:text-[#1F2421] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Page Number Slider / Direct Input */}
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D5] space-y-3">
              <label className="text-xs font-bold text-[#403B36] block">
                أدخل رقم الصفحة مباشرة (من 1 إلى 604):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={604}
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJumpToPage(Number(jumpPageInput));
                  }}
                  className="w-28 px-3 py-2 bg-white border border-[#E8E2D5] rounded-xl text-center font-mono font-bold text-[#1F2421] text-sm focus:outline-none focus:border-[#2D6A4F]"
                />
                <button
                  onClick={() => handleJumpToPage(Number(jumpPageInput))}
                  className="px-4 py-2 bg-[#2D6A4F] text-white font-bold rounded-xl text-xs hover:bg-[#1E4535] cursor-pointer"
                >
                  انتقال للصفحة
                </button>
              </div>

              {/* Slider for quick flipping */}
              <div className="pt-2">
                <input
                  type="range"
                  min={1}
                  max={604}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="w-full accent-[#2D6A4F] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#8C827A] mt-1 font-mono">
                  <span>صفحة ١ (الفاتحة)</span>
                  <span>صفحة ٦٠٤ (الناس)</span>
                </div>
              </div>
            </div>

            {/* 2. Surah Quick Jump Selector */}
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D5] space-y-2">
              <label className="text-xs font-bold text-[#403B36] block">
                أو اختر السورة للانتقال إلى صفحة بدايتها:
              </label>
              <select
                onChange={(e) => {
                  const s = ALL_SURAHS.find((item) => item.number === Number(e.target.value));
                  if (s) handleJumpToSurah(s);
                }}
                className="w-full px-3 py-2 bg-white border border-[#E8E2D5] rounded-xl text-xs font-semibold text-[#1F2421] focus:outline-none focus:border-[#2D6A4F] cursor-pointer"
              >
                <option value="">-- اختر سورة من ١١٤ سورة --</option>
                {ALL_SURAHS.map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.number}. سورة {s.name} (صفحة {s.startPage})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#8C827A]">
                كل سورة تبدأ بالضبط في صفحتها المعتمدة بمصحف المدينة المنورة.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= Physical Quran Page Frame (Madani Mushaf) ================= */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative bg-[#FCFAF4] rounded-3xl border-2 border-[#D4A373]/50 shadow-xl overflow-hidden transition-all duration-300"
      >
        {/* Physical Top Page Header (Surah name on one side, Juz/Hizb on other side) */}
        <div className="px-6 sm:px-10 py-3 bg-[#F7F3E9] border-b border-[#E8DECC] flex items-center justify-between text-xs font-semibold text-[#665D52] select-none">
          {/* Juz and Hizb */}
          <div className="flex items-center gap-1.5">
            <span className="font-['Amiri',serif] text-sm text-[#2D6A4F] font-bold">
              الجزء {toArabicNumeral(pageData?.juz || 1)}
            </span>
            <span className="text-[#A69C91]">•</span>
            <span className="text-[11px]">
              الحزب {toArabicNumeral(pageData?.hizbQuarter ? Math.ceil(pageData.hizbQuarter / 4) : 1)}
            </span>
          </div>

          {/* Center: Subtle Page Number Medallion */}
          <div className="px-3 py-0.5 rounded-full bg-[#EDE6D6] border border-[#D9CEBA] font-mono text-[11px] font-bold text-[#554C42]">
            صفحة {toArabicNumeral(currentPage)}
          </div>

          {/* Surah Name(s) */}
          <div className="font-['Amiri',serif] text-sm text-[#2D6A4F] font-bold">
            {headerSurahTitle || `صفحة ${currentPage}`}
          </div>
        </div>

        {/* Inner Ornamental Double Frame Margin */}
        <div className="p-4 sm:p-8 md:p-10 min-h-[580px] flex flex-col justify-between relative border-[6px] border-[#F4EFE2] m-2 sm:m-3 rounded-2xl bg-white shadow-2xs">
          {/* Subtle Islamic Corner Motifs */}
          <div className="absolute top-2 right-2 text-[#D4A373]/40 text-xs font-serif pointer-events-none">
            ❖
          </div>
          <div className="absolute top-2 left-2 text-[#D4A373]/40 text-xs font-serif pointer-events-none">
            ❖
          </div>
          <div className="absolute bottom-2 right-2 text-[#D4A373]/40 text-xs font-serif pointer-events-none">
            ❖
          </div>
          <div className="absolute bottom-2 left-2 text-[#D4A373]/40 text-xs font-serif pointer-events-none">
            ❖
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="py-28 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-9 h-9 text-[#2D6A4F] animate-spin" />
              <p className="text-xs text-[#736B63] font-medium font-sans">
                جاري تحميل صفحة {toArabicNumeral(currentPage)} من مصحف المدينة...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Render Surahs and Ayahs on this page */}
              {groupedAyahs.map((group, groupIdx) => {
                const surahMeta = getSurahByNumber(group.surahNumber);
                const isSurahStart = group.isSurahStartOnPage;
                const isTawbah = group.surahNumber === 9;
                const isFatiha = group.surahNumber === 1;

                return (
                  <div key={groupIdx} className="space-y-4">
                    {/* Traditional Ornate Surah Header Banner if a Surah begins on this page */}
                    {isSurahStart && (
                      <div className="my-4 text-center select-none">
                        <div className="relative inline-block w-full max-w-lg mx-auto py-2 px-6 rounded-2xl bg-[#F7F3E9] border-2 border-[#D4A373] shadow-xs">
                          <div className="flex items-center justify-between gap-4 font-['Amiri',serif] text-[#1E4535]">
                            <span className="text-xs font-sans text-[#736B63] font-semibold">
                              {surahMeta?.revelationType || 'مكية'}
                            </span>
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wider">
                              سُورَةُ {surahMeta?.nameWithTashkeel || surahMeta?.name || group.surahName}
                            </h3>
                            <span className="text-xs font-sans text-[#736B63] font-semibold">
                              آياتها {toArabicNumeral(surahMeta?.numberOfAyahs || group.ayahs.length)}
                            </span>
                          </div>
                        </div>

                        {/* Centered Bismillah banner (for all surahs except At-Tawbah #9 and Al-Fatiha #1 where Bismillah is Ayah 1) */}
                        {!isTawbah && !isFatiha && (
                          <div className="py-3 text-center">
                            <p className="font-['Amiri_Quran','Amiri',serif] text-2xl sm:text-3xl text-[#2D6A4F] font-bold select-none">
                              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Continuous Ayahs Flow on the Page */}
                    <div
                      className="font-['Amiri_Quran','Amiri',serif] leading-[2.8] sm:leading-[3.0] text-justify text-[#1F2421] tracking-wide"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {group.ayahs.map((ayah) => {
                        const isSelected = selectedAyah?.number === ayah.number;

                        return (
                          <span
                            key={ayah.number}
                            onClick={() => setSelectedAyah(ayah)}
                            className={`inline cursor-pointer transition-colors duration-150 rounded-lg px-0.5 py-0.5 ${
                              isSelected
                                ? 'bg-[#EBF7EE] text-[#1E4535] underline decoration-[#2D6A4F] decoration-2 underline-offset-8'
                                : 'hover:bg-[#FAF7F2] hover:text-[#2D6A4F]'
                            }`}
                            title={`الآية ${ayah.numberInSurah} من ${ayah.surahName} (انقر للتسميع أو الاستماع)`}
                          >
                            {ayah.cleanText}{' '}
                            {/* Ayah End Medallion */}
                            <span className="inline-block text-[#B8860B] font-bold text-base mx-1 select-none font-serif">
                              ﴿{toArabicNumeral(ayah.numberInSurah)}﴾
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Physical Bottom Page Number Centerpiece */}
          <div className="mt-8 pt-4 border-t border-[#F0ECE1] text-center select-none">
            <span className="font-mono text-sm font-bold text-[#8C827A]">
              – {toArabicNumeral(currentPage)} –
            </span>
          </div>
        </div>

        {/* Selected Ayah Quick Action Bar (Floating at Bottom of Page) */}
        {selectedAyah && (
          <div className="mx-3 sm:mx-6 mb-3 p-3 rounded-2xl bg-white border border-[#E8E2D5] shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] font-mono font-bold flex items-center justify-center text-xs">
                {selectedAyah.numberInSurah}
              </span>
              <div>
                <p className="font-bold text-[#1F2421]">
                  {selectedAyah.surahName} • الآية {toArabicNumeral(selectedAyah.numberInSurah)}
                </p>
                <p className="text-[11px] text-[#736B63] truncate max-w-xs sm:max-w-md">
                  {selectedAyah.cleanText}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Voice Reciter for this Ayah */}
              <button
                onClick={() => setIsVoiceModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#2D6A4F] text-white hover:bg-[#1E4535] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="تسميع وتصحيح هذه الآية بصوتك"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>تسميع هذه الآية</span>
              </button>

              {/* Copy Ayah */}
              <button
                onClick={() => handleCopyAyah(selectedAyah)}
                className="p-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFE6] border border-[#E8E2D5] text-[#736B63] cursor-pointer"
                title="نسخ نص الآية"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= Page-by-Page Clean Navigation Controls ================= */}
      <div className="bg-white rounded-3xl p-4 border border-[#E8E2D5] shadow-xs flex items-center justify-between text-xs">
        {/* Previous Page (RTL: ChevronRight points to the right = previous page) */}
        <button
          onClick={handleGoToPrevPage}
          disabled={currentPage <= 1}
          className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2 font-bold transition-all cursor-pointer select-none ${
            currentPage <= 1
              ? 'border-transparent text-[#C5BCB2] cursor-not-allowed'
              : 'bg-[#FAF7F2] text-[#403B36] border-[#E8E2D5] hover:bg-[#F3EFE6] active:scale-95'
          }`}
          title="الصفحة السابقة"
        >
          <ChevronRight className="w-4 h-4" />
          <span>الصفحة السابقة</span>
        </button>

        {/* Center Page Flip Info & Gesture Hint */}
        <div className="text-center hidden sm:flex flex-col items-center">
          <span className="font-bold text-[#1F2421]">
            صفحة {toArabicNumeral(currentPage)} من ٦٠٤
          </span>
          <span className="text-[10px] text-[#8C827A] mt-0.5">
            يمكنك سحب الشاشة يميناً ويساراً للتنقل بين الصفحات كالمصحف الحقيقي
          </span>
        </div>

        {/* Next Page (RTL: ChevronLeft points to the left = next page) */}
        <button
          onClick={handleGoToNextPage}
          disabled={currentPage >= 604}
          className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2 font-bold transition-all cursor-pointer select-none ${
            currentPage >= 604
              ? 'border-transparent text-[#C5BCB2] cursor-not-allowed'
              : 'bg-[#FAF7F2] text-[#403B36] border-[#E8E2D5] hover:bg-[#F3EFE6] active:scale-95'
          }`}
          title="الصفحة التالية"
        >
          <span>الصفحة التالية</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Microphone Action Button for Quick Recitation */}
      <div className="fixed bottom-6 left-6 z-30">
        <button
          onClick={() => {
            if (!selectedAyah && pageData && pageData.ayahs.length > 0) {
              setSelectedAyah(pageData.ayahs[0]);
            }
            setIsVoiceModalOpen(true);
          }}
          className="flex items-center gap-2.5 px-4 py-3 bg-[#2D6A4F] hover:bg-[#1E4535] text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer border border-white/20"
          title="ابدأ التسميع الصوتي المباشر للآية وتصحيحها فوراً"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold pl-1 hidden sm:inline">تسميع صوتي وتصحيح ذكي</span>
        </button>
      </div>

      {/* ================= Interactive Voice Recitation & Correction Modal (Tarteel-like) ================= */}
      {selectedAyah && (
        <QuranVoiceReciter
          activeAyah={selectedAyah}
          allAyahsOnPage={pageData?.ayahs}
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onSelectAyah={(ayah) => setSelectedAyah(ayah)}
          onNextAyah={handleNextAyahInReciter}
          onPrevAyah={handlePrevAyahInReciter}
          hasNextAyah={
            currentAyahIndexOnPage < (pageData?.ayahs.length || 0) - 1 || currentPage < 604
          }
          hasPrevAyah={currentAyahIndexOnPage > 0 || currentPage > 1}
        />
      )}
    </div>
  );
};
