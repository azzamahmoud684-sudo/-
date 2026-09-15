import React, { useState } from 'react';
import { Sparkles, RotateCw, Copy, Check, Share2, Compass } from 'lucide-react';
import {
  DailyDhikrItem,
  getDailyDhikrForToday,
  getAnotherRandomDhikr,
} from '../data/dailyDhikrData';

interface HomeDailyDhikrCardProps {
  onOpenTasbeeh?: () => void;
}

export const HomeDailyDhikrCard: React.FC<HomeDailyDhikrCardProps> = ({
  onOpenTasbeeh,
}) => {
  const [dhikr, setDhikr] = useState<DailyDhikrItem>(() => getDailyDhikrForToday());
  const [isRotating, setIsRotating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Switch to another random dhikr
  const handleChangeDhikr = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsRotating(true);
    setTimeout(() => {
      setDhikr((prev) => getAnotherRandomDhikr(prev.id));
      setIsRotating(false);
    }, 200);
  };

  // Copy Dhikr text with reference and virtue
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `«${dhikr.text}»\n\nفضله: ${dhikr.virtue} [${dhikr.reference}] - عبر تطبيق أُنس 🤍`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="home-daily-dhikr-card"
      className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E8E2D5] shadow-xs hover:border-[#2D6A4F]/30 hover:shadow-sm transition-all duration-300 relative overflow-hidden group"
      dir="rtl"
    >
      {/* Top Subtle Motif & Header */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center text-sm font-bold shrink-0 shadow-2xs">
            ✨
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold font-['Tajawal'] text-[#2D6A4F]">
              ذِكْرُ اليَوْم
            </span>
            {dhikr.category && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#736B63] border border-[#E8E2D5] font-medium hidden sm:inline-block">
                {dhikr.category}
              </span>
            )}
          </div>
        </div>

        {/* Change / Randomize & Copy Actions */}
        <div className="flex items-center gap-1.5">
          {/* Quick Copy Button */}
          <button
            onClick={handleCopy}
            className="h-8 px-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFE6] text-[#736B63] hover:text-[#1F2421] border border-[#E8E2D5] text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
            title="نسخ الذكر"
            aria-label="نسخ الذكر"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span className="text-[#2D6A4F] font-bold">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">نسخ</span>
              </>
            )}
          </button>

          {/* Random / Change Button (زر التغيير العشوائي) */}
          <button
            onClick={handleChangeDhikr}
            disabled={isRotating}
            className="h-8 px-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EBF7EE] text-[#736B63] hover:text-[#2D6A4F] border border-[#E8E2D5] hover:border-[#2D6A4F]/40 text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer group/btn"
            title="تغيير الذكر عشوائياً"
            aria-label="تغيير الذكر"
          >
            <RotateCw
              className={`w-3.5 h-3.5 text-[#2D6A4F] transition-transform duration-300 ${
                isRotating ? 'animate-spin' : 'group-hover/btn:rotate-90'
              }`}
            />
            <span className="font-bold text-[#2D6A4F]">ذكرٌ آخَر</span>
          </button>
        </div>
      </div>

      {/* Main Dhikr Text with Tashkeel */}
      <div className="py-1">
        <p className="font-['Amiri',serif] text-base sm:text-lg font-bold text-[#1F2421] leading-relaxed select-text tracking-normal text-right">
          «{dhikr.text}»
        </p>
      </div>

      {/* Virtue and Reference Footer */}
      <div className="mt-2.5 pt-2.5 border-t border-dashed border-[#E8E2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-start sm:items-center gap-1.5 text-[#736B63] leading-normal flex-1">
          <span className="font-bold text-[#2D6A4F] shrink-0 text-[11px] sm:text-xs">
            فضله:
          </span>
          <span className="text-[11px] sm:text-xs text-[#5E564E] line-clamp-2">
            {dhikr.virtue}
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-lg bg-[#FAF7F2] text-[#8C827A] border border-[#E8E2D5] font-mono">
            {dhikr.reference}
          </span>

          {onOpenTasbeeh && (
            <button
              onClick={onOpenTasbeeh}
              className="text-[11px] font-bold text-[#2D6A4F] hover:underline flex items-center gap-1 cursor-pointer"
              title="التسبيح بهذا الذكر في السبحة الإلكترونية"
            >
              <span>تسبيح</span>
              <span className="text-xs">📿</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
