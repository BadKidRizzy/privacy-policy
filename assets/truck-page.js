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
const SUPPORT_EMAIL = 'Foodtruckfinderinfo@gmail.com';

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
  menuCount: document.querySelector('[data-menu-count]'),
  shareUrl: document.querySelector('[data-share-url]'),
  menuList: document.querySelector('[data-menu-list]'),
  toggleMenu: document.querySelector('[data-toggle-menu]'),
  scheduleList: document.querySelector('[data-schedule-list]'),
  linkStack: document.querySelector('[data-link-stack]'),
  shareText: document.querySelector('[data-share-text]'),
  copyButtons: Array.from(document.querySelectorAll('[data-copy-link]')),
  nativeShare: document.querySelector('[data-native-share]'),
  claimLink: document.querySelector('[data-claim-link]'),
  claimModal: document.querySelector('[data-claim-modal]'),
  claimModalClose: document.querySelector('[data-claim-modal-close]'),
  claimModalEmail: document.querySelector('[data-claim-modal-email]'),
  toast: document.querySelector('[data-toast]'),
};

const state = {
  truck: null,
  truckId: '',
  publicShareUrl: '',
  shareUrl: '',
  showFullMenu: false,
  pageWasHidden: false,
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

function asArray(value) {
  return Array.isArray(value) ? value.filter((item) => item != null) : [];
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(asText(value));
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

function formatShareSummary(url) {
  if (isAppUrl(url)) {
    return 'Opens in the app';
  }

  return 'Copy or share this profile';
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

function formatClaimValue(value) {
  if (Array.isArray(value)) {
    return value.map(asText).filter(Boolean).slice(0, 8).join(', ');
  }

  return asText(value);
}

function formatClaimDetails(truck) {
  const latitude = Number(truck.latitude);
  const longitude = Number(truck.longitude);
  const coordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
    ? `${latitude}, ${longitude}`
    : '';
  const menuCount = asArray(truck.menu).length;
  const scheduleCount = asArray(truck.specialSchedule).length + asArray(truck.recurringSchedule).length;
  const claimStatus = asText(truck.claimStatus) || (truck.claimed === true ? 'claimed' : 'unclaimed');
  const listingUrl = state.publicShareUrl || state.shareUrl || window.location.href;
  const rows = [
    ['Truck name', truck.name || 'Food Truck'],
    ['Truck ID', state.truckId],
    ['Public listing link', listingUrl],
    ['Page opened from', window.location.href],
    ['Current address/stop', truck.currentAddress],
    ['Coordinates', coordinates],
    ['Claim status in app', claimStatus],
    ['Cuisines', formatClaimValue(truck.cuisines)],
    ['Tags', formatClaimValue(truck.tags)],
    ['Website', truck.websiteUrl],
    ['DoorDash', truck.doordashUrl],
    ['Uber Eats', truck.uberEatsUrl],
    ['Social links', formatClaimValue(truck.socialLinks)],
    ['Business phone on listing', truck.businessPhone],
    ['Menu item count', menuCount > 0 ? String(menuCount) : ''],
    ['Schedule entry count', scheduleCount > 0 ? String(scheduleCount) : ''],
  ];

  return rows
    .map(([label, value]) => [label, asText(value)])
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `- ${label}: ${value}`)
    .join('\n');
}

function buildClaimUrl(truck) {
  const truckName = truck.name || 'my truck';
  const subject = `Owner claim request: ${truckName}`;
  const body = [
    'Hi Food Truck Finder team,',
    '',
    `I would like to claim this Food Truck Finder listing for ${truckName}.`,
    '',
    'Truck info from the listing:',
    formatClaimDetails(truck),
    '',
    'My info:',
    '- Owner/manager name:',
    '- Best phone number:',
    '- Owner account email used in the app:',
    '- Proof of ownership or official link:',
    '- Updates needed on this listing:',
  ].join('\n');

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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

function renderMenu(truck) {
  const menu = asArray(truck.menu).filter((item) => item && typeof item === 'object');
  const visibleMenu = state.showFullMenu ? menu : menu.slice(0, MENU_PREVIEW_LIMIT);

  selectors.menuList.textContent = '';
  selectors.menuCount.textContent = menu.length > 0
    ? `${menu.length} item${menu.length === 1 ? '' : 's'}`
    : 'Menu pending';

  if (menu.length === 0) {
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

  if (isHttpUrl(truck.websiteUrl)) {
    links.push(['Website', truck.websiteUrl]);
  }

  if (isHttpUrl(truck.doordashUrl)) {
    links.push(['DoorDash', truck.doordashUrl]);
  }

  if (isHttpUrl(truck.uberEatsUrl)) {
    links.push(['Uber Eats', truck.uberEatsUrl]);
  }

  asArray(truck.socialLinks)
    .map(asText)
    .filter(isHttpUrl)
    .forEach((url) => links.push([socialLabel(url), url]));

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
  return 'Social';
}

function renderTruck(truck) {
  state.truck = truck;
  setShareUrls(truck.name);

  setDocumentMeta(truck);

  selectors.truckImage.src = firstHttpUrl([truck.truckImage, truck.photoSourceUrl]) || FALLBACK_IMAGE;
  selectors.truckImage.alt = `${truck.name || 'Food truck'} photo`;
  selectors.openState.textContent = truck.isOpen === true ? 'Open Now' : 'Food Truck';
  selectors.truckName.textContent = truck.name || 'Food Truck';
  selectors.truckDescription.textContent = truck.description || 'Menu, location, and updates from Food Truck Finder.';
  selectors.openApp.href = buildAppUrl(state.truckId);
  selectors.directions.href = buildDirectionsUrl(truck);
  selectors.truckAddress.textContent = truck.currentAddress || 'Address unavailable';
  selectors.shareUrl.textContent = formatShareSummary(state.shareUrl);
  selectors.shareText.textContent = formatSharePanelText(state.shareUrl);
  selectors.claimLink.href = buildClaimUrl(truck);

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

    renderTruck({id: snapshot.id, ...snapshot.data()});
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
  if (event.key === 'Escape' && selectors.claimModal && !selectors.claimModal.hidden) {
    closeClaimModal();
  }
});
window.addEventListener('pagehide', () => {
  state.pageWasHidden = true;
});

loadTruck();
