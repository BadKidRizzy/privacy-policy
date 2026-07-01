const firebaseConfig = {
  apiKey: 'AIzaSyBWg6A7bQMEXGXhRiXyw_G6v54OqYbhGhc',
  authDomain: 'food-truck-finder-prod.firebaseapp.com',
  projectId: 'food-truck-finder-prod',
  storageBucket: 'food-truck-finder-prod.firebasestorage.app',
  messagingSenderId: '862144269606',
  appId: '1:862144269606:ios:87e34a7659daae408d05e7',
};

const FALLBACK_IMAGE = '../assets/media/seed/food-truck-photo-pending.png';
const MENU_PREVIEW_LIMIT = 8;
const STATE_NAMES = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  'district of columbia': 'DC',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
};
const STREET_SUFFIXES = new Set([
  'aly',
  'alley',
  'ave',
  'avenue',
  'blvd',
  'boulevard',
  'cir',
  'circle',
  'ct',
  'court',
  'dr',
  'drive',
  'hwy',
  'highway',
  'ln',
  'lane',
  'pkwy',
  'parkway',
  'pl',
  'place',
  'rd',
  'road',
  'rte',
  'route',
  'sq',
  'square',
  'st',
  'street',
  'ter',
  'terrace',
  'trl',
  'trail',
  'way',
]);

const selectors = {
  loadingView: document.querySelector('[data-loading-view]'),
  errorView: document.querySelector('[data-error-view]'),
  errorMessage: document.querySelector('[data-error-message]'),
  truckView: document.querySelector('[data-truck-view]'),
  truckImage: document.querySelector('[data-truck-image]'),
  openState: document.querySelector('[data-open-state]'),
  truckName: document.querySelector('[data-truck-name]'),
  truckDescription: document.querySelector('[data-truck-description]'),
  cuisineList: document.querySelector('[data-cuisine-list]'),
  openApp: document.querySelector('[data-open-app]'),
  directions: document.querySelector('[data-directions]'),
  orderLink: document.querySelector('[data-order-link]'),
  truckAddress: document.querySelector('[data-truck-address]'),
  copyAddress: document.querySelector('[data-copy-address]'),
  menuCount: document.querySelector('[data-menu-count]'),
  jumpMenu: document.querySelector('[data-jump-menu]'),
  menuSection: document.querySelector('[data-menu-section]'),
  menuTitle: document.querySelector('[data-menu-title]'),
  menuList: document.querySelector('[data-menu-list]'),
  toggleMenu: document.querySelector('[data-toggle-menu]'),
  gallerySection: document.querySelector('[data-gallery-section]'),
  galleryList: document.querySelector('[data-gallery-list]'),
  galleryCount: document.querySelector('[data-gallery-count]'),
  scheduleList: document.querySelector('[data-schedule-list]'),
  linkStack: document.querySelector('[data-link-stack]'),
  shareText: document.querySelector('[data-share-text]'),
  copyButtons: Array.from(document.querySelectorAll('[data-copy-link]')),
  nativeShare: document.querySelector('[data-native-share]'),
  claimLink: document.querySelector('[data-claim-link]'),
  claimModal: document.querySelector('[data-claim-modal]'),
  claimModalClose: document.querySelector('[data-claim-modal-close]'),
  claimModalEmail: document.querySelector('[data-claim-modal-email]'),
  claimSummary: document.querySelector('[data-claim-summary]'),
  photoModal: document.querySelector('[data-photo-modal]'),
  photoModalClose: document.querySelector('[data-photo-modal-close]'),
  photoModalImage: document.querySelector('[data-photo-modal-image]'),
  photoModalTitle: document.querySelector('[data-photo-modal-title]'),
  toast: document.querySelector('[data-toast]'),
};

const state = {
  truck: null,
  truckId: '',
  publicShareUrl: '',
  shareUrl: '',
  showFullMenu: false,
  pageWasHidden: false,
  lastPhotoTrigger: null,
};

function getTruckId() {
  const params = new URLSearchParams(window.location.search);
  const queryId = params.get('id') || params.get('truck') || '';
  const pathParts = window.location.pathname.split('/').filter(Boolean);

  if (queryId) {
    return queryId.trim();
  }

  if (pathParts[0] === 'truck' && pathParts[1]) {
    return decodeURIComponent(pathParts[1]).trim();
  }

  return '';
}

