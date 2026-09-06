import React, { useState } from 'react';
import { X, CheckCircle2, ChevronRight, ChevronLeft, RotateCcw, Volume2, Sparkles, BookOpen, Check } from 'lucide-react';
import { DhikrCategory, DhikrItem } from '../types';
import { ADHKAR_CATEGORIES } from '../data/adhkarData';

interface AdhkarViewerModalProps {
  initialCategoryId?: string; // 'morning' | 'evening' | 'sleep' | 'after_prayer'
  onClose: () => void;
  onUpdateAdhkarProgress: (categoryId: string, finishedItemsCount: number, isEntireCategoryCompleted: boolean) => void;
}

export const AdhkarViewerModal: React.FC<AdhkarViewerModalProps> = ({
  initialCategoryId = 'morning',
  onClose,
  onUpdateAdhkarProgress,
}) => {
  const [selectedCatId, setSelectedCatId] = useState(initialCategoryId);
  const [currentIndex, setCurrentIndex] = useState(0);

  const category = ADHKAR_CATEGORIES.find((c) => c.id === selectedCatId) || ADHKAR_CATEGORIES[0];
  const items = category.items;

  // Track remaining counts for each item
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const initialCounts: Record<string, number> = {};
    items.forEach((item) => {
      initialCounts[item.id] = item.count;
    });
    return initialCounts;
  });

  const currentItem: DhikrItem = items[currentIndex] || items[0];
  const remainingCount = counts[currentItem.id] !== undefined ? counts[currentItem.id] : currentItem.count;
  const isItemFinished = remainingCount === 0;

  // Calculate how many items are finished
  const finishedCount = items.filter((it) => (counts[it.id] !== undefined ? counts[it.id] === 0 : false)).length;

  // Switch category
  const handleSelectCategory = (catId: string) => {
    setSelectedCatId(catId);
    setCurrentIndex(0);
    const newCat = ADHKAR_CATEGORIES.find((c) => c.id === catId);
    if (newCat) {
      const resetCounts: Record<string, number> = {};
      newCat.items.forEach((item) => {
        resetCounts[item.id] = item.count;
      });
      setCounts(resetCounts);
    }
  };

  const handleDecrement = () => {
    if (remainingCount <= 0) return;

    // Haptic feedback if supported
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch {}
    }

    const nextCount = remainingCount - 1;
    const newCounts = {
      ...counts,
      [currentItem.id]: nextCount,
    };
    setCounts(newCounts);

    // Calculate updated finished count
    const updatedFinishedCount = items.filter((it) => (newCounts[it.id] !== undefined ? newCounts[it.id] === 0 : false)).length;
    const isAllDone = updatedFinishedCount >= items.length;

    onUpdateAdhkarProgress(category.id, updatedFinishedCount, isAllDone);
  };

  const handleManualCompleteAll = () => {
    // If user read from their own book/memory and explicitly wants to mark all done
    const allZero: Record<string, number> = {};
    items.forEach((it) => {
      allZero[it.id] = 0;
    });
    setCounts(allZero);
    onUpdateAdhkarProgress(category.id, items.length, true);
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleResetCurrent = () => {
    const updated = {
      ...counts,
      [currentItem.id]: currentItem.count,
    };
    setCounts(updated);
    const updatedFinished = items.filter((it) => updated[it.id] === 0).length;
    onUpdateAdhkarProgress(category.id, updatedFinished, false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-[#FBF9F5] rounded-3xl border border-[#E8E2D5] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E2D5] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {ADHKAR_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  cat.id === selectedCatId
                    ? 'bg-[#2D6A4F] text-white shadow-xs'
                    : 'bg-[#F3EFE6] text-[#736B63] hover:bg-[#E8E2D5]'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F3EFE6] text-[#736B63] transition-colors cursor-pointer shrink-0 ml-2"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real Progress Indicator Bar: Shows actual finished e.g. "3 / 10" */}
        <div className="px-5 py-2.5 bg-[#FAF7F2] border-b border-[#E8E2D5] flex items-center justify-between text-xs text-[#736B63]">
          <div className="flex items-center gap-2">
            <span>الذكر الحالي: <strong>{currentIndex + 1}</strong> من {items.length}</span>
            <span>•</span>
            <span className="font-bold text-[#2D6A4F]">الأذكار المكتملة: {finishedCount} / {items.length}</span>
          </div>

          <div className="w-28 sm:w-36 h-2 bg-[#E8E2D5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2D6A4F] rounded-full transition-all duration-300"
              style={{ width: `${(finishedCount / items.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Dhikr Card Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 flex flex-col justify-between">
          <div>
            {/* Dhikr Arabic Text */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E8E2D5] shadow-xs mb-4">
              <p
                className="text-xl sm:text-2xl font-['Amiri'] text-[#1F2421] text-center leading-[2.2] tracking-wide select-text"
                dir="rtl"
              >
                {currentItem.text}
              </p>
            </div>

            {/* Virtue & Reference */}
            {currentItem.virtue && (
              <div className="bg-[#F3EFE6]/70 rounded-2xl p-4 border border-[#E8E2D5] text-xs space-y-1 mb-4">
                <div className="flex items-center gap-1.5 text-[#2D6A4F] font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>الفضل والمأثور:</span>
                </div>
                <p className="text-[#554E46] leading-relaxed pr-5">{currentItem.virtue}</p>
                {currentItem.reference && (
                  <p className="text-[#8C827A] pr-5 font-medium">({currentItem.reference})</p>
                )}
              </div>
            )}
          </div>

          {/* Big Tap Counter Area */}
          <div className="pt-2 flex flex-col items-center">
            <button
              id="dhikr-tap-btn"
              onClick={handleDecrement}
              disabled={isItemFinished}
              className={`w-36 h-36 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer select-none active:scale-95 shadow-md ${
                isItemFinished
                  ? 'bg-[#E8F5E9] border-4 border-[#74C69D] text-[#2D6A4F]'
                  : 'bg-gradient-to-br from-[#2D6A4F] to-[#1E4535] text-white hover:shadow-lg'
              }`}
            >
              {isItemFinished ? (
                <>
                  <CheckCircle2 className="w-12 h-12 text-[#2D6A4F] mb-1" />
                  <span className="text-sm font-bold">تم بحمد الله ✓</span>
                </>
              ) : (
                <>
                  <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight">
                    {remainingCount}
                  </span>
                  <span className="text-xs text-white/80 mt-1">اضغط للتسبيح</span>
                </>
              )}
            </button>
            <span className="text-xs text-[#8C827A] mt-2">
              التكرار المطلوب: {currentItem.count} {currentItem.count > 1 ? 'مرات' : 'مرة'}
            </span>
          </div>
        </div>

        {/* Modal Bottom Controls */}
        <div className="p-4 bg-white border-t border-[#E8E2D5] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[#E8E2D5] text-xs font-semibold text-[#403B36] hover:bg-[#F3EFE6] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <button
              onClick={handleResetCurrent}
              className="flex items-center gap-1 text-xs text-[#8C827A] hover:text-[#403B36] p-2 rounded-lg cursor-pointer"
              title="إعادة ضبط هذا الذكر"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {finishedCount < items.length && (
              <button
                onClick={handleManualCompleteAll}
                className="px-3 py-2 rounded-xl bg-[#F8F6F0] hover:bg-[#F0ECE1] border border-[#E8E2D5] text-xs font-semibold text-[#554E46] cursor-pointer"
                title="تسجيل إتمام جميع أذكار هذه الفئة إذا قرأتها غيباً أو من كتابك"
              >
                قرأتها كاملة ✓
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={currentIndex === items.length - 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold hover:bg-[#1E4535] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              <span>التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
