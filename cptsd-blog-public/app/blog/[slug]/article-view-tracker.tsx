'use client';

import { useEffect } from 'react';
import { trackArticleView } from '@/lib/analytics';

export default function ArticleViewTracker({ slug, title, topic }: { slug: string; title: string; topic?: string }) {
	useEffect(() => {
		trackArticleView(slug, title, topic);
	}, [slug, title, topic]);

	return null;
}

