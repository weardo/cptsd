'use client';

import { useEffect } from 'react';
import { trackStoryView } from '@/lib/analytics';

export default function StoryViewTracker({ storyId, title }: { storyId: string; title: string }) {
	useEffect(() => {
		trackStoryView(storyId, title);
	}, [storyId, title]);

	return null;
}

