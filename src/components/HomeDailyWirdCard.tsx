import React from 'react';
import { BookOpen, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { UserProgress } from '../types';

interface HomeDailyWirdCardProps {
  progress: UserProgress;
  onOpenQuran: () => void;
}

export const HomeDailyWirdCard: React.FC<HomeDailyWirdCardProps> = ({
  progress,
  onOpenQuran,
}) => {
  const goalPages = progress.quranGoalPages || 4;
  const readPages = progress.quranPagesReadToday || 0;
  const percentage = Math.min(100, Math.round((readPages / goalPages) * 100));
  const isCompleted = readPages >= goalPages && goalPages > 0;

  return (
    <div
      id="home-daily-wird-card"
      onClick={onOpenQuran}
      className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E8E2D5] shadow-xs hover:border-[#2D6A4F]/30 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between gap-3"
      dir="rtl"
    >
      {/* Header & Title */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
            📖
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs text-[#8C827A] font-medium">القرآن الكريم</span>
              {isCompleted && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EBF7EE] text-[#2D6A4F] font-bold border border-[#2D6A4F]/20 flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5" />
                  <span>مكتمل</span>
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold font-['Tajawal'] text-[#1F2421]">
              وردي اليوم
            </h3>
          </div>
        </div>

        {/* Count Pill */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs font-bold text-[#2D6A4F] font-mono group-hover:bg-[#2D6A4F] group-hover:text-white transition-all shadow-2xs">
            {readPages} من {goalPages} صفحات
          </span>
          <div className="w-7 h-7 rounded-full bg-[#FAF7F2] text-[#8C827A] flex items-center justify-center group-hover:text-[#2D6A4F] group-hover:translate-x-[-2px] transition-all">
            <ChevronLeft className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Progress Bar and Indicator */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] text-[#736B63] font-medium">
          <span>نسبة إنجاز الورد</span>
          <span className="font-mono font-bold text-[#2D6A4F]">{percentage}%</span>
        </div>
        <div className="w-full h-2.5 bg-[#F3EFE6] rounded-full overflow-hidden p-0.5 border border-[#E8E2D5]/70">
          <div
            className="h-full bg-linear-to-r from-[#2D6A4F] to-[#40916C] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Subtle Bottom Caption */}
      <div className="flex items-center justify-between text-[11px] text-[#8C827A] pt-0.5">
        <span>{isCompleted ? 'أتممت وردك المبارك اليوم 🤍' : 'اضغط للمتابعة والقراءة في المصحف'}</span>
        <span className="text-[#2D6A4F] font-semibold group-hover:underline flex items-center gap-0.5">
          متابعة الورد
        </span>
      </div>
    </div>
  );
};
