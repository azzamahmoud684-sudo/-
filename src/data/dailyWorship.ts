import { DailyActivity, TimePeriod } from '../types';

export interface DailyWorshipItem {
  id: string;
  title: string;
  actionText: string;
  virtue: string;
  category: 'نوافل' | 'صدقة' | 'إحسان' | 'ذكر' | 'بر' | 'تدبر' | 'شكر' | 'استغفار';
  dayNumber?: number;
}

// 31 distinct Islamic daily worships — ensuring every day of the month is 100% unique,
// and adjacent days are mathematically guaranteed to differ.
export const DAILY_WORSHIP_SUGGESTIONS: DailyWorshipItem[] = [
  {
    id: 'dw1',
    dayNumber: 1,
    title: 'صلاة ركعتي الضحى',
    actionText: 'صلِّ ركعتين خفيفتين بين طلوع الشمس والظهر',
    virtue: '«يُصْبِحُ عَلَى كُلِّ سُلاَمَى مِنْ أَحَدِكُمْ صَدَقَةٌ... وَيُجْزِئُ مِنْ ذَلِكَ رَكْعَتَانِ يَرْكَعُهُمَا مِنَ الضُّحَى»',
    category: 'نوافل',
  },
  {
    id: 'dw2',
    dayNumber: 2,
    title: 'الصدقة ولو بشق تمرة أو معروف',
    actionText: 'تصدق بمال أو طعام أو كلمة طيبة في السر',
    virtue: '«الصدقة تطفئ غضب الرب وتدفع ميتة السوء وتطفئ الخطيئة كما يطفئ الماء النار»',
    category: 'صدقة',
  },
  {
    id: 'dw3',
    dayNumber: 3,
    title: 'صلة الرحم برسالة أو مكالمة',
    actionText: 'تواصل مع أحد الأقارب أو الأرحام واطمئن عليه',
    virtue: '«من أحب أن يُبسط له في رزقه ويُنسأ له في أثره فليصل رحمه»',
    category: 'بر',
  },
  {
    id: 'dw4',
    dayNumber: 4,
    title: 'الصلاة على النبي ﷺ 100 مرة',
    actionText: 'صلِّ على الحبيب المصطفى بحضور قلب وتأمل',
    virtue: '«من صلى عليّ صلاة واحدة صلى الله عليه بها عشراً وحُطت عنه عشر خطيئات ورُفعت له عشر درجات»',
    category: 'ذكر',
  },
  {
    id: 'dw5',
    dayNumber: 5,
    title: 'سجدة شكر لله تعالى على نعمه',
    actionText: 'اسجد واحمد الله تعالى على نعمة خاصة استشعرتها اليوم',
    virtue: '«لئن شكرتم لأزيدنكم» استشعار نعم الله الخفية والظاهرة وحفظ النعمة بدوام الشكر',
    category: 'شكر',
  },
  {
    id: 'dw6',
    dayNumber: 6,
    title: 'الاستغفار بالأسحار وساعة الخلوة',
    actionText: 'استغفر الله 100 مرة بتوبة صادقة وندم',
    virtue: '«والمستغفرين بالأسحار» سبب للرحمة والمغفرة وانشراح الصدر ونزول البركات',
    category: 'استغفار',
  },
  {
    id: 'dw7',
    dayNumber: 7,
    title: 'إفشاء السلام والابتسامة في وجوه الناس',
    actionText: 'سلِّم بطلاقة وجه على من تعرف ومن لم تعرف',
    virtue: '«تبسمك في وجه أخيك لك صدقة» و «أفشوا السلام وأطعموا الطعام تدخلوا الجنة بسلام»',
    category: 'إحسان',
  },
  {
    id: 'dw8',
    dayNumber: 8,
    title: 'قيام الليل بركعتين مع الوتر',
    actionText: 'قم في جوف الليل ولو بركعتين خاشعتين قبل الفجر',
    virtue: '«أفضل الصلاة بعد الفريضة صلاة الليل» ودأب الصالحين ومطردة للداء عن الجسد',
    category: 'نوافل',
  },
  {
    id: 'dw9',
    dayNumber: 9,
    title: 'الدعاء بظهر الغيب لأخ مسلم أو قريب',
    actionText: 'ادعُ لمن تحب أو لمريض أو لمبتلى بظهر الغيب دون علمه',
    virtue: '«دعوة المرء المسلم لأخيه بظهر الغيب مستجابة، عند رأسه مَلَكٌ موكَّل يقول: آمين ولك بمثل»',
    category: 'إحسان',
  },
  {
    id: 'dw10',
    dayNumber: 10,
    title: 'إماطة الأذى وكف الشر',
    actionText: 'أمِط أذى عن طريق أو نظّف مكاناً أو كف لسانك عن الأذى',
    virtue: '«تميط الأذى عن الطريق صدقة» وسبب لغفران الذنوب ودخول الجنة',
    category: 'إحسان',
  },
  {
    id: 'dw11',
    dayNumber: 11,
    title: 'سُنة الفجر والتبكير إلى الصلاة',
    actionText: 'احرص على ركعتي سنة الفجر القبلية بخشوع',
    virtue: '«ركعتا الفجر خير من الدنيا وما فيها»',
    category: 'نوافل',
  },
  {
    id: 'dw12',
    dayNumber: 12,
    title: 'جبر الخواطر وإدخال السرور على مسلم',
    actionText: 'طيّب خاطر مهموم أو أرسل كلمة تشجيع أو ساعد محتاجاً',
    virtue: '«أحب الأعمال إلى الله سرور تدخله على مسلم، أو تكشف عنه كربة»',
    category: 'إحسان',
  },
  {
    id: 'dw13',
    dayNumber: 13,
    title: 'تدبر آية من كتاب الله والعمل بها',
    actionText: 'اختر آية واحدة اليوم، اقرأ تفسيرها وطبّق معناها',
    virtue: '«كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ وَلِيَتَذَكَّرَ أُولُو الْأَلْبَابِ»',
    category: 'تدبر',
  },
  {
    id: 'dw14',
    dayNumber: 14,
    title: 'بر الوالدين والدعاء لهما',
    actionText: 'قبّل يد والديك أو اتصل بهما أو تصدق وادعُ لهما بالرحمة',
    virtue: '«رِضَا الرَّبِّ فِي رِضَا الْوَالِدَيْنِ، وَسَخَطُ الرَّبِّ فِي سَخَطِهِمَا»',
    category: 'بر',
  },
  {
    id: 'dw15',
    dayNumber: 15,
    title: 'إطعام طعام أو سقي ماء لطائر أو إنسان',
    actionText: 'ضع ماءً لطيور أو تبرع بوجبة لمحتاج أو اسقِ عطشاناً',
    virtue: '«في كل كبد رطبة أجر» وأفضل الصدقة سقي الماء',
    category: 'صدقة',
  },
  {
    id: 'dw16',
    dayNumber: 16,
    title: 'الحوقلة (لا حول ولا قوة إلا بالله) 100 مرة',
    actionText: 'ردد الحوقلة باستشعار التبرؤ من الحول والقوة',
    virtue: 'كنز من كنوز الجنة وباب عظيم من أبواب الفرج وتفريج الهموم',
    category: 'ذكر',
  },
  {
    id: 'dw17',
    dayNumber: 17,
    title: 'كظم الغيظ والعفو عمن أساء',
    actionText: 'اعفُ عمن أخطأ بحقك واكظم غيظك احتساباً لوجه الله',
    virtue: '«وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ ۗ وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ»',
    category: 'إحسان',
  },
  {
    id: 'dw18',
    dayNumber: 18,
    title: 'سنة الرواتب (12 ركعة)',
    actionText: 'حافظ اليوم على السنن الرواتب التابعة للصلوات المفروضة',
    virtue: '«ما من عبد مسلم يصلي لله كل يوم اثنتي عشرة ركعة تطوعاً غير فريضة إلا بنى الله له بيتاً في الجنة»',
    category: 'نوافل',
  },
  {
    id: 'dw19',
    dayNumber: 19,
    title: 'التسبيح والتحميد والتكبير (الباقيات الصالحات)',
    actionText: 'ردد: سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر',
    virtue: '«أحب الكلام إلى الله أربع: سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر» وهي الباقيات الصالحات',
    category: 'ذكر',
  },
  {
    id: 'dw20',
    dayNumber: 20,
    title: 'زيارة مريض أو تفقد مبتلى',
    actionText: 'قم بزيارة مريض أو اتصل به وادعُ له بالشفاء',
    virtue: '«من عاد مريضاً لم يزل في خُرفة الجنة حتى يرجع، واستغفر له سبعون ألف مَلَك»',
    category: 'إحسان',
  },
  {
    id: 'dw21',
    dayNumber: 21,
    title: 'قراءة حديث نبوي شريف مع شرحه',
    actionText: 'اقرأ حديثاً من رياض الصالحين أو الأربعين النووية وافهمه',
    virtue: '«نضّر الله امرأً سمع مقالتي فوعاها وحفظها وبلّغها»',
    category: 'تدبر',
  },
  {
    id: 'dw22',
    dayNumber: 22,
    title: 'سيد الاستغفار مع التوبة النصوح',
    actionText: 'اقرأ سيد الاستغفار بتأنٍّ وتأمل لمعانيه وتجديد التوبة',
    virtue: '«من قاله موقناً به من ليلته فمات قبل أن يصبح كان من أهل الجنة»',
    category: 'استغفار',
  },
  {
    id: 'dw23',
    dayNumber: 23,
    title: 'إعانة ذي حاجة أو قضاء مصلحة',
    actionText: 'سخّر جزءاً من وقتك لمساعدة زميل أو جار أو عابر سبيل',
    virtue: '«والله في عون العبد ما كان العبد في عون أخيه» ولأن أمشي في حاجة أخي أحب إليّ من اعتكاف شهر',
    category: 'إحسان',
  },
  {
    id: 'dw24',
    dayNumber: 24,
    title: 'صيام التطوع (اثنين أو خميس أو الأيام البيض)',
    actionText: 'انوِ صيام نافلة أو صم يوماً لله تعالى',
    virtue: '«من صام يوماً في سبيل الله باعد الله وجهه عن النار سبعين خريفاً»',
    category: 'نوافل',
  },
  {
    id: 'dw25',
    dayNumber: 25,
    title: 'حمد الله بعد الطعام والشراب واللباس',
    actionText: 'استحضر فضل الله وقل: الحمد لله الذي أطعمني هذا ورزقنيه',
    virtue: '«إن الله ليرضى عن العبد أن يأكل الأكلة فيحمده عليها أو يشرب الشربة فيحمده عليها»',
    category: 'شكر',
  },
  {
    id: 'dw26',
    dayNumber: 26,
    title: 'حفظ آية جديدة أو مراجعة سورة قصيرة',
    actionText: 'احفظ آية أو سورة قصيرة من جزء عمّ ورتلها في صلاتك',
    virtue: '«يقال لصاحب القرآن: اقرأ وارتقِ ورتّل كما كنت ترتّل في الدنيا فإن منزلتك عند آخر آية تقرؤها»',
    category: 'تدبر',
  },
  {
    id: 'dw27',
    dayNumber: 27,
    title: 'قول «سبحان الله وبحمده» 100 مرة',
    actionText: 'سبّح الله 100 مرة في الصباح أو المساء',
    virtue: '«حُطّت خطاياه وإن كانت مثل زبد البحر ولم يأت أحد بأفضل مما جاء به يوم القيامة»',
    category: 'ذكر',
  },
  {
    id: 'dw28',
    dayNumber: 28,
    title: 'الدعاء لجميع المسلمين والمسلمات والأموات',
    actionText: 'قل: اللهم اغفر للمؤمنين والمؤمنات والمسلمين والمسلمات الأحياء منهم والأموات',
    virtue: '«من استغفر للمؤمنين والمؤمنات كتب الله له بكل مؤمن ومؤمنة حسنة»',
    category: 'إحسان',
  },
  {
    id: 'dw29',
    dayNumber: 29,
    title: 'ركعتا التوبة والإنابة',
    actionText: 'توضأ وصلِّ ركعتين لا تحدّث فيهما نفسك بشيء من الدنيا واستغفر',
    virtue: '«ما من عبد يذنب ذنباً فيحسن الطهور ثم يقوم فيصلي ركعتين ثم يستغفر الله إلا غفر الله له»',
    category: 'نوافل',
  },
  {
    id: 'dw30',
    dayNumber: 30,
    title: 'محاسبة النفس قبل النوم وتصفية القلوب',
    actionText: 'حاسب نفسك على ما قدمت اليوم وسامح كل من أخطأ بحقك ونم سليم الصدر',
    virtue: 'سلامة الصدر من صفات أهل الجنة: «وَنَزَعْنَا مَا فِي صُدُورِهِم مِّنْ غِلٍّ إِخْوَانًا عَلَىٰ سُرُرٍ مُّتَقَابِلِينَ»',
    category: 'استغفار',
  },
  {
    id: 'dw31',
    dayNumber: 31,
    title: 'الصدقة الجارية أو الدلالة على خير',
    actionText: 'انشر علماً نافعاً أو شارك ذكراً أو دلّ غيرك على عمل صالح',
    virtue: '«الدال على الخير كفاعله» وإذا مات ابن آدم انقطع عمله إلا من ثلاث منها صدقة جارية أو علم يُنتفع به',
    category: 'صدقة',
  },
];

