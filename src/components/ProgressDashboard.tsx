import React from 'react';
import { Flame, CheckCircle2, Clock, BookOpen, Sparkles, Award, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import { UserProgress } from '../types';
import { APP_BADGES } from '../data/badgesData';

interface ProgressDashboardProps {
  progress: UserProgress;
  onOpenActivity: (type: string) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ progress, onOpenActivity }) => {
  const totalItems = 14;
  const completedCount = progress.completedActivities.length;
  const todayPercentage = Math.min(100, Math.round((completedCount / totalItems) * 100));

  // Calculate week summary stats strictly from recorded history
  const completedDaysCount = progress.weeklyHistory.filter((d) => d.completedPercentage >= 50).length;
  const totalWeekPrayers = progress.weeklyHistory.reduce((acc, cur) => acc + cur.prayersCount, 0);
  const totalWeekQuranPages = progress.weeklyHistory.reduce((acc, cur) => acc + cur.quranPages, 0);
  const totalWeekTasbeeh = progress.weeklyHistory.reduce((acc, cur) => acc + cur.tasbeehCount, 0);

  // Dynamic badge unlock calculation: based ONLY on real interactions
  const hasStartedAnyAction = completedCount > 0 ||
    progress.prayersCompletedToday.length > 0 ||
    progress.quranPagesReadToday > 0 ||
    progress.totalTasbeehCount > 0;

  const badges = APP_BADGES.map((b) => {
    let unlocked = false;
    if (b.id === 'badge-start') unlocked = hasStartedAnyAction;
    if (b.id === 'badge-quran-lover') unlocked = totalWeekQuranPages >= 10 || progress.quranPagesReadToday >= progress.quranGoalPages;
    if (b.id === 'badge-dhikr-keeper') unlocked = progress.morningAdhkarCompleted || progress.eveningAdhkarCompleted;
    if (b.id === 'badge-streak-keeper') unlocked = progress.streakDays >= 3;

    return { ...b, unlocked };
  });

  return (
    <div className="space-y-6">
      {/* Required Islamic Motivational Disclaimer Banner */}
      <div className="bg-[#FAF7F2] rounded-3xl p-4.5 border border-[#E8D4BE] text-xs text-[#6B5A4B] flex items-start gap-3 shadow-xs">
        <AlertCircle className="w-5 h-5 text-[#A25A19] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold text-[#A25A19] block mb-0.5">تنبيه شرعي وتنظيمي:</strong>
          هذه المتابعة اليومية والشارات وسلسلة الأيام هي أدوات تنظيمية وتحفيزية فقط لمساعدتك على المداومة والاستمرار في طاعة الله، وليست مقياسًا للأجر أو القبول أو الحسنات عند الله تعالى؛ فالأجر والقبول بفضله وكرمه سبحانه وتعالى.
        </div>
      </div>

      {/* Streak & Today's Completion Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D5] shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Streak Pillar */}
          <div className="flex items-center gap-4 bg-gradient-to-l from-[#FAF0E6] to-[#FFF9F3] p-5 rounded-2xl border border-[#E8D4BE]">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-xs flex items-center justify-center text-3xl shrink-0 border border-[#E8D4BE]">
              🔥
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-[#A25A19]">
                  {progress.streakDays}
                </span>
                <span className="text-lg font-bold text-[#1F2421]">
                  {progress.streakDays === 1 ? 'يوم متتالي' : 'أيام متتالية'}
                </span>
              </div>
              <p className="text-xs text-[#736B63] mt-1 leading-relaxed">
                «أحب الأعمال إلى الله أدومها وإن قل». استمرارك يصنع أثرك وبركتك.
              </p>
            </div>
          </div>

          {/* Today Percentage Ring/Bar */}
          <div className="bg-[#F8F6F0] p-5 rounded-2xl border border-[#E8E2D5]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[#554E46]">نسبة إنجاز اليوم الفعلية</span>
              <span className="text-base font-bold text-[#2D6A4F]">{todayPercentage}%</span>
            </div>
            <div className="w-full h-3 bg-[#E8E2D5] rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-[#52B788] to-[#2D6A4F] rounded-full transition-all duration-500"
                style={{ width: `${todayPercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-[#8C827A]">
              سجّلت {completedCount} من {totalItems} عبادة وطاعة مبرمجة في يومك مع أُنس.
            </p>
          </div>
        </div>
      </div>

      {/* Today's Detailed Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Prayers */}
        <div
          onClick={() => onOpenActivity('prayer')}
          className="bg-white rounded-2xl p-4 border border-[#E8E2D5] shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#2D6A4F]/40 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#857B72]">الصلوات المسجلة</span>
            <span className="p-1.5 rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-[#1F2421]">
              {progress.prayersCompletedToday.length}
            </span>
            <span className="text-xs text-[#736B63] mr-1">/ 5 صلوات مسجلة</span>
          </div>
        </div>

        {/* Morning Adhkar */}
        <div
          onClick={() => onOpenActivity('adhkar_morning')}
          className="bg-white rounded-2xl p-4 border border-[#E8E2D5] shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#2D6A4F]/40 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#857B72]">أذكار الصباح</span>
            <span className="text-sm">🌅</span>
          </div>
          <div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block ${
                progress.morningAdhkarCompleted
                  ? 'bg-[#E8F5E9] text-[#2D6A4F]'
                  : 'bg-[#FAF0E6] text-[#A25A19]'
              }`}
            >
              {progress.morningAdhkarCompleted
                ? 'مكتملة ✓'
                : `${progress.adhkarItemsCompleted?.morning || 0} / 10 أذكار`}
            </span>
          </div>
        </div>

        {/* Evening Adhkar */}
        <div
          onClick={() => onOpenActivity('adhkar_evening')}
          className="bg-white rounded-2xl p-4 border border-[#E8E2D5] shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#2D6A4F]/40 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#857B72]">أذكار المساء</span>
            <span className="text-sm">🌙</span>
          </div>
          <div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block ${
                progress.eveningAdhkarCompleted
                  ? 'bg-[#E8F5E9] text-[#2D6A4F]'
                  : 'bg-[#FAF8F5] text-[#8C827A]'
              }`}
            >
              {progress.eveningAdhkarCompleted
                ? 'مكتملة ✓'
                : `${progress.adhkarItemsCompleted?.evening || 0} / 10 أذكار`}
            </span>
          </div>
        </div>

        {/* Quran */}
        <div
          onClick={() => onOpenActivity('quran')}
          className="bg-white rounded-2xl p-4 border border-[#E8E2D5] shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#2D6A4F]/40 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#857B72]">ورد القرآن</span>
            <span className="p-1.5 rounded-lg bg-[#B8860B]/10 text-[#B8860B]">
              <BookOpen className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-[#1F2421]">
              {progress.quranPagesReadToday}
            </span>
            <span className="text-xs text-[#736B63] mr-1">/ {progress.quranGoalPages} صفحات اليوم</span>
          </div>
        </div>

        {/* Tasbeeh */}
        <div
          onClick={() => onOpenActivity('tasbeeh')}
          className="bg-white rounded-2xl p-4 border border-[#E8E2D5] shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#2D6A4F]/40 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#857B72]">التسبيح اليومي</span>
            <span className="p-1.5 rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-[#1F2421]">
              {progress.totalTasbeehCount}
            </span>
            <span className="text-xs text-[#736B63] mr-1">تسبيحة حقيقية</span>
          </div>
        </div>

        {/* Daily Worship */}
        <div
          onClick={() => onOpenActivity('worship')}
          className="bg-white rounded-2xl p-4 border border-[#E8E2D5] shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#2D6A4F]/40 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#857B72]">عبادة اليوم</span>
            <span className="text-sm">🤍</span>
          </div>
          <div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block ${
                progress.completedActivities.includes('act-daily-worship')
                  ? 'bg-[#E8F5E9] text-[#2D6A4F]'
                  : 'bg-[#F3EFE6] text-[#6B635B]'
              }`}
            >
              {progress.completedActivities.includes('act-daily-worship')
                ? 'مكتملة ✓'
                : 'لم تُسجل بعد'}
            </span>
          </div>
        </div>
      </div>

      {/* ملخص هذا الأسبوع Section */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2D6A4F]" />
            <h3 className="text-lg font-bold text-[#1F2421]">ملخص هذا الأسبوع</h3>
          </div>
          <span className="text-xs text-[#736B63] font-medium">سجل الأيام السبعة</span>
        </div>

        {/* 7-day Bar Chart */}
        <div className="mb-6 bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-[#E8E2D5]">
          <div className="flex items-end justify-between gap-2 h-36 pt-4">
            {progress.weeklyHistory.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-bold text-[#736B63]">
                  {item.completedPercentage}%
                </span>
                <div className="w-full max-w-[28px] bg-[#E8E2D5] rounded-t-lg overflow-hidden flex flex-col justify-end h-24">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      item.completedPercentage >= 70
                        ? 'bg-[#2D6A4F]'
                        : item.completedPercentage >= 40
                        ? 'bg-[#52B788]'
                        : item.completedPercentage > 0
                        ? 'bg-[#D4A373]'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${item.completedPercentage}%` }}
                  />
                </div>
                <span className="text-[11px] text-[#403B36] font-semibold whitespace-nowrap">
                  {item.dayName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[#F8F6F0] border border-[#E8E2D5] text-center">
            <span className="text-xs text-[#857B72] block mb-1">الأيام المكتملة</span>
            <span className="text-xl font-bold font-mono text-[#1F2421]">{completedDaysCount} أيام</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F8F6F0] border border-[#E8E2D5] text-center">
            <span className="text-xs text-[#857B72] block mb-1">إجمالي الصلوات</span>
            <span className="text-xl font-bold font-mono text-[#1F2421]">{totalWeekPrayers} صلاة</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F8F6F0] border border-[#E8E2D5] text-center">
            <span className="text-xs text-[#857B72] block mb-1">صفحات القرآن</span>
            <span className="text-xl font-bold font-mono text-[#1F2421]">{totalWeekQuranPages} صفحة</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F8F6F0] border border-[#E8E2D5] text-center">
            <span className="text-xs text-[#857B72] block mb-1">مجموع التسبيحات</span>
            <span className="text-xl font-bold font-mono text-[#1F2421]">{totalWeekTasbeeh} تسبيحة</span>
          </div>
        </div>
      </div>

      {/* Achievements / Badges Section */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#2D6A4F]" />
            <h3 className="text-lg font-bold text-[#1F2421]">الأوسمة والشارات التحفيزية</h3>
          </div>
          <span className="text-xs text-[#736B63]">
            {badges.filter((b) => b.unlocked).length} من {badges.length} أوسمة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                badge.unlocked
                  ? 'bg-[#F9FAF8] border-[#A3D9A5]/60'
                  : 'bg-[#FAF8F5] border-[#E8E2D5] opacity-50'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                  badge.unlocked
                    ? 'bg-[#E8F5E9] border border-[#C8E6C9]'
                    : 'bg-[#F0ECE1] grayscale'
                }`}
              >
                {badge.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#1F2421]">{badge.title}</h4>
                  {badge.unlocked ? (
                    <span className="text-[10px] font-bold text-[#2D6A4F] px-2 py-0.5 rounded-full bg-[#E8F5E9]">
                      مكتمل ✓
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#8C827A] px-2 py-0.5 rounded-full bg-white border border-[#E8E2D5]">
                      قيد الإنجاز
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#736B63] mt-1 leading-relaxed">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
