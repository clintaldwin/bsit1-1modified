import React, { useState } from 'react';
import { 
  FileCode2, 
  Bell, 
  BookOpen, 
  CheckSquare, 
  FileText, 
  Calendar, 
  FolderGit2, 
  Users, 
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Archive,
  AlertCircle
} from 'lucide-react';
import { 
  Section, 
  Member, 
  Announcement, 
  Assignment, 
  Task, 
  Note, 
  Event, 
  Resource,
  PriorityLevel 
} from '@/types/database';
import { ImportDataView } from './ImportDataView';
import { databaseRepository } from '@/lib/database/mockStore';
import { useToast } from '../common/Toast';
import { PriorityIndicator } from '../common/PriorityIndicator';
import { formatPublishedDate, calculateDeadlineInfo, formatEventDateTime } from '@/utils/dates';

export type AdminTab = 
  | 'overview' 
  | 'import' 
  | 'announcements' 
  | 'assignments' 
  | 'tasks' 
  | 'notes' 
  | 'events' 
  | 'resources' 
  | 'members';

interface AdminDashboardProps {
  section: Section | null;
  announcements: Announcement[];
  assignments: Assignment[];
  tasks: Task[];
  notes: Note[];
  events: Event[];
  resources: Resource[];
  members: Member[];
  onResetData: () => void;
  onNavigateToLobby: () => void;
}

