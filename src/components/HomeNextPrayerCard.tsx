import React, { useState, useEffect } from 'react';
import { Clock, Sparkles } from 'lucide-react';
import { getNextPrayerCountdown } from '../data/prayerTimes';

interface HomeNextPrayerCardProps {
  onOpenPrayers: () => void;
}

export const HomeNextPrayerCard: React.FC<HomeNextPrayerCardProps> = ({ onOpenPrayers }) => {
  const [countdown, setCountdown] = useState(() => getNextPrayerCountdown());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getNextPrayerCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRemainingText = () => {
    if (countdown.remainingHours > 0) {
      return `متبقي ${countdown.remainingHours} ساعة و ${countdown.remainingMinutes} دقيقة`;
    }
    if (countdown.remainingMinutes > 0) {
      return `متبقي ${countdown.remainingMinutes} دقيقة`;
    }
    return `حان موعد الصلاة الآن`;
  };

  return (
    <div
      id="home-next-prayer-card"
      onClick={onOpenPrayers}
      className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E8E2D5] shadow-xs hover:border-[#2D6A4F]/30 hover:shadow-sm transition-all cursor-pointer group flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center shrink-0 text-xl group-hover:scale-105 transition-transform">
          🕌
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-[#736B63] font-medium">الصلاة القادمة</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-lg sm:text-xl font-bold font-['Tajawal'] text-[#1F2421]">
              صلاة {countdown.nextPrayerName}
            </h3>
            <span className="text-sm sm:text-base font-semibold text-[#2D6A4F] font-mono">
              {countdown.nextPrayerTime}
            </span>
          </div>
        </div>
      </div>

      <div className="text-left shrink-0">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs font-bold text-[#2D6A4F] group-hover:bg-[#2D6A4F] group-hover:text-white transition-all shadow-2xs">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono text-xs">{countdown.formattedCountdown}</span>
        </div>
        <span className="block text-[11px] text-[#8C827A] mt-1 text-center font-medium">
          {getRemainingText()}
        </span>
      </div>
    </div>
  );
};
