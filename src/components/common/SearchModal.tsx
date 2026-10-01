import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  BookOpen, 
  CheckSquare, 
  Bell, 
  FileText, 
  Calendar as CalendarIcon, 
  Link as LinkIcon 
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

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
  assignments: Assignment[];
  tasks: Task[];
  notes: Note[];
  events: Event[];
  resources: Resource[];
  onSelectItem: (type: EntityType, item: any) => void;
}

type FilterCategory = 'all' | EntityType;

export function SearchModal({
  isOpen,
  onClose,
  announcements,
  assignments,
  tasks,
  notes,
  events,
  resources,
  onSelectItem,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    const results: {
      type: EntityType;
      id: string;
      title: string;
      subtitle: string;
      item: any;
      priority?: any;
      dueLabel?: string;
    }[] = [];

    // Announcements
    if (activeCategory === 'all' || activeCategory === 'announcement') {
      announcements.forEach((a) => {
        if (a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)) {
          results.push({
            type: 'announcement',
            id: a.id,
            title: a.title,
            subtitle: a.content.slice(0, 100),
            item: a,
            priority: a.priority,
          });
        }
      });
    }

    // Assignments
    if (activeCategory === 'all' || activeCategory === 'assignment') {
      assignments.forEach((asg) => {
        if (
          asg.title.toLowerCase().includes(q) ||
          asg.subject.toLowerCase().includes(q) ||
          asg.description.toLowerCase().includes(q)
        ) {
          const deadline = calculateDeadlineInfo(asg.due_at);
          results.push({
            type: 'assignment',
            id: asg.id,
            title: asg.title,
            subtitle: `${asg.subject} · ${deadline.relativeLabel}`,
            item: asg,
            priority: asg.priority,
            dueLabel: deadline.relativeLabel,
          });
        }
      });
    }

    // Tasks
    if (activeCategory === 'all' || activeCategory === 'task') {
      tasks.forEach((t) => {
        if (
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.assigned_to && t.assigned_to.toLowerCase().includes(q))
        ) {
          const deadline = calculateDeadlineInfo(t.due_at);
          results.push({
            type: 'task',
            id: t.id,
            title: t.title,
            subtitle: t.assigned_to ? `Assigned to ${t.assigned_to}` : t.description.slice(0, 80),
            item: t,
            priority: t.priority,
            dueLabel: t.due_at ? deadline.relativeLabel : undefined,
          });
        }
      });
    }

    // Notes
    if (activeCategory === 'all' || activeCategory === 'note') {
      notes.forEach((n) => {
        if (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.subject && n.subject.toLowerCase().includes(q))
        ) {
          results.push({
            type: 'note',
            id: n.id,
            title: n.title,
            subtitle: `${n.subject || 'Section Note'} · By ${n.author}`,
            item: n,
          });
        }
      });
    }

    // Events
    if (activeCategory === 'all' || activeCategory === 'event') {
      events.forEach((e) => {
        if (
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.location && e.location.toLowerCase().includes(q))
        ) {
          results.push({
            type: 'event',
            id: e.id,
            title: e.title,
            subtitle: formatEventDateTime(e.starts_at, e.ends_at),
            item: e,
          });
        }
      });
    }

    // Resources
    if (activeCategory === 'all' || activeCategory === 'resource') {
      resources.forEach((r) => {
        if (
          r.title.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          (r.category && r.category.toLowerCase().includes(q))
        ) {
          results.push({
            type: 'resource',
            id: r.id,
            title: r.title,
            subtitle: r.category ? `${r.category} · ${r.url || 'Reference'}` : r.url || 'Resource link',
            item: r,
          });
        }
      });
    }

    return results;
  }, [query, activeCategory, announcements, assignments, tasks, notes, events, resources]);

  if (!isOpen) return null;

  const categories: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'assignment', label: 'Assignments' },
    { id: 'announcement', label: 'Announcements' },
    { id: 'task', label: 'Tasks' },
    { id: 'note', label: 'Notes' },
    { id: 'event', label: 'Events' },
    { id: 'resource', label: 'Resources' },
  ];

  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case 'assignment': return <BookOpen className="w-4 h-4 text-amber-600" />;
      case 'task': return <CheckSquare className="w-4 h-4 text-emerald-600" />;
      case 'announcement': return <Bell className="w-4 h-4 text-rose-600" />;
      case 'note': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'event': return <CalendarIcon className="w-4 h-4 text-purple-600" />;
      case 'resource': return <LinkIcon className="w-4 h-4 text-neutral-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-neutral-200 gap-3">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assignments, notes, deadlines, announcements..."
            className="flex-1 text-sm bg-transparent outline-hidden text-neutral-900 placeholder:text-neutral-400"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-medium px-2 py-1 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 rounded-md transition-colors"
          >
            Esc
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-neutral-50/80 border-b border-neutral-100 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-neutral-100">
          {!query.trim() ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              Type keywords such as "Database", "Quiz", "Printed", "SRS", or "Lab"
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              No matching section records found for "{query}".
            </div>
          ) : (
            searchResults.map((res) => (
              <button
                key={`${res.type}_${res.id}`}
                onClick={() => {
                  onSelectItem(res.type, res.item);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-neutral-50 transition-colors flex items-start gap-3 group"
              >
                <div className="mt-0.5 shrink-0 p-1.5 rounded-md bg-neutral-100 text-neutral-700">
                  {getEntityIcon(res.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-neutral-900 truncate group-hover:text-blue-600 transition-colors">
                      {res.title}
                    </span>
                    {res.priority && <PriorityIndicator priority={res.priority} />}
                  </div>
                  <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                    {res.subtitle}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
