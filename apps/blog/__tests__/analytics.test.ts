import {
  trackEvent,
  trackArticleView,
  trackSearch,
} from '../lib/analytics';

describe('blog analytics util', () => {
  afterEach(() => {
    delete window.gtag;
    jest.restoreAllMocks();
  });

  it('forwards events to window.gtag with the event name and params', () => {
    const gtag = jest.fn();
    window.gtag = gtag;

    trackEvent('my_event', { foo: 'bar' });

    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith(
      'event',
      'my_event',
      expect.objectContaining({ foo: 'bar' })
    );
  });

  it('does not throw when window.gtag is unavailable', () => {
    expect(window.gtag).toBeUndefined();
    expect(() => trackEvent('no_gtag_event')).not.toThrow();
  });

  it('trackArticleView emits an "article_view" event carrying the slug and title', () => {
    const gtag = jest.fn();
    window.gtag = gtag;

    trackArticleView('healing-from-cptsd', 'Healing From CPTSD', 'recovery');

    expect(gtag).toHaveBeenCalledWith(
      'event',
      'article_view',
      expect.objectContaining({
        article_slug: 'healing-from-cptsd',
        article_title: 'Healing From CPTSD',
        topic: 'recovery',
      })
    );
  });

  it('trackSearch emits a "search" event with the query as search_term', () => {
    const gtag = jest.fn();
    window.gtag = gtag;

    trackSearch('grounding techniques', 5);

    expect(gtag).toHaveBeenCalledWith(
      'event',
      'search',
      expect.objectContaining({
        search_term: 'grounding techniques',
        results_count: 5,
        source: 'blog',
      })
    );
  });
});
