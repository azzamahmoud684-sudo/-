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
import { DailyTasksCard } from './components/DailyTasksCard';
import { CreateTaskModal } from './components/CreateTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { QiblaModal } from './components/QiblaModal';
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
} from './utils/storage';
import { UserProgress, ActivityStatus, ReminderSetting, UserTask } from './types';
import { ChevronLeft, Compass } from 'lucide-react';

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() => loadUserProgress());
  const [reminders, setReminders] = useState<ReminderSetting[]>(() => loadReminders());
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Personal Daily Tasks state (strictly isolated per user ID)
  const [todayTasks, setTodayTasks] = useState<UserTask[]>(() => {
    const initialProgress = loadUserProgress();
    return loadUserTasksForDate(initialProgress.userProfile?.id || 'usr_local');
  });
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<UserTask | null>(null);

  // Qibla Modal state
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);

  // Modals state
  const [activeAdhkarCat, setActiveAdhkarCat] = useState<string | null>(null);
  const [isTasbeehOpen, setIsTasbeehOpen] = useState(false);
  const [isQuranOpen, setIsQuranOpen] = useState(false);

  // Refresh tasks when user profile changes
  useEffect(() => {
    if (progress.userProfile?.id) {
      setTodayTasks(loadUserTasksForDate(progress.userProfile.id));
    }
  }, [progress.userProfile?.id]);

  // Tasks handlers
  const handleAddTask = (text: string) => {
    const userId = progress.userProfile?.id || 'usr_local';
    const { newTask } = createUserTask(userId, text);
    setTodayTasks((prev) => [newTask, ...prev]);
  };

  const handleToggleTask = (taskId: string) => {
    const userId = progress.userProfile?.id || 'usr_local';
    toggleUserTaskCompleted(userId, taskId);
    setTodayTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleEditTask = (taskId: string, newText: string) => {
    const userId = progress.userProfile?.id || 'usr_local';
    updateUserTaskText(userId, taskId, newText);
    setTodayTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, text: newText } : t))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    const userId = progress.userProfile?.id || 'usr_local';
    deleteUserTask(userId, taskId);
    setTodayTasks((prev) => prev.filter((t) => t.id !== taskId));
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
        setActiveTab('timeline');
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

  return (
    <div className="min-h-screen bg-[#F8F6F0] flex flex-col font-['Tajawal',sans-serif] text-[#2C2825] pb-24 selection:bg-[#2D6A4F] selection:text-white">
      {/* Top Header */}
      <Header
        progress={progress}
        onOpenReminders={() => setActiveTab('reminders')}
        onOpenProgress={() => setActiveTab('progress')}
        onOpenQibla={() => setIsQiblaOpen(true)}
        onUpdateProfileName={handleUpdateProfileName}
        onResetToday={handleResetToday}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 sm:py-6">
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Hero: "دلوقتي مع أُنس 🤍" */}
            <HeroNowSection
              progress={progress}
              onStartActivity={handleStartActivity}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />

            {/* Home Quick Tools Grid: Qibla & Daily Aids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Qibla Shortcut Card */}
              <div
                id="home-qibla-card"
                onClick={() => setIsQiblaOpen(true)}
                className="bg-white rounded-3xl p-4.5 sm:p-5 border border-[#E8E2D5] shadow-xs flex items-center justify-between cursor-pointer hover:border-[#2D6A4F]/40 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center shrink-0 text-2xl group-hover:scale-105 transition-transform">
                    🕋
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-base font-bold text-[#1F2421]">القبلة 🕋</h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FAF0E6] text-[#A25A19] font-semibold border border-[#E8D4BE]">
                        بوصلة مباشرة
                      </span>
                    </div>
                    <p className="text-xs text-[#736B63] leading-relaxed">
                      حدد اتجاه الكعبة المشرفة بدقة من موقعك الحالي.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#FAF7F2] text-[#2D6A4F] border border-[#E8E2D5] group-hover:translate-x-[-2px] transition-transform">
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </div>

              {/* Quick Adhkar / Charity Link */}
              <div
                id="home-charity-card"
                onClick={() => setActiveTab('charity')}
                className="bg-white rounded-3xl p-4.5 sm:p-5 border border-[#E8E2D5] shadow-xs flex items-center justify-between cursor-pointer hover:border-[#2D6A4F]/40 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#A25A19]/10 text-[#A25A19] flex items-center justify-center shrink-0 text-2xl group-hover:scale-105 transition-transform">
                    🌱
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-base font-bold text-[#1F2421]">باب الخير 🤝</h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2D6A4F] font-semibold border border-[#A5D6A7]">
                        صدقة اليوم
                      </span>
                    </div>
                    <p className="text-xs text-[#736B63] leading-relaxed">
                      مقترحات صدقة يومية يسيرة لتزكية المال والنفس.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#FAF7F2] text-[#2D6A4F] border border-[#E8E2D5] group-hover:translate-x-[-2px] transition-transform">
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* مهام اليوم Compact Card on Home */}
            <div id="home-daily-tasks-section">
              <DailyTasksCard
                tasks={todayTasks}
                onAddTaskClick={() => setIsCreateTaskOpen(true)}
                onToggleTask={handleToggleTask}
                onEditTaskClick={(task) => setEditingTask(task)}
                onDeleteTask={handleDeleteTask}
                isCompact={true}
              />
            </div>

            {/* Daily Timeline snippet on Home Page */}
            <div className="pt-2">
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
              />
            </div>
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
          />
        )}

        {activeTab === 'quran' && (
          <QuranSection
            progress={progress}
            onUpdatePages={handleUpdateQuranPages}
            onOpenTrackerModal={() => setIsQuranOpen(true)}
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

      {/* Qibla Direction Modal */}
      <QiblaModal
        isOpen={isQiblaOpen}
        onClose={() => setIsQiblaOpen(false)}
      />

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}
