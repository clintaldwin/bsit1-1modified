import { 
  Section, 
  Member, 
  Announcement, 
  Assignment, 
  Task, 
  Note, 
  Event, 
  Resource,
  EntityType 
} from '@/types/database';
import { ImportItem } from '@/types/importSchema';
import { SectionRepository } from './adapter';
import { 
  INITIAL_SECTION, 
  INITIAL_MEMBERS, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_ASSIGNMENTS, 
  INITIAL_TASKS, 
  INITIAL_NOTES, 
  INITIAL_EVENTS, 
  INITIAL_RESOURCES 
} from './mockData';
import { transformImportItemToEntity } from '../validation/jsonValidator';

const STORAGE_KEY_PREFIX = 'section_lobby_bsit11_v1';
const LEGACY_STORAGE_KEY = 'section_lobby_data_v1';

interface StoredData {
  section: Section;
  members: Member[];
  announcements: Announcement[];
  assignments: Assignment[];
  tasks: Task[];
  notes: Note[];
  events: Event[];
  resources: Resource[];
}

class MockSectionStore implements SectionRepository {
  private data: StoredData;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): StoredData {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clean up legacy mock data key from previous run
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);

        const saved = window.localStorage.getItem(STORAGE_KEY_PREFIX);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Always ensure section name and code are BSIT 1-1
          parsed.section = {
            ...INITIAL_SECTION,
            ...(parsed.section || {}),
            name: 'BSIT 1-1',
            code: 'BSIT 1-1',
          };
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load Section Lobby data from storage, using defaults:', e);
    }

    return {
      section: INITIAL_SECTION,
      members: INITIAL_MEMBERS,
      announcements: INITIAL_ANNOUNCEMENTS,
      assignments: INITIAL_ASSIGNMENTS,
      tasks: INITIAL_TASKS,
      notes: INITIAL_NOTES,
      events: INITIAL_EVENTS,
      resources: INITIAL_RESOURCES,
    };
  }

  private persistAndNotify() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(this.data));
      }
    } catch (e) {
      console.warn('Failed to persist Section Lobby data to localStorage:', e);
    }

    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error executing store listener:', err);
      }
    });
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public async resetToDefault(): Promise<void> {
    this.data = {
      section: INITIAL_SECTION,
      members: INITIAL_MEMBERS,
      announcements: INITIAL_ANNOUNCEMENTS,
      assignments: INITIAL_ASSIGNMENTS,
      tasks: INITIAL_TASKS,
      notes: INITIAL_NOTES,
      events: INITIAL_EVENTS,
      resources: INITIAL_RESOURCES,
    };
    this.persistAndNotify();
  }

  // Section Metadata
  public async getSection(): Promise<Section> {
    return { ...this.data.section };
  }

  public async updateSection(section: Partial<Section>): Promise<Section> {
    this.data.section = {
      ...this.data.section,
      ...section,
      updated_at: new Date().toISOString(),
    };
    this.persistAndNotify();
    return { ...this.data.section };
  }

  // Announcements
  public async getAnnouncements(includeArchived = false): Promise<Announcement[]> {
    const list = this.data.announcements.filter((a) => includeArchived || a.status !== 'archived');
    return [...list].sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  }

  public async createAnnouncement(item: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>): Promise<Announcement> {
    const now = new Date().toISOString();
    const newRecord: Announcement = {
      ...item,
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: now,
      updated_at: now,
    };
    this.data.announcements.unshift(newRecord);
    this.persistAndNotify();
    return newRecord;
  }

  public async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    const idx = this.data.announcements.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`Announcement ${id} not found`);
    this.data.announcements[idx] = {
      ...this.data.announcements[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persistAndNotify();
    return this.data.announcements[idx];
  }

  public async archiveAnnouncement(id: string): Promise<void> {
    await this.updateAnnouncement(id, { status: 'archived' });
  }

  public async deleteAnnouncement(id: string): Promise<void> {
    this.data.announcements = this.data.announcements.filter((a) => a.id !== id);
    this.persistAndNotify();
  }

  // Assignments
  public async getAssignments(includeArchived = false): Promise<Assignment[]> {
    const list = this.data.assignments.filter((a) => includeArchived || a.status !== 'archived');
    return [...list].sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
  }

  public async createAssignment(item: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>): Promise<Assignment> {
    const now = new Date().toISOString();
    const newRecord: Assignment = {
      ...item,
      id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: now,
      updated_at: now,
    };
    this.data.assignments.push(newRecord);
    this.persistAndNotify();
    return newRecord;
  }

  public async updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment> {
    const idx = this.data.assignments.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`Assignment ${id} not found`);
    this.data.assignments[idx] = {
      ...this.data.assignments[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persistAndNotify();
    return this.data.assignments[idx];
  }

  public async archiveAssignment(id: string): Promise<void> {
    await this.updateAssignment(id, { status: 'archived' });
  }

  public async deleteAssignment(id: string): Promise<void> {
    this.data.assignments = this.data.assignments.filter((a) => a.id !== id);
    this.persistAndNotify();
  }

  // Tasks
  public async getTasks(includeArchived = false): Promise<Task[]> {
    const list = this.data.tasks.filter((t) => includeArchived || t.status !== 'archived');
    return [...list].sort((a, b) => {
      if (a.due_at && b.due_at) return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      if (a.due_at) return -1;
      if (b.due_at) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  public async createTask(item: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const now = new Date().toISOString();
    const newRecord: Task = {
      ...item,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: now,
      updated_at: now,
    };
    this.data.tasks.push(newRecord);
    this.persistAndNotify();
    return newRecord;
  }

  public async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const idx = this.data.tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Task ${id} not found`);
    this.data.tasks[idx] = {
      ...this.data.tasks[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persistAndNotify();
    return this.data.tasks[idx];
  }

  public async archiveTask(id: string): Promise<void> {
    await this.updateTask(id, { status: 'archived' });
  }

  public async deleteTask(id: string): Promise<void> {
    this.data.tasks = this.data.tasks.filter((t) => t.id !== id);
    this.persistAndNotify();
  }

  // Notes
  public async getNotes(includeArchived = false): Promise<Note[]> {
    const list = this.data.notes.filter((n) => includeArchived || n.status !== 'archived');
    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async createNote(item: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note> {
    const now = new Date().toISOString();
    const newRecord: Note = {
      ...item,
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: now,
      updated_at: now,
    };
    this.data.notes.unshift(newRecord);
    this.persistAndNotify();
    return newRecord;
  }

  public async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    const idx = this.data.notes.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error(`Note ${id} not found`);
    this.data.notes[idx] = {
      ...this.data.notes[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persistAndNotify();
    return this.data.notes[idx];
  }

  public async archiveNote(id: string): Promise<void> {
    await this.updateNote(id, { status: 'archived' });
  }

  public async deleteNote(id: string): Promise<void> {
    this.data.notes = this.data.notes.filter((n) => n.id !== id);
    this.persistAndNotify();
  }

  // Events
  public async getEvents(): Promise<Event[]> {
    return [...this.data.events]
      .filter((e) => e.status !== 'cancelled')
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }

  public async createEvent(item: Omit<Event, 'id' | 'created_at'>): Promise<Event> {
    const now = new Date().toISOString();
    const newRecord: Event = {
      ...item,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: now,
    };
    this.data.events.push(newRecord);
    this.persistAndNotify();
    return newRecord;
  }

  public async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const idx = this.data.events.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error(`Event ${id} not found`);
    this.data.events[idx] = {
      ...this.data.events[idx],
      ...updates,
    };
    this.persistAndNotify();
    return this.data.events[idx];
  }

  public async cancelEvent(id: string): Promise<void> {
    await this.updateEvent(id, { status: 'cancelled' });
  }

  public async deleteEvent(id: string): Promise<void> {
    this.data.events = this.data.events.filter((e) => e.id !== id);
    this.persistAndNotify();
  }

  // Resources
  public async getResources(includeArchived = false): Promise<Resource[]> {
    const list = this.data.resources.filter((r) => includeArchived || r.status !== 'archived');
    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async createResource(item: Omit<Resource, 'id' | 'created_at' | 'updated_at'>): Promise<Resource> {
    const now = new Date().toISOString();
    const newRecord: Resource = {
      ...item,
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: now,
      updated_at: now,
    };
    this.data.resources.push(newRecord);
    this.persistAndNotify();
    return newRecord;
  }

  public async updateResource(id: string, updates: Partial<Resource>): Promise<Resource> {
    const idx = this.data.resources.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Resource ${id} not found`);
    this.data.resources[idx] = {
      ...this.data.resources[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persistAndNotify();
    return this.data.resources[idx];
  }

  public async archiveResource(id: string): Promise<void> {
    await this.updateResource(id, { status: 'archived' });
  }

  public async deleteResource(id: string): Promise<void> {
    this.data.resources = this.data.resources.filter((r) => r.id !== id);
    this.persistAndNotify();
  }

  // Members
  public async getMembers(): Promise<Member[]> {
    return [...this.data.members];
  }

  public async createMember(item: Omit<Member, 'id' | 'created_at'>): Promise<Member> {
    const now = new Date().toISOString();
    const newRecord: Member = {
      ...item,
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: now,
    };
    this.data.members.push(newRecord);
    this.persistAndNotify();
    return newRecord;
  }

  public async updateMember(id: string, updates: Partial<Member>): Promise<Member> {
    const idx = this.data.members.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error(`Member ${id} not found`);
    this.data.members[idx] = {
      ...this.data.members[idx],
      ...updates,
    };
    this.persistAndNotify();
    return this.data.members[idx];
  }

  // Batch Import Execution
  public async importBatch(
    items: ImportItem[],
    sectionId: string,
    createdBy = 'Section Administrator'
  ): Promise<{ insertedCount: number; entitiesByType: Record<EntityType, number> }> {
    const counts: Record<EntityType, number> = {
      announcement: 0,
      assignment: 0,
      task: 0,
      note: 0,
      event: 0,
      resource: 0,
    };

    let insertedCount = 0;

    for (const item of items) {
      const { type, entity } = transformImportItemToEntity(item, sectionId, createdBy);

      switch (type) {
        case 'announcement':
          this.data.announcements.unshift(entity as Announcement);
          counts.announcement++;
          break;
        case 'assignment':
          this.data.assignments.push(entity as Assignment);
          counts.assignment++;
          break;
        case 'task':
          this.data.tasks.push(entity as Task);
          counts.task++;
          break;
        case 'note':
          this.data.notes.unshift(entity as Note);
          counts.note++;
          break;
        case 'event':
          this.data.events.push(entity as Event);
          counts.event++;
          break;
        case 'resource':
          this.data.resources.push(entity as Resource);
          counts.resource++;
          break;
      }
      insertedCount++;
    }

    this.persistAndNotify();

    return {
      insertedCount,
      entitiesByType: counts,
    };
  }
}

// Singleton repository instance for the application
export const databaseRepository: SectionRepository = new MockSectionStore();
