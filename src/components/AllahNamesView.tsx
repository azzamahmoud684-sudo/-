import React, { useState, useMemo, useEffect } from 'react';
import {
  ALLAH_NAMES_DATA,
} from '../data/allahNamesData';
import { AllahNameItem } from '../types/allahNames';
import {
  loadAllahNamesProgress,
  toggleAllahNameCompleted,
  toggleAllahNameFavorite,
  setAllahNameLastViewed,
  saveAllahNameNote,
} from '../utils/allahNamesStorage';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Circle,
  Heart,
  Search,
  BookOpen,
  Sparkles,
  HeartHandshake,
  HelpCircle,
  Share2,
  Copy,
  Check,
  Compass,
  LayoutGrid,
  FileText,
} from 'lucide-react';

interface AllahNamesViewProps {
  onBack: () => void;
}

type FilterTab = 'all' | 'completed' | 'uncompleted' | 'favorites';

export const AllahNamesView: React.FC<AllahNamesViewProps> = ({ onBack }) => {
  const [progress, setProgress] = useState(() => loadAllahNamesProgress());
  const [activeNameId, setActiveNameId] = useState<number>(() => {
    const p = loadAllahNamesProgress();
    return p.lastViewedId && p.lastViewedId >= 1 && p.lastViewedId <= 99 ? p.lastViewedId : 1;
  });
  const [viewMode, setViewMode] = useState<'detail' | 'grid'>('detail');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [userNoteInput, setUserNoteInput] = useState<string>('');
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Sync active name note
  useEffect(() => {
    setUserNoteInput(progress.userNotes[activeNameId] || '');
    setIsEditingNote(false);
    setAllahNameLastViewed(activeNameId);
  }, [activeNameId, progress.userNotes]);

  const activeName = useMemo(() => {
    return ALLAH_NAMES_DATA.find((n) => n.id === activeNameId) || ALLAH_NAMES_DATA[0];
  }, [activeNameId]);

  const isCurrentCompleted = progress.completedIds.includes(activeName.id);
  const isCurrentFavorite = progress.favoriteIds.includes(activeName.id);

  // Filter names for grid view
  const filteredNames = useMemo(() => {
    let list = ALLAH_NAMES_DATA;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.simpleName.toLowerCase().includes(q) ||
          item.meaning.toLowerCase().includes(q) ||
          String(item.id).includes(q)
      );
    }

    // Filter tab
    if (filterTab === 'completed') {
      list = list.filter((item) => progress.completedIds.includes(item.id));
    } else if (filterTab === 'uncompleted') {
      list = list.filter((item) => !progress.completedIds.includes(item.id));
    } else if (filterTab === 'favorites') {
      list = list.filter((item) => progress.favoriteIds.includes(item.id));
    }

    return list;
  }, [searchQuery, filterTab, progress.completedIds, progress.favoriteIds]);

  const handleToggleComplete = (id: number) => {
    const updated = toggleAllahNameCompleted(id);
    setProgress({ ...updated });
  };

  const handleToggleFavorite = (id: number) => {
    const updated = toggleAllahNameFavorite(id);
    setProgress({ ...updated });
  };

  const handleSaveNote = () => {
    const updated = saveAllahNameNote(activeNameId, userNoteInput);
    setProgress({ ...updated });
    setIsEditingNote(false);
  };

  const handleCopyText = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleNext = () => {
    if (activeNameId < 99) {
      setActiveNameId(activeNameId + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (activeNameId > 1) {
      setActiveNameId(activeNameId - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const completedCount = progress.completedIds.length;
  const progressPercent = Math.round((completedCount / 99) * 100);

  return (
    <div className="space-y-5 sm:space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header with back button */}
      <div className="flex items-center justify-between gap-3 bg-white border border-[#E8E2D5] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xs">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#736B63] hover:text-[#1F2421] border border-[#E8E2D5] flex items-center justify-center transition-colors cursor-pointer"
            title="العودة للرئيسية"
            aria-label="العودة للرئيسية"
          >
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h1 className="text-lg sm:text-xl font-bold font-['Tajawal'] text-[#1F2421]">
                أسماء الله الحسنى
              </h1>
            </div>
            <p className="text-xs text-[#736B63] mt-0.5 font-medium">
              رحلة نتعرّف فيها إلى أسماء الله ونتدبر معانيها
            </p>
          </div>
        </div>

        {/* View mode toggle (Detail vs Grid list) */}
        <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E2D5]">
          <button
            onClick={() => setViewMode('detail')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'detail'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#736B63] hover:text-[#1F2421]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>تدبر</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#736B63] hover:text-[#1F2421]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>القائمة (99)</span>
          </button>
        </div>
      </div>

      {/* 2. Progress Tracker Banner (Gentle, encouraging, non-demanding) */}
      <div className="bg-white border border-[#E8E2D5] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20">
                محطات التدبر
              </span>
              <span className="text-xs text-[#736B63]">
                {completedCount} من أصل 99 اسماً تدبّرته
              </span>
            </div>
            <p className="text-xs text-[#736B63] mt-2 leading-relaxed">
              ليس القصد إنهاء الأسماء سريعاً؛ بل عيش كل اسم وتأمل آثاره في قلبك وعملك. خذ وقتك في كل محطة.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <div className="text-left">
              <span className="text-2xl font-bold font-['Tajawal'] text-[#2D6A4F]">
                %{progressPercent}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-[#FAF8F5] border border-[#E8E2D5] rounded-full mt-3.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2D6A4F] to-[#52B788] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3. Detail View Mode (Journey Mode for current Name) */}
      {viewMode === 'detail' && (
        <div className="space-y-4 sm:space-y-5">
          {/* Main Hero Card for the Current Name */}
          <div className="bg-white border border-[#E8E2D5] rounded-3xl p-5 sm:p-7 shadow-xs relative overflow-hidden text-center">
            {/* Background subtle Islamic watermark */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center font-['Amiri',serif] text-[180px] select-none text-[#2D6A4F]">
              ﷽
            </div>

            {/* Top metadata & quick actions */}
            <div className="flex items-center justify-between relative z-10">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#FAF8F5] text-[#736B63] border border-[#E8E2D5]">
                <Compass className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>الاسم رقم {activeName.id} من 99</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleToggleFavorite(activeName.id)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                    isCurrentFavorite
                      ? 'bg-rose-50 border-rose-200 text-rose-500'
                      : 'bg-[#FAF8F5] border-[#E8E2D5] text-[#8C827A] hover:text-rose-500'
                  }`}
                  title={isCurrentFavorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                >
                  <Heart className={`w-4 h-4 ${isCurrentFavorite ? 'fill-rose-500' : ''}`} />
                </button>
              </div>
            </div>

            {/* The Big Beautiful Name */}
            <div className="py-5 sm:py-6 relative z-10">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-['Amiri',serif] text-[#1F2421] tracking-wide leading-relaxed">
                {activeName.name}
              </h2>
              <div className="w-16 h-1 bg-[#2D6A4F]/30 mx-auto mt-3 rounded-full" />
            </div>

            {/* Quick Completion Button */}
            <div className="relative z-10 pt-1 pb-2">
              <button
                onClick={() => handleToggleComplete(activeName.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isCurrentCompleted
                    ? 'bg-[#2D6A4F] text-white shadow-xs hover:bg-[#1E4535]'
                    : 'bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#736B63] border border-[#E8E2D5]'
                }`}
              >
                {isCurrentCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>أتممت تدبر هذا الاسم ✓</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 text-[#8C827A]" />
                    <span>اضغط هنا عند إتمام تدبر هذا الاسم</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 1. معنى الاسم (معلومة شرعية موثقة) */}
          <div className="bg-white border border-[#E8E2D5] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold font-['Tajawal'] text-[#1F2421]">
                  معنى الاسم
                </h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#736B63] border border-[#E8E2D5]">
                بيان لغوي وشرعي
              </span>
            </div>
            <p className="text-sm sm:text-base text-[#3C3834] leading-relaxed font-normal pt-1">
              {activeName.meaning}
            </p>
          </div>

          {/* 2. تدبر في الاسم (صياغة تأملية وجدانية) */}
          <div className="bg-gradient-to-br from-[#FDFBF7] to-[#FAF6EE] border border-[#E8E2D5] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold font-['Tajawal'] text-[#1F2421]">
                  تدبر في أثر الاسم
                </h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/80 text-amber-800 border border-amber-200/50 font-medium">
                تأمل في الحياة
              </span>
            </div>
            <p className="text-sm sm:text-base text-[#403B35] leading-relaxed font-normal pt-1 italic font-['Tajawal']">
              «{activeName.reflection}»
            </p>
          </div>

          {/* 3. كيف أعيش بهذا الاسم؟ (خطوات عملية) */}
          <div className="bg-white border border-[#E8E2D5] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold font-['Tajawal'] text-[#1F2421]">
                  كيف أعيش بهذا الاسم في يومي؟
                </h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#736B63] border border-[#E8E2D5]">
                تطبيق عملي
              </span>
            </div>
            <p className="text-sm sm:text-base text-[#3C3834] leading-relaxed font-normal pt-1">
              {activeName.livingWithTheName}
            </p>
          </div>

          {/* 4. دعاء مناسب بالاسم (دعاء مأثور وموثوق) */}
          <div className="bg-white border border-[#E8E2D5] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
                  <span className="text-sm">🤲</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold font-['Tajawal'] text-[#1F2421]">
                  دعاء مناسب بالاسم
                </h3>
              </div>
              <button
                onClick={() => handleCopyText(activeName.dua, 'dua')}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#736B63] border border-[#E8E2D5] flex items-center gap-1 transition-colors cursor-pointer"
                title="نسخ الدعاء"
              >
                {copiedSection === 'dua' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>نسخ</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5]/70 text-[#1F2421] text-sm sm:text-base font-medium leading-relaxed font-['Amiri',serif]">
              {activeName.dua}
            </div>
          </div>

          {/* 5. سؤال للتدبر (تأمل ذاتي وتفكير عميق) */}
          <div className="bg-white border border-[#E8E2D5] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold font-['Tajawal'] text-[#1F2421]">
                سؤال للتدبر
              </h3>
            </div>
            <p className="text-sm sm:text-base text-[#1F2421] font-semibold leading-relaxed bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100">
              {activeName.reflectionQuestion}
            </p>

            {/* Optional Personal Note / Reflection */}
            <div className="pt-2">
              {!isEditingNote && !progress.userNotes[activeName.id] && (
                <button
                  onClick={() => setIsEditingNote(true)}
                  className="text-xs text-[#2D6A4F] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>اكتب خاطرتك أو جوابك الشخصي على هذا السؤال (اختياري)</span>
                </button>
              )}

              {(isEditingNote || progress.userNotes[activeName.id]) && (
                <div className="space-y-2 mt-2">
                  <label className="text-xs text-[#736B63] block font-medium">
                    خاطرتي حول اسم الله {activeName.name}:
                  </label>
                  <textarea
                    value={userNoteInput}
                    onChange={(e) => setUserNoteInput(e.target.value)}
                    placeholder="اكتب تأملك أو ما فتح الله به عليك في هذا الاسم..."
                    rows={3}
                    className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-[#E8E2D5] focus:border-[#2D6A4F] focus:outline-none bg-[#FAF8F5] leading-relaxed resize-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    {isEditingNote && (
                      <button
                        onClick={() => {
                          setUserNoteInput(progress.userNotes[activeName.id] || '');
                          setIsEditingNote(false);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs text-[#736B63] hover:bg-[#FAF8F5] cursor-pointer"
                      >
                        إلغاء
                      </button>
                    )}
                    <button
                      onClick={handleSaveNote}
                      className="px-3 py-1.5 rounded-xl text-xs bg-[#2D6A4F] text-white font-medium hover:bg-[#1E4535] cursor-pointer"
                    >
                      حفظ الخاطرة
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 6. المصدر والمراجع (توثيق علمي إسلامي دقيق) */}
          <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-xs text-[#736B63] space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#1F2421]">
              <span className="text-sm">📚</span>
              <span>المصدر والمراجع:</span>
            </div>
            <p className="leading-relaxed">
              <strong className="text-[#3C3834]">المرجع العلمي:</strong> {activeName.source.bookRef}
            </p>
            {activeName.source.ayahOrHadith && (
              <p className="leading-relaxed font-['Amiri',serif] text-xs sm:text-sm text-[#2D6A4F]">
                <strong>الشاهد:</strong> {activeName.source.ayahOrHadith}
              </p>
            )}
            <p className="text-[11px] text-[#8C827A] pt-1">
              * تم التمييز في هذه البطاقة بين المعنى الشرعي المستند للمصدر وبين التدبر التأملي المستوحى من المعنى.
            </p>
          </div>

          {/* 7. Bottom Navigation Bar (Previous / Next Name) */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={handlePrev}
              disabled={activeNameId <= 1}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeNameId <= 1
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-[#FAF8F5] text-[#1F2421] border-[#E8E2D5] shadow-xs active:scale-[0.99]'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
              <span>الاسم السابق</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className="py-3 px-4 rounded-2xl border border-[#E8E2D5] bg-white hover:bg-[#FAF8F5] text-[#736B63] text-xs sm:text-sm font-medium shadow-xs"
              title="عرض جميع الأسماء"
            >
              {activeNameId} / 99
            </button>

            <button
              onClick={handleNext}
              disabled={activeNameId >= 99}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeNameId >= 99
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#2D6A4F] hover:bg-[#1E4535] text-white border-[#2D6A4F] shadow-xs active:scale-[0.99]'
              }`}
            >
              <span>الاسم التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Full 99 Names Grid / Browser Mode */}
      {viewMode === 'grid' && (
        <div className="space-y-4 sm:space-y-5">
          {/* Search bar & filter pills */}
          <div className="bg-white border border-[#E8E2D5] rounded-2xl sm:rounded-3xl p-4 shadow-2xs space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن اسم من أسماء الله الحسنى (مثلاً: الودود، الرحمن، الغفور)..."
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[#E8E2D5] bg-[#FAF8F5] focus:bg-white focus:border-[#2D6A4F] focus:outline-none text-xs sm:text-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8C827A] hover:text-[#1F2421]"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-[#2D6A4F] text-white'
                    : 'bg-[#FAF8F5] text-[#736B63] hover:bg-[#F2EFE9] border border-[#E8E2D5]'
                }`}
              >
                الكل (99)
              </button>
              <button
                onClick={() => setFilterTab('completed')}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  filterTab === 'completed'
                    ? 'bg-[#2D6A4F] text-white'
                    : 'bg-[#FAF8F5] text-[#736B63] hover:bg-[#F2EFE9] border border-[#E8E2D5]'
                }`}
              >
                تم تدبرها ({progress.completedIds.length})
              </button>
              <button
                onClick={() => setFilterTab('uncompleted')}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  filterTab === 'uncompleted'
                    ? 'bg-[#2D6A4F] text-white'
                    : 'bg-[#FAF8F5] text-[#736B63] hover:bg-[#F2EFE9] border border-[#E8E2D5]'
                }`}
              >
                بانتظار التدبر ({99 - progress.completedIds.length})
              </button>
              <button
                onClick={() => setFilterTab('favorites')}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  filterTab === 'favorites'
                    ? 'bg-[#2D6A4F] text-white'
                    : 'bg-[#FAF8F5] text-[#736B63] hover:bg-[#F2EFE9] border border-[#E8E2D5]'
                }`}
              >
                المفضلة ({progress.favoriteIds.length})
              </button>
            </div>
          </div>

          {/* Grid of Names */}
          {filteredNames.length === 0 ? (
            <div className="bg-white border border-[#E8E2D5] rounded-3xl p-8 text-center text-[#736B63] space-y-2">
              <span className="text-3xl">🔍</span>
              <p className="text-sm font-medium">لم يتم العثور على أي اسم يطابق بحثك</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterTab('all');
                }}
                className="text-xs text-[#2D6A4F] font-bold underline"
              >
                إظهار جميع الأسماء (99)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5">
              {filteredNames.map((item) => {
                const isCompleted = progress.completedIds.includes(item.id);
                const isFav = progress.favoriteIds.includes(item.id);
                const isActive = item.id === activeNameId;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveNameId(item.id);
                      setViewMode('detail');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`bg-white border rounded-2xl p-3 sm:p-4 text-center cursor-pointer transition-all hover:border-[#2D6A4F]/60 hover:shadow-xs active:scale-[0.98] relative flex flex-col justify-between min-h-[110px] ${
                      isActive
                        ? 'border-[#2D6A4F] ring-2 ring-[#2D6A4F]/20'
                        : isCompleted
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-[#E8E2D5]'
                    }`}
                  >
                    {/* Top row: Order Number & Completed Check */}
                    <div className="flex items-center justify-between text-[11px] text-[#8C827A] mb-1">
                      <span className="font-medium font-sans">#{item.id}</span>
                      <div className="flex items-center gap-1">
                        {isFav && <span className="text-rose-500 text-[10px]">♥</span>}
                        {isCompleted && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="my-auto py-1">
                      <h4 className="text-base sm:text-lg font-bold font-['Amiri',serif] text-[#1F2421]">
                        {item.name}
                      </h4>
                    </div>

                    {/* Short hint */}
                    <p className="text-[10px] text-[#8C827A] truncate font-normal mt-1">
                      {item.meaning}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
