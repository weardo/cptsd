import { getAllFeaturedPublished } from '@/lib/getFeaturedContent';
import FeaturedBrowser from './featured-browser';

export const dynamic = 'force-dynamic';

export default async function FeaturedPage() {
	const items = await getAllFeaturedPublished();
	const allTags = Array.from(
		new Set(
			items.flatMap((i: any) =>
				Array.isArray(i.tags) ? i.tags.filter((t: unknown) => typeof t === 'string') : []
			)
		)
	).sort((a, b) => a.localeCompare(b));

	return (
		<main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
			<section className="max-w-3xl">
				<h1 className="text-4xl font-bold text-on-surface">Featured & highlights</h1>
				<p className="mt-4 text-on-surface-variant">
					Curated links, art, articles, tools and resources from the community and beyond.
					These are starting points to explore — not medical advice or endorsements.
				</p>
			</section>
			<section>
				<FeaturedBrowser initialItems={items} allTags={allTags} />
			</section>
		</main>
	);
}
