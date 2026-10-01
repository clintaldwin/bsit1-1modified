import React from 'react';
import { 
  Search, 
  ShieldCheck, 
  UserCheck, 
  LayoutDashboard, 
  BookOpen, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  FileText, 
  FolderGit2 
} from 'lucide-react';
import { Section } from '@/types/database';

export type NavTab = 
  | 'lobby' 
  | 'assignments' 
  | 'tasks' 
  | 'calendar' 
  | 'notes' 
  | 'resources' 
  | 'admin';

interface NavbarProps {
  section: Section | null;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  onOpenSearch: () => void;
}

export function Navbar({
  section,
  activeTab,
  onTabChange,
  isAdminMode,
  onToggleAdminMode,
  onOpenSearch,
}: NavbarProps) {
  const navLinks: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'lobby', label: 'Lobby', icon: LayoutDashboard },
    { id: 'assignments', label: 'Assignments', icon: BookOpen },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Schedule', icon: CalendarIcon },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'resources', label: 'Resources', icon: FolderGit2 },
  ];

  return (
    <>
      {/* Desktop & Mobile Top Bar adhering to the 3-Zone Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onTabChange('lobby')}
              className="text-base font-bold tracking-tight text-neutral-900 hover:opacity-80 transition-opacity text-left"
            >
              Section Lobby
            </button>
            {section && (
              <span className="hidden sm:inline-flex items-center text-xs text-neutral-500 font-mono">
                <span className="text-neutral-300 mr-2">/</span>
                {section.code}
              </span>
            )}
          </div>

          {/* Zone 2: 4-6 text navigation links (hidden on mobile, shown in bottom bar) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-neutral-600">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id && !isAdminMode;
              return (
                <button
                  key={link.id}
                  onClick={() => onTabChange(link.id)}
                  className={`relative py-1 transition-colors hover:text-neutral-900 ${
                    isActive ? 'text-neutral-950 font-semibold' : ''
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-[-16px] left-0 right-0 h-0.5 bg-neutral-950 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200/80"
              title="Search Section Lobby"
              aria-label="Search Section Lobby"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden md:inline-block text-[10px] font-mono text-neutral-400 bg-neutral-100 px-1 py-0.5 rounded border border-neutral-200">
                /
              </kbd>
            </button>

            {/* Admin Switcher Toggle */}
            <button
              onClick={onToggleAdminMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                isAdminMode
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              {isAdminMode ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin Console</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="hidden sm:inline">Student View</span>
                  <span className="sm:hidden">Student</span>
                </>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Fixed Bottom Tab Bar for Instant Thumb Reach */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 safe-bottom">
        <nav className="grid grid-cols-5 items-center h-14 px-2">
          {navLinks.slice(0, 4).map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id && !isAdminMode;
            return (
              <button
                key={link.id}
                onClick={() => onTabChange(link.id)}
                className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                  isActive ? 'text-neutral-950 font-semibold' : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[56px]">{link.label}</span>
              </button>
            );
          })}
          
          {/* 5th Mobile Tab: More / Admin Toggle or Resources */}
          <button
            onClick={() => onTabChange(isAdminMode ? 'lobby' : 'admin')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              isAdminMode ? 'text-neutral-950 font-semibold' : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${isAdminMode ? 'stroke-[2.5] text-neutral-900' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[56px]">
              {isAdminMode ? 'Admin' : 'More'}
            </span>
          </button>
        </nav>
      </div>
    </>
  );
}
