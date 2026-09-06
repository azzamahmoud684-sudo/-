import React, { useState, useEffect } from 'react';
import { Bell, Clock, ShieldCheck, Check, AlertCircle, Sparkles, Volume2, Smartphone } from 'lucide-react';
import { ReminderSetting } from '../types';

interface RemindersViewProps {
  reminders: ReminderSetting[];
  onUpdateReminders: (updated: ReminderSetting[]) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({ reminders, onUpdateReminders }) => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [inAppToastMessage, setInAppToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('unsupported');
    }
  }, []);

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          showNotification('أُنس 🌿', 'تم تفعيل التنبيهات بنجاح. أهلاً بك في رفيقك اليومي للعبادة 🤍');
        }
      } catch (err) {
        console.error('Error requesting notification permission:', err);
      }
    }
  };

  const showNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'ouns-reminder',
        });
      } catch (e) {
        // Fallback for environments with strict notification constructors
        triggerInAppToast(body);
      }
    } else {
      triggerInAppToast(body);
    }
  };

  const triggerInAppToast = (msg: string) => {
    setInAppToastMessage(msg);
    setTimeout(() => {
      setInAppToastMessage(null);
    }, 4500);
  };

  const handleToggleReminder = (id: string) => {
    const updated = reminders.map((r) => {
      if (r.id === id) {
        return { ...r, enabled: !r.enabled };
      }
      return r;
    });
    onUpdateReminders(updated);
  };

  const handleTimeChange = (id: string, newTime: string) => {
    const updated = reminders.map((r) => {
      if (r.id === id) {
        return { ...r, time: newTime };
      }
      return r;
    });
    onUpdateReminders(updated);
  };

  const handleTestNotification = (r: ReminderSetting) => {
    showNotification('تذكير من أُنس 🌿', r.message);
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* In-app Toast Banner */}
      {inAppToastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-[#1E4535] text-white p-4 rounded-2xl shadow-xl border border-[#74C69D]/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-2 rounded-xl bg-white/10 shrink-0">
            <Bell className="w-5 h-5 text-[#95D5B2]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#95D5B2]">تنبيه أُنس الذكي</p>
            <p className="text-sm font-medium mt-0.5">{inAppToastMessage}</p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold font-['Tajawal'] text-[#1F2421]">التذكيرات 🔔</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] font-bold">
                مركز التنبيهات
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#736B63] leading-relaxed">
              رسائل لطيفة وهادئة تُعينك على الذكر والطاعة دون تكلف أو إلحاح. اختر أوقاتك المفضلة لكل طاعة.
            </p>
          </div>

          {/* Permission Status */}
          <div>
            {notificationPermission === 'granted' ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#E8F5E9] text-[#2D6A4F] text-xs font-bold border border-[#C8E6C9]">
                <ShieldCheck className="w-4 h-4" />
                <span>إشعارات المتصفح مفعلة ✓</span>
              </div>
            ) : notificationPermission === 'unsupported' ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#FAF0E6] text-[#A25A19] text-xs font-medium border border-[#E8D4BE]">
                <Smartphone className="w-4 h-4" />
                <span>التنبيهات تعمل داخل التطبيق</span>
              </div>
            ) : (
              <button
                onClick={handleRequestPermission}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#2D6A4F] text-white hover:bg-[#1E4535] text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>تفعيل إشعارات المتصفح</span>
              </button>
            )}
          </div>
        </div>

        {/* Smart Respectful Tone Notice */}
        <div className="mt-5 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-start gap-2.5 text-xs text-[#554E46]">
          <Sparkles className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>تنبيهات أُنس الذكية: </strong>
            تستخدم عبارات رقيقة ومريحة تبث السكينة ولا تسبب الشعور بالذنب، لمساعدتك على استدامة العبادة برحابة قلب.
          </p>
        </div>
      </div>

      {/* Reminders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className={`rounded-3xl p-5 border transition-all ${
              reminder.enabled
                ? 'bg-white border-[#2D6A4F]/30 shadow-xs'
                : 'bg-[#FAF8F5] border-[#E8E2D5] opacity-75'
            }`}
          >
            {/* Top row: Title and Toggle */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    reminder.enabled ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]' : 'bg-[#E8E2D5] text-[#8C827A]'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1F2421]">{reminder.title}</h3>
                  <span className="text-[11px] text-[#736B63]">
                    {reminder.isPrayerTime ? 'تنبيه عند حلول الأذان' : `الوقت: ${reminder.time}`}
                  </span>
                </div>
              </div>

              {/* Custom Toggle Switch */}
              <button
                type="button"
                onClick={() => handleToggleReminder(reminder.id)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  reminder.enabled ? 'bg-[#2D6A4F]' : 'bg-[#D1C9BE]'
                }`}
                role="switch"
                aria-checked={reminder.enabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    reminder.enabled ? 'translate-x-0' : '-translate-x-5'
                  }`}
                />
              </button>
            </div>

            {/* Time Picker (for non-prayer times) */}
            {!reminder.isPrayerTime && (
              <div className="mb-3 pt-2 border-t border-[#F0ECE1] flex items-center justify-between text-xs">
                <label htmlFor={`time-${reminder.id}`} className="text-[#857B72] font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  <span>وقت التذكير المفضل:</span>
                </label>
                <input
                  id={`time-${reminder.id}`}
                  type="time"
                  disabled={!reminder.enabled}
                  value={reminder.time}
                  onChange={(e) => handleTimeChange(reminder.id, e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[#F8F6F0] border border-[#E8E2D5] text-xs font-mono font-bold text-[#2D6A4F] disabled:opacity-40 focus:outline-hidden focus:border-[#2D6A4F]"
                />
              </div>
            )}

            {/* Smart Message Preview */}
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs text-[#554E46] mb-3">
              <span className="text-[11px] font-semibold text-[#8C827A] block mb-0.5">نص التذكير:</span>
              <p className="italic text-[#1E4535] font-medium leading-relaxed">
                «{reminder.message}»
              </p>
            </div>

            {/* Test Notification Button */}
            <div className="flex justify-end">
              <button
                onClick={() => handleTestNotification(reminder)}
                className="flex items-center gap-1.5 text-xs text-[#2D6A4F] hover:text-[#1E4535] font-bold p-1 rounded-md hover:bg-[#F3EFE6] transition-colors cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>تجربة الإشعار الآن</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
