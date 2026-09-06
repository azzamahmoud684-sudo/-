import React, { useState } from 'react';
import { HeartHandshake, ExternalLink, ShieldCheck, Sparkles, Filter, Utensils, Droplets, HeartPulse, Home, GraduationCap, Landmark, HandHelping } from 'lucide-react';
import { CHARITY_CATEGORIES, TRUSTED_CHARITIES } from '../data/charityData';

export const CharitySection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Utensils':
        return Utensils;
      case 'Droplets':
        return Droplets;
      case 'HeartPulse':
        return HeartPulse;
      case 'Home':
        return Home;
      case 'GraduationCap':
        return GraduationCap;
      case 'Landmark':
        return Landmark;
      case 'HandHelping':
        return HandHelping;
      default:
        return Sparkles;
    }
  };

  const filteredCharities = selectedCategory === 'all'
    ? TRUSTED_CHARITIES
    : TRUSTED_CHARITIES.filter((c) => {
        const catObj = CHARITY_CATEGORIES.find((cat) => cat.id === selectedCategory);
        return catObj ? c.category === catObj.name : true;
      });

  return (
    <div className="space-y-6">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2D6A4F] to-[#1E4535] text-white p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold text-[#D8F3DC] mb-3 backdrop-blur-xs border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>باب الخير 🤍</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-['Tajawal'] tracking-tight mb-2">
            «اجعل لليوم أثرًا 🤍»
          </h2>

          <p className="text-sm sm:text-base text-white/90 leading-relaxed font-normal">
            إن أحببت أن تجعل ليومك أثرًا آخر، يمكنك المساهمة في أحد أبواب الخير عبر الجهات الرسمية المعتمدة. الصدقة تطفئ الخطيئة وتظل صاحبها يوم القيامة.
          </p>
        </div>
      </div>

      {/* Strict Transparency & No-Collection Disclaimer Banner */}
      <div className="bg-[#FAF7F2] rounded-2xl p-4.5 border border-[#E8D4BE] text-xs text-[#554E46] flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-[#2D6A4F] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold text-[#1F2421] block mb-0.5">
            تنويه أمان وشفافية تامّة:
          </strong>
          تطبيق أُنس لا يقوم بجمع أو استلام أو معالجة أي تبرعات مالية على الإطلاق، ولا يطلب بيانات دفع. زر «تبرع الآن» ينقلك مباشرة إلى بوابة التبرع الرسمية والمعتمدة لكل جمعية ومؤسسة خيرية مرخصة.
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CHARITY_CATEGORIES.map((cat) => {
          const Icon = getCategoryIcon(cat.icon);
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'bg-white text-[#736B63] hover:bg-[#F3EFE6] border border-[#E8E2D5]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Charities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCharities.map((charity) => {
          const Icon = getCategoryIcon(charity.categoryIcon);
          return (
            <div
              key={charity.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D5] shadow-xs flex flex-col justify-between hover:border-[#2D6A4F]/40 transition-all"
            >
              <div>
                {/* Category & Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] bg-[#2D6A4F]/10 px-2.5 py-1 rounded-full">
                    <Icon className="w-3.5 h-3.5" />
                    {charity.category}
                  </span>
                  {charity.verifiedBadge && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#736B63] bg-[#F8F6F0] px-2 py-0.5 rounded-md border border-[#E8E2D5]">
                      <ShieldCheck className="w-3 h-3 text-[#2D6A4F]" />
                      جهة رسمية معتمدة
                    </span>
                  )}
                </div>

                {/* Organization Name & Cause */}
                <h3 className="text-lg font-bold text-[#1F2421] mb-1">{charity.orgName}</h3>
                <h4 className="text-xs font-bold text-[#A25A19] mb-2">{charity.causeTitle}</h4>
                <p className="text-xs text-[#736B63] leading-relaxed mb-4">
                  {charity.shortDescription}
                </p>
              </div>

              {/* Action Button: Donate Now opening external official site */}
              <div className="pt-3 border-t border-[#F0ECE1] flex items-center justify-between">
                <span className="text-[11px] text-[#8C827A]">عبر الموقع الرسمي</span>
                <a
                  href={charity.donationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4535] active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <span>تبرع الآن</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
