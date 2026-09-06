import React, { useState } from 'react';
import { Plus, Check, Trash2, Edit2, CheckCircle2, Circle, ListTodo, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { UserTask } from '../types';

interface DailyTasksCardProps {
  tasks: UserTask[];
  onAddTaskClick: () => void;
  onToggleTask: (taskId: string) => void;
  onEditTaskClick: (task: UserTask) => void;
  onDeleteTask: (taskId: string) => void;
  isCompact?: boolean; // For Home page preview
}

export const DailyTasksCard: React.FC<DailyTasksCardProps> = ({
  tasks,
  onAddTaskClick,
  onToggleTask,
  onEditTaskClick,
  onDeleteTask,
  isCompact = false,
}) => {
  const [showAllTasks, setShowAllTasks] = useState(false);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // If compact on Home, limit display to 4 items unless expanded
  const displayedTasks = isCompact && !showAllTasks ? tasks.slice(0, 4) : tasks;
  const hasMoreTasks = isCompact && tasks.length > 4;

  return (
    <div className="bg-white rounded-3xl border border-[#E8E2D5] shadow-xs p-5 sm:p-6 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-[#F0ECE1]">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-[#FAF0E6] text-[#A25A19] border border-[#E8D4BE]">
            <span className="text-lg">📝</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1F2421] flex items-center gap-2">
              <span>مهام اليوم</span>
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#736B63] border border-[#E8E2D5]">
                شخصية خاصة بك
              </span>
            </h3>
            <p className="text-xs text-[#857B72] mt-0.5">
              {totalTasks === 0
                ? 'نظم أولوياتك وخطط ليومك'
                : `${completedTasks} من ${totalTasks} مهام مكتملة (${completionPercentage}%)`}
            </p>
          </div>
        </div>

        {/* Add Task Button */}
        <button
          onClick={onAddTaskClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4535] active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
          title="إضافة مهمة جديدة لليوم"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مهمة</span>
        </button>
      </div>

      {/* Progress Bar (when tasks exist) */}
      {totalTasks > 0 && (
        <div className="pt-3 pb-2">
          <div className="flex items-center justify-between text-xs text-[#736B63] mb-1.5">
            <span className="font-medium">إنجاز مهام اليوم</span>
            <span className="font-bold text-[#2D6A4F]">{completedTasks} من {totalTasks} مهام مكتملة</span>
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
          <div className="py-7 px-4 text-center rounded-2xl bg-[#FAF7F2] border border-dashed border-[#E2DAD0] flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl shadow-xs border border-[#E8E2D5] mb-2.5">
              🌿
            </div>
            <p className="text-sm font-bold text-[#2C2825] mb-1">
              ما عندكش مهام لليوم لسه 🌿
            </p>
            <p className="text-xs text-[#736B63] max-w-xs mb-4">
              أضف أول مهمة وابدأ يومك مع أُنس.
            </p>
            <button
              onClick={onAddTaskClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4535] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
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

            {/* "عرض كل المهام" if tasks > 4 in compact mode */}
            {hasMoreTasks && (
              <div className="pt-1 text-center">
                <button
                  onClick={() => setShowAllTasks(!showAllTasks)}
                  className="text-xs font-bold text-[#2D6A4F] hover:text-[#1E4535] py-1.5 px-3 rounded-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>{showAllTasks ? 'إخفاء المهام الإضافية' : `عرض كل المهام (${tasks.length})`}</span>
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
