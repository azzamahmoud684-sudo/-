import React, { useState } from 'react';
import {
  Plus,
  Check,
  Trash2,
  Edit2,
  Calendar,
  ChevronDown,
  ChevronUp,
  History,
  RotateCcw,
} from 'lucide-react';
import { UserTask } from '../types';
import { getTodayDateString } from '../utils/storage';

interface DailyTasksCardProps {
  tasks: UserTask[];
  onAddTaskClick: () => void;
  onToggleTask: (taskId: string) => void;
  onEditTaskClick: (task: UserTask) => void;
  onDeleteTask: (taskId: string) => void;
  isCompact?: boolean; // For Home page preview
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  availableDates?: string[];
}

export const DailyTasksCard: React.FC<DailyTasksCardProps> = ({
  tasks,
  onAddTaskClick,
  onToggleTask,
  onEditTaskClick,
  onDeleteTask,
  isCompact = false,
  selectedDate = getTodayDateString(),
  onSelectDate,
  availableDates = [],
}) => {
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] = useState(false);

  const todayStr = getTodayDateString();
  const isToday = selectedDate === todayStr;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // If compact on Home, limit display to 4 items unless expanded
  const displayedTasks = isCompact && !showAllTasks ? tasks.slice(0, 4) : tasks;
  const hasMoreTasks = isCompact && tasks.length > 4;

  const formatDateDisplay = (dateStr: string) => {
    if (dateStr === todayStr) return 'اليوم';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return new Intl.DateTimeFormat('ar-EG', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }).format(d);
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E8E2D5] shadow-xs p-5 sm:p-6 transition-all">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#F0ECE1]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#FAF0E6] text-[#A25A19] border border-[#E8D4BE] shrink-0">
            <span className="text-xl">📝</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[#1F2421]">
                {isToday ? 'مهام اليوم 📝' : `مهام ${formatDateDisplay(selectedDate)} 📝`}
              </h3>
              {!isToday && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FAF0E6] text-[#A25A19] font-medium border border-[#E8D4BE]">
                  سجل سابق
                </span>
              )}
            </div>
            <p className="text-xs text-[#857B72] mt-0.5 font-medium">
              {totalTasks === 0
                ? isToday
                  ? 'ما عندكش مهام لليوم لسه'
                  : 'لا توجد مهام مسجلة لهذا اليوم'
                : `${completedTasks} من ${totalTasks} مكتملة`}
            </p>
          </div>
        </div>

        {/* Action Controls & Date Switcher */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* History selector if available */}
          {availableDates.length > 1 && onSelectDate && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsHistoryDropdownOpen(!isHistoryDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFE6] border border-[#E8E2D5] text-xs font-semibold text-[#6A635B] transition-colors cursor-pointer"
                title="تصفح سجل الأيام السابقة"
              >
                <History className="w-3.5 h-3.5 text-[#A25A19]" />
                <span>{isToday ? 'السجل' : formatDateDisplay(selectedDate)}</span>
                <ChevronDown className="w-3 h-3 text-[#857B72]" />
              </button>

              {isHistoryDropdownOpen && (
                <div className="absolute left-0 sm:right-0 top-full mt-1.5 w-44 bg-white rounded-2xl border border-[#E8E2D5] shadow-lg py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[11px] font-bold text-[#857B72] border-b border-[#F0ECE1]">
                    سجل المهام
                  </div>
                  {availableDates.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        onSelectDate(d);
                        setIsHistoryDropdownOpen(false);
                      }}
                      className={`w-full text-right px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF7F2] transition-colors cursor-pointer ${
                        selectedDate === d ? 'text-[#2D6A4F] font-bold bg-[#FAF7F2]' : 'text-[#6A635B]'
                      }`}
                    >
                      <span>{formatDateDisplay(d)}</span>
                      {d === todayStr && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#2D6A4F]">
                          اليوم
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isToday && onSelectDate && (
            <button
              type="button"
              onClick={() => onSelectDate(todayStr)}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#E8F5E9] hover:bg-[#D8EEDC] text-[#2D6A4F] text-xs font-bold transition-all cursor-pointer"
              title="العودة لمهام اليوم"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>اليوم</span>
            </button>
          )}

          {/* Add Task Button */}
          <button
            onClick={onAddTaskClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4535] active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
            title="إضافة مهمة جديدة"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة مهمة</span>
          </button>
        </div>
      </div>

      {/* Progress Bar (when tasks exist) */}
      {totalTasks > 0 && (
        <div className="pt-3 pb-2">
          <div className="flex items-center justify-between text-xs text-[#736B63] mb-1.5 font-medium">
            <span>Progress: {completedTasks} من {totalTasks} مهام مكتملة</span>
            <span className="font-bold text-[#2D6A4F]">{completionPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8E2D5]/60">
            <div
              className="h-full bg-gradient-to-r from-[#52B788] to-[#2D6A4F] rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="mt-3">
        {totalTasks === 0 ? (
          /* Empty State - Exact copy requested */
          <div className="py-8 px-4 text-center rounded-2xl bg-[#FAF7F2] border border-dashed border-[#E2DAD0] flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-xs border border-[#E8E2D5] mb-2.5">
              🌿
            </div>
            <p className="text-sm font-bold text-[#2C2825] mb-1">
              ما عندكش مهام لليوم لسه 🌿
            </p>
            <p className="text-xs text-[#736B63] max-w-xs mb-4 leading-relaxed">
              أضف أول مهمة وابدأ يومك مع أُنس.
            </p>
            <button
              onClick={onAddTaskClick}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4535] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة مهمة</span>
            </button>
          </div>
        ) : (
          /* Task List */
          <div className="space-y-2">
            {displayedTasks.map((task) => (
              <div
                key={task.id}
                className={`group flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                  task.completed
                    ? 'bg-[#F7F9F7] border-[#D8E6DF] text-[#6A736E]'
                    : 'bg-[#FAF7F2] hover:bg-white border-[#E8E2D5] hover:border-[#2D6A4F]/30 text-[#1F2421]'
                }`}
              >
                {/* Checkbox & Task Text */}
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  className="flex items-center gap-3 text-right flex-1 cursor-pointer select-none"
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      task.completed
                        ? 'bg-[#2D6A4F] text-white'
                        : 'border-2 border-[#A89F95] group-hover:border-[#2D6A4F] bg-white'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[2.8]" />}
                  </div>
                  <span
                    className={`text-sm leading-relaxed ${
                      task.completed ? 'line-through text-[#857B72] font-normal' : 'font-medium'
                    }`}
                  >
                    {task.text}
                  </span>
                </button>

                {/* Actions: Edit & Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onEditTaskClick(task)}
                    className="p-1.5 rounded-lg text-[#857B72] hover:text-[#2D6A4F] hover:bg-white transition-colors cursor-pointer"
                    title="تعديل المهمة"
                    aria-label="تعديل المهمة"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 rounded-lg text-[#857B72] hover:text-[#C84B31] hover:bg-white transition-colors cursor-pointer"
                    title="حذف المهمة"
                    aria-label="حذف المهمة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* "عرض الكل" if tasks > 4 in compact mode */}
            {hasMoreTasks && (
              <div className="pt-1.5 text-center">
                <button
                  onClick={() => setShowAllTasks(!showAllTasks)}
                  className="text-xs font-bold text-[#2D6A4F] hover:text-[#1E4535] py-1.5 px-3.5 rounded-xl hover:bg-[#FAF7F2] border border-transparent hover:border-[#E8E2D5] transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>{showAllTasks ? 'عرض أقل' : `عرض الكل (${tasks.length})`}</span>
                  {showAllTasks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