function setView(view) {
  selectors.loadingView.hidden = view !== 'loading';
  selectors.errorView.hidden = view !== 'error';
  selectors.truckView.hidden = view !== 'truck';
}

function setError(message) {
  selectors.errorMessage.textContent = message;
  setView('error');
}

function asText(value) {
  return String(value ?? '').trim();
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
    const stateMatch = part.match(/^([A-Za-z]{2})(?:\s+\d{5}(?:-\d{4})?)?$/);
    if (stateMatch) return stateMatch[1].toUpperCase();
    const state = STATE_NAMES[part.toLowerCase()];
    if (state) return state;
  }

  const normalized = ` ${raw.toLowerCase().replace(/[^a-z]+/g, ' ').trim()} `;
  return Object.entries(STATE_NAMES).find(([name]) => normalized.includes(` ${name} `))?.[1] || '';
}

function stripStreetPrefix(value) {
  const cleaned = cleanLocationPart(value).replace(/(?:\s+|^)\d{5}(?:-\d{4})?$/, '').trim();
  if (!cleaned) return '';

  const tokens = cleaned.split(' ');
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const normalized = tokens[index].toLowerCase().replace(/\./g, '');
    const hasStreetNumber = tokens.slice(0, index).some((token) => /\d/.test(token));
    if (STREET_SUFFIXES.has(normalized) && hasStreetNumber) {
      return tokens.slice(index + 1).join(' ').trim();
    }
  }

  return cleaned;
}

function cityFromText(value) {
  const raw = cleanLocationPart(value);
  if (!raw) return '';

  const parts = raw.split(',').map(cleanLocationPart).filter(Boolean);
  const lastPart = (parts[parts.length - 1] || '').toLowerCase();
  const hasCountrySuffix = ['usa', 'us', 'united states', 'united states of america'].includes(lastPart);
  const candidate = hasCountrySuffix && parts.length >= 3
    ? parts[parts.length - 3]
    : parts.length >= 3
      ? parts[parts.length - 2]
      : parts[0];
  return stripStreetPrefix(candidate);
}

function compactLocationLabel(truck) {
  const state = stateFromText(truck.currentAddress) || stateFromText(truck.state) || stateFromText(truck.city);
  const city = cityFromText(truck.city) || cityFromText(truck.currentAddress);

  if (city && state && city.toUpperCase() !== state) {
    return `${city}, ${state}`;
  }

  return city || state || '';
}

function asArray(value) {
  return Array.isArray(value) ? value.filter((item) => item != null) : [];
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(asText(value));
}

function isLikelyImageUrl(value) {
  const url = asText(value);
  if (!isHttpUrl(url)) return false;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    if (/\.(?:avif|gif|heic|jpe?g|png|webp)$/i.test(parsed.pathname)) return true;
    return host.includes('firebasestorage.googleapis.com')
      || host.includes('storage.googleapis.com')
      || host.includes('images.squarespace-cdn.com')
      || host.includes('cdn.shopify.com');
  } catch {
    return /\.(?:avif|gif|heic|jpe?g|png|webp)(?:[?#].*)?$/i.test(url);
  }
}

function firstHttpUrl(values) {
  return asArray(values).map(asText).find(isHttpUrl) || '';
}

function formatHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
}

function normalizedUrlKey(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    parsed.hostname = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return asText(url).replace(/\/+$/, '').toLowerCase();
  }
}

function humanizeSocialSlug(value) {
  return decodeURIComponent(asText(value))
    .replace(/^@/, '')
    .replace(/-\d{6,}$/g, '')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function socialProfileHandle(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (!parts.length) return '';
    const first = decodeURIComponent(parts[0]).replace(/^@/, '').trim();
    const firstKey = first.toLowerCase();
    if (!first) return '';
    if (host.includes('facebook')) {
      if (['share', 'watch', 'groups'].includes(firstKey)) return '';
      const pageSegment = ['p', 'pages'].includes(firstKey) && parts[1] ? parts[1] : first;
      return humanizeSocialSlug(pageSegment);
    }
    if (['p', 'reel', 'stories', 'explore', 'accounts', 'share', 'watch', 'pages', 'groups'].includes(firstKey)) return '';
    if (host.includes('instagram') || host.includes('tiktok') || host === 'x.com' || host.includes('twitter')) {
      return `@${first}`;
    }
  } catch {
    return '';
  }
  return '';
}

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

