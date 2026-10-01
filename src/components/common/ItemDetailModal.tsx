import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  MapPin, 
  User, 
  BookOpen, 
  CheckCircle, 
  Circle, 
  ExternalLink,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  Announcement, 
  Assignment, 
  Task, 
  Note, 
  Event, 
  Resource,
  EntityType 
} from '@/types/database';
import { calculateDeadlineInfo, formatEventDateTime } from '@/utils/dates';
import { PriorityIndicator } from './PriorityIndicator';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: EntityType | null;
  item: any;
  onUpdateTaskStatus?: (id: string, status: any) => void;
  onUpdateAssignmentStatus?: (id: string, status: any) => void;
}

export function ItemDetailModal({
  isOpen,
  onClose,
  type,
  item,
  onUpdateTaskStatus,
  onUpdateAssignmentStatus,
}: ItemDetailModalProps) {
  const [showSourceText, setShowSourceText] = useState(false);

  if (!isOpen || !item || !type) return null;

  const isAssignment = type === 'assignment';
  const isTask = type === 'task';
  const isAnnouncement = type === 'announcement';
  const isNote = type === 'note';
  const isEvent = type === 'event';
  const isResource = type === 'resource';

  const deadline = item.due_at ? calculateDeadlineInfo(item.due_at) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
              {type}
            </span>
            {item.priority && (
              <>
                <span className="text-neutral-300">·</span>
                <PriorityIndicator priority={item.priority} />
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Subject or category kicker */}
          {item.subject && (
            <p className="text-xs font-medium text-neutral-500 font-mono">
              {item.subject}
            </p>
          )}

          {/* Title */}
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight leading-snug">
            {item.title}
          </h2>

          {/* Key Dates & Meta */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 pt-1 border-t border-neutral-100">
            {deadline && (
              <span className={`flex items-center gap-1 font-medium ${
                deadline.isOverdue ? 'text-rose-700 font-semibold' : deadline.isDueToday ? 'text-amber-700 font-semibold' : 'text-neutral-700'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                {deadline.fullReadable} ({deadline.relativeLabel})
              </span>
            )}

            {isEvent && (
              <span className="flex items-center gap-1 text-neutral-700 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                {formatEventDateTime(item.starts_at, item.ends_at)}
              </span>
            )}

            {item.location && (
              <span className="flex items-center gap-1 text-neutral-600">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                {item.location}
              </span>
            )}

            {(item.author || item.created_by) && (
              <span className="flex items-center gap-1 text-neutral-500">
                <User className="w-3.5 h-3.5 text-neutral-400" />
                {item.author || item.created_by}
              </span>
            )}

            {item.assigned_to && (
              <span className="text-neutral-600">
                Assigned: <strong className="font-semibold text-neutral-800">{item.assigned_to}</strong>
              </span>
            )}
          </div>

          {/* Content / Description */}
          <div className="pt-2">
            <h4 className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider mb-2">
              Details & Instructions
            </h4>
            <div className="text-xs sm:text-sm text-neutral-700 leading-relaxed whitespace-pre-line bg-neutral-50/70 p-4 rounded-xl border border-neutral-200/70">
              {item.description || item.content || 'No additional details provided.'}
            </div>
          </div>

          {/* External URL if resource */}
          {item.url && (
            <div className="pt-2">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <span>Open Resource Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Raw Source Snippet Preservation (Auditing Section) */}
          {item.source_text && (
            <div className="pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShowSourceText(!showSourceText)}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                <span>Original Chat/Source Excerpt</span>
                {showSourceText ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
              </button>

              {showSourceText && (
                <div className="mt-2 p-3 bg-neutral-100/70 rounded-lg text-xs font-mono text-neutral-600 border border-neutral-200 italic">
                  "{item.source_text}"
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
          <div>
            {isTask && onUpdateTaskStatus && (
              <button
                onClick={() => {
                  const nextStatus = item.status === 'completed' ? 'pending' : 'completed';
                  onUpdateTaskStatus(item.id, nextStatus);
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-950 transition-colors py-1.5 px-3 rounded-lg border border-neutral-300 hover:bg-white"
              >
                {item.status === 'completed' ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mark as Pending</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Mark as Completed</span>
                  </>
                )}
              </button>
            )}

            {isAssignment && onUpdateAssignmentStatus && (
              <button
                onClick={() => {
                  const nextStatus = item.status === 'completed' ? 'pending' : 'completed';
                  onUpdateAssignmentStatus(item.id, nextStatus);
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-950 transition-colors py-1.5 px-3 rounded-lg border border-neutral-300 hover:bg-white"
              >
                {item.status === 'completed' ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Submitted (Reopen)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Mark as Submitted</span>
                  </>
                )}
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
