import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  Copy,
  Check,
  Bookmark,
  Share2,
  X,
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

interface QuranPageReaderProps {
  currentPage: number;
  onPageChange: (newPage: number) => void;
  fontSize: number;
  isNightMode: boolean;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onSelectSurah?: (surah: SurahMeta) => void;
}

export const QuranPageReader: React.FC<QuranPageReaderProps> = ({
  currentPage,
  onPageChange,
  fontSize,
  isNightMode,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [pageData, setPageData] = useState<QuranPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAyah, setSelectedAyah] = useState<QuranAyah | null>(null);
  const [copiedAyahNum, setCopiedAyahNum] = useState<number | null>(null);

  // Touch Swipe Gesture tracking
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Load page data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setSelectedAyah(null);

    getQuranPage(currentPage)
      .then((data) => {
        if (isMounted) {
          setPageData(data);
          setIsLoading(false);
          // Preload adjacent pages for instant flipping
          preloadAdjacentPages(currentPage);
        }
      })
      .catch((err) => {
        console.error('Error fetching Quran page:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage]);

  // Page Navigation Handlers
  const handleGoToNextPage = useCallback(() => {
    if (currentPage < 604) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, onPageChange]);

  const handleGoToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

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

  // Touch Swipe Gesture Handlers (Smooth Page Flipping for Android & Mobile)
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

    // Ensure it's mostly a horizontal swipe (>45px) and not vertical scrolling
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
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

  // Group ayahs by Surah to render Surah Headers & Bismillah correctly
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

  // Copy Ayah text
  const handleCopyAyah = (ayah: QuranAyah) => {
    const textToCopy = `${ayah.cleanText} ﴿${toArabicNumeral(ayah.numberInSurah)}﴾ [سورة ${ayah.surahName}]`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedAyahNum(ayah.number);
    setTimeout(() => setCopiedAyahNum(null), 2500);
  };

  return (
    <div className="w-full max-w-full space-y-4 select-none overflow-x-hidden" dir="rtl">
      {/* ================= Digital Mushaf Frame ================= */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative rounded-3xl border transition-all duration-300 overflow-hidden shadow-sm ${
          isNightMode
            ? 'bg-[#181B1A] border-[#2A332F] text-[#EAE6DC]'
            : 'bg-[#FDFBF7] border-[#E6DFC6] text-[#1F2421]'
        }`}
      >
        {/* Subtle Decorative Inner Border */}
        <div
          className={`m-1.5 sm:m-3 p-4 sm:p-7 md:p-9 rounded-2xl border flex flex-col justify-between min-h-[520px] sm:min-h-[580px] transition-colors relative ${
            isNightMode
              ? 'bg-[#1E2321] border-[#2A332F]'
              : 'bg-[#FAF7F2] border-[#EDE6D6]'
          }`}
        >
          {/* Subtle Corner Motifs */}
          <div
            className={`absolute top-2.5 right-3 text-xs font-serif pointer-events-none select-none ${
              isNightMode ? 'text-[#D4A373]/30' : 'text-[#D4A373]/40'
            }`}
          >
            ❖
          </div>
          <div
            className={`absolute top-2.5 left-3 text-xs font-serif pointer-events-none select-none ${
              isNightMode ? 'text-[#D4A373]/30' : 'text-[#D4A373]/40'
            }`}
          >
            ❖
          </div>
          <div
            className={`absolute bottom-2.5 right-3 text-xs font-serif pointer-events-none select-none ${
              isNightMode ? 'text-[#D4A373]/30' : 'text-[#D4A373]/40'
            }`}
          >
            ❖
          </div>
          <div
            className={`absolute bottom-2.5 left-3 text-xs font-serif pointer-events-none select-none ${
              isNightMode ? 'text-[#D4A373]/30' : 'text-[#D4A373]/40'
            }`}
          >
            ❖
          </div>

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#2D6A4F] animate-spin" />
              <p
                className={`text-xs font-medium ${
                  isNightMode ? 'text-[#9FA9A3]' : 'text-[#736B63]'
                }`}
              >
                جاري تحميل صفحة {toArabicNumeral(currentPage)} بالرسم العثماني...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Ayahs grouped by Surah */}
              {groupedAyahs.map((group, groupIdx) => {
                const surahMeta = getSurahByNumber(group.surahNumber);
                const isSurahStart = group.isSurahStartOnPage;
                const isTawbah = group.surahNumber === 9;
                const isFatiha = group.surahNumber === 1;

                return (
                  <div key={groupIdx} className="space-y-4">
                    {/* Surah Header Banner if a Surah starts on this page */}
                    {isSurahStart && (
                      <div className="my-5 text-center select-none">
                        <div
                          className={`relative inline-block w-full max-w-md mx-auto py-2.5 px-6 rounded-2xl border transition-colors shadow-2xs ${
                            isNightMode
                              ? 'bg-[#252C29] border-[#3E4943] text-[#EAE6DC]'
                              : 'bg-[#F2ECE1] border-[#D4A373] text-[#1E4535]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 font-['Amiri',serif]">
                            <span
                              className={`text-[11px] font-sans ${
                                isNightMode ? 'text-[#9FA9A3]' : 'text-[#736B63]'
                              }`}
                            >
                              {surahMeta?.revelationType || 'مكية'}
                            </span>
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wider">
                              سُورَةُ {surahMeta?.nameWithTashkeel || surahMeta?.name || group.surahName}
                            </h3>
                            <span
                              className={`text-[11px] font-sans ${
                                isNightMode ? 'text-[#9FA9A3]' : 'text-[#736B63]'
                              }`}
                            >
                              آياتها {toArabicNumeral(surahMeta?.numberOfAyahs || group.ayahs.length)}
                            </span>
                          </div>
                        </div>

                        {/* Centered Bismillah Banner (for all except At-Tawbah and Al-Fatihah) */}
                        {!isTawbah && !isFatiha && (
                          <div className="pt-4 pb-2 text-center">
                            <p
                              className={`font-['Amiri_Quran','Amiri','Scheherazade_New',serif] text-2xl sm:text-3xl font-bold select-none tracking-wide ${
                                isNightMode ? 'text-[#52B788]' : 'text-[#2D6A4F]'
                              }`}
                            >
                              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Continuous Quran Text Flow */}
                    <div
                      className="font-quran leading-[2.8] sm:leading-[3.1] text-justify tracking-normal [word-break:normal] [overflow-wrap:break-word] [hyphens:none]"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {group.ayahs.map((ayah) => {
                        const isSelected = selectedAyah?.number === ayah.number;

                        return (
                          <span
                            key={ayah.number}
                            onClick={() => setSelectedAyah(isSelected ? null : ayah)}
                            className={`inline cursor-pointer transition-colors duration-150 rounded-lg px-0.5 py-0.5 ${
                              isSelected
                                ? isNightMode
                                  ? 'bg-[#2D6A4F]/30 text-[#85E3B3] ring-1 ring-[#52B788]'
                                  : 'bg-[#EBF7EE] text-[#1E4535] underline decoration-[#2D6A4F] decoration-2 underline-offset-8'
                                : isNightMode
                                ? 'hover:bg-[#252B28]'
                                : 'hover:bg-[#F3EFE6]'
                            }`}
                            title={`الآية ${ayah.numberInSurah} من ${ayah.surahName}`}
                          >
                            {ayah.cleanText}{' '}
                            {/* Ayah End Medallion */}
                            <span
                              className={`inline-block font-quran font-bold mx-1 select-none whitespace-nowrap text-[0.9em] ${
                                isNightMode ? 'text-[#E9D8A6]' : 'text-[#B8860B]'
                              }`}
                            >
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

          {/* Bottom Page Number Centerpiece */}
          <div
            className={`mt-8 pt-3 border-t text-center select-none ${
              isNightMode ? 'border-[#2A332F]' : 'border-[#EDE6D6]'
            }`}
          >
            <span
              className={`font-mono text-xs sm:text-sm font-bold ${
                isNightMode ? 'text-[#9FA9A3]' : 'text-[#8C827A]'
              }`}
            >
              – {toArabicNumeral(currentPage)} –
            </span>
          </div>
        </div>

        {/* Selected Ayah Floating Action Bar */}
        {selectedAyah && (
          <div
            className={`mx-3 sm:mx-6 mb-3 p-3 rounded-2xl border shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150 ${
              isNightMode
                ? 'bg-[#242B28] border-[#36423C] text-[#EAE6DC]'
                : 'bg-white border-[#E8E2D5] text-[#1F2421]'
            }`}
          >
            <div className="flex items-center gap-2.5 max-w-[75%]">
              <span
                className={`w-7 h-7 rounded-xl font-mono font-bold flex items-center justify-center text-xs shrink-0 ${
                  isNightMode
                    ? 'bg-[#52B788]/20 text-[#52B788]'
                    : 'bg-[#2D6A4F]/10 text-[#2D6A4F]'
                }`}
              >
                {selectedAyah.numberInSurah}
              </span>
              <div className="truncate">
                <p className="font-bold text-xs">
                  {selectedAyah.surahName} • الآية {toArabicNumeral(selectedAyah.numberInSurah)}
                </p>
                <p
                  className={`text-[11px] truncate ${
                    isNightMode ? 'text-[#9FA9A3]' : 'text-[#736B63]'
                  }`}
                >
                  {selectedAyah.cleanText}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopyAyah(selectedAyah)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                  copiedAyahNum === selectedAyah.number
                    ? 'bg-[#2D6A4F] text-white border-transparent'
                    : isNightMode
                    ? 'bg-[#1C201E] border-[#36423C] text-[#EAE6DC] hover:bg-[#2B332F]'
                    : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#403B36] hover:bg-[#F3EFE6]'
                }`}
                title="نسخ الآية"
              >
                {copiedAyahNum === selectedAyah.number ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedAyah(null)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isNightMode ? 'hover:bg-[#36423C] text-[#9FA9A3]' : 'hover:bg-[#F3EFE6] text-[#8C827A]'
                }`}
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= Simple Previous / Next Navigation Controls ================= */}
      <div
        className={`rounded-2xl p-3 sm:p-4 border shadow-xs flex items-center justify-between text-xs transition-colors ${
          isNightMode
            ? 'bg-[#1E2321] border-[#2A332F] text-[#EAE6DC]'
            : 'bg-white border-[#E8E2D5] text-[#1F2421]'
        }`}
      >
        {/* Previous Page Button (In RTL, ChevronRight points to the right = Previous page) */}
        <button
          onClick={handleGoToPrevPage}
          disabled={currentPage <= 1}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl border flex items-center gap-2 font-bold transition-all cursor-pointer select-none ${
            currentPage <= 1
              ? isNightMode
                ? 'border-transparent text-[#44504A] cursor-not-allowed'
                : 'border-transparent text-[#C5BCB2] cursor-not-allowed'
              : isNightMode
              ? 'bg-[#252C29] text-[#EAE6DC] border-[#36423C] hover:bg-[#2F3834] active:scale-95'
              : 'bg-[#FAF7F2] text-[#403B36] border-[#E8E2D5] hover:bg-[#F3EFE6] active:scale-95'
          }`}
          title="الصفحة السابقة"
          aria-label="الصفحة السابقة"
        >
          <ChevronRight className="w-4 h-4" />
          <span>الصفحة السابقة</span>
        </button>

        {/* Center Page indicator */}
        <div className="text-center flex flex-col items-center">
          <span className="font-bold text-xs sm:text-sm font-mono">
            صفحة {toArabicNumeral(currentPage)} من ٦٠٤
          </span>
          <span
            className={`text-[10px] hidden sm:inline mt-0.5 ${
              isNightMode ? 'text-[#9FA9A3]' : 'text-[#8C827A]'
            }`}
          >
            يمكنك سحب الشاشة يميناً ويساراً للتنقل بين الصفحات
          </span>
        </div>

        {/* Next Page Button (In RTL, ChevronLeft points to the left = Next page) */}
        <button
          onClick={handleGoToNextPage}
          disabled={currentPage >= 604}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl border flex items-center gap-2 font-bold transition-all cursor-pointer select-none ${
            currentPage >= 604
              ? isNightMode
                ? 'border-transparent text-[#44504A] cursor-not-allowed'
                : 'border-transparent text-[#C5BCB2] cursor-not-allowed'
              : isNightMode
              ? 'bg-[#252C29] text-[#EAE6DC] border-[#36423C] hover:bg-[#2F3834] active:scale-95'
              : 'bg-[#FAF7F2] text-[#403B36] border-[#E8E2D5] hover:bg-[#F3EFE6] active:scale-95'
          }`}
          title="الصفحة التالية"
          aria-label="الصفحة التالية"
        >
          <span>الصفحة التالية</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
