import { 
  ImportBatchSchema, 
  ImportItemSchema, 
  BatchValidationResult, 
  ValidatedItemResult,
  ImportItem
} from '@/types/importSchema';
import { 
  Announcement, 
  Assignment, 
  Task, 
  Note, 
  Event, 
  Resource 
} from '@/types/database';

/**
 * Parses raw JSON string and generates human-readable line/column errors if syntax is invalid
 */
export function safeParseJson(jsonString: string): { success: true; data: any } | { success: false; error: string; line?: number; column?: number } {
  try {
    const data = JSON.parse(jsonString);
    return { success: true, data };
  } catch (err: any) {
    const message = err.message || 'Invalid JSON syntax';
    // Extract line/column from common browser error messages if present
    const match = message.match(/line (\d+) column (\d+)/i) || message.match(/position (\d+)/i);
    let line: number | undefined;
    let column: number | undefined;

    if (match && match[1] && match[2]) {
      line = parseInt(match[1], 10);
      column = parseInt(match[2], 10);
    } else if (match && match[1]) {
      // Approximate line from position
      const pos = parseInt(match[1], 10);
      const lines = jsonString.slice(0, pos).split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }

    const formatted = line && column 
      ? `JSON Syntax Error at Line ${line}, Column ${column}: ${message}`
      : `JSON Syntax Error: ${message}`;

    return { success: false, error: formatted, line, column };
  }
}

/**
 * Validates an entire import batch string against Section Lobby strict schema
 */
export function validateImportBatch(rawJsonString: string): BatchValidationResult {
  const parseResult = safeParseJson(rawJsonString);
  
  if (!parseResult.success) {
    return {
      isValid: false,
      version: 'unknown',
      totalCount: 0,
      validCount: 0,
      errorCount: 0,
      items: [],
      globalErrors: [parseResult.error],
    };
  }

  const raw = parseResult.data;

  // Validate envelope
  const envelopeResult = ImportBatchSchema.safeParse(raw);
  if (!envelopeResult.success) {
    const globalErrors: string[] = [];
    envelopeResult.error.issues.forEach((e: any) => {
      globalErrors.push(`${e.path.join('.') || 'Root'}: ${e.message}`);
    });

    return {
      isValid: false,
      version: String(raw?.version || 'missing'),
      sourceText: raw?.source_text,
      totalCount: Array.isArray(raw?.items) ? raw.items.length : 0,
      validCount: 0,
      errorCount: Array.isArray(raw?.items) ? raw.items.length : 1,
      items: [],
      globalErrors,
    };
  }

  const batch = envelopeResult.data;
  const items: ValidatedItemResult[] = [];
  let validCount = 0;
  let errorCount = 0;

  batch.items.forEach((rawItem, idx) => {
    const itemIndex = idx + 1;
    const itemType = rawItem?.type || 'unknown';

    const itemValidation = ImportItemSchema.safeParse(rawItem);

    if (itemValidation.success) {
      validCount++;
      items.push({
        index: itemIndex,
        item: itemValidation.data,
        rawItem,
        isValid: true,
        errors: [],
        itemType: itemValidation.data.type,
      });
    } else {
      errorCount++;
      const itemErrors = itemValidation.error.issues.map((err: any) => ({
        field: err.path.join('.') || 'general',
        message: err.message,
      }));

      items.push({
        index: itemIndex,
        item: null,
        rawItem,
        isValid: false,
        errors: itemErrors,
        itemType,
      });
    }
  });

  return {
    isValid: errorCount === 0 && items.length > 0,
    version: String(batch.version || '1.0'),
    sourceText: batch.source_text,
    totalCount: items.length,
    validCount,
    errorCount,
    items,
    globalErrors: [],
  };
}

/**
 * Transforms an approved ImportItem into a persistent Database entity
 */
export function transformImportItemToEntity(
  item: ImportItem,
  sectionId: string,
  createdBy = 'Section Admin'
): {
  type: ImportItem['type'];
  entity: Announcement | Assignment | Task | Note | Event | Resource;
} {
  const now = new Date().toISOString();
  const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  switch (item.type) {
    case 'announcement': {
      const entity: Announcement = {
        id,
        section_id: sectionId,
        title: item.data.title,
        content: item.data.content,
        priority: item.data.priority || 'normal',
        status: 'published',
        published_at: now,
        expires_at: item.data.expires_at || undefined,
        source_text: item.source_text,
        created_by: createdBy,
        created_at: now,
        updated_at: now,
      };
      return { type: 'announcement', entity };
    }

    case 'assignment': {
      const entity: Assignment = {
        id,
        section_id: sectionId,
        subject: item.data.subject,
        title: item.data.title,
        description: item.data.description,
        due_at: item.data.due_at,
        priority: item.data.priority || 'normal',
        status: 'pending',
        source_text: item.source_text,
        created_by: createdBy,
        created_at: now,
        updated_at: now,
      };
      return { type: 'assignment', entity };
    }

    case 'task': {
      const entity: Task = {
        id,
        section_id: sectionId,
        title: item.data.title,
        description: item.data.description || '',
        assigned_to: item.data.assigned_to,
        due_at: item.data.due_at || undefined,
        priority: item.data.priority || 'normal',
        status: 'pending',
        source_text: item.source_text,
        created_by: createdBy,
        created_at: now,
        updated_at: now,
      };
      return { type: 'task', entity };
    }

    case 'note': {
      const entity: Note = {
        id,
        section_id: sectionId,
        subject: item.data.subject,
        title: item.data.title,
        content: item.data.content,
        author: item.data.author || createdBy,
        status: 'published',
        source_text: item.source_text,
        created_at: now,
        updated_at: now,
      };
      return { type: 'note', entity };
    }

    case 'event': {
      const entity: Event = {
        id,
        section_id: sectionId,
        title: item.data.title,
        description: item.data.description,
        starts_at: item.data.starts_at,
        ends_at: item.data.ends_at,
        location: item.data.location,
        status: 'upcoming',
        source_text: item.source_text,
        created_by: createdBy,
        created_at: now,
      };
      return { type: 'event', entity };
    }

    case 'resource': {
      const entity: Resource = {
        id,
        section_id: sectionId,
        title: item.data.title,
        description: item.data.description,
        url: item.data.url,
        category: item.data.category || 'General',
        status: 'active',
        source_text: item.source_text,
        created_by: createdBy,
        created_at: now,
        updated_at: now,
      };
      return { type: 'resource', entity };
    }
  }
}
