import React, { useState, useEffect, useId } from 'react';
import { SeerahEvent } from '../types/seerah';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  PenLine,
  Check,
  Share2,
} from 'lucide-react';

interface SeerahJourneyViewerProps {
  event: SeerahEvent;
  nextEvent?: SeerahEvent;
  isCompleted: boolean;
  userReflection?: string;
  onComplete: () => void;
  onSaveReflection: (text: string) => void;
  onBackToTimeline: () => void;
  onGoToNextEvent?: () => void;
}

export const SeerahJourneyViewer: React.FC<SeerahJourneyViewerProps> = ({
  event,
  nextEvent,
  isCompleted,
  userReflection = '',
  onComplete,
  onSaveReflection,
  onBackToTimeline,
  onGoToNextEvent,
}) => {
  // Step state:
  // -1: Intro/Cover
  // 0 .. scenes.length - 1: Scenes (may be interrupted by interactive question if triggered)
  // 'question': when currently showing interactive question
  // 'reflection': end reflection & completion step
  const [currentStep, setCurrentStep] = useState<number | 'question' | 'reflection'>(-1);
  const [hasAnsweredQuestion, setHasAnsweredQuestion] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [reflectionText, setReflectionText] = useState(userReflection);
  const [isSavedReflectionNotice, setIsSavedReflectionNotice] = useState(false);
  const [justCompletedToast, setJustCompletedToast] = useState(false);

  // Sync reflection text when event changes
  useEffect(() => {
    setCurrentStep(-1);
    setHasAnsweredQuestion(false);
    setSelectedOptionIndex(null);
    setReflectionText(userReflection || '');
    setIsSavedReflectionNotice(false);
    setJustCompletedToast(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [event.id, userReflection]);

  const totalScenes = event.scenes.length;

  const handleStartJourney = () => {
    setCurrentStep(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextScene = () => {
    if (typeof currentStep === 'number') {
      // Check if there is an interactive question after this scene and not yet answered
      if (
        event.interactiveQuestion &&
        event.interactiveQuestion.triggerAfterSceneIndex === currentStep &&
        !hasAnsweredQuestion
      ) {
        setCurrentStep('question');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (currentStep < totalScenes - 1) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Reached end -> Reflection step
        setCurrentStep('reflection');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevScene = () => {
    if (currentStep === 'reflection') {
      setCurrentStep(totalScenes - 1);
    } else if (currentStep === 'question') {
      setCurrentStep(event.interactiveQuestion?.triggerAfterSceneIndex ?? 0);
    } else if (typeof currentStep === 'number') {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      } else {
        setCurrentStep(-1);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectOption = (index: number) => {
    if (selectedOptionIndex !== null) return; // already answered
    setSelectedOptionIndex(index);
    setHasAnsweredQuestion(true);
  };

  const handleContinueAfterQuestion = () => {
    const nextSceneIndex = (event.interactiveQuestion?.triggerAfterSceneIndex ?? 0) + 1;
    if (nextSceneIndex < totalScenes) {
      setCurrentStep(nextSceneIndex);
    } else {
      setCurrentStep('reflection');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveUserReflection = () => {
    onSaveReflection(reflectionText);
    setIsSavedReflectionNotice(true);
    setTimeout(() => setIsSavedReflectionNotice(false), 3000);
  };

  const handleUserClickComplete = () => {
    onComplete();
    setJustCompletedToast(true);
  };

  // Determine current active index for progress bar
  const currentSceneNumber = typeof currentStep === 'number' && currentStep >= 0 ? currentStep + 1 : currentStep === 'reflection' ? totalScenes : 1;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3 bg-white border border-[#E8E2D5] rounded-2xl px-4 py-3 shadow-xs">
        <button
          id="btn-seerah-back-timeline"
          onClick={onBackToTimeline}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1E4535] hover:text-[#2D6A4F] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
          <span>خط السيرة المباركة</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#1E4535] font-bold border border-[#2D6A4F]/20">
            {event.eraLabel} • المحطة {event.number} من 18
          </span>
          {isCompleted && (
            <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              أُتمّت
            </span>
          )}
        </div>
      </div>

      {/* Progress Track (visible during scenes & reflection) */}
      {currentStep !== -1 && (
        <div className="bg-white border border-[#E8E2D5] rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#736B63]">
            <span className="font-bold text-[#1E4535]">
              {currentStep === 'reflection'
                ? 'الوقفة الختامية والتأمل'
                : currentStep === 'question'
                ? 'توقف لحظة 🤍'
                : `الجزء ${currentSceneNumber} من ${totalScenes}`}
            </span>
            <span className="text-[11px] text-[#8C827A] font-medium">{event.title}</span>
          </div>

          {/* Connected Track Dots: ●━━━━●━━━━○━━━━○━━━━○ */}
          <div className="flex items-center justify-between gap-1 pt-1">
            {event.scenes.map((sc, idx) => {
              const isPastOrCurrent =
                currentStep === 'reflection' ||
                (typeof currentStep === 'number' && currentStep >= idx) ||
                (currentStep === 'question' && (event.interactiveQuestion?.triggerAfterSceneIndex ?? 0) >= idx);
              const isCurrent = typeof currentStep === 'number' && currentStep === idx;

              return (
                <React.Fragment key={sc.id}>
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all shrink-0 ${
                      isCurrent
                        ? 'bg-[#1E4535] text-white ring-4 ring-[#2D6A4F]/20 scale-110'
                        : isPastOrCurrent
                        ? 'bg-[#2D6A4F] text-white'
                        : 'bg-[#E8E2D5] text-[#8C827A]'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {idx < event.scenes.length - 1 && (
                    <div
                      className={`flex-1 h-1 rounded-full transition-all ${
                        isPastOrCurrent && !(isCurrent && idx === currentStep)
                          ? 'bg-[#2D6A4F]'
                          : 'bg-[#E8E2D5]'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. COVER / INTRO STEP */}
      {currentStep === -1 && (
        <div className="bg-white border border-[#E8E2D5] rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-6 relative overflow-hidden">
          {/* Subtle Islamic decorative background badge */}
          <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-[#1E4535] via-[#2D6A4F] to-[#D4AF37]" />

          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center text-4xl shadow-inner mt-2">
            {event.icon}
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E8E2D5] text-xs font-semibold text-[#736B63]">
              <span>{event.timeframe}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Tajawal'] text-[#1F2421]">
              {event.title}
            </h2>
            <p className="text-sm sm:text-base text-[#2D6A4F] font-semibold">{event.subtitle}</p>
          </div>

          <div className="bg-[#FAF7F2] border border-[#E8E2D5] rounded-2xl p-5 max-w-xl mx-auto">
            <p className="text-sm sm:text-base text-[#4A443E] leading-relaxed font-normal">
              {event.teaser}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="btn-seerah-start-journey"
              onClick={handleStartJourney}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#1E4535] to-[#2D6A4F] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>ابدأ الرحلة</span>
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <p className="text-[11px] text-[#8C827A] pt-2">
            محتوى موثق مبني على: {event.source}
          </p>
        </div>
      )}

      {/* 2. SCENE CARDS */}
      {typeof currentStep === 'number' && currentStep >= 0 && (
        <div className="bg-white border border-[#E8E2D5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 relative">
          {/* Scene Header */}
          <div className="flex items-center justify-between gap-3 border-b border-[#F0EBE1] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#2D6A4F]/10 text-[#1E4535] font-bold text-xs flex items-center justify-center">
                {currentStep + 1}
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1F2421]">
                  {event.scenes[currentStep]?.title || event.title}
                </h3>
                {event.scenes[currentStep]?.badge && (
                  <span className="text-[11px] text-[#736B63] font-medium">
                    {event.scenes[currentStep].badge}
                  </span>
                )}
              </div>
            </div>

            <div className="text-2xl">{event.icon}</div>
          </div>

          {/* Scene Body Narrative */}
          <div className="py-2">
            <p className="text-base sm:text-lg text-[#2C2825] leading-[1.85] font-normal tracking-wide">
              {event.scenes[currentStep]?.text}
            </p>
          </div>

          {/* Scene Quote (if any) */}
          {event.scenes[currentStep]?.quote && (
            <div className="bg-[#FAF7F2] border-r-4 border-[#2D6A4F] rounded-2xl p-4 sm:p-5 space-y-1.5">
              <p className="text-sm sm:text-base font-['Amiri'] text-[#1E4535] font-bold leading-relaxed">
                «{event.scenes[currentStep].quote?.text}»
              </p>
              {event.scenes[currentStep].quote?.narrator && (
                <p className="text-[11px] text-[#8C827A] font-medium text-left">
                  — {event.scenes[currentStep].quote?.narrator}
                </p>
              )}
            </div>
          )}

          {/* Scene Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#F0EBE1] gap-3">
            <button
              id="btn-seerah-prev-scene"
              onClick={handlePrevScene}
              className="px-4 py-2.5 rounded-xl border border-[#E8E2D5] text-[#736B63] hover:text-[#1F2421] text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <button
              id="btn-seerah-next-scene"
              onClick={handleNextScene}
              className="px-6 py-2.5 rounded-xl bg-[#1E4535] hover:bg-[#2D6A4F] text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            >
              <span>{currentStep === totalScenes - 1 ? 'الوقفة الختامية' : 'ماذا حدث بعد ذلك؟'}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. INTERACTIVE QUESTION ("توقف لحظة 🤍") */}
      {currentStep === 'question' && event.interactiveQuestion && (
        <div className="bg-white border border-[#E8E2D5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-center gap-2 text-[#2D6A4F] font-bold text-base sm:text-lg">
            <span>✨</span>
            <span>{event.interactiveQuestion.prompt}</span>
            <span>✨</span>
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-lg sm:text-xl font-bold font-['Tajawal'] text-[#1F2421]">
              {event.interactiveQuestion.question}
            </h3>
            <p className="text-xs text-[#736B63]">
              اختر الإجابة واستكشف المعلومة الصحيحة برفق:
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {event.interactiveQuestion.options.map((option, idx) => {
              const isSelected = selectedOptionIndex === idx;
              const isCorrect = idx === event.interactiveQuestion?.correctIndex;
              let styleClass = 'bg-[#FAF7F2] border-[#E8E2D5] text-[#2C2825] hover:border-[#2D6A4F]/60';

              if (selectedOptionIndex !== null) {
                if (isCorrect) {
                  styleClass = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold shadow-xs';
                } else if (isSelected && !isCorrect) {
                  styleClass = 'bg-rose-50 border-rose-300 text-rose-800 line-through';
                } else {
                  styleClass = 'bg-[#FAF7F2] border-[#E8E2D5] text-[#8C827A] opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  id={`btn-seerah-option-${idx}`}
                  disabled={selectedOptionIndex !== null}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 rounded-2xl border-2 text-center text-sm sm:text-base transition-all cursor-pointer font-semibold ${styleClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Explanation upon answering */}
          {selectedOptionIndex !== null && (
            <div className="bg-[#FAF7F2] border border-[#2D6A4F]/20 rounded-2xl p-4 sm:p-5 space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E4535]">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>إضاءة سريعة</span>
              </div>
              <p className="text-xs sm:text-sm text-[#4A443E] leading-relaxed">
                {event.interactiveQuestion.explanation}
              </p>

              <div className="pt-3 text-center">
                <button
                  id="btn-seerah-continue-after-q"
                  onClick={handleContinueAfterQuestion}
                  className="px-6 py-2.5 rounded-xl bg-[#1E4535] hover:bg-[#2D6A4F] text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>أكمل الرحلة</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. REFLECTION & COMPLETION STEP ("💭 وقفة") */}
      {currentStep === 'reflection' && (
        <div className="bg-white border border-[#E8E2D5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2D6A4F]/10 text-[#1E4535] text-xs font-bold">
              <span>💭 وقفة وتأمل</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-['Tajawal'] text-[#1F2421]">
              {event.reflection.prompt}
            </h3>
          </div>

          {/* Optional User Reflection Textarea */}
          <div className="space-y-2 bg-[#FAF7F2] border border-[#E8E2D5] rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-[#736B63]">
              <span className="flex items-center gap-1 font-semibold text-[#1E4535]">
                <PenLine className="w-3.5 h-3.5" />
                <span>مساحتك الخاصة لكتابة خاطرة أو فائدة (اختياري):</span>
              </span>
              {isSavedReflectionNotice && (
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3 h-3" />
                  تم الحفظ
                </span>
              )}
            </div>

            <textarea
              id="input-seerah-reflection"
              rows={3}
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder={event.reflection.hint || 'اكتب ما لامس قلبك من هذا الحدث المبارك...'}
              className="w-full bg-white border border-[#E8E2D5] rounded-xl p-3 text-xs sm:text-sm text-[#2C2825] focus:outline-none focus:border-[#2D6A4F] transition-colors resize-none placeholder:text-[#A89F95]"
            />

            <div className="flex justify-end">
              <button
                id="btn-seerah-save-reflection"
                onClick={handleSaveUserReflection}
                className="px-4 py-1.5 rounded-lg bg-white border border-[#E8E2D5] text-[#1E4535] hover:bg-[#FAF7F2] text-xs font-bold transition-colors cursor-pointer"
              >
                حفظ الخاطرة
              </button>
            </div>
          </div>

          {/* Explicit Completion Button: ✓ أتممت هذا الجزء */}
          <div className="pt-2 text-center space-y-3">
            {!isCompleted ? (
              <button
                id="btn-seerah-complete-event"
                onClick={handleUserClickComplete}
                className="px-8 py-3.5 rounded-2xl bg-[#1E4535] hover:bg-[#2D6A4F] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>أتممت هذا الجزء</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs sm:text-sm font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>تقبل الله منك! تم تسجيل إتمام هذا الجزء في مسيرتك</span>
              </div>
            )}

            {justCompletedToast && (
              <p className="text-xs text-emerald-700 font-medium animate-in fade-in">
                ما شاء الله! زادك الله حباً واقتداءً بنبيه ﷺ 🤍
              </p>
            )}
          </div>

          {/* Navigation to Next Event or Timeline */}
          <div className="pt-4 border-t border-[#F0EBE1] flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              id="btn-seerah-return-timeline"
              onClick={onBackToTimeline}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E8E2D5] text-[#736B63] hover:text-[#1F2421] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              العودة إلى مسار السيرة
            </button>

            {nextEvent && onGoToNextEvent && (
              <button
                id="btn-seerah-next-event"
                onClick={onGoToNextEvent}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2D6A4F] to-[#1E4535] text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>الحدث التالي: {nextEvent.title}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Documented Source Tag */}
          <div className="pt-2 text-center">
            <p className="text-[11px] text-[#8C827A]">
              📚 المصدر المعتمد: {event.source}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
