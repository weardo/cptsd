'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { increment } from './featured-click';
import { trackFeaturedClick } from '@/lib/analytics';
import type { FeaturedItem } from '@/lib/getFeaturedContent';

const BLOG_BASE = process.env.NEXT_PUBLIC_BLOG_DOMAIN || 'https://blog.cptsd.in';

function kindLabel(kind?: string) {
	switch (kind) {
		case 'EXTERNAL_LINK':
			return 'Link';
		case 'INTERNAL_ARTICLE':
			return 'Article';
		case 'INTERNAL_RESOURCE':
			return 'Resource';
		case 'ARTWORK':
			return 'Artwork';
		case 'BOOK':
			return 'Book';
		case 'COPING_TOOL':
			return 'Tool';
		case 'RESEARCH':
			return 'Research';
		default:
			return 'Highlight';
	}
}

function resolveTargetUrl(item: FeaturedItem): string | null {
	if (item.kind === 'EXTERNAL_LINK' && item.externalUrl) return item.externalUrl;
	if (item.kind === 'INTERNAL_ARTICLE' && item.internalArticleSlug) {
		// Check if article is a learn resource - if so, use /learn route, otherwise use blog domain
		// Note: We'd need to fetch the article to check isLearnResource, but for now we'll use the blog domain
		// This will be handled by the actual article page routing
		return `${BLOG_BASE}/${item.internalArticleSlug}`;
	}
	if (item.kind === 'INTERNAL_RESOURCE') {
		// Basic mapping to sections. Could add ?focus=<id> later.
		return '/resources';
	}
	return item.externalUrl || null;
}

export default function FeaturedCard({ item }: { item: FeaturedItem }) {
	const href = resolveTargetUrl(item);

	const onClick = useCallback(
		async (e: React.MouseEvent) => {
			// Fire-and-forget click tracking
			increment(item._id).catch(() => {});
			// Track GA event
			trackFeaturedClick(item._id, item.kind || 'UNKNOWN', item.title, href || undefined);
			// If no href or external link, let default behavior proceed
		},
		[item, href]
	);

	return (
		<div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col h-full">
			{item.thumbnailUrl && (
				<img src={item.thumbnailUrl} alt="" className="w-full h-40 object-cover" />
			)}
			<div className="p-5 flex-1 flex flex-col">
				<div className="flex items-start justify-between gap-3">
					<h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
					<span className="shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
						{kindLabel(item.kind)}
					</span>
				</div>
				<p className="mt-2 text-sm text-gray-700 line-clamp-4">{item.description}</p>
				{item.creatorName && (
					<p className="mt-2 text-xs text-gray-600">by {item.creatorName}</p>
				)}
				<div className="mt-4 pt-3 border-t border-gray-100">
					{href ? (
						<a
							href={href}
							target={href.startsWith('http') ? '_blank' : undefined}
							rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
							onClick={onClick}
							className="text-sm text-blue-600 hover:text-blue-700 font-medium"
						>
							View →
						</a>
					) : (
						<span className="text-sm text-gray-500">No link available</span>
					)}
				</div>
			</div>
		</div>
	);
}


