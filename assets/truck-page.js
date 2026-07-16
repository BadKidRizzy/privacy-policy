(function () {
  'use strict';

  const FIRESTORE_PROJECT_ID = 'food-truck-finder-prod';
  const FIRESTORE_API_KEY = 'AIzaSyBWg6A7bQMEXGXhRiXyw_G6v54OqYbhGhc';
  const FIRESTORE_RUN_QUERY_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents:runQuery?key=${FIRESTORE_API_KEY}`;

  const APP_STORE_URL = 'https://apps.apple.com/us/app/ftf-food-truck-finder/id6742719545';
  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.innoryzen.foodtruckfinder';
  const MENU_PREVIEW_LIMIT = 6;
  const SCHEDULE_PREVIEW_LIMIT = 3;
  const SCHEDULE_FULL_LIMIT = 10;
  const NEARBY_LIMIT = 3;
  const REQUEST_TIMEOUT_MS = 12000;
  const LIVE_STATUS_MAX_AGE_MS = 18 * 60 * 60 * 1000;
  const PUBLIC_TRUCK_FIELDS = Object.freeze([
    'name', 'archived', 'isMapHidden', 'city', 'state', 'currentAddress', 'latitude', 'longitude',
    'locationType', 'isSharingLocation', 'isOpen', 'statusUpdatedAt', 'locationUpdatedAt',
    'coordinatesVerified', 'locationAccuracy', 'locationPrecision', 'scheduleUpdatedAt',
    'updatedAt', 'cuisines', 'description', 'dietaryOptions',
    'verificationStatus', 'specialSchedule', 'recurringSchedule', 'menu', 'menuImage', 'menuImages',
    'truckImage', 'photoSourceUrl', 'photos', 'photoUrls', 'businessPhone', 'websiteUrl',
    'socialLinks', 'cateringUrl',
    'bookingUrl', 'eventInquiryUrl', 'doordashUrl', 'uberEatsUrl', 'orderUrl',
  ]);

  const STATE_NAMES = {
    alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
    colorado: 'CO', connecticut: 'CT', delaware: 'DE', 'district of columbia': 'DC',
    florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL',
    indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA',
    maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN',
    mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK',
    oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
    virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
  };

  const STREET_SUFFIXES = new Set([
    'aly', 'alley', 'ave', 'avenue', 'blvd', 'boulevard', 'cir', 'circle', 'ct', 'court',
    'dr', 'drive', 'hwy', 'highway', 'ln', 'lane', 'pkwy', 'parkway', 'pl', 'place',
    'rd', 'road', 'rte', 'route', 'sq', 'square', 'st', 'street', 'ter', 'terrace',
    'trl', 'trail', 'way',
  ]);

  const ICON_PATHS = {
    app: '<rect x="5" y="2.5" width="14" height="19" rx="3"/><path d="M10 18h4"/>',
    call: '<path d="M7.2 3.5 9.6 8 7.8 9.8a15 15 0 0 0 6.4 6.4l1.8-1.8 4.5 2.4-1.1 3.1c-.3.8-1.1 1.3-2 1.2A17 17 0 0 1 2.9 6.6c-.1-.9.4-1.7 1.2-2Z"/>',
    directions: '<path d="m12 3 9 9-9 9-9-9Z"/><path d="M9 15v-3h6M13 10l2 2-2 2"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    location: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    order: '<path d="M6 8h12l-1 13H7Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
    share: '<path d="M12 16V3m0 0L7.5 7.5M12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
  };

  const selectors = {
    loadingView: document.querySelector('[data-loading-view]'),
    temporaryView: document.querySelector('[data-temporary-view]'),
    temporaryMessage: document.querySelector('[data-temporary-message]'),
    notFoundView: document.querySelector('[data-not-found-view]'),
    notFoundMessage: document.querySelector('[data-not-found-message]'),
    truckView: document.querySelector('[data-truck-view]'),
    retry: document.querySelector('[data-retry]'),
    shareButton: document.querySelector('[data-share-button]'),
    heroPhotoFrame: document.querySelector('[data-hero-photo-frame]'),
    photoNote: document.querySelector('[data-photo-note]'),
    locationSummary: document.querySelector('[data-location-summary]'),
    truckName: document.querySelector('[data-truck-name]'),
    cuisineList: document.querySelector('[data-cuisine-list]'),
    truckDescription: document.querySelector('[data-truck-description]'),
    serviceSummary: document.querySelector('[data-service-summary]'),
    heroStatus: document.querySelector('[data-hero-status]'),
    heroStatusDetail: document.querySelector('[data-hero-status-detail]'),
    trustRow: document.querySelector('[data-trust-row]'),
    ownerVerified: document.querySelector('[data-owner-verified]'),
    lastUpdated: document.querySelector('[data-last-updated]'),
    primaryActions: document.querySelector('[data-primary-actions]'),
    utilityActions: document.querySelector('[data-utility-actions]'),
    todayFreshness: document.querySelector('[data-today-freshness]'),
    todayStatus: document.querySelector('[data-today-status]'),
    todayTime: document.querySelector('[data-today-time]'),
    locationLabel: document.querySelector('[data-location-label]'),
    todayAddress: document.querySelector('[data-today-address]'),
    distance: document.querySelector('[data-distance]'),
    todayActions: document.querySelector('[data-today-actions]'),
    todayHelp: document.querySelector('[data-today-help]'),
    menuSection: document.querySelector('[data-menu-section]'),
    menuFeature: document.querySelector('[data-menu-feature]'),
    menuList: document.querySelector('[data-menu-list]'),
    menuEmpty: document.querySelector('[data-menu-empty]'),
    menuAlternatives: document.querySelector('[data-menu-alternatives]'),
    menuFooterAction: document.querySelector('[data-menu-footer-action]'),
    toggleMenu: document.querySelector('[data-toggle-menu]'),
    scheduleList: document.querySelector('[data-schedule-list]'),
    scheduleEmpty: document.querySelector('[data-schedule-empty]'),
    scheduleAlternatives: document.querySelector('[data-schedule-alternatives]'),
    toggleSchedule: document.querySelector('[data-toggle-schedule]'),
    gallerySection: document.querySelector('[data-gallery-section]'),
    galleryList: document.querySelector('[data-gallery-list]'),
    galleryCount: document.querySelector('[data-gallery-count]'),
    aboutSection: document.querySelector('[data-about-section]'),
    aboutDescription: document.querySelector('[data-about-description]'),
    aboutFacts: document.querySelector('[data-about-facts]'),
    contactLinks: document.querySelector('[data-contact-links]'),
    nearbySection: document.querySelector('[data-nearby-section]'),
    nearbyList: document.querySelector('[data-nearby-list]'),
    openApp: document.querySelector('[data-open-app]'),
    appStore: document.querySelector('[data-app-store]'),
    playStore: document.querySelector('[data-play-store]'),
    claimLink: document.querySelector('[data-claim-link]'),
    mobileActionBar: document.querySelector('[data-mobile-action-bar]'),
    mobileActions: document.querySelector('[data-mobile-actions]'),
    photoDialog: document.querySelector('[data-photo-dialog]'),
    photoDialogClose: document.querySelector('[data-photo-dialog-close]'),
    photoDialogImage: document.querySelector('[data-photo-dialog-image]'),
    photoDialogTitle: document.querySelector('[data-photo-dialog-title]'),
    photoPrevious: document.querySelector('[data-photo-previous]'),
    photoNext: document.querySelector('[data-photo-next]'),
    photoPosition: document.querySelector('[data-photo-position]'),
    toast: document.querySelector('[data-toast]'),
  };

  const state = {
    truck: null,
    truckId: '',
    requestedName: '',
    publicUrl: window.location.href,
    schedule: [],
    gallery: [],
    galleryIndex: 0,
    lastPhotoTrigger: null,
    photoScrollPosition: null,
    photoRestoreTimer: 0,
    showFullMenu: false,
    showFullSchedule: false,
    visitorLocation: null,
    loadAttempt: 0,
    toastTimer: 0,
    mobileActionObserver: null,
    lazyImageObserver: null,
    nearbyObserver: null,
    nearbyLoaded: false,
  };

  function asText(value) {
    return String(value == null ? '' : value).trim();
  }

  function asArray(value) {
    return Array.isArray(value) ? value.filter((item) => item != null) : [];
  }

  function publicTruckProjection() {
    return {fields: PUBLIC_TRUCK_FIELDS.map((fieldPath) => ({fieldPath}))};
  }

  function decodeFirestoreValue(value) {
    if (!value || typeof value !== 'object') return null;
    if (Object.prototype.hasOwnProperty.call(value, 'nullValue')) return null;
    if (Object.prototype.hasOwnProperty.call(value, 'stringValue')) return value.stringValue;
    if (Object.prototype.hasOwnProperty.call(value, 'booleanValue')) return value.booleanValue;
    if (Object.prototype.hasOwnProperty.call(value, 'integerValue')) return Number(value.integerValue);
    if (Object.prototype.hasOwnProperty.call(value, 'doubleValue')) return Number(value.doubleValue);
    if (Object.prototype.hasOwnProperty.call(value, 'timestampValue')) return new Date(value.timestampValue);
    if (Object.prototype.hasOwnProperty.call(value, 'referenceValue')) return value.referenceValue;
    if (Object.prototype.hasOwnProperty.call(value, 'geoPointValue')) {
      return {
        latitude: Number(value.geoPointValue.latitude),
        longitude: Number(value.geoPointValue.longitude),
      };
    }
    if (value.arrayValue) return asArray(value.arrayValue.values).map(decodeFirestoreValue);
    if (value.mapValue) return decodeFirestoreFields(value.mapValue.fields || {});
    return null;
  }

  function decodeFirestoreFields(fields) {
    return Object.fromEntries(Object.entries(fields || {}).map(([key, value]) => [key, decodeFirestoreValue(value)]));
  }

  function decodeFirestoreDocument(documentValue) {
    const path = asText(documentValue && documentValue.name);
    return {
      id: path.split('/').pop() || '',
      ...decodeFirestoreFields(documentValue && documentValue.fields),
    };
  }

  function decodeFirestoreRows(rows) {
    return asArray(rows).filter((row) => row && row.document).map((row) => decodeFirestoreDocument(row.document));
  }

  async function runFirestoreQuery(structuredQuery) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(FIRESTORE_RUN_QUERY_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({structuredQuery}),
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!response.ok) {
        const error = new Error(`Firestore request failed with ${response.status}`);
        error.code = response.status === 403 ? 'permission-denied' : `http-${response.status}`;
        throw error;
      }
      const rows = await response.json();
      return decodeFirestoreRows(rows);
    } catch (error) {
      if (error && error.name === 'AbortError') error.code = 'timeout';
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function getDate(value) {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate();
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === 'object' && Number.isFinite(Number(value.seconds))) {
      return new Date(Number(value.seconds) * 1000);
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  function isHttpUrl(value) {
    try {
      const url = new URL(asText(value));
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function isLikelyImageUrl(value) {
    const raw = asText(value);
    if (!isHttpUrl(raw)) return false;
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase();
      return /\.(?:avif|gif|heic|jpe?g|png|webp)$/i.test(url.pathname)
        || host.includes('firebasestorage.googleapis.com')
        || host.includes('storage.googleapis.com')
        || host.includes('images.squarespace-cdn.com')
        || host.includes('cdn.shopify.com');
    } catch {
      return false;
    }
  }

  function isRealPhotoUrl(value) {
    const url = asText(value);
    return isLikelyImageUrl(url) && !/(?:photo[-_ ]?pending|placeholder|default[-_ ]?truck)/i.test(url);
  }

  function normalizedUrlKey(value) {
    try {
      const url = new URL(value);
      url.hash = '';
      url.hostname = url.hostname.replace(/^www\./i, '').toLowerCase();
      return url.toString().replace(/\/$/, '');
    } catch {
      return asText(value).toLowerCase();
    }
  }

  function uniqueUrls(values) {
    const seen = new Set();
    return values.map(asText).filter(isRealPhotoUrl).filter((url) => {
      const key = normalizedUrlKey(url);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function cleanLocationPart(value) {
    return asText(value).replace(/\s+/g, ' ').replace(/^,+|,+$/g, '').trim();
  }

  function stateFromText(value) {
    const raw = cleanLocationPart(value);
    if (!raw) return '';
    const parts = raw.split(',').map(cleanLocationPart).filter(Boolean);
    for (let index = parts.length - 1; index >= 0; index -= 1) {
      const part = parts[index];
      const code = part.match(/^([A-Za-z]{2})(?:\s+\d{5}(?:-\d{4})?)?$/);
      if (code) return code[1].toUpperCase();
      const normalizedState = part.replace(/\s+\d{5}(?:-\d{4})?$/, '').trim().toLowerCase();
      if (STATE_NAMES[normalizedState]) return STATE_NAMES[normalizedState];
    }
    const normalized = ` ${raw.toLowerCase().replace(/[^a-z]+/g, ' ').trim()} `;
    const match = Object.entries(STATE_NAMES).find(([name]) => normalized.includes(` ${name} `));
    return match ? match[1] : '';
  }

  function stripStreetPrefix(value) {
    const cleaned = cleanLocationPart(value).replace(/(?:\s+|^)\d{5}(?:-\d{4})?$/, '').trim();
    if (!cleaned) return '';
    const tokens = cleaned.split(' ');
    for (let index = 0; index < tokens.length - 1; index += 1) {
      const token = tokens[index].toLowerCase().replace(/\./g, '');
      const hasStreetNumber = tokens.slice(0, index).some((item) => /\d/.test(item));
      if (hasStreetNumber && STREET_SUFFIXES.has(token)) {
        return tokens.slice(index + 1).join(' ').trim();
      }
    }
    return cleaned;
  }

  function cityFromText(value) {
    const raw = cleanLocationPart(value);
    if (!raw) return '';
    const parts = raw.split(',').map(cleanLocationPart).filter(Boolean);
    const last = (parts[parts.length - 1] || '').toLowerCase();
    const hasCountry = ['usa', 'us', 'united states', 'united states of america'].includes(last);
    const candidate = hasCountry && parts.length >= 3
      ? parts[parts.length - 3]
      : parts.length >= 3
        ? parts[parts.length - 2]
        : parts[0];
    return stripStreetPrefix(candidate);
  }

  function compactLocationLabel(truck) {
    const explicitCity = cleanLocationPart(truck && truck.city);
    const city = explicitCity || cityFromText(truck && truck.currentAddress);
    const region = stateFromText(truck && truck.state)
      || stateFromText(truck && truck.currentAddress)
      || stateFromText(explicitCity);
    if (city && region && city.toUpperCase() !== region) return `${city}, ${region}`;
    return city || region || '';
  }

  function formatPrice(value) {
    const price = Number(value);
    if (!Number.isFinite(price) || price < 0) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price);
  }

  function formatTime(value) {
    const date = getDate(value);
    if (!date) return '';
    return date.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
  }

  function formatMonthDay(value) {
    const date = getDate(value);
    if (!date) return '';
    return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
  }

  function startOfDay(value) {
    const result = new Date(value);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  function relativeDayLabel(value, reference) {
    const date = getDate(value);
    if (!date) return '';
    const today = startOfDay(reference || new Date());
    const target = startOfDay(date);
    const difference = Math.round((target.getTime() - today.getTime()) / 86400000);
    if (difference === 0) return 'Today';
    if (difference === 1) return 'Tomorrow';
    return date.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'});
  }

  function isFresh(value, maxAge) {
    const date = getDate(value);
    if (!date) return false;
    const age = Date.now() - date.getTime();
    return age >= -5 * 60 * 1000 && age <= maxAge;
  }

  function mostRecentDate(values) {
    return values.map(getDate).filter(Boolean).sort((a, b) => b.getTime() - a.getTime())[0] || null;
  }

  function getRequestContext() {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.split('/').filter(Boolean);
    const queryId = asText(params.get('id') || params.get('truck'));
    return {
      id: queryId || (path[0] === 'truck' && path[1] ? decodeURIComponent(path[1]) : ''),
      name: asText(params.get('name')).slice(0, 120),
    };
  }

  function buildPublicUrl(truckId, truckName) {
    const url = new URL('/truck/', window.location.origin);
    url.searchParams.set('id', truckId);
    if (truckName) url.searchParams.set('name', truckName);
    return url.toString();
  }

  function buildAppHandoffUrl(truckId, truckName) {
    const url = new URL('/open/', window.location.origin);
    url.searchParams.set('truck', truckId);
    if (truckName) url.searchParams.set('name', truckName);
    return url.toString();
  }

  function buildClaimUrl(truck) {
    const url = new URL('/claim-your-food-truck/', window.location.origin);
    url.searchParams.set('truck', asText(truck.name));
    const city = compactLocationLabel(truck);
    if (city) url.searchParams.set('city', city);
    url.searchParams.set('profile', state.publicUrl);
    url.hash = 'claim-form';
    return url.toString();
  }

  function coordinatesFor(truck) {
    if (!truck || truck.isMapHidden === true) return null;
    const latitude = Number(truck.latitude);
    const longitude = Number(truck.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
    return {latitude, longitude};
  }

  function directionsCoordinatesFor(truck) {
    const coordinates = coordinatesFor(truck);
    if (!coordinates) return null;
    const freshLiveLocation = truck.isSharingLocation === true
      && isFresh(truck.locationUpdatedAt, LIVE_STATUS_MAX_AGE_MS);
    const accuracy = asText(truck.locationAccuracy || truck.locationPrecision).toLowerCase();
    const explicitlyPrecise = truck.coordinatesVerified === true
      || ['exact', 'precise', 'verified'].includes(accuracy);
    return freshLiveLocation || explicitlyPrecise ? coordinates : null;
  }

  function hasDirectionsTarget(truck, addressOverride) {
    return Boolean(asText(addressOverride || (truck && truck.currentAddress))) || Boolean(directionsCoordinatesFor(truck));
  }

  function buildDirectionsUrl(truck, addressOverride) {
    const address = asText(addressOverride || (truck && truck.currentAddress));
    const coordinates = directionsCoordinatesFor(truck);
    const shouldPreferAddress = Boolean(address) && (
      Boolean(addressOverride)
      || truck.locationType === 'stationary'
      || truck.isSharingLocation !== true
    );
    let destination = '';
    if (shouldPreferAddress) {
      destination = address;
    } else if (coordinates) {
      destination = `${coordinates.latitude},${coordinates.longitude}`;
    } else {
      destination = address;
    }
    if (!destination) return '';
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  }

  function getOrderUrl(truck) {
    return [truck && truck.doordashUrl, truck && truck.uberEatsUrl, truck && truck.orderUrl]
      .map(asText)
      .find(isHttpUrl) || '';
  }

  function socialLabel(value) {
    try {
      const host = new URL(value).hostname.replace(/^www\./i, '').toLowerCase();
      if (host.includes('instagram')) return 'Instagram';
      if (host.includes('facebook')) return 'Facebook';
      if (host.includes('tiktok')) return 'TikTok';
      if (host.includes('youtube')) return 'YouTube';
      if (host === 'x.com' || host.includes('twitter')) return 'X';
    } catch {
      return '';
    }
    return '';
  }

  function isUsefulSocialUrl(value) {
    if (!isHttpUrl(value) || !socialLabel(value)) return false;
    try {
      const url = new URL(value);
      return !/(?:^|\/)(?:search|share|watch)(?:\/|$)/i.test(url.pathname);
    } catch {
      return false;
    }
  }

  function usefulSocialLinks(truck) {
    const seen = new Set();
    return asArray(truck && truck.socialLinks).map(asText).filter(isUsefulSocialUrl).filter((url) => {
      const key = normalizedUrlKey(url);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function truckPhotos(truck) {
    return uniqueUrls([
      truck && truck.truckImage,
      truck && truck.photoSourceUrl,
      ...asArray(truck && truck.photos),
      ...asArray(truck && truck.photoUrls),
    ]);
  }

  function menuPhotos(truck) {
    const itemPhotos = asArray(truck && truck.menu).map((item) => item && (item.imageUri || item.imageUrl || item.photoUrl));
    return uniqueUrls([
      ...asArray(truck && truck.menuImages),
      truck && truck.menuImage,
      ...itemPhotos,
    ]);
  }

  function hasMenu(truck) {
    const items = asArray(truck && truck.menu).filter((item) => item && typeof item === 'object' && asText(item.name));
    return items.length > 0 || menuPhotos(truck).length > 0;
  }

  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.innerHTML = ICON_PATHS[name] || ICON_PATHS.external;
    return svg;
  }

  function setView(view) {
    const views = {
      loading: selectors.loadingView,
      temporary: selectors.temporaryView,
      notFound: selectors.notFoundView,
      truck: selectors.truckView,
    };
    Object.entries(views).forEach(([name, element]) => {
      if (!element) return;
      const active = name === view;
      element.hidden = !active;
      if (name === 'loading') element.setAttribute('aria-busy', active ? 'true' : 'false');
    });
    if (view !== 'truck') clearMobileActions();
  }

  function showToast(message) {
    if (!selectors.toast) return;
    window.clearTimeout(state.toastTimer);
    selectors.toast.textContent = message;
    selectors.toast.hidden = false;
    state.toastTimer = window.setTimeout(() => {
      selectors.toast.hidden = true;
    }, 2200);
  }

  function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(value);
    }
    return new Promise((resolve, reject) => {
      const input = document.createElement('textarea');
      input.value = value;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      try {
        const copied = document.execCommand('copy');
        input.remove();
        copied ? resolve() : reject(new Error('Copy unavailable'));
      } catch (error) {
        input.remove();
        reject(error);
      }
    });
  }

  function analyticsContext(metadata) {
    return Object.assign({surface: 'truck_profile'}, metadata || {});
  }

  function trackEvent(eventName, metadata) {
    const safeMetadata = analyticsContext(metadata);
    const eventPayload = {
      event: eventName,
      truck_id: state.truckId || undefined,
      action: safeMetadata.action,
      surface: safeMetadata.surface,
    };
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, eventPayload);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(eventPayload);
    }
    window.dispatchEvent(new CustomEvent('ftf:analytics', {detail: eventPayload}));
    if (window.FTFAttribution && typeof window.FTFAttribution.track === 'function') {
      window.FTFAttribution.track(eventName, {
        truckId: state.truckId || undefined,
        city: state.truck ? compactLocationLabel(state.truck) : undefined,
        metadata: safeMetadata,
      });
    }
  }

  async function shareTruck() {
    const truckName = asText(state.truck && state.truck.name) || state.requestedName || 'Food truck';
    const shareData = {
      title: `${truckName} | Food Truck Finder`,
      text: `View ${truckName} on Food Truck Finder.`,
      url: state.publicUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        trackEvent('share_used', {action: 'native_share'});
        return;
      } catch (error) {
        if (error && error.name === 'AbortError') return;
      }
    }
    try {
      await copyText(state.publicUrl);
      showToast('Link copied');
      trackEvent('share_used', {action: 'copy_link'});
    } catch {
      showToast('Copy unavailable. Use your browser’s address bar.');
    }
  }

  function createTrackedAction(options) {
    const element = options.href ? document.createElement('a') : document.createElement('button');
    if (options.href) {
      element.href = options.href;
      if (options.external) {
        element.target = '_blank';
        element.rel = 'noopener noreferrer';
      }
    } else {
      element.type = 'button';
    }
    element.className = options.className || '';
    if (options.icon) element.appendChild(icon(options.icon));
    const label = document.createElement('span');
    label.textContent = options.label;
    element.appendChild(label);
    element.addEventListener('click', (event) => {
      if (options.onClick) options.onClick(event);
      if (options.eventName) trackEvent(options.eventName, {action: options.action || options.label});
      if (options.primary) trackEvent('primary_action_clicked', {action: options.action || options.label});
    });
    return element;
  }

  function createTextAction(label, href, eventName, action) {
    const link = document.createElement('a');
    link.className = 'empty-action';
    link.href = href;
    if (isHttpUrl(href)) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    link.textContent = label;
    if (eventName) link.addEventListener('click', () => trackEvent(eventName, {action: action || label}));
    return link;
  }

  function addMeta(selector, attribute, value) {
    document.querySelector(selector)?.setAttribute(attribute, value);
  }

  function setDocumentMeta(truck) {
    const name = asText(truck.name) || 'Food Truck';
    const city = compactLocationLabel(truck);
    const cuisines = asArray(truck.cuisines).map(asText).filter((item) => item && item.toLowerCase() !== 'food trucks');
    const cuisineText = cuisines.slice(0, 2).join(' and ');
    const title = `${name} | Menu, Location & Schedule | Food Truck Finder`;
    const descriptionParts = [`Find ${name}`];
    if (cuisineText) descriptionParts.push(`serving ${cuisineText}`);
    if (city) descriptionParts.push(`in ${city}`);
    const description = `${descriptionParts.join(' ')}. View the menu, listed location, schedule, and contact links on Food Truck Finder.`.slice(0, 165);
    const photos = truckPhotos(truck);
    const menuImageUrls = menuPhotos(truck);
    const imageUrl = photos[0] || menuImageUrls[0] || new URL('/assets/brand/IconLogo.png', window.location.origin).toString();
    const canonical = buildPublicUrl(state.truckId, '');

    document.title = title;
    addMeta('meta[name="description"]', 'content', description);
    addMeta('link[rel="canonical"]', 'href', canonical);
    addMeta('meta[property="og:url"]', 'content', canonical);
    addMeta('meta[property="og:title"]', 'content', title);
    addMeta('meta[property="og:description"]', 'content', description);
    addMeta('meta[property="og:image"]', 'content', imageUrl);
    addMeta('meta[property="og:image:alt"]', 'content', `${name} profile photo`);
    addMeta('meta[name="twitter:title"]', 'content', title);
    addMeta('meta[name="twitter:description"]', 'content', description);
    addMeta('meta[name="twitter:image"]', 'content', imageUrl);

    document.querySelector('[data-profile-schema]')?.remove();
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FoodEstablishment',
      name,
      url: canonical,
    };
    if (imageUrl) schema.image = imageUrl;
    if (cuisines.length) schema.servesCuisine = cuisines;
    if (asText(truck.currentAddress) && truck.isMapHidden !== true) {
      schema.address = {'@type': 'PostalAddress', streetAddress: asText(truck.currentAddress)};
    }
    if (asText(truck.businessPhone)) schema.telephone = asText(truck.businessPhone);
    const sameAs = [truck.websiteUrl, ...usefulSocialLinks(truck)].map(asText).filter(isHttpUrl);
    if (sameAs.length) schema.sameAs = sameAs;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.profileSchema = '';
    script.textContent = JSON.stringify(schema).replace(/</g, '\\u003c');
    document.head.appendChild(script);
  }

  function applyTimeToDate(baseDate, timeSource) {
    const result = new Date(baseDate);
    result.setHours(timeSource.getHours(), timeSource.getMinutes(), timeSource.getSeconds(), timeSource.getMilliseconds());
    return result;
  }

  function isRecurringDay(dayOfWeek, jsDay) {
    return Number(dayOfWeek) === jsDay || (jsDay === 0 && Number(dayOfWeek) === 7);
  }

  function getScheduleEntries(truck) {
    const now = new Date();
    const entries = [];
    asArray(truck.specialSchedule).forEach((item) => {
      const start = getDate(item && item.start);
      const end = getDate(item && item.end) || start;
      if (!start || !end || end.getTime() < now.getTime() - 60000) return;
      entries.push({
        kind: 'special',
        start,
        end,
        address: asText(item.address),
        venue: asText(item.venueName || item.eventName || item.locationName),
      });
    });

    const baseToday = startOfDay(now);
    asArray(truck.recurringSchedule).forEach((item) => {
      const startSource = getDate(item && item.start);
      const endSource = getDate(item && item.end);
      if (!startSource || !endSource || !Number.isFinite(Number(item.dayOfWeek))) return;
      for (let offset = -1; offset <= 14; offset += 1) {
        const baseDate = new Date(baseToday);
        baseDate.setDate(baseDate.getDate() + offset);
        if (!isRecurringDay(item.dayOfWeek, baseDate.getDay())) continue;
        const start = applyTimeToDate(baseDate, startSource);
        let end = applyTimeToDate(baseDate, endSource);
        const sourceSpansDate = startSource.toDateString() !== endSource.toDateString();
        if (sourceSpansDate || end < start) end.setDate(end.getDate() + 1);
        if (end.getTime() < now.getTime() - 60000) continue;
        entries.push({
          kind: 'recurring',
          start,
          end,
          address: asText(item.address),
          venue: asText(item.venueName || item.eventName || item.locationName),
        });
      }
    });

    const seen = new Set();
    return entries.sort((a, b) => a.start.getTime() - b.start.getTime()).filter((entry) => {
      const key = `${entry.start.getTime()}|${entry.end.getTime()}|${entry.address}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function analyzeService(truck, schedule) {
    const now = new Date();
    const active = schedule.find((entry) => entry.start <= now && entry.end >= now);
    const statusIsFresh = isFresh(truck.statusUpdatedAt, LIVE_STATUS_MAX_AGE_MS);
    const locationIsFresh = truck.isSharingLocation === true
      && isFresh(truck.locationUpdatedAt, LIVE_STATUS_MAX_AGE_MS);
    const liveFlag = truck.isOpen === true && (statusIsFresh || locationIsFresh);
    const next = schedule.find((entry) => entry.start > now) || null;

    if (active) {
      return {
        type: 'serving',
        label: 'Serving now',
        detail: active.end ? `Until ${formatTime(active.end)}` : 'Current service window',
        active,
        next: active,
      };
    }
    if (liveFlag) {
      return {
        type: 'serving',
        label: 'Serving now',
        detail: locationIsFresh ? 'Live location is available' : 'Current truck status',
        active: null,
        next,
      };
    }
    if (next && startOfDay(next.start).getTime() === startOfDay(now).getTime()) {
      return {
        type: 'scheduled',
        label: 'Serving today',
        detail: `Starts at ${formatTime(next.start)}`,
        active: null,
        next,
      };
    }
    if (next) {
      return {
        type: 'scheduled',
        label: `Next stop ${relativeDayLabel(next.start, now).toLowerCase()}`,
        detail: `${formatTime(next.start)}${next.address ? ` · ${next.address}` : ''}`,
        active: null,
        next,
      };
    }
    return {
      type: 'unknown',
      label: 'Serving status hasn’t been posted',
      detail: 'No current service window is available.',
      active: null,
      next: null,
    };
  }

  function createImage(url, alt, options) {
    const image = document.createElement('img');
    image.alt = alt;
    image.width = (options && options.width) || 1200;
    image.height = (options && options.height) || 900;
    image.decoding = 'async';
    if (options && options.eager) {
      image.src = url;
      image.loading = 'eager';
      image.fetchPriority = 'high';
    } else {
      image.dataset.src = url;
      image.loading = 'lazy';
      image.fetchPriority = 'low';
    }
    if (options && options.className) image.className = options.className;
    if (options && options.sizes) image.sizes = options.sizes;
    return image;
  }

  function loadDeferredImage(image) {
    const source = image && image.dataset ? image.dataset.src : '';
    if (!source) return;
    image.src = source;
    delete image.dataset.src;
  }

  function activateLazyImages(root) {
    const images = root ? root.querySelectorAll('img[data-src]') : [];
    if (!images.length) return;
    if (!('IntersectionObserver' in window)) {
      images.forEach(loadDeferredImage);
      return;
    }
    if (!state.lazyImageObserver) {
      state.lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          loadDeferredImage(entry.target);
          state.lazyImageObserver.unobserve(entry.target);
        });
      }, {rootMargin: '320px 0px'});
    }
    images.forEach((image) => state.lazyImageObserver.observe(image));
  }

  function renderBrandedFallback(truck) {
    const fallback = document.createElement('div');
    fallback.className = 'branded-fallback';
    const sun = document.createElement('span');
    sun.className = 'fallback-sun';
    sun.setAttribute('aria-hidden', 'true');
    const truckArt = document.createElement('span');
    truckArt.className = 'fallback-truck';
    truckArt.setAttribute('aria-hidden', 'true');
    truckArt.innerHTML = '<svg viewBox="0 0 260 130"><path d="M28 42h160l28 35v32H28z"/><path d="M50 42V20h100v22M62 59h72v29H62zM168 60h21l17 20h-38z"/><circle cx="68" cy="110" r="16"/><circle cx="177" cy="110" r="16"/><path d="M84 110h77M12 108h17"/></svg>';
    const copy = document.createElement('div');
    copy.className = 'fallback-copy';
    const name = document.createElement('strong');
    name.textContent = asText(truck.name) || 'Food Truck';
    const location = document.createElement('span');
    location.textContent = compactLocationLabel(truck) || 'Food Truck Finder';
    copy.append(name, location);
    fallback.append(sun, truckArt, copy);
    selectors.heroPhotoFrame.appendChild(fallback);
    selectors.photoNote.hidden = false;
  }

  function optimizedHeroFor(photoUrl) {
    const optimized = window.__FTF_OPTIMIZED_HERO__;
    if (!optimized || optimized.id !== state.truckId || !asText(optimized.src).startsWith('data:image/avif')) return null;
    if (optimized.sourceUrl && normalizedUrlKey(optimized.sourceUrl) !== normalizedUrlKey(photoUrl)) return null;
    return optimized;
  }

  function renderHeroPhoto(truck) {
    selectors.heroPhotoFrame.textContent = '';
    selectors.photoNote.hidden = true;
    const primaryPhotos = truckPhotos(truck);
    const foodPhotos = menuPhotos(truck);
    const name = asText(truck.name) || 'Food truck';
    if (primaryPhotos.length) {
      const optimized = optimizedHeroFor(primaryPhotos[0]);
      if (optimized) {
        const picture = document.createElement('picture');
        const source = document.createElement('source');
        source.type = optimized.type || 'image/avif';
        source.srcset = `${optimized.src} ${Number(optimized.width) || 768}w`;
        source.sizes = '(max-width: 900px) calc(100vw - 32px), (max-width: 1280px) 54vw, 650px';
        const image = document.createElement('img');
        image.alt = `${name} food truck`;
        image.width = Number(optimized.width) || 768;
        image.height = Number(optimized.height) || 576;
        image.decoding = 'async';
        image.loading = 'eager';
        image.fetchPriority = 'high';
        image.className = 'hero-photo';
        image.sizes = source.sizes;
        picture.append(source, image);
        image.src = primaryPhotos[0];
        selectors.heroPhotoFrame.appendChild(picture);
        return;
      }
      const image = createImage(primaryPhotos[0], `${name} food truck`, {
        eager: true,
        className: 'hero-photo',
        sizes: '(max-width: 900px) calc(100vw - 32px), (max-width: 1280px) 54vw, 650px',
      });
      image.addEventListener('error', () => {
        selectors.heroPhotoFrame.textContent = '';
        if (foodPhotos.length) {
          const foodImage = createImage(foodPhotos[0], `Food from ${name}`, {eager: true, className: 'hero-photo'});
          foodImage.addEventListener('error', () => {
            selectors.heroPhotoFrame.textContent = '';
            renderBrandedFallback(truck);
          }, {once: true});
          selectors.heroPhotoFrame.appendChild(foodImage);
        } else {
          renderBrandedFallback(truck);
        }
      }, {once: true});
      selectors.heroPhotoFrame.appendChild(image);
      return;
    }
    if (foodPhotos.length === 1) {
      const image = createImage(foodPhotos[0], `Food or menu photo for ${name}`, {eager: true, className: 'hero-photo'});
      image.addEventListener('error', () => {
        selectors.heroPhotoFrame.textContent = '';
        renderBrandedFallback(truck);
      }, {once: true});
      selectors.heroPhotoFrame.appendChild(image);
      return;
    }
    if (foodPhotos.length > 1) {
      const collage = document.createElement('div');
      collage.className = 'hero-collage';
      foodPhotos.slice(0, 3).forEach((url, index) => {
        collage.appendChild(createImage(url, `${name} food photo ${index + 1}`, {eager: true}));
      });
      selectors.heroPhotoFrame.appendChild(collage);
      return;
    }
    renderBrandedFallback(truck);
  }

  function renderCuisines(truck) {
    selectors.cuisineList.textContent = '';
    const cuisines = asArray(truck.cuisines).map(asText).filter(Boolean).filter((item) => item.toLowerCase() !== 'food trucks').slice(0, 5);
    cuisines.forEach((cuisine) => {
      const chip = document.createElement('li');
      chip.className = 'cuisine-chip';
      chip.textContent = cuisine;
      selectors.cuisineList.appendChild(chip);
    });
    selectors.cuisineList.hidden = cuisines.length === 0;
  }

  function actionForMenu(className, primary) {
    return createTrackedAction({
      label: 'View Menu',
      href: '#menu',
      className,
      icon: 'menu',
      eventName: 'menu_opened',
      action: 'view_menu',
      primary,
    });
  }

  function renderHeroActions(truck) {
    selectors.primaryActions.textContent = '';
    selectors.utilityActions.textContent = '';
    const orderUrl = getOrderUrl(truck);
    const directionsUrl = hasDirectionsTarget(truck) ? buildDirectionsUrl(truck) : '';
    const menuAvailable = hasMenu(truck);

    if (orderUrl) {
      selectors.primaryActions.appendChild(createTrackedAction({
        label: 'Order Online', href: orderUrl, external: true, className: 'button button--primary',
        icon: 'order', eventName: 'online_ordering_clicked', action: 'order_online', primary: true,
      }));
      if (menuAvailable) {
        selectors.primaryActions.appendChild(actionForMenu('button button--outline', false));
      } else if (directionsUrl) {
        selectors.primaryActions.appendChild(createTrackedAction({
          label: 'Get Directions', href: directionsUrl, external: true, className: 'button button--outline',
          icon: 'directions', eventName: 'directions_clicked', action: 'directions',
        }));
      }
    } else if (directionsUrl) {
      selectors.primaryActions.appendChild(createTrackedAction({
        label: 'Get Directions', href: directionsUrl, external: true, className: 'button button--primary',
        icon: 'directions', eventName: 'directions_clicked', action: 'directions', primary: true,
      }));
      if (menuAvailable) selectors.primaryActions.appendChild(actionForMenu('button button--outline', false));
    } else if (menuAvailable) {
      selectors.primaryActions.appendChild(actionForMenu('button button--primary', true));
    }

    if (orderUrl && directionsUrl && menuAvailable) {
      selectors.utilityActions.appendChild(createTrackedAction({
        label: 'Directions', href: directionsUrl, external: true, className: 'utility-action', icon: 'directions',
        eventName: 'directions_clicked', action: 'directions',
      }));
    }

    const appUrl = buildAppHandoffUrl(state.truckId, truck.name);
    selectors.utilityActions.appendChild(createTrackedAction({
      label: 'Open in App', href: appUrl, className: 'utility-action', icon: 'app',
      eventName: 'app_opened_or_downloaded', action: 'open_app',
    }));

    const phone = asText(truck.businessPhone);
    if (phone) {
      selectors.utilityActions.appendChild(createTrackedAction({
        label: 'Call', href: `tel:${phone.replace(/[^\d+]/g, '')}`, className: 'utility-action', icon: 'call',
        action: 'call',
      }));
    }
    if (isHttpUrl(truck.websiteUrl)) {
      selectors.utilityActions.appendChild(createTrackedAction({
        label: 'Website', href: truck.websiteUrl, external: true, className: 'utility-action', icon: 'globe',
        action: 'website',
      }));
    }
    selectors.utilityActions.appendChild(createTrackedAction({
      label: 'Share', className: 'utility-action', icon: 'share', onClick: shareTruck,
    }));
  }

  function renderTrust(truck) {
    const verified = asText(truck.verificationStatus).toLowerCase() === 'owner_verified';
    const updatedAt = getDate(truck.updatedAt);
    selectors.ownerVerified.hidden = !verified;
    selectors.lastUpdated.hidden = !updatedAt;
    if (updatedAt) {
      selectors.lastUpdated.textContent = `Last updated ${formatMonthDay(updatedAt)}`;
      selectors.lastUpdated.title = updatedAt.toLocaleString();
    }
    selectors.trustRow.hidden = !verified && !updatedAt;
  }

  function distanceMiles(first, second) {
    if (!first || !second) return null;
    const toRadians = (degrees) => degrees * Math.PI / 180;
    const earthRadiusMiles = 3958.8;
    const latitudeDelta = toRadians(second.latitude - first.latitude);
    const longitudeDelta = toRadians(second.longitude - first.longitude);
    const a = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(toRadians(first.latitude)) * Math.cos(toRadians(second.latitude))
      * Math.sin(longitudeDelta / 2) ** 2;
    return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function renderToday(truck, service) {
    selectors.todayStatus.textContent = service.label;
    selectors.todayTime.textContent = service.detail;
    const scheduledAddress = asText((service.active || service.next) && (service.active || service.next).address);
    const profileAddress = truck.isMapHidden === true ? '' : asText(truck.currentAddress);
    const displayedAddress = scheduledAddress || profileAddress;
    const liveLocation = truck.isSharingLocation === true && isFresh(truck.locationUpdatedAt, LIVE_STATUS_MAX_AGE_MS);

    if (scheduledAddress) {
      selectors.locationLabel.textContent = service.active ? 'Current stop' : 'Next stop';
    } else if (displayedAddress && liveLocation) {
      selectors.locationLabel.textContent = 'Current location';
    } else if (displayedAddress && truck.locationType === 'stationary') {
      selectors.locationLabel.textContent = 'Listed location';
    } else if (displayedAddress) {
      selectors.locationLabel.textContent = 'Location on profile';
    } else {
      selectors.locationLabel.textContent = 'Next location';
    }
    selectors.todayAddress.textContent = displayedAddress || 'Next location has not been posted yet.';

    const truckCoordinates = directionsCoordinatesFor(truck);
    const miles = state.visitorLocation && truckCoordinates ? distanceMiles(state.visitorLocation, truckCoordinates) : null;
    selectors.distance.hidden = !Number.isFinite(miles);
    if (Number.isFinite(miles)) {
      selectors.distance.textContent = miles < 0.1 ? 'Less than 0.1 miles from you' : `${miles.toFixed(miles < 10 ? 1 : 0)} miles from you`;
    }

    const freshnessDate = mostRecentDate([truck.statusUpdatedAt, truck.locationUpdatedAt, truck.scheduleUpdatedAt]);
    selectors.todayFreshness.hidden = !freshnessDate;
    if (freshnessDate) {
      selectors.todayFreshness.textContent = `Details updated ${formatMonthDay(freshnessDate)}`;
      selectors.todayFreshness.title = freshnessDate.toLocaleString();
    }

    selectors.todayActions.textContent = '';
    const directionsUrl = hasDirectionsTarget(truck, scheduledAddress || profileAddress)
      ? buildDirectionsUrl(truck, scheduledAddress || profileAddress)
      : '';
    if (directionsUrl) {
      selectors.todayActions.appendChild(createTrackedAction({
        label: 'Directions', href: directionsUrl, external: true, className: 'today-action', icon: 'directions',
        eventName: 'directions_clicked', action: 'today_directions',
      }));
    }
    if (!state.visitorLocation && truckCoordinates && 'geolocation' in navigator) {
      selectors.todayActions.appendChild(createTrackedAction({
        label: 'Distance from me', className: 'today-action today-action--secondary', icon: 'location',
        onClick: requestVisitorLocation,
      }));
    }

    selectors.todayHelp.textContent = '';
    const helpParts = [];
    if (!displayedAddress) {
      helpParts.push(document.createTextNode('The truck has not shared a location for today. '));
    } else if (!liveLocation && !scheduledAddress) {
      helpParts.push(document.createTextNode('This is the listing’s saved location, not a live service update. '));
    }
    if (!state.schedule.length) {
      const scheduleLink = document.createElement('a');
      scheduleLink.href = '#schedule';
      scheduleLink.textContent = 'View schedule updates';
      scheduleLink.addEventListener('click', () => trackEvent('schedule_expanded', {action: 'today_schedule_link'}));
      helpParts.push(scheduleLink, document.createTextNode('.'));
    }
    if (helpParts.length) {
      selectors.todayHelp.append(...helpParts);
      selectors.todayHelp.hidden = false;
    } else {
      selectors.todayHelp.hidden = true;
    }
  }

  function requestVisitorLocation() {
    if (!navigator.geolocation || !directionsCoordinatesFor(state.truck)) return;
    navigator.geolocation.getCurrentPosition((position) => {
      state.visitorLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      const service = analyzeService(state.truck, state.schedule);
      renderToday(state.truck, service);
      showToast('Distance added');
    }, (error) => {
      if (error && error.code === 1) showToast('Location permission was not enabled');
      else showToast('We couldn’t get your distance right now');
    }, {enableHighAccuracy: false, timeout: 8000, maximumAge: 300000});
  }

  function hydrateGrantedLocation() {
    if (!navigator.permissions || !navigator.geolocation || !directionsCoordinatesFor(state.truck)) return;
    navigator.permissions.query({name: 'geolocation'}).then((permission) => {
      if (permission.state === 'granted') requestVisitorLocation();
    }).catch(() => {});
  }

  function openGalleryAt(index, trigger) {
    if (!state.gallery.length || !selectors.photoDialog) return;
    window.clearTimeout(state.photoRestoreTimer);
    state.galleryIndex = (index + state.gallery.length) % state.gallery.length;
    state.lastPhotoTrigger = trigger || null;
    state.photoScrollPosition = {
      x: window.scrollX,
      y: window.scrollY,
      triggerTop: trigger ? trigger.getBoundingClientRect().top : null,
    };
    updatePhotoDialog();
    if (typeof selectors.photoDialog.showModal === 'function') {
      if (!selectors.photoDialog.open) selectors.photoDialog.showModal();
    } else {
      selectors.photoDialog.setAttribute('open', '');
    }
    selectors.photoDialogClose.focus({preventScroll: true});
  }

  function updatePhotoDialog() {
    const photo = state.gallery[state.galleryIndex];
    if (!photo) return;
    selectors.photoDialogImage.src = photo.url;
    selectors.photoDialogImage.alt = photo.alt;
    selectors.photoDialogTitle.textContent = photo.title;
    selectors.photoPosition.textContent = `${state.galleryIndex + 1} of ${state.gallery.length}`;
    const multiple = state.gallery.length > 1;
    selectors.photoPrevious.hidden = !multiple;
    selectors.photoNext.hidden = !multiple;
  }

  function closePhotoDialog() {
    if (!selectors.photoDialog) return;
    if (typeof selectors.photoDialog.close === 'function' && selectors.photoDialog.open) selectors.photoDialog.close();
    else selectors.photoDialog.removeAttribute('open');
  }

  function movePhoto(offset) {
    if (!state.gallery.length) return;
    state.galleryIndex = (state.galleryIndex + offset + state.gallery.length) % state.gallery.length;
    updatePhotoDialog();
  }

  function createMenuCard(item, truckName) {
    const card = document.createElement('article');
    card.className = 'menu-card';
    const photoUrl = asText(item.imageUri || item.imageUrl || item.photoUrl);
    if (isRealPhotoUrl(photoUrl)) {
      card.appendChild(createImage(photoUrl, `${asText(item.name)} from ${truckName}`, {className: 'menu-card-photo', width: 640, height: 480}));
    }
    const body = document.createElement('div');
    body.className = 'menu-card-body';
    const titleRow = document.createElement('div');
    titleRow.className = 'menu-card-title-row';
    const name = document.createElement('strong');
    name.textContent = asText(item.name) || 'Menu item';
    titleRow.appendChild(name);
    const formattedPrice = formatPrice(item.price);
    if (formattedPrice) {
      const price = document.createElement('span');
      price.className = 'menu-price';
      price.textContent = formattedPrice;
      titleRow.appendChild(price);
    }
    body.appendChild(titleRow);
    const description = asText(item.description);
    if (description) {
      const copy = document.createElement('p');
      copy.className = 'menu-description';
      copy.textContent = description;
      body.appendChild(copy);
    }
    card.appendChild(body);
    return card;
  }

  function renderAlternativeLinks(container, truck, includeNearby) {
    container.textContent = '';
    const orderUrl = getOrderUrl(truck);
    if (orderUrl) container.appendChild(createTextAction('Order online', orderUrl, 'online_ordering_clicked', 'empty_order'));
    if (isHttpUrl(truck.websiteUrl)) container.appendChild(createTextAction('Visit website', truck.websiteUrl));
    const social = usefulSocialLinks(truck)[0];
    if (social) container.appendChild(createTextAction(`Check ${socialLabel(social)}`, social));
    if (includeNearby) container.appendChild(createTextAction('Explore nearby trucks', '#nearby'));
  }

  function renderMenu(truck) {
    const items = asArray(truck.menu).filter((item) => item && typeof item === 'object' && asText(item.name));
    const photos = menuPhotos(truck);
    const visibleItems = state.showFullMenu ? items : items.slice(0, MENU_PREVIEW_LIMIT);
    selectors.menuFeature.textContent = '';
    selectors.menuList.textContent = '';

    if (photos.length) {
      const photo = photos[0];
      const featureButton = document.createElement('button');
      featureButton.type = 'button';
      featureButton.className = 'menu-feature-photo';
      featureButton.setAttribute('aria-label', `Open photographed menu for ${truck.name}`);
      const featureImage = createImage(photo, `Photographed menu for ${truck.name}`, {width: 900, height: 1200});
      featureButton.appendChild(featureImage);
      const photoIndex = state.gallery.findIndex((item) => item.url === photo);
      featureButton.addEventListener('click', () => openGalleryAt(photoIndex >= 0 ? photoIndex : 0, featureButton));
      const copy = document.createElement('div');
      copy.className = 'menu-feature-copy';
      const title = document.createElement('strong');
      title.textContent = items.length ? `${items.length} menu item${items.length === 1 ? '' : 's'}` : 'Photographed menu';
      const detail = document.createElement('p');
      detail.textContent = 'Open the menu photo for a closer look.';
      copy.append(title, detail);
      selectors.menuFeature.append(featureButton, copy);
      selectors.menuFeature.hidden = false;
    } else {
      selectors.menuFeature.hidden = true;
    }

    visibleItems.forEach((item) => selectors.menuList.appendChild(createMenuCard(item, truck.name)));
    const menuAvailable = items.length > 0 || photos.length > 0;
    selectors.menuEmpty.hidden = menuAvailable;
    if (!menuAvailable) renderAlternativeLinks(selectors.menuAlternatives, truck, false);

    const expandable = items.length > MENU_PREVIEW_LIMIT;
    selectors.menuFooterAction.hidden = !expandable;
    selectors.toggleMenu.hidden = true;
    if (expandable) {
      const label = state.showFullMenu ? 'Show Menu Preview' : 'View Full Menu';
      selectors.menuFooterAction.textContent = label;
      selectors.menuFooterAction.setAttribute('aria-expanded', String(state.showFullMenu));
    }
    activateLazyImages(selectors.menuSection);
  }

  function renderSchedule(truck) {
    const visibleEntries = state.showFullSchedule
      ? state.schedule.slice(0, SCHEDULE_FULL_LIMIT)
      : state.schedule.slice(0, SCHEDULE_PREVIEW_LIMIT);
    selectors.scheduleList.textContent = '';
    visibleEntries.forEach((entry, index) => {
      const item = document.createElement('li');
      item.className = `schedule-item${index === 0 ? ' schedule-item--next' : ''}`;
      const date = document.createElement('div');
      date.className = 'schedule-date';
      const day = document.createElement('strong');
      day.textContent = relativeDayLabel(entry.start);
      const time = document.createElement('span');
      time.textContent = `${formatTime(entry.start)}${entry.end ? ` – ${formatTime(entry.end)}` : ''}`;
      date.append(day, time);
      const details = document.createElement('div');
      details.className = 'schedule-details';
      const venue = document.createElement('strong');
      venue.textContent = entry.venue || (index === 0 ? 'Next scheduled stop' : 'Scheduled stop');
      details.appendChild(venue);
      if (entry.address) {
        const address = document.createElement('span');
        address.textContent = entry.address;
        details.appendChild(address);
      }
      item.append(date, details);
      if (entry.address) {
        item.appendChild(createTrackedAction({
          label: 'Directions', href: buildDirectionsUrl(truck, entry.address), external: true,
          className: 'schedule-direction', icon: 'directions', eventName: 'directions_clicked', action: 'schedule_directions',
        }));
      }
      selectors.scheduleList.appendChild(item);
    });

    selectors.scheduleEmpty.hidden = state.schedule.length > 0;
    if (!state.schedule.length) renderAlternativeLinks(selectors.scheduleAlternatives, truck, true);
    const expandable = state.schedule.length > SCHEDULE_PREVIEW_LIMIT;
    selectors.toggleSchedule.hidden = !expandable;
    if (expandable) {
      selectors.toggleSchedule.textContent = state.showFullSchedule ? 'Show Next 3' : 'View Full Schedule';
      selectors.toggleSchedule.setAttribute('aria-expanded', String(state.showFullSchedule));
    }
  }

  function renderGallery(truck) {
    const name = asText(truck.name) || 'Food truck';
    const truckImageUrls = truckPhotos(truck);
    const menuImageUrls = menuPhotos(truck);
    state.gallery = uniqueUrls([...truckImageUrls, ...menuImageUrls]).map((url, index) => ({
      url,
      alt: truckImageUrls.includes(url) ? `${name} food truck` : `Food or menu photo from ${name}`,
      title: truckImageUrls.includes(url) ? `${name} photo` : `${name} menu photo ${index + 1}`,
    }));
    selectors.galleryList.textContent = '';
    if (!state.gallery.length) {
      selectors.gallerySection.hidden = true;
      return;
    }
    state.gallery.forEach((photo, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gallery-photo';
      button.setAttribute('aria-label', `Open ${photo.title}`);
      const optimized = optimizedHeroFor(photo.url);
      const previewUrl = optimized && photo.url === truckImageUrls[0]
        ? optimized.src
        : photo.url;
      button.appendChild(createImage(previewUrl, photo.alt, {width: 800, height: 600}));
      const label = document.createElement('span');
      label.textContent = 'View photo';
      button.appendChild(label);
      button.addEventListener('click', () => openGalleryAt(index, button));
      selectors.galleryList.appendChild(button);
    });
    selectors.galleryCount.textContent = `${state.gallery.length} photo${state.gallery.length === 1 ? '' : 's'}`;
    selectors.gallerySection.hidden = false;
    activateLazyImages(selectors.gallerySection);
  }

  function createFact(label, value) {
    const wrapper = document.createElement('div');
    wrapper.className = 'about-fact';
    const term = document.createElement('dt');
    term.textContent = label;
    const detail = document.createElement('dd');
    detail.textContent = value;
    wrapper.append(term, detail);
    return wrapper;
  }

  function createContactLink(label, detail, href, iconName) {
    const link = document.createElement('a');
    link.className = 'contact-link';
    link.href = href;
    if (isHttpUrl(href)) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    link.appendChild(icon(iconName));
    const copy = document.createElement('span');
    copy.textContent = detail ? `${label} · ${detail}` : label;
    link.appendChild(copy);
    return link;
  }

  function renderAbout(truck) {
    selectors.aboutFacts.textContent = '';
    selectors.contactLinks.textContent = '';
    const description = asText(truck.description);
    selectors.aboutDescription.textContent = description;
    selectors.aboutDescription.hidden = !description;
    const cuisines = asArray(truck.cuisines).map(asText).filter(Boolean).filter((item) => item.toLowerCase() !== 'food trucks');
    if (cuisines.length) selectors.aboutFacts.appendChild(createFact('Cuisine', cuisines.join(', ')));
    const dietary = asArray(truck.dietaryOptions).map(asText).filter(Boolean);
    if (dietary.length) selectors.aboutFacts.appendChild(createFact('Dietary options', dietary.join(', ')));
    const location = compactLocationLabel(truck);
    if (location) selectors.aboutFacts.appendChild(createFact('Area', location));
    const locationTypes = {stationary: 'Stationary location', mobile: 'Mobile truck', event_based: 'Event-based service'};
    if (locationTypes[truck.locationType]) selectors.aboutFacts.appendChild(createFact('Service type', locationTypes[truck.locationType]));

    const phone = asText(truck.businessPhone);
    if (phone) selectors.contactLinks.appendChild(createContactLink('Call', phone, `tel:${phone.replace(/[^\d+]/g, '')}`, 'call'));
    if (isHttpUrl(truck.websiteUrl)) selectors.contactLinks.appendChild(createContactLink('Website', '', truck.websiteUrl, 'globe'));
    usefulSocialLinks(truck).forEach((url) => selectors.contactLinks.appendChild(createContactLink(socialLabel(url), '', url, 'external')));
    const cateringUrl = [truck.cateringUrl, truck.bookingUrl, truck.eventInquiryUrl].map(asText).find(isHttpUrl);
    if (cateringUrl) selectors.contactLinks.appendChild(createContactLink('Catering & events', '', cateringUrl, 'external'));
    selectors.aboutSection.hidden = !description && !selectors.aboutFacts.children.length && !selectors.contactLinks.children.length;
  }

  function clearMobileActions() {
    state.mobileActionObserver?.disconnect();
    state.mobileActionObserver = null;
    selectors.mobileActions.textContent = '';
    selectors.mobileActionBar.hidden = true;
    selectors.mobileActionBar.classList.remove('mobile-action-bar--suppressed');
    document.body.classList.remove('has-mobile-actions');
  }

  function setupMobileBarVisibility() {
    if (!('IntersectionObserver' in window) || !selectors.primaryActions) return;
    state.mobileActionObserver?.disconnect();
    state.mobileActionObserver = new IntersectionObserver((entries) => {
      const primaryActionsVisible = entries.some((entry) => entry.isIntersecting);
      selectors.mobileActionBar.classList.toggle('mobile-action-bar--suppressed', primaryActionsVisible);
    }, {threshold: 0.2});
    state.mobileActionObserver.observe(selectors.primaryActions);
  }

  function renderMobileActions(truck) {
    clearMobileActions();
    const actions = [];
    const orderUrl = getOrderUrl(truck);
    const directionsUrl = hasDirectionsTarget(truck) ? buildDirectionsUrl(truck) : '';
    const menuAvailable = hasMenu(truck);
    if (directionsUrl) {
      actions.push({label: 'Directions', href: directionsUrl, external: true, icon: 'directions', eventName: 'directions_clicked', action: 'mobile_directions'});
    }
    if (menuAvailable) {
      actions.push({label: 'Menu', href: '#menu', icon: 'menu', eventName: 'menu_opened', action: 'mobile_menu'});
    }
    if (orderUrl) {
      actions.push({label: 'Order', href: orderUrl, external: true, icon: 'order', eventName: 'online_ordering_clicked', action: 'mobile_order'});
    }
    const priorityAction = orderUrl ? 'Order' : directionsUrl ? 'Directions' : menuAvailable ? 'Menu' : '';
    actions.slice(0, 3).forEach((action) => {
      const element = createTrackedAction(Object.assign({}, action, {
        className: `mobile-action${action.label === priorityAction ? ' mobile-action--primary' : ''}`,
        primary: action.label === priorityAction,
      }));
      selectors.mobileActions.appendChild(element);
    });
    if (selectors.mobileActions.children.length) {
      selectors.mobileActions.style.setProperty('--mobile-action-count', String(selectors.mobileActions.children.length));
      selectors.mobileActionBar.hidden = false;
      document.body.classList.add('has-mobile-actions');
      setupMobileBarVisibility();
    }
  }

  function nearbyStatus(truck) {
    const schedule = getScheduleEntries(truck);
    const service = analyzeService(truck, schedule);
    if (service.type === 'serving') return 'Serving now';
    if (service.next) return `Next stop ${relativeDayLabel(service.next.start).toLowerCase()}`;
    return '';
  }

  function createNearbyCard(item) {
    const card = document.createElement('article');
    card.className = 'nearby-card';
    const link = document.createElement('a');
    link.href = item.href || buildPublicUrl(item.id, item.name);
    link.addEventListener('click', () => trackEvent('nearby_truck_selected', {action: item.id || item.slug || 'nearby'}));
    if (item.image && isRealPhotoUrl(item.image)) {
      link.appendChild(createImage(item.image, `${item.name} food truck`, {className: 'nearby-photo', width: 640, height: 400}));
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'nearby-fallback';
      fallback.textContent = item.name;
      link.appendChild(fallback);
    }
    const body = document.createElement('div');
    body.className = 'nearby-card-body';
    const name = document.createElement('strong');
    name.textContent = item.name;
    body.appendChild(name);
    const details = [item.cuisine, item.location].filter(Boolean).join(' · ');
    if (details) {
      const meta = document.createElement('span');
      meta.className = 'nearby-meta';
      meta.textContent = details;
      body.appendChild(meta);
    }
    if (item.status) {
      const status = document.createElement('span');
      status.className = 'nearby-status';
      status.textContent = item.status;
      body.appendChild(status);
    }
    link.appendChild(body);
    card.appendChild(link);
    return card;
  }

  function renderNearbyItems(items) {
    selectors.nearbyList.textContent = '';
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'nearby-loading';
      const link = document.createElement('a');
      link.href = '../#foodies';
      link.className = 'text-link';
      link.textContent = 'Explore more food trucks';
      empty.appendChild(link);
      selectors.nearbyList.appendChild(empty);
      return;
    }
    items.slice(0, NEARBY_LIMIT).forEach((item) => selectors.nearbyList.appendChild(createNearbyCard(item)));
    activateLazyImages(selectors.nearbySection);
  }

  async function loadStaticNearbyFallback(truck) {
    try {
      const response = await fetch('../data/public-growth-pages.json', {cache: 'force-cache'});
      if (!response.ok) throw new Error('Nearby fallback unavailable');
      const data = await response.json();
      const targetState = stateFromText(truck.currentAddress || truck.state);
      const candidates = asArray(data.trucks).filter((item) => {
        return asText(item.name).toLowerCase() !== asText(truck.name).toLowerCase()
          && (!targetState || stateFromText(item.region) === targetState);
      }).slice(0, NEARBY_LIMIT).map((item) => ({
        slug: item.slug,
        name: item.name,
        cuisine: item.cuisine,
        location: [item.city, stateFromText(item.region)].filter(Boolean).join(', '),
        image: new URL(`../${item.image}`, window.location.href).toString(),
        status: '',
        href: new URL(`../truck/${item.slug}/`, window.location.href).toString(),
      }));
      renderNearbyItems(candidates);
    } catch {
      renderNearbyItems([]);
    }
  }

  async function loadNearby(truck) {
    const origin = coordinatesFor(truck);
    if (!origin) {
      await loadStaticNearbyFallback(truck);
      return;
    }
    try {
      // Keep the first public query intentionally tight so its bounded result set is genuinely local.
      // A broad latitude-ordered scan can fill its limit before it reaches the profile's own city.
      const latitudeRange = 0.18;
      const longitudeRange = Math.min(0.45, latitudeRange / Math.max(0.35, Math.cos(origin.latitude * Math.PI / 180)));
      const fieldFilter = (fieldPath, op, doubleValue) => ({
        fieldFilter: {field: {fieldPath}, op, value: {doubleValue}},
      });
      const documents = await runFirestoreQuery({
        select: publicTruckProjection(),
        from: [{collectionId: 'foodTrucks'}],
        where: {
          compositeFilter: {
            op: 'AND',
            filters: [
              fieldFilter('latitude', 'GREATER_THAN_OR_EQUAL', origin.latitude - latitudeRange),
              fieldFilter('latitude', 'LESS_THAN_OR_EQUAL', origin.latitude + latitudeRange),
              fieldFilter('longitude', 'GREATER_THAN_OR_EQUAL', origin.longitude - longitudeRange),
              fieldFilter('longitude', 'LESS_THAN_OR_EQUAL', origin.longitude + longitudeRange),
            ],
          },
        },
        orderBy: [
          {field: {fieldPath: 'latitude'}, direction: 'ASCENDING'},
          {field: {fieldPath: 'longitude'}, direction: 'ASCENDING'},
        ],
        limit: 24,
      });
      const seenNames = new Set();
      const seenImages = new Set();
      const candidates = [];
      documents.forEach((candidate) => {
        if (candidate.id === state.truckId) return;
        if (!asText(candidate.name) || candidate.archived === true || candidate.isMapHidden === true) return;
        const coordinates = coordinatesFor(candidate);
        if (!coordinates) return;
        const nameKey = asText(candidate.name).toLowerCase();
        const imageUrl = truckPhotos(candidate)[0] || menuPhotos(candidate)[0] || '';
        const imageKey = imageUrl ? normalizedUrlKey(imageUrl) : '';
        if (seenNames.has(nameKey) || (imageKey && seenImages.has(imageKey))) return;
        seenNames.add(nameKey);
        if (imageKey) seenImages.add(imageKey);
        const miles = distanceMiles(origin, coordinates);
        const distanceIsTrusted = Boolean(directionsCoordinatesFor(truck) && directionsCoordinatesFor(candidate));
        const cuisines = asArray(candidate.cuisines).map(asText).filter((item) => item && item.toLowerCase() !== 'food trucks');
        candidates.push({
          id: candidate.id,
          name: candidate.name,
          cuisine: cuisines[0] || '',
          location: distanceIsTrusted && Number.isFinite(miles)
            ? (miles < 0.1 ? (compactLocationLabel(candidate) || 'Nearby') : `${miles.toFixed(miles < 10 ? 1 : 0)} mi away`)
            : (compactLocationLabel(candidate) || 'Nearby'),
          image: imageUrl,
          status: nearbyStatus(candidate),
          distance: miles,
        });
      });
      candidates.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      if (candidates.length) renderNearbyItems(candidates);
      else await loadStaticNearbyFallback(truck);
    } catch {
      await loadStaticNearbyFallback(truck);
    }
  }

  function scheduleNearbyLoad(truck) {
    state.nearbyObserver?.disconnect();
    state.nearbyLoaded = false;
    const start = () => {
      if (state.nearbyLoaded) return;
      state.nearbyLoaded = true;
      state.nearbyObserver?.disconnect();
      void loadNearby(truck);
    };
    if (!('IntersectionObserver' in window) || !selectors.nearbySection) {
      start();
      return;
    }
    state.nearbyObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) start();
    }, {rootMargin: '640px 0px'});
    state.nearbyObserver.observe(selectors.nearbySection);
  }

  function renderTruck(truck) {
    state.truck = truck;
    state.showFullMenu = false;
    state.showFullSchedule = false;
    state.publicUrl = buildPublicUrl(state.truckId, truck.name);
    state.schedule = getScheduleEntries(truck);
    const service = analyzeService(truck, state.schedule);

    setDocumentMeta(truck);
    renderHeroPhoto(truck);
    selectors.truckName.textContent = asText(truck.name);
    const location = compactLocationLabel(truck);
    selectors.locationSummary.textContent = location;
    selectors.locationSummary.hidden = !location;
    renderCuisines(truck);
    const description = asText(truck.description);
    selectors.truckDescription.textContent = description;
    selectors.truckDescription.hidden = !description;
    selectors.heroStatus.textContent = service.label;
    selectors.heroStatusDetail.textContent = service.detail;
    selectors.serviceSummary.classList.remove('status--serving', 'status--scheduled', 'status--closed');
    if (service.type === 'serving') selectors.serviceSummary.classList.add('status--serving');
    if (service.type === 'scheduled') selectors.serviceSummary.classList.add('status--scheduled');
    renderTrust(truck);
    renderHeroActions(truck);
    renderGallery(truck);
    renderToday(truck, service);
    renderMenu(truck);
    renderSchedule(truck);
    renderAbout(truck);
    renderMobileActions(truck);

    const mobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    selectors.openApp.href = mobileDevice
      ? buildAppHandoffUrl(state.truckId, truck.name)
      : new URL('/get-app/', window.location.origin).toString();
    selectors.openApp.textContent = mobileDevice ? 'Open in App' : 'Get the App';
    selectors.openApp.dataset.appAction = mobileDevice ? 'open_app_promo' : 'get_app_promo';
    selectors.claimLink.href = buildClaimUrl(truck);
    if (window.FTFAttribution) {
      window.FTFAttribution.captureFromLocation?.();
      window.FTFAttribution.decorateLinks?.('a[href*="claim-your-food-truck"], a[href*="/open/"], a[href*="/get-app/"]');
    }
    setView('truck');
    hydrateGrantedLocation();
    scheduleNearbyLoad(truck);
  }

  function isPublicTruck(truck) {
    return Boolean(asText(truck && truck.name))
      && truck.archived !== true
      && truck.isMapHidden !== true;
  }

  function showTemporaryError() {
    const name = state.requestedName;
    selectors.temporaryMessage.textContent = name
      ? `We couldn’t load the latest details for ${name}. Please check your connection and try again.`
      : 'Please check your connection and try again.';
    setView('temporary');
  }

  function showNotFound(message) {
    selectors.notFoundMessage.textContent = message || 'We couldn’t find the requested profile, but there are more trucks to discover.';
    setView('notFound');
  }

  async function loadTruck(options) {
    const isRetry = Boolean(options && options.retry);
    const attempt = ++state.loadAttempt;
    if (isRetry) trackEvent('retry_after_loading_error', {action: 'retry'});
    setView('loading');
    const request = getRequestContext();
    state.truckId = request.id;
    state.requestedName = request.name;
    state.publicUrl = request.id ? buildPublicUrl(request.id, request.name) : window.location.href;

    if (!state.truckId || state.truckId.includes('/')) {
      showNotFound('This link is missing a valid truck ID. Try finding the truck again.');
      return;
    }

    try {
      const referenceValue = `projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/foodTrucks/${state.truckId}`;
      const bootstrapRequest = window.__FTF_PROFILE_REQUEST__;
      let documents;
      if (!isRetry && bootstrapRequest && bootstrapRequest.id === state.truckId) {
        const result = await bootstrapRequest.promise;
        if (!result.ok) {
          const bootstrapError = new Error('Initial truck request failed');
          bootstrapError.code = result.status === 403 ? 'permission-denied' : (result.error || `http-${result.status}`);
          throw bootstrapError;
        }
        documents = decodeFirestoreRows(result.rows);
      } else {
        documents = await runFirestoreQuery({
          select: publicTruckProjection(),
          from: [{collectionId: 'foodTrucks'}],
          where: {
            fieldFilter: {
              field: {fieldPath: '__name__'},
              op: 'EQUAL',
              value: {referenceValue},
            },
          },
          limit: 1,
        });
      }
      if (attempt !== state.loadAttempt) return;
      if (!documents.length) {
        showNotFound();
        return;
      }
      const truck = documents[0];
      if (!isPublicTruck(truck)) {
        showNotFound('This profile is not publicly available. It may have moved or been removed.');
        return;
      }
      if (window.__FTF_MEDIA_PROMISE__) {
        await Promise.race([
          window.__FTF_MEDIA_PROMISE__,
          new Promise((resolve) => window.setTimeout(resolve, 1500)),
        ]);
      }
      if (attempt !== state.loadAttempt) return;
      renderTruck(truck);
    } catch (error) {
      if (attempt !== state.loadAttempt) return;
      const code = asText(error && error.code).toLowerCase();
      console.error('Truck profile request failed:', code || 'unknown error');
      showTemporaryError();
    }
  }

  function toggleFullMenu() {
    if (!state.truck) return;
    state.showFullMenu = !state.showFullMenu;
    if (state.showFullMenu) trackEvent('menu_opened', {action: 'full_menu'});
    renderMenu(state.truck);
  }

  function toggleFullSchedule() {
    if (!state.truck) return;
    state.showFullSchedule = !state.showFullSchedule;
    if (state.showFullSchedule) trackEvent('schedule_expanded', {action: 'full_schedule'});
    renderSchedule(state.truck);
  }

  function bindStaticEvents() {
    selectors.shareButton?.addEventListener('click', shareTruck);
    selectors.retry?.addEventListener('click', () => loadTruck({retry: true}));
    selectors.menuFooterAction?.addEventListener('click', toggleFullMenu);
    selectors.toggleMenu?.addEventListener('click', toggleFullMenu);
    selectors.toggleSchedule?.addEventListener('click', toggleFullSchedule);
    selectors.photoDialogClose?.addEventListener('click', closePhotoDialog);
    selectors.photoPrevious?.addEventListener('click', () => movePhoto(-1));
    selectors.photoNext?.addEventListener('click', () => movePhoto(1));
    selectors.photoDialog?.addEventListener('click', (event) => {
      if (event.target === selectors.photoDialog) closePhotoDialog();
    });
    selectors.photoDialog?.addEventListener('close', () => {
      selectors.photoDialogImage.removeAttribute('src');
      const trigger = state.lastPhotoTrigger;
      trigger?.focus?.({preventScroll: true});
      state.lastPhotoTrigger = null;
      const scrollPosition = state.photoScrollPosition;
      state.photoScrollPosition = null;
      if (scrollPosition) {
        const restoreVisualPosition = () => {
          if (trigger?.isConnected && Number.isFinite(scrollPosition.triggerTop)) {
            const visualShift = trigger.getBoundingClientRect().top - scrollPosition.triggerTop;
            if (Math.abs(visualShift) > 0.5) window.scrollBy(0, visualShift);
          } else {
            window.scrollTo(scrollPosition.x, scrollPosition.y);
          }
        };
        window.requestAnimationFrame(() => {
          restoreVisualPosition();
          window.requestAnimationFrame(restoreVisualPosition);
        });
        state.photoRestoreTimer = window.setTimeout(() => {
          restoreVisualPosition();
          state.photoRestoreTimer = 0;
        }, 100);
      }
    });
    document.addEventListener('keydown', (event) => {
      if (!selectors.photoDialog?.open) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        movePhoto(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        movePhoto(1);
      }
      if (event.key === 'Tab') {
        const focusable = [...selectors.photoDialog.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
          .filter((element) => !element.hidden && element.getClientRects().length > 0);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !selectors.photoDialog.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !selectors.photoDialog.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    selectors.openApp?.addEventListener('click', () => trackEvent('app_opened_or_downloaded', {
      action: selectors.openApp.dataset.appAction || 'open_app_promo',
    }));
    selectors.appStore?.addEventListener('click', () => trackEvent('app_opened_or_downloaded', {action: 'app_store'}));
    selectors.playStore?.addEventListener('click', () => trackEvent('app_opened_or_downloaded', {action: 'google_play'}));
    selectors.claimLink?.addEventListener('click', () => trackEvent('owner_claim_started', {action: 'claim_profile'}));
  }

  bindStaticEvents();
  void loadTruck();
})();
