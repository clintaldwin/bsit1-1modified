/**
 * Section Lobby - JSON Import Schema & Zod Validators
 * 
 * Strict data contract for external AI-generated batch imports.
 */

import { z } from 'zod';

// Allowed priority enums
export const PriorityEnum = z.enum(['low', 'normal', 'high', 'urgent']);

// Date-time validator that handles standard ISO 8601 strings and parseable dates
const DateTimeString = z.string().refine((val) => {
  const parsed = Date.parse(val);
  return !isNaN(parsed);
}, {
  message: 'Must be a valid ISO 8601 date string (e.g., 2026-10-02T23:59:00Z or 2026-10-02T18:00:00+08:00)',
});

// Optional date-time validator
const OptionalDateTimeString = z.string().optional().refine((val) => {
  if (!val || val.trim() === '') return true;
  const parsed = Date.parse(val);
  return !isNaN(parsed);
}, {
  message: 'Must be a valid ISO 8601 date string if provided',
});

// 1. Announcement Item Schema
export const AnnouncementDataSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters long').max(200, 'Title must not exceed 200 characters'),
  content: z.string().min(3, 'Content must be at least 3 characters long'),
  priority: PriorityEnum.default('normal'),
  expires_at: OptionalDateTimeString,
});

export const AnnouncementItemSchema = z.object({
  type: z.literal('announcement'),
  data: AnnouncementDataSchema,
  source_text: z.string().optional(),
});

// 2. Assignment Item Schema
export const AssignmentDataSchema = z.object({
  subject: z.string().min(2, 'Subject/Course name is required (e.g. Database Systems)'),
  title: z.string().min(2, 'Title must be at least 2 characters long').max(200, 'Title must not exceed 200 characters'),
  description: z.string().min(3, 'Description or instructions are required'),
  due_at: DateTimeString,
  priority: PriorityEnum.default('normal'),
});

export const AssignmentItemSchema = z.object({
  type: z.literal('assignment'),
  data: AssignmentDataSchema,
  source_text: z.string().optional(),
});

// 3. Task Item Schema
export const TaskDataSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
  description: z.string().default(''),
  assigned_to: z.string().optional(),
  due_at: OptionalDateTimeString,
  priority: PriorityEnum.default('normal'),
});

export const TaskItemSchema = z.object({
  type: z.literal('task'),
  data: TaskDataSchema,
  source_text: z.string().optional(),
});

// 4. Note Item Schema
export const NoteDataSchema = z.object({
  title: z.string().min(2, 'Note title is required'),
  content: z.string().min(3, 'Note content or study material is required'),
  subject: z.string().optional(),
  author: z.string().optional(),
});

export const NoteItemSchema = z.object({
  type: z.literal('note'),
  data: NoteDataSchema,
  source_text: z.string().optional(),
});

// 5. Event Item Schema
export const EventDataSchema = z.object({
  title: z.string().min(2, 'Event title is required (e.g. Midterm Exam, Quiz 2)'),
  description: z.string().default(''),
  starts_at: DateTimeString,
  ends_at: OptionalDateTimeString,
  location: z.string().optional(),
});

export const EventItemSchema = z.object({
  type: z.literal('event'),
  data: EventDataSchema,
  source_text: z.string().optional(),
});

// 6. Resource Item Schema
export const ResourceDataSchema = z.object({
  title: z.string().min(2, 'Resource title is required'),
  description: z.string().optional(),
  url: z.string().url('Must be a valid URL (e.g. https://drive.google.com/...)').optional().or(z.literal('')),
  category: z.string().optional(),
});

export const ResourceItemSchema = z.object({
  type: z.literal('resource'),
  data: ResourceDataSchema,
  source_text: z.string().optional(),
});

// Discriminated Union for Import Items
export const ImportItemSchema = z.discriminatedUnion('type', [
  AnnouncementItemSchema,
  AssignmentItemSchema,
  TaskItemSchema,
  NoteItemSchema,
  EventItemSchema,
  ResourceItemSchema,
]);

// Top-Level Import Envelope Schema
export const ImportBatchSchema = z.object({
  version: z.literal('1.0', {
    message: 'Schema version must be "1.0"',
  }),
  source_text: z.string().optional(),
  items: z.array(z.any()).min(1, 'Batch must contain at least one item'),
});

// TypeScript Types inferred from Zod
export type ImportBatchRaw = z.infer<typeof ImportBatchSchema>;
export type ImportItem = z.infer<typeof ImportItemSchema>;
export type AnnouncementItem = z.infer<typeof AnnouncementItemSchema>;
export type AssignmentItem = z.infer<typeof AssignmentItemSchema>;
export type TaskItem = z.infer<typeof TaskItemSchema>;
export type NoteItem = z.infer<typeof NoteItemSchema>;
export type EventItem = z.infer<typeof EventItemSchema>;
export type ResourceItem = z.infer<typeof ResourceItemSchema>;

export type ValidatedItemResult = {
  index: number;
  item: ImportItem | null;
  rawItem: any;
  isValid: boolean;
  errors: { field: string; message: string }[];
  itemType: string;
};

export type BatchValidationResult = {
  isValid: boolean;
  version: string;
  sourceText?: string;
  totalCount: number;
  validCount: number;
  errorCount: number;
  items: ValidatedItemResult[];
  globalErrors: string[];
};
