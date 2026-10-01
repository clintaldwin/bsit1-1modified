import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`p-8 text-center border border-dashed border-neutral-300 rounded-xl bg-neutral-50/50 ${className}`}>
      {Icon && (
        <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center rounded-lg bg-neutral-200/60 text-neutral-600">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <h4 className="text-sm font-semibold text-neutral-900 mb-1">{title}</h4>
      <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-3.5 py-1.5 text-xs font-medium text-neutral-900 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 hover:border-neutral-400 transition-colors shadow-xs active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
