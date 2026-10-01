import { 
  Section, 
  Member, 
  Announcement, 
  Assignment, 
  Task, 
  Note, 
  Event, 
  Resource 
} from '@/types/database';

export const INITIAL_SECTION: Section = {
  id: 'sec_bsit11',
  name: 'BSIT 1-1',
  code: 'BSIT 1-1',
  academic_year: '2026–2027',
  semester: '1st Semester',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// No invented mock records — pure frontend initialized clean and empty
export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem_admin',
    section_id: 'sec_bsit11',
    name: 'Section Administrator',
    email: '',
    role: 'admin',
    status: 'active',
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
export const INITIAL_ASSIGNMENTS: Assignment[] = [];
export const INITIAL_TASKS: Task[] = [];
export const INITIAL_NOTES: Note[] = [];
export const INITIAL_EVENTS: Event[] = [];
export const INITIAL_RESOURCES: Resource[] = [];
