import React, { useState, useEffect } from 'react';
import { SeerahEvent, SeerahUserProgress } from '../types/seerah';
import { SEERAH_EVENTS } from '../data/seerahData';
import {
  loadSeerahProgress,
  markSeerahEventCompleted,
  saveSeerahUserReflection,
  setSeerahLastViewed,
} from '../utils/seerahStorage';
import { SeerahTimeline } from './SeerahTimeline';
import { SeerahJourneyViewer } from './SeerahJourneyViewer';

interface SeerahSectionProps {
  initialEventId?: string | null;
}

export const SeerahSection: React.FC<SeerahSectionProps> = ({ initialEventId }) => {
  const [progress, setProgress] = useState<SeerahUserProgress>(() => loadSeerahProgress());
  const [activeEvent, setActiveEvent] = useState<SeerahEvent | null>(() => {
    if (initialEventId) {
      return SEERAH_EVENTS.find((e) => e.id === initialEventId) || null;
    }
    return null;
  });

  useEffect(() => {
    if (initialEventId) {
      const found = SEERAH_EVENTS.find((e) => e.id === initialEventId);
      if (found) setActiveEvent(found);
    }
  }, [initialEventId]);

  const handleSelectEvent = (event: SeerahEvent) => {
    setActiveEvent(event);
    setSeerahLastViewed(event.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteCurrentEvent = () => {
    if (!activeEvent) return;
    const updated = markSeerahEventCompleted(activeEvent.id);
    setProgress(updated);
  };

  const handleSaveReflection = (text: string) => {
    if (!activeEvent) return;
    const updated = saveSeerahUserReflection(activeEvent.id, text);
    setProgress(updated);
  };

  const handleBackToTimeline = () => {
    setActiveEvent(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToNextEvent = () => {
    if (!activeEvent) return;
    const currentIndex = SEERAH_EVENTS.findIndex((e) => e.id === activeEvent.id);
    if (currentIndex >= 0 && currentIndex < SEERAH_EVENTS.length - 1) {
      const next = SEERAH_EVENTS[currentIndex + 1];
      setActiveEvent(next);
      setSeerahLastViewed(next.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setActiveEvent(null);
    }
  };

  // Find next event for viewer navigation
  const nextEvent = activeEvent
    ? SEERAH_EVENTS[SEERAH_EVENTS.findIndex((e) => e.id === activeEvent.id) + 1]
    : undefined;

  return (
    <div className="w-full">
      {activeEvent ? (
        <SeerahJourneyViewer
          event={activeEvent}
          nextEvent={nextEvent}
          isCompleted={progress.completedEventIds.includes(activeEvent.id)}
          userReflection={progress.userReflections[activeEvent.id] || ''}
          onComplete={handleCompleteCurrentEvent}
          onSaveReflection={handleSaveReflection}
          onBackToTimeline={handleBackToTimeline}
          onGoToNextEvent={nextEvent ? handleGoToNextEvent : undefined}
        />
      ) : (
        <SeerahTimeline
          progress={progress}
          onSelectEvent={handleSelectEvent}
        />
      )}
    </div>
  );
};
