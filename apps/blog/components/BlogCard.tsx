'use client';

import Link from 'next/link';
import { trackArticleClick } from '@/lib/analytics';

type BlogCardProps = {
	slug: string;
	title: string;
	excerpt?: string;
	featuredImage?: string;
	topic?: { id: string; name: string };
	publishedAt?: Date;
	readingTime?: number;
	tags?: string[];
	source?: string;
};

export default function BlogCard({
	slug,
	title,
	excerpt,
	featuredImage,
	topic,
	publishedAt,
	readingTime,
	tags,
	source,
}: BlogCardProps) {
	const handleClick = () => {
		trackArticleClick(slug, title, source || 'unknown');
	};

	return (
		<article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
			{featuredImage && (
				<Link href={`/blog/${slug}`} onClick={handleClick} className="block">
					<div className="aspect-video overflow-hidden bg-gradient-to-br from-[#9fb3a7]/20 to-[#c9a788]/20">
						<img
							src={featuredImage}
							alt={title}
							className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
							loading="lazy"
						/>
					</div>
				</Link>
			)}
			<div className="p-6">
				<div className="flex items-center gap-3 text-sm text-gray-600 mb-4 flex-wrap">
					{topic && (
						<Link
							href={`/?topic=${topic.id}`}
							className="px-3 py-1 bg-[var(--sage-green)]/20 text-[#5b8a9f] rounded-full font-medium hover:bg-[var(--sage-green)]/30 transition-colors text-xs"
						>
							{topic.name}
						</Link>
					)}
					{publishedAt && (
						<time dateTime={publishedAt.toString()} className="text-xs">
							{new Date(publishedAt).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'short',
								day: 'numeric',
							})}
						</time>
					)}
					{readingTime && <span className="text-xs">• {readingTime} min read</span>}
				</div>
				<Link href={`/blog/${slug}`} onClick={handleClick} className="block group/link">
					<h2 className="text-xl font-bold text-gray-900 mb-3 group-hover/link:text-[#5b8a9f] transition-colors leading-tight line-clamp-2">
						{title}
					</h2>
					{excerpt && (
						<p className="text-gray-600 mb-4 leading-relaxed line-clamp-3 text-sm">
							{excerpt}
						</p>
					)}
					<div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
						<span className="text-[#5b8a9f] font-semibold text-sm group-hover/link:underline">
							Read more →
						</span>
						{tags && tags.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{tags.slice(0, 2).map((tag: string, idx: number) => (
									<span
										key={idx}
										className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200"
									>
										#{tag}
									</span>
								))}
							</div>
						)}
					</div>
				</Link>
			</div>
		</article>
	);
}

