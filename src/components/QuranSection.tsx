import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BookOpen,
  Search,
  Bookmark,
  Sparkles,
  Play,
  Pause,
  Volume2,
  CheckCircle2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
  Compass,
  X,
  Share2,
  Copy,
  Layers,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Mic,
} from 'lucide-react';
import { ALL_SURAHS, SurahMeta } from '../data/quranData';
import { getSurahVerses, LoadedSurahData } from '../utils/quranReader';
import { UserProgress } from '../types';
import { QuranPageReader } from './QuranPageReader';

interface QuranSectionProps {
  progress: UserProgress;
  onUpdatePages: (pages: number) => void;
  onOpenTrackerModal?: () => void;
  onPlaySurahAudio?: (surahNumber: number) => void;
  activeAudioSurah?: number | null;
  isAudioPlaying?: boolean;
}

export const QuranSection: React.FC<QuranSectionProps> = ({
  progress,
  onUpdatePages,
  onOpenTrackerModal,
  onPlaySurahAudio,
  activeAudioSurah = null,
  isAudioPlaying = false,
}) => {
  // Main view mode: Physical Page-by-Page Quran (Default) vs Surah Index
  const [viewMode, setViewMode] = useState<'mushafPage' | 'surahIndex'>('mushafPage');

  // Bookmark stored in localStorage
  const [bookmark, setBookmark] = useState<{ surahNumber: number; surahName: string; page: number } | null>(() => {
    try {
      const saved = localStorage.getItem('ouns_quran_bookmark');
      return saved ? JSON.parse(saved) : { surahNumber: 1, surahName: 'الفاتحة', page: 1 };
    } catch {
      return { surahNumber: 1, surahName: 'الفاتحة', page: 1 };
    }
  });

  const [currentMushafPage, setCurrentMushafPage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ouns_quran_bookmark');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.page && parsed.page >= 1 && parsed.page <= 604) {
          return parsed.page;
        }
      }
    } catch {
      // ignore
    }
    return 1;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'popular' | 'makki' | 'madani'>('all');
  const [selectedJuz, setSelectedJuz] = useState<number | 'all'>('all');
  const [activeSurah, setActiveSurah] = useState<SurahMeta | null>(null);

  // Modal Reader state for individual surah verse-by-verse view if opened
  const [fontSize, setFontSize] = useState<number>(23);
  const [readingMode, setReadingMode] = useState<'mushaf' | 'verseByVerse'>('mushaf');
  const [surahVersesData, setSurahVersesData] = useState<LoadedSurahData | null>(null);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [verseSearch, setVerseSearch] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Audio player state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [recordedFeedback, setRecordedFeedback] = useState<string | null>(null);

  // Fetch full verses whenever activeSurah modal changes
  useEffect(() => {
    if (!activeSurah) {
      setSurahVersesData(null);
      return;
    }

    let isMounted = true;
    setIsLoadingVerses(true);
    setVerseSearch('');

    getSurahVerses(activeSurah.number)
      .then((data) => {
        if (isMounted) {
          setSurahVersesData(data);
          setIsLoadingVerses(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoadingVerses(false);
        }
      });

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingAudio(false);
    };
  }, [activeSurah]);

  // Filtered surahs list
  const filteredSurahs = useMemo(() => {
    return ALL_SURAHS.filter((surah) => {
      const matchesSearch =
        surah.name.includes(searchQuery) ||
        surah.nameWithTashkeel.includes(searchQuery) ||
        surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surah.number.toString() === searchQuery.trim();

      if (!matchesSearch) return false;

      if (filterType === 'popular' && !surah.popularDaily) return false;
      if (filterType === 'makki' && surah.revelationType !== 'مكية') return false;
      if (filterType === 'madani' && surah.revelationType !== 'مدنية') return false;

      if (selectedJuz !== 'all' && surah.juz !== selectedJuz) return false;

      return true;
    });
  }, [searchQuery, filterType, selectedJuz]);

  const handleSaveBookmarkFromPage = (page: number, surahName: string) => {
    const item = {
      surahNumber: 1,
      surahName,
      page,
    };
    setBookmark(item);
    try {
      localStorage.setItem('ouns_quran_bookmark', JSON.stringify(item));
    } catch {
      // ignore
    }
  };

  const handleSaveBookmark = (surah: SurahMeta) => {
    const item = {
      surahNumber: surah.number,
      surahName: surah.name,
      page: surah.startPage,
    };
    setBookmark(item);
    try {
      localStorage.setItem('ouns_quran_bookmark', JSON.stringify(item));
    } catch {
      // ignore
    }
    setRecordedFeedback(`تم حفظ سورة ${surah.name} كموضع القراءة المرجعي (صفحة ${surah.startPage}) ✓`);
    setTimeout(() => setRecordedFeedback(null), 3000);
  };

  const handleRecordSurahRead = (surah: SurahMeta) => {
    const estimatedPages = Math.max(1, Math.ceil(surah.numberOfAyahs / 15));
    const newTotal = progress.quranPagesReadToday + estimatedPages;
    onUpdatePages(newTotal);
    setRecordedFeedback(`تم تسجيل قراءة سورة ${surah.name} (+${estimatedPages} صفحة في وردك) ✓`);
    setTimeout(() => setRecordedFeedback(null), 3500);
  };

  // Jump directly to physical Quran page for a given surah
  const handleOpenSurahInMushafPage = (surah: SurahMeta) => {
    setCurrentMushafPage(surah.startPage);
    setViewMode('mushafPage');
  };

  // Audio recitation handler
  const handleToggleAudio = (surahNumber: number) => {
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingAudio(false);
    } else {
      const paddedNum = surahNumber.toString().padStart(3, '0');
      const audioUrl = `https://server8.mp3quran.net/afs/${paddedNum}.mp3`;
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
      } else {
        audioRef.current.src = audioUrl;
      }
      audioRef.current.play().catch(() => {
        setIsPlayingAudio(false);
      });
      setIsPlayingAudio(true);

      audioRef.current.onended = () => {
        setIsPlayingAudio(false);
      };
    }
  };

  // Navigate to previous/next surah inside modal reader
  const handleGoToSurah = (direction: 'prev' | 'next') => {
    if (!activeSurah) return;
    const currentIndex = ALL_SURAHS.findIndex((s) => s.number === activeSurah.number);
    if (direction === 'prev' && currentIndex > 0) {
      setActiveSurah(ALL_SURAHS[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < ALL_SURAHS.length - 1) {
      setActiveSurah(ALL_SURAHS[currentIndex + 1]);
    }
  };

  const handleCopyVerse = (text: string, index: number) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  // Filtered verses if searching inside surah
  const displayedVerses = useMemo(() => {
    if (!surahVersesData?.verses) return [];
    if (!verseSearch.trim()) return surahVersesData.verses;
    return surahVersesData.verses.filter((v) => v.includes(verseSearch.trim()));
  }, [surahVersesData, verseSearch]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E4535] via-[#2D6A4F] to-[#1B4332] text-white p-6 sm:p-7 shadow-lg border border-[#2D6A4F]/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold mb-2.5 backdrop-blur-xs">
                <BookOpen className="w-3.5 h-3.5 text-[#D4A373]" />
                <span>المصحف الشريف كاملاً (114 سورة للقراءة والتدبر)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-['Amiri',serif] tracking-wide">
                سور القرآن الكريم
              </h2>
              <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-lg leading-relaxed">
                اقرأ جميع سور القرآن الكريم كاملةً بالرسم العثماني، واستمع للتلاوة العطرة، وتابع وردك اليومي خطوة بخطوة.
              </p>
            </div>

            {/* Quick Wird Stats Card */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 sm:text-left min-w-[210px]">
              <div className="flex items-center justify-between text-xs text-white/75 mb-1.5">
                <span>وردك اليومي:</span>
                <span className="font-bold text-[#F3EFE6]">
                  {progress.quranPagesReadToday} / {progress.quranGoalPages} صفحة
                </span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-[#D4A373] to-[#E9D8A6] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (progress.quranPagesReadToday / progress.quranGoalPages) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <button
                  onClick={() => onUpdatePages(progress.quranPagesReadToday + 1)}
                  className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-bold text-white transition-all cursor-pointer"
                  title="تسجيل قراءة صفحة"
                >
                  +1 صفحة
                </button>
                <button
                  onClick={() => onUpdatePages(progress.quranPagesReadToday + 2)}
                  className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-bold text-white transition-all cursor-pointer"
                  title="تسجيل قراءة صفحتين"
                >
                  +2 صفحة
                </button>
                {onOpenTrackerModal && (
                  <button
                    onClick={onOpenTrackerModal}
                    className="px-2 py-1 rounded-lg bg-white/25 hover:bg-white/35 text-[11px] font-bold text-[#F3EFE6] transition-all cursor-pointer"
                    title="سجل الورد المفصل"
                  >
                    تفاصيل الورد
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bookmark Quick Jump Banner */}
          {bookmark && (
            <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-white/90">
                <Bookmark className="w-4 h-4 text-[#D4A373]" />
                <span>
                  آخر موضع قراءة محفوظ: <strong>سورة {bookmark.surahName}</strong> (صفحة {bookmark.page})
                </span>
              </div>
              <button
                onClick={() => {
                  setCurrentMushafPage(bookmark.page);
                  setViewMode('mushafPage');
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-[#1E4535] font-bold hover:bg-[#F3EFE6] transition-all cursor-pointer shadow-xs text-xs"
              >
                <span>متابعة القراءة الآن (صفحة {bookmark.page})</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View Mode Switcher: Page-by-Page Physical Mushaf vs Surah Directory */}
      <div className="flex items-center justify-center gap-2 p-1.5 bg-white border border-[#E8E2D5] rounded-2xl max-w-md mx-auto shadow-xs">
        <button
          onClick={() => setViewMode('mushafPage')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            viewMode === 'mushafPage'
              ? 'bg-[#2D6A4F] text-white shadow-xs'
              : 'text-[#736B63] hover:text-[#1F2421] hover:bg-[#FAF7F2]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>المصحف صفحة بصفحة</span>
        </button>

        <button
          onClick={() => setViewMode('surahIndex')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            viewMode === 'surahIndex'
              ? 'bg-[#2D6A4F] text-white shadow-xs'
              : 'text-[#736B63] hover:text-[#1F2421] hover:bg-[#FAF7F2]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>فهرس السور (١١٤ سورة)</span>
        </button>
      </div>

      {/* Feedback Alert if pages or bookmark recorded */}
      {recordedFeedback && (
        <div className="p-3.5 rounded-2xl bg-[#EBF7EE] border border-[#B7E4C7] text-xs font-bold text-[#1E4535] flex items-center justify-between gap-2 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
            <span>{recordedFeedback}</span>
          </div>
          <button
            onClick={() => setRecordedFeedback(null)}
            className="text-[#2D6A4F] hover:text-[#1E4535] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main View: Page-by-Page Physical Reader or Surah Directory */}
      {viewMode === 'mushafPage' ? (
        <QuranPageReader
          initialPage={currentMushafPage}
          onUpdatePagesRead={onUpdatePages}
          pagesReadToday={progress.quranPagesReadToday}
          onSaveBookmark={handleSaveBookmarkFromPage}
          savedBookmarkPage={bookmark?.page}
          onPlaySurahAudio={onPlaySurahAudio}
          isAudioPlaying={isAudioPlaying}
          currentAudioSurah={activeAudioSurah}
        />
      ) : (
        <div className="space-y-6">
          {/* Search & Filter Controls */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E8E2D5] shadow-xs space-y-4">
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن أي سورة بالاسم (الفاتحة، البقرة، الكهف، يس، الملك...) أو برقمها..."
                className="w-full pr-11 pl-4 py-3 bg-[#FAF7F2] border border-[#E8E2D5] rounded-2xl text-xs sm:text-sm text-[#1F2421] placeholder-[#948B81] focus:outline-none focus:border-[#2D6A4F] focus:bg-white transition-all"
              />
              <Search className="w-5 h-5 text-[#8C827A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8C827A] hover:text-[#403B36] cursor-pointer"
                >
                  مسح
                </button>
              )}
            </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F0ECE1]">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#736B63] hover:bg-[#F3EFE6] border border-[#E8E2D5]'
              }`}
            >
              جميع السور (114)
            </button>
            <button
              onClick={() => setFilterType('popular')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterType === 'popular'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#736B63] hover:bg-[#F3EFE6] border border-[#E8E2D5]'
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#D4A373]" />
              <span>السور المأثورة واليومية</span>
            </button>
            <button
              onClick={() => setFilterType('makki')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'makki'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#736B63] hover:bg-[#F3EFE6] border border-[#E8E2D5]'
              }`}
            >
              مكية (86)
            </button>
            <button
              onClick={() => setFilterType('madani')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'madani'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#736B63] hover:bg-[#F3EFE6] border border-[#E8E2D5]'
              }`}
            >
              مدنية (28)
            </button>
          </div>

          {/* Juz selector dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-[#736B63]">
            <span>الجزء:</span>
            <select
              value={selectedJuz}
              onChange={(e) => setSelectedJuz(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-[#FAF7F2] border border-[#E8E2D5] rounded-xl px-2.5 py-1 text-xs text-[#1F2421] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">كل الأجزاء (30)</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                <option key={j} value={j}>
                  الجزء {j}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Surahs Grid Count Summary */}
      <div className="flex items-center justify-between text-xs text-[#8C827A] px-1">
        <span>عرض {filteredSurahs.length} سورة من أصل 114 سورة كاملة للقراءة</span>
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
              setSelectedJuz('all');
            }}
            className="text-[#2D6A4F] hover:underline cursor-pointer"
          >
            إعادة ضبط الفلاتر
          </button>
        )}
      </div>

      {/* Surahs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredSurahs.map((surah) => {
          const isBookmarked = bookmark?.surahNumber === surah.number;

          return (
            <div
              key={surah.number}
              className={`bg-white rounded-2xl p-4 border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                isBookmarked ? 'border-[#B8860B]/50 bg-[#FFFCF5]' : 'border-[#E8E2D5] hover:border-[#2D6A4F]/40'
              }`}
            >
              <div>
                {/* Top Row: Number & Title & Type */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    {/* Surah Number Medallion */}
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-center text-xs font-bold text-[#2D6A4F] font-mono shrink-0 shadow-2xs">
                      {surah.number}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold font-['Amiri',serif] text-[#1F2421] leading-tight">
                          سورة {surah.name}
                        </h3>
                        {surah.popularDaily && (
                          <span
                            title="سورة مأثورة يومياً أو أسبوعياً"
                            className="w-2 h-2 rounded-full bg-[#B8860B]"
                          />
                        )}
                      </div>
                      <span className="text-[11px] text-[#8C827A]">
                        {surah.englishName} • {surah.numberOfAyahs} آيات
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        surah.revelationType === 'مكية'
                          ? 'bg-[#F0F7F4] text-[#2D6A4F] border border-[#D8EADB]'
                          : 'bg-[#F4F1EA] text-[#736B63] border border-[#E2DDD3]'
                      }`}
                    >
                      {surah.revelationType}
                    </span>
                    <span className="text-[10px] text-[#A69C91]">الجزء {surah.juz}</span>
                  </div>
                </div>

                {/* Virtue or Theme */}
                {surah.virtue ? (
                  <p className="text-xs text-[#554E46] line-clamp-2 bg-[#FAF7F2] p-2 rounded-xl border border-[#F0ECE1] mb-3 leading-relaxed">
                    <span className="text-[#2D6A4F] font-bold">الفضل: </span>
                    {surah.virtue}
                  </p>
                ) : (
                  <div className="text-[11px] text-[#8C827A] mb-3">
                    تبدأ من صفحة {surah.startPage} في مصحف المدينة
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#F5F2EB] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleOpenSurahInMushafPage(surah)}
                    className="px-3 py-1.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4535] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1"
                    title={`قراءة في المصحف صفحة بصفحة (صفحة ${surah.startPage})`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>صفحة {surah.startPage}</span>
                  </button>

                  {/* Sheikh Audio Recitation Button */}
                  <button
                    onClick={() => {
                      if (onPlaySurahAudio) {
                        onPlaySurahAudio(surah.number);
                      } else {
                        handleToggleAudio(surah.number);
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs ${
                      activeAudioSurah === surah.number && isAudioPlaying
                        ? 'bg-[#1E4535] text-white ring-2 ring-[#D4A373]'
                        : 'bg-[#D4A373]/20 hover:bg-[#D4A373] text-[#7A4E1D] hover:text-white'
                    }`}
                    title={`تشغيل صوت الشيخ لسورة ${surah.name}`}
                  >
                    {activeAudioSurah === surah.number && isAudioPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>إيقاف</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>صوت الشيخ 🎧</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentMushafPage(surah.startPage);
                      setViewMode('mushafPage');
                    }}
                    className="p-1.5 rounded-xl bg-[#2D6A4F]/10 hover:bg-[#2D6A4F]/20 text-[#2D6A4F] transition-all cursor-pointer"
                    title={`تسميع صوتي تفاعلي لسورة ${surah.name}`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleSaveBookmark(surah)}
                    title={isBookmarked ? 'محفوظة كآخر موضع قراءة' : 'حفظ كآخر موضع قراءة'}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                      isBookmarked
                        ? 'bg-[#B8860B]/15 text-[#B8860B] border border-[#B8860B]/30'
                        : 'bg-[#FAF7F2] text-[#8C827A] hover:bg-[#F3EFE6] border border-[#E8E2D5]'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleRecordSurahRead(surah)}
                  title="سجّل قراءة هذه السورة في ورد اليوم"
                  className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFE6] border border-[#E8E2D5] text-[11px] font-bold text-[#403B36] cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-[#2D6A4F]" />
                  <span>سجّل في وردي</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}

      {/* ================= Surah Reading Modal (All 114 Surahs with Full Verses) ================= */}
      {activeSurah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-4xl bg-[#FDFCF7] rounded-3xl border border-[#E8E2D5] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E8E2D5] bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center font-bold text-sm font-mono">
                  {activeSurah.number}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-bold font-['Amiri',serif] text-[#1F2421]">
                      سورة {activeSurah.nameWithTashkeel || activeSurah.name}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activeSurah.revelationType === 'مكية'
                          ? 'bg-[#F0F7F4] text-[#2D6A4F]'
                          : 'bg-[#F4F1EA] text-[#736B63]'
                      }`}
                    >
                      {activeSurah.revelationType}
                    </span>
                  </div>
                  <p className="text-xs text-[#736B63] mt-0.5">
                    {activeSurah.numberOfAyahs} آيات • الجزء {activeSurah.juz} • صفحة {activeSurah.startPage} في مصحف المدينة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Audio Reciter button */}
                <button
                  onClick={() => {
                    if (onPlaySurahAudio) {
                      onPlaySurahAudio(activeSurah.number);
                    } else {
                      handleToggleAudio(activeSurah.number);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeAudioSurah === activeSurah.number && isAudioPlaying
                      ? 'bg-[#1E4535] text-white shadow-xs ring-2 ring-[#D4A373]'
                      : 'bg-[#FAF7F2] text-[#403B36] hover:bg-[#F3EFE6] border border-[#E8E2D5]'
                  }`}
                  title={
                    activeAudioSurah === activeSurah.number && isAudioPlaying
                      ? 'إيقاف التلاوة'
                      : 'استماع لصوت الشيخ'
                  }
                >
                  {activeAudioSurah === activeSurah.number && isAudioPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-[#2D6A4F] fill-[#2D6A4F]" />
                  )}
                  <span className="hidden sm:inline">
                    {activeAudioSurah === activeSurah.number && isAudioPlaying ? 'إيقاف الصوت' : 'صوت الشيخ 🎧'}
                  </span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setActiveSurah(null)}
                  className="p-2 rounded-full hover:bg-[#F3EFE6] text-[#736B63] transition-colors cursor-pointer"
                  title="إغلاق القارئ"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Reader Toolbar: Font zoom & Reading Mode & Navigation */}
            <div className="px-5 py-2.5 bg-[#FAF7F2] border-b border-[#E8E2D5] flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Reading mode toggle */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E8E2D5]">
                <button
                  onClick={() => setReadingMode('mushaf')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    readingMode === 'mushaf' ? 'bg-[#2D6A4F] text-white' : 'text-[#736B63] hover:text-[#1F2421]'
                  }`}
                >
                  عرض المصحف
                </button>
                <button
                  onClick={() => setReadingMode('verseByVerse')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    readingMode === 'verseByVerse' ? 'bg-[#2D6A4F] text-white' : 'text-[#736B63] hover:text-[#1F2421]'
                  }`}
                >
                  آية بآية
                </button>
              </div>

              {/* Font Size controls */}
              <div className="flex items-center gap-2">
                <span className="text-[#8C827A]">الخط:</span>
                <button
                  onClick={() => setFontSize((s) => Math.max(16, s - 2))}
                  className="p-1 rounded-lg bg-white border border-[#E8E2D5] hover:bg-[#F3EFE6] text-[#403B36] cursor-pointer"
                  title="تصغير الخط"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-[#2D6A4F] min-w-[20px] text-center">
                  {fontSize}
                </span>
                <button
                  onClick={() => setFontSize((s) => Math.min(38, s + 2))}
                  className="p-1 rounded-lg bg-white border border-[#E8E2D5] hover:bg-[#F3EFE6] text-[#403B36] cursor-pointer"
                  title="تكبير الخط"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Actions: Bookmark & Record */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveBookmark(activeSurah)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-[#E8E2D5] text-xs font-bold text-[#403B36] hover:bg-[#F3EFE6] cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span className="hidden sm:inline">حفظ موضع القراءة</span>
                </button>

                <button
                  onClick={() => handleRecordSurahRead(activeSurah)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold hover:bg-[#1E4535] cursor-pointer shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>سجّل في ورد اليوم</span>
                </button>
              </div>
            </div>

            {/* Verses Text Area */}
            <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-6">
              {/* Virtue callout if available */}
              {activeSurah.virtue && (
                <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E8E2D5] text-xs text-[#554E46] leading-relaxed">
                  <strong className="text-[#2D6A4F]">فضل السورة: </strong>
                  {activeSurah.virtue}
                </div>
              )}

              {/* Bismillah Header (except for Surah At-Tawbah #9) */}
              {activeSurah.number !== 9 && (
                <div className="text-center py-2">
                  <p className="font-['Amiri',serif] text-2xl sm:text-3xl text-[#2D6A4F] font-bold">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                </div>
              )}

              {/* Loading State */}
              {isLoadingVerses ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-[#2D6A4F] animate-spin mx-auto" />
                  <p className="text-xs text-[#736B63] font-medium">
                    جاري تحميل آيات سورة {activeSurah.name} بالرسم العثماني...
                  </p>
                </div>
              ) : (
                <>
                  {/* Search within Surah */}
                  {surahVersesData && surahVersesData.verses.length > 15 && (
                    <div className="max-w-md mx-auto relative mb-4">
                      <input
                        type="text"
                        value={verseSearch}
                        onChange={(e) => setVerseSearch(e.target.value)}
                        placeholder="ابحث عن كلمة في آيات السورة..."
                        className="w-full pr-9 pl-4 py-1.5 bg-white border border-[#E8E2D5] rounded-xl text-xs text-[#1F2421] placeholder-[#A69C91] focus:outline-none focus:border-[#2D6A4F]"
                      />
                      <Search className="w-3.5 h-3.5 text-[#8C827A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      {verseSearch && (
                        <button
                          onClick={() => setVerseSearch('')}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#8C827A]"
                        >
                          مسح
                        </button>
                      )}
                    </div>
                  )}

                  {/* 1. Continuous Mushaf Layout */}
                  {readingMode === 'mushaf' ? (
                    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E2D5] shadow-xs">
                      <div
                        className="font-['Amiri',serif] leading-[2.7] text-justify text-[#1F2421] tracking-wide"
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        {displayedVerses.map((verse, idx) => (
                          <span key={idx} className="inline ml-1.5 hover:text-[#2D6A4F] transition-colors">
                            {verse}{' '}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* 2. Verse By Verse Layout */
                    <div className="space-y-3">
                      {displayedVerses.map((verse, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D5] hover:border-[#2D6A4F]/40 transition-all flex items-start justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-center text-[11px] font-bold text-[#2D6A4F] font-mono shrink-0">
                              {idx + 1}
                            </span>
                            <p
                              className="font-['Amiri',serif] leading-[2.2] text-[#1F2421]"
                              style={{ fontSize: `${fontSize}px` }}
                            >
                              {verse}
                            </p>
                          </div>

                          <button
                            onClick={() => handleCopyVerse(verse, idx)}
                            className="p-2 rounded-xl text-[#8C827A] hover:bg-[#FAF7F2] hover:text-[#1F2421] transition-colors shrink-0 cursor-pointer"
                            title="نسخ الآية"
                          >
                            {copiedIndex === idx ? (
                              <Check className="w-4 h-4 text-[#2D6A4F]" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer: Prev / Next Surah navigation */}
            <div className="p-4 bg-white border-t border-[#E8E2D5] flex items-center justify-between text-xs">
              <button
                onClick={() => handleGoToSurah('prev')}
                disabled={activeSurah.number <= 1}
                className={`px-3 py-2 rounded-xl border flex items-center gap-1 font-bold transition-all cursor-pointer ${
                  activeSurah.number <= 1
                    ? 'border-transparent text-[#C5BCB2] cursor-not-allowed'
                    : 'bg-[#FAF7F2] text-[#403B36] border-[#E8E2D5] hover:bg-[#F3EFE6]'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
                <span>السورة السابقة</span>
              </button>

              <span className="text-[#8C827A] hidden sm:inline">
                صفحة {activeSurah.startPage} • مصحف المدينة المنورة
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGoToSurah('next')}
                  disabled={activeSurah.number >= 114}
                  className={`px-3 py-2 rounded-xl border flex items-center gap-1 font-bold transition-all cursor-pointer ${
                    activeSurah.number >= 114
                      ? 'border-transparent text-[#C5BCB2] cursor-not-allowed'
                      : 'bg-[#FAF7F2] text-[#403B36] border-[#E8E2D5] hover:bg-[#F3EFE6]'
                  }`}
                >
                  <span>السورة التالية</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveSurah(null)}
                  className="px-4 py-2 rounded-xl bg-[#2D6A4F] text-white font-bold hover:bg-[#1E4535] cursor-pointer"
                >
                  تم
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
