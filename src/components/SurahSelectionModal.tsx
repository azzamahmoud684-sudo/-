import React, { useState, useMemo } from 'react';
import { X, Search, BookOpen, Layers } from 'lucide-react';
import { ALL_SURAHS, SurahMeta } from '../data/quranData';
import { toArabicNumeral } from '../utils/quranReader';

interface SurahSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSurah: (surah: SurahMeta) => void;
  currentSurahNumber?: number;
  isNightMode?: boolean;
}

export const SurahSelectionModal: React.FC<SurahSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectSurah,
  currentSurahNumber = 1,
  isNightMode = false,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'makki' | 'madani' | 'popular'>('all');

  const filteredSurahs = useMemo(() => {
    return ALL_SURAHS.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.name.includes(q) ||
        s.nameWithTashkeel.includes(q) ||
        s.englishName.toLowerCase().includes(q) ||
        s.number.toString() === q;

      if (!matchesSearch) return false;

      if (filter === 'makki') return s.revelationType === 'مكية';
      if (filter === 'madani') return s.revelationType === 'مدنية';
      if (filter === 'popular') return s.popularDaily === true;
      return true;
    });
  }, [search, filter]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className={`w-full max-w-xl max-h-[88vh] sm:max-h-[82vh] rounded-t-3xl sm:rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
          isNightMode
            ? 'bg-[#1E2321] border-[#2F3834] text-[#EAE6DC]'
            : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#1F2421]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
            isNightMode ? 'bg-[#181B1A] border-[#2F3834]' : 'bg-white border-[#E8E2D5]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                isNightMode
                  ? 'bg-[#2D6A4F]/25 text-[#52B788]'
                  : 'bg-[#2D6A4F]/10 text-[#2D6A4F]'
              }`}
            >
              📖
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-['Tajawal']">
                فهرس سور القرآن الكريم
              </h3>
              <p className={`text-xs ${isNightMode ? 'text-[#9FA9A3]' : 'text-[#736B63]'}`}>
                اختر أي سورة للانتقال المباشر لصفحة بدايتها (١١٤ سورة)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isNightMode
                ? 'hover:bg-[#2A312E] text-[#9FA9A3]'
                : 'hover:bg-[#F3EFE6] text-[#8C827A]'
            }`}
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Filter Tabs */}
        <div
          className={`p-3 sm:p-4 border-b space-y-2.5 shrink-0 ${
            isNightMode ? 'bg-[#1C201E] border-[#2F3834]' : 'bg-[#FAF7F2] border-[#E8E2D5]'
          }`}
        >
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم السورة (البقرة، الكهف، يس، الملك...) أو برقمها..."
              className={`w-full pr-10 pl-4 py-2.5 rounded-2xl text-xs sm:text-sm transition-all focus:outline-none ${
                isNightMode
                  ? 'bg-[#252B28] border border-[#37413D] text-[#EAE6DC] placeholder-[#7E8A84] focus:border-[#52B788]'
                  : 'bg-white border border-[#E8E2D5] text-[#1F2421] placeholder-[#948B81] focus:border-[#2D6A4F]'
              }`}
              autoFocus
            />
            <Search
              className={`w-4 h-4 absolute right-3.5 top-3 ${
                isNightMode ? 'text-[#7E8A84]' : 'text-[#948B81]'
              }`}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-2.5 text-xs text-[#8C827A] hover:text-[#1F2421]"
              >
                مسح
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {[
              { id: 'all', label: 'الكل (١١٤)' },
              { id: 'popular', label: 'سور مميزة' },
              { id: 'makki', label: 'مكية (٨٦)' },
              { id: 'madani', label: 'مدنية (٢٨)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer text-xs ${
                  filter === tab.id
                    ? isNightMode
                      ? 'bg-[#2D6A4F] text-white shadow-xs'
                      : 'bg-[#2D6A4F] text-white shadow-xs'
                    : isNightMode
                    ? 'bg-[#252B28] text-[#9FA9A3] hover:bg-[#2E3632]'
                    : 'bg-white text-[#736B63] hover:bg-[#F3EFE6] border border-[#E8E2D5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Surahs List */}
        <div className="overflow-y-auto p-3 sm:p-4 space-y-2 flex-1">
          {filteredSurahs.length === 0 ? (
            <div className="py-12 text-center">
              <p className={`text-sm ${isNightMode ? 'text-[#9FA9A3]' : 'text-[#736B63]'}`}>
                لا توجد سورة مطابقة لـ "{search}"
              </p>
            </div>
          ) : (
            filteredSurahs.map((surah) => {
              const isCurrent = surah.number === currentSurahNumber;
              return (
                <div
                  key={surah.number}
                  onClick={() => onSelectSurah(surah)}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] ${
                    isCurrent
                      ? isNightMode
                        ? 'bg-[#24332C] border-[#52B788] text-white'
                        : 'bg-[#EBF7EE] border-[#2D6A4F] text-[#1E4535]'
                      : isNightMode
                      ? 'bg-[#242A27] border-[#2F3834] hover:border-[#52B788]/50 text-[#EAE6DC]'
                      : 'bg-white border-[#E8E2D5] hover:border-[#2D6A4F]/40 text-[#1F2421]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Surah Number Badge */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm font-mono shrink-0 ${
                        isCurrent
                          ? isNightMode
                            ? 'bg-[#52B788] text-[#121614]'
                            : 'bg-[#2D6A4F] text-white'
                          : isNightMode
                          ? 'bg-[#1A1E1C] text-[#9FA9A3] border border-[#2F3834]'
                          : 'bg-[#FAF7F2] text-[#2D6A4F] border border-[#E8E2D5]'
                      }`}
                    >
                      {toArabicNumeral(surah.number)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-['Amiri',serif] font-bold text-base sm:text-lg">
                          سورة {surah.nameWithTashkeel || surah.name}
                        </h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-sans ${
                            surah.revelationType === 'مكية'
                              ? isNightMode
                                ? 'bg-[#2A312E] text-[#D4A373]'
                                : 'bg-[#FAF0E6] text-[#A25A19]'
                              : isNightMode
                              ? 'bg-[#233129] text-[#52B788]'
                              : 'bg-[#E8F5E9] text-[#2D6A4F]'
                          }`}
                        >
                          {surah.revelationType}
                        </span>
                      </div>
                      <p
                        className={`text-xs mt-0.5 ${
                          isNightMode ? 'text-[#9FA9A3]' : 'text-[#736B63]'
                        }`}
                      >
                        {toArabicNumeral(surah.numberOfAyahs)} آية · الجزء {toArabicNumeral(surah.juz)}
                      </p>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold font-mono ${
                        isCurrent
                          ? isNightMode
                            ? 'bg-[#52B788]/20 text-[#52B788]'
                            : 'bg-[#2D6A4F]/15 text-[#2D6A4F]'
                          : isNightMode
                          ? 'bg-[#1A1E1C] text-[#9FA9A3]'
                          : 'bg-[#FAF7F2] text-[#736B63] border border-[#E8E2D5]'
                      }`}
                    >
                      صفحة {toArabicNumeral(surah.startPage)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-3 border-t text-center shrink-0 ${
            isNightMode ? 'bg-[#181B1A] border-[#2F3834]' : 'bg-white border-[#E8E2D5]'
          }`}
        >
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#2D6A4F] text-white text-xs sm:text-sm font-bold hover:bg-[#1E4535] transition-colors cursor-pointer shadow-xs"
          >
            إغلاق الفهرس
          </button>
        </div>
      </div>
    </div>
  );
};
