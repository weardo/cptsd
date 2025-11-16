'use client';

/**
 * Google Analytics 4 event tracking utility for blog
 * All events are fire-and-forget and won't break if GA is unavailable
 */

declare global {
	interface Window {
		gtag?: (
			command: 'config' | 'event' | 'set',
			targetId: string | Date,
			config?: Record<string, any>
		) => void;
		dataLayer?: any[];
	}
}

/**
 * Track a custom event
 */
export function trackEvent(
	eventName: string,
	params?: Record<string, any>
): void {
	if (typeof window === 'undefined') return;
	
	try {
		if (window.gtag) {
			window.gtag('event', eventName, {
				...params,
				send_to: undefined,
			});
		}
	} catch (error) {
		console.debug('GA event tracking failed:', error);
	}
}

/**
 * Track article view
 */
export function trackArticleView(slug: string, title: string, topic?: string): void {
	trackEvent('article_view', {
		article_slug: slug,
		article_title: title,
		topic: topic,
	});
}

/**
 * Track article click (from list/home)
 */
export function trackArticleClick(slug: string, title: string, source?: string): void {
	trackEvent('article_click', {
		article_slug: slug,
		article_title: title,
		source: source || 'unknown',
	});
}

/**
 * Track search query
 */
export function trackSearch(query: string, resultsCount?: number): void {
	trackEvent('search', {
		search_term: query,
		results_count: resultsCount,
		source: 'blog',
	});
}

/**
 * Track topic filter
 */
export function trackTopicFilter(topicId: string, topicName: string): void {
	trackEvent('topic_filter', {
		topic_id: topicId,
		topic_name: topicName,
	});
}

/**
 * Track navigation click
 */
export function trackNavigation(destination: string, linkText?: string): void {
	trackEvent('navigation_click', {
		destination: destination,
		link_text: linkText,
		source: 'blog',
	});
}

/**
 * Track pagination
 */
export function trackPagination(page: number, source?: string): void {
	trackEvent('pagination', {
		page: page,
		source: source || 'blog',
	});
}

/**
 * Track external link click
 */
export function trackExternalLink(url: string, linkText?: string): void {
	trackEvent('external_link_click', {
		link_url: url,
		link_text: linkText,
		source: 'blog',
	});
}

/**
 * Track time on page (call when user leaves)
 */
export function trackTimeOnPage(path: string, timeInSeconds: number): void {
	trackEvent('time_on_page', {
		page_path: path,
		time_seconds: timeInSeconds,
	});
}