/**
 * Calculates a deterministic daily index based on calendar date.
 * Mathematically guarantees that today !== yesterday !== tomorrow.
 */
export function getDailyWorshipIndex(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Calculate total days elapsed since epoch for precise day-to-day distinction
  const utcDays = Math.floor(Date.UTC(year, month, day) / (24 * 60 * 60 * 1000));
  
  const count = DAILY_WORSHIP_SUGGESTIONS.length;
  // Modulo calculation guaranteed positive
  return ((utcDays % count) + count) % count;
}

/**
 * Returns today's worship item. Strictly different from yesterday!
 */
export function getTodayWorship(date: Date = new Date()): DailyWorshipItem {
  const index = getDailyWorshipIndex(date);
  return DAILY_WORSHIP_SUGGESTIONS[index];
}

/**
 * Returns yesterday's worship item. Guaranteed different from today.
 */
export function getYesterdayWorship(date: Date = new Date()): DailyWorshipItem {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return getTodayWorship(yesterday);
}

/**
 * Returns tomorrow's worship item. Guaranteed different from today.
 */
export function getTomorrowWorship(date: Date = new Date()): DailyWorshipItem {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getTodayWorship(tomorrow);
}

// Master Daily Journey Items definition
export const BASE_DAILY_ACTIVITIES: Omit<DailyActivity, 'status'>[] = [
  // 🌅 الصباح
  {
    id: 'act-fajr',
    title: 'صلاة الفجر',
    subtitle: 'في وقتها مع ركعتي الفجر',
    period: 'morning',
    type: 'prayer',
    iconName: 'Sunrise',
    actionTarget: 'prayer',
    defaultTimeRange: '04:30 - 06:00',
  },
  {
    id: 'act-morning-adhkar',
    title: 'أذكار الصباح (27 ذكراً)',
    subtitle: 'حصن المسلم والسكينة الصباحية المباركة',
    period: 'morning',
    type: 'adhkar',
    iconName: 'Sun',
    actionTarget: 'adhkar_morning',
    defaultTimeRange: '06:00 - 11:30',
  },
  {
    id: 'act-quran-morning',
    title: 'ورد القرآن',
    subtitle: 'قراءة صفحتين أو أكثر بتدبر',
    period: 'morning',
    type: 'quran',
    iconName: 'BookOpen',
    actionTarget: 'quran',
    defaultTimeRange: '06:30 - 11:30',
  },

  // ☀️ الظهر
  {
    id: 'act-dhuhr',
    title: 'صلاة الظهر',
    subtitle: 'أربع ركعات وسنن الرواتب',
    period: 'dhuhr',
    type: 'prayer',
    iconName: 'SunMedium',
    actionTarget: 'prayer',
    defaultTimeRange: '12:45 - 15:30',
  },
  {
    id: 'act-tasbeeh-midday',
    title: 'تسبيح',
    subtitle: 'مائة تسبيحة واستغفار في منتصف اليوم',
    period: 'dhuhr',
    type: 'tasbeeh',
    iconName: 'Sparkles',
    actionTarget: 'tasbeeh',
    defaultTimeRange: '13:00 - 15:30',
  },
  {
    id: 'act-quran-followup',
    title: 'متابعة ورد القرآن',
    subtitle: 'تثبيت الآيات والتدبر في معانيها',
    period: 'dhuhr',
    type: 'quran',
    iconName: 'BookMarked',
    actionTarget: 'quran',
    defaultTimeRange: '13:30 - 16:00',
  },

  // 🌤️ العصر
  {
    id: 'act-asr',
    title: 'صلاة العصر',
    subtitle: 'الصلاة الوسطى؛ أربع ركعات',
    period: 'asr',
    type: 'prayer',
    iconName: 'CloudSun',
    actionTarget: 'prayer',
    defaultTimeRange: '16:15 - 18:30',
  },
  {
    id: 'act-daily-worship',
    title: 'عبادة اليوم',
    subtitle: getTodayWorship().title,
    period: 'asr',
    type: 'worship',
    iconName: 'HeartHandshake',
    actionTarget: 'worship',
    defaultTimeRange: '16:30 - 18:45',
  },

  // 🌅 المغرب
  {
    id: 'act-maghrib',
    title: 'صلاة المغرب',
    subtitle: 'ثلاث ركعات مع راتبة المغرب',
    period: 'maghrib',
    type: 'prayer',
    iconName: 'Sunset',
    actionTarget: 'prayer',
    defaultTimeRange: '19:10 - 20:15',
  },
  {
    id: 'act-evening-adhkar',
    title: 'أذكار المساء (27 ذكراً)',
    subtitle: 'شكر النعمة وحصن المساء وطمأنينة القلب',
    period: 'maghrib',
    type: 'adhkar',
    iconName: 'Moon',
    actionTarget: 'adhkar_evening',
    defaultTimeRange: '17:30 - 20:30',
  },

  // 🌙 الليل
  {
    id: 'act-isha',
    title: 'صلاة العشاء',
    subtitle: 'أربع ركعات في جماعة أو بخشوع',
    period: 'night',
    type: 'prayer',
    iconName: 'MoonStar',
    actionTarget: 'prayer',
    defaultTimeRange: '20:30 - 23:00',
  },
  {
    id: 'act-quran-night',
    title: 'ورد القرآن',
    subtitle: 'سورة الملك أو وردك الليلي',
    period: 'night',
    type: 'quran',
    iconName: 'BookOpen',
    actionTarget: 'quran',
    defaultTimeRange: '21:00 - 23:30',
  },
  {
    id: 'act-witr',
    title: 'الوتر',
    subtitle: 'ركعة أو ثلاث؛ ختام صلاة الليل',
    period: 'night',
    type: 'prayer',
    iconName: 'Flame',
    actionTarget: 'prayer',
    defaultTimeRange: '21:30 - 03:30',
  },
  {
    id: 'act-sleep-adhkar',
    title: 'أذكار النوم',
    subtitle: 'السكينة واستيداع النفس لله',
    period: 'night',
    type: 'adhkar',
    iconName: 'BedDouble',
    actionTarget: 'adhkar_sleep',
    defaultTimeRange: '22:00 - 04:00',
  },
];

