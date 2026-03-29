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
		<article className="bg-surface-container-lowest rounded-xl overflow-hidden hover:bg-surface-variant transition-colors duration-300 group" style={{ boxShadow: 'var(--shadow-ambient)' }}>
			{featuredImage && (
				<Link href={`/blog/${slug}`} onClick={handleClick} className="block no-underline">
					<div className="aspect-video overflow-hidden bg-surface-container-low">
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
				<div className="flex items-center gap-3 text-sm text-on-surface-variant mb-6 flex-wrap">
					{topic && (
						<Link
							href={`/blog?topic=${topic.id}`}
							className="px-3 py-1 bg-surface-container-low text-primary rounded-full font-medium hover:bg-surface-variant transition-colors text-xs no-underline"
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
				<Link href={`/blog/${slug}`} onClick={handleClick} className="block group/link no-underline">
					<h2 className="text-xl font-bold text-on-surface mb-3 group-hover/link:text-primary transition-colors leading-tight line-clamp-2">
						{title}
					</h2>
					{excerpt && (
						<p className="text-on-surface-variant mb-6 leading-relaxed line-clamp-3 text-sm">
							{excerpt}
						</p>
					)}
					<div className="flex items-center justify-between mt-4 pt-4">
						<span className="text-primary font-semibold text-sm group-hover/link:underline">
							Read more →
						</span>
						{tags && tags.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{tags.slice(0, 2).map((tag: string, idx: number) => (
									<span
										key={idx}
										className="px-2 py-1 text-xs bg-surface-container-low text-on-surface-variant rounded-lg"
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
