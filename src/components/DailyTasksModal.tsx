import React from 'react';
import { X, Plus, CheckCircle2 } from 'lucide-react';
import { DailyTasksCard } from './DailyTasksCard';
import { UserTask } from '../types';

interface DailyTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: UserTask[];
  onAddTaskClick: () => void;
  onToggleTask: (taskId: string) => void;
  onEditTaskClick: (task: UserTask) => void;
  onDeleteTask: (taskId: string) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  availableDates: string[];
}

export const DailyTasksModal: React.FC<DailyTasksModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onAddTaskClick,
  onToggleTask,
  onEditTaskClick,
  onDeleteTask,
  selectedDate,
  onSelectDate,
  availableDates,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] bg-[#FAF7F2] rounded-3xl border border-[#E8E2D5] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#E8E2D5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center text-xl">
              📝
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Tajawal'] text-[#1F2421]">
                مهامي اليومية
              </h3>
              <p className="text-xs text-[#736B63]">
                تنظيم الطاعات والمهام الخاصة بك بكل يسر
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F3EFE6] text-[#8C827A] transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <DailyTasksCard
            tasks={tasks}
            onAddTaskClick={onAddTaskClick}
            onToggleTask={onToggleTask}
            onEditTaskClick={onEditTaskClick}
            onDeleteTask={onDeleteTask}
            isCompact={false}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            availableDates={availableDates}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#E8E2D5] text-center shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#2D6A4F] text-white text-sm font-bold hover:bg-[#1E4535] transition-colors cursor-pointer shadow-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
