import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Send,
  Smartphone,
  Shield,
  Clock,
  Sparkles,
  X,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToWebPush,
  unsubscribeFromWebPush,
  sendTestPushNotification,
  getCurrentPushSubscription,
  loadSavedPreferences,
  updatePushPreferencesOnServer,
  PushPreferences,
} from '../utils/pushManager';

interface PushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates?: { lat: number; lng: number } | null;
}

export const PushNotificationModal: React.FC<PushNotificationModalProps> = ({
  isOpen,
  onClose,
  coordinates,
}) => {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<PushPreferences>(loadSavedPreferences);

  useEffect(() => {
    if (!isOpen) return;

    const checkStatus = async () => {
      const isSupp = isPushSupported();
      setSupported(isSupp);
      if (!isSupp) return;

      const perm = getNotificationPermission();
      setPermission(perm);

      const sub = await getCurrentPushSubscription();
      setIsSubscribed(Boolean(sub));
    };

    checkStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setTestResult(null);

    const result = await subscribeToWebPush(
      preferences,
      coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : undefined
    );

    setIsLoading(false);

    if (result.success) {
      setIsSubscribed(true);
      setPermission('granted');
      setTestResult({
        success: true,
        message: 'تم تفعيل إشعارات الهاتف بنجاح! يمكنك الآن إرسال إشعار تجريبي.',
      });
    } else {
      setErrorMessage(result.error || 'تعذر تفعيل الإشعارات.');
      setPermission(getNotificationPermission());
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setTestResult(null);

    const result = await unsubscribeFromWebPush();
    setIsLoading(false);

    if (result.success) {
      setIsSubscribed(false);
      setTestResult({
        success: true,
        message: 'تم إلغاء تفعيل الإشعارات لهذا الجهاز.',
      });
    } else {
      setErrorMessage(result.error || 'حدث خطأ أثناء إلغاء الاشتراك.');
    }
  };

  const handleSendTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setErrorMessage(null);

    const res = await sendTestPushNotification(
      'أُنس - تجربة إشعار حقيقي 🌙',
      'هذا إشعار حقيقي عبر خدمة Web Push لنظام أندرويد! يظهر على هاتفك حتى والموقع مغلق تماماً 🤍'
    );

    setIsTesting(false);

    if (res.success) {
      setTestResult({
        success: true,
        message: 'تم إرسال الإشعار التجريبي بنجاح عبر خوادم Google FCM! تفقّد شريط إشعارات هاتفك الآن 📲',
      });
    } else {
      setErrorMessage(res.error || 'تعذر إرسال الإشعار التجريبي.');
    }
  };

  const handleTogglePreference = async (key: keyof PushPreferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    if (isSubscribed) {
      await updatePushPreferencesOnServer(
        updated,
        coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : undefined
      );
    }
  };

  return (
    <div
      id="push-notification-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="push-notification-modal-content"
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E8E2D5] space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F5E9] border border-[#A5D6A7] text-[#2D6A4F] flex items-center justify-center text-xl shadow-xs">
              <Bell className="w-5 h-5 text-[#2D6A4F]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1F2421]">إشعارات الهاتف الحقيقية 📲</h3>
              <p className="text-xs text-[#736B63]">نظام Web Push المتوافق مع أندرويد</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#736B63] hover:text-[#1F2421] hover:bg-[#EAE5D9] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real Android Push Explanation Callout */}
        <div className="bg-[#FAF7F2] border border-[#E8E2D5] rounded-2xl p-4 text-xs text-[#524B43] leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#2D6A4F] text-sm">
            <Smartphone className="w-4 h-4" />
            <span>كيف تعمل إشعارات أندرويد الحقيقية؟</span>
          </div>
          <p>
            تعتمد هذه الميزة على تقنية <strong>Web Push الرسمية (W3C)</strong> المدعومة في نظام أندرويد عبر{' '}
            <strong>Google FCM</strong> و <strong>Service Worker</strong>؛ بحيث تصلك التنبيهات إلى شريط إشعارات الهاتف مع الاهتزاز والصوت <strong>حتى لو كان الموقع مغلقاً بالكامل أو الشاشة مقفلة</strong>.
          </p>
        </div>

        {/* Browser Support Check */}
        {!supported && (
          <div className="bg-[#FFF4E5] border border-[#FFE0B2] text-[#A25A19] rounded-2xl p-4 flex items-start gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">المتصفح الحالي لا يدعم Web Push</p>
              <p>
                للحصول على إشعارات الهاتف حتى عند إغلاق التطبيق، يرجى فتح الرابط عبر متصفح <strong>Google Chrome</strong> أو <strong>Samsung Internet</strong> على هاتفك الأندرويد.
              </p>
            </div>
          </div>
        )}

        {/* Permission Denied Warning */}
        {supported && permission === 'denied' && (
          <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#C0392B] rounded-2xl p-4 flex items-start gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">تم رفض إذن الإشعارات في متصفحك</p>
              <p>
                يرجى الضغط على علامة القفل 🔒 بجانب رابط الموقع في شريط العنوان، ثم اختيار "الأذونات" والسماح بـ "الإشعارات"، ثم إعادة تحميل الصفحة.
              </p>
            </div>
          </div>
        )}

        {/* Status & Subscription Control */}
        {supported && permission !== 'denied' && (
          <div className="space-y-3">
            {isSubscribed ? (
              <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#2D6A4F]">
                    <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                    <span>الإشعارات نشطة ومسجلة في جهازك بنجاح</span>
                  </div>
                  <span className="text-[10px] bg-white/80 text-[#2D6A4F] px-2 py-0.5 rounded-full font-bold border border-[#A5D6A7]/60">
                    Google FCM متصل
                  </span>
                </div>

                <p className="text-[11px] text-[#2D6A4F]/90">
                  سيتولى خادم أُنس إرسال التنبيهات المجدولة لهاتفك في مواعيدها المحددة.
                </p>

                {/* Test Push Button */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={isTesting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4535] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري إرسال الإشعار التجريبي...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>إرسال إشعار تجريبي فوري لهاتفي 📲</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleUnsubscribe}
                    disabled={isLoading}
                    className="px-3 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E8E2D5] text-[#857B72] hover:text-[#C0392B] text-xs font-medium transition-colors cursor-pointer"
                  >
                    إلغاء التفعيل
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-[#2D6A4F] hover:bg-[#1E4535] text-white text-sm font-bold shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري تهيئة الاشتراك والتشفير...</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      <span>تفعيل إشعارات الهاتف الآن (Android Web Push)</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-[#857B72]">
                  سيطلب المتصفح موافقتك على إرسال الإشعارات. اختر «سماح / Allow».
                </p>
              </div>
            )}
          </div>
        )}

        {/* Success or Error messages */}
        {testResult && (
          <div className="p-3 bg-[#E8F5E9] border border-[#A5D6A7] rounded-xl text-xs font-medium text-[#2D6A4F] flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{testResult.message}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-[#FDEDEC] border border-[#FADBD8] rounded-xl text-xs font-medium text-[#C0392B] flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Categories Selection */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1F2421]">اختر التنبيهات التي ترغب بها:</span>
            <span className="text-[11px] text-[#857B72]">يتم الحفظ تلقائياً</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Prayers */}
            <button
              type="button"
              onClick={() => handleTogglePreference('prayers')}
              className={`p-3 rounded-2xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                preferences.prayers
                  ? 'bg-[#F4F9F5] border-[#A5D6A7] text-[#2D6A4F]'
                  : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#857B72]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <div>
                  <div className="text-xs font-bold">مواقيت الصلاة والأذان</div>
                  <div className="text-[10px] opacity-75">الصلوات الخمس في أوقاتها</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.prayers}
                onChange={() => {}}
                className="w-4 h-4 accent-[#2D6A4F] rounded pointer-events-none"
              />
            </button>

            {/* Athkar */}
            <button
              type="button"
              onClick={() => handleTogglePreference('athkar')}
              className={`p-3 rounded-2xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                preferences.athkar
                  ? 'bg-[#F4F9F5] border-[#A5D6A7] text-[#2D6A4F]'
                  : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#857B72]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <div>
                  <div className="text-xs font-bold">أذكار الصباح والمساء</div>
                  <div className="text-[10px] opacity-75">تنبيه صباحي ومسائي مأثور</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.athkar}
                onChange={() => {}}
                className="w-4 h-4 accent-[#2D6A4F] rounded pointer-events-none"
              />
            </button>

            {/* Daily Tasks */}
            <button
              type="button"
              onClick={() => handleTogglePreference('tasks')}
              className={`p-3 rounded-2xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                preferences.tasks
                  ? 'bg-[#F4F9F5] border-[#A5D6A7] text-[#2D6A4F]'
                  : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#857B72]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">📝</span>
                <div>
                  <div className="text-xs font-bold">تذكير مهام اليوم</div>
                  <div className="text-[10px] opacity-75">متابعة إنجاز قائمة مهامك</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.tasks}
                onChange={() => {}}
                className="w-4 h-4 accent-[#2D6A4F] rounded pointer-events-none"
              />
            </button>

            {/* Occasions */}
            <button
              type="button"
              onClick={() => handleTogglePreference('occasions')}
              className={`p-3 rounded-2xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                preferences.occasions
                  ? 'bg-[#F4F9F5] border-[#A5D6A7] text-[#2D6A4F]'
                  : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#857B72]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🌙</span>
                <div>
                  <div className="text-xs font-bold">الأيام البيض والمناسبات</div>
                  <div className="text-[10px] opacity-75">مواسم الخير والصيام</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.occasions}
                onChange={() => {}}
                className="w-4 h-4 accent-[#2D6A4F] rounded pointer-events-none"
              />
            </button>
          </div>
        </div>

        {/* Android Installation & Optimization Tips */}
        <div className="border-t border-[#F0ECE1] pt-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F2421]">
            <Shield className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>نصائح هامة لضمان وصول الإشعارات في أندرويد:</span>
          </div>

          <ul className="text-[11px] text-[#736B63] space-y-1.5 list-disc list-inside">
            <li>
              <strong>تثبيت التطبيق (PWA):</strong> اضغط على قائمة المتصفح (⋮) واختر <strong>«إضافة إلى الشاشة الرئيسية»</strong> أو <strong>«تثبيت التطبيق»</strong>.
            </li>
            <li>
              <strong>توفير الطاقة في هواتف شاومي وسامسونج:</strong> افتح إعدادات التطبيق في هاتفك وتأكد من تعطيل «تحسين البطارية / Battery Optimization» لكي يعمل الإشعار فورياً حتى في وضع السكون العميق.
            </li>
            <li>
              <strong>التشفير والأمان:</strong> جميع الاشتراكات مشفرة بمفاتيح <strong>VAPID</strong> الآمنة، ولا يمكن لأي طرف ثالث قراءة بياناتك.
            </li>
          </ul>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE5D9] text-xs font-bold text-[#524B43] transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
