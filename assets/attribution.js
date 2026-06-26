(function () {
  if (window.FTFAttribution) {
    window.FTFAttribution.captureFromLocation?.();
    return;
  }

  const API_BASE_URL = 'https://food-truck-growth-agent-xmel35gaya-uc.a.run.app';
  const STORAGE_KEY = 'ftf.attribution.context';
  const SESSION_KEY = 'ftf.attribution.sessionId';
  const LAST_EVENT_PREFIX = 'ftf.attribution.lastEvent.';
  const ATTRIBUTION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
  const SLUG_PARAM_NAMES = [
    'ftf_attribution_slug',
    'tracking_slug',
    'attribution_slug',
    'campaign_slug',
    'ftf_slug',
    'slug',
  ];

  function safeUrl(value) {
    try {
      return new URL(value, window.location.origin);
    } catch {
      return null;
    }
  }

  function normalizeSlug(value) {
    return String(value || '').trim();
  }

  function slugFromParams(params) {
    for (const name of SLUG_PARAM_NAMES) {
      const slug = normalizeSlug(params.get(name));
      if (slug) return slug;
    }

    const nested = params.get('url') || params.get('link') || '';
    return nested ? resolveSlug(nested) : '';
  }

  function resolveSlug(value) {
    const raw = normalizeSlug(value);
    if (!raw) return '';

    const parsed = safeUrl(raw);
    if (parsed) {
      const querySlug = slugFromParams(parsed.searchParams);
      if (querySlug) return querySlug;

      const parts = parsed.pathname.split('/').filter(Boolean);
      const redirectIndex = parts.findIndex((part) => part.toLowerCase() === 'r');
      if (redirectIndex !== -1) {
        return decodeURIComponent(parts[redirectIndex + 1] || '').trim();
      }
    }

    return '';
  }

  function readContext() {
    try {
      const context = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (!context || !context.slug || Number(context.expiresAt || 0) <= Date.now()) {
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return context;
    } catch {
      return null;
    }
  }

  function writeContext(slug, sourceUrl) {
    if (!slug) return null;
    const now = Date.now();
    const context = {
      slug,
      sourceUrl,
      capturedAt: now,
      expiresAt: now + ATTRIBUTION_WINDOW_MS,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    } catch {
      return context;
    }
    return context;
  }

  function captureFromLocation() {
    const slug = resolveSlug(window.location.href);
    return slug ? writeContext(slug, window.location.href) : readContext();
  }

  function sessionId() {
    try {
      const existing = window.localStorage.getItem(SESSION_KEY);
      if (existing) return existing;
      const next = 'web-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
      window.localStorage.setItem(SESSION_KEY, next);
      return next;
    } catch {
      return 'web-' + Date.now();
    }
  }

  function eventRecentlySent(slug, eventType, dedupeKey, dedupeWindowMs) {
    if (!dedupeWindowMs) return false;
    try {
      const key = LAST_EVENT_PREFIX + slug + '.' + eventType + '.' + dedupeKey;
      const lastSentAt = Number(window.localStorage.getItem(key) || 0);
      return lastSentAt > 0 && Date.now() - lastSentAt < dedupeWindowMs;
    } catch {
      return false;
    }
  }

  function markEventSent(slug, eventType, dedupeKey) {
    try {
      window.localStorage.setItem(
        LAST_EVENT_PREFIX + slug + '.' + eventType + '.' + dedupeKey,
        String(Date.now())
      );
    } catch {
      // Ignore blocked storage.
    }
  }

  async function track(eventType, options) {
    const context = readContext();
    if (!context) return false;

    const safeOptions = options || {};
    const dedupeKey = safeOptions.dedupeKey || safeOptions.truckId || 'default';
    if (eventRecentlySent(context.slug, eventType, dedupeKey, safeOptions.dedupeWindowMs)) {
      return false;
    }

    try {
      const response = await fetch(API_BASE_URL + '/events/attribution', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: context.slug,
          event_type: eventType,
          session_id: sessionId(),
          platform: 'web',
          city: safeOptions.city,
          truck_id: safeOptions.truckId,
          metadata: Object.assign({
            page_url: window.location.href,
            source_url: context.sourceUrl,
          }, safeOptions.metadata || {}),
        }),
      });

      if (response.status === 404) {
        window.localStorage.removeItem(STORAGE_KEY);
        return false;
      }

      if (!response.ok) return false;
      markEventSent(context.slug, eventType, dedupeKey);
      return true;
    } catch {
      return false;
    }
  }

  function decorateUrl(value, extraParams) {
    const context = readContext();
    if (!context) return value;

    const parsed = safeUrl(value);
    if (!parsed) return value;

    parsed.searchParams.set('ftf_attribution_slug', context.slug);
    parsed.searchParams.set('tracking_slug', context.slug);
    Object.entries(extraParams || {}).forEach(([key, item]) => {
      if (item !== undefined && item !== null && String(item).trim()) {
        parsed.searchParams.set(key, String(item));
      }
    });
    return parsed.toString();
  }

  function decorateLinks(selector) {
    document.querySelectorAll(selector).forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      link.setAttribute('href', decorateUrl(href));
    });
  }

  const api = {
    captureFromLocation,
    decorateLinks,
    decorateUrl,
    getContext: readContext,
    resolveSlug,
    track,
  };

  window.FTFAttribution = api;
  api.captureFromLocation();
})();
