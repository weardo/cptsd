'use client';

/**
 * Google Analytics 4 event tracking utility
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
				send_to: undefined, // Let GA handle routing
			});
		}
	} catch (error) {
		// Silently fail - analytics should never break the app
		console.debug('GA event tracking failed:', error);
	}
}

/**
 * Track page view (usually handled automatically, but useful for SPA navigation)
 */
export function trackPageView(path: string, title?: string): void {
	trackEvent('page_view', {
		page_path: path,
		page_title: title,
	});
}

/**
 * Track featured content click
 */
export function trackFeaturedClick(
	contentId: string,
	kind: string,
	title: string,
	url?: string
): void {
	trackEvent('featured_content_click', {
		content_id: contentId,
		content_kind: kind,
		content_title: title,
		content_url: url,
	});
}

/**
 * Track resource click
 */
export function trackResourceClick(
	resourceId: string,
	resourceType: string,
	title: string,
	url?: string
): void {
	trackEvent('resource_click', {
		resource_id: resourceId,
		resource_type: resourceType,
		resource_title: title,
		resource_url: url,
	});
}

/**
 * Track story view
 */
export function trackStoryView(storyId: string, title: string): void {
	trackEvent('story_view', {
		story_id: storyId,
		story_title: title,
	});
}

/**
 * Track story submission
 */
export function trackStorySubmit(): void {
	trackEvent('story_submit', {
		event_category: 'engagement',
	});
}

/**
 * Track search query
 */
export function trackSearch(query: string, resultsCount?: number, source?: string): void {
	trackEvent('search', {
		search_term: query,
		results_count: resultsCount,
		source: source || 'main',
	});
}

/**
 * Track navigation click
 */
export function trackNavigation(destination: string, linkText?: string): void {
	trackEvent('navigation_click', {
		destination: destination,
		link_text: linkText,
	});
}

/**
 * Track form submission
 */
export function trackFormSubmit(formName: string, success: boolean): void {
	trackEvent('form_submit', {
		form_name: formName,
		success: success,
	});
}

/**
 * Track external link click
 */
export function trackExternalLink(url: string, linkText?: string): void {
	trackEvent('external_link_click', {
		link_url: url,
		link_text: linkText,
	});
}

/**
 * Track filter usage
 */
export function trackFilter(filterType: string, filterValue: string): void {
	trackEvent('filter_used', {
		filter_type: filterType,
		filter_value: filterValue,
	});
}

/**
 * Track button click
 */
export function trackButtonClick(buttonName: string, location?: string): void {
	trackEvent('button_click', {
		button_name: buttonName,
		location: location,
	});
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
 * Track topic filter
 */
export function trackTopicFilter(topicId: string, topicName: string): void {
	trackEvent('topic_filter', {
		topic_id: topicId,
		topic_name: topicName,
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

