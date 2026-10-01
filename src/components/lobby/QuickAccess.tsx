import React from 'react';
import { 
  FolderGit2, 
  ExternalLink, 
  FileText, 
  BookOpen, 
  CheckSquare, 
  Calendar 
} from 'lucide-react';
import { Resource } from '@/types/database';
import { NavTab } from '../common/Navbar';

interface QuickAccessProps {
  resources: Resource[];
  onNavigateToTab: (tab: NavTab) => void;
}

export function QuickAccess({ resources, onNavigateToTab }: QuickAccessProps) {
  const activeResources = resources.filter((r) => r.status === 'active');

  const hubs = [
    { id: 'assignments' as NavTab, label: 'Assignments', icon: BookOpen, desc: 'Deliverables & Deadlines' },
    { id: 'tasks' as NavTab, label: 'Section Tasks', icon: CheckSquare, desc: 'Class Duties & Progress' },
    { id: 'calendar' as NavTab, label: 'Calendar', icon: Calendar, desc: 'Exams & Quizzes Timeline' },
    { id: 'notes' as NavTab, label: 'Notes & Reviewers', icon: FileText, desc: 'Exam Prep & Guides' },
  ];

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-neutral-900 uppercase">
            Quick Access & Class Links
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Lobby destinations and shared cloud drives
          </p>
        </div>
      </div>

      {/* Lobby Hubs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        {hubs.map((hub) => {
          const Icon = hub.icon;
          return (
            <button
              key={hub.id}
              onClick={() => onNavigateToTab(hub.id)}
              className="p-3 text-left rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all group"
            >
              <Icon className="w-4 h-4 text-neutral-600 group-hover:text-neutral-900 mb-2 transition-colors" />
              <p className="text-xs font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                {hub.label}
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                {hub.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Pinned Shared Resources */}
      {activeResources.length > 0 && (
        <div className="pt-4 border-t border-neutral-100">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-2.5">
            Shared Drives & References
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeResources.slice(0, 4).map((res) => (
              <a
                key={res.id}
                href={res.url || '#'}
                target={res.url ? '_blank' : '_self'}
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200/80 hover:bg-neutral-50 hover:border-neutral-300 transition-all text-neutral-700 hover:text-neutral-900 group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FolderGit2 className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 shrink-0" />
                  <span className="text-xs font-medium truncate">{res.title}</span>
                </div>
                {res.url && <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-neutral-700 shrink-0 ml-2" />}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
