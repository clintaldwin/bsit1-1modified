import React, { useState, useMemo } from 'react';
import { FolderGit2, ExternalLink, Link as LinkIcon, Filter } from 'lucide-react';
import { Resource } from '@/types/database';
import { EmptyState } from '../common/EmptyState';

interface ResourcesViewProps {
  resources: Resource[];
}

export function ResourcesView({ resources }: ResourcesViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources
      .filter((r) => r.status === 'active')
      .filter((r) => {
        if (selectedCategory === 'all') return true;
        return r.category === selectedCategory;
      });
  }, [resources, selectedCategory]);

  return (
    <div className="space-y-6 pb-20 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Section Resources & Drives
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Cloud drives, lecture decks, templates, and syllabus links
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 p-3 bg-white border border-neutral-200 rounded-xl overflow-x-auto scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-neutral-900 text-white font-medium'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-neutral-900 text-white font-medium'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Resources */}
      {filteredResources.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No resources found"
          description="There are no active resource links in this category."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((res) => (
            <div
              key={res.id}
              className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-2xl p-5 transition-all shadow-xs flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                    {res.category || 'Reference'}
                  </span>
                  {res.url && (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-neutral-900 leading-snug">
                  {res.title}
                </h3>

                {res.description && (
                  <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                    {res.description}
                  </p>
                )}
              </div>

              {res.url && (
                <div className="pt-3 mt-4 border-t border-neutral-100">
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-600 hover:underline truncate max-w-full"
                  >
                    <LinkIcon className="w-3 h-3 shrink-0" />
                    <span className="truncate">{res.url}</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
