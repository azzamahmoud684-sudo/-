import React, { useState } from 'react';
import { X, BookOpen, Plus, Minus, CheckCircle2, Sparkles, BookMarked, Check } from 'lucide-react';
import { UserProgress } from '../types';

interface QuranModalProps {
  progress: UserProgress;
  onClose: () => void;
  onUpdatePages: (pages: number) => void;
  onNavigateToQuran?: () => void;
}

const SURAHS = [
  {
    id: 'mulk',
    name: 'سورة الملك (المنجية)',
    virtue: 'سورة ثلاثون آية شفعت لرجل حتى غفر له، وهي المانعة من عذاب القبر',
    estimatedPages: 2,
    verses: [
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ (1)',
      'الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ (2)',
      'الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ ۖ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ (3)',
      'ثُمَّ ارْجِعِ الْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ الْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ (4)',
      'وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ وَجَعَلْنَاهَا رُجُومًا لِّلشَّيَاطِينِ ۖ وَأَعْتَدْنَا لَهُمْ عَذَابَ السَّعِيرِ (5)',
      'وَلِلَّذِينَ كَفَرُوا بِرَبِّهِمْ عَذَابُ جَهَنَّمَ ۖ وَبِئْسَ الْمَصِيرُ (6)',
      'إِذَا أُلْقُوا فِيهَا سَمِعُوا لَهَا شَهِيقًا وَهِيَ تَفُورُ (7)',
      'تَكَادُ تَمَيَّزُ مِنَ الْغَيْظِ ۖ كُلَّمَا أُلْقِيَ فِيهَا فَوْجٌ سَأَلَهُمْ خَزَنَتُهَا أَلَمْ يَأْتِكُمْ نَذِيرٌ (8)',
      'قَالُوا بَلَىٰ قَدْ جَاءَنَا نَذِيرٌ فَكَذَّبْنَا وَقُلْنَا مَا نَزَّلَ اللَّهُ مِن شَيْءٍ إِنْ أَنتُمْ إِلَّا فِي ضَلَالٍ كَبِيرٍ (9)',
      'وَقَالُوا لَوْ كُنَّا نَسْمَعُ أَوْ نَعْقِلُ مَا كُنَّا فِي أَصْحَابِ السَّعِيرِ (10)',
      'فَاعْتَرَفُوا بِذَنبِهِمْ فَسُحْقًا لِّأَصْحَابِ السَّعِيرِ (11)',
      'إِنَّ الَّذِينَ يَخْشَوْنَ رَبَّهُم بِالْغَيْبِ لَهُم مَّغْفِرَةٌ وَأَجْرٌ كَبِيرٌ (12)',
    ],
  },
  {
    id: 'baqarah-end',
    name: 'خواتيم سورة البقرة',
    virtue: 'من قرأ بالآيتين من آخر سورة البقرة في ليلة كفتاه',
    estimatedPages: 1,
    verses: [
      'آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ (285)',
      'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ (286)',
    ],
  },
  {
    id: 'kahf-start',
    name: 'أوائل سورة الكهف',
    virtue: 'من حفظ عشر آيات من أول سورة الكهف عُصم من فتنة الدجال',
    estimatedPages: 1,
    verses: [
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      'الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا (1)',
      'قَيِّمًا لِّيُنذِرَ بَأْسًا شَدِيدًا مِّن لَّدُنْهُ وَيُبَشِّرَ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا حَسَنًا (2)',
      'مَّاكِثِينَ فِيهِ أَبَدًا (3)',
      'وَيُنذِرَ الَّذِينَ قَالُوا اتَّخَذَ اللَّهُ وَلَدًا (4)',
      'مَّا لَهُم بِهِ مِنْ عِلْمٍ وَلَا لِآبَائِهِمْ ۚ كَبُرَتْ كَلِمَةً تَخْرُجُ مِنْ أَفْوَاهِهِمْ ۚ إِن يَقُولُونَ إِلَّا كَذِبًا (5)',
    ],
  },
];