export const PERIOD_META: Record<
  TimePeriod,
  { name: string; icon: string; timeHint: string; description: string }
> = {
  morning: {
    name: 'الصباح',
    icon: 'Sunrise',
    timeHint: 'من الفجر حتى الظهر',
    description: 'بداية يوم مباركة ونفحات إيمانية تملأ القلب طمأنينة',
  },
  dhuhr: {
    name: 'الظهر',
    icon: 'SunMedium',
    timeHint: 'منتصف النهار',
    description: 'استراحة روحية وتجديد للطاقة في زحمة الأعمال',
  },
  asr: {
    name: 'العصر',
    icon: 'CloudSun',
    timeHint: 'ما بعد العصر إلى الغروب',
    description: 'لحظات استجابة وعبادة مباركة تدوم بركتها',
  },
  maghrib: {
    name: 'المغرب',
    icon: 'Sunset',
    timeHint: 'وقت الغروب وأذكار المساء',
    description: 'شكر الله على نعم اليوم واستقبال المساء بالذكر',
  },
  night: {
    name: 'الليل',
    icon: 'Moon',
    timeHint: 'من العشاء حتى الفجر',
    description: 'خلوة مع الله وسكينة النفس وورد القرآن والوتر',
  },
};

export function getCurrentTimePeriod(hour: number = new Date().getHours()): TimePeriod {
  if (hour >= 4 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 16) return 'dhuhr';
  if (hour >= 16 && hour < 19) return 'asr';
  if (hour >= 19 && hour < 21) return 'maghrib';
  return 'night';
}
