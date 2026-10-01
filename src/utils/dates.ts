/**
 * Section Lobby - Deadline Intelligence & Date Formatting Utilities
 */

export interface DeadlineInfo {
  relativeLabel: string;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueTomorrow: boolean;
  isUrgentSoon: boolean; // within 48 hours
  formattedDate: string;
  formattedTime: string;
  fullReadable: string;
  diffDays: number;
  diffHours: number;
}

export function parseDateSafe(dateInput: string | Date | undefined): Date | null {
  if (!dateInput) return null;
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return isNaN(d.getTime()) ? null : d;
}

export function calculateDeadlineInfo(dueAtString: string | undefined): DeadlineInfo {
  if (!dueAtString) {
    return {
      relativeLabel: 'No deadline',
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      isUrgentSoon: false,
      formattedDate: '—',
      formattedTime: '',
      fullReadable: 'No deadline specified',
      diffDays: 999,
      diffHours: 9999,
    };
  }

  const dueDate = parseDateSafe(dueAtString);
  if (!dueDate) {
    return {
      relativeLabel: 'Invalid date',
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      isUrgentSoon: false,
      formattedDate: dueAtString,
      formattedTime: '',
      fullReadable: dueAtString,
      diffDays: 0,
      diffHours: 0,
    };
  }

  const now = new Date();
  
  // Formatters
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: dueDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
  
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const formattedDate = dateFormatter.format(dueDate);
  const formattedTime = timeFormatter.format(dueDate);
  const fullReadable = `${formattedDate} at ${formattedTime}`;

  // Time diff calculations
  const diffMs = dueDate.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Calendar day comparisons
  const isToday = 
    dueDate.getDate() === now.getDate() &&
    dueDate.getMonth() === now.getMonth() &&
    dueDate.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    dueDate.getDate() === tomorrow.getDate() &&
    dueDate.getMonth() === tomorrow.getMonth() &&
    dueDate.getFullYear() === tomorrow.getFullYear();

  const isOverdue = diffMs < 0 && !isToday; // If today but past minute, consider urgent today
  const isDueToday = isToday;
  const isDueTomorrow = isTomorrow;
  const isUrgentSoon = diffHours > 0 && diffHours <= 48;

  let relativeLabel = '';

  if (isOverdue) {
    const overdueDays = Math.abs(diffDays);
    relativeLabel = overdueDays <= 1 ? 'Overdue yesterday' : `Overdue by ${overdueDays} days`;
  } else if (isDueToday) {
    relativeLabel = `Due today · ${formattedTime}`;
  } else if (isDueTomorrow) {
    relativeLabel = `Due tomorrow · ${formattedTime}`;
  } else if (diffDays > 0 && diffDays <= 6) {
    const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(dueDate);
    relativeLabel = `Due ${weekday} (in ${diffDays} days)`;
  } else if (diffDays > 6) {
    relativeLabel = `Due ${formattedDate}`;
  } else {
    relativeLabel = `Due today · ${formattedTime}`;
  }

  return {
    relativeLabel,
    isOverdue,
    isDueToday,
    isDueTomorrow,
    isUrgentSoon,
    formattedDate,
    formattedTime,
    fullReadable,
    diffDays,
    diffHours,
  };
}

export function formatEventDateTime(startsAt: string, endsAt?: string): string {
  const start = parseDateSafe(startsAt);
  if (!start) return startsAt;

  const dateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(start);

  const startTimeStr = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(start);

  if (endsAt) {
    const end = parseDateSafe(endsAt);
    if (end) {
      const endTimeStr = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(end);
      return `${dateStr} · ${startTimeStr} – ${endTimeStr}`;
    }
  }

  return `${dateStr} · ${startTimeStr}`;
}

export function formatPublishedDate(dateString: string): string {
  const d = parseDateSafe(dateString);
  if (!d) return dateString;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d);
}
