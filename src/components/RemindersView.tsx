import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  Sparkles,
  Smartphone,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Check,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  RotateCcw,
  Send,
  Lock,
  Unlock,
  Settings,
  HelpCircle,
  X,
} from 'lucide-react';
import { ReminderSetting } from '../types';
import {
  subscribeToWebPush,
  unsubscribeFromWebPush,
  getDetailedPushStatus,
  sendTestPushNotification,
  updatePushPreferencesOnServer,
  PushPreferences,
} from '../utils/pushManager';
import { ATHAN_AUDIOS, AthanAudioOption } from '../utils/prayerCalculator';

interface RemindersViewProps {
  reminders: ReminderSetting[];
  onUpdateReminders: (updated: ReminderSetting[]) => void;
  coordinates?: { lat: number; lng: number } | null;
}

const STORAGE_KEY_SELECTED_ATHAN = 'ouns_selected_athan_id';
const STORAGE_KEY_AUTOPLAY_ATHAN = 'ouns_autoplay_athan_enabled';

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  onUpdateReminders,
  coordinates,
}) => {
  // Push status state
  const [isSupported, setIsSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isBrowserSubscribed, setIsBrowserSubscribed] = useState(false);
  const [isServerSaved, setIsServerSaved] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Unblock assistance guide state
  const [showUnblockGuide, setShowUnblockGuide] = useState(false);
  const [unblockTab, setUnblockTab] = useState<'android' | 'ios' | 'desktop' | 'system'>('android');
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Adhan sound state
  const [selectedAthanId, setSelectedAthanId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_SELECTED_ATHAN) || 'makkah';
  });
  const [autoPlayAthan, setAutoPlayAthan] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTOPLAY_ATHAN);
    return saved !== null ? saved === 'true' : true;
  });
  const [isPlayingAthan, setIsPlayingAthan] = useState(false);
  const [athanProgress, setAthanProgress] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedAthan =
    ATHAN_AUDIOS.find((a) => a.id === selectedAthanId) || ATHAN_AUDIOS[1];

  // Load push status on mount and auto-detect unblocking when user returns to tab
  useEffect(() => {
    refreshPushStatus();

    const checkAndAutoSubscribe = async () => {
      const currentPerm =
        typeof window !== 'undefined' && 'Notification' in window
          ? Notification.permission
          : 'default';
      setPermission(currentPerm);

      const status = await getDetailedPushStatus();
      setIsSupported(status.isSupported);
      setPermission(status.permission);
      setIsBrowserSubscribed(status.isBrowserSubscribed);
      setIsServerSaved(status.isServerSaved);
      setIsSubscribed(status.isSubscribed);

      // If user unblocked permission and it's now granted, but not subscribed yet
      if (currentPerm === 'granted' && (!status.isSubscribed || !status.isServerSaved)) {
        showToast('ما شاء الله! تم اكتشاف فك الحظر، جارٍ تفعيل وحفظ الإشعارات بالخادم 🤍');
        handleEnablePushNotifications();
      }
    };

    const handleFocus = () => {
      checkAndAutoSubscribe();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndAutoSubscribe();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const refreshPushStatus = async () => {
    try {
      const status = await getDetailedPushStatus();
      setIsSupported(status.isSupported);
      setPermission(status.permission);
      setIsBrowserSubscribed(status.isBrowserSubscribed);
      setIsServerSaved(status.isServerSaved);
      setIsSubscribed(status.isSubscribed);
    } catch (e) {
      console.warn('Error reading push status:', e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Toggle or Request Web Push
  const handleEnablePushNotifications = async () => {
    // If permission is already denied, the browser prevents asking again programmatically.
    // Show the unblock guide immediately!
    const currentPerm =
      typeof window !== 'undefined' && 'Notification' in window
        ? Notification.permission
        : 'default';
    if (currentPerm === 'denied') {
      setShowUnblockGuide(true);
      showToast('الإشعارات محظورة في متصفحك. تفضل بالاطلاع على خطوات فك الحظر السريعة أدناه 🔓');
      return;
    }

    setIsActivating(true);
    try {
      const preferences: PushPreferences = {
        prayers: reminders.some((r) => r.isPrayerTime && r.enabled),
        athkar: reminders.some(
          (r) =>
            (r.id.includes('morning') ||
              r.id.includes('evening') ||
              r.id.includes('sleep')) &&
            r.enabled
        ),
        tasks: reminders.some((r) => r.id === 'rem-daily-worship' && r.enabled),
        occasions: true,
      };

      const result = await subscribeToWebPush(
        preferences,
        coordinates || undefined,
        reminders
      );

      if (result.success) {
        // Re-verify the status with backend
        const status = await getDetailedPushStatus();
        setIsSupported(status.isSupported);
        setPermission(status.permission);
        setIsBrowserSubscribed(status.isBrowserSubscribed);
        setIsServerSaved(status.isServerSaved);
        setIsSubscribed(status.isSubscribed);

        if (status.isSubscribed || status.isServerSaved) {
          showToast(
            'تم تفعيل الإشعارات بنجاح وحفظها في الخادم! ستصلك تنبيهات الأذان والأذكار حتى عند إغلاق التطبيق 🤍'
          );

          // Send a celebratory test notification right away
          setTimeout(() => {
            sendTestPushNotification(
              'أُنس - تم تفعيل الإشعارات بنجاح 🕌',
              'ما شاء الله! تم حفظ اشتراكك في خادم التنبيهات وستصلك مواقيت الصلاة والأذكار في موعدها 🤍'
            ).catch(() => {});
          }, 1200);
        } else {
          showToast('تم ربط الهاتف بنجاح، وجارٍ استكمال المزامنة مع خادم التنبيهات...');
        }
      } else {
        await refreshPushStatus();
        if (result.error && result.error.includes('محظور')) {
          setShowUnblockGuide(true);
        }
        showToast(result.error || 'تعذر تفعيل الإشعارات، يرجى المحاولة مرة أخرى.');
      }
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء تفعيل الإشعارات.');
    } finally {
      setIsActivating(false);
      await refreshPushStatus();
    }
  };

  // Re-check permission manually after unblocking in browser settings
  const handleManualCheckAfterUnblock = async () => {
    setIsActivating(true);
    try {
      const currentPerm =
        typeof window !== 'undefined' && 'Notification' in window
          ? Notification.permission
          : 'default';
      setPermission(currentPerm);

      if (currentPerm === 'granted') {
        showToast('تم فك الحظر بنجاح! جارٍ تسجيل هاتفك الآن في خادم التنبيهات...');
        await handleEnablePushNotifications();
      } else if (currentPerm === 'denied') {
        showToast('لا يزال الإذن محظوراً في إعدادات المتصفح. يرجى اتباع الخطوات الموضحة لتغييره إلى السماح (Allow) 🔒');
        setShowUnblockGuide(true);
      } else {
        showToast('الإذن جاهز الآن! اضغطي على زر التفعيل ووافقي على رسالة المتصفح 🔔');
        await handleEnablePushNotifications();
      }
    } finally {
      setIsActivating(false);
      await refreshPushStatus();
    }
  };

  // Send a real instant test push to device
  const handleSendTestNotification = async () => {
    setIsTesting(true);
    try {
      const res = await sendTestPushNotification(
        '🕌 أذان صلاة الظهر - تجربة التنبيه',
        '«حي على الصلاة، حي على الفلاح».. الإشعار يعمل بنجاح على هاتفك عند قفل الشاشة 🤍'
      );

      if (res.success) {
        showToast('تم إرسال الإشعار بنجاح! تفقدي شريط الإشعارات أو شاشة القفل بهاتفك 📲');
      } else {
        showToast(res.error || 'تعذر إرسال الإشعار التجريبي. تأكدي من تفعيل الإشعارات أولاً.');
      }
    } catch (err: any) {
      showToast(err.message || 'تعذر إرسال الإشعار التجريبي.');
    } finally {
      setIsTesting(false);
      await refreshPushStatus();
    }
  };

  // Play / Pause selected Adhan preview
  const handleToggleAthanAudio = (option?: AthanAudioOption) => {
    const target = option || selectedAthan;

    if (isPlayingAthan && (!option || option.id === selectedAthanId)) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingAthan(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setSelectedAthanId(target.id);
    localStorage.setItem(STORAGE_KEY_SELECTED_ATHAN, target.id);
    setAudioError(null);

    const audio = new Audio(target.audioUrl);
    audioRef.current = audio;

    audio.onplay = () => setIsPlayingAthan(true);
    audio.onpause = () => setIsPlayingAthan(false);
    audio.onended = () => {
      setIsPlayingAthan(false);
      setAthanProgress(0);
    };
    audio.ontimeupdate = () => {
      if (audio.duration) {
        setAthanProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    audio.onerror = () => {
      setIsPlayingAthan(false);
      setAudioError('تعذر تشغيل هذا الصوت حالياً، يرجى اختيار مؤذن آخر.');
    };

    audio
      .play()
      .then(() => {
        setIsPlayingAthan(true);
      })
      .catch((err) => {
        console.warn('Adhan play error:', err);
        setIsPlayingAthan(false);
        setAudioError('اضغطي مجدداً لبدء الاستماع للأذان.');
      });
  };

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Toggle individual reminder
  const handleToggleReminder = (id: string) => {
    const updated = reminders.map((r) => {
      if (r.id === id) {
        return { ...r, enabled: !r.enabled };
      }
      return r;
    });
    onUpdateReminders(updated);

    // Sync to push preferences on server
    updatePushPreferencesOnServer(
      {
        prayers: updated.some((r) => r.isPrayerTime && r.enabled),
        athkar: updated.some(
          (r) =>
            (r.id.includes('morning') ||
              r.id.includes('evening') ||
              r.id.includes('sleep')) &&
            r.enabled
        ),
        tasks: updated.some((r) => r.id === 'rem-daily-worship' && r.enabled),
        occasions: true,
      },
      coordinates || undefined,
      updated
    ).catch(() => {});
  };

  // Change individual reminder time
  const handleTimeChange = (id: string, newTime: string) => {
    const updated = reminders.map((r) => {
      if (r.id === id) {
        return { ...r, time: newTime };
      }
      return r;
    });
    onUpdateReminders(updated);
    if (isSubscribed || isServerSaved) {
      updatePushPreferencesOnServer(
        {
          prayers: updated.some((r) => r.isPrayerTime && r.enabled),
          athkar: updated.some(
            (r) =>
              (r.id.includes('morning') ||
                r.id.includes('evening') ||
                r.id.includes('sleep')) &&
              r.enabled
          ),
          tasks: updated.some((r) => r.id === 'rem-daily-worship' && r.enabled),
          occasions: true,
        },
        coordinates || undefined,
        updated
      ).catch(() => {});
    }
  };

  // Toggle autoplay adhan
  const handleToggleAutoplayAthan = () => {
    const nextVal = !autoPlayAthan;
    setAutoPlayAthan(nextVal);
    localStorage.setItem(STORAGE_KEY_AUTOPLAY_ATHAN, String(nextVal));
    showToast(
      nextVal
        ? 'تم تفعيل صوت الأذان التلقائي عند دخول وقت الصلاة 🔊'
        : 'تم كتم صوت الأذان التلقائي والاكتفاء بالإشعار النصي 🔕'
    );
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1F2421] text-white px-5 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 border border-[#2D6A4F] animate-fade-in max-w-[92vw]">
          <Sparkles className="w-4 h-4 text-[#D8F3DC] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D5] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center shrink-0 text-2xl shadow-2xs">
            🕌
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Tajawal'] text-[#1F2421]">
              إشعارات الهاتف والأذان 🤍
            </h2>
            <p className="text-xs sm:text-sm text-[#736B63] mt-1 leading-relaxed">
              تصلك تنبيهات مواقيت الصلاة والأذان وأذكار اليوم حتى عند إغلاق التطبيق وقفل الشاشة.
            </p>
          </div>
        </div>
      </div>

      {/* Hero Activation Card */}
      <div className="bg-gradient-to-br from-[#F5FAF6] to-[#FAF7F2] rounded-3xl p-5 sm:p-6 border border-[#2D6A4F]/25 shadow-xs relative overflow-hidden">
        {/* Subtle decorative background circle */}
        <div className="absolute -left-12 -bottom-12 w-44 h-44 rounded-full bg-[#2D6A4F]/5 pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1F2421]">حالة إشعارات الهاتف:</span>
              {permission === 'granted' && isSubscribed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF7EE] text-[#2D6A4F] text-xs font-bold border border-[#2D6A4F]/30">
                  <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
                  تم تفعيل الإشعارات بنجاح ومحفوظة بالخادم ✓
                </span>
              ) : permission === 'granted' && !isSubscribed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-300">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  الإذن ممنوح بالهاتف ويلزم حفظه بالخادم
                </span>
              ) : permission === 'denied' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  محظورة في إعدادات المتصفح
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                  <Bell className="w-3.5 h-3.5" />
                  بحاجة للموافقة والتفعيل
                </span>
              )}
            </div>

            {/* Refresh status small button */}
            <button
              onClick={refreshPushStatus}
              className="text-[11px] text-[#736B63] hover:text-[#2D6A4F] flex items-center gap-1 cursor-pointer transition-colors"
              title="تحديث حالة الاتصال والتأكد من الخادم"
            >
              <RotateCcw className="w-3 h-3" />
              <span>فحص حالة الخادم</span>
            </button>
          </div>

          {/* Descriptive text */}
          <p className="text-xs sm:text-sm text-[#4A433D] leading-relaxed">
            {permission === 'granted' && isSubscribed ? (
              <>
                <strong className="text-[#2D6A4F] font-bold">تم تفعيل الإشعارات بنجاح: </strong>
                تم تسجيل وحفظ جهازك في خادم تنبيهات أُنس بنجاح. ستصلك إشعارات الأذان وأذكار الصباح والمساء في أوقاتها المحددة حتى وإن كان هاتفك مقفلاً أو المتصفح مغلقاً.
              </>
            ) : permission === 'granted' && !isSubscribed ? (
              <>
                <strong className="text-amber-800 font-bold">تنبيه: </strong>
                إذن الإشعارات مفعّل في متصفح هاتفك، ولكن يلزم حفظ وتأكيد بيانات الربط في خادم الإشعارات لتصلك التنبيهات في الخلفية وعند قفل الشاشة. اضغطي الزر الأخضر أدناه لحفظ الاشتراك في الخادم فوراً.
              </>
            ) : permission === 'denied' ? (
              <>
                <strong className="text-red-700 font-bold">الإشعارات محظورة في متصفحك: </strong>
                المتصفح محفوظ حالياً على وضع «محظور / Block»، ولذلك يمنع التطبيق برمجياً من إظهار التنبيهات. لفك الحظر في ثانيتين فقط، اضغطي على زر "خطوات فك الحظر" أدناه.
              </>
            ) : (
              <>
                اضغطي على الزر أدناه لتفعيل التنبيهات. سيطلب منك المتصفح الإذن باستلام الإشعارات، وافقي عليها (السماح / Allow) لتبدأ الإشعارات بالوصول لشاشة هاتفك فوراً.
              </>
            )}
          </p>

          {/* Special Warning & Helper Card for Denied Permission */}
          {permission === 'denied' && (
            <div className="bg-red-50/90 border border-red-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-red-900">
                    كيف تفكين حظر الإشعارات في متصفحك؟
                  </h4>
                  <p className="text-[11px] sm:text-xs text-red-800 mt-1 leading-relaxed">
                    المتصفحات (مثل كروم وسامسونج وسفاري) تمنع المواقع من طلب الإذن مرة أخرى بعد رفضه. لتفعيلها: تحتاجين فقط لتغيير الإذن إلى <strong className="underline">السماح (Allow)</strong> من إعدادات المتصفح، أو فتح التطبيق في نافذة مستقلة إذا كنتِ داخل إطار المعاينة.
                  </p>
                </div>
              </div>

              {/* Iframe specific banner */}
              {isInIframe && (
                <div className="bg-amber-100/80 border border-amber-300/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
                    <Info className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>تنبيه: أنتِ داخل نافذة معاينة مضمنة، والمتصفحات تحظر الإشعارات داخل النوافذ المضمنة تلقائياً.</span>
                  </div>
                  <a
                    href={typeof window !== 'undefined' ? window.location.href : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-800 text-white text-xs font-bold hover:bg-amber-900 transition-colors shrink-0"
                  >
                    <span>فتح في نافذة متصفح مستقلة</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Quick action buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowUnblockGuide(!showUnblockGuide)}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{showUnblockGuide ? 'إخفاء خطوات فك الحظر' : 'عرض خطوات فك الحظر السريعة 🔓'}</span>
                  {showUnblockGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={handleManualCheckAfterUnblock}
                  disabled={isActivating}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-red-50 text-red-800 font-bold text-xs border border-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isActivating ? 'animate-spin' : ''}`} />
                  <span>فحص فك الحظر والتفعيل الآن 🔄</span>
                </button>
              </div>

              {/* Expandable Step-by-Step Guide */}
              {showUnblockGuide && (
                <div className="mt-3 pt-3 border-t border-red-200/80 space-y-3 animate-fade-in">
                  {/* Device tabs */}
                  <div className="flex flex-wrap gap-1.5 p-1 bg-red-100/60 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setUnblockTab('android')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        unblockTab === 'android'
                          ? 'bg-white text-red-900 shadow-2xs'
                          : 'text-red-700 hover:text-red-900'
                      }`}
                    >
                      📱 هاتف أندرويد (كروم / سامسونج)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnblockTab('ios')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        unblockTab === 'ios'
                          ? 'bg-white text-red-900 shadow-2xs'
                          : 'text-red-700 hover:text-red-900'
                      }`}
                    >
                      🍎 هاتف آيفون (سفاري)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnblockTab('desktop')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        unblockTab === 'desktop'
                          ? 'bg-white text-red-900 shadow-2xs'
                          : 'text-red-700 hover:text-red-900'
                      }`}
                    >
                      💻 الكمبيوتر (كروم / إيدج)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnblockTab('system')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        unblockTab === 'system'
                          ? 'bg-white text-red-900 shadow-2xs'
                          : 'text-red-700 hover:text-red-900'
                      }`}
                    >
                      ⚙️ ضبط نظام الهاتف
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-red-200 text-xs text-[#332E29] space-y-2.5 leading-relaxed">
                    {unblockTab === 'android' && (
                      <ol className="space-y-2 list-decimal list-inside pr-1">
                        <li>
                          <strong>الخطوة 1:</strong> انظري إلى أعلى شاشة المتصفح (بجانب رابط الموقع)، واضغطي على أيقونة <strong>القفل 🔒</strong> أو علامة <strong>الضبط / المنزلقات 🎛️</strong>.
                        </li>
                        <li>
                          <strong>الخطوة 2:</strong> اختاري <strong>الأذونات (Permissions)</strong> أو <strong>إعدادات الموقع (Site settings)</strong>.
                        </li>
                        <li>
                          <strong>الخطوة 3:</strong> اضغطي على <strong>الإشعارات (Notifications)</strong> وغيّريها إلى <strong>السماح (Allow)</strong> أو اضغطي <strong>«إعادة ضبط الأذونات / Reset»</strong>.
                        </li>
                        <li>
                          <strong>الخطوة 4:</strong> ارجعي لهذه الصفحة، واضغطي زر <strong>«فحص فك الحظر والتفعيل الآن 🔄»</strong> وسيتفعل نظام التنبيهات فوراً دون أي مجهود!
                        </li>
                      </ol>
                    )}

                    {unblockTab === 'ios' && (
                      <div className="space-y-2">
                        <p className="text-amber-800 font-semibold">
                          📌 نظام iOS من شركة Apple يشترط حفظ الموقع على الشاشة الرئيسية أولاً لتصلك إشعارات الأذان:
                        </p>
                        <ol className="space-y-2 list-decimal list-inside pr-1">
                          <li>
                            في متصفح Safari، اضغطي على زر <strong>المشاركة (Share ⬆️)</strong> في أسفل الشاشة.
                          </li>
                          <li>
                            مرري للأسفل واختاري <strong>«إضافة إلى الشاشة الرئيسية» (Add to Home Screen 📲)</strong> ثم اضغطي «إضافة».
                          </li>
                          <li>
                            اخرجي وافتحي تطبيق <strong>«أُنس»</strong> من الشاشة الرئيسية، واضغطي تفعيل الإشعارات وسيطلب منك الإذن مباشرة وتصلك التنبيهات.
                          </li>
                        </ol>
                      </div>
                    )}

                    {unblockTab === 'desktop' && (
                      <ol className="space-y-2 list-decimal list-inside pr-1">
                        <li>
                          اضغطي على أيقونة <strong>القفل 🔒</strong> أو أزرار الضبط يسار رابط الموقع في شريط العناوين.
                        </li>
                        <li>
                          بجوار خيار <strong>الإشعارات (Notifications)</strong>، اختاري <strong>السماح (Allow)</strong>.
                        </li>
                        <li>
                          حدّثي الصفحة أو اضغطي زر «فحص فك الحظر والتفعيل الآن 🔄».
                        </li>
                      </ol>
                    )}

                    {unblockTab === 'system' && (
                      <ol className="space-y-2 list-decimal list-inside pr-1">
                        <li>
                          إذا كان المتصفح نفسه ممنوعاً من إرسال الإشعارات في نظام هاتفك:
                        </li>
                        <li>
                          افتحي <strong>ضبط الهاتف (Settings)</strong> ← <strong>التطبيقات (Apps)</strong>.
                        </li>
                        <li>
                          اختاري متصفحك (مثل <strong>Chrome</strong> أو <strong>Samsung Internet</strong>).
                        </li>
                        <li>
                          اضغطي على <strong>الإشعارات (Notifications)</strong> وتأكدي من تفعيل <strong>«السماح بالإشعارات»</strong>.
                        </li>
                      </ol>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            {/* Primary Enable Button */}
            {permission !== 'granted' || !isSubscribed ? (
              <button
                id="btn-enable-phone-notifications"
                onClick={permission === 'denied' ? () => setShowUnblockGuide(true) : handleEnablePushNotifications}
                disabled={isActivating || !isSupported}
                className={`flex-1 py-3 px-5 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 active:scale-98 ${
                  permission === 'denied'
                    ? 'bg-amber-700 hover:bg-amber-800'
                    : 'bg-[#2D6A4F] hover:bg-[#1E4535]'
                }`}
              >
                {isActivating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جارٍ حفظ وتأكيد التنبيهات في الخادم...</span>
                  </>
                ) : permission === 'denied' ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>🔓 اضغطي هنا لعرض خطوات فك الحظر</span>
                  </>
                ) : permission === 'granted' ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>🔄 حفظ وتأكيد اشتراك الإشعارات في الخادم الآن</span>
                  </>
                ) : (
                  <>
                    <BellRing className="w-4 h-4" />
                    <span>🔔 تفعيل إشعارات الهاتف والأذان الآن</span>
                  </>
                )}
              </button>
            ) : (
              <button
                id="btn-push-already-enabled"
                onClick={handleEnablePushNotifications}
                disabled={isActivating}
                className="py-3 px-5 rounded-2xl bg-[#EBF7EE] hover:bg-[#D8F3DC] text-[#2D6A4F] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#2D6A4F]/30 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>إعادة مزامنة الإشعارات مع الخادم</span>
              </button>
            )}

            {/* Test Push Button */}
            <button
              id="btn-test-instant-push"
              onClick={handleSendTestNotification}
              disabled={isTesting}
              className="py-3 px-4 rounded-2xl bg-white hover:bg-[#FAF7F2] text-[#1F2421] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#E8E2D5] shadow-2xs hover:border-[#2D6A4F]/40 transition-all cursor-pointer active:scale-98"
              title="إرسال إشعار تجريبي فوري لشاشة الهاتف"
            >
              {isTesting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#2D6A4F]/30 border-t-[#2D6A4F] rounded-full animate-spin" />
                  <span>جارٍ الإرسال...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#2D6A4F]" />
                  <span>📲 تجربة إشعار فوري على هاتفي</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Adhan Voice & Sound Preferences Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D5] shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-[#F0ECE1] pb-3.5">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 text-[#2D6A4F]" />
            <h3 className="text-base sm:text-lg font-bold text-[#1F2421]">
              صوت الأذان والمؤذن 🔊
            </h3>
          </div>

          {/* Autoplay Audio Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#736B63] font-medium hidden sm:inline">
              صوت الأذان التلقائي:
            </span>
            <button
              type="button"
              onClick={handleToggleAutoplayAthan}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                autoPlayAthan ? 'bg-[#2D6A4F]' : 'bg-[#D1C9BE]'
              }`}
              role="switch"
              aria-checked={autoPlayAthan}
              title="تشغيل صوت الأذان تلقائياً عند دخول وقت الصلاة"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  autoPlayAthan ? 'translate-x-0' : '-translate-x-5'
                }`}
              />
            </button>
          </div>
        </div>

        <p className="text-xs text-[#736B63] leading-relaxed">
          اختاري صوت المؤذن المفضل لديكِ لسماع الأذان العذب عند دخول مواقيت الصلوات الخمس:
        </p>

        {/* Muadhin Choices Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ATHAN_AUDIOS.map((athan) => {
            const isSelected = athan.id === selectedAthanId;
            const isThisPlaying = isSelected && isPlayingAthan;

            return (
              <div
                key={athan.id}
                onClick={() => {
                  setSelectedAthanId(athan.id);
                  localStorage.setItem(STORAGE_KEY_SELECTED_ATHAN, athan.id);
                }}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#F5FAF6] border-[#2D6A4F] shadow-xs'
                    : 'bg-[#FAF7F2] border-[#E8E2D5] hover:bg-[#F3EFE6] text-[#2C2825]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs sm:text-sm font-bold truncate ${
                        isSelected ? 'text-[#1E4535]' : 'text-[#1F2421]'
                      }`}
                    >
                      {athan.name}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-[#736B63] block truncate mt-0.5">
                    {athan.subname}
                  </span>
                </div>

                {/* Play / Pause button for this voice */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleAthanAudio(athan);
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-2xs ${
                    isThisPlaying
                      ? 'bg-[#2D6A4F] text-white animate-pulse'
                      : isSelected
                      ? 'bg-[#2D6A4F]/15 text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white'
                      : 'bg-white text-[#736B63] hover:text-[#2D6A4F] border border-[#E8E2D5]'
                  }`}
                  title={isThisPlaying ? 'إيقاف الأذان' : 'سماع صوت الأذان'}
                >
                  {isThisPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Audio Error Banner */}
        {audioError && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{audioError}</span>
          </div>
        )}

        {/* Now Playing Active Equalizer Bar */}
        {isPlayingAthan && (
          <div className="p-3.5 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-between gap-3 shadow-md animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold block">{selectedAthan.name}</span>
                <span className="text-[10px] text-white/80">«الله أكبر الله أكبر..»</span>
              </div>
            </div>

            <button
              onClick={() => handleToggleAthanAudio()}
              className="px-3 py-1.5 rounded-xl bg-white text-[#2D6A4F] text-xs font-bold hover:bg-[#D8F3DC] transition-colors cursor-pointer"
            >
              إيقاف الأذان ✕
            </button>
          </div>
        )}

        {/* Du'a after Athan */}
        <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E8E2D5] text-center">
          <span className="text-[11px] font-bold text-[#2D6A4F] block mb-1">
            دعاء ما بعد الأذان المستجاب:
          </span>
          <p className="text-xs text-[#403B36] font-['Amiri',serif] leading-relaxed">
            «اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ»
          </p>
        </div>
      </div>

      {/* Mobile Operating System Guidance (كيف تعمل الإشعارات والموبايل مغلق؟) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D5] shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#F0ECE1] pb-3">
          <Smartphone className="w-5 h-5 text-[#2D6A4F]" />
          <h3 className="text-base sm:text-lg font-bold text-[#1F2421]">
            كيف تعمل الإشعارات عندما يكون الموبايل أو التطبيق مغلقاً؟ 📱
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-[#4A433D]">
          {/* Android Guide */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#2D6A4F]">
              <span>🤖</span>
              <span>هواتف أندرويد (Samsung / Xiaomi / وغيرها):</span>
            </div>
            <p className="leading-relaxed text-xs text-[#554E46]">
              بمجرد الضغط على زر <strong>«تفعيل إشعارات الهاتف»</strong> أعلاه واختيار <strong>«سماح» (Allow)</strong>، ستصلك التنبيهات في شريط الإشعارات وشاشة القفل تلقائياً كأي تطبيق هاتف، حتى لو أغلقتِ المتصفح أو الشاشة تماماً.
            </p>
            <div className="text-[11px] text-[#736B63] bg-white p-2 rounded-xl border border-[#E8E2D5]">
              💡 نصيحة: يمكنكِ الضغط على قائمة المتصفح (⋮) ثم «تثبيت التطبيق» للحصول على تجربة أسرع وأيقونة خاصة على شاشتك.
            </div>
          </div>

          {/* iOS / iPhone Guide */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#2D6A4F]">
              <span>🍏</span>
              <span>هواتف آيفون (Apple iOS):</span>
            </div>
            <p className="leading-relaxed text-xs text-[#554E46]">
              تشترط شركة آبل لتشغيل الإشعارات والتطبيق مغلق إضافة التطبيق للشاشة الرئيسية أولاً:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-[#554E46] leading-relaxed">
              <li>اضغطي على زر المشاركة أسفل متصفح Safari (الأيقونة المربعة مع سهم لأعلى ⎋).</li>
              <li>اختاري <strong>«إضافة إلى الشاشة الرئيسية»</strong> (Add to Home Screen).</li>
              <li>افتحي تطبيق <strong>أُنس</strong> من شاشة هاتفك واضغطي على تفعيل الإشعارات.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Reminders List & Customization */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-[#1F2421] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2D6A4F]" />
            <span>قائمة التنبيهات المجدولة للأوقات والصلوات:</span>
          </h3>
          <span className="text-xs text-[#736B63]">
            {reminders.filter((r) => r.enabled).length} من {reminders.length} مفعل
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`rounded-3xl p-4 sm:p-5 border transition-all ${
                reminder.enabled
                  ? 'bg-white border-[#2D6A4F]/30 shadow-xs'
                  : 'bg-[#FAF8F5] border-[#E8E2D5] opacity-75'
              }`}
            >
              {/* Top row: Title and Toggle */}
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      reminder.enabled
                        ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]'
                        : 'bg-[#E8E2D5] text-[#8C827A]'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-[#1F2421] truncate">
                      {reminder.title}
                    </h4>
                    <span className="text-[11px] text-[#736B63] block">
                      {reminder.isPrayerTime
                        ? 'تنبيه وأذان عند حلول وقت الصلاة'
                        : `الوقت المجدول: ${reminder.time}`}
                    </span>
                  </div>
                </div>

                {/* Custom Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleReminder(reminder.id)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    reminder.enabled ? 'bg-[#2D6A4F]' : 'bg-[#D1C9BE]'
                  }`}
                  role="switch"
                  aria-checked={reminder.enabled}
                  title={reminder.enabled ? 'تعطيل هذا التنبيه' : 'تفعيل هذا التنبيه'}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      reminder.enabled ? 'translate-x-0' : '-translate-x-5'
                    }`}
                  />
                </button>
              </div>

              {/* Time Picker (for non-prayer times) */}
              {!reminder.isPrayerTime && (
                <div className="mb-2.5 pt-2 border-t border-[#F0ECE1] flex items-center justify-between text-xs">
                  <label
                    htmlFor={`time-${reminder.id}`}
                    className="text-[#857B72] font-medium flex items-center gap-1"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    <span>تعديل وقت التنبيه:</span>
                  </label>
                  <input
                    id={`time-${reminder.id}`}
                    type="time"
                    disabled={!reminder.enabled}
                    value={reminder.time}
                    onChange={(e) => handleTimeChange(reminder.id, e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-[#F8F6F0] border border-[#E8E2D5] text-xs font-mono font-bold text-[#2D6A4F] disabled:opacity-40 focus:outline-hidden focus:border-[#2D6A4F]"
                  />
                </div>
              )}

              {/* Smart Message Preview */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs text-[#554E46]">
                <span className="text-[10px] font-semibold text-[#8C827A] block mb-0.5">
                  نص التذكير:
                </span>
                <p className="italic text-[#1E4535] font-medium leading-relaxed text-xs">
                  «{reminder.message}»
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
