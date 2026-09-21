export interface SeerahScene {
  id: string;
  order: number;
  title?: string;
  badge?: string; // e.g. "غار حراء" | "الصدع بالحق" | "المدينة المنورة"
  text: string;
  quote?: {
    text: string;
    narrator?: string;
  };
}

export interface SeerahInteractiveQuestion {
  id: string;
  triggerAfterSceneIndex: number; // scene index after which the question is displayed (0-indexed)
  prompt: string; // e.g. "توقف لحظة 🤍"
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SeerahReflection {
  prompt: string; // e.g. "كيف تستلهم من ثبات النبي ﷺ في أوقات الشدة في حياتك المعاصرة؟"
  hint?: string;
}

export interface SeerahEvent {
  id: string;
  number: number; // 1 to 18
  title: string;
  subtitle: string;
  era: 'meccan' | 'medinan';
  eraLabel: string; // "العهد المكي" | "العهد المدني"
  timeframe: string; // e.g. "قبل البعثة النبوية" | "السنة العاشرة من البعثة" | "السنة الثانية للهجرة"
  icon: string; // Symbolic icon (never depictions) e.g. 🌙, 🏔️, 📜, 🕊️, 🌿, 🕌
  teaser: string;
  scenes: SeerahScene[];
  interactiveQuestion?: SeerahInteractiveQuestion;
  reflection: SeerahReflection;
  source: string; // Documented authentic Islamic source
}

export interface SeerahUserProgress {
  completedEventIds: string[];
  userReflections: Record<string, string>; // eventId -> user's reflection text
  lastViewedEventId?: string;
  completedAtTimestamps: Record<string, number>; // eventId -> timestamp
}
