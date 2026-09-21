import { SeerahUserProgress } from '../types/seerah';

const SEERAH_STORAGE_KEY = 'ouns_seerah_progress_v1';

export function getInitialSeerahProgress(): SeerahUserProgress {
  return {
    completedEventIds: [],
    userReflections: {},
    lastViewedEventId: undefined,
    completedAtTimestamps: {},
  };
}

export function loadSeerahProgress(): SeerahUserProgress {
  try {
    const raw = localStorage.getItem(SEERAH_STORAGE_KEY);
    if (!raw) return getInitialSeerahProgress();
    const parsed = JSON.parse(raw);
    return {
      completedEventIds: Array.isArray(parsed.completedEventIds) ? parsed.completedEventIds : [],
      userReflections: parsed.userReflections && typeof parsed.userReflections === 'object' ? parsed.userReflections : {},
      lastViewedEventId: typeof parsed.lastViewedEventId === 'string' ? parsed.lastViewedEventId : undefined,
      completedAtTimestamps: parsed.completedAtTimestamps && typeof parsed.completedAtTimestamps === 'object' ? parsed.completedAtTimestamps : {},
    };
  } catch (e) {
    console.warn('[Seerah] Failed to load progress from localStorage:', e);
    return getInitialSeerahProgress();
  }
}

export function saveSeerahProgress(progress: SeerahUserProgress): void {
  try {
    localStorage.setItem(SEERAH_STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('[Seerah] Failed to save progress to localStorage:', e);
  }
}

/**
 * Marks an event as completed ONLY when user explicitly presses the completion button.
 */
export function markSeerahEventCompleted(eventId: string): SeerahUserProgress {
  const current = loadSeerahProgress();
  if (!current.completedEventIds.includes(eventId)) {
    current.completedEventIds.push(eventId);
    current.completedAtTimestamps[eventId] = Date.now();
    saveSeerahProgress(current);
  }
  return current;
}

export function unmarkSeerahEventCompleted(eventId: string): SeerahUserProgress {
  const current = loadSeerahProgress();
  current.completedEventIds = current.completedEventIds.filter((id) => id !== eventId);
  delete current.completedAtTimestamps[eventId];
  saveSeerahProgress(current);
  return current;
}

export function saveSeerahUserReflection(eventId: string, reflectionText: string): SeerahUserProgress {
  const current = loadSeerahProgress();
  current.userReflections[eventId] = reflectionText.trim();
  saveSeerahProgress(current);
  return current;
}

export function setSeerahLastViewed(eventId: string): SeerahUserProgress {
  const current = loadSeerahProgress();
  current.lastViewedEventId = eventId;
  saveSeerahProgress(current);
  return current;
}
