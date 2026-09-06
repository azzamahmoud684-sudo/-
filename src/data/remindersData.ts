import { ReminderSetting } from '../types';

export const INITIAL_REMINDERS: ReminderSetting[] = [
  {
    id: 'rem-prayer',
    title: 'تنبيهات الصلوات الخمس',
    enabled: true,
    time: 'حسب مواقيت الأذان',
    message: 'حان وقت الصلاة 🤍.. استرح بها وأقبل على ربك بسكينة',
    isPrayerTime: true,
  },
  {
    id: 'rem-morning-adhkar',
    title: 'أذكار الصباح',
    enabled: true,
    time: '06:30',
    message: 'حان وقت أذكار الصباح 🌿.. ابدأ يومك بنور الذكر وحفظ الله',
  },
  {
    id: 'rem-evening-adhkar',
    title: 'أذكار المساء',
    enabled: true,
    time: '17:30',
    message: 'حان وقت أذكار المساء 🌅.. استودع يومك عند الله بحصن الذكر',
  },
  {
    id: 'rem-quran',
    title: 'ورد القرآن الكريم',
    enabled: true,
    time: '13:30',
    message: 'لا تنسَ وردك من القرآن اليوم 📖.. آيات تطيب بها الروح والقلب',
  },
  {
    id: 'rem-sleep-adhkar',
    title: 'أذكار النوم',
    enabled: true,
    time: '22:30',
    message: 'اقترب وقت النوم، هل قرأت أذكارك؟ 🌙.. ليلة هانئة في حفظ الرحمن',
  },
  {
    id: 'rem-witr',
    title: 'صلاة الوتر',
    enabled: true,
    time: '23:00',
    message: 'ركعة تضيء ظلمة الليل 🤍.. لا تحرم نفسك أجر الوتر ولو بركعة',
  },
  {
    id: 'rem-daily-worship',
    title: 'عبادة اليوم الموصى بها',
    enabled: false,
    time: '16:30',
    message: 'اجعل ليومك أثراً طيباً 🌿.. تفقد عبادة اليوم المقترحة في أُنس',
  },
];
