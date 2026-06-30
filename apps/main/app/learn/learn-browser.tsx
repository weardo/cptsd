'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Input from '@/components/ui/Input';

type LearnItem = {
  id: string;
  type: string;
  title?: string;
  description?: string;
  articleSlug?: string;
  resourceUrl?: string;
  externalUrl?: string;
};

type LearnSection = {
  id: string;
  title: string;
  description?: string;
  items: LearnItem[];
};

function resolveUrl(item: LearnItem): string {
  if (item.type === 'ARTICLE' && item.articleSlug) return `/learn/${item.articleSlug}`;
  if (item.type === 'RESOURCE' && item.resourceUrl) return item.resourceUrl;
  if (item.type === 'EXTERNAL_LINK' && item.externalUrl) return item.externalUrl;
  return '#';
}

function typeLabel(type: string): string {
  if (type === 'RESOURCE') return 'Resource';
  if (type === 'EXTERNAL_LINK') return 'External';
  return '';
}

export default function LearnBrowser({ sections }: { sections: LearnSection[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const text = `${item.title ?? ''} ${item.description ?? ''}`.toLowerCase();
          return text.includes(q);
        }),
      }))
      .filter(
        (section) =>
          section.title.toLowerCase().includes(q) ||
          (section.description ?? '').toLowerCase().includes(q) ||
          section.items.length > 0,
      );
  }, [query, sections]);

  const noMatches = query.trim().length > 0 && filtered.length === 0;

  return (
    <div className="space-y-10">
      {/* Search */}
      <div className="bg-surface-container-lowest rounded-xl p-4" style={{ boxShadow: 'var(--shadow-ambient)' }}>
        <Input
          label="Search articles and resources"
          placeholder="e.g. emotional neglect, healing, relationships…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {noMatches && (
        <div className="bg-surface-container-low rounded-xl p-6">
          <p className="text-on-surface">
            No content matched your search. Try different keywords or{' '}
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-primary hover:text-primary-container font-medium"
            >
              clear the search
            </button>
            .
          </p>
        </div>
      )}

      {!noMatches && (
        <div className="space-y-12">
          {filtered.map((section) => (
            <section key={section.id} className="bg-surface-container-lowest rounded-xl p-8" style={{ boxShadow: 'var(--shadow-ambient)' }}>
              <h2 className="text-2xl font-bold text-on-surface mb-2">{section.title}</h2>
              {section.description && (
                <p className="text-on-surface-variant mb-6">{section.description}</p>
              )}
              {section.items.length > 0 ? (
                <ul className="space-y-6">
                  {section.items.map((item) => {
                    const url = resolveUrl(item);
                    const label = typeLabel(item.type);
                    const isExternal = item.type !== 'ARTICLE';
                    return (
                      <li key={item.id}>
                        {isExternal ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary text-lg hover:text-primary-container"
                          >
                            {item.title || 'Untitled'}
                            {label && (
                              <span className="text-xs text-on-surface-variant ml-2">({label})</span>
                            )}
                          </a>
                        ) : (
                          <Link href={url} className="font-medium text-primary text-lg hover:text-primary-container">
                            {item.title || 'Untitled'}
                          </Link>
                        )}
                        {item.description && (
                          <p className="text-on-surface-variant text-sm mt-1">{item.description}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-on-surface-variant italic">
                  No items in this section yet.
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
