import React from 'react';
import { Sun, Moon, BedDouble, Sparkles, BookOpen, HeartHandshake, Play, CheckCircle2 } from 'lucide-react';
import { ADHKAR_CATEGORIES } from '../data/adhkarData';
import { UserProgress } from '../types';
import { getTodayWorship } from '../data/dailyWorship';

interface AdhkarListViewProps {
  progress: UserProgress;
  onOpenAdhkar: (categoryId: string) => void;
  onOpenTasbeeh: () => void;
  onOpenQuran: () => void;
  onOpenWorship: () => void;
}

export const AdhkarListView: React.FC<AdhkarListViewProps> = ({
  progress,
  onOpenAdhkar,
  onOpenTasbeeh,
  onOpenQuran,
  onOpenWorship,
}) => {
  const todayWorship = getTodayWorship();

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'morning':
        return Sun;
      case 'evening':
        return Moon;
      case 'sleep':
        return BedDouble;
      case 'after_prayer':
      default:
        return Sparkles;
    }
  };

  const getCategoryStats = (catId: string, totalItems: number) => {
    let completed = false;
    let finishedCount = 0;

    if (catId === 'morning') {
      completed = progress.morningAdhkarCompleted;
      finishedCount = completed ? totalItems : (progress.adhkarItemsCompleted?.morning || 0);
    } else if (catId === 'evening') {
      completed = progress.eveningAdhkarCompleted;
      finishedCount = completed ? totalItems : (progress.adhkarItemsCompleted?.evening || 0);
    } else if (catId === 'sleep') {
      completed = progress.sleepAdhkarCompleted;
      finishedCount = completed ? totalItems : (progress.adhkarItemsCompleted?.sleep || 0);
    } else {
      completed = progress.completedActivities.includes('act-after-prayer');
      finishedCount = completed ? totalItems : (progress.adhkarItemsCompleted?.after_prayer || 0);
    }

    return { completed, finishedCount };
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs">
        <h2 className="text-2xl font-bold font-['Tajawal'] text-[#1F2421] mb-1">
          الأذكار والعبادات 🤍
        </h2>
        <p className="text-xs sm:text-sm text-[#736B63] leading-relaxed">
          أذكار اليوم والليلة المأثورة الصحيحة ومتابعة فورية للعدادات والتسبيح الحقيقي.
        </p>
      </div>

      {/* Quick Access Utility Cards (Tasbeeh & Quran) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tasbeeh Card */}
        <div
          onClick={onOpenTasbeeh}
          className="bg-gradient-to-br from-[#2D6A4F] to-[#1E4535] text-white rounded-3xl p-5 shadow-xs flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">المسبحة الإلكترونية</h3>
              <p className="text-xs text-white/80">
                تسبيحاتك المسجلة اليوم: <strong className="font-mono text-white font-bold">{progress.totalTasbeehCount}</strong>
              </p>
            </div>
          </div>
          <button className="px-3.5 py-1.5 rounded-xl bg-white text-[#1E4535] text-xs font-bold shrink-0">
            فتح
          </button>
        </div>

        {/* Quran Wird Card */}
        <div
          onClick={onOpenQuran}
          className="bg-gradient-to-br from-[#8C6D3B] to-[#5C451F] text-white rounded-3xl p-5 shadow-xs flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">ورد القرآن الكريم</h3>
              <p className="text-xs text-white/80">
                قراءة اليوم: <strong className="font-mono text-white font-bold">{progress.quranPagesReadToday}</strong> من {progress.quranGoalPages} صفحات
              </p>
            </div>
          </div>
          <button className="px-3.5 py-1.5 rounded-xl bg-white text-[#5C451F] text-xs font-bold shrink-0">
            تسجيل ومتابعة
          </button>
        </div>
      </div>

      {/* Main Adhkar Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ADHKAR_CATEGORIES.map((cat) => {
          const Icon = getCategoryIcon(cat.id);
          const { completed, finishedCount } = getCategoryStats(cat.id, cat.items.length);
          const pct = Math.round((finishedCount / cat.items.length) * 100);

          return (
            <div
              key={cat.id}
              className={`rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                completed
                  ? 'bg-[#F4F9F4] border-[#A3D9A5]/60'
                  : 'bg-white border-[#E8E2D5] shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                        completed ? 'bg-[#E8F5E9] text-[#2D6A4F]' : 'bg-[#F3EFE6] text-[#403B36]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1F2421]">{cat.title}</h3>
                      <span className="text-xs text-[#8C827A] font-medium">
                        {finishedCount} من {cat.items.length} أذكار مكتملة ({pct}%)
                      </span>
                    </div>
                  </div>

                  {completed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2D6A4F] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full border border-[#C8E6C9]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      مكتملة ✓
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#736B63] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E8E2D5]">
                      {finishedCount > 0 ? `${finishedCount}/${cat.items.length}` : 'لم تبدأ'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#736B63] leading-relaxed mb-3">
                  {cat.subtitle}
                </p>

                {/* Progress bar inside card */}
                <div className="w-full h-1.5 bg-[#F0ECE1] rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full transition-all duration-300 ${
                      completed ? 'bg-[#2D6A4F]' : 'bg-[#52B788]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0ECE1] flex items-center justify-between">
                <span className="text-xs text-[#8C827A]">بالعد والتكرار الفعلي</span>
                <button
                  onClick={() => onOpenAdhkar(cat.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4535] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{completed ? 'مراجعة وقراءة' : 'بدء القراءة'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Worship Suggestion Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#E8E2D5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF0E6] text-[#A25A19] flex items-center justify-center shrink-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#A25A19]">عبادة اليوم المقترحة</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FAF0E6] text-[#A25A19]">
                {todayWorship.category}
              </span>
            </div>
            <h3 className="text-base font-bold text-[#1F2421] mt-0.5">{todayWorship.title}</h3>
            <p className="text-xs text-[#736B63] mt-0.5">{todayWorship.virtue}</p>
          </div>
        </div>

        <button
          onClick={onOpenWorship}
          className="px-4 py-2.5 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold hover:bg-[#1E4535] shrink-0 active:scale-95 transition-all cursor-pointer"
        >
          {progress.completedActivities.includes('act-daily-worship')
            ? 'تمت بحمد الله ✓'
            : 'سجّل أداءها اليوم'}
        </button>
      </div>
    </div>
  );
};
