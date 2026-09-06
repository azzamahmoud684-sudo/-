import React, { useState, useEffect } from 'react';
import { Bell, Flame, Sparkles, Moon, Sun, Info, User, RotateCcw, Check, X, Shield } from 'lucide-react';
import { UserProgress } from '../types';

interface HeaderProps {
  progress: UserProgress;
  onOpenReminders: () => void;
  onOpenProgress: () => void;
  onUpdateProfileName?: (name: string) => void;
  onResetToday?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  progress,
  onOpenReminders,
  onOpenProgress,
  onUpdateProfileName,
  onResetToday,
}) => {
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [hijriDateStr, setHijriDateStr] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [tempName, setTempName] = useState(progress.userProfile?.name || 'متابع أُنس');

  useEffect(() => {
    const now = new Date();
    // Arabic Gregorian Date
    const gregorian = new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
    setCurrentDateStr(gregorian);

    // Approximate Islamic Hijri Date representation
    try {
      const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now);
      setHijriDateStr(hijri);
    } catch {
      setHijriDateStr('شهر الله المبارك');
    }
  }, []);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfileName && tempName.trim()) {
      onUpdateProfileName(tempName.trim());
    }
    setIsProfileModalOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#E8E2D5] px-4 py-3 transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2D6A4F] to-[#1E4535] text-white flex items-center justify-center shadow-sm">
              <span className="font-['Amiri'] font-bold text-2xl select-none">أُ</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold font-['Tajawal'] text-[#1F2421] tracking-tight">أُنس</h1>
                <span className="text-sm text-[#2D6A4F]">🌿</span>
              </div>
              <p className="text-xs text-[#736B63] hidden sm:block">رفيقك اليومي لطمأنينة القلب والعبادة</p>
            </div>
          </div>

          {/* Date & Quick Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hijri & Gregorian Day */}
            <div className="text-left sm:text-right hidden md:block">
              <p className="text-xs font-semibold text-[#2D6A4F]">{hijriDateStr}</p>
              <p className="text-[11px] text-[#8C827A]">{currentDateStr}</p>
            </div>

            {/* Streak Indicator Pill */}
            <button
              id="header-streak-btn"
              onClick={onOpenProgress}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF0E6] hover:bg-[#F3E3D3] border border-[#E8D4BE] text-[#A25A19] text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              title="سلسلة الأيام المتتالية (أداة تحفيزية)"
            >
              <span className="text-sm">🔥</span>
              <span>{progress.streakDays} {progress.streakDays === 1 ? 'يوم' : 'أيام'}</span>
            </button>

            {/* User Profile / Guest Badge */}
            <button
              id="header-profile-btn"
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white hover:bg-[#F3EFE6] border border-[#E8E2D5] text-xs text-[#554E46] transition-all cursor-pointer shadow-xs"
              title="إعدادات الحساب المحلي والمتابعة"
            >
              <User className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span className="hidden sm:inline font-medium truncate max-w-[80px]">
                {progress.userProfile?.name || 'حساب محلي'}
              </span>
            </button>

            {/* Reminders Quick Bell */}
            <button
              id="header-reminders-btn"
              onClick={onOpenReminders}
              className="relative p-2 rounded-full bg-white hover:bg-[#F3EFE6] border border-[#E8E2D5] text-[#403B36] transition-colors cursor-pointer shadow-xs active:scale-95"
              title="مركز التذكيرات"
              aria-label="مركز التذكيرات"
            >
              <Bell className="w-4 h-4 text-[#2D6A4F]" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
            </button>
          </div>
        </div>
      </header>

      {/* User Profile & Persistence Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E2D5] shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1] mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#2D6A4F]" />
                <h3 className="text-base font-bold text-[#1F2421]">الحساب والمتابعة الشخصية</h3>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#F3EFE6] text-[#736B63]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Guest / Storage explanation */}
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D5] text-xs text-[#554E46] leading-relaxed mb-4">
              <strong className="text-[#2D6A4F] block mb-1">
                {progress.userProfile?.isGuest ? 'متابع محلي على هذا الجهاز:' : 'ملفك الشخصي:'}
              </strong>
              بياناتك وطاعاتك وأورادك محفوظة بأمان في الذاكرة المحلية لمتصفح هذا الجهاز دون نقلها إلى أي خوادم خارجية.
            </div>

            {/* Form to edit name */}
            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#736B63] mb-1.5">
                  اسمك في أُنس:
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="مثال: عبد الله"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D5] text-sm text-[#1F2421] focus:outline-none focus:border-[#2D6A4F]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {onResetToday && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('هل تود تصفير سجل اليوم لبدء متابعة جديدة من الصفر؟')) {
                        onResetToday();
                        setIsProfileModalOpen(false);
                      }
                    }}
                    className="text-xs text-[#A25A19] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>تصفير سجل اليوم (0%)</span>
                  </button>
                )}

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold hover:bg-[#1E4535] cursor-pointer"
                >
                  حفظ الاسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
