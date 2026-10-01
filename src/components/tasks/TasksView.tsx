import React, { useState } from 'react';
import { 
  CheckSquare, 
  Circle, 
  CheckCircle, 
  Clock, 
  User, 
  Calendar 
} from 'lucide-react';
import { Task, TaskStatus } from '@/types/database';
import { calculateDeadlineInfo } from '@/utils/dates';
import { PriorityIndicator } from '../common/PriorityIndicator';
import { EmptyState } from '../common/EmptyState';

interface TasksViewProps {
  tasks: Task[];
  onToggleStatus: (id: string, status: TaskStatus) => void;
  onSelectTask: (task: Task) => void;
}

export function TasksView({
  tasks,
  onToggleStatus,
  onSelectTask,
}: TasksViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  const filteredTasks = tasks
    .filter((t) => t.status !== 'archived')
    .filter((t) => {
      if (activeTab === 'all') return true;
      return t.status === activeTab;
    });

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <span className="text-xs text-emerald-700 font-medium">Completed</span>;
      case 'in_progress':
        return <span className="text-xs text-amber-700 font-medium">In Progress</span>;
      case 'pending':
        return <span className="text-xs text-neutral-500 font-medium">Pending</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Section Tasks & Duties
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Class responsibilities, fund collections, and logistics
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'pending'
                ? 'bg-white text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            Pending ({tasks.filter((t) => t.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('in_progress')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'in_progress'
                ? 'bg-white text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            In Progress ({tasks.filter((t) => t.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'completed'
                ? 'bg-white text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            Completed ({tasks.filter((t) => t.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks in this view"
          description="Everything is clear or no tasks match this filter."
        />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-2xl divide-y divide-neutral-100 overflow-hidden shadow-xs">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const dl = task.due_at ? calculateDeadlineInfo(task.due_at) : null;

            return (
              <div
                key={task.id}
                className="p-4 sm:p-5 flex items-start gap-4 hover:bg-neutral-50/50 transition-colors group"
              >
                {/* Status Toggle Button */}
                <button
                  onClick={() => onToggleStatus(task.id, isCompleted ? 'pending' : 'completed')}
                  className="mt-0.5 text-neutral-400 hover:text-emerald-600 transition-colors shrink-0"
                  title={isCompleted ? 'Mark pending' : 'Mark completed'}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                {/* Content */}
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onSelectTask(task)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3
                      className={`text-sm font-semibold transition-colors ${
                        isCompleted
                          ? 'line-through text-neutral-400'
                          : 'text-neutral-900 group-hover:text-blue-600'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <PriorityIndicator priority={task.priority} />
                      <span className="text-neutral-300">·</span>
                      {getStatusBadge(task.status)}
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Metadata line */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 mt-2.5 font-mono">
                    {task.assigned_to && (
                      <span className="flex items-center gap-1 text-neutral-700 font-sans">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{task.assigned_to}</span>
                      </span>
                    )}

                    {dl && (
                      <>
                        {task.assigned_to && <span aria-hidden="true" className="text-neutral-300">·</span>}
                        <span
                          className={`flex items-center gap-1 font-sans ${
                            dl.isOverdue && !isCompleted
                              ? 'text-rose-700 font-semibold'
                              : 'text-neutral-600'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{dl.relativeLabel}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status action selector */}
                <div className="hidden sm:flex items-center self-center pl-2">
                  <select
                    value={task.status}
                    onChange={(e) => onToggleStatus(task.id, e.target.value as TaskStatus)}
                    className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium py-1 px-2 rounded-md outline-hidden border border-neutral-200 cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
