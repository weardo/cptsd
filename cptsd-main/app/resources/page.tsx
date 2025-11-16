import { getAllResources } from '@/lib/getAllResources';
import ResourcesBrowser from './resources-browser';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
	const resources = await getAllResources();

	const allTags = Array.from(
		new Set(
			resources.flatMap((r) =>
				Array.isArray(r.tags) ? r.tags.filter((t: unknown) => typeof t === 'string') : []
			)
		)
	).sort((a, b) => a.localeCompare(b));

	return (
		<main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
			<section className="max-w-3xl">
				<h1 className="text-4xl font-bold text-gray-900">Resources library</h1>
				<p className="mt-4 text-gray-700 leading-relaxed">
					This page collects helplines, therapy directories, NGOs, educational websites, books and
					online communities related to trauma, PTSD and complex PTSD (CPTSD). CPTSD.in does not run
					these services or guarantee their quality. We share them as starting points so you can
					explore options and decide what feels right for you.
				</p>
				<div className="mt-4 bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
					<p className="text-sm text-amber-900">
						Information (phone numbers, links, availability) can change. Always check the official
						website or organisation for the most current details.
					</p>
				</div>
				<p className="mt-4 text-sm text-gray-700">
					If you are looking for <strong>immediate emotional support or helplines in India</strong>,
					please see our{' '}
					<a href="/support" className="text-blue-600 hover:text-blue-700 underline">
						Support page
					</a>
					.
				</p>
			</section>

			<section>
				<ResourcesBrowser initialResources={resources} allTags={allTags} />
			</section>
		</main>
	);
}


