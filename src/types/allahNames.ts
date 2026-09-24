export interface AllahNameSource {
  bookRef: string;
  ayahOrHadith?: string;
}

export interface AllahNameItem {
  id: number;
  name: string;
  simpleName: string;
  meaning: string;
  reflection: string;
  livingWithTheName: string;
  dua: string;
  reflectionQuestion: string;
  source: AllahNameSource;
}

export interface AllahNamesUserProgress {
  completedIds: number[];
  favoriteIds: number[];
  lastViewedId: number;
  userNotes: Record<number, string>;
}
