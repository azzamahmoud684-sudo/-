import React, { useState, useEffect } from 'react';
import { Play, ArrowLeft, Clock, BookOpen, CheckCircle2, Sparkles, HeartHandshake, ChevronLeft } from 'lucide-react';
import { UserProgress, TimePeriod } from '../types';
import { getNextPrayerCountdown, getTodayPrayerTimes } from '../data/prayerTimes';
import { getCurrentTimePeriod, PERIOD_META, getTodayWorship } from '../data/dailyWorship';

interface HeroNowSectionProps {
  progress: UserProgress;
  onStartActivity: (activityType: string) => void;
  onNavigateToTab: (tab: 'timeline' | 'adhkar' | 'charity' | 'progress') => void;
}

export const HeroNowSection: React.FC<HeroNowSectionProps> = ({
  progress,
  onStartActivity,
  onNavigateToTab,
}) => {
  const [countdown, setCountdown] = useState(getNextPrayerCountdown());
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>('morning');

  useEffect(() => {
    // Update countdown every second
    const interval = setInterval(() => {
      setCountdown(getNextPrayerCountdown());
      setCurrentPeriod(getCurrentTimePeriod());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine current primary activity based on time period
  const getRelevantActivity = () => {
    const todayWorship = getTodayWorship();
    switch (currentPeriod) {
      case 'morning':
        if (!progress.morningAdhkarCompleted) {
          return {
            title: 'أذكار الصباح',
            badge: 'حصنك الصباحي 🌿',
            description: 'افتتح يومك بنور الذكر والبركة لتنال حفظ الله ورعايته طوال يومك.',
            actionLabel: 'ابدأ أذكار الصباح',
            target: 'adhkar_morning',
            isCompleted: progress.morningAdhkarCompleted,
          };
        }
        return {
          title: 'ورد القرآن الكريم',
          badge: 'نور الصباح 📖',
          description: 'اقرأ ما تيسر لك من كتاب الله في ساعات البكور المباركة.',
          actionLabel: 'ابدأ ورد القرآن',
          target: 'quran',
          isCompleted: progress.quranPagesReadToday >= progress.quranGoalPages,
        };

      case 'dhuhr':
        return {
          title: 'تسبيح منتصف اليوم',
          badge: 'استراحة الروح ✨',
          description: 'دقائق معدودة تطمئن بها نفسك بذكر الله والتسبيح بين زحمة المشاغل.',
          actionLabel: 'ابدأ التسبيح',
          target: 'tasbeeh',
          isCompleted: progress.completedActivities.includes('act-tasbeeh-midday'),
        };

      case 'asr':
        return {
          title: 'عبادة اليوم الموصى بها',
          badge: todayWorship.category + ' 🤍',
          description: `${todayWorship.title} - ${todayWorship.virtue}`,
          actionLabel: 'ابدأ عبادة اليوم',
          target: 'worship',
          isCompleted: progress.completedActivities.includes('act-daily-worship'),
        };

      case 'maghrib':
        return {
          title: 'أذكار المساء',
          badge: 'سكينة المساء 🌅',
          description: 'استودع نهارك عند الله تعالى واحمِ نفسك في إقبال الليل بحصن الأذكار.',
          actionLabel: 'ابدأ أذكار المساء',
          target: 'adhkar_evening',
          isCompleted: progress.eveningAdhkarCompleted,
        };

      case 'night':
      default:
        if (!progress.sleepAdhkarCompleted) {
          return {
            title: 'أذكار النوم وسورة الملك',
            badge: 'ختام يومك 🌙',
            description: 'أرح عقلك واستودع روحك لخالقك في طمأنينة وسكينة تامة.',
            actionLabel: 'ابدأ أذكار النوم',
            target: 'adhkar_sleep',
            isCompleted: progress.sleepAdhkarCompleted,
          };
        }
        return {
          title: 'صلاة الوتر',
          badge: 'خلوة المحبين 🤍',
          description: 'اختم صلاتك بالليل بركعة وتر؛ إن الله وتر يحب الوتر.',
          actionLabel: 'تسجيل صلاة الوتر',
          target: 'prayer',
          isCompleted: progress.completedActivities.includes('act-witr'),
        };
    }
  };

  const activity = getRelevantActivity();

  // Completion calculation
  const totalItems = 14;
  const completedCount = progress.completedActivities.length;
  const completionPercentage = Math.min(100, Math.round((completedCount / totalItems) * 100));

  return (
    <div className="space-y-4">
      {/* دلوقتي مع أُنس Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#234E43] via-[#2D6A4F] to-[#1E4535] text-white p-6 sm:p-7 shadow-md border border-[#234E43]/40">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#40916C]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          {/* Header Tag */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-[#D8F3DC] border border-white/10">
                <span className="w-2 h-2 rounded-full bg-[#52B788] animate-pulse" />
                دلوقتي مع أُنس 🤍
              </span>
              <span className="text-xs text-white/70 font-medium hidden sm:inline">
                {PERIOD_META[currentPeriod].name}
              </span>
            </div>

            {/* Quick Completion Pill */}
            <button
              onClick={() => onNavigateToTab('progress')}
              className="text-xs text-white/80 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
            >
              <span>إنجاز اليوم:</span>
              <span className="font-bold text-[#95D5B2]">{completionPercentage}%</span>
            </button>
          </div>

          {/* Activity Title & Content */}
          <div className="mt-1">
            <div className="inline-block text-xs font-medium text-[#95D5B2] mb-1">
              {activity.badge}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Tajawal'] tracking-tight text-white mb-2">
              {activity.title}
            </h2>
            <p className="text-sm text-white/85 leading-relaxed max-w-xl font-normal">
              {activity.description}
            </p>
          </div>

          {/* Start CTA & Status */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {activity.isCompleted ? (
              <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/20 text-white font-bold text-sm border border-white/20">
                <CheckCircle2 className="w-5 h-5 text-[#74C69D]" />
                <span>أحسنت! أتممت هذا النشاط ✓</span>
              </div>
            ) : (
              <button
                id="hero-start-activity-btn"
                onClick={() => onStartActivity(activity.target)}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-white hover:bg-[#F3EFE6] active:scale-95 text-[#1E4535] font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{activity.actionLabel}</span>
              </button>
            )}

            <button
              onClick={() => onNavigateToTab('timeline')}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-black/15 hover:bg-black/25 text-white/90 text-xs font-semibold backdrop-blur-sm transition-colors cursor-pointer"
            >
              <span>جدول اليوم كاملاً</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Triplet Indicators: Next Prayer Countdown | Quran Progress | Today Completion */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Next Prayer Countdown Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#E8E2D5] shadow-xs flex items-center justify-between sm:flex-col sm:items-start sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#857B72] font-medium">الصلاة القادمة</p>
              <h4 className="text-base font-bold text-[#1F2421]">
                صلاة {countdown.nextPrayerName} ({countdown.nextPrayerTime})
              </h4>
            </div>
          </div>
          <div className="text-left sm:text-right sm:w-full sm:mt-2 pt-1 border-t border-[#F0ECE1]">
            <p className="text-[11px] text-[#A25A19] font-medium">متبقي على الأذان</p>
            <p className="text-lg font-bold font-mono text-[#2D6A4F] tracking-wide" dir="ltr">
              {countdown.formattedCountdown}
            </p>
          </div>
        </div>

        {/* Quran Progress Card */}
        <div
          onClick={() => onStartActivity('quran')}
          className="bg-white rounded-2xl p-4 border border-[#E8E2D5] shadow-xs flex items-center justify-between sm:flex-col sm:items-start sm:justify-between cursor-pointer hover:border-[#2D6A4F]/40 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#B8860B]/10 text-[#B8860B]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#857B72] font-medium">ورد القرآن اليوم</p>
              <h4 className="text-base font-bold text-[#1F2421]">
                {progress.quranPagesReadToday} من {progress.quranGoalPages} صفحات
              </h4>
            </div>
          </div>
          <div className="w-28 sm:w-full sm:mt-2 pt-1 border-t border-[#F0ECE1]">
            <div className="flex items-center justify-between text-[11px] text-[#736B63] mb-1">
              <span>نسبة الورد</span>
              <span className="font-bold text-[#B8860B]">
                {Math.min(100, Math.round((progress.quranPagesReadToday / progress.quranGoalPages) * 100))}%
              </span>
            </div>
            <div className="w-full h-2 bg-[#F3EFE6] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D4A373] to-[#B8860B] rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (progress.quranPagesReadToday / progress.quranGoalPages) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Today Completion Card */}
        <div
          onClick={() => onNavigateToTab('progress')}
          className="bg-white rounded-2xl p-4 border border-[#E8E2D5] shadow-xs flex items-center justify-between sm:flex-col sm:items-start sm:justify-between cursor-pointer hover:border-[#2D6A4F]/40 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#857B72] font-medium">إنجاز اليوم</p>
              <h4 className="text-base font-bold text-[#1F2421]">
                {completedCount} من {totalItems} عبادة
              </h4>
            </div>
          </div>
          <div className="w-28 sm:w-full sm:mt-2 pt-1 border-t border-[#F0ECE1]">
            <div className="flex items-center justify-between text-[11px] text-[#736B63] mb-1">
              <span>معدل اليوم</span>
              <span className="font-bold text-[#2D6A4F]">{completionPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-[#F3EFE6] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2D6A4F] rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shortcut to "باب الخير" Card */}
      <div
        onClick={() => onNavigateToTab('charity')}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#FAF7F2] to-[#F4EFE6] border border-[#E2DAD0] p-4.5 flex items-center justify-between gap-4 cursor-pointer hover:shadow-xs hover:border-[#2D6A4F]/30 transition-all group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-bold text-[#1F2421]">باب الخير 🤍</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] font-semibold">
                مساهمات معتمدة
              </span>
            </div>
            <p className="text-xs text-[#6B635B] leading-relaxed">
              «اجعل لليوم أثرًا 🤍» إن أحببت أن تجعل ليومك أثرًا آخر، يمكنك المساهمة في أحد أبواب الخير الموثوقة.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white text-[#2D6A4F] border border-[#E8E2D5] group-hover:translate-x-[-2px] transition-transform">
          <ChevronLeft className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
