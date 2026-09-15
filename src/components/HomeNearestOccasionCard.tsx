import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, Sparkles } from 'lucide-react';
import { getUpcomingIslamicOccasions, formatDaysRemaining, IslamicOccasion } from '../utils/islamicOccasions';

interface HomeNearestOccasionCardProps {
  onOpenOccasions: () => void;
}

export const HomeNearestOccasionCard: React.FC<HomeNearestOccasionCardProps> = ({
  onOpenOccasions,
}) => {
  const [occasion, setOccasion] = useState<IslamicOccasion | null>(() => {
    const list = getUpcomingIslamicOccasions();
    return list.length > 0 ? list[0] : null;
  });

  useEffect(() => {
    const update = () => {
      const list = getUpcomingIslamicOccasions();
      if (list.length > 0) setOccasion(list[0]);
    };
    const timer = setInterval(update, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  if (!occasion) return null;

  return (
    <div
      id="home-nearest-occasion-card"
      onClick={onOpenOccasions}
      className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E8E2D5] shadow-xs hover:border-[#2D6A4F]/30 hover:shadow-sm transition-all cursor-pointer group flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FAF0E6] text-[#A25A19] border border-[#E8D4BE] flex items-center justify-center shrink-0 text-xl group-hover:scale-105 transition-transform shadow-2xs">
          {occasion.icon}
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs text-[#8C827A] font-medium">أقرب مناسبة إسلامية</span>
            <span className="text-[11px] text-[#A25A19] font-medium">· {occasion.hijriDateText}</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold font-['Tajawal'] text-[#1F2421]">
            {occasion.name}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <span className="px-3 py-1.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs font-bold text-[#2D6A4F] group-hover:bg-[#2D6A4F] group-hover:text-white transition-all shadow-2xs">
          {formatDaysRemaining(occasion.daysRemaining)}
        </span>
        <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#8C827A] flex items-center justify-center group-hover:text-[#2D6A4F] group-hover:translate-x-[-2px] transition-all">
          <ChevronLeft className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
