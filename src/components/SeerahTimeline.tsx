import React, { useState } from 'react';
import { SeerahEvent, SeerahUserProgress } from '../types/seerah';
import { SEERAH_EVENTS } from '../data/seerahData';
import {
  Sparkles,
  CheckCircle2,
  Compass,
  ArrowLeft,
  ChevronLeft,
  BookOpen,
  Filter,
  Flame,
  Award,
} from 'lucide-react';

interface SeerahTimelineProps {
  progress: SeerahUserProgress;
  onSelectEvent: (event: SeerahEvent) => void;
}

export const SeerahTimeline: React.FC<SeerahTimelineProps> = ({
  progress,
  onSelectEvent,
}) => {
  const [filter, setFilter] = useState<'all' | 'meccan' | 'medinan' | 'completed'>('all');

  const totalEvents = SEERAH_EVENTS.length;
  const completedCount = progress.completedEventIds.length;
  const progressPercent = Math.round((completedCount / totalEvents) * 100);

  // Find next uncompleted event to suggest to user
  const nextUncompletedEvent = SEERAH_EVENTS.find(
    (ev) => !progress.completedEventIds.includes(ev.id)
  ) || SEERAH_EVENTS[0];

  const filteredEvents = SEERAH_EVENTS.filter((ev) => {
    if (filter === 'meccan') return ev.era === 'meccan';
    if (filter === 'medinan') return ev.era === 'medinan';
    if (filter === 'completed') return progress.completedEventIds.includes(ev.id);
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header: 🌿 في رحاب السيرة */}
      <div className="text-center py-2 sm:py-3 space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] text-2xl shadow-xs mb-1">
          🌿
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-['Tajawal'] text-[#1F2421] tracking-tight">
          في رحاب السيرة
        </h1>
        <p className="text-sm sm:text-base text-[#736B63] max-w-xl mx-auto font-medium">
          رحلة تفاعلية نتعرّف فيها على سيرة النبي ﷺ، خطوة بخطوة.
        </p>
      </div>

      {/* 2. Overview Card: رحلتك في السيرة */}
      <div className="bg-white border border-[#E8E2D5] rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#1F2421]">رحلتك في السيرة</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#1E4535] font-bold">
                {completedCount} من {totalEvents} حدثًا
              </span>
            </div>
            <p className="text-xs text-[#736B63]">
              {completedCount === 0
                ? 'ابدأ أولى محطات السيرة العطرة واكتشف حياة خير البشر ﷺ.'
                : completedCount === totalEvents
                ? 'ما شاء الله! أتممت جميع محطات السيرة النبوية المباركة 🤍'
                : `قطعت ${progressPercent}% من الرحلة؛ استمر في تعلّم سيرة الحبيب ﷺ.`}
            </p>
          </div>

          {/* Quick Resume Button */}
          {nextUncompletedEvent && completedCount < totalEvents && (
            <button
              id="btn-seerah-resume"
              onClick={() => onSelectEvent(nextUncompletedEvent)}
              className="px-5 py-2.5 rounded-2xl bg-[#1E4535] hover:bg-[#2D6A4F] text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>المحطة التالية: {nextUncompletedEvent.title}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-3 border-t border-[#F0EBE1] space-y-1.5">
          <div className="flex justify-between text-[11px] text-[#8C827A] font-semibold">
            <span>نسبة الإنجاز المكتمل</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#FAF7F2] border border-[#E8E2D5] rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#2D6A4F] to-[#1E4535] rounded-full transition-all duration-500"
              style={{ width: `${Math.max(progressPercent, 2)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          id="filter-seerah-all"
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            filter === 'all'
              ? 'bg-[#1E4535] text-white shadow-xs'
              : 'bg-white border border-[#E8E2D5] text-[#736B63] hover:text-[#1F2421]'
          }`}
        >
          الكل (18)
        </button>
        <button
          id="filter-seerah-meccan"
          onClick={() => setFilter('meccan')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            filter === 'meccan'
              ? 'bg-[#1E4535] text-white shadow-xs'
              : 'bg-white border border-[#E8E2D5] text-[#736B63] hover:text-[#1F2421]'
          }`}
        >
          العهد المكي (1 - 9)
        </button>
        <button
          id="filter-seerah-medinan"
          onClick={() => setFilter('medinan')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            filter === 'medinan'
              ? 'bg-[#1E4535] text-white shadow-xs'
              : 'bg-white border border-[#E8E2D5] text-[#736B63] hover:text-[#1F2421]'
          }`}
        >
          العهد المدني (10 - 18)
        </button>
        <button
          id="filter-seerah-completed"
          onClick={() => setFilter('completed')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            filter === 'completed'
              ? 'bg-[#1E4535] text-white shadow-xs'
              : 'bg-white border border-[#E8E2D5] text-[#736B63] hover:text-[#1F2421]'
          }`}
        >
          المنجزة ({completedCount})
        </button>
      </div>

      {/* 4. Timeline List */}
      <div className="relative pt-2 pb-6">
        {/* Continuous vertical timeline connector bar */}
        <div className="absolute top-6 bottom-6 right-6 sm:right-8 w-0.5 bg-[#E8E2D5]" />

        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const isCompleted = progress.completedEventIds.includes(event.id);
            const userReflection = progress.userReflections[event.id];

            return (
              <div
                key={event.id}
                id={`seerah-event-card-${event.id}`}
                onClick={() => onSelectEvent(event)}
                className={`relative pr-14 sm:pr-18 pl-4 sm:pl-5 py-4 sm:py-5 rounded-3xl border transition-all cursor-pointer group active:scale-[0.99] ${
                  isCompleted
                    ? 'bg-white border-emerald-200/80 hover:border-emerald-300 shadow-xs'
                    : 'bg-white border-[#E8E2D5] hover:border-[#2D6A4F]/40 shadow-xs hover:shadow-sm'
                }`}
              >
                {/* Milestone Node on the Timeline Line */}
                <div
                  className={`absolute right-3.5 sm:right-5 top-5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                      : 'bg-white border-2 border-[#1E4535] text-[#1E4535] group-hover:bg-[#1E4535] group-hover:text-white'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : event.number}
                </div>

                {/* Event Card Content */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    {/* Era & Timeframe Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xl">{event.icon}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#736B63] border border-[#E8E2D5] font-semibold">
                        {event.eraLabel}
                      </span>
                      <span className="text-[11px] text-[#8C827A] font-medium">
                        {event.timeframe}
                      </span>
                      {isCompleted && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          ✓ أتممته
                        </span>
                      )}
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold font-['Tajawal'] text-[#1F2421] group-hover:text-[#2D6A4F] transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#2D6A4F] font-medium">
                        {event.subtitle}
                      </p>
                    </div>

                    {/* Teaser */}
                    <p className="text-xs text-[#736B63] leading-relaxed pt-0.5">
                      {event.teaser}
                    </p>

                    {/* User saved reflection preview (if any) */}
                    {userReflection && (
                      <div className="mt-2 text-[11px] text-[#4A443E] bg-[#FAF7F2] rounded-xl px-3 py-1.5 border border-[#E8E2D5]/70 italic">
                        <span className="font-bold not-italic text-[#1E4535]">خاطرتك: </span>
                        {userReflection.length > 70 ? `${userReflection.slice(0, 70)}...` : userReflection}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="sm:self-center shrink-0 pt-2 sm:pt-0">
                    <button
                      id={`btn-open-event-${event.id}`}
                      className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isCompleted
                          ? 'bg-[#FAF7F2] text-[#1E4535] border border-[#E8E2D5] group-hover:bg-[#1E4535] group-hover:text-white'
                          : 'bg-[#1E4535] text-white shadow-xs group-hover:bg-[#2D6A4F]'
                      }`}
                    >
                      <span>{isCompleted ? 'إعادة القراءة' : 'ابدأ الرحلة'}</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredEvents.length === 0 && (
          <div className="bg-white border border-[#E8E2D5] rounded-3xl p-8 text-center space-y-2">
            <p className="text-sm font-bold text-[#1F2421]">لم يتم إتمام أي حدث بعد</p>
            <p className="text-xs text-[#736B63]">
              اختر أي محطة من محطات السيرة وابدأ رحلتك التفاعلية 🤍
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
