import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  List, 
  CalendarDays 
} from 'lucide-react';
import { Event, Assignment } from '@/types/database';
import { formatEventDateTime, calculateDeadlineInfo } from '@/utils/dates';
import { PriorityIndicator } from '../common/PriorityIndicator';
import { EmptyState } from '../common/EmptyState';

interface CalendarViewProps {
  events: Event[];
  assignments: Assignment[];
  onSelectEvent: (event: Event) => void;
  onSelectAssignment: (assignment: Assignment) => void;
}

interface TimelineItem {
  id: string;
  type: 'event' | 'assignment';
  title: string;
  subtitle: string;
  date: Date;
  dateKey: string;
  timeFormatted: string;
  location?: string;
  priority?: any;
  original: Event | Assignment;
}

export function CalendarView({
  events,
  assignments,
  onSelectEvent,
  onSelectAssignment,
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'timeline' | 'month'>('timeline');

  // Unified items
  const items = useMemo(() => {
    const list: TimelineItem[] = [];

    events
      .filter((e) => e.status !== 'cancelled')
      .forEach((e) => {
        const d = new Date(e.starts_at);
        if (!isNaN(d.getTime())) {
          list.push({
            id: `evt_${e.id}`,
            type: 'event',
            title: e.title,
            subtitle: e.description,
            date: d,
            dateKey: d.toISOString().split('T')[0],
            timeFormatted: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(d),
            location: e.location,
            original: e,
          });
        }
      });

    assignments
      .filter((a) => a.status !== 'archived')
      .forEach((a) => {
        const d = new Date(a.due_at);
        if (!isNaN(d.getTime())) {
          list.push({
            id: `asg_${a.id}`,
            type: 'assignment',
            title: a.title,
            subtitle: a.subject,
            date: d,
            dateKey: d.toISOString().split('T')[0],
            timeFormatted: `Due ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(d)}`,
            priority: a.priority,
            original: a,
          });
        }
      });

    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, assignments]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();
    items.forEach((item) => {
      const arr = map.get(item.dateKey) || [];
      arr.push(item);
      map.set(item.dateKey, arr);
    });
    return Array.from(map.entries()).map(([dateKey, dayItems]) => ({
      dateKey,
      dateObj: new Date(dateKey + 'T00:00:00'),
      dayItems,
    }));
  }, [items]);

  const formatDateHeader = (dateObj: Date) => {
    const now = new Date();
    const isToday =
      dateObj.getDate() === now.getDate() &&
      dateObj.getMonth() === now.getMonth() &&
      dateObj.getFullYear() === now.getFullYear();

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      dateObj.getDate() === tomorrow.getDate() &&
      dateObj.getMonth() === tomorrow.getMonth() &&
      dateObj.getFullYear() === tomorrow.getFullYear();

    const dateFormatted = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);

    if (isToday) return `Today · ${dateFormatted}`;
    if (isTomorrow) return `Tomorrow · ${dateFormatted}`;
    return dateFormatted;
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Section Schedule & Timeline
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Synchronized calendar of exams, quizzes, defense sessions, and submission deadlines
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'timeline'
                ? 'bg-white text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Agenda Timeline</span>
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'month'
                ? 'bg-white text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Monthly Grid</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {items.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="No scheduled items"
          description="Your section has no events or deadlines on the schedule."
        />
      ) : viewMode === 'timeline' ? (
        /* Agenda Timeline View */
        <div className="space-y-6">
          {groupedByDate.map(({ dateKey, dateObj, dayItems }) => {
            const isToday =
              dateObj.getDate() === new Date().getDate() &&
              dateObj.getMonth() === new Date().getMonth() &&
              dateObj.getFullYear() === new Date().getFullYear();

            return (
              <div key={dateKey} className="space-y-3">
                {/* Date Heading */}
                <div className="flex items-center gap-3">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${
                    isToday ? 'text-blue-600' : 'text-neutral-800'
                  }`}>
                    {formatDateHeader(dateObj)}
                  </h3>
                  <div className="flex-1 h-px bg-neutral-200" />
                </div>

                {/* Day Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dayItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.type === 'event') onSelectEvent(item.original as Event);
                        else onSelectAssignment(item.original as Assignment);
                      }}
                      className="p-4 bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl transition-all cursor-pointer shadow-xs group flex items-start gap-3.5"
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${
                        item.type === 'event'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {item.type === 'event' ? (
                          <CalendarIcon className="w-4 h-4" />
                        ) : (
                          <BookOpen className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-mono uppercase text-neutral-400">
                            {item.type === 'event' ? 'Quiz / Event' : 'Assignment Deadline'}
                          </span>
                          {item.priority && <PriorityIndicator priority={item.priority} />}
                        </div>

                        <h4 className="text-xs font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors mt-0.5 line-clamp-1">
                          {item.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-2 font-mono tabular-nums">
                          <span className="text-neutral-800 font-sans font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            {item.timeFormatted}
                          </span>
                          {item.location && (
                            <>
                              <span aria-hidden="true" className="text-neutral-300">·</span>
                              <span className="font-sans flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-neutral-400" />
                                {item.location}
                              </span>
                            </>
                          )}
                          {item.subtitle && item.type === 'assignment' && (
                            <>
                              <span aria-hidden="true" className="text-neutral-300">·</span>
                              <span className="font-sans text-neutral-600">{item.subtitle}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Monthly Grid View */
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-neutral-500 mb-4 uppercase tracking-wider font-mono">
            Upcoming Schedule Overview
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.type === 'event') onSelectEvent(item.original as Event);
                  else onSelectAssignment(item.original as Assignment);
                }}
                className="p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono mb-1">
                  <span>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', weekday: 'short' }).format(item.date)}</span>
                  <span className="capitalize">{item.type}</span>
                </div>
                <h4 className="text-xs font-semibold text-neutral-900 line-clamp-1 mb-1">
                  {item.title}
                </h4>
                <p className="text-[11px] text-neutral-500 font-mono">
                  {item.timeFormatted} {item.location ? `· ${item.location}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
