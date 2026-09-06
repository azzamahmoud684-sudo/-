import React from 'react';
import { Home, Clock, BookOpen, Sparkles, HeartHandshake, Award } from 'lucide-react';

export type NavTab = 'home' | 'timeline' | 'quran' | 'adhkar' | 'charity' | 'progress' | 'reminders';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'timeline', label: 'يومك', icon: Clock },
    { id: 'quran', label: 'القرآن', icon: BookOpen },
    { id: 'adhkar', label: 'الأذكار', icon: Sparkles },
    { id: 'charity', label: 'باب الخير', icon: HeartHandshake },
    { id: 'progress', label: 'تقدمي', icon: Award },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-lg border-t border-[#E8E2D5] px-2 py-2 safe-area-inset-bottom shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer select-none min-w-[54px] ${
                isActive
                  ? 'text-[#1E4535] font-bold'
                  : 'text-[#857B72] hover:text-[#403B36] font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-[#2D6A4F]/12 scale-105' : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span className={`text-[11px] mt-0.5 whitespace-nowrap ${isActive ? 'font-bold text-[#1E4535]' : 'font-normal'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
