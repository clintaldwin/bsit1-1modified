import React from 'react';
import { 
  Section, 
  Announcement, 
  Assignment, 
  Task, 
  Note, 
  Event, 
  Resource,
  TaskStatus,
  AssignmentStatus
} from '@/types/database';
import { TodaySection } from './TodaySection';
import { DueSoonSection } from './DueSoonSection';
import { AnnouncementsSection } from './AnnouncementsSection';
import { UpcomingEventsSection } from './UpcomingEventsSection';
import { RecentNotesSection } from './RecentNotesSection';
import { QuickAccess } from './QuickAccess';
import { NavTab } from '../common/Navbar';

interface LobbyViewProps {
  section: Section | null;
  announcements: Announcement[];
  assignments: Assignment[];
  tasks: Task[];
  notes: Note[];
  events: Event[];
  resources: Resource[];
  onSelectAssignment: (asg: Assignment) => void;
  onSelectAnnouncement: (ann: Announcement) => void;
  onSelectEvent: (evt: Event) => void;
  onSelectNote: (note: Note) => void;
  onToggleTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onToggleAssignmentStatus: (asgId: string, newStatus: AssignmentStatus) => void;
  onNavigateToTab: (tab: NavTab) => void;
}

export function LobbyView({
  section,
  announcements,
  assignments,
  tasks,
  notes,
  events,
  resources,
  onSelectAssignment,
  onSelectAnnouncement,
  onSelectEvent,
  onSelectNote,
  onToggleTaskStatus,
  onNavigateToTab,
}: LobbyViewProps) {
  return (
    <div className="space-y-6 pb-20 lg:pb-12">
      
      {/* Editorial Section Hero Banner (Quiet, unboxed, clear context) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2 pb-1">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
            <span>{section?.code || 'BSIT 1-1'}</span>
            <span aria-hidden="true">·</span>
            <span>{section?.academic_year || '2026–2027'}</span>
            <span aria-hidden="true">·</span>
            <span>{section?.semester || '1st Semester'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            {section?.name || 'BSIT 1-1'}
          </h1>
        </div>
      </div>

      {/* 1. TODAY'S RADAR */}
      <TodaySection
        assignments={assignments}
        tasks={tasks}
        events={events}
        announcements={announcements}
        onSelectAssignment={onSelectAssignment}
        onSelectEvent={onSelectEvent}
        onNavigateToTab={onNavigateToTab}
      />

      {/* 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Primary Attention (Due Soon & Announcements) */}
        <div className="lg:col-span-7 space-y-6">
          <DueSoonSection
            assignments={assignments}
            tasks={tasks}
            onToggleTaskStatus={onToggleTaskStatus}
            onSelectAssignment={onSelectAssignment}
            onNavigateToTab={onNavigateToTab}
          />

          <AnnouncementsSection
            announcements={announcements}
            onSelectAnnouncement={onSelectAnnouncement}
          />
        </div>

        {/* Right Column: Schedule & Knowledge Hub */}
        <div className="lg:col-span-5 space-y-6">
          <UpcomingEventsSection
            events={events}
            onSelectEvent={onSelectEvent}
            onNavigateToCalendar={() => onNavigateToTab('calendar')}
          />

          <QuickAccess
            resources={resources}
            onNavigateToTab={onNavigateToTab}
          />

          <RecentNotesSection
            notes={notes}
            onSelectNote={onSelectNote}
            onNavigateToNotes={() => onNavigateToTab('notes')}
          />
        </div>

      </div>

    </div>
  );
}
