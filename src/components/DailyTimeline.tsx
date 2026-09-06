import React, { useState } from 'react';
import {
  Sunrise,
  SunMedium,
  CloudSun,
  Sunset,
  Moon,
  Check,
  RotateCcw,
  Play,
  Plus,
  Clock,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Circle,
  HelpCircle,
} from 'lucide-react';
import { DailyActivity, TimePeriod, ActivityStatus, UserProgress } from '../types';
import {
  BASE_DAILY_ACTIVITIES,
  getCurrentTimePeriod,
  PERIOD_META,
} from '../data/dailyWorship';

interface DailyTimelineProps {
  progress: UserProgress;
  onUpdateActivityStatus: (activityId: string, newStatus: ActivityStatus) => void;
  onStartActivity: (activityType: string) => void;
  onQuickAddQuranPage?: () => void;
}

export const DailyTimeline: React.FC<DailyTimelineProps> = ({
  progress,
  onUpdateActivityStatus,
  onStartActivity,
  onQuickAddQuranPage,
}) => {
  const currentSystemPeriod = getCurrentTimePeriod();
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<TimePeriod | 'all'>('all');

  const periods: TimePeriod[] = ['morning', 'dhuhr', 'asr', 'maghrib', 'night'];

  const getPeriodIcon = (period: TimePeriod) => {
    switch (period) {
      case 'morning':
        return Sunrise;
      case 'dhuhr':
        return SunMedium;
      case 'asr':
        return CloudSun;
      case 'maghrib':
        return Sunset;
      case 'night':
        return Moon;
    }
  };

  // Determine user's real status for an item
  const getItemRealStatus = (item: Omit<DailyActivity, 'status'> | DailyActivity): { isCompleted: boolean; isSkipped: boolean; statusLabel: string; progressDetail?: string } => {
    const isSkipped = progress.skippedActivities.includes(item.id);

    // 1. Prayer items: strictly user-recorded
    if (item.type === 'prayer') {
      const prayerKey = item.id.replace('act-', '');
      const isCompleted = progress.prayersCompletedToday.includes(prayerKey) || progress.completedActivities.includes(item.id);
      return {
        isCompleted,
        isSkipped,
        statusLabel: isCompleted ? 'تمّت ✓' : isSkipped ? 'تخطيت' : 'لم تُسجل',
      };
    }

    // 2. Quran items
    if (item.type === 'quran') {
      const isCompleted = progress.quranPagesReadToday >= progress.quranGoalPages || progress.completedActivities.includes(item.id);
      const pct = Math.min(100, Math.round((progress.quranPagesReadToday / progress.quranGoalPages) * 100));
      return {
        isCompleted,
        isSkipped,
        statusLabel: isCompleted ? 'تم الورد ✓' : isSkipped ? 'تخطيت' : 'قيد القراءة',
        progressDetail: `${progress.quranPagesReadToday} من ${progress.quranGoalPages} صفحة (${pct}%)`,
      };
    }

    // 3. Adhkar items
    if (item.type === 'adhkar') {
      let isCompleted = false;
      let countText = '';
      if (item.id === 'act-morning-adhkar') {
        isCompleted = progress.morningAdhkarCompleted || progress.completedActivities.includes(item.id);
        const done = progress.adhkarItemsCompleted?.morning || 0;
        countText = isCompleted ? '27 من 27 ذكراً' : `${done} من 27 ذكراً`;
      } else if (item.id === 'act-evening-adhkar') {
        isCompleted = progress.eveningAdhkarCompleted || progress.completedActivities.includes(item.id);
        const done = progress.adhkarItemsCompleted?.evening || 0;
        countText = isCompleted ? '27 من 27 ذكراً' : `${done} من 27 ذكراً`;
      } else if (item.id === 'act-sleep-adhkar') {
        isCompleted = progress.sleepAdhkarCompleted || progress.completedActivities.includes(item.id);
        const done = progress.adhkarItemsCompleted?.sleep || 0;
        countText = isCompleted ? '5 من 5 أذكار' : `${done} من 5 أذكار`;
      } else {
        isCompleted = progress.completedActivities.includes(item.id);
        const done = progress.adhkarItemsCompleted?.after_prayer || 0;
        countText = `${done} أذكار`;
      }

      return {
        isCompleted,
        isSkipped,
        statusLabel: isCompleted ? 'مكتملة ✓' : isSkipped ? 'تخطيت' : 'لم تكتمل',
        progressDetail: countText,
      };
    }

    // 4. Tasbeeh items
    if (item.type === 'tasbeeh') {
      const isCompleted = progress.completedActivities.includes(item.id) || progress.totalTasbeehCount >= 33;
      return {
        isCompleted,
        isSkipped,
        statusLabel: isCompleted ? 'تمّت ✓' : isSkipped ? 'تخطيت' : 'لم يُسجل',
        progressDetail: `${progress.totalTasbeehCount} تسبيحة مسجلة`,
      };
    }

    // 5. Daily worship items
    const isCompleted = progress.completedActivities.includes(item.id);
    return {
      isCompleted,
      isSkipped,
      statusLabel: isCompleted ? 'أُنجزت ✓' : isSkipped ? 'تخطيت' : 'لم تُسجل',
    };
  };

  // Filter periods
  const visiblePeriods = selectedPeriodFilter === 'all'
    ? periods
    : periods.filter((p) => p === selectedPeriodFilter);

  return (
    <div className="space-y-6">
      {/* Title & Introduction */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold font-['Tajawal'] text-[#1F2421]">يومك مع أُنس 🌿</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] font-bold">
                متابعة حية وموثوقة
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#736B63] leading-relaxed">
              جدول يومك مقسم زمنياً. لا يتم تسجيل أي عبادة تلقائياً بل بناءً على فعلك وتسجيلك الفعلي فقط.
            </p>
          </div>

          {/* Current Period Badge */}
          <div className="shrink-0 flex items-center gap-2 bg-[#F3EFE6] px-3.5 py-2 rounded-2xl border border-[#E8E2D5]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F] animate-pulse" />
            <span className="text-xs font-semibold text-[#403B36]">
              الوقت الحالي: <strong className="text-[#2D6A4F]">{PERIOD_META[currentSystemPeriod].name}</strong>
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-5 pt-4 border-t border-[#F0ECE1] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedPeriodFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedPeriodFilter === 'all'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'bg-[#F3EFE6] text-[#736B63] hover:bg-[#E8E2D5]'
            }`}
          >
            كل اليوم (الكامل)
          </button>
          {periods.map((p) => {
            const Icon = getPeriodIcon(p);
            const isSelected = selectedPeriodFilter === p;
            const isCurrent = currentSystemPeriod === p;
            return (
              <button
                key={p}
                onClick={() => setSelectedPeriodFilter(p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#2D6A4F] text-white shadow-xs'
                    : 'bg-[#F3EFE6] text-[#736B63] hover:bg-[#E8E2D5]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{PERIOD_META[p].name}</span>
                {isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#52B788] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Periods Timeline List */}
      <div className="space-y-6">
        {visiblePeriods.map((period) => {
          const meta = PERIOD_META[period];
          const Icon = getPeriodIcon(period);
          const isCurrentPeriod = currentSystemPeriod === period;
          const items = BASE_DAILY_ACTIVITIES.filter((a) => a.period === period);

          return (
            <div
              key={period}
              className={`rounded-3xl p-5 sm:p-6 transition-all border ${
                isCurrentPeriod
                  ? 'bg-[#FBF9F5] border-[#2D6A4F] shadow-sm'
                  : 'bg-white border-[#E8E2D5] shadow-xs'
              }`}
            >
              {/* Period Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F0ECE1]">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      isCurrentPeriod
                        ? 'bg-[#2D6A4F] text-white shadow-xs'
                        : 'bg-[#F3EFE6] text-[#403B36]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[#1F2421]">{meta.name}</h3>
                      {isCurrentPeriod && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#2D6A4F] text-white font-bold">
                          الفترة الحالية 🌿
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#857B72]">{meta.timeHint} • {meta.description}</p>
                  </div>
                </div>
              </div>

              {/* Activities in this Period */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {items.map((item) => {
                  const { isCompleted, isSkipped, statusLabel, progressDetail } = getItemRealStatus(item);

                  return (
                    <div
                      key={item.id}
                      className={`relative rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                        isCompleted
                          ? 'bg-[#F4F9F4] border-[#A3D9A5]/80'
                          : isSkipped
                          ? 'bg-[#FAF8F5] border-[#E8E2D5] opacity-60'
                          : isCurrentPeriod
                          ? 'bg-white border-[#2D6A4F]/40 shadow-xs'
                          : 'bg-[#FAF8F5] border-[#E8E2D5]'
                      }`}
                    >
                      {/* Top Row: Title, Subtitle, and Real Status Badge */}
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {isCompleted ? '✓' : '○'}
                            </span>
                            <h4
                              className={`text-base font-bold ${
                                isCompleted
                                  ? 'text-[#234E43] line-through decoration-[#74C69D]'
                                  : 'text-[#1F2421]'
                              }`}
                            >
                              {item.title}
                            </h4>
                          </div>

                          {/* Real User-Controlled Status Chip */}
                          <div>
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2D6A4F] text-xs font-bold border border-[#C8E6C9]">
                                <Check className="w-3 h-3" />
                                {statusLabel}
                              </span>
                            ) : isSkipped ? (
                              <span className="text-xs text-[#A25A19] px-2.5 py-0.5 rounded-full bg-[#FAF0E6] border border-[#E8D4BE]">
                                تخطيت
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-[#8C827A] px-2.5 py-0.5 rounded-full bg-white border border-[#E8E2D5]">
                                {statusLabel}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Subtitle / Progress detail */}
                        <div className="flex items-center justify-between text-xs text-[#736B63] pr-6 mb-2">
                          <span>{item.subtitle}</span>
                          {progressDetail && (
                            <span className="font-bold text-[#2D6A4F] bg-white px-2 py-0.5 rounded-md border border-[#E8E2D5]">
                              {progressDetail}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Controls Row */}
                      <div className="pt-3 mt-1 border-t border-black/5 flex items-center justify-between gap-2">
                        {/* Start or View Modal Action */}
                        <div className="flex items-center gap-1.5">
                          {item.actionTarget && (
                            <button
                              onClick={() => onStartActivity(item.actionTarget!)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isCompleted
                                  ? 'bg-white text-[#2D6A4F] border border-[#C8E6C9] hover:bg-[#F3EFE6]'
                                  : 'bg-[#2D6A4F] text-white hover:bg-[#1E4535] shadow-xs active:scale-95'
                              }`}
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>{isCompleted ? 'فتح ومراجعة' : 'ابدأ'}</span>
                            </button>
                          )}

                          {/* Quick Quran +1 page button if it's a Quran item */}
                          {item.type === 'quran' && onQuickAddQuranPage && (
                            <button
                              onClick={onQuickAddQuranPage}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#B8860B]/10 hover:bg-[#B8860B]/20 text-[#B8860B] text-xs font-bold transition-colors cursor-pointer"
                              title="تسجيل قراءة صفحة واحدة مباشرة"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+1 صفحة</span>
                            </button>
                          )}
                        </div>

                        {/* Explicit User Toggle Buttons */}
                        <div className="flex items-center gap-1">
                          {!isCompleted ? (
                            <button
                              onClick={() => onUpdateActivityStatus(item.id, 'completed')}
                              className="px-3 py-1.5 rounded-xl bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2D6A4F] text-xs font-bold transition-colors cursor-pointer active:scale-95 shadow-xs flex items-center gap-1"
                              title="تسجيل إتمام هذه العبادة"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>
                                {item.type === 'prayer' ? 'سجّل الصلاة ✓' : 'سجّل الإتمام ✓'}
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onUpdateActivityStatus(item.id, 'not_started')}
                              className="p-1.5 rounded-xl hover:bg-[#E8E2D5] text-[#736B63] transition-colors cursor-pointer"
                              title="إلغاء التسجيل / إعادة التعيين"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!isSkipped && !isCompleted && (
                            <button
                              onClick={() => onUpdateActivityStatus(item.id, 'skipped')}
                              className="px-2 py-1 rounded-lg hover:bg-[#F3EFE6] text-[#A8A096] hover:text-[#736B63] text-[11px] transition-colors cursor-pointer"
                              title="تخطي هذه العبادة لليوم"
                            >
                              تخطي
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
