import React from 'react';
import { FileText, ArrowRight, User } from 'lucide-react';
import { Note } from '@/types/database';
import { EmptyState } from '../common/EmptyState';

interface RecentNotesSectionProps {
  notes: Note[];
  onSelectNote: (note: Note) => void;
  onNavigateToNotes: () => void;
}

export function RecentNotesSection({
  notes,
  onSelectNote,
  onNavigateToNotes,
}: RecentNotesSectionProps) {
  const publishedNotes = notes.filter((n) => n.status === 'published');

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-neutral-900 uppercase">
            Study Notes & Reviewers
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Summaries, cheat sheets, and guidelines
          </p>
        </div>
        <button
          onClick={onNavigateToNotes}
          className="text-xs text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-1 transition-colors"
        >
          All Notes <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {publishedNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes shared yet"
          description="Class lecture reviewers or study notes will appear here once published."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {publishedNotes.slice(0, 3).map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note)}
              className="p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {note.subject && (
                  <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">
                    {note.subject}
                  </span>
                )}
                <h4 className="text-xs font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1.5">
                  {note.title}
                </h4>
                <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed">
                  {note.content}
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-3 pt-2.5 border-t border-neutral-100 font-mono">
                <User className="w-3 h-3 text-neutral-400" />
                <span className="truncate">{note.author}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
