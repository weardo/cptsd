'use client';

import { useMemo, useState, useEffect } from 'react';
import { trackSearch, trackFilter, trackResourceClick } from '@/lib/analytics';
import type { ResourceDoc } from '@/lib/getAllResources';

type Props = {
	initialResources: ResourceDoc[];
	allTags: string[];
};

const TYPE_LABELS: Record<string, string> = {
	HELPLINE: 'Helpline',
	THERAPY_DIRECTORY: 'Therapy directory',
	NGO: 'NGO',
	EDUCATIONAL_SITE: 'Educational',
	COMMUNITY: 'Community',
	BOOK: 'Book',
};

const TYPE_TABS: { key: string; label: string; includes: string[] }[] = [
	{ key: 'ALL', label: 'All', includes: [] },
	{ key: 'HELP', label: 'Helplines', includes: ['HELPLINE'] },
	{ key: 'THERAPY', label: 'Therapy / NGOs', includes: ['THERAPY_DIRECTORY', 'NGO'] },
	{ key: 'EDU', label: 'Educational', includes: ['EDUCATIONAL_SITE', 'BOOK'] },
	{ key: 'COMMUNITY', label: 'Communities', includes: ['COMMUNITY'] },
];

function normalize(text: string) {
	return text.toLowerCase();
}

