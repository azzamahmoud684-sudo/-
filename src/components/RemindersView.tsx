import React from 'react';
import { Bell, Clock, Sparkles } from 'lucide-react';
import { ReminderSetting } from '../types';

interface RemindersViewProps {
  reminders: ReminderSetting[];
  onUpdateReminders: (updated: ReminderSetting[]) => void;
  coordinates?: { lat: number; lng: number } | null;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  onUpdateReminders,
}) => {
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center shrink-0 text-xl">
            🌿
          </div>
          <div>
            <h2 className="text-xl font-bold font-['Tajawal'] text-[#1F2421]">
              التذكيرات اليومية 🤍
            </h2>
            <p className="text-xs sm:text-sm text-[#736B63] mt-0.5 leading-relaxed">
              جدول التنبيهات اليومية لمواقيت الصلاة، وأذكار الصباح والمساء، والسنن.
            </p>
          </div>
        </div>

        {/* Info Callout */}
        <div className="mt-4 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-start gap-2.5 text-xs text-[#554E46]">
          <Sparkles className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>تذكيرات أُنس: </strong>
            تستخدم عبارات رقيقة ومريحة تبث السكينة في النفس ولا تسبب الشعور بالذنب، لمساعدتك على استدامة العبادة برحابة قلب.
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
                    reminder.enabled
                      ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]'
                      : 'bg-[#E8E2D5] text-[#8C827A]'
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
                <label
                  htmlFor={`time-${reminder.id}`}
                  className="text-[#857B72] font-medium flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  <span>وقت التذكير:</span>
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
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs text-[#554E46]">
              <span className="text-[11px] font-semibold text-[#8C827A] block mb-0.5">
                نص التذكير:
              </span>
              <p className="italic text-[#1E4535] font-medium leading-relaxed">
                «{reminder.message}»
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
