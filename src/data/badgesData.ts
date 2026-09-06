import { Badge } from '../types';

export const APP_BADGES: Badge[] = [
  {
    id: 'badge-start',
    title: 'البداية',
    description: 'أول يوم لك في رحلتك المباركة مع تطبيق أُنس',
    icon: '🌱',
    unlocked: true, // Unlocked on first day
    progressText: 'تم الحصول عليه',
  },
  {
    id: 'badge-quran-lover',
    title: 'محب القرآن',
    description: 'إكمال ورد القرآن الكريم لعدة أيام واستمرار صلته بكتاب الله',
    icon: '📖',
    unlocked: false,
    progressText: 'اقرأ وردك 3 أيام لإلغاء القفل',
  },
  {
    id: 'badge-dhikr-keeper',
    title: 'محافظ على الذكر',
    description: 'إكمال أذكار الصباح والمساء بانتظام لتكون في معية الله وحفظه',
    icon: '🤍',
    unlocked: false,
    progressText: 'أكمل أذكار الصباح والمساء',
  },
  {
    id: 'badge-streak-keeper',
    title: 'الاستمرار',
    description: 'الحفاظ على سلسلة أيام متتالية في طاعة الله والتنظيم اليومي',
    icon: '🔥',
    unlocked: false,
    progressText: 'حافظ على 3 أيام متتالية',
  },
];
