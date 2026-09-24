import { AllahNamesUserProgress } from '../types/allahNames';

const STORAGE_KEY = 'ouns_allah_names_progress_v1';

export function getInitialAllahNamesProgress(): AllahNamesUserProgress {
  return {
    completedIds: [],
    favoriteIds: [],
    lastViewedId: 1,
    userNotes: {},
  };
}

export function loadAllahNamesProgress(): AllahNamesUserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialAllahNamesProgress();
    const parsed = JSON.parse(raw);
    return {
      completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds : [],
      favoriteIds: Array.isArray(parsed.favoriteIds) ? parsed.favoriteIds : [],
      lastViewedId: typeof parsed.lastViewedId === 'number' ? parsed.lastViewedId : 1,
      userNotes: parsed.userNotes && typeof parsed.userNotes === 'object' ? parsed.userNotes : {},
    };
  } catch (e) {
    console.warn('[AllahNames] Failed to load progress from localStorage:', e);
    return getInitialAllahNamesProgress();
  }
}

export function saveAllahNamesProgress(progress: AllahNamesUserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('[AllahNames] Failed to save progress to localStorage:', e);
  }
}

export function toggleAllahNameCompleted(id: number): AllahNamesUserProgress {
  const current = loadAllahNamesProgress();
  const exists = current.completedIds.includes(id);
  if (exists) {
    current.completedIds = current.completedIds.filter((item) => item !== id);
  } else {
    current.completedIds.push(id);
  }
  saveAllahNamesProgress(current);
  return current;
}

export function toggleAllahNameFavorite(id: number): AllahNamesUserProgress {
  const current = loadAllahNamesProgress();
  const exists = current.favoriteIds.includes(id);
  if (exists) {
    current.favoriteIds = current.favoriteIds.filter((item) => item !== id);
  } else {
    current.favoriteIds.push(id);
  }
  saveAllahNamesProgress(current);
  return current;
}

export function setAllahNameLastViewed(id: number): AllahNamesUserProgress {
  const current = loadAllahNamesProgress();
  current.lastViewedId = id;
  saveAllahNamesProgress(current);
  return current;
}

export function saveAllahNameNote(id: number, note: string): AllahNamesUserProgress {
  const current = loadAllahNamesProgress();
  if (note.trim().length > 0) {
    current.userNotes[id] = note.trim();
  } else {
    delete current.userNotes[id];
  }
  saveAllahNamesProgress(current);
  return current;
}
