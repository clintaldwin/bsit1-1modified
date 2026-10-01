import React, { useState } from 'react';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  ArrowRight, 
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { Assignment, Task } from '@/types/database';
import { calculateDeadlineInfo } from '@/utils/dates';
import { PriorityIndicator } from '../common/PriorityIndicator';
import { EmptyState } from '../common/EmptyState';

interface DueSoonSectionProps {
  assignments: Assignment[];
  tasks: Task[];
  onToggleTaskStatus: (taskId: string, newStatus: any) => void;
  onSelectAssignment: (asg: Assignment) => void;
  onNavigateToTab: (tab: any) => void;
}

export function DueSoonSection({
  assignments,
  tasks,
  onToggleTaskStatus,
  onSelectAssignment,
  onNavigateToTab,
}: DueSoonSectionProps) {
  const [filterType, setFilterType] = useState<'all' | 'assignments' | 'tasks'>('all');

  // Prepare assignments with deadline info
  const pendingAssignments = assignments
    .filter((a) => a.status !== 'completed' && a.status !== 'archived')
    .map((a) => ({
      itemType: 'assignment' as const,
      id: a.id,
      title: a.title,
      subject: a.subject,
      description: a.description,
      priority: a.priority,
      due_at: a.due_at,
      status: a.status,
      original: a,
      deadline: calculateDeadlineInfo(a.due_at),
    }));

  // Prepare tasks with deadline info
  const pendingTasks = tasks
    .filter((t) => t.status !== 'completed' && t.status !== 'archived')
    .map((t) => ({
      itemType: 'task' as const,
      id: t.id,
      title: t.title,
      subject: t.assigned_to ? `Assigned: ${t.assigned_to}` : 'Section Task',
      description: t.description,
      priority: t.priority,
      due_at: t.due_at,
      status: t.status,
      original: t,
      deadline: calculateDeadlineInfo(t.due_at),
    }));

  const allItems = [...pendingAssignments, ...pendingTasks]
    .filter((item) => {
      if (filterType === 'assignments') return item.itemType === 'assignment';
      if (filterType === 'tasks') return item.itemType === 'task';
      return true;
    })
    .sort((a, b) => a.deadline.diffHours - b.deadline.diffHours);

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs">
      
      {/* Header with segmented filter buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-neutral-900 uppercase">
            Due Soon & Deliverables
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Ranked by impending deadline
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filterType === 'all'
                ? 'bg-white text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            All Items ({pendingAssignments.length + pendingTasks.length})
          </button>
          <button
            onClick={() => setFilterType('assignments')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filterType === 'assignments'
                ? 'bg-white text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            Assignments ({pendingAssignments.length})
          </button>
          <button
            onClick={() => setFilterType('tasks')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filterType === 'tasks'
                ? 'bg-white text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            Tasks ({pendingTasks.length})
          </button>
        </div>
      </div>

      {/* Item List */}
      {allItems.length === 0 ? (
        <EmptyState
          title="No pending deadlines"
          description="Your section has submitted all current assignments and tasks."
        />
      ) : (
        <div className="space-y-3">
          {allItems.slice(0, 5).map((item) => {
            const isAssignment = item.itemType === 'assignment';
            const dl = item.deadline;

            return (
              <div
                key={`${item.itemType}_${item.id}`}
                className="group p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50 transition-all flex items-start gap-3.5"
              >
                {/* Checkbox for tasks, or Icon for assignments */}
                {isAssignment ? (
                  <button
                    onClick={() => onSelectAssignment(item.original as Assignment)}
                    className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center text-neutral-400 group-hover:text-amber-600 transition-colors shrink-0"
                    title="View assignment details"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => onToggleTaskStatus(item.id, 'completed')}
                    className="mt-0.5 text-neutral-400 hover:text-emerald-600 transition-colors shrink-0"
                    title="Mark task completed"
                  >
                    <Circle className="w-4 h-4" />
                  </button>
                )}

                {/* Content */}
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    if (isAssignment) onSelectAssignment(item.original as Assignment);
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors line-clamp-1">
                      {item.title}
                    </span>
                    <PriorityIndicator priority={item.priority} />
                  </div>

                  <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                    {item.description}
                  </p>

                  {/* Clean unboxed metadata with bullet separators */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-2 font-mono tabular-nums">
                    <span className="font-sans font-medium text-neutral-700">{item.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={`font-sans flex items-center gap-1 ${
                        dl.isOverdue
                          ? 'text-rose-700 font-semibold'
                          : dl.isDueToday
                          ? 'text-amber-700 font-semibold'
                          : dl.isDueTomorrow
                          ? 'text-amber-800 font-medium'
                          : 'text-neutral-600'
                      }`}
                    >
                      {dl.isOverdue && <AlertTriangle className="w-3 h-3 text-rose-600 inline" />}
                      <Clock className="w-3 h-3 text-neutral-400 inline" />
                      {dl.relativeLabel}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {allItems.length > 5 && (
            <div className="pt-2 text-center">
              <button
                onClick={() => onNavigateToTab(filterType === 'tasks' ? 'tasks' : 'assignments')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-950 transition-colors py-1 px-3 rounded-md hover:bg-neutral-100"
              >
                View all {allItems.length} deliverables
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
