import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { HeroNowSection } from './components/HeroNowSection';
import { DailyTimeline } from './components/DailyTimeline';
import { AdhkarListView } from './components/AdhkarListView';
import { CharitySection } from './components/CharitySection';
import { ProgressDashboard } from './components/ProgressDashboard';
import { RemindersView } from './components/RemindersView';
import { AdhkarViewerModal } from './components/AdhkarViewerModal';
import { TasbeehModal } from './components/TasbeehModal';
import { QuranModal } from './components/QuranModal';
import { QuranSection } from './components/QuranSection';
import { PrayerSection } from './components/PrayerSection';
import { QuranAudioPlayerBar } from './components/QuranAudioPlayerBar';
import { DEFAULT_RECITER_ID } from './utils/quranAudio';
import { DailyTasksCard } from './components/DailyTasksCard';
import { CreateTaskModal } from './components/CreateTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { UpcomingOccasionsSection } from './components/UpcomingOccasionsSection';
import { HomeDailyDhikrCard } from './components/HomeDailyDhikrCard';
import { HomeDailyAchievementBar } from './components/HomeDailyAchievementBar';
import { HomeDailyWirdCard } from './components/HomeDailyWirdCard';
import { HomePrayersCard } from './components/HomePrayersCard';
import { HomeDashboardGrid, DashboardCardItem } from './components/HomeDashboardGrid';
import { HomeNearestOccasionCard } from './components/HomeNearestOccasionCard';
import { OccasionsModal } from './components/OccasionsModal';
import { DailyTasksModal } from './components/DailyTasksModal';
import {
  loadUserProgress,
  saveUserProgress,
  loadReminders,
  saveReminders,
  resetTodayProgress,
  loadUserTasksForDate,
  createUserTask,
  updateUserTaskText,
  toggleUserTaskCompleted,
  deleteUserTask,
  getTodayDateString,
  getUserTaskDates,
} from './utils/storage';
import { UserProgress, ActivityStatus, ReminderSetting, UserTask } from './types';
import { ChevronLeft, Compass } from 'lucide-react';

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() => loadUserProgress());
  const [reminders, setReminders] = useState<ReminderSetting[]>(() => loadReminders());
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Quran Audio Reciter state
  const [activeAudioSurah, setActiveAudioSurah] = useState<number | null>(null);
  const [isSurahAudioPlaying, setIsSurahAudioPlaying] = useState(false);
  const [selectedReciterId, setSelectedReciterId] = useState<string>(DEFAULT_RECITER_ID);

  // Personal Daily Tasks state (strictly isolated per user ID & date)
  const [selectedTaskDate, setSelectedTaskDate] = useState<string>(() => getTodayDateString());
  const [todayTasks, setTodayTasks] = useState<UserTask[]>(() => {
    const initialProgress = loadUserProgress();
    return loadUserTasksForDate(initialProgress.userProfile?.id || 'usr_local', getTodayDateString());
  });
  const [availableTaskDates, setAvailableTaskDates] = useState<string[]>(() => {
    const initialProgress = loadUserProgress();
    return getUserTaskDates(initialProgress.userProfile?.id || 'usr_local');
  });
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<UserTask | null>(null);

  // Modals state
  const [activeAdhkarCat, setActiveAdhkarCat] = useState<string | null>(null);
  const [isTasbeehOpen, setIsTasbeehOpen] = useState(false);
  const [isQuranOpen, setIsQuranOpen] = useState(false);
  const [isOccasionsModalOpen, setIsOccasionsModalOpen] = useState(false);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);

  // Refresh tasks helper
  const refreshTasks = (date: string = selectedTaskDate) => {
    const userId = progress.userProfile?.id || 'usr_local';
    setTodayTasks(loadUserTasksForDate(userId, date));
    setAvailableTaskDates(getUserTaskDates(userId));
  };

  // Refresh tasks when user profile changes
  useEffect(() => {
    if (progress.userProfile?.id) {
      refreshTasks(selectedTaskDate);
    }
  }, [progress.userProfile?.id]);

  // Tasks handlers
  const handleSelectTaskDate = (date: string) => {
    setSelectedTaskDate(date);
    refreshTasks(date);
  };

  const handleAddTask = (text: string) => {
    const userId = progress.userProfile?.id || 'usr_local';
    createUserTask(userId, text, selectedTaskDate);
    refreshTasks(selectedTaskDate);
  };

  const handleToggleTask = (taskId: string) => {
    const userId = progress.userProfile?.id || 'usr_local';
    toggleUserTaskCompleted(userId, taskId);
    refreshTasks(selectedTaskDate);
  };

  const handleEditTask = (taskId: string, newText: string) => {
    const userId = progress.userProfile?.id || 'usr_local';
    updateUserTaskText(userId, taskId, newText);
    refreshTasks(selectedTaskDate);
  };

  const handleDeleteTask = (taskId: string) => {
    const userId = progress.userProfile?.id || 'usr_local';
    deleteUserTask(userId, taskId);
    refreshTasks(selectedTaskDate);
  };

  // Sync progress to localStorage
  const updateProgress = (updater: (prev: UserProgress) => UserProgress) => {
    setProgress((prev) => {
      const next = updater(prev);
      saveUserProgress(next);
      return next;
    });
  };

  // Sync reminders to localStorage
  const handleUpdateReminders = (updated: ReminderSetting[]) => {
    setReminders(updated);
    saveReminders(updated);
  };

  // Update status of an activity in the timeline
  const handleUpdateActivityStatus = (activityId: string, newStatus: ActivityStatus) => {
    updateProgress((prev) => {
      let completed = [...prev.completedActivities];
      let skipped = [...prev.skippedActivities];

      // Remove from existing
      completed = completed.filter((id) => id !== activityId);
      skipped = skipped.filter((id) => id !== activityId);

      let morningAdhkar = prev.morningAdhkarCompleted;
      let eveningAdhkar = prev.eveningAdhkarCompleted;
      let sleepAdhkar = prev.sleepAdhkarCompleted;
      let prayers = [...prev.prayersCompletedToday];
      const adhkarCounts = { ...(prev.adhkarItemsCompleted || { morning: 0, evening: 0, sleep: 0, after_prayer: 0 }) };

      if (newStatus === 'completed') {
        completed.push(activityId);

        // Prayer mappings
        if (activityId === 'act-fajr' && !prayers.includes('fajr')) prayers.push('fajr');
        if (activityId === 'act-dhuhr' && !prayers.includes('dhuhr')) prayers.push('dhuhr');
        if (activityId === 'act-asr' && !prayers.includes('asr')) prayers.push('asr');
        if (activityId === 'act-maghrib' && !prayers.includes('maghrib')) prayers.push('maghrib');
        if (activityId === 'act-isha' && !prayers.includes('isha')) prayers.push('isha');
        if (activityId === 'act-witr' && !prayers.includes('witr')) prayers.push('witr');
        if (activityId === 'act-qiyam' && !prayers.includes('qiyam')) prayers.push('qiyam');

        // Adhkar mappings
        if (activityId === 'act-morning-adhkar') {
          morningAdhkar = true;
          adhkarCounts.morning = 27;
        }
        if (activityId === 'act-evening-adhkar') {
          eveningAdhkar = true;
          adhkarCounts.evening = 27;
        }
        if (activityId === 'act-sleep-adhkar') {
          sleepAdhkar = true;
          adhkarCounts.sleep = 27;
        }

        // Quran mapping
        if (activityId === 'act-quran-morning' || activityId === 'act-quran-dhuhr' || activityId === 'act-quran-night') {
          if (prev.quranPagesReadToday < prev.quranGoalPages) {
            // Mark goal as done if user clicked complete
            prev.quranPagesReadToday = prev.quranGoalPages;
          }
        }
      } else if (newStatus === 'skipped') {
        skipped.push(activityId);
      } else {
        // Reset or not_started
        if (activityId === 'act-morning-adhkar') {
          morningAdhkar = false;
          adhkarCounts.morning = 0;
        }
        if (activityId === 'act-evening-adhkar') {
          eveningAdhkar = false;
          adhkarCounts.evening = 0;
        }
        if (activityId === 'act-sleep-adhkar') {
          sleepAdhkar = false;
          adhkarCounts.sleep = 0;
        }
        if (activityId === 'act-fajr') prayers = prayers.filter((p) => p !== 'fajr');
        if (activityId === 'act-dhuhr') prayers = prayers.filter((p) => p !== 'dhuhr');
        if (activityId === 'act-asr') prayers = prayers.filter((p) => p !== 'asr');
        if (activityId === 'act-maghrib') prayers = prayers.filter((p) => p !== 'maghrib');
        if (activityId === 'act-isha') prayers = prayers.filter((p) => p !== 'isha');
        if (activityId === 'act-witr') prayers = prayers.filter((p) => p !== 'witr');
        if (activityId === 'act-qiyam') prayers = prayers.filter((p) => p !== 'qiyam');
      }

      return {
        ...prev,
        completedActivities: completed,
        skippedActivities: skipped,
        morningAdhkarCompleted: morningAdhkar,
        eveningAdhkarCompleted: eveningAdhkar,
        sleepAdhkarCompleted: sleepAdhkar,
        prayersCompletedToday: prayers,
        adhkarItemsCompleted: adhkarCounts,
      };
    });
  };

  // Toggle single prayer (fajr, dhuhr, asr, maghrib, isha, witr, qiyam)
  const handleTogglePrayer = (prayerId: string) => {
    updateProgress((prev) => {
      const currentList = prev.prayersCompletedToday || [];
      const isDone = currentList.includes(prayerId);
      const updatedPrayers = isDone
        ? currentList.filter((id) => id !== prayerId)
        : [...currentList, prayerId];

      const actId = `act-${prayerId}`;
      let completed = [...prev.completedActivities];
      if (isDone) {
        completed = completed.filter((id) => id !== actId);
      } else {
        if (!completed.includes(actId)) completed.push(actId);
      }

      return {
        ...prev,
        prayersCompletedToday: updatedPrayers,
        completedActivities: completed,
      };
    });
  };

  // Start specific activity
  const handleStartActivity = (activityType: string) => {
    switch (activityType) {
      case 'adhkar_morning':
        setActiveAdhkarCat('morning');
        break;
      case 'adhkar_evening':
        setActiveAdhkarCat('evening');
        break;
      case 'adhkar_sleep':
        setActiveAdhkarCat('sleep');
        break;
      case 'tasbeeh':
        setIsTasbeehOpen(true);
        break;
      case 'quran':
        setActiveTab('quran');
        break;
      case 'prayer':
        setActiveTab('prayer');
        break;
      case 'worship':
        handleUpdateActivityStatus('act-daily-worship', 'completed');
        break;
      default:
        setActiveTab('timeline');
        break;
    }
  };

  // Adhkar progress updater
  const handleUpdateAdhkarProgress = (
    categoryId: string,
    finishedItemsCount: number,
    isEntireCategoryCompleted: boolean
  ) => {
    updateProgress((prev) => {
      const adhkarCounts = { ...(prev.adhkarItemsCompleted || { morning: 0, evening: 0, sleep: 0, after_prayer: 0 }) };
      adhkarCounts[categoryId] = finishedItemsCount;

      let morningAdhkar = prev.morningAdhkarCompleted;
      let eveningAdhkar = prev.eveningAdhkarCompleted;
      let sleepAdhkar = prev.sleepAdhkarCompleted;
      const completed = [...prev.completedActivities];

      if (categoryId === 'morning') {
        morningAdhkar = isEntireCategoryCompleted;
        if (isEntireCategoryCompleted && !completed.includes('act-morning-adhkar')) {
          completed.push('act-morning-adhkar');
        } else if (!isEntireCategoryCompleted) {
          const idx = completed.indexOf('act-morning-adhkar');
          if (idx !== -1) completed.splice(idx, 1);
        }
      } else if (categoryId === 'evening') {
        eveningAdhkar = isEntireCategoryCompleted;
        if (isEntireCategoryCompleted && !completed.includes('act-evening-adhkar')) {
          completed.push('act-evening-adhkar');
        } else if (!isEntireCategoryCompleted) {
          const idx = completed.indexOf('act-evening-adhkar');
          if (idx !== -1) completed.splice(idx, 1);
        }
      } else if (categoryId === 'sleep') {
        sleepAdhkar = isEntireCategoryCompleted;
        if (isEntireCategoryCompleted && !completed.includes('act-sleep-adhkar')) {
          completed.push('act-sleep-adhkar');
        } else if (!isEntireCategoryCompleted) {
          const idx = completed.indexOf('act-sleep-adhkar');
          if (idx !== -1) completed.splice(idx, 1);
        }
      }

      return {
        ...prev,
        adhkarItemsCompleted: adhkarCounts,
        morningAdhkarCompleted: morningAdhkar,
        eveningAdhkarCompleted: eveningAdhkar,
        sleepAdhkarCompleted: sleepAdhkar,
        completedActivities: completed,
      };
    });
  };

  // Tasbeeh increment
  const handleAddTasbeeh = (count: number) => {
    updateProgress((prev) => {
      const newTotal = prev.totalTasbeehCount + count;
      const completed = [...prev.completedActivities];
      if (newTotal >= 33 && !completed.includes('act-tasbeeh-midday')) {
        completed.push('act-tasbeeh-midday');
      }
      return {
        ...prev,
        totalTasbeehCount: newTotal,
        completedActivities: completed,
      };
    });
  };

  // Quran pages update
  const handleUpdateQuranPages = (pages: number) => {
    updateProgress((prev) => {
      const completed = [...prev.completedActivities];
      if (pages >= prev.quranGoalPages) {
        if (!completed.includes('act-quran-morning')) completed.push('act-quran-morning');
      } else {
        // If reduced below goal
        const idx = completed.indexOf('act-quran-morning');
        if (idx !== -1) completed.splice(idx, 1);
      }

      return {
        ...prev,
        quranPagesReadToday: pages,
        completedActivities: completed,
      };
    });
  };

  // Quick single page increment
  const handleQuickAddQuranPage = () => {
    handleUpdateQuranPages(progress.quranPagesReadToday + 1);
  };

  // Profile name update
  const handleUpdateProfileName = (name: string) => {
    updateProgress((prev) => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        name,
        isGuest: false,
      },
    }));
  };

  // Reset today
  const handleResetToday = () => {
    const fresh = resetTodayProgress(progress);
    setProgress(fresh);
  };

  // Play/toggle Surah Sheikh audio recitation
  const handlePlaySurahAudio = (surahNumber: number) => {
    if (activeAudioSurah === surahNumber) {
      setIsSurahAudioPlaying((prev) => !prev);
    } else {
      setActiveAudioSurah(surahNumber);
      setIsSurahAudioPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] flex flex-col font-['Tajawal',sans-serif] text-[#2C2825] pb-24 selection:bg-[#2D6A4F] selection:text-white">
      {/* Top Header */}
      <Header
        progress={progress}
        onOpenReminders={() => setActiveTab('reminders')}
        onOpenProgress={() => setActiveTab('progress')}
        onUpdateProfileName={handleUpdateProfileName}
        onResetToday={handleResetToday}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 sm:py-6">
        {activeTab === 'home' && (
          <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
            {/* 1. Header: أُنس 🤍 - رفيقك ليومٍ أقرب إلى الله */}
            <div className="text-center py-2 sm:py-3">
              <h1 className="text-3xl sm:text-4xl font-bold font-['Tajawal'] text-[#1F2421] tracking-tight">
                أُنس 🤍
              </h1>
              <p className="text-sm sm:text-base text-[#736B63] mt-1.5 font-medium">
                رفيقك ليومٍ أقرب إلى الله
              </p>
            </div>

            {/* 2. Small elegant Daily Dhikr Card (ذكر اليوم) */}
            <HomeDailyDhikrCard onOpenTasbeeh={() => setIsTasbeehOpen(true)} />

            {/* 3. إنجاز اليوم (0 من 14 عبادة) */}
            <HomeDailyAchievementBar progress={progress} />

            {/* 4. متابعة الورد: وردي اليوم (0 من 4 صفحات) */}
            <HomeDailyWirdCard
              progress={progress}
              onOpenQuran={() => setActiveTab('quran')}
            />

            {/* 5. الصلوات الخمس + الوتر وقيام الليل وموعد الصلاة القادمة */}
            <HomePrayersCard
              prayersCompleted={progress.prayersCompletedToday}
              onTogglePrayer={handleTogglePrayer}
              onOpenPrayers={() => setActiveTab('prayer')}
              onOpenReminders={() => setActiveTab('reminders')}
            />

            {/* 6. Grid of Cards: 📿 التسبيح, 📝 مهامي اليومية, ☀️ الأذكار, 🌙 المناسبات الإسلامية, 🤍 التبرع, 📖 القرآن */}
            <HomeDashboardGrid
              cards={[
                {
                  id: 'tasbeeh',
                  icon: '📿',
                  title: 'التسبيح',
                  description: 'السبحة الإلكترونية الذكية مع الأوراد والاهتزاز وحفظ العداد.',
                  badge: `${progress.totalTasbeehCount} تسبيحة اليوم`,
                  onClick: () => setIsTasbeehOpen(true),
                },
                {
                  id: 'tasks',
                  icon: '📝',
                  title: 'مهامي اليومية',
                  description: 'جدول مهامك وطاعاتك اليومية الخاصة مع متابعة الإنجاز.',
                  badge: `${todayTasks.filter((t) => t.isCompleted).length}/${todayTasks.length} منجز`,
                  onClick: () => setIsTasksModalOpen(true),
                },
                {
                  id: 'adhkar',
                  icon: '☀️',
                  title: 'الأذكار',
                  description: 'أذكار الصباح والمساء، أذكار بعد الصلاة، وأذكار النوم المأثورة.',
                  badge: 'أذكار اليوم والليلة',
                  onClick: () => setActiveTab('adhkar'),
                },
                {
                  id: 'occasions',
                  icon: '🌙',
                  title: 'المناسبات الإسلامية',
                  description: 'عدّ تنازلي للمواسم المباركة والأيام الفاضلة ومواعيد الخير.',
                  badge: 'مواسم الخير',
                  onClick: () => setIsOccasionsModalOpen(true),
                },
                {
                  id: 'charity',
                  icon: '🤍',
                  title: 'التبرع',
                  description: 'أبواب الخير والمساهمة في الصدقات عبر المنصات الرسمية المعتمدة.',
                  badge: 'باب الصدقة',
                  onClick: () => setActiveTab('charity'),
                },
                {
                  id: 'quran',
                  icon: '📖',
                  title: 'القرآن',
                  description: 'المصحف الشريف وتتبع الورد اليومي مع تلاوة بصوت كبار القراء.',
                  badge: `${progress.quranPagesReadToday} صفحات اليوم`,
                  onClick: () => setActiveTab('quran'),
                },
              ]}
            />

            {/* 4. Small elegant Nearest Occasion Card */}
            <HomeNearestOccasionCard onOpenOccasions={() => setIsOccasionsModalOpen(true)} />

            {/* 5. Footer: "واجعل يومك مليئًا بذكر الله 🤍" */}
            <footer className="pt-4 pb-2 text-center">
              <p className="text-xs sm:text-sm font-medium text-[#8C827A] flex items-center justify-center gap-1.5">
                <span>واجعل يومك مليئًا بذكر الله 🤍</span>
              </p>
            </footer>
          </div>
        )}

        {activeTab === 'timeline' && (
          <DailyTimeline
            progress={progress}
            onUpdateActivityStatus={handleUpdateActivityStatus}
            onStartActivity={handleStartActivity}
            onQuickAddQuranPage={handleQuickAddQuranPage}
            tasks={todayTasks}
            onAddTaskClick={() => setIsCreateTaskOpen(true)}
            onToggleTask={handleToggleTask}
            onEditTaskClick={(task) => setEditingTask(task)}
            onDeleteTask={handleDeleteTask}
            selectedDate={selectedTaskDate}
            onSelectDate={handleSelectTaskDate}
            availableDates={availableTaskDates}
          />
        )}

        {activeTab === 'prayer' && (
          <PrayerSection
            progress={progress}
            onUpdatePrayersCompleted={(prayers) => {
              updateProgress((prev) => ({
                ...prev,
                prayersCompletedToday: prayers,
              }));
            }}
            onOpenAdhkarAfterPrayer={() => setActiveAdhkarCat('after_prayer')}
          />
        )}

        {activeTab === 'quran' && (
          <QuranSection
            progress={progress}
            onUpdatePages={handleUpdateQuranPages}
            onOpenTrackerModal={() => setIsQuranOpen(true)}
            onPlaySurahAudio={handlePlaySurahAudio}
            activeAudioSurah={activeAudioSurah}
            isAudioPlaying={isSurahAudioPlaying}
          />
        )}

        {activeTab === 'adhkar' && (
          <AdhkarListView
            progress={progress}
            onOpenAdhkar={(catId) => setActiveAdhkarCat(catId)}
            onOpenTasbeeh={() => setIsTasbeehOpen(true)}
            onOpenQuran={() => setActiveTab('quran')}
            onOpenWorship={() => handleStartActivity('worship')}
          />
        )}

        {activeTab === 'charity' && <CharitySection />}

        {activeTab === 'progress' && (
          <ProgressDashboard
            progress={progress}
            onOpenActivity={handleStartActivity}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersView
            reminders={reminders}
            onUpdateReminders={handleUpdateReminders}
            coordinates={progress.prayerSettings?.coordinates}
          />
        )}
      </main>

      {/* Modals */}
      {activeAdhkarCat && (
        <AdhkarViewerModal
          initialCategoryId={activeAdhkarCat}
          onClose={() => setActiveAdhkarCat(null)}
          onUpdateAdhkarProgress={handleUpdateAdhkarProgress}
        />
      )}

      {isTasbeehOpen && (
        <TasbeehModal
          onClose={() => setIsTasbeehOpen(false)}
          onAddTasbeeh={handleAddTasbeeh}
        />
      )}

      {/* Quran Tracker Modal */}
      {isQuranOpen && (
        <QuranModal
          progress={progress}
          onClose={() => setIsQuranOpen(false)}
          onUpdatePages={handleUpdateQuranPages}
          onNavigateToQuran={() => {
            setIsQuranOpen(false);
            setActiveTab('quran');
          }}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onAddTask={handleAddTask}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onSave={handleEditTask}
      />

      {/* Daily Tasks Modal */}
      <DailyTasksModal
        isOpen={isTasksModalOpen}
        onClose={() => setIsTasksModalOpen(false)}
        tasks={todayTasks}
        onAddTaskClick={() => setIsCreateTaskOpen(true)}
        onToggleTask={handleToggleTask}
        onEditTaskClick={(task) => setEditingTask(task)}
        onDeleteTask={handleDeleteTask}
        selectedDate={selectedTaskDate}
        onSelectDate={handleSelectTaskDate}
        availableDates={availableTaskDates}
      />

      {/* Islamic Occasions Modal */}
      <OccasionsModal
        isOpen={isOccasionsModalOpen}
        onClose={() => setIsOccasionsModalOpen(false)}
      />

      {/* Floating Quran Audio Player Bar (Sheikh Recitation) */}
      {activeAudioSurah && (
        <QuranAudioPlayerBar
          currentSurahNumber={activeAudioSurah}
          surahNumber={activeAudioSurah}
          isPlaying={isSurahAudioPlaying}
          reciterId={selectedReciterId}
          onTogglePlay={() => setIsSurahAudioPlaying((prev) => !prev)}
          onChangeSurah={(num) => {
            setActiveAudioSurah(num);
            setIsSurahAudioPlaying(true);
          }}
          onChangeReciter={(id) => setSelectedReciterId(id)}
          onClose={() => {
            setActiveAudioSurah(null);
            setIsSurahAudioPlaying(false);
          }}
          onNavigateToSurah={() => {
            setActiveTab('quran');
          }}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}
