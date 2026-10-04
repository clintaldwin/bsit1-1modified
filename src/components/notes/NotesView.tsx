import React, { useState, useMemo } from 'react';
import { FileText, User, Filter, Search, ExternalLink } from 'lucide-react';
import { Note } from '@/types/database';
import { EmptyState } from '../common/EmptyState';

interface NotesViewProps {
  notes: Note[];
  onSelectNote: (note: Note) => void;
}

export function NotesView({ notes, onSelectNote }: NotesViewProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const subjects = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (n.subject) set.add(n.subject);
    });
    return Array.from(set);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => n.status === 'published')
      .filter((n) => {
        if (selectedSubject === 'all') return true;
        return n.subject === selectedSubject;
      })
      .filter((n) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.subject && n.subject.toLowerCase().includes(q)) ||
          n.author.toLowerCase().includes(q)
        );
      });
  }, [notes, selectedSubject, searchQuery]);

  return (
    <div className="space-y-6 pb-20 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Notes & Study Reviewers
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Class lecture summaries, exam cheat sheets, and guidelines
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-neutral-200 rounded-xl">
        {/* Subject Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
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

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes content..."
            className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg outline-hidden focus:border-neutral-400 transition-colors"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes published yet"
          description="Class lecture summaries, study guides, and reviewers will appear here once added or imported."
        />
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes match your filter"
          description="Try changing the filter or search keywords."
          actionLabel="Show all notes"
          onAction={() => {
            setSelectedSubject('all');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note)}
              className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-2xl p-5 transition-all shadow-xs cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                    {note.subject || 'General'}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(note.created_at))}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors leading-snug mb-2">
                  {note.title}
                </h3>

                <p className="text-xs text-neutral-600 line-clamp-4 leading-relaxed whitespace-pre-line">
                  {note.content}
                </p>

                {note.url && (
                  <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-neutral-100/70">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-100">
                      <span>📄 Source Material</span>
                    </span>
                    <a
                      href={note.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      title="Open source material directly"
                    >
                      <span>Open Source Material</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-3 mt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-mono">
                <span className="flex items-center gap-1.5 font-sans">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="truncate">{note.author}</span>
                </span>
                <span className="text-blue-600 group-hover:underline text-[11px]">
                  Read full note →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
