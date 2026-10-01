import React from 'react';
import { Bell, Clock, ChevronRight } from 'lucide-react';
import { Announcement } from '@/types/database';
import { formatPublishedDate } from '@/utils/dates';
import { PriorityIndicator } from '../common/PriorityIndicator';
import { EmptyState } from '../common/EmptyState';

interface AnnouncementsSectionProps {
  announcements: Announcement[];
  onSelectAnnouncement: (ann: Announcement) => void;
}

export function AnnouncementsSection({
  announcements,
  onSelectAnnouncement,
}: AnnouncementsSectionProps) {
  const activeAnnouncements = announcements.filter((a) => a.status === 'published');

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-neutral-900 uppercase">
            Announcements & Notices
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Official class broadcasts & room updates
          </p>
        </div>
        <span className="text-xs font-mono text-neutral-400">
          {activeAnnouncements.length} active
        </span>
      </div>

      {activeAnnouncements.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No active announcements"
          description="Your section has no new broadcasts right now."
        />
      ) : (
        <div className="space-y-3">
          {activeAnnouncements.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectAnnouncement(item)}
              className="p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {item.title}
                </span>
                <PriorityIndicator priority={item.priority} />
              </div>

              <p className="text-xs text-neutral-600 mt-1 line-clamp-2 leading-relaxed">
                {item.content}
              </p>

              {/* Clean unboxed metadata with separators */}
              <div className="flex items-center gap-2 text-xs text-neutral-400 mt-2 font-mono">
                <span className="text-neutral-500 font-sans">{item.created_by}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  {formatPublishedDate(item.published_at)}
                </span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-neutral-300 group-hover:text-neutral-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
