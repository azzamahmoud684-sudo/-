import React from 'react';
import { ChevronLeft } from 'lucide-react';

export interface DashboardCardItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
}

interface HomeDashboardGridProps {
  cards: DashboardCardItem[];
}

export const HomeDashboardGrid: React.FC<HomeDashboardGridProps> = ({ cards }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          id={`dashboard-card-${card.id}`}
          onClick={card.onClick}
          className="bg-white rounded-3xl p-5 border border-[#E8E2D5] shadow-xs hover:border-[#2D6A4F]/40 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between min-h-[128px] active:scale-[0.99]"
        >
          {/* Top Row: Icon + Title + Arrow */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center shrink-0 text-2xl group-hover:scale-105 transition-transform shadow-2xs">
                {card.icon}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-['Tajawal'] text-[#1F2421] group-hover:text-[#2D6A4F] transition-colors">
                  {card.title}
                </h3>
                {card.badge && (
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#736B63] border border-[#E8E2D5] mt-0.5 font-medium">
                    {card.badge}
                  </span>
                )}
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#8C827A] flex items-center justify-center group-hover:text-[#2D6A4F] group-hover:translate-x-[-2px] transition-all shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </div>
          </div>

          {/* Bottom: Short single sentence description */}
          <p className="text-xs text-[#736B63] mt-3 leading-relaxed font-normal">
            {card.description}
          </p>
        </div>
      ))}
    </div>
  );
};
