const firebaseConfig = {
  apiKey: 'AIzaSyBWg6A7bQMEXGXhRiXyw_G6v54OqYbhGhc',
  authDomain: 'food-truck-finder-prod.firebaseapp.com',
  projectId: 'food-truck-finder-prod',
  storageBucket: 'food-truck-finder-prod.firebasestorage.app',
  messagingSenderId: '862144269606',
  appId: '1:862144269606:ios:87e34a7659daae408d05e7',
};

const FALLBACK_IMAGE = '../assets/media/seed/food-truck-photo-pending.png';
const QR_IMAGE_BASE = 'https://api.qrserver.com/v1/create-qr-code/';

const selectors = {
  loadingView: document.querySelector('[data-loading-view]'),
  errorView: document.querySelector('[data-error-view]'),
  errorMessage: document.querySelector('[data-error-message]'),
  flyerView: document.querySelector('[data-flyer-view]'),
  truckImage: document.querySelector('[data-truck-image]'),
  openState: document.querySelector('[data-open-state]'),
  truckName: document.querySelector('[data-truck-name]'),
  truckDescription: document.querySelector('[data-truck-description]'),
  cuisineList: document.querySelector('[data-cuisine-list]'),
  truckAddress: document.querySelector('[data-truck-address]'),
  menuCount: document.querySelector('[data-menu-count]'),
  qrImage: document.querySelector('[data-qr-image]'),
  qrLabel: document.querySelector('[data-qr-label]'),
  qrUrl: document.querySelector('[data-qr-url]'),
  targetButtons: Array.from(document.querySelectorAll('[data-target-option]')),
  copyLink: document.querySelector('[data-copy-link]'),
  print: document.querySelector('[data-print]'),
  toast: document.querySelector('[data-toast]'),
};

const state = {
  truck: null,
  truckId: '',
  target: 'truck',
};

function getParams() {
  return new URLSearchParams(window.location.search);
}

function getTruckId() {
  const params = getParams();
  return (params.get('truck') || params.get('id') || '').trim();
}

function getTarget() {
  const target = getParams().get('target');
  return target === 'app' ? 'app' : 'truck';
}

function setView(view) {
  selectors.loadingView.hidden = view !== 'loading';
  selectors.errorView.hidden = view !== 'error';
  selectors.flyerView.hidden = view !== 'flyer';
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

function buildTruckUrl(truckId, truckName = '') {
  const url = new URL(`/truck/${encodeURIComponent(truckId)}`, window.location.origin);

  if (truckName) {
    url.searchParams.set('name', truckName);
  }

  return url.toString();
}

function buildOpenUrl(truckId, truckName = '') {
  const url = new URL('/open/', window.location.origin);
  url.searchParams.set('truck', truckId);

  if (truckName) {
    url.searchParams.set('name', truckName);
  }

  return url.toString();
}

function buildFlyerUrl(target = state.target) {
  const url = new URL('/flyer/', window.location.origin);
  url.searchParams.set('truck', state.truckId);
  url.searchParams.set('target', target);
  return url.toString();
}

function getTargetUrl() {
  const truckName = state.truck?.name || '';
  return state.target === 'app'
    ? buildOpenUrl(state.truckId, truckName)
    : buildTruckUrl(state.truckId, truckName);
}

function getQrImageUrl(targetUrl) {
  const url = new URL(QR_IMAGE_BASE);
  url.searchParams.set('size', '360x360');
  url.searchParams.set('margin', '16');
  url.searchParams.set('data', targetUrl);
  return url.toString();
}

function formatDisplayUrl(value) {
  try {
    const url = new URL(value);
    return `${url.hostname.replace(/^www\./i, '')}${url.pathname}`;
  } catch {
    return value;
  }
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
    .slice(0, 5);

  cuisines.forEach((cuisine) => selectors.cuisineList.appendChild(createPill(cuisine)));
}

function updateTargetControls() {
  selectors.targetButtons.forEach((button) => {
    const active = button.dataset.targetOption === state.target;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function updateQr() {
  const targetUrl = getTargetUrl();
  selectors.qrImage.src = getQrImageUrl(targetUrl);
  selectors.qrLabel.textContent = state.target === 'app'
    ? 'Scan to download or open the app'
    : 'Scan to view this truck page';
  selectors.qrUrl.textContent = formatDisplayUrl(targetUrl);

  const nextUrl = buildFlyerUrl(state.target);
  window.history.replaceState({}, '', nextUrl);
  updateTargetControls();
}

function renderTruck(truck) {
  state.truck = truck;
  const menuCount = asArray(truck.menu).length;
  const imageUrl = firstHttpUrl([truck.truckImage, truck.photoSourceUrl]) || FALLBACK_IMAGE;

  document.title = `${truck.name || 'Food Truck'} Flyer | Food Truck Finder`;
  selectors.truckImage.src = imageUrl;
  selectors.truckImage.alt = `${truck.name || 'Food truck'} photo`;
  selectors.openState.textContent = truck.isOpen === true ? 'Open Now' : 'Food Truck';
  selectors.truckName.textContent = truck.name || 'Food Truck';
  selectors.truckDescription.textContent = truck.description || 'Find menu, location, and live updates on Food Truck Finder.';
  selectors.truckAddress.textContent = truck.currentAddress || 'Check Food Truck Finder for the latest stop.';
  selectors.menuCount.textContent = menuCount > 0
    ? `${menuCount} item${menuCount === 1 ? '' : 's'}`
    : 'Menu updates online';

  renderCuisines(truck);
  updateQr();
  setView('flyer');
}

function showToast(message) {
  selectors.toast.textContent = message;
  selectors.toast.hidden = false;
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    selectors.toast.hidden = true;
  }, 1800);
}

async function copyFlyerLink() {
  const value = buildFlyerUrl(state.target);

  try {
    await navigator.clipboard.writeText(value);
    showToast('Copied flyer link');
  } catch {
    window.prompt('Flyer link:', value);
  }
}

async function loadTruck() {
  state.truckId = getTruckId();
  state.target = getTarget();
  updateTargetControls();

  selectors.copyLink?.addEventListener('click', copyFlyerLink);
  selectors.print?.addEventListener('click', () => window.print());
  selectors.targetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.target = button.dataset.targetOption === 'app' ? 'app' : 'truck';
      updateQr();
    });
  });

  if (!state.truckId) {
    setError('This flyer link is missing a truck ID.');
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
    console.error('Flyer page load failed:', error);
    setError('This flyer could not load. Try again in a moment.');
  }
}

loadTruck();