function formatDate(value) {
  const date = getDate(value);
  if (!date) {
    return '';
  }

  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(value) {
  const date = getDate(value);
  if (!date) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function buildShareUrl(truckId, truckName = '') {
  const url = new URL(`/truck/${encodeURIComponent(truckId)}`, window.location.origin);

  if (truckName) {
    url.searchParams.set('name', truckName);
  }

  return url.toString();
}

function buildAppUrl(truckId, includeLaunch = true) {
  const appUrl = `foodtruckfinder:///truck/${encodeURIComponent(truckId)}`;
  return includeLaunch ? `${appUrl}?launch=${Date.now()}` : appUrl;
}

function isIosDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || '';
  return /iPad|iPhone|iPod/i.test(userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isAppUrl(value) {
  return /^foodtruckfinder:\/\//i.test(asText(value));
}

function setShareUrls(truckName = '') {
  if (!state.truckId) {
    state.publicShareUrl = window.location.href;
    state.shareUrl = window.location.href;
    return;
  }

  state.publicShareUrl = buildShareUrl(state.truckId, truckName);
  state.shareUrl = isIosDevice() ? buildAppUrl(state.truckId, false) : state.publicShareUrl;
}

function formatSharePanelText(url) {
  if (isAppUrl(url)) {
    return 'App link ready for iPhone and iPad.';
  }

  return 'Public profile link ready.';
}

function buildDirectionsUrl(truck) {
  const latitude = Number(truck.latitude);
  const longitude = Number(truck.longitude);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latitude},${longitude}`)}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(asText(truck.currentAddress))}`;
}

function hasDirectionsTarget(truck) {
  const latitude = Number(truck.latitude);
  const longitude = Number(truck.longitude);
  return (Number.isFinite(latitude) && Number.isFinite(longitude)) || Boolean(asText(truck.currentAddress));
}

function isPublicAppTruck(truck) {
  const name = asText(truck?.name);
  const ownerId = asText(truck?.ownerId);
  const latitude = Number(truck?.latitude);
  const longitude = Number(truck?.longitude);

  return Boolean(name)
    && Boolean(ownerId)
    && Number.isFinite(latitude)
    && latitude >= -90
    && latitude <= 90
    && Number.isFinite(longitude)
    && longitude >= -180
    && longitude <= 180
    && truck?.isMapHidden !== true
    && truck?.archived !== true;
}

function buildClaimUrl(truck) {
  const truckName = truck.name || 'my truck';
  const city = compactLocationLabel(truck) || truck.city || truck.currentAddress || '';
  const url = new URL('/claim-your-food-truck/', window.location.origin);
  url.searchParams.set('truck', truckName);
  if (city) url.searchParams.set('city', city);
  if (state.publicShareUrl) url.searchParams.set('profile', state.publicShareUrl);
  url.hash = 'claim-form';
  return url.toString();
}

function formatClaimSummary(truck) {
  const location = compactLocationLabel(truck);
  const parts = [
    truck.name || 'This truck',
    location,
  ].filter(Boolean);

  return parts.length > 1
    ? `You are claiming: ${parts[0]} in ${parts[1]}`
    : `You are claiming: ${parts[0]}`;
}

function openClaimModal(event) {
  if (!selectors.claimModal || !selectors.claimModalEmail) {
    return;
  }

  event.preventDefault();
  selectors.claimModal.hidden = false;
  selectors.claimModalEmail.focus();
}

function closeClaimModal() {
  if (!selectors.claimModal) {
    return;
  }

  selectors.claimModal.hidden = true;
  selectors.claimLink?.focus();
}

function continueToClaimEmail() {
  const claimUrl = selectors.claimLink?.href;
  closeClaimModal();

  if (claimUrl) {
    window.location.href = claimUrl;
  }
}

function openPhotoModal(url, altText, title, trigger) {
  if (!selectors.photoModal || !selectors.photoModalImage) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  state.lastPhotoTrigger = trigger || null;
  selectors.photoModal.classList.remove('photo-modal--portrait', 'photo-modal--landscape');
  selectors.photoModalImage.onload = () => {
    const isPortrait = selectors.photoModalImage.naturalHeight > selectors.photoModalImage.naturalWidth;
    selectors.photoModal.classList.toggle('photo-modal--portrait', isPortrait);
    selectors.photoModal.classList.toggle('photo-modal--landscape', !isPortrait);
  };
  selectors.photoModalImage.src = url;
  selectors.photoModalImage.alt = altText || title || 'Food truck photo';
  if (selectors.photoModalTitle) {
    selectors.photoModalTitle.textContent = title || 'Truck photo';
  }
  selectors.photoModal.hidden = false;
  document.body.classList.add('modal-open');
  selectors.photoModalClose?.focus({preventScroll: true});
}

function closePhotoModal() {
  if (!selectors.photoModal) {
    return;
  }

  selectors.photoModal.hidden = true;
  selectors.photoModal.classList.remove('photo-modal--portrait', 'photo-modal--landscape');
  document.body.classList.remove('modal-open');
  if (selectors.photoModalImage) {
    selectors.photoModalImage.onload = null;
    selectors.photoModalImage.removeAttribute('src');
    selectors.photoModalImage.alt = '';
  }
  state.lastPhotoTrigger?.focus?.({preventScroll: true});
  state.lastPhotoTrigger = null;
}

function setDocumentMeta(truck) {
  const title = `${truck.name || 'Food Truck'} | Food Truck Finder`;
  const description = truck.description || `View ${truck.name || 'this food truck'} on Food Truck Finder.`;

  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
}

function createPill(label) {
  const pill = document.createElement('span');
  pill.className = 'pill';
  pill.textContent = label;
  return pill;
}

function renderCuisines(truck) {
  selectors.cuisineList.textContent = '';
  const cuisines = asArray(truck.cuisines)
    .map(asText)
    .filter(Boolean)
    .slice(0, 6);

  cuisines.forEach((cuisine) => selectors.cuisineList.appendChild(createPill(cuisine)));
}

function createMenuItem(item) {
  const row = document.createElement('article');
  row.className = 'menu-item';

  const body = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = asText(item.name) || 'Menu item';
  body.appendChild(name);

  const description = asText(item.description);
  if (description) {
    const desc = document.createElement('span');
    desc.className = 'menu-desc';
    desc.textContent = description;
    body.appendChild(desc);
  }

  const price = document.createElement('div');
  price.className = 'menu-price';
  price.textContent = formatPrice(item.price);

  row.append(body, price);
  return row;
}

function getMenuPhotoUrls(truck) {
  return Array.from(new Set([
    ...asArray(truck.menuImages),
    ...asArray(truck.menuImage ? [truck.menuImage] : []),
    ...asArray(truck.researchMenuImageUrls),
  ].map(asText).filter(isLikelyImageUrl)));
}

function createMenuPhoto(url, index, truckName) {
  const button = document.createElement('button');
  button.className = 'menu-photo';
  button.type = 'button';

  const image = document.createElement('img');
  image.src = url;
  image.alt = `${truckName || 'Food truck'} menu photo ${index + 1}`;
  image.loading = 'lazy';

  const label = document.createElement('span');
  label.textContent = 'View menu photo';

  button.addEventListener('click', () => {
    openPhotoModal(url, image.alt, `Menu photo ${index + 1}`, button);
  });

  button.append(image, label);
  return button;
}

function renderMenu(truck) {
  const menu = asArray(truck.menu).filter((item) => item && typeof item === 'object');
  const menuPhotos = getMenuPhotoUrls(truck);
  const visibleMenu = state.showFullMenu ? menu : menu.slice(0, MENU_PREVIEW_LIMIT);

  selectors.menuList.textContent = '';
  selectors.menuList.classList.toggle('menu-list--photos', menu.length === 0 && menuPhotos.length > 0);
  if (selectors.menuTitle) {
    selectors.menuTitle.textContent = menu.length > 0
      ? 'Popular Items'
      : menuPhotos.length > 0
        ? 'Menu Photos'
        : 'Menu Details';
  }
  selectors.menuCount.textContent = menu.length > 0
    ? `${menu.length} item${menu.length === 1 ? '' : 's'}`
    : menuPhotos.length > 0
      ? `${menuPhotos.length} photo${menuPhotos.length === 1 ? '' : 's'}`
      : 'Menu pending';

  if (menu.length === 0) {
    if (menuPhotos.length > 0) {
      menuPhotos.forEach((url, index) => {
        selectors.menuList.appendChild(createMenuPhoto(url, index, truck.name));
      });
      selectors.toggleMenu.hidden = true;
      return;
    }

    const empty = document.createElement('p');
    empty.className = 'empty-note';
    empty.textContent = 'Menu details are not available yet.';
    selectors.menuList.appendChild(empty);
    selectors.toggleMenu.hidden = true;
    return;
  }

  visibleMenu.forEach((item) => selectors.menuList.appendChild(createMenuItem(item)));

  selectors.toggleMenu.hidden = menu.length <= MENU_PREVIEW_LIMIT;
  selectors.toggleMenu.textContent = state.showFullMenu ? 'Show Less' : `Show All ${menu.length}`;
}

function getGalleryPhotoUrls(truck) {
  const seen = new Set();
  const urls = [];
  const hasStructuredMenu = asArray(truck.menu).some((item) => item && typeof item === 'object');

  if (!hasStructuredMenu) {
    return urls;
  }

  getMenuPhotoUrls(truck).map(asText).filter(isLikelyImageUrl).forEach((url) => {
    const key = normalizedUrlKey(url);
    if (seen.has(key)) return;
    seen.add(key);
    urls.push(url);
  });

  return urls.slice(0, 10);
}

function createGalleryPhoto(url, index, truckName) {
  const button = document.createElement('button');
  button.className = 'gallery-photo';
  button.type = 'button';

  const image = document.createElement('img');
  image.src = url;
  image.alt = `${truckName || 'Food truck'} gallery photo ${index + 1}`;
  image.loading = 'lazy';

  const label = document.createElement('span');
  label.textContent = 'View photo';

  button.addEventListener('click', () => {
    openPhotoModal(url, image.alt, `Photo ${index + 1}`, button);
  });

  button.append(image, label);
  return button;
}

function renderGallery(truck) {
  if (!selectors.gallerySection || !selectors.galleryList) {
    return;
  }

  const photos = getGalleryPhotoUrls(truck);
  selectors.galleryList.textContent = '';

  if (photos.length === 0) {
    selectors.gallerySection.hidden = true;
    if (selectors.galleryCount) selectors.galleryCount.textContent = '';
    return;
  }

  photos.forEach((url, index) => {
    selectors.galleryList.appendChild(createGalleryPhoto(url, index, truck.name));
  });

  selectors.gallerySection.hidden = false;
  if (selectors.galleryCount) {
    selectors.galleryCount.textContent = `${photos.length} photo${photos.length === 1 ? '' : 's'}`;
  }
}

function getScheduleEntries(truck) {
  const special = asArray(truck.specialSchedule)
    .map((entry) => ({
      type: 'Special',
      start: getDate(entry.start),
      end: getDate(entry.end),
      address: asText(entry.address || truck.currentAddress),
    }))
    .filter((entry) => entry.start)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (special.length > 0) {
    return special.slice(0, 5);
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return asArray(truck.recurringSchedule)
    .map((entry) => ({
      type: dayNames[Number(entry.dayOfWeek)] || 'Weekly',
      start: getDate(entry.start),
      end: getDate(entry.end),
      address: asText(entry.address || truck.currentAddress),
    }))
    .filter((entry) => entry.start)
    .slice(0, 7);
}

function renderSchedule(truck) {
  if (!selectors.scheduleList) {
    return;
  }

  const schedule = getScheduleEntries(truck);
  selectors.scheduleList.textContent = '';

  if (schedule.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-note';
    empty.textContent = 'Schedule details are not available yet. Check the truck links or open the app for updates.';
    selectors.scheduleList.appendChild(empty);
    return;
  }

  schedule.forEach((entry) => {
    const row = document.createElement('article');
    row.className = 'schedule-item';

    const title = document.createElement('strong');
    const dateLabel = entry.type === 'Special' ? formatDate(entry.start) : entry.type;
    title.textContent = `${dateLabel} ${formatTime(entry.start)}${entry.end ? ` - ${formatTime(entry.end)}` : ''}`;

    const address = document.createElement('span');
    address.textContent = entry.address || 'Address pending';

    row.append(title, address);
    selectors.scheduleList.appendChild(row);
  });
}

function createLink(label, url, detail = '') {
  const link = document.createElement('a');
  link.className = 'link-item';
  link.href = url;
  link.target = '_blank';
  link.rel = 'noreferrer';

  const title = document.createElement('strong');
  title.textContent = label;
  link.appendChild(title);

  const subtitle = document.createElement('span');
  subtitle.textContent = detail || formatHost(url);
  link.appendChild(subtitle);

  return link;
}

function getOrderUrl(truck) {
  return asText(truck.doordashUrl) || asText(truck.uberEatsUrl) || '';
}

function renderLinks(truck) {
  selectors.linkStack.textContent = '';
  const links = [];
  const seen = new Set();

  function addLink(label, url, detail = '') {
    if (!url) return;
    const key = normalizedUrlKey(url);
    if (seen.has(key)) return;
    seen.add(key);
    links.push([label, url, detail]);
  }

  if (isHttpUrl(truck.websiteUrl)) {
    const websiteSocialLabel = socialLabel(truck.websiteUrl);
    if (websiteSocialLabel) {
      addLink(websiteSocialLabel, truck.websiteUrl, socialDetail(truck.websiteUrl));
    } else {
      addLink('Website', truck.websiteUrl);
    }
  }

  if (isHttpUrl(truck.doordashUrl)) {
    addLink('DoorDash', truck.doordashUrl);
  }

  if (isHttpUrl(truck.uberEatsUrl)) {
    addLink('Uber Eats', truck.uberEatsUrl);
  }

  asArray(truck.socialLinks)
    .map(asText)
    .filter(isHttpUrl)
    .forEach((url) => {
      const label = socialLabel(url);
      if (!label) return;
      addLink(label, url, socialDetail(url));
    });

  const phone = asText(truck.businessPhone);
  if (phone) {
    links.push(['Call', `tel:${phone.replace(/[^\d+]/g, '')}`, phone]);
  }

  if (links.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-note';
    empty.textContent = 'No public links have been added yet.';
    selectors.linkStack.appendChild(empty);
    return;
  }

  links.forEach(([label, url, detail]) => {
    selectors.linkStack.appendChild(createLink(label, url, detail));
  });
}

function socialLabel(url) {
  const host = formatHost(url).toLowerCase();
  if (host.includes('instagram')) return 'Instagram';
  if (host.includes('facebook')) return 'Facebook';
  if (host.includes('tiktok')) return 'TikTok';
  if (host.includes('youtube')) return 'YouTube';
  if (host.includes('x.com') || host.includes('twitter')) return 'X';
  return '';
}

function socialDetail(url) {
  return socialProfileHandle(url) || formatHost(url);
}

function renderTruck(truck) {
  state.truck = truck;
  setShareUrls(truck.name);

  setDocumentMeta(truck);

  selectors.truckImage.src = firstHttpUrl([truck.truckImage, truck.photoSourceUrl]) || FALLBACK_IMAGE;
  selectors.truckImage.alt = `${truck.name || 'Food truck'} photo`;
  selectors.openState.textContent = truck.isFallbackProfile
    ? 'Profile awaiting owner claim'
    : truck.isOpen === true
      ? 'Open Now'
      : 'Food Truck';
  selectors.openState.classList.toggle('status-badge--open', truck.isOpen === true);
  selectors.truckName.textContent = truck.name || 'Food Truck';
  selectors.truckDescription.textContent = truck.description || 'Menu, location, and updates from Food Truck Finder.';
  selectors.openApp.href = buildAppUrl(state.truckId);
  selectors.directions.hidden = !hasDirectionsTarget(truck);
  selectors.directions.href = selectors.directions.hidden ? '#' : buildDirectionsUrl(truck);
  selectors.truckAddress.textContent = truck.currentAddress || 'Address unavailable';
  selectors.shareText.textContent = formatSharePanelText(state.shareUrl);
  selectors.claimLink.href = buildClaimUrl(truck);
  if (selectors.claimSummary) {
    selectors.claimSummary.textContent = formatClaimSummary(truck);
  }

  const orderUrl = getOrderUrl(truck);
  if (isHttpUrl(orderUrl)) {
    selectors.orderLink.href = orderUrl;
    selectors.orderLink.hidden = false;
  } else {
    selectors.orderLink.hidden = true;
  }

  selectors.nativeShare.hidden = !navigator.share;

  renderCuisines(truck);
  renderMenu(truck);
  renderGallery(truck);
  renderSchedule(truck);
  renderLinks(truck);
  setView('truck');
}

function showToast(message) {
  selectors.toast.textContent = message;
  selectors.toast.hidden = false;
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    selectors.toast.hidden = true;
  }, 1800);
}

async function copyShareLink() {
  const value = state.shareUrl || window.location.href;

  try {
    await navigator.clipboard.writeText(value);
    showToast(isAppUrl(value) ? 'Copied app link' : 'Copied link');
  } catch {
    window.prompt('Truck link:', value);
  }
}

async function copyTruckAddress() {
  const value = asText(state.truck?.currentAddress);

  if (!value) {
    showToast('Address unavailable');
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    showToast('Copied address');
  } catch {
    window.prompt('Truck address:', value);
  }
}

function jumpToMenu() {
  selectors.menuSection?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

function handleOpenApp(event) {
  event.preventDefault();
  state.pageWasHidden = false;

  window.location.href = buildAppUrl(state.truckId);

  window.setTimeout(() => {
    if (state.pageWasHidden) {
      return;
    }

    showToast('App not opening? Use the store links below.');
  }, 1400);
}

async function nativeShare() {
  if (!navigator.share || !state.truck) {
    return;
  }

  try {
    const text = state.truck.description || 'View this food truck on Food Truck Finder.';
    let shareData = {
      title: `${state.truck.name || 'Food Truck'} on Food Truck Finder`,
      text,
      url: state.shareUrl,
    };

    if (navigator.canShare && !navigator.canShare(shareData)) {
      shareData = {
        title: shareData.title,
        text: `${text}\n${state.shareUrl}`,
      };
    }

    if (navigator.canShare && !navigator.canShare(shareData)) {
      return;
    }

    await navigator.share(shareData);
  } catch {
    return;
  }
}

async function loadTruck() {
  state.truckId = getTruckId();
  setShareUrls();

  selectors.shareText.textContent = formatSharePanelText(state.shareUrl);
  selectors.copyButtons.forEach((button) => button.addEventListener('click', copyShareLink));
  selectors.copyAddress?.addEventListener('click', copyTruckAddress);
  selectors.jumpMenu?.addEventListener('click', jumpToMenu);
  selectors.openApp?.addEventListener('click', handleOpenApp);
  selectors.nativeShare?.addEventListener('click', nativeShare);
  selectors.claimLink?.addEventListener('click', openClaimModal);
  selectors.claimModalClose?.addEventListener('click', closeClaimModal);
  selectors.claimModalEmail?.addEventListener('click', continueToClaimEmail);
  selectors.claimModal?.addEventListener('click', (event) => {
    if (event.target === selectors.claimModal) {
      closeClaimModal();
    }
  });
  selectors.photoModalClose?.addEventListener('click', closePhotoModal);
  selectors.photoModal?.addEventListener('click', (event) => {
    if (event.target === selectors.photoModal) {
      closePhotoModal();
    }
  });
  selectors.toggleMenu?.addEventListener('click', () => {
    state.showFullMenu = !state.showFullMenu;
    renderMenu(state.truck);
  });

  if (!state.truckId) {
    setError('This link is missing a truck ID.');
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    const snapshot = await firebase.firestore().collection('foodTrucks').doc(state.truckId).get();

    if (!snapshot.exists) {
      setError('This truck could not be found.');
      return;
    }

    const truck = {id: snapshot.id, ...snapshot.data()};
    if (!isPublicAppTruck(truck)) {
      setError('This truck page is not available right now.');
      return;
    }

    renderTruck(truck);
  } catch (error) {
    console.error('Truck page load failed:', error);
    setError('This truck page could not load. Try again in a moment.');
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    state.pageWasHidden = true;
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && selectors.photoModal && !selectors.photoModal.hidden) {
    closePhotoModal();
    return;
  }

  if (event.key === 'Escape' && selectors.claimModal && !selectors.claimModal.hidden) {
    closeClaimModal();
  }
});
window.addEventListener('pagehide', () => {
  state.pageWasHidden = true;
});

loadTruck();
