import React from 'react';
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { Assignment, Task, Event, Announcement } from '@/types/database';
import { calculateDeadlineInfo, formatEventDateTime } from '@/utils/dates';
import { PriorityIndicator } from '../common/PriorityIndicator';

interface TodaySectionProps {
  assignments: Assignment[];
  tasks: Task[];
  events: Event[];
  announcements: Announcement[];
  onSelectAssignment: (asg: Assignment) => void;
  onSelectEvent: (evt: Event) => void;
  onNavigateToTab: (tab: any) => void;
}

export function TodaySection({
  assignments,
  tasks,
  events,
  announcements,
  onSelectAssignment,
  onSelectEvent,
  onNavigateToTab,
}: TodaySectionProps) {
  // Urgent announcements (urgent or high priority)
  const urgentAnnouncement = announcements.find((a) => a.priority === 'urgent' || a.priority === 'high');

  // Items due today or overdue
  const dueTodayOrOverdue = assignments
    .filter((a) => a.status === 'pending')
    .map((a) => ({ ...a, deadline: calculateDeadlineInfo(a.due_at) }))
    .filter((a) => a.deadline.isDueToday || a.deadline.isOverdue || a.deadline.isDueTomorrow)
    .sort((a, b) => a.deadline.diffHours - b.deadline.diffHours);

  // Events happening today or within 48h
  const upcomingTodayEvents = events.filter((e) => {
    const d = new Date(e.starts_at);
    const now = new Date();
    const diffHours = (d.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours >= -2 && diffHours <= 48;
  });

  const totalActiveAssignments = assignments.filter((a) => a.status === 'pending').length;
  const totalPendingTasks = tasks.filter((t) => t.status !== 'completed').length;

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900 uppercase">
              Today's Radar
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            What needs your attention right now
          </p>
        </div>

        {/* Quick summary stats in unboxed tabular font */}
        <div className="flex items-center gap-4 text-xs text-neutral-600 font-mono tabular-nums">
          <div>
            <span className="text-neutral-400 mr-1">Active:</span>
            <span className="font-semibold text-neutral-900">{totalActiveAssignments}</span>
            <span className="text-neutral-400 ml-1">assignments</span>
          </div>
          <span className="text-neutral-200" aria-hidden="true">|</span>
          <div>
            <span className="text-neutral-400 mr-1">Pending:</span>
            <span className="font-semibold text-neutral-900">{totalPendingTasks}</span>
            <span className="text-neutral-400 ml-1">tasks</span>
          </div>
        </div>
      </div>

      {/* Urgent Announcement Alert Strip (if any) */}
      {urgentAnnouncement && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-900 truncate">
                {urgentAnnouncement.title}
              </span>
              <PriorityIndicator priority={urgentAnnouncement.priority} />
            </div>
            <p className="text-xs text-amber-800/90 mt-1 line-clamp-2">
              {urgentAnnouncement.content}
            </p>
          </div>
        </div>
      )}

      {/* Grid of Immediate Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        
        {/* Urgent Deadlines Box */}
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                Deadlines Approaching
              </span>
              <button
                onClick={() => onNavigateToTab('assignments')}
                className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {dueTodayOrOverdue.length === 0 ? (
              <div className="py-4 text-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-xs text-neutral-600 font-medium">Nothing due today or tomorrow</p>
                <p className="text-[11px] text-neutral-400">All submissions are on track.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {dueTodayOrOverdue.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectAssignment(item)}
                    className="p-2.5 bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-neutral-900 group-hover:text-neutral-700 line-clamp-1">
                        {item.title}
                      </span>
                      <PriorityIndicator priority={item.priority} />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-1">
                      <span>{item.subject}</span>
                      <span aria-hidden="true">·</span>
                      <span className={item.deadline.isOverdue ? 'text-rose-600 font-semibold' : 'text-amber-700 font-medium'}>
                        {item.deadline.relativeLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Next Imminent Schedule Item */}
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                Next on the Schedule
              </span>
              <button
                onClick={() => onNavigateToTab('calendar')}
                className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors"
              >
                Schedule <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {upcomingTodayEvents.length === 0 ? (
              <div className="py-4 text-center">
                <BookOpen className="w-5 h-5 text-neutral-400 mx-auto mb-1.5" />
                <p className="text-xs text-neutral-600 font-medium">No tests or events in the next 48h</p>
                <p className="text-[11px] text-neutral-400">Normal class schedules apply.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingTodayEvents.slice(0, 2).map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className="p-2.5 bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-neutral-900 group-hover:text-neutral-700 line-clamp-1">
                        {evt.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-1">
                      <span>{formatEventDateTime(evt.starts_at, evt.ends_at)}</span>
                      {evt.location && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{evt.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
