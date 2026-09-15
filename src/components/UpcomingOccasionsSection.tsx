import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
} from 'lucide-react';
import {
  getUpcomingIslamicOccasions,
  formatDaysRemaining,
  formatGregorianDateArabic,
  IslamicOccasion,
} from '../utils/islamicOccasions';

export const UpcomingOccasionsSection: React.FC = () => {
  const [occasions, setOccasions] = useState<IslamicOccasion[]>(() =>
    getUpcomingIslamicOccasions()
  );
  const [showAllOccasions, setShowAllOccasions] = useState(false);

  // Dynamic refresh every minute or whenever day changes without full page reload
  useEffect(() => {
    const updateOccasions = () => {
      setOccasions(getUpcomingIslamicOccasions());
    };

    updateOccasions();
    const interval = setInterval(updateOccasions, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!occasions || occasions.length === 0) return null;

  const nearestOccasion = occasions[0];
  // Show next 3 occasions as secondary cards
  const nextOccasions = occasions.slice(1);
  const displayedSubOccasions = showAllOccasions ? nextOccasions : nextOccasions.slice(0, 3);
  const hasMoreToExpand = nextOccasions.length > 3;

  return (
    <section id="upcoming-occasions-section" className="space-y-4">
      {/* Section Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#FAF0E6] text-[#A25A19] border border-[#E8D4BE] flex items-center justify-center text-lg shadow-xs">
            🌙
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2421] tracking-tight">
              المناسبات القادمة 🌙
            </h2>
            <p className="text-xs text-[#736B63] mt-0.5">
              عدّ تنازلي دقيق ومباشر لأبرز مواسم الخير والبركات
            </p>
          </div>
        </div>

        {/* Dynamic Contextual Message Pill */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#2D6A4F] text-xs font-semibold border border-[#A5D6A7]/70 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F]" />
          <span>{nearestOccasion.shortMessage}</span>
        </div>
      </div>

      {/* Mobile Contextual Message Bar (visible on small screens) */}
      <div className="sm:hidden px-3.5 py-2 rounded-2xl bg-[#E8F5E9] border border-[#A5D6A7]/60 flex items-center gap-2 text-xs font-semibold text-[#2D6A4F]">
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{nearestOccasion.shortMessage}</span>
      </div>

      {/* Featured Nearest Occasion - Large Elegant Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1E4535] via-[#235340] to-[#2D6A4F] text-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#1E4535]/50">
        {/* Subtle Islamic Geometric Watermark Decor */}
        <div className="absolute top-0 left-0 w-48 h-48 opacity-10 pointer-events-none select-none -translate-x-12 -translate-y-12">
          <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-[#F8F6F0]">
            <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" />
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 w-40 h-40 opacity-5 pointer-events-none select-none translate-x-10 translate-y-10">
          <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-white">
            <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="3" fill="none" />
            <polygon points="50,10 65,35 90,50 65,65 50,90 35,65 10,50 35,35" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Main Info */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-semibold border border-white/20">
              <span>أقرب مناسبة قادمة</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#52B788] animate-pulse" />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-3xl sm:text-4xl">{nearestOccasion.icon}</span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Tajawal']">
                {nearestOccasion.name}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-emerald-100/90 pt-0.5">
              <span className="font-bold text-white bg-white/10 px-2.5 py-1 rounded-xl">
                {nearestOccasion.hijriDateText}
              </span>
              <span className="text-emerald-300/70">•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                <span>
                  {nearestOccasion.needsMoonSighting ? 'التاريخ المتوقع: ' : 'الموافق: '}
                  {formatGregorianDateArabic(nearestOccasion.gregorianDate)}
                </span>
              </span>
            </div>

            {nearestOccasion.needsMoonSighting && (
              <p className="text-[11px] text-emerald-200/75 flex items-center gap-1 pt-0.5">
                <Info className="w-3 h-3 text-emerald-300 shrink-0" />
                <span>التاريخ المتوقع يعتمد على ثبوت رؤية الهلال شرعاً</span>
              </p>
            )}

            <p className="text-xs text-emerald-100/95 pt-1 max-w-md font-medium">
              «{nearestOccasion.shortMessage}»
            </p>
          </div>

          {/* Large Elegant Countdown Display */}
          <div className="shrink-0 flex md:flex-col items-center justify-between md:justify-center p-4 sm:p-5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/15 min-w-[170px] text-center">
            <div>
              <span className="text-xs text-emerald-200 font-medium block mb-1">
                العد التنازلي
              </span>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-['Tajawal']">
                  {nearestOccasion.daysRemaining}
                </span>
                <span className="text-sm sm:text-base font-bold text-emerald-200">
                  {nearestOccasion.daysRemaining === 1 ? 'يوم' : 'يوماً'}
                </span>
              </div>
            </div>

            <div className="mt-0 md:mt-2 text-left md:text-center">
              <span className="text-xs font-bold text-emerald-300 bg-white/10 px-3 py-1 rounded-xl inline-block">
                {formatDaysRemaining(nearestOccasion.daysRemaining)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Occasions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
        {displayedSubOccasions.map((occ) => (
          <div
            key={occ.id}
            className="bg-white rounded-3xl p-4.5 sm:p-5 border border-[#E8E2D5] shadow-xs hover:border-[#2D6A4F]/30 hover:shadow-sm transition-all flex flex-col justify-between gap-3 group"
          >
            {/* Top row: Icon + Name + Days */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                  {occ.icon}
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#1F2421]">
                    {occ.name}
                  </h4>
                  <span className="text-xs text-[#857B72] font-medium">
                    {occ.hijriDateText}
                  </span>
                </div>
              </div>

              {/* Days badge */}
              <div className="text-left shrink-0">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-[#2D6A4F] font-bold text-xs">
                  <Clock className="w-3 h-3 text-[#2D6A4F]" />
                  <span>{formatDaysRemaining(occ.daysRemaining)}</span>
                </span>
              </div>
            </div>

            {/* Middle: Brief description / Hadith snippet */}
            <p className="text-xs text-[#736B63] leading-relaxed line-clamp-2">
              {occ.description}
            </p>

            {/* Bottom: Gregorian Date with Expected note */}
            <div className="pt-2.5 border-t border-[#F0ECE1] flex items-center justify-between text-[11px] text-[#857B72]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#A25A19]" />
                <span>
                  {occ.needsMoonSighting ? 'التاريخ المتوقع: ' : 'الموافق: '}
                  {formatGregorianDateArabic(occ.gregorianDate)}
                </span>
              </span>
              {occ.needsMoonSighting && (
                <span className="text-[10px] text-[#A25A19] bg-[#FAF0E6] px-1.5 py-0.5 rounded-md font-medium">
                  رؤية الهلال
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Expand / Collapse Button */}
      {hasMoreToExpand && (
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => setShowAllOccasions(!showAllOccasions)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#FAF7F2] border border-[#E8E2D5] text-xs font-bold text-[#2D6A4F] hover:text-[#1E4535] shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <span>
              {showAllOccasions ? 'إخفاء باقي المناسبات' : 'عرض جميع المناسبات (' + occasions.length + ')'}
            </span>
            {showAllOccasions ? (
              <ChevronUp className="w-4 h-4 text-[#2D6A4F]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#2D6A4F]" />
            )}
          </button>
        </div>
      )}
    </section>
  );
};
