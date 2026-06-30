'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackSearch, trackTopicFilter, trackPagination } from '@/lib/analytics';

export default function BlogSearchTracker() {
	const searchParams = useSearchParams();
	const search = searchParams.get('search');
	const topic = searchParams.get('topic');
	const page = searchParams.get('page');

	useEffect(() => {
		if (search && search.length > 2) {
			trackSearch(search);
		}
	}, [search]);

	useEffect(() => {
		if (topic) {
			// We'd need to fetch topic name, but for now just track the ID
			trackTopicFilter(topic, '');
		}
	}, [topic]);

	useEffect(() => {
		if (page) {
			const pageNum = parseInt(page, 10);
			if (!isNaN(pageNum) && pageNum > 1) {
				trackPagination(pageNum);
			}
		}
	}, [page]);

	return null;
}

