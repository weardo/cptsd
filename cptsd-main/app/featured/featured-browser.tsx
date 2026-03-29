'use client';

import { useMemo, useState, useEffect } from 'react';
import FeaturedCard from './featured-card';
import { trackSearch, trackFilter } from '@/lib/analytics';
import type { FeaturedItem, FeaturedKind } from '@/lib/getFeaturedContent';

type Props = {
	initialItems: FeaturedItem[];
	allTags: string[];
};

const KIND_TABS: { key: 'ALL' | FeaturedKind; label: string }[] = [
	{ key: 'ALL', label: 'All' },
	{ key: 'INTERNAL_ARTICLE', label: 'Articles' },
	{ key: 'EXTERNAL_LINK', label: 'Links' },
	{ key: 'ARTWORK', label: 'Art' },
	{ key: 'BOOK', label: 'Books' },
	{ key: 'COPING_TOOL', label: 'Tools' },
	{ key: 'RESEARCH', label: 'Research' },
	{ key: 'INTERNAL_RESOURCE', label: 'Resources' },
];

export default function FeaturedBrowser({ initialItems, allTags }: Props) {
	const [query, setQuery] = useState('');
	const [kind, setKind] = useState<'ALL' | FeaturedKind>('ALL');
	const [tag, setTag] = useState<string | null>(null);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return initialItems.filter((i) => {
			if (kind !== 'ALL' && i.kind !== kind) return false;
			if (tag && !(i.tags || []).includes(tag)) return false;
			if (q.length > 0) {
				const hay =
					(i.title || '') +
					' ' +
					(i.description || '') +
					' ' +
					(i.creatorName || '') +
					' ' +
					((i.tags || []).join(' '));
				if (!hay.toLowerCase().includes(q)) return false;
			}
			return true;
		});
	}, [initialItems, kind, tag, query]);

	useEffect(() => {
		if (query.trim().length > 2) {
			const timer = setTimeout(() => {
				trackSearch(query, filtered.length, 'featured');
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [query, filtered.length]);

	useEffect(() => {
		if (kind !== 'ALL') {
			trackFilter('kind', kind);
		}
	}, [kind]);

	useEffect(() => {
		if (tag) {
			trackFilter('tag', tag);
		}
	}, [tag]);

	const noData = initialItems.length === 0;
	const noMatches = !noData && filtered.length === 0;

	return (
		<div className="space-y-8">
			<div className="bg-surface-container-lowest rounded-xl p-4" style={{ boxShadow: 'var(--shadow-ambient)' }}>
				<div className="flex flex-col md:flex-row md:items-center gap-3">
					<div className="flex-1">
						<label htmlFor="q" className="sr-only">
							Search featured content
						</label>
						<input
							id="q"
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by title, description, tags…"
							className="w-full rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface outline outline-1 outline-outline-variant/15 focus:outline-2 focus:outline-primary placeholder:text-on-surface-variant/50"
						/>
					</div>
					<div className="flex flex-wrap gap-2">
						{KIND_TABS.map((t) => (
							<button
								key={t.key}
								type="button"
								onClick={() => setKind(t.key)}
								className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
									kind === t.key
										? 'bg-primary text-white'
										: 'bg-surface-container-low text-on-surface-variant hover:bg-surface-variant'
								}`}
								aria-pressed={kind === t.key}
							>
								{t.label}
							</button>
						))}
					</div>
				</div>
				{allTags.length > 0 && (
					<div className="mt-3 flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => setTag(null)}
							className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
								tag == null
									? 'bg-primary text-white'
									: 'bg-surface-container-low text-on-surface-variant hover:bg-surface-variant'
							}`}
						>
							All tags
						</button>
						{allTags.map((t) => (
							<button
								key={t}
								type="button"
								onClick={() => setTag(t === tag ? null : t)}
								className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
									tag === t
										? 'bg-primary text-white'
										: 'bg-surface-container-low text-on-surface-variant hover:bg-surface-variant'
								}`}
								aria-pressed={tag === t}
							>
								#{t}
							</button>
						))}
					</div>
				)}
			</div>

			{noData && (
				<div className="bg-surface-container-low rounded-xl p-6">
					<p className="text-on-surface">
						We're setting up our featured content library. Check back soon.
					</p>
				</div>
			)}
			{noMatches && (
				<div className="bg-surface-container-low rounded-xl p-6">
					<p className="text-on-surface">
						No items matched your filters. Try clearing filters or changing your search terms.
					</p>
				</div>
			)}

			{!noData && !noMatches && (
				<ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{filtered.map((item) => (
						<li key={item._id} role="listitem">
							<FeaturedCard item={item} />
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
