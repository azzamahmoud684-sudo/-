import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Info,
  Pause,
  Layers,
  Flame,
  Check,
} from 'lucide-react';
import { QuranAyah, toArabicNumeral } from '../utils/quranReader';
import {
  compareRecitationToVerse,
  RecitationEvaluationResult,
  createSpeechRecognitionInstance,
  isSpeechRecognitionSupported,
} from '../utils/quranVoiceCorrection';

interface QuranVoiceReciterProps {
  activeAyah: QuranAyah;
  allAyahsOnPage?: QuranAyah[];
  isOpen: boolean;
  onClose: () => void;
  onSelectAyah?: (ayah: QuranAyah) => void;
  onNextAyah?: () => void;
  onPrevAyah?: () => void;
  hasNextAyah?: boolean;
  hasPrevAyah?: boolean;
}

export const QuranVoiceReciter: React.FC<QuranVoiceReciterProps> = ({
  activeAyah,
  allAyahsOnPage = [],
  isOpen,
  onClose,
  onSelectAyah,
  onNextAyah,
  onPrevAyah,
  hasNextAyah = false,
  hasPrevAyah = false,
}) => {
  // Recitation & Recognition States
  const [isListening, setIsListening] = useState(false);
  const [isContinuous, setIsContinuous] = useState(true); // Continuous recitation across verses
  const [viewMode, setViewMode] = useState<'focus' | 'page'>('focus'); // Focus ayah vs full page flow
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  // Completed ayahs tracking in this session
  const [completedAyahs, setCompletedAyahs] = useState<Record<number, number>>({}); // ayahNumber -> accuracyScore

  // Transcripts
  const [currentVerseTranscript, setCurrentVerseTranscript] = useState('');
  const [interimSpoken, setInterimSpoken] = useState('');

  // Fallback manual testing
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInputText, setManualInputText] = useState('');

  // Refs to avoid stale closures in Web Speech API handlers
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cumulativeTranscriptRef = useRef('');
  const transcriptOffsetRef = useRef(0);
  const activeAyahRef = useRef(activeAyah);
  const isContinuousRef = useRef(isContinuous);
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep refs in sync with current props and states
  useEffect(() => {
    activeAyahRef.current = activeAyah;
  }, [activeAyah]);

  useEffect(() => {
    isContinuousRef.current = isContinuous;
  }, [isContinuous]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Target text of active verse (cleaned without bismillah prefix if stripped)
  const targetVerseText = activeAyah.cleanText || activeAyah.text;

  // Find next ayah if available in allAyahsOnPage
  const currentIndexInPage = allAyahsOnPage.findIndex((a) => a.number === activeAyah.number);
  const nextAyahInPage: QuranAyah | undefined =
    currentIndexInPage >= 0 && currentIndexInPage < allAyahsOnPage.length - 1
      ? allAyahsOnPage[currentIndexInPage + 1]
      : undefined;

  // Real-time recitation evaluation using Word-by-Word Diff algorithm
  const combinedSpoken = (currentVerseTranscript + ' ' + interimSpoken).trim();
  const evaluation: RecitationEvaluationResult = compareRecitationToVerse(
    targetVerseText,
    combinedSpoken,
    nextAyahInPage ? nextAyahInPage.cleanText || nextAyahInPage.text : undefined
  );

  // Check speech recognition support on mount
  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  // Safe stop listening
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimSpoken('');
  }, []);

  // Soft reset of current verse transcript without stopping the microphone
  const resetCurrentVerseTranscript = useCallback(() => {
    transcriptOffsetRef.current = cumulativeTranscriptRef.current.length;
    setCurrentVerseTranscript('');
    setInterimSpoken('');
    setManualInputText('');
    setErrorMessage(null);
  }, []);

  // When user explicitly changes verse or resets
  const handleManualReset = () => {
    resetCurrentVerseTranscript();
  };

  // Start Speech Recognition with continuous mode
  const startListening = () => {
    setErrorMessage(null);

    if (!isSpeechRecognitionSupported()) {
      setErrorMessage(
        'متصفحك لا يدعم ميزة التعرف على الصوت المباشر (Web Speech API). يمكنك استخدام الاختبار الكتابي لتجربة تصحيح التلاوة.'
      );
      setShowManualInput(true);
      return;
    }

    try {
      // Stop existing instance if any
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }

      const recognition = createSpeechRecognitionInstance();
      if (!recognition) {
        setErrorMessage('تعذر تشغيل الميكروفون. يرجى التأكد من منح إذن الميكروفون للموقع.');
        return;
      }

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item && item[0]) {
            if (item.isFinal) {
              fullTranscript += item[0].transcript + ' ';
            } else {
              interimTranscript += item[0].transcript + ' ';
            }
          }
        }

        cumulativeTranscriptRef.current = fullTranscript;

        // Slice from current verse offset
        const slicedFinal = fullTranscript.slice(transcriptOffsetRef.current).trim();
        setCurrentVerseTranscript(slicedFinal);
        setInterimSpoken(interimTranscript.trim());
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setErrorMessage('تم رفض إذن الميكروفون. يُرجى تفعيل إذن الميكروفون من إعدادات المتصفح.');
          stopListening();
        } else if (event.error === 'no-speech') {
          // Soft notice, keep listening
        } else {
          setErrorMessage(`تنبيه أثناء الاستماع (${event.error}). أعد المحاولة أو تحدّث بالقرب من الميكروفون.`);
        }
      };

      recognition.onend = () => {
        // In continuous recitation, automatically keep microphone alive unless user explicitly stopped
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            // If already started or brief browser delay, retry in 300ms
            setTimeout(() => {
              if (isListeningRef.current) {
                try {
                  recognition.start();
                } catch {
                  setIsListening(false);
                  isListeningRef.current = false;
                }
              }
            }, 300);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      isListeningRef.current = true;
      setIsListening(true);
    } catch (err: any) {
      console.error('Error starting recognition:', err);
      setErrorMessage('تعذر بدء تشغيل الميكروفون. تأكد من أن جهازك يدعم التقاط الصوت.');
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Continuous auto-advance trigger
  // When an ayah reaches high accuracy or completion, advance smoothly WITHOUT stopping the microphone!
  useEffect(() => {
    const isVerseFinished =
      (evaluation.isCompleted && evaluation.accuracyScore >= 75) ||
      evaluation.isFullyCorrect ||
      Boolean(evaluation.matchedNextAyahStartIndex !== undefined);

    if (isVerseFinished && isListening && isContinuous && hasNextAyah) {
      // Mark active ayah as completed in session
      setCompletedAyahs((prev) => ({
        ...prev,
        [activeAyah.number]: Math.max(prev[activeAyah.number] || 0, evaluation.accuracyScore),
      }));

      // Schedule seamless transition without stopping the mic
      if (!advanceTimerRef.current) {
        advanceTimerRef.current = setTimeout(() => {
          advanceTimerRef.current = null;
          // Advance transcript offset to current cumulative end
          transcriptOffsetRef.current = cumulativeTranscriptRef.current.length;
          setCurrentVerseTranscript('');
          setInterimSpoken('');

          if (onNextAyah) {
            onNextAyah();
          }
        }, 850);
      }
    } else if (!isVerseFinished && advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, [
    evaluation.isCompleted,
    evaluation.accuracyScore,
    evaluation.isFullyCorrect,
    evaluation.matchedNextAyahStartIndex,
    isListening,
    isContinuous,
    hasNextAyah,
    activeAyah.number,
    onNextAyah,
  ]);

  // Audio Playback for reference recitation (Sheikh Mishary Al-Afasy)
  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingAudio(false);
    } else {
      const surahStr = activeAyah.surahNumber.toString().padStart(3, '0');
      const ayahStr = activeAyah.numberInSurah.toString().padStart(3, '0');
      const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${surahStr}${ayahStr}.mp3`;

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        setErrorMessage('تعذر تشغيل الصوت المرجعي للآية حالياً.');
      };

      audio.play().catch(() => {
        setIsPlayingAudio(false);
      });
    }
  };

  // Manual test submission for simulation / fallback
  const handleApplyManualInput = () => {
    if (!manualInputText.trim()) return;
    setCurrentVerseTranscript(manualInputText.trim());
    setInterimSpoken('');
  };

  // Count of completed ayahs on this page
  const completedCountOnPage = allAyahsOnPage.filter((a) => completedAyahs[a.number] !== undefined).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-3xl bg-[#FDFCF7] rounded-3xl border border-[#E8E2D5] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ================= Header ================= */}
        <div className="p-4 sm:p-5 border-b border-[#E8E2D5] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#1F2421]">
                  المصحح والتسميع الصوتي التفاعلي
                </h3>
                {isListening && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF7EE] text-[#2D6A4F] border border-[#B7E4C7] animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]"></span>
                    <span>استماع مستمر نشط</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#736B63] mt-0.5">
                {activeAyah.surahName} • الآية {toArabicNumeral(activeAyah.numberInSurah)} • الجزء {activeAyah.juz}
                {allAyahsOnPage.length > 0 && (
                  <span className="mr-2 text-[#2D6A4F] font-bold">
                    (أُتقن {completedCountOnPage} من {allAyahsOnPage.length} آية بالصفحة)
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-[#F3EFE6] text-[#736B63] transition-colors cursor-pointer"
            title="إغلاق لوحة التسميع"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= Top Control & Mode Toolbar ================= */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#FAF7F2] border-b border-[#E8E2D5] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                resetCurrentVerseTranscript();
                if (onPrevAyah) onPrevAyah();
              }}
              disabled={!hasPrevAyah}
              className={`p-1.5 rounded-xl border flex items-center gap-1 transition-all cursor-pointer ${
                !hasPrevAyah
                  ? 'border-transparent text-[#C5BCB2] cursor-not-allowed'
                  : 'bg-white text-[#403B36] border-[#E8E2D5] hover:bg-[#F3EFE6]'
              }`}
              title="الآية السابقة"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">السابقة</span>
            </button>

            <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E8E2D5] text-xs font-bold text-[#2D6A4F] font-mono">
              آية {activeAyah.numberInSurah}
            </span>

            <button
              onClick={() => {
                resetCurrentVerseTranscript();
                if (onNextAyah) onNextAyah();
              }}
              disabled={!hasNextAyah}
              className={`p-1.5 rounded-xl border flex items-center gap-1 transition-all cursor-pointer ${
                !hasNextAyah
                  ? 'border-transparent text-[#C5BCB2] cursor-not-allowed'
                  : 'bg-white text-[#403B36] border-[#E8E2D5] hover:bg-[#F3EFE6]'
              }`}
              title="الآية التالية"
            >
              <span className="hidden sm:inline">التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Continuous Recitation Toggle & View Toggle */}
          <div className="flex items-center gap-3">
            {/* Continuous Mode Toggle */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D5] text-xs font-bold text-[#2D6A4F] cursor-pointer hover:bg-[#F3EFE6] transition-all">
              <input
                type="checkbox"
                checked={isContinuous}
                onChange={(e) => setIsContinuous(e.target.checked)}
                className="w-4 h-4 rounded accent-[#2D6A4F] cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>تسميع مستمر (تلقائي بدون توقف)</span>
              </span>
            </label>

            {/* View Mode Switcher: Focus vs Page Flow */}
            {allAyahsOnPage.length > 0 && (
              <div className="flex items-center p-0.5 rounded-xl bg-[#E8E2D5] text-[11px] font-bold">
                <button
                  onClick={() => setViewMode('focus')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'focus' ? 'bg-white text-[#1F2421] shadow-2xs' : 'text-[#736B63]'
                  }`}
                >
                  تركيز
                </button>
                <button
                  onClick={() => setViewMode('page')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'page' ? 'bg-white text-[#1F2421] shadow-2xs' : 'text-[#736B63]'
                  }`}
                >
                  كامل الصفحة
                </button>
              </div>
            )}

            {/* Reference Audio Player */}
            <button
              onClick={handleToggleAudio}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isPlayingAudio
                  ? 'bg-[#B8860B] text-white shadow-xs'
                  : 'bg-white text-[#403B36] hover:bg-[#F3EFE6] border border-[#E8E2D5]'
              }`}
              title="استمع للآية بصوت الشيخ مشاري العفاسي"
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>إيقاف الصوت</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  <span>استمع</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ================= Continuous Recitation Banner ================= */}
        {isContinuous && (
          <div className="px-5 py-2 bg-[#EBF7EE] border-b border-[#B7E4C7] text-xs text-[#1E4535] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {isListening && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="font-bold">
                وضع التسميع المستمر نشط:
              </span>
              <span className="text-[#2D6A4F]">
                الميكروفون سيظل يعمل باستمرار بينما تقرأ آية تلو الأخرى دون توقف.
              </span>
            </div>
            <span className="text-[11px] font-bold text-[#2D6A4F] bg-white px-2 py-0.5 rounded-full border border-[#B7E4C7]">
              دقة الآية: {evaluation.accuracyScore}%
            </span>
          </div>
        )}

        {/* ================= Main Scrollable Content ================= */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* VIEW MODE 1: Focus View (Enlarged active verse + next verse preview) */}
          {viewMode === 'focus' && (
            <div className="space-y-4">
              {/* Active Verse Card with Diff Highlighting */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D5] shadow-xs relative transition-all">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F0ECE1] text-xs">
                  <span className="text-[#8C827A] font-medium">
                    اقرأ الآية بصوتك، وسيقوم المصحح بتمييز الكلمات بدقة خوارزمية (Diff):
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#2D6A4F]">
                      الكلمات المتقنة: {evaluation.correctWordsCount} / {evaluation.totalWordsCount}
                    </span>
                  </div>
                </div>

                {/* Word-by-Word Colored Text Flow */}
                <div className="font-['Amiri',serif] leading-[2.6] sm:leading-[2.8] text-center text-[#1F2421] text-xl sm:text-2xl select-none flex flex-wrap justify-center items-center gap-x-2 gap-y-3">
                  {evaluation.words.map((w, idx) => {
                    let badgeClass = 'text-[#1F2421] bg-transparent';
                    let icon = null;

                    if (w.status === 'correct') {
                      badgeClass =
                        'bg-[#EBF7EE] text-[#1E4535] border border-[#A7E0BA] px-2.5 py-0.5 rounded-xl shadow-2xs font-bold';
                      icon = <Check className="w-3 h-3 text-[#2D6A4F] inline-block mr-1" />;
                    } else if (w.status === 'incorrect') {
                      badgeClass =
                        'bg-[#FDF0F0] text-[#B91C1C] border border-[#FCA5A5] px-2.5 py-0.5 rounded-xl line-through decoration-2 shadow-2xs relative';
                    } else if (w.status === 'current' && isListening) {
                      badgeClass =
                        'bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047] px-2.5 py-0.5 rounded-xl animate-pulse font-bold shadow-xs';
                    }

                    return (
                      <div key={idx} className="relative inline-flex flex-col items-center group">
                        <span className={`inline-flex items-center transition-all duration-150 ${badgeClass}`}>
                          {w.originalWord}
                          {icon}
                        </span>

                        {/* Inline Correction Popover on Mismatch */}
                        {w.status === 'incorrect' && (
                          <div className="mt-1 px-2 py-0.5 rounded-lg bg-[#991B1B] text-white text-[11px] font-sans font-medium whitespace-nowrap shadow-xs">
                            الصواب: {w.correction || w.originalWord}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Ayah End Medallion */}
                  <span className="inline-block text-[#B8860B] font-bold text-lg mr-1 select-none">
                    ﴿{toArabicNumeral(activeAyah.numberInSurah)}﴾
                  </span>
                </div>

                {/* Full verse completion feedback */}
                {evaluation.isFullyCorrect && (
                  <div className="mt-5 p-3 rounded-2xl bg-[#EBF7EE] border border-[#B7E4C7] text-xs font-bold text-[#1E4535] flex items-center justify-center gap-2 animate-fade-in shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-[#2D6A4F]" />
                    <span>ما شاء الله! تمت تلاوة هذه الآية بإتقان تام 100% ✨</span>
                  </div>
                )}
              </div>

              {/* Next Ayah Forward Preview Card (So user can read ahead continuously) */}
              {nextAyahInPage && (
                <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E8E2D5] opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between text-xs text-[#736B63] mb-1 font-bold">
                    <span>الآية التالية (استمر في القراءة):</span>
                    <span>آية {nextAyahInPage.numberInSurah}</span>
                  </div>
                  <p className="font-['Amiri',serif] text-base sm:text-lg text-[#524B43] leading-relaxed text-center">
                    {nextAyahInPage.cleanText || nextAyahInPage.text}{' '}
                    <span className="text-[#B8860B] font-bold">
                      ﴿{toArabicNumeral(nextAyahInPage.numberInSurah)}﴾
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: Page Flow View (All ayahs on the page rendered continuously) */}
          {viewMode === 'page' && (
            <div className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs space-y-4">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#F0ECE1]">
                <span className="text-[#736B63] font-bold">
                  تسميع متصل لجميع آيات الصفحة {activeAyah.page}:
                </span>
                <span className="text-[#2D6A4F] font-bold">
                  {completedCountOnPage} من {allAyahsOnPage.length} أُنجزت
                </span>
              </div>

              <div className="space-y-4">
                {allAyahsOnPage.map((ayah) => {
                  const isActive = ayah.number === activeAyah.number;
                  const isAyahCompleted = completedAyahs[ayah.number] !== undefined;

                  return (
                    <div
                      key={ayah.number}
                      onClick={() => {
                        if (onSelectAyah) {
                          resetCurrentVerseTranscript();
                          onSelectAyah(ayah);
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#FDFCF7] border-[#2D6A4F] shadow-xs ring-2 ring-[#2D6A4F]/20'
                          : isAyahCompleted
                          ? 'bg-[#F4FAF5] border-[#B7E4C7]'
                          : 'bg-[#FAF7F2] border-[#E8E2D5] hover:bg-[#F3EFE6]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-[#403B36]">
                          الآية {ayah.numberInSurah}
                        </span>
                        {isAyahCompleted && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#2D6A4F]">
                            <Check className="w-3.5 h-3.5 text-[#2D6A4F]" />
                            <span>متقنة ({completedAyahs[ayah.number]}%)</span>
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[11px] font-bold text-[#B8860B] bg-[#FEF9C3] px-2 py-0.5 rounded-full">
                            الآية الجارية الآن
                          </span>
                        )}
                      </div>

                      {/* If this is the active verse, show the live word-by-word diff */}
                      {isActive ? (
                        <div className="font-['Amiri',serif] leading-[2.6] text-center text-[#1F2421] text-lg sm:text-xl flex flex-wrap justify-center items-center gap-x-1.5 gap-y-2">
                          {evaluation.words.map((w, idx) => {
                            let badgeClass = 'text-[#1F2421]';
                            if (w.status === 'correct') {
                              badgeClass =
                                'bg-[#EBF7EE] text-[#1E4535] border border-[#A7E0BA] px-2 py-0.5 rounded-xl font-bold';
                            } else if (w.status === 'incorrect') {
                              badgeClass =
                                'bg-[#FDF0F0] text-[#B91C1C] border border-[#FCA5A5] px-2 py-0.5 rounded-xl line-through';
                            } else if (w.status === 'current' && isListening) {
                              badgeClass =
                                'bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047] px-2 py-0.5 rounded-xl animate-pulse font-bold';
                            }
                            return (
                              <span key={idx} className={`inline-block ${badgeClass}`}>
                                {w.originalWord}
                              </span>
                            );
                          })}
                          <span className="text-[#B8860B] font-bold mr-1">
                            ﴿{toArabicNumeral(ayah.numberInSurah)}﴾
                          </span>
                        </div>
                      ) : (
                        <p className="font-['Amiri',serif] text-base sm:text-lg text-[#2A2F2B] leading-relaxed text-center">
                          {ayah.cleanText || ayah.text}{' '}
                          <span className="text-[#B8860B] font-bold">
                            ﴿{toArabicNumeral(ayah.numberInSurah)}﴾
                          </span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= Live Microphone Control Box ================= */}
          <div className="bg-[#FAF7F2] rounded-3xl p-5 border border-[#E8E2D5] flex flex-col items-center justify-center text-center space-y-4">
            {/* Big Pulsing Mic Button */}
            <div className="relative">
              {isListening && (
                <>
                  <div className="absolute -inset-3 rounded-full bg-[#2D6A4F]/20 animate-ping pointer-events-none" />
                  <div className="absolute -inset-1.5 rounded-full bg-[#2D6A4F]/30 animate-pulse pointer-events-none" />
                </>
              )}
              <button
                onClick={handleToggleListening}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all transform active:scale-95 cursor-pointer ${
                  isListening ? 'bg-[#B91C1C] hover:bg-[#991B1B]' : 'bg-[#2D6A4F] hover:bg-[#1E4535]'
                }`}
                title={isListening ? 'إيقاف الاستماع' : 'ابدأ التسميع بصوتك الآن'}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8 animate-pulse" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#1F2421]">
                {isListening
                  ? 'الميكروفون يستمع لتلاوتك باستمرار الآن...'
                  : 'اضغط على الميكروفون وابدأ التلاوة المستمرة'}
              </h4>
              <p className="text-xs text-[#736B63] mt-1">
                {isListening
                  ? 'اقرأ بتمهل وطمأنينة. الكلمات الصحيحة ستضيء بالأخضر، وسينتقل تلقائياً للآيات التالية أثناء قراءتك.'
                  : 'يعتمد على خوارزمية Diff المقارنة بين الكلمات الفردية بمرونة عالية، مما يمنع الأخطاء الوهمية.'}
              </p>
            </div>

            {/* Live Subtitle Transcript */}
            {(combinedSpoken || isListening) && (
              <div className="w-full max-w-md bg-white rounded-2xl p-3 border border-[#E8E2D5] text-xs text-[#403B36] min-h-[44px] flex items-center justify-center">
                {combinedSpoken ? (
                  <p className="font-['Amiri',serif] text-base text-[#2D6A4F] leading-relaxed">
                    « {combinedSpoken} »
                  </p>
                ) : (
                  <span className="text-[#A69C91] italic">بانتظار صوتك المبارك...</span>
                )}
              </div>
            )}

            {/* Error Message if any */}
            {errorMessage && (
              <div className="w-full max-w-md p-3 rounded-xl bg-[#FDF0F0] border border-[#FCA5A5] text-xs text-[#991B1B] flex items-start gap-2 text-right">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B91C1C]" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions: Reset recitation or toggle manual tester */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                onClick={handleManualReset}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3EFE6] border border-[#E8E2D5] text-xs font-bold text-[#736B63] flex items-center gap-1.5 cursor-pointer transition-colors"
                title="إعادة ضبط الآية الحالية"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط الآية</span>
              </button>

              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3EFE6] border border-[#E8E2D5] text-xs font-bold text-[#736B63] cursor-pointer transition-colors"
              >
                {showManualInput ? 'إخفاء الاختبار اليدوي' : 'اختبار كتابي / بديل'}
              </button>
            </div>

            {/* Fallback / Manual Text Testing Box */}
            {showManualInput && (
              <div className="w-full max-w-md mt-2 pt-3 border-t border-[#E8E2D5] space-y-2 text-right">
                <label className="text-xs text-[#736B63] font-medium block">
                  اكتب أو الصق نص التلاوة لاختبار المقارنة بخوارزمية (Diff):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={manualInputText}
                    onChange={(e) => setManualInputText(e.target.value)}
                    placeholder="مثال: الحمد لله رب العالمين..."
                    className="flex-1 px-3 py-2 bg-white border border-[#E8E2D5] rounded-xl text-xs text-[#1F2421] focus:outline-none focus:border-[#2D6A4F]"
                  />
                  <button
                    onClick={handleApplyManualInput}
                    className="px-3 py-2 bg-[#2D6A4F] text-white rounded-xl text-xs font-bold hover:bg-[#1E4535] cursor-pointer"
                  >
                    تطبيق
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= Footer ================= */}
        <div className="p-4 bg-white border-t border-[#E8E2D5] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#736B63]">
            <Info className="w-4 h-4 text-[#B8860B]" />
            <span className="hidden sm:inline">
              خوارزمية Diff تقارن كل كلمة فردية على حدة، وتتسامح مع التشكيل ورسم المصحف العثماني.
            </span>
          </div>

          <button
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-[#2D6A4F] text-white font-bold hover:bg-[#1E4535] cursor-pointer transition-all shadow-xs"
          >
            إغلاق المصحح
          </button>
        </div>
      </div>
    </div>
  );
};