export default function ResourcesBrowser({ initialResources, allTags }: Props) {
	const [query, setQuery] = useState('');
	const [selectedTab, setSelectedTab] = useState<string>('ALL');
	const [selectedTag, setSelectedTag] = useState<string | null>(null);

	const filtered = useMemo(() => {
		const q = normalize(query.trim());
		const includes = TYPE_TABS.find((t) => t.key === selectedTab)?.includes ?? [];
		return initialResources.filter((r) => {
			// type gate
			if (includes.length > 0 && !includes.includes(r.type)) return false;
			// tag gate
			if (selectedTag) {
				if (!Array.isArray(r.tags) || !r.tags.includes(selectedTag)) return false;
			}
			// text gate
			if (q.length > 0) {
				const hay =
					(r.title || '') +
					' ' +
					(r.description || '') +
					' ' +
					(r.region || '') +
					' ' +
					(Array.isArray(r.languages) ? r.languages.join(' ') : '') +
					' ' +
					(Array.isArray(r.tags) ? r.tags.join(' ') : '');
				if (!normalize(hay).includes(q)) return false;
			}
			return true;
		});
	}, [initialResources, query, selectedTab, selectedTag]);

	// Track search queries (debounced)
	useEffect(() => {
		if (query.trim().length > 2) {
			const timer = setTimeout(() => {
				trackSearch(query, filtered.length, 'resources');
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [query, filtered.length]);

	// Track filter changes
	useEffect(() => {
		if (selectedTab !== 'ALL') {
			trackFilter('type_tab', selectedTab);
		}
	}, [selectedTab]);

	useEffect(() => {
		if (selectedTag) {
			trackFilter('tag', selectedTag);
		}
	}, [selectedTag]);

	const groups = useMemo(() => {
		// Recommended high-level grouping for readability
		const buckets: Record<
			string,
			{ title: string; description?: string; items: ResourceDoc[]; order: number }
		> = {
			FIND_HELP: {
				title: 'Finding direct help',
				description:
					'Directories, NGOs and helplines you can explore to reach services. This is not an endorsement.',
				items: [],
				order: 1,
			},
			UNDERSTAND: {
				title: 'Understanding trauma and CPTSD',
				description:
					'Educational websites and some books that explain trauma, PTSD and complex PTSD (CPTSD).',
				items: [],
				order: 2,
			},
			SELF_HELP: {
				title: 'Self‑help and workbooks',
				description:
					'Gentle self-help materials and workbook-style resources. Always go at your own pace.',
				items: [],
				order: 3,
			},
			COMMUNITIES: {
				title: 'Peer communities',
				description:
					'Online communities can be validating but may contain triggering content. Not a replacement for therapy.',
				items: [],
				order: 4,
			},
		};

		for (const r of filtered) {
			const tags = Array.isArray(r.tags) ? r.tags : [];
			if (r.type === 'HELPLINE' || r.type === 'THERAPY_DIRECTORY' || r.type === 'NGO') {
				buckets.FIND_HELP.items.push(r);
			} else if (r.type === 'COMMUNITY') {
				buckets.COMMUNITIES.items.push(r);
			} else if (r.type === 'EDUCATIONAL_SITE') {
				// educational site goes to understanding unless tagged self-help
				if (tags.includes('self-help')) buckets.SELF_HELP.items.push(r);
				else buckets.UNDERSTAND.items.push(r);
			} else if (r.type === 'BOOK') {
				// book to self-help if tagged accordingly, else understanding
				if (tags.includes('self-help') || tags.includes('workbook'))
					buckets.SELF_HELP.items.push(r);
				else buckets.UNDERSTAND.items.push(r);
			}
		}

		return Object.values(buckets)
			.map((b) => ({ ...b, items: b.items.sort((a, b) => a.title.localeCompare(b.title)) }))
			.sort((a, b) => a.order - b.order);
	}, [filtered]);

	const noData = initialResources.length === 0;
	const noMatches = !noData && filtered.length === 0;

	return (
		<div className="space-y-8">
			{/* Filter Bar */}
			<div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
				<div className="flex flex-col md:flex-row md:items-center gap-3">
					<div className="flex-1">
						<label htmlFor="q" className="sr-only">
							Search resources
						</label>
						<input
							id="q"
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by title, description, tags, region…"
							className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div className="flex flex-wrap gap-2">
						{TYPE_TABS.map((t) => (
							<button
								key={t.key}
								type="button"
								onClick={() => setSelectedTab(t.key)}
								className={`px-3 py-1.5 rounded-full text-sm border ${
									selectedTab === t.key
										? 'bg-blue-600 text-white border-blue-600'
										: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
								}`}
								aria-pressed={selectedTab === t.key}
							>
								{t.label}
							</button>
						))}
					</div>
				</div>
				{/* Tag pills */}
				{allTags.length > 0 && (
					<div className="mt-3 flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => setSelectedTag(null)}
							className={`px-2.5 py-1 rounded-full text-xs border ${
								selectedTag == null
									? 'bg-gray-800 text-white border-gray-800'
									: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
							}`}
						>
							All tags
						</button>
						{allTags.map((tag) => (
							<button
								key={tag}
								type="button"
								onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
								className={`px-2.5 py-1 rounded-full text-xs border ${
									selectedTag === tag
										? 'bg-gray-900 text-white border-gray-900'
										: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
								}`}
								aria-pressed={selectedTag === tag}
							>
								#{tag}
							</button>
						))}
					</div>
				)}
			</div>

			{/* Empty states */}
			{noData && (
				<div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
					<p className="text-gray-700">
						We are still building this resource library. In the meantime, you can search for
						“mental health helpline India” or “trauma-informed therapist India” online, and
						always verify that the source is reputable and current.
					</p>
				</div>
			)}
			{noMatches && (
				<div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
					<p className="text-gray-700">
						No resources matched your filters. Try clearing filters or changing your search terms.
					</p>
				</div>
			)}

			{/* Grouped sections */}
			{!noData && !noMatches && (
				<div className="space-y-12">
					{groups.map((group) => (
						<section key={group.title} aria-label={group.title} className="space-y-4">
							<header>
								<h2 className="text-2xl font-bold text-gray-900">{group.title}</h2>
								{group.description && (
									<p className="text-sm text-gray-700 mt-1">{group.description}</p>
								)}
							</header>
							<ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{group.items.map((r) => (
									<li key={r._id} role="listitem">
										<ResourceCard resource={r} />
									</li>
								))}
							</ul>
						</section>
					))}
				</div>
			)}
		</div>
	);
}

function ResourceCard({ resource }: { resource: ResourceDoc }) {
	const handleClick = () => {
		if (resource.url) {
			trackResourceClick(resource._id, resource.type, resource.title, resource.url);
		}
	};

	return (
		<div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
				<span className="shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
					{TYPE_LABELS[resource.type] ?? resource.type}
				</span>
			</div>
			<p className="mt-2 text-sm text-gray-700 line-clamp-5">{resource.description}</p>
			<div className="mt-3 space-y-1 text-xs text-gray-600">
				{resource.region && <div>Region: {resource.region}</div>}
				{resource.languages && resource.languages.length > 0 && (
					<div>Languages: {resource.languages.join(', ')}</div>
				)}
				{resource.phone && <div>📞 {resource.phone}</div>}
			</div>
			<div className="mt-4 pt-3 border-t border-gray-100">
				{resource.url ? (
					<a
						href={resource.url}
						target="_blank"
						rel="noopener noreferrer"
						onClick={handleClick}
						className="text-sm text-blue-600 hover:text-blue-700 font-medium"
					>
						Visit website →
					</a>
				) : (
					<span className="text-sm text-gray-500">No website available</span>
				)}
			</div>
			{resource.tags && resource.tags.length > 0 && (
				<div className="mt-3 flex flex-wrap gap-1.5">
					{resource.tags.slice(0, 6).map((tag) => (
						<span
							key={tag}
							className="inline-flex items-center rounded px-2 py-0.5 text-[11px] bg-gray-100 text-gray-700 border border-gray-200"
						>
							#{tag}
						</span>
					))}
				</div>
			)}
		</div>
	);
}