export function AdminDashboard({
  section,
  announcements,
  assignments,
  tasks,
  notes,
  events,
  resources,
  members,
  onResetData,
  onNavigateToLobby,
}: AdminDashboardProps) {
  const { showToast } = useToast();
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('overview');

  // Simple Creation Modals State
  const [showCreateModal, setShowCreateModal] = useState<AdminTab | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [formFields, setFormFields] = useState<any>({});

  const sectionId = section?.id || 'sec_bsit11';

  // Metrics
  const activeAssignments = assignments.filter((a) => a.status === 'pending');
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const upcomingEvents = events.filter((e) => e.status !== 'cancelled');
  const activeAnnouncements = announcements.filter((a) => a.status === 'published');

  const tabs: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: CheckSquare },
    { id: 'import', label: 'Import JSON', icon: FileCode2 },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'assignments', label: 'Assignments', icon: BookOpen },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'resources', label: 'Resources', icon: FolderGit2 },
    { id: 'members', label: 'Members', icon: Users },
  ];

  // Quick Handlers for Manual Entity Creation
  const handleOpenCreateModal = (type: AdminTab) => {
    setShowCreateModal(type);
    setFormFields({
      priority: 'normal',
      subject: '',
      title: '',
      content: '',
      description: '',
      due_at: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
      starts_at: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
      location: '',
      url: '',
      category: 'General',
      assigned_to: '',
      author: 'Section Admin',
    });
  };

  const handleSaveNewEntity = async () => {
    if (!showCreateModal) return;
    try {
      const now = new Date().toISOString();
      const currentSectionId = sectionId;

      switch (showCreateModal) {
        case 'announcements':
          if (!formFields.title || !formFields.content) {
            showToast('Missing Fields', 'Title and content are required.', 'error');
            return;
          }
          await databaseRepository.createAnnouncement({
            section_id: currentSectionId,
            title: formFields.title,
            content: formFields.content,
            priority: formFields.priority || 'normal',
            status: 'published',
            published_at: now,
            created_by: 'Section Admin',
          });
          break;

        case 'assignments':
          if (!formFields.title || !formFields.subject) {
            showToast('Missing Fields', 'Title and Subject are required.', 'error');
            return;
          }
          await databaseRepository.createAssignment({
            section_id: currentSectionId,
            subject: formFields.subject,
            title: formFields.title,
            description: formFields.description || '',
            due_at: formFields.due_at ? new Date(formFields.due_at).toISOString() : now,
            priority: formFields.priority || 'normal',
            status: 'pending',
            created_by: 'Section Admin',
          });
          break;

        case 'tasks':
          if (!formFields.title) {
            showToast('Missing Fields', 'Task title is required.', 'error');
            return;
          }
          await databaseRepository.createTask({
            section_id: currentSectionId,
            title: formFields.title,
            description: formFields.description || '',
            assigned_to: formFields.assigned_to || undefined,
            due_at: formFields.due_at ? new Date(formFields.due_at).toISOString() : undefined,
            priority: formFields.priority || 'normal',
            status: 'pending',
            created_by: 'Section Admin',
          });
          break;

        case 'notes':
          if (!formFields.title || !formFields.content) {
            showToast('Missing Fields', 'Title and Content are required.', 'error');
            return;
          }
          await databaseRepository.createNote({
            section_id: currentSectionId,
            subject: formFields.subject || undefined,
            title: formFields.title,
            content: formFields.content,
            author: formFields.author || 'Section Admin',
            status: 'published',
          });
          break;

        case 'events':
          if (!formFields.title || !formFields.starts_at) {
            showToast('Missing Fields', 'Title and Start Date are required.', 'error');
            return;
          }
          await databaseRepository.createEvent({
            section_id: currentSectionId,
            title: formFields.title,
            description: formFields.description || '',
            starts_at: new Date(formFields.starts_at).toISOString(),
            location: formFields.location || undefined,
            status: 'upcoming',
            created_by: 'Section Admin',
          });
          break;

        case 'resources':
          if (!formFields.title) {
            showToast('Missing Fields', 'Resource Title is required.', 'error');
            return;
          }
          await databaseRepository.createResource({
            section_id: currentSectionId,
            title: formFields.title,
            description: formFields.description || undefined,
            url: formFields.url || undefined,
            category: formFields.category || 'General',
            status: 'active',
            created_by: 'Section Admin',
          });
          break;
      }

      showToast('Item Published', `Created new ${showCreateModal.slice(0, -1)} successfully.`, 'success');
      setShowCreateModal(null);
    } catch (err: any) {
      showToast('Creation Failed', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-12">
      
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <span>Administrator Console</span>
            <span aria-hidden="true">·</span>
            <span>{section?.code}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            Section Operations
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveAdminTab('import')}
            className="px-3.5 py-1.5 text-xs font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
          <button
            onClick={() => setShowResetConfirmModal(true)}
            className="px-3 py-1.5 text-xs font-medium text-neutral-600 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors flex items-center gap-1.5"
            title="Reset database to initial seed data"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Admin Sub Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white border border-neutral-200 rounded-xl overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* VIEW: OVERVIEW */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs">
              <span className="text-xs font-mono uppercase text-neutral-400 block mb-1">
                Active Assignments
              </span>
              <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
                {activeAssignments.length}
              </span>
            </div>
            <div className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs">
              <span className="text-xs font-mono uppercase text-neutral-400 block mb-1">
                Pending Tasks
              </span>
              <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
                {pendingTasks.length}
              </span>
            </div>
            <div className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs">
              <span className="text-xs font-mono uppercase text-neutral-400 block mb-1">
                Upcoming Events
              </span>
              <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
                {upcomingEvents.length}
              </span>
            </div>
            <div className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs">
              <span className="text-xs font-mono uppercase text-neutral-400 block mb-1">
                Announcements
              </span>
              <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
                {activeAnnouncements.length}
              </span>
            </div>
          </div>

          {/* Quick Actions & AI Import Callout */}
          <div className="bg-neutral-900 text-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
                  Ready to paste group chat announcements?
                </h3>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                Paste structured JSON from ChatGPT or Gemini. The application will validate the contract, show a human preview, and publish without code modifications.
              </p>
            </div>
            <button
              onClick={() => setActiveAdminTab('import')}
              className="px-4 py-2 bg-white text-neutral-900 text-xs font-bold rounded-xl hover:bg-neutral-100 transition-colors self-start md:self-auto"
            >
              Open JSON Import
            </button>
          </div>

          {/* Direct Entity Management Links */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider font-mono mb-4">
              Direct Management (Create without code changes)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {['announcements', 'assignments', 'tasks', 'notes', 'events', 'resources'].map((entityKey) => (
                <button
                  key={entityKey}
                  onClick={() => handleOpenCreateModal(entityKey as AdminTab)}
                  className="p-3 text-left rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all group"
                >
                  <Plus className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 mb-2" />
                  <p className="text-xs font-semibold text-neutral-900 capitalize">
                    + New {entityKey.slice(0, -1)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: IMPORT JSON */}
      {activeAdminTab === 'import' && (
        <ImportDataView
          sectionId={sectionId}
          onImportSuccess={() => setActiveAdminTab('overview')}
        />
      )}

      {/* VIEW: ANNOUNCEMENTS MANAGEMENT */}
      {activeAdminTab === 'announcements' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900">Manage Announcements</h3>
            <button
              onClick={() => handleOpenCreateModal('announcements')}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Announcement</span>
            </button>
          </div>
          {announcements.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No announcements published yet. Click "Create Announcement" above or use Import JSON.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {announcements.map((a) => (
                <div key={a.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900">{a.title}</span>
                      <PriorityIndicator priority={a.priority} />
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{a.content}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await databaseRepository.deleteAnnouncement(a.id);
                      showToast('Deleted', 'Announcement removed from database.', 'info');
                    }}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors"
                    title="Delete announcement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: ASSIGNMENTS MANAGEMENT */}
      {activeAdminTab === 'assignments' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900">Manage Assignments</h3>
            <button
              onClick={() => handleOpenCreateModal('assignments')}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Assignment</span>
            </button>
          </div>
          {assignments.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No assignments recorded yet. Click "Create Assignment" above or use Import JSON.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {assignments.map((asg) => (
                <div key={asg.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-neutral-500 uppercase">{asg.subject}</span>
                      <span className="text-neutral-300">·</span>
                      <span className="text-xs font-bold text-neutral-900">{asg.title}</span>
                      <PriorityIndicator priority={asg.priority} />
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{asg.description}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await databaseRepository.deleteAssignment(asg.id);
                      showToast('Deleted', 'Assignment removed from database.', 'info');
                    }}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors"
                    title="Delete assignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: TASKS MANAGEMENT */}
      {activeAdminTab === 'tasks' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900">Manage Tasks</h3>
            <button
              onClick={() => handleOpenCreateModal('tasks')}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
          </div>
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No tasks recorded yet. Click "Create Task" above or use Import JSON.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {tasks.map((t) => (
                <div key={t.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900">{t.title}</span>
                      <PriorityIndicator priority={t.priority} />
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                      {t.assigned_to ? `Assigned: ${t.assigned_to} · ` : ''}{t.description}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await databaseRepository.deleteTask(t.id);
                      showToast('Deleted', 'Task removed from database.', 'info');
                    }}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: NOTES MANAGEMENT */}
      {activeAdminTab === 'notes' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900">Manage Notes & Reviewers</h3>
            <button
              onClick={() => handleOpenCreateModal('notes')}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Note</span>
            </button>
          </div>
          {notes.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No notes or study reviewers published yet. Click "Add Note" above.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {notes.map((n) => (
                <div key={n.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-neutral-500">{n.subject}</span>
                      <span className="text-xs font-bold text-neutral-900">{n.title}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{n.content}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await databaseRepository.deleteNote(n.id);
                      showToast('Deleted', 'Note removed from database.', 'info');
                    }}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: EVENTS MANAGEMENT */}
      {activeAdminTab === 'events' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900">Manage Events & Quizzes</h3>
            <button
              onClick={() => handleOpenCreateModal('events')}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Event</span>
            </button>
          </div>
          {events.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No events or quizzes scheduled yet. Click "Add Event" above.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {events.map((e) => (
                <div key={e.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-neutral-900">{e.title}</span>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {formatEventDateTime(e.starts_at, e.ends_at)} {e.location ? `· ${e.location}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await databaseRepository.deleteEvent(e.id);
                      showToast('Deleted', 'Event removed from database.', 'info');
                    }}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: RESOURCES MANAGEMENT */}
      {activeAdminTab === 'resources' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900">Manage Resources</h3>
            <button
              onClick={() => handleOpenCreateModal('resources')}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Resource</span>
            </button>
          </div>
          {resources.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No resources or shared drive links saved yet. Click "Add Resource" above.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {resources.map((r) => (
                <div key={r.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-neutral-900">{r.title}</span>
                    <p className="text-xs font-mono text-neutral-400 mt-0.5 truncate max-w-sm">{r.url}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await databaseRepository.deleteResource(r.id);
                      showToast('Deleted', 'Resource removed from database.', 'info');
                    }}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* VIEW: MEMBERS */}
      {activeAdminTab === 'members' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Section Members & Roles</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Section {section?.code} roster</p>
            </div>
          </div>
          <div className="divide-y divide-neutral-100">
            {members.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-neutral-900">{m.name}</span>
                  <p className="text-xs text-neutral-400 font-mono">{m.email || 'No email registered'}</p>
                </div>
                <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded-md ${
                  m.role === 'admin' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK MANUAL CREATION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 capitalize">
                Create New {showCreateModal.slice(0, -1)}
              </h3>
              <button onClick={() => setShowCreateModal(null)} className="text-neutral-400 hover:text-neutral-700">
                Cancel
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {showCreateModal === 'assignments' && (
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. CS 312 Database Systems"
                    value={formFields.subject}
                    onChange={(e) => setFormFields({ ...formFields, subject: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Title</label>
                <input
                  type="text"
                  placeholder="Title or deliverable name"
                  value={formFields.title}
                  onChange={(e) => setFormFields({ ...formFields, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 outline-hidden"
                />
              </div>

              {(showCreateModal === 'assignments' || showCreateModal === 'tasks' || showCreateModal === 'announcements') && (
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Priority</label>
                  <select
                    value={formFields.priority}
                    onChange={(e) => setFormFields({ ...formFields, priority: e.target.value as PriorityLevel })}
                    className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 outline-hidden"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              )}

              {(showCreateModal === 'assignments' || showCreateModal === 'tasks') && (
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formFields.due_at}
                    onChange={(e) => setFormFields({ ...formFields, due_at: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 outline-hidden"
                  />
                </div>
              )}

              {showCreateModal === 'events' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formFields.starts_at}
                      onChange={(e) => setFormFields({ ...formFields, starts_at: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">Location / Venue</label>
                    <input
                      type="text"
                      placeholder="e.g. IT Lab 4 or Room 302"
                      value={formFields.location}
                      onChange={(e) => setFormFields({ ...formFields, location: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 outline-hidden"
                    />
                  </div>
                </>
              )}

              {showCreateModal === 'resources' && (
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">URL Link</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={formFields.url}
                    onChange={(e) => setFormFields({ ...formFields, url: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Description / Details
                </label>
                <textarea
                  rows={3}
                  value={formFields.description || formFields.content}
                  onChange={(e) => setFormFields({ ...formFields, description: e.target.value, content: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 outline-hidden"
                />
              </div>
            </div>

            <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(null)}
                className="px-3.5 py-1.5 text-xs text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewEntity}
                className="px-4 py-1.5 text-xs font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Publish to Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP RESET CONFIRMATION MODAL */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-neutral-200 overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Reset Section Data?</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  This will clear all local records in localStorage and restore the empty BSIT 1-1 section state.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowResetConfirmModal(false);
                  onResetData();
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
