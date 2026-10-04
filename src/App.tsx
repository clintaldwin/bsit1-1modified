/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSectionData } from './hooks/useSectionData';
import { Navbar, NavTab } from './components/common/Navbar';
import { ToastProvider, useToast } from './components/common/Toast';
import { SearchModal } from './components/common/SearchModal';
import { ItemDetailModal } from './components/common/ItemDetailModal';

// Views
import { LobbyView } from './components/lobby/LobbyView';
import { AssignmentsView } from './components/assignments/AssignmentsView';
import { TasksView } from './components/tasks/TasksView';
import { CalendarView } from './components/calendar/CalendarView';
import { NotesView } from './components/notes/NotesView';
import { ResourcesView } from './components/resources/ResourcesView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminAccessModal } from './components/admin/AdminAccessModal';
import { ensureAnonymousSession, checkIsAdminMember, clearLocalAdminSession } from './lib/auth/adminAccess';
import { EntityType } from './types/database';

function MainContent() {
  const {
    section,
    announcements,
    assignments,
    tasks,
    notes,
    events,
    resources,
    members,
    loading,
    error,
    updateTaskStatus,
    updateAssignmentStatus,
    resetAllData,
  } = useSectionData();

  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<NavTab>('lobby');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Pipeline Step 1 & 2: Browser -> Supabase anonymous session
  useEffect(() => {
    ensureAnonymousSession().then(async (session) => {
      if (session) {
        const isAdmin = await checkIsAdminMember();
        if (isAdmin) {
          setIsAdminMode(true);
        }
      }
    });
  }, []);

  // Detail Modal State
  const [detailModalState, setDetailModalState] = useState<{
    isOpen: boolean;
    type: EntityType | null;
    item: any;
  }>({
    isOpen: false,
    type: null,
    item: null,
  });

  const handleOpenDetail = (type: EntityType, item: any) => {
    setDetailModalState({
      isOpen: true,
      type,
      item,
    });
  };

  const handleCloseDetail = () => {
    setDetailModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      clearLocalAdminSession();
      setIsAdminMode(false);
      setActiveTab('lobby');
      showToast('Switched to Student View', 'Viewing Section Lobby as a class member.', 'info');
    } else {
      // Require server-side verification before entering Admin mode
      setIsAdminModalOpen(true);
    }
  };

  const handleAdminUnlockSuccess = () => {
    setIsAdminMode(true);
    setActiveTab('admin');
    setIsAdminModalOpen(false);
    showToast('Administrator Console', 'Logged in with verified Section Admin privileges.', 'info');
  };

  const handleResetData = async () => {
    await resetAllData();
    showToast('Section Data Cleared', 'Section records reset to initial state.', 'info');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-500 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          <span>Synchronizing section lobby...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
        <div className="max-w-md w-full p-6 bg-white border border-rose-200 rounded-2xl text-center space-y-3 shadow-xs">
          <h2 className="text-base font-bold text-neutral-900">Database Connection Notice</h2>
          <p className="text-xs text-neutral-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/60 selection:bg-neutral-900 selection:text-white">
      
      {/* 3-Zone Top Navigation Contract */}
      <Navbar
        section={section}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'admin') {
            if (isAdminMode) {
              setActiveTab('admin');
            } else {
              setIsAdminModalOpen(true);
            }
          } else {
            setActiveTab(tab);
            if (isAdminMode) setIsAdminMode(false);
          }
        }}
        isAdminMode={isAdminMode}
        onToggleAdminMode={handleToggleAdminMode}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Viewport Container (Desktop baseline 1200px) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {isAdminMode && activeTab === 'admin' ? (
          <AdminDashboard
            section={section}
            announcements={announcements}
            assignments={assignments}
            tasks={tasks}
            notes={notes}
            events={events}
            resources={resources}
            members={members}
            onResetData={handleResetData}
            onNavigateToLobby={() => {
              clearLocalAdminSession();
              setIsAdminMode(false);
              setActiveTab('lobby');
            }}
          />
        ) : activeTab === 'lobby' ? (
          <LobbyView
            section={section}
            announcements={announcements}
            assignments={assignments}
            tasks={tasks}
            notes={notes}
            events={events}
            resources={resources}
            onSelectAssignment={(asg) => handleOpenDetail('assignment', asg)}
            onSelectAnnouncement={(ann) => handleOpenDetail('announcement', ann)}
            onSelectEvent={(evt) => handleOpenDetail('event', evt)}
            onSelectNote={(note) => handleOpenDetail('note', note)}
            onToggleTaskStatus={updateTaskStatus}
            onToggleAssignmentStatus={updateAssignmentStatus}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        ) : activeTab === 'assignments' ? (
          <AssignmentsView
            assignments={assignments}
            onToggleStatus={updateAssignmentStatus}
            onSelectAssignment={(asg) => handleOpenDetail('assignment', asg)}
          />
        ) : activeTab === 'tasks' ? (
          <TasksView
            tasks={tasks}
            onToggleStatus={updateTaskStatus}
            onSelectTask={(task) => handleOpenDetail('task', task)}
          />
        ) : activeTab === 'calendar' ? (
          <CalendarView
            events={events}
            assignments={assignments}
            onSelectEvent={(evt) => handleOpenDetail('event', evt)}
            onSelectAssignment={(asg) => handleOpenDetail('assignment', asg)}
          />
        ) : activeTab === 'notes' ? (
          <NotesView
            notes={notes}
            onSelectNote={(note) => handleOpenDetail('note', note)}
          />
        ) : activeTab === 'resources' ? (
          <ResourcesView
            resources={resources}
          />
        ) : null}
      </main>

      {/* Universal Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        announcements={announcements}
        assignments={assignments}
        tasks={tasks}
        notes={notes}
        events={events}
        resources={resources}
        onSelectItem={(type, item) => handleOpenDetail(type, item)}
      />

      {/* Item Detail Reader & Action Modal */}
      <ItemDetailModal
        isOpen={detailModalState.isOpen}
        onClose={handleCloseDetail}
        type={detailModalState.type}
        item={detailModalState.item}
        onUpdateTaskStatus={updateTaskStatus}
        onUpdateAssignmentStatus={updateAssignmentStatus}
      />

      {/* Administrator Access Verification Modal */}
      <AdminAccessModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminUnlockSuccess}
      />

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainContent />
    </ToastProvider>
  );
}
