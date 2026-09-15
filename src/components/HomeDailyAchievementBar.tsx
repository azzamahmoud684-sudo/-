import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { UserProgress } from '../types';
import { getDaily14Worships } from '../utils/dailyWorshipCalculator';

interface HomeDailyAchievementBarProps {
  progress: UserProgress;
}

export const HomeDailyAchievementBar: React.FC<HomeDailyAchievementBarProps> = ({
  progress,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const { completedCount, totalCount, percentage, items } = getDaily14Worships(progress);

  const getMotivationalWord = () => {
    if (completedCount === 0) return 'بداية مباركة ليومك، استعن بالله 🤍';
    if (completedCount <= 4) return 'خطى طيبة ومباركة في طاعة الله ✨';
    if (completedCount <= 8) return 'ما شاء الله، إنجاز رائع وسكينة تملأ القلب 🌿';
    if (completedCount <= 12) return 'همة إيمانية عالية، بارك الله في عملك 🤍';
    return 'طوبى لك! يومك عامر بذكر الله وطاعته 🤲';
  };

  return (
    <div
      id="home-daily-achievement-card"
      className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E8E2D5] shadow-xs hover:border-[#2D6A4F]/30 hover:shadow-sm transition-all duration-300"
      dir="rtl"
    >
      {/* Top Title & Score */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center text-sm font-bold shrink-0 shadow-2xs">
            🌿
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold font-['Tajawal'] text-[#1F2421]">
              إنجاز اليوم
            </h3>
            <p className="text-[11px] text-[#8C827A] font-medium hidden xs:block">
              {getMotivationalWord()}
            </p>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-2xl bg-[#EBF7EE] border border-[#2D6A4F]/20 text-xs sm:text-sm font-bold text-[#2D6A4F] font-mono shadow-2xs">
            {completedCount} من {totalCount} عبادة
          </span>
          <span className="text-xs font-bold text-[#2D6A4F] font-mono px-2 py-1 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5]">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Animated Smooth Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="w-full h-2.5 bg-[#F3EFE6] rounded-full overflow-hidden p-0.5 border border-[#E8E2D5]/70">
          <div
            className="h-full bg-linear-to-r from-[#2D6A4F] to-[#52B788] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Details Toggle Button */}
      <div className="pt-2 flex items-center justify-between text-[11px] text-[#8C827A]">
        <span className="xs:hidden font-medium text-[#736B63]">
          {getMotivationalWord()}
        </span>
        <button
          onClick={() => setShowDetails((prev) => !prev)}
          className="text-[#2D6A4F] hover:text-[#1F2421] font-medium flex items-center gap-1 cursor-pointer transition-colors ms-auto"
        >
          <span>{showDetails ? 'إخفاء تفاصيل العبادات' : 'عرض تفاصيل الـ 14 عبادة'}</span>
          {showDetails ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Collapsible Worship Items Grid */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-[#E8E2D5]/70 grid grid-cols-2 sm:grid-cols-3 gap-2 animate-in fade-in duration-200">
          {items.map((item) => (
            <div
              key={item.id}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] flex items-center justify-between gap-1.5 transition-all ${
                item.completed
                  ? 'bg-[#EBF7EE] border-[#2D6A4F]/20 text-[#2D6A4F] font-bold'
                  : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#8C827A]'
              }`}
            >
              <span className="truncate">{item.name}</span>
              <span className="shrink-0 text-xs">
                {item.completed ? '✓' : '○'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
