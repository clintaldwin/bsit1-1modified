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

/**
 * SectionRepository: The abstract contract for reading and manipulating section data.
 * 
 * In Phase 1: Backed by mockStore (in-memory + localStorage persistence).
 * In Phase 2: Backed by Supabase client querying PostgreSQL via RLS.
 * 
 * Components code ONLY to this interface.
 */
export interface SectionRepository {
  // Section Metadata
  getSection(): Promise<Section>;
  updateSection(section: Partial<Section>): Promise<Section>;

  // Announcements
  getAnnouncements(includeArchived?: boolean): Promise<Announcement[]>;
  createAnnouncement(item: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>): Promise<Announcement>;
  updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement>;
  archiveAnnouncement(id: string): Promise<void>;
  deleteAnnouncement(id: string): Promise<void>;

  // Assignments
  getAssignments(includeArchived?: boolean): Promise<Assignment[]>;
  createAssignment(item: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>): Promise<Assignment>;
  updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment>;
  archiveAssignment(id: string): Promise<void>;
  deleteAssignment(id: string): Promise<void>;

  // Tasks
  getTasks(includeArchived?: boolean): Promise<Task[]>;
  createTask(item: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  archiveTask(id: string): Promise<void>;
  deleteTask(id: string): Promise<void>;

  // Notes
  getNotes(includeArchived?: boolean): Promise<Note[]>;
  createNote(item: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note>;
  archiveNote(id: string): Promise<void>;
  deleteNote(id: string): Promise<void>;

  // Events
  getEvents(): Promise<Event[]>;
  createEvent(item: Omit<Event, 'id' | 'created_at'>): Promise<Event>;
  updateEvent(id: string, updates: Partial<Event>): Promise<Event>;
  cancelEvent(id: string): Promise<void>;
  deleteEvent(id: string): Promise<void>;

  // Resources
  getResources(includeArchived?: boolean): Promise<Resource[]>;
  createResource(item: Omit<Resource, 'id' | 'created_at' | 'updated_at'>): Promise<Resource>;
  updateResource(id: string, updates: Partial<Resource>): Promise<Resource>;
  archiveResource(id: string): Promise<void>;
  deleteResource(id: string): Promise<void>;

  // Members
  getMembers(): Promise<Member[]>;
  createMember(item: Omit<Member, 'id' | 'created_at'>): Promise<Member>;
  updateMember(id: string, updates: Partial<Member>): Promise<Member>;

  // Batch Import (The Core Pipeline)
  importBatch(items: ImportItem[], sectionId: string, createdBy?: string): Promise<{
    insertedCount: number;
    entitiesByType: Record<EntityType, number>;
  }>;

  // Real-time listener contract (triggers when data updates)
  subscribe(callback: () => void): () => void;

  // Reset to initial seed data
  resetToDefault(): Promise<void>;
}
