/**
 * Section Lobby - Core Database Entities and TypeScript Type Definitions
 */

export type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent';

export type MemberRole = 'admin' | 'member';
export type MemberStatus = 'active' | 'inactive';

export type AnnouncementStatus = 'draft' | 'published' | 'archived';
export type AssignmentStatus = 'pending' | 'submitted' | 'completed' | 'archived';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived';
export type NoteStatus = 'published' | 'archived';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type ResourceStatus = 'active' | 'archived';

export interface Section {
  id: string;
  name: string;
  code: string;
  academic_year: string;
  semester: string;
  created_at: string;
  updated_at?: string;
}

export interface Member {
  id: string;
  section_id: string;
  user_id?: string;
  name: string;
  email?: string;
  role: MemberRole;
  status: MemberStatus;
  created_at: string;
}

export interface Announcement {
  id: string;
  section_id: string;
  title: string;
  content: string;
  priority: PriorityLevel;
  status: AnnouncementStatus;
  published_at: string;
  expires_at?: string;
  source_text?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  section_id: string;
  subject: string;
  title: string;
  description: string;
  due_at: string; // ISO 8601 string
  priority: PriorityLevel;
  status: AssignmentStatus;
  source_text?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  section_id: string;
  title: string;
  description: string;
  assigned_to?: string;
  due_at?: string; // ISO 8601 string
  priority: PriorityLevel;
  status: TaskStatus;
  source_text?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  section_id: string;
  subject?: string;
  title: string;
  content: string;
  author: string;
  status: NoteStatus;
  source_text?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  section_id: string;
  title: string;
  description: string;
  starts_at: string; // ISO 8601 string
  ends_at?: string;
  location?: string;
  status: EventStatus;
  source_text?: string;
  created_by: string;
  created_at: string;
}

export interface Resource {
  id: string;
  section_id: string;
  title: string;
  description?: string;
  url?: string;
  file_path?: string;
  category?: string;
  status: ResourceStatus;
  source_text?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type EntityType = 
  | 'announcement' 
  | 'assignment' 
  | 'task' 
  | 'note' 
  | 'event' 
  | 'resource';
