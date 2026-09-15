import React, { useState, useEffect, useMemo } from 'react';
import { Clock, ChevronLeft, Check, Sparkles, Moon } from 'lucide-react';
import { getNextPrayerCountdown, getTodayPrayerTimes } from '../data/prayerTimes';

interface HomePrayersCardProps {
  prayersCompleted: string[];
  onTogglePrayer: (prayerId: string) => void;
  onOpenPrayers: () => void;
}

export const HomePrayersCard: React.FC<HomePrayersCardProps> = ({
  prayersCompleted = [],
  onTogglePrayer,
  onOpenPrayers,
}) => {
  const [countdown, setCountdown] = useState(() => getNextPrayerCountdown());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getNextPrayerCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayTimes = useMemo(() => {
    return getTodayPrayerTimes();
  }, []);

  const getTimeFor = (id: string) => {
    const found = todayTimes.find((p) => p.id === id);
    return found ? found.time : '';
  };

  const mainPrayers = [
    { id: 'fajr', name: 'الفجر', time: getTimeFor('fajr') },
    { id: 'dhuhr', name: 'الظهر', time: getTimeFor('dhuhr') },
    { id: 'asr', name: 'العصر', time: getTimeFor('asr') },
    { id: 'maghrib', name: 'المغرب', time: getTimeFor('maghrib') },
    { id: 'isha', name: 'العشاء', time: getTimeFor('isha') },
  ];

  const nightWorships = [
    { id: 'witr', name: 'صلاة الوتر', hint: 'ركعة أو ثلاث' },
    { id: 'qiyam', name: 'قيام الليل', hint: 'ركعتان في جوف الليل' },
  ];

  return (
    <div
      id="home-prayers-card"
      className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E8E2D5] shadow-xs hover:border-[#2D6A4F]/30 hover:shadow-sm transition-all duration-300"
      dir="rtl"
    >
      {/* 1. Header: 🕌 الصلوات + الصلاة القادمة والعد التنازلي */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center text-xl shrink-0 shadow-2xs">
            🕌
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base sm:text-lg font-bold font-['Tajawal'] text-[#1F2421]">
                الصلوات
              </h3>
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-pulse" />
              <span className="text-[11px] text-[#736B63] font-medium hidden xs:inline">
                القادمة: صلاة {countdown.nextPrayerName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#2D6A4F] font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono">{countdown.formattedCountdown}</span>
              <span className="text-[11px] text-[#8C827A] font-normal">
                (الساعة {countdown.nextPrayerTime})
              </span>
            </div>
          </div>
        </div>

        {/* Link to full prayer times */}
        <button
          onClick={onOpenPrayers}
          className="px-2.5 sm:px-3 py-1.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#2D6A4F] text-[#736B63] hover:text-white border border-[#E8E2D5] text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs group"
          title="عرض جدول مواقيت الصلاة كاملاً والأذان"
        >
          <span>المواقيت</span>
          <ChevronLeft className="w-3.5 h-3.5 group-hover:translate-x-[-2px] transition-transform" />
        </button>
      </div>

      {/* 2. Primary 5 Obligatory Prayers Grid */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1 pb-2.5">
        {mainPrayers.map((prayer) => {
          const isDone = prayersCompleted.includes(prayer.id);
          const isNext = countdown.nextPrayerName === prayer.name;

          return (
            <button
              key={prayer.id}
              onClick={() => onTogglePrayer(prayer.id)}
              className={`flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer select-none text-center relative ${
                isDone
                  ? 'bg-[#EBF7EE] border-[#2D6A4F]/40 text-[#2D6A4F] shadow-2xs'
                  : isNext
                  ? 'bg-[#FAF7F2] border-[#2D6A4F]/30 text-[#1F2421] ring-1 ring-[#2D6A4F]/20'
                  : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#736B63] hover:border-[#2D6A4F]/30 hover:bg-[#F3EFE6]'
              }`}
            >
              {/* Prayer Name */}
              <span className="text-xs sm:text-sm font-bold font-['Tajawal'] mb-1">
                {prayer.name}
              </span>

              {/* Checkbox indicator */}
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-[#2D6A4F] text-white shadow-2xs'
                    : 'border border-[#C4BDB3] bg-white text-transparent hover:border-[#2D6A4F]'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>

              {/* Time */}
              {prayer.time && (
                <span className="text-[10px] sm:text-[11px] font-mono mt-1 text-[#8C827A]">
                  {prayer.time}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Sub-section for Associated Worships: الوتر وقيام الليل */}
      <div className="pt-2.5 border-t border-dashed border-[#E8E2D5] mt-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#736B63] flex items-center gap-1">
            <Moon className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>الوتر وقيام الليل</span>
          </span>
          <span className="text-[11px] text-[#8C827A]">سُنن الليل المباركة</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {nightWorships.map((worship) => {
            const isDone = prayersCompleted.includes(worship.id);

            return (
              <button
                key={worship.id}
                onClick={() => onTogglePrayer(worship.id)}
                className={`flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-2xl border transition-all cursor-pointer select-none text-right ${
                  isDone
                    ? 'bg-[#EBF7EE] border-[#2D6A4F]/40 text-[#2D6A4F] shadow-2xs'
                    : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#736B63] hover:border-[#2D6A4F]/30 hover:bg-[#F3EFE6]'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold font-['Tajawal'] text-[#1F2421]">
                    {worship.name}
                  </span>
                  <span className="text-[10px] text-[#8C827A] font-medium">
                    {worship.hint}
                  </span>
                </div>

                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ms-2 ${
                    isDone
                      ? 'bg-[#2D6A4F] text-white shadow-2xs'
                      : 'border border-[#C4BDB3] bg-white text-transparent hover:border-[#2D6A4F]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
