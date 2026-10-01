import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Circle, 
  Filter, 
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import { Assignment, AssignmentStatus } from '@/types/database';
import { calculateDeadlineInfo } from '@/utils/dates';
import { PriorityIndicator } from '../common/PriorityIndicator';
import { EmptyState } from '../common/EmptyState';

interface AssignmentsViewProps {
  assignments: Assignment[];
  onToggleStatus: (id: string, status: AssignmentStatus) => void;
  onSelectAssignment: (asg: Assignment) => void;
}

export function AssignmentsView({
  assignments,
  onToggleStatus,
  onSelectAssignment,
}: AssignmentsViewProps) {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'due_asc' | 'priority_desc'>('due_asc');

  // Collect distinct subjects
  const subjects = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach((a) => set.add(a.subject));
    return Array.from(set);
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments
      .filter((a) => a.status !== 'archived')
      .filter((a) => {
        if (statusFilter === 'pending') return a.status === 'pending';
        if (statusFilter === 'completed') return a.status === 'completed';
        return true;
      })
      .filter((a) => {
        if (selectedSubject === 'all') return true;
        return a.subject === selectedSubject;
      })
      .map((a) => ({ ...a, deadline: calculateDeadlineInfo(a.due_at) }))
      .sort((a, b) => {
        if (sortOrder === 'due_asc') {
          return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        } else {
          const pOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          return pOrder[b.priority] - pOrder[a.priority];
        }
      });
  }, [assignments, statusFilter, selectedSubject, sortOrder]);

  return (
    <div className="space-y-6 pb-20 lg:pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Course Assignments
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Deliverables, problem sets, and lab exercises
          </p>
        </div>

        {/* Status segmented control */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'pending'
                ? 'bg-white text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            Pending ({assignments.filter((a) => a.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'completed'
                ? 'bg-white text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            Submitted ({assignments.filter((a) => a.status === 'completed').length})
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            All ({assignments.length})
          </button>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-neutral-200 rounded-xl">
        {/* Subject Filter */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
              selectedSubject === 'all'
                ? 'bg-neutral-900 text-white font-medium'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            All Subjects
          </button>
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                selectedSubject === sub
                  ? 'bg-neutral-900 text-white font-medium'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Sort Toggle */}
        <button
          onClick={() => setSortOrder(sortOrder === 'due_asc' ? 'priority_desc' : 'due_asc')}
          className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 font-medium px-2.5 py-1 rounded-md hover:bg-neutral-100 transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
          <span>Sort: {sortOrder === 'due_asc' ? 'Impending Due Date' : 'Highest Priority'}</span>
        </button>
      </div>

      {/* Assignment Cards List */}
      {assignments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No assignments yet"
          description="Your section has no assignments listed. Deliverables will appear here once published or imported."
        />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No assignments match your filter"
          description="Try changing the subject or status filter above."
          actionLabel="Clear filters"
          onAction={() => {
            setStatusFilter('all');
            setSelectedSubject('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssignments.map((asg) => {
            const isCompleted = asg.status === 'completed';
            const dl = asg.deadline;

            return (
              <div
                key={asg.id}
                className={`bg-white border rounded-2xl p-5 transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'border-neutral-200/60 opacity-80'
                    : 'border-neutral-200 hover:border-neutral-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
                      {asg.subject}
                    </span>
                    <PriorityIndicator priority={asg.priority} />
                  </div>

                  <h3
                    onClick={() => onSelectAssignment(asg)}
                    className="text-sm font-semibold text-neutral-900 hover:text-blue-600 cursor-pointer transition-colors leading-snug"
                  >
                    {asg.title}
                  </h3>

                  <p className="text-xs text-neutral-500 line-clamp-3 mt-1.5 leading-relaxed">
                    {asg.description}
                  </p>
                </div>

                {/* Footer with deadline and action */}
                <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
                  <div className="text-xs font-mono tabular-nums">
                    <span
                      className={`flex items-center gap-1 font-sans ${
                        isCompleted
                          ? 'text-neutral-400'
                          : dl.isOverdue
                          ? 'text-rose-700 font-semibold'
                          : dl.isDueToday
                          ? 'text-amber-700 font-semibold'
                          : 'text-neutral-600'
                      }`}
                    >
                      {dl.isOverdue && !isCompleted && (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                      <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{dl.relativeLabel}</span>
                    </span>
                  </div>

                  {/* Toggle completion */}
                  <button
                    onClick={() => onToggleStatus(asg.id, isCompleted ? 'pending' : 'completed')}
                    className={`flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-lg border transition-all ${
                      isCompleted
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Submitted</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Mark Done</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
