import { PriorityLevel } from '@/types/database';

interface PriorityIndicatorProps {
  priority: PriorityLevel;
  className?: string;
  showIcon?: boolean;
}

export function PriorityIndicator({ priority, className = '', showIcon = true }: PriorityIndicatorProps) {
  const config = {
    urgent: {
      label: 'Urgent',
      textColor: 'text-rose-700',
      dotColor: 'bg-rose-600',
    },
    high: {
      label: 'High Priority',
      textColor: 'text-amber-700',
      dotColor: 'bg-amber-600',
    },
    normal: {
      label: 'Normal',
      textColor: 'text-neutral-600',
      dotColor: 'bg-neutral-400',
    },
    low: {
      label: 'Low',
      textColor: 'text-neutral-500',
      dotColor: 'bg-neutral-300',
    },
  }[priority] || {
    label: priority,
    textColor: 'text-neutral-600',
    dotColor: 'bg-neutral-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.textColor} ${className}`}>
      {showIcon && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotColor}`} aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
}
