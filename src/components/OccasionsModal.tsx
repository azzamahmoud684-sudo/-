import React, { useState } from 'react';
import { X, Calendar, Clock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getUpcomingIslamicOccasions,
  formatDaysRemaining,
  formatGregorianDateArabic,
  IslamicOccasion,
} from '../utils/islamicOccasions';

interface OccasionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OccasionsModal: React.FC<OccasionsModalProps> = ({ isOpen, onClose }) => {
  const [occasions] = useState<IslamicOccasion[]>(() => getUpcomingIslamicOccasions());

  if (!isOpen) return null;

  const nearest = occasions[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[88vh] bg-[#FAF7F2] rounded-3xl border border-[#E8E2D5] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#E8E2D5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] text-[#A25A19] border border-[#E8D4BE] flex items-center justify-center text-xl shadow-xs">
              🌙
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Tajawal'] text-[#1F2421]">
                المناسبات الإسلامية ومواسم الخير
              </h3>
              <p className="text-xs text-[#736B63]">
                عدّ تنازلي للأيام الفاضلة والنفحات المباركة
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

        {/* Scrollable Occasions List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {nearest && (
            <div className="bg-gradient-to-br from-[#1E4535] to-[#2D6A4F] text-white rounded-2xl p-5 shadow-xs border border-[#1E4535]/30">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold text-emerald-100 mb-3 border border-white/20">
                <Sparkles className="w-3 h-3 text-emerald-200" />
                <span>أقرب مناسبة قادمة</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{nearest.icon}</span>
                  <div>
                    <h4 className="text-xl font-bold text-white font-['Tajawal']">
                      {nearest.name}
                    </h4>
                    <p className="text-xs text-emerald-100/90 mt-0.5">
                      {nearest.hijriDateText}
                    </p>
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <span className="inline-block px-3 py-1.5 rounded-xl bg-white text-[#1E4535] text-xs font-bold shadow-xs">
                    {formatDaysRemaining(nearest.daysRemaining)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-white/85 mt-3 leading-relaxed border-t border-white/15 pt-3">
                {nearest.description}
              </p>
              <div className="mt-2 text-[11px] text-emerald-200 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <span>{nearest.needsMoonSighting ? 'التاريخ المتوقع: ' : 'الموافق: '} {formatGregorianDateArabic(nearest.gregorianDate)}</span>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold text-[#8C827A] px-1">باقي المناسبات والمواسم:</h4>
            {occasions.slice(1).map((occ) => (
              <div
                key={occ.id}
                className="bg-white rounded-2xl p-4 border border-[#E8E2D5] shadow-xs flex flex-col gap-2 hover:border-[#2D6A4F]/30 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{occ.icon}</span>
                    <div>
                      <h5 className="text-sm font-bold text-[#1F2421]">{occ.name}</h5>
                      <span className="text-xs text-[#857B72]">{occ.hijriDateText}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-[#2D6A4F] text-xs font-bold shrink-0">
                    {formatDaysRemaining(occ.daysRemaining)}
                  </span>
                </div>
                <p className="text-xs text-[#736B63] leading-relaxed">
                  {occ.description}
                </p>
                <div className="text-[11px] text-[#A25A19] flex items-center gap-1 pt-1 border-t border-[#F5F2EB]">
                  <Calendar className="w-3 h-3" />
                  <span>{occ.needsMoonSighting ? 'المتوقع: ' : 'الموافق: '} {formatGregorianDateArabic(occ.gregorianDate)}</span>
                </div>
              </div>
            ))}
          </div>
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