export const QuranModal: React.FC<QuranModalProps> = ({
  progress,
  onClose,
  onUpdatePages,
  onNavigateToQuran,
}) => {
  const [activeTab, setActiveTab] = useState<'tracker' | 'reader'>('tracker');
  const [selectedSurahId, setSelectedSurahId] = useState(SURAHS[0].id);

  // Local state for recording progress explicitly
  const [inputPages, setInputPages] = useState<number>(progress.quranPagesReadToday);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const selectedSurah = SURAHS.find((s) => s.id === selectedSurahId) || SURAHS[0];
  const goalPages = progress.quranGoalPages;
  const isGoalDone = inputPages >= goalPages;

  const handleSaveProgress = (pages: number) => {
    const valid = Math.max(0, pages);
    setInputPages(valid);
    onUpdatePages(valid);
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  const handleCompleteFullGoal = () => {
    handleSaveProgress(goalPages);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-[#FBF9F5] rounded-3xl border border-[#E8E2D5] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E2D5] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#B8860B]/10 text-[#B8860B] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1F2421]">ورد القرآن الكريم</h3>
              <p className="text-xs text-[#736B63]">«خيركم من تعلم القرآن وعلمه»</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F3EFE6] text-[#736B63] transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 py-2.5 bg-[#FAF7F2] border-b border-[#E8E2D5] flex items-center justify-center gap-2">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tracker'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'bg-white text-[#736B63] hover:bg-[#F3EFE6] border border-[#E8E2D5]'
            }`}
          >
            تسجيل ومتابعة الورد
          </button>
          <button
            onClick={() => setActiveTab('reader')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reader'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'bg-white text-[#736B63] hover:bg-[#F3EFE6] border border-[#E8E2D5]'
            }`}
          >
            قراءة السور اليومية المأثورة
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'tracker' ? (
            <div className="space-y-6">
              {/* Goal Progress Ring / Card */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs text-center">
                <span className="text-xs font-semibold text-[#857B72]">تسجيل الصفحات المقروءة فعلياً اليوم</span>

                {/* Counter Stepper */}
                <div className="my-5 flex items-center justify-center gap-4">
                  <button
                    onClick={() => handleSaveProgress(Math.max(0, inputPages - 1))}
                    className="w-11 h-11 rounded-2xl bg-[#F3EFE6] text-[#403B36] hover:bg-[#E8E2D5] flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                    title="نقصان صفحة"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <div className="flex flex-col items-center">
                    <span className="text-5xl sm:text-6xl font-bold font-mono text-[#1F2421]">
                      {inputPages}
                    </span>
                    <span className="text-xs text-[#736B63] mt-1">
                      صفحات من هدف اليوم ({goalPages})
                    </span>
                  </div>

                  <button
                    onClick={() => handleSaveProgress(inputPages + 1)}
                    className="w-11 h-11 rounded-2xl bg-[#2D6A4F] text-white hover:bg-[#1E4535] flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-xs"
                    title="زيادة صفحة"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Add Buttons */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <button
                    onClick={() => handleSaveProgress(inputPages + 1)}
                    className="px-3 py-1.5 rounded-xl bg-[#F8F6F0] hover:bg-[#F0ECE1] border border-[#E8E2D5] text-xs font-bold text-[#403B36] cursor-pointer"
                  >
                    +1 صفحة
                  </button>
                  <button
                    onClick={() => handleSaveProgress(inputPages + 2)}
                    className="px-3 py-1.5 rounded-xl bg-[#F8F6F0] hover:bg-[#F0ECE1] border border-[#E8E2D5] text-xs font-bold text-[#403B36] cursor-pointer"
                  >
                    +2 صفحتان
                  </button>
                  <button
                    onClick={() => handleSaveProgress(inputPages + 4)}
                    className="px-3 py-1.5 rounded-xl bg-[#F8F6F0] hover:bg-[#F0ECE1] border border-[#E8E2D5] text-xs font-bold text-[#403B36] cursor-pointer"
                  >
                    +4 صفحات
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-xs mx-auto h-3 bg-[#F3EFE6] rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-[#D4A373] to-[#B8860B] rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (inputPages / goalPages) * 100)}%`,
                    }}
                  />
                </div>

                {/* Percentage readout */}
                <div className="text-xs font-bold text-[#B8860B] mb-4">
                  {Math.min(100, Math.round((inputPages / goalPages) * 100))}% من الورد اليومي
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => handleSaveProgress(inputPages)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4535] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>سجّل التقدم ({inputPages} صفحة)</span>
                  </button>

                  <button
                    onClick={handleCompleteFullGoal}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#FAF0E6] hover:bg-[#F3E3D3] text-[#A25A19] border border-[#E8D4BE] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم إنجاز الورد كاملاً ({goalPages} صفحات) ✓</span>
                  </button>
                </div>

                {showSavedFeedback && (
                  <p className="text-xs text-[#2D6A4F] font-bold mt-3 animate-fade-in">
                    تم تسجيل قراءتك بنجاح في سجل اليوم ✓
                  </p>
                )}
              </div>

              {/* Quick info note */}
              <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E8E2D5] text-xs text-[#6B5A4B] leading-relaxed">
                <strong>تنويه المتابعة:</strong> لا يتم احتساب أي صفحة بمجرد فتح المصحف أو مرور الوقت؛ يتم التسجيل بناءً على قراءتك الفعلية وضغطك على أزرار التسجيل.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Surah Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {SURAHS.map((surah) => (
                  <button
                    key={surah.id}
                    onClick={() => setSelectedSurahId(surah.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedSurahId === surah.id
                        ? 'bg-[#2D6A4F] text-white shadow-xs'
                        : 'bg-white text-[#736B63] hover:bg-[#F3EFE6] border border-[#E8E2D5]'
                    }`}
                  >
                    {surah.name}
                  </button>
                ))}
              </div>

              {/* Virtue Note */}
              <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E8E2D5] text-xs text-[#554E46] flex items-center justify-between gap-3">
                <div>
                  <strong className="text-[#2D6A4F]">الفضل: </strong>
                  {selectedSurah.virtue}
                </div>

                <button
                  onClick={() => handleSaveProgress(inputPages + selectedSurah.estimatedPages)}
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold hover:bg-[#1E4535] cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>سجّل قراءة هذه السورة (+{selectedSurah.estimatedPages} صفحة)</span>
                </button>
              </div>

              {/* Verses Container */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E2D5] shadow-xs space-y-4">
                {selectedSurah.verses.map((verse, idx) => (
                  <p
                    key={idx}
                    className={`font-['Amiri'] text-lg sm:text-xl text-[#1F2421] leading-[2.4] text-center ${
                      idx === 0 && verse.includes('بِسْمِ اللَّهِ') ? 'text-[#2D6A4F] font-bold text-xl sm:text-2xl pb-2' : ''
                    }`}
                  >
                    {verse}
                  </p>
                ))}
              </div>

              {onNavigateToQuran && (
                <div className="pt-2 text-center">
                  <button
                    onClick={onNavigateToQuran}
                    className="w-full py-3 rounded-2xl bg-[#FAF7F2] hover:bg-[#F3EFE6] border border-[#E8E2D5] text-xs font-bold text-[#2D6A4F] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>تصفح وقراءة كافة سور القرآن الكريم كاملة (114 سورة) بالرسم العثماني ←</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E8E2D5] flex items-center justify-between">
          <span className="text-xs text-[#8C827A]">«اقرؤوا القرآن فإنه يأتي يوم القيامة شفيعاً لأصحابه»</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold hover:bg-[#1E4535] cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
