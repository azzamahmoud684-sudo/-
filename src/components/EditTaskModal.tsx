import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { UserTask } from '../types';

interface EditTaskModalProps {
  task: UserTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, newText: string) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
}) => {
  const [editText, setEditText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task && isOpen) {
      setEditText(task.text);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return;
    onSave(task.id, editText.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-[#E8E2D5] shadow-2xl p-5 sm:p-6 relative animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1] mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✏️</span>
            <h3 className="text-base font-bold text-[#1F2421]">تعديل المهمة</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#F3EFE6] text-[#736B63] transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#736B63] mb-1.5">
              نص المهمة:
            </label>
            <input
              ref={inputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="اكتب مهمة اليوم..."
              className="w-full px-4 py-3 rounded-2xl border border-[#E8E2D5] text-sm text-[#1F2421] placeholder-[#A0988F] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:border-[#2D6A4F] transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E8E2D5] text-xs font-semibold text-[#6A635B] hover:bg-[#F3EFE6] transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!editText.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4535] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>حفظ التعديل</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
