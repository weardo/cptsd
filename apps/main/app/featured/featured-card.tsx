'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { increment } from './featured-click';
import { trackFeaturedClick } from '@/lib/analytics';
import type { FeaturedItem } from '@/lib/getFeaturedContent';

function kindLabel(kind?: string) {
	switch (kind) {
		case 'EXTERNAL_LINK': return 'Link';
		case 'INTERNAL_ARTICLE': return 'Article';
		case 'INTERNAL_RESOURCE': return 'Resource';
		case 'ARTWORK': return 'Artwork';
		case 'BOOK': return 'Book';
		case 'COPING_TOOL': return 'Tool';
		case 'RESEARCH': return 'Research';
		default: return 'Highlight';
	}
}

function resolveTargetUrl(item: FeaturedItem): string | null {
	if (item.kind === 'EXTERNAL_LINK' && item.externalUrl) return item.externalUrl;
	if (item.kind === 'INTERNAL_ARTICLE' && item.internalArticleSlug) {
		return `/blog/${item.internalArticleSlug}`;
	}
	if (item.kind === 'INTERNAL_RESOURCE') {
		return '/resources';
	}
	return item.externalUrl || null;
}

export default function FeaturedCard({ item }: { item: FeaturedItem }) {
	const href = resolveTargetUrl(item);

	const onClick = useCallback(
		async (e: React.MouseEvent) => {
			increment(item._id).catch(() => {});
			trackFeaturedClick(item._id, item.kind || 'UNKNOWN', item.title, href || undefined);
		},
		[item, href]
	);

	return (
		<div className="bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col h-full" style={{ boxShadow: 'var(--shadow-ambient)' }}>
			{item.thumbnailUrl && (
				<img src={item.thumbnailUrl} alt="" className="w-full h-40 object-cover" />
			)}
			<div className="p-5 flex-1 flex flex-col">
				<div className="flex items-start justify-between gap-3">
					<h3 className="text-lg font-semibold text-on-surface">{item.title}</h3>
					<span className="shrink-0 inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium bg-surface-container-low text-on-surface-variant">
						{kindLabel(item.kind)}
					</span>
				</div>
				<p className="mt-2 text-sm text-on-surface-variant line-clamp-4">{item.description}</p>
				{item.creatorName && (
					<p className="mt-2 text-xs text-on-surface-variant">by {item.creatorName}</p>
				)}
				<div className="mt-4 pt-3">
					{href ? (
						<a
							href={href}
							target={href.startsWith('http') ? '_blank' : undefined}
							rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
							onClick={onClick}
							className="text-sm text-primary hover:text-primary-container font-medium"
						>
							View →
						</a>
					) : (
						<span className="text-sm text-on-surface-variant">No link available</span>
					)}
				</div>
			</div>
		</div>
	);
}
