import React from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { Event } from '@/types/database';
import { formatEventDateTime } from '@/utils/dates';
import { EmptyState } from '../common/EmptyState';

interface UpcomingEventsSectionProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
  onNavigateToCalendar: () => void;
}

export function UpcomingEventsSection({
  events,
  onSelectEvent,
  onNavigateToCalendar,
}: UpcomingEventsSectionProps) {
  const upcomingEvents = events
    .filter((e) => e.status !== 'cancelled')
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-neutral-900 uppercase">
            Upcoming Schedule & Exams
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Quizzes, defenses, and section activities
          </p>
        </div>
        <button
          onClick={onNavigateToCalendar}
          className="text-xs text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
        >
          View Calendar
        </button>
      </div>

      {upcomingEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No upcoming events"
          description="There are no scheduled quizzes or activities on the calendar."
        />
      ) : (
        <div className="space-y-3">
          {upcomingEvents.slice(0, 4).map((evt) => (
            <div
              key={evt.id}
              onClick={() => onSelectEvent(evt)}
              className="p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50 transition-all cursor-pointer group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-neutral-100 text-neutral-700 shrink-0 group-hover:bg-neutral-200 transition-colors">
                <Calendar className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {evt.title}
                </h4>
                {evt.description && (
                  <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                    {evt.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-2 font-mono">
                  <span className="flex items-center gap-1 text-neutral-700 font-sans">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    {formatEventDateTime(evt.starts_at, evt.ends_at)}
                  </span>
                  {evt.location && (
                    <>
                      <span aria-hidden="true" className="text-neutral-300">·</span>
                      <span className="flex items-center gap-1 text-neutral-500 font-sans">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        {evt.location}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
