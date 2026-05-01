const firebaseConfig = {
  apiKey: 'AIzaSyBWg6A7bQMEXGXhRiXyw_G6v54OqYbhGhc',
  authDomain: 'food-truck-finder-prod.firebaseapp.com',
  projectId: 'food-truck-finder-prod',
  storageBucket: 'food-truck-finder-prod.firebasestorage.app',
  messagingSenderId: '862144269606',
  appId: '1:862144269606:ios:87e34a7659daae408d05e7',
};

const state = {
  activeTab: 'owners',
  loading: false,
  loadedAt: '',
  admin: null,
  users: [],
  trucks: [],
  events: [],
  searchByTab: {
    owners: '',
    trucks: '',
    foodies: '',
    organizers: '',
    events: '',
  },
  selected: null,
};

const selectors = {
  authSection: document.querySelector('[data-auth-section]'),
  loginForm: document.querySelector('[data-login-form]'),
  authMessage: document.querySelector('[data-auth-message]'),
  signOut: document.querySelector('[data-sign-out]'),
  app: document.querySelector('[data-console-app]'),
  sessionSummary: document.querySelector('[data-session-summary]'),
  metrics: document.querySelector('[data-metrics]'),
  refresh: document.querySelector('[data-refresh]'),
  searchLabel: document.querySelector('[data-search-label]'),
  search: document.querySelector('[data-search]'),
  tabs: Array.from(document.querySelectorAll('[data-tab]')),
  panelTitle: document.querySelector('[data-panel-title]'),
  panelDescription: document.querySelector('[data-panel-description]'),
  loadedAt: document.querySelector('[data-loaded-at]'),
  seedTruck: document.querySelector('[data-seed-truck]'),
  createRecord: document.querySelector('[data-create-record]'),
  tableHead: document.querySelector('[data-table-head]'),
  tableBody: document.querySelector('[data-table-body]'),
  empty: document.querySelector('[data-empty-state]'),
  dialog: document.querySelector('[data-record-dialog]'),
  recordForm: document.querySelector('[data-record-form]'),
  recordFields: document.querySelector('[data-record-fields]'),
  dialogEyebrow: document.querySelector('[data-dialog-eyebrow]'),
  dialogTitle: document.querySelector('[data-dialog-title]'),
  dialogSubtitle: document.querySelector('[data-dialog-subtitle]'),
  recordMessage: document.querySelector('[data-record-message]'),
  deleteRecord: document.querySelector('[data-delete-record]'),
  closeDialog: Array.from(document.querySelectorAll('[data-close-dialog]')),
  seedDialog: document.querySelector('[data-seed-dialog]'),
  seedForm: document.querySelector('[data-seed-form]'),
  seedMessage: document.querySelector('[data-seed-message]'),
  seedOwnerOptions: document.querySelector('[data-seed-owner-options]'),
  closeSeedDialog: Array.from(document.querySelectorAll('[data-close-seed-dialog]')),
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const functions = firebase.app().functions('us-central1');
const getSnapshot = functions.httpsCallable('getManagementConsoleSnapshot');
const createRecord = functions.httpsCallable('createManagementConsoleRecord');
const updateRecord = functions.httpsCallable('updateManagementConsoleRecord');
const deleteRecord = functions.httpsCallable('deleteManagementConsoleRecord');
const uploadMedia = functions.httpsCallable('uploadManagementConsoleMedia');
const scanMenu = functions.httpsCallable('scanManagementConsoleMenu');
const seedTruck = functions.httpsCallable('seedManagementConsoleTruck');

const MAX_ADMIN_UPLOAD_BYTES = 5 * 1024 * 1024;

const tabConfig = {
  owners: {
    title: 'Owners',
    description: 'Owner account management, truck limits, and account status.',
    collection: 'users',
    filter: (record) => record.userType === 'Owner',
    columns: ['Owner', 'Email', 'Trucks', 'Access', 'Status', 'Auth', 'Action'],
    searchLabel: 'Search Owners',
    searchPlaceholder: 'Search owner name, email, phone, address...',
    createLabel: '',
  },
  trucks: {
    title: 'Trucks',
    description: 'Truck profiles, transfer ownership, claim status, and visibility.',
    collection: 'foodTrucks',
    filter: () => true,
    columns: ['Truck', 'Owner', 'Location', 'Claim', 'Status', 'Updated', 'Action'],
    searchLabel: 'Search Trucks',
    searchPlaceholder: 'Search truck, owner email, location, cuisine, tag...',
    createLabel: 'Create Truck',
  },
  foodies: {
    title: 'Foodies',
    description: 'Foodie accounts and support status.',
    collection: 'users',
    filter: (record) => record.userType === 'Foodie',
    columns: ['Foodie', 'Email', 'Status', 'Auth', 'Created', 'Action'],
    searchLabel: 'Search Foodies',
    searchPlaceholder: 'Search foodie name, email, status...',
    createLabel: '',
  },
  organizers: {
    title: 'Event Organizers',
    description: 'Organizer accounts, organization details, and event access.',
    collection: 'users',
    filter: (record) => record.userType === 'Organizer',
    columns: ['Organizer', 'Organization', 'Email', 'Events', 'Access', 'Status', 'Action'],
    searchLabel: 'Search Organizers',
    searchPlaceholder: 'Search organizer, organization, email, phone...',
    createLabel: '',
  },
  events: {
    title: 'Events',
    description: 'Event records, organizer ownership, capacity, and public status.',
    collection: 'events',
    filter: () => true,
    columns: ['Event', 'Organizer', 'When', 'Capacity', 'Status', 'Updated', 'Action'],
    searchLabel: 'Search Events',
    searchPlaceholder: 'Search event, organizer, address, status...',
    createLabel: 'Create Event',
  },
};

const fieldSets = {
  users: [
    {name: 'name', label: 'Name', type: 'text'},
    {name: 'profilePhotoUpload', label: 'Upload Profile Photo', type: 'file', mediaType: 'profilePhoto', wide: true},
    {name: 'userType', label: 'User Type', type: 'select', options: ['Foodie', 'Owner', 'Organizer']},
    {name: 'accountStatus', label: 'Account Status', type: 'select', options: ['active', 'review', 'disabled']},
    {name: 'moderationStatus', label: 'Moderation Status', type: 'select', options: ['clear', 'review', 'restricted']},
    {name: 'businessPhone', label: 'Business Phone', type: 'text'},
    {name: 'personalNumber', label: 'Personal Number', type: 'text'},
    {name: 'businessAddress', label: 'Business Address', type: 'textarea', wide: true},
    {name: 'organizationName', label: 'Organization Name', type: 'text'},
    {name: 'organizerPhone', label: 'Organizer Phone', type: 'text'},
    {name: 'unlimitedTrucks', label: 'Unlimited Trucks', type: 'checkbox'},
    {name: 'unlimitedInvites', label: 'Unlimited Referral Codes', type: 'checkbox'},
    {name: 'unlimitedEvents', label: 'Unlimited Events', type: 'checkbox'},
    {name: 'invitesAllowed', label: 'Referral Codes Allowed', type: 'number'},
    {name: 'invitesUsed', label: 'Referral Codes Used', type: 'number'},
    {name: 'authDisabled', label: 'Disable Auth Account', type: 'checkbox'},
  ],
  foodTrucks: [
    {name: 'name', label: 'Truck Name', type: 'text'},
    {name: 'truckImageUpload', label: 'Upload Truck Photo', type: 'file', mediaType: 'truckImage', wide: true},
    {name: 'menuImageUpload', label: 'Upload Menu Photo', type: 'file', mediaType: 'menuImage', multiple: true, wide: true},
    {name: 'scanMenuAi', label: 'Scan Menu with AI', type: 'action', action: 'scan-menu', wide: true},
    {
      name: 'ownerEmail',
      label: 'Owner Email (transfer)',
      type: 'email',
      list: 'owner-email-options',
      help: 'Start typing and choose an owner email to transfer this truck.',
    },
    {name: 'ownerId', label: 'Owner UID (advanced)', type: 'text'},
    {name: 'description', label: 'Description', type: 'textarea', wide: true},
    {name: 'currentAddress', label: 'Current Address', type: 'textarea', wide: true},
    {name: 'businessPhone', label: 'Business Phone', type: 'text'},
    {name: 'websiteUrl', label: 'Website URL', type: 'text'},
    {name: 'socialLinks', label: 'Social Links, comma separated', type: 'textarea', wide: true},
    {name: 'doordashUrl', label: 'DoorDash URL', type: 'text'},
    {name: 'uberEatsUrl', label: 'Uber Eats URL', type: 'text'},
    {name: 'cuisines', label: 'Cuisines, comma separated', type: 'textarea'},
    {name: 'tags', label: 'Tags, comma separated', type: 'textarea'},
    {name: 'claimStatus', label: 'Claim Status', type: 'select', options: ['unclaimed', 'claim_pending', 'claimed']},
    {name: 'locationType', label: 'Location Type', type: 'select', options: ['stationary', 'mobile', 'event_based']},
    {name: 'verificationStatus', label: 'Verification Status', type: 'select', options: ['owner_verified', 'public_sources_only', 'needs_owner_verification']},
    {name: 'menuStatus', label: 'Menu Status', type: 'text'},
    {name: 'photoStatus', label: 'Photo Status', type: 'text'},
    {name: 'latitude', label: 'Latitude', type: 'number'},
    {name: 'longitude', label: 'Longitude', type: 'number'},
    {name: 'isOpen', label: 'Open Now', type: 'checkbox'},
    {name: 'isSharingLocation', label: 'Sharing Live Location', type: 'checkbox'},
    {name: 'isMapHidden', label: 'Hide From Map', type: 'checkbox'},
    {name: 'transferEligible', label: 'Transfer Eligible', type: 'checkbox'},
  ],
  events: [
    {name: 'title', label: 'Event Title', type: 'text'},
    {name: 'coverImageUpload', label: 'Upload Event Cover', type: 'file', mediaType: 'coverImage', wide: true},
    {
      name: 'organizerEmail',
      label: 'Organizer Email (transfer)',
      type: 'email',
      list: 'organizer-email-options',
      help: 'Start typing and choose an organizer email to transfer this event.',
    },
    {name: 'organizerId', label: 'Organizer UID (advanced)', type: 'text'},
    {name: 'organizerName', label: 'Organizer Name', type: 'text'},
    {name: 'organizationName', label: 'Organization Name', type: 'text'},
    {name: 'organizerPhone', label: 'Organizer Phone', type: 'text'},
    {name: 'description', label: 'Description', type: 'textarea', wide: true},
    {name: 'address', label: 'Address', type: 'textarea', wide: true},
    {name: 'lineupPreview', label: 'Lineup Preview', type: 'textarea'},
    {name: 'whatToExpect', label: 'What To Expect', type: 'textarea'},
    {name: 'status', label: 'Status', type: 'select', options: ['open', 'full', 'closed']},
    {name: 'truckCapacity', label: 'Truck Capacity', type: 'number'},
    {name: 'expectedTruckCount', label: 'Expected Truck Count', type: 'number'},
    {name: 'latitude', label: 'Latitude', type: 'number'},
    {name: 'longitude', label: 'Longitude', type: 'number'},
    {name: 'startAt', label: 'Start Time', type: 'datetime-local'},
    {name: 'endAt', label: 'End Time', type: 'datetime-local'},
  ],
};

function setMessage(element, message, isError = false) {
  if (!element) return;
  element.textContent = message || '';
  element.style.color = isError ? '#b3261e' : '';
}

function setAuthenticatedView(isAuthenticated) {
  if (selectors.authSection) {
    selectors.authSection.hidden = isAuthenticated;
  }

  if (selectors.loginForm) {
    selectors.loginForm.hidden = isAuthenticated;
  }

  if (selectors.signOut) {
    selectors.signOut.hidden = !isAuthenticated;
  }
}

function formatDate(value) {
  if (!value) return 'Not set';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'});
}

function formatShortDate(value) {
  if (!value) return 'Not set';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'});
}

function toDateTimeLocal(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const offsetMs = parsed.getTimezoneOffset() * 60 * 1000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function recordText(record) {
  return Object.values(record)
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map((value) => String(value ?? '').toLowerCase())
    .join(' ');
}

function getUserById(uid) {
  return state.users.find((user) => user.id === uid || user.uid === uid);
}

function getTruckCountForOwner(uid) {
  return state.trucks.filter((truck) => truck.ownerId === uid).length;
}

function getEventCountForOrganizer(uid) {
  return state.events.filter((event) => event.organizerId === uid).length;
}

function statusPill(value, warnValues = ['disabled', 'review', 'closed']) {
  const normalized = String(value || 'active').toLowerCase();
  const warn = warnValues.includes(normalized);
  return `<span class="status-pill ${warn ? 'status-pill--warn' : ''}">${escapeHtml(value || 'active')}</span>`;
}

function getProfileImage(record) {
  return record.photoURL || record.profileImage || '';
}

function getMenuPreviewImage(record) {
  return Array.isArray(record.menuImages) && record.menuImages.length
    ? record.menuImages[0]
    : record.menuImage || '';
}

function getMediaPreviewUrl(field, record) {
  if (field.mediaType === 'profilePhoto') return getProfileImage(record);
  if (field.mediaType === 'truckImage') return record.truckImage || '';
  if (field.mediaType === 'menuImage') return getMenuPreviewImage(record);
  if (field.mediaType === 'coverImage') return record.coverImageUrl || '';
  return '';
}

function getCurrentSearch() {
  return state.searchByTab[state.activeTab] || '';
}

function getOwnerEmailOptions() {
  return state.users
    .filter((user) => user.userType === 'Owner' && user.email)
    .map((user) => ({
      email: String(user.email).trim(),
      label: [user.name, user.id].filter(Boolean).join(' - '),
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

function getOrganizerEmailOptions() {
  return state.users
    .filter((user) => user.userType === 'Organizer' && user.email)
    .map((user) => ({
      email: String(user.email).trim(),
      label: [user.organizationName || user.name, user.id].filter(Boolean).join(' - '),
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

function renderEmailDatalist(id, options) {

  if (!options.length) {
    return '';
  }

  return `
    <datalist id="${escapeHtml(id)}">
      ${options.map((option) => `
        <option value="${escapeHtml(option.email)}" label="${escapeHtml(option.label)}"></option>
      `).join('')}
    </datalist>
  `;
}

function renderOwnerEmailDatalist() {
  return renderEmailDatalist('owner-email-options', getOwnerEmailOptions());
}

function renderOrganizerEmailDatalist() {
  return renderEmailDatalist('organizer-email-options', getOrganizerEmailOptions());
}

function getActiveRecords() {
  const config = tabConfig[state.activeTab];
  const source = config.collection === 'users'
    ? state.users
    : config.collection === 'foodTrucks'
      ? state.trucks
      : state.events;
  const query = getCurrentSearch().trim().toLowerCase();

  return source
    .filter(config.filter)
    .filter((record) => !query || recordText(record).includes(query));
}

function renderMetrics() {
  const ownerCount = state.users.filter((user) => user.userType === 'Owner').length;
  const foodieCount = state.users.filter((user) => user.userType === 'Foodie').length;
  const organizerCount = state.users.filter((user) => user.userType === 'Organizer').length;
  const openEventCount = state.events.filter((event) => ['open', 'full'].includes(event.status)).length;
  const liveTruckCount = state.trucks.filter((truck) => truck.isSharingLocation || truck.isOpen).length;

  selectors.metrics.innerHTML = [
    ['Owners', ownerCount],
    ['Trucks', state.trucks.length],
    ['Foodies', foodieCount],
    ['Organizers', organizerCount],
    ['Live/Open', liveTruckCount + openEventCount],
  ].map(([label, value]) => `
    <article class="metric-card">
      <strong>${value}</strong>
      <span>${label}</span>
    </article>
  `).join('');
}

function renderTable() {
  const config = tabConfig[state.activeTab];
  const records = getActiveRecords();

  selectors.panelTitle.textContent = config.title;
  selectors.panelDescription.textContent = config.description;
  selectors.loadedAt.textContent = state.loadedAt ? `Loaded ${formatDate(state.loadedAt)}` : '';
  selectors.tableHead.innerHTML = `<tr>${config.columns.map((column) => `<th>${column}</th>`).join('')}</tr>`;
  selectors.empty.hidden = records.length > 0;
  if (selectors.createRecord) {
    selectors.createRecord.hidden = !config.createLabel;
    selectors.createRecord.textContent = config.createLabel || 'Create';
  }
  if (selectors.seedTruck) {
    selectors.seedTruck.hidden = state.activeTab !== 'trucks';
  }
  if (selectors.searchLabel) {
    selectors.searchLabel.textContent = config.searchLabel || 'Search';
  }
  if (selectors.search) {
    selectors.search.placeholder = config.searchPlaceholder || 'Search records...';
    const currentSearch = getCurrentSearch();
    if (selectors.search.value !== currentSearch) {
      selectors.search.value = currentSearch;
    }
  }

  selectors.tabs.forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.tab === state.activeTab);
  });

  selectors.tableBody.innerHTML = records.map((record) => {
    if (state.activeTab === 'owners') return renderOwnerRow(record);
    if (state.activeTab === 'foodies') return renderFoodieRow(record);
    if (state.activeTab === 'organizers') return renderOrganizerRow(record);
    if (state.activeTab === 'trucks') return renderTruckRow(record);
    return renderEventRow(record);
  }).join('');
}

function renderOwnerRow(record) {
  const truckCount = getTruckCountForOwner(record.id);
  const access = [
    record.unlimitedTrucks ? 'trucks' : '',
    record.unlimitedInvites ? 'codes' : '',
  ].filter(Boolean).join(', ') || `${record.invitesAllowed ?? 0} codes`;

  return `
    <tr>
      <td>${titleCell(record.name || 'Owner', record.id, getProfileImage(record))}</td>
      <td>${escapeHtml(record.email || 'No email')}</td>
      <td>${truckCount}</td>
      <td>${escapeHtml(access)}</td>
      <td>${statusPill(record.accountStatus || 'active')}</td>
      <td>${statusPill(record.authDisabled ? 'disabled' : 'enabled')}</td>
      <td>${actionButton('users', record.id)}</td>
    </tr>
  `;
}

function renderFoodieRow(record) {
  return `
    <tr>
      <td>${titleCell(record.name || 'Foodie', record.id, getProfileImage(record))}</td>
      <td>${escapeHtml(record.email || 'No email')}</td>
      <td>${statusPill(record.accountStatus || 'active')}</td>
      <td>${statusPill(record.authDisabled ? 'disabled' : 'enabled')}</td>
      <td>${formatShortDate(record.createdAt)}</td>
      <td>${actionButton('users', record.id)}</td>
    </tr>
  `;
}

function renderOrganizerRow(record) {
  const eventCount = getEventCountForOrganizer(record.id);
  const access = record.unlimitedEvents ? 'unlimited events' : 'standard';

  return `
    <tr>
      <td>${titleCell(record.name || 'Organizer', record.id, getProfileImage(record))}</td>
      <td>${escapeHtml(record.organizationName || 'No organization')}</td>
      <td>${escapeHtml(record.email || 'No email')}</td>
      <td>${eventCount}</td>
      <td>${escapeHtml(access)}</td>
      <td>${statusPill(record.accountStatus || 'active')}</td>
      <td>${actionButton('users', record.id)}</td>
    </tr>
  `;
}

function renderTruckRow(record) {
  const owner = getUserById(record.ownerId);
  const status = record.isMapHidden ? 'hidden' : record.isOpen ? 'open' : 'closed';
  return `
    <tr>
      <td>${titleCell(record.name || 'Truck', record.id, record.truckImage)}</td>
      <td>
        <strong>${escapeHtml(owner?.name || record.ownerEmail || 'Unknown owner')}</strong>
        <span class="muted-cell">${escapeHtml(record.ownerId || 'No owner id')}</span>
      </td>
      <td>${escapeHtml(record.currentAddress || 'No address')}</td>
      <td>${statusPill(record.claimStatus || 'unclaimed')}</td>
      <td>${statusPill(status, ['closed', 'hidden'])}</td>
      <td>${formatShortDate(record.updatedAt)}</td>
      <td>
        <div class="row-actions">
          ${actionButton('foodTrucks', record.id)}
          ${truckMapVisibilityButton(record)}
        </div>
      </td>
    </tr>
  `;
}

function renderEventRow(record) {
  const organizer = getUserById(record.organizerId);
  const accepted = Array.isArray(record.acceptedTruckIds) ? record.acceptedTruckIds.length : 0;
  const capacity = Number(record.truckCapacity || 0);

  return `
    <tr>
      <td>${titleCell(record.title || 'Event', record.id, record.coverImageUrl)}</td>
      <td>${escapeHtml(record.organizationName || organizer?.organizationName || record.organizerName || 'Unknown')}</td>
      <td>${formatDate(record.startAt)}</td>
      <td>${accepted}/${capacity || 'unset'}</td>
      <td>${statusPill(record.status || 'open')}</td>
      <td>${formatShortDate(record.updatedAt)}</td>
      <td>${actionButton('events', record.id)}</td>
    </tr>
  `;
}

function titleCell(title, subtitle, imageUrl = '') {
  return `
    <div class="record-title">
      ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="">` : ''}
      <div>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(subtitle)}</span>
      </div>
    </div>
  `;
}

function actionButton(collection, id) {
  return `<button class="row-action" type="button" data-edit="${collection}:${escapeHtml(id)}">Manage</button>`;
}

function truckMapVisibilityButton(record) {
  const hidden = record.isMapHidden === true;
  const label = hidden ? 'Show on Map' : 'Disappear';
  const nextHidden = hidden ? 'false' : 'true';

  return `
    <button
      class="row-action row-action--ghost"
      type="button"
      data-toggle-map-visibility="${escapeHtml(record.id)}"
      data-next-hidden="${nextHidden}"
    >
      ${escapeHtml(label)}
    </button>
  `;
}

function getDatalistHtml(collection) {
  if (collection === 'foodTrucks') return renderOwnerEmailDatalist();
  if (collection === 'events') return renderOrganizerEmailDatalist();
  return '';
}

function renderAll() {
  renderMetrics();
  renderTable();
}

async function loadSnapshot() {
  state.loading = true;
  selectors.refresh.disabled = true;
  selectors.refresh.textContent = 'Loading...';

  try {
    const result = await getSnapshot({limit: 200});
    const data = result.data || {};
    state.admin = data.admin || null;
    state.loadedAt = data.loadedAt || new Date().toISOString();
    state.users = data.users || [];
    state.trucks = data.trucks || [];
    state.events = data.events || [];
    selectors.app.hidden = false;
    setAuthenticatedView(true);
    selectors.sessionSummary.textContent = `Signed in as ${auth.currentUser?.email || state.admin?.email || 'admin'}. Showing up to ${data.limit || 200} records per collection.`;
    renderAll();
  } catch (error) {
    selectors.app.hidden = true;
    setAuthenticatedView(false);
    setMessage(selectors.authMessage, error.message || 'Unable to load management data.', true);
  } finally {
    state.loading = false;
    selectors.refresh.disabled = false;
    selectors.refresh.textContent = 'Refresh';
  }
}

function openRecordDialog(collection, id) {
  const records = collection === 'users'
    ? state.users
    : collection === 'foodTrucks'
      ? state.trucks
      : state.events;
  const record = records.find((item) => item.id === id);

  if (!record) return;

  state.selected = {collection, id, record};
  selectors.recordMessage.textContent = '';
  selectors.dialogEyebrow.textContent = collection;
  selectors.dialogTitle.textContent = record.name || record.title || record.email || id;
  selectors.dialogSubtitle.textContent = id;
  selectors.deleteRecord.hidden = collection === 'users';
  const fieldsHtml = (fieldSets[collection] || [])
    .map((field) => renderField(field, record))
    .join('');
  selectors.recordFields.innerHTML = fieldsHtml + getDatalistHtml(collection);

  if (typeof selectors.dialog.showModal === 'function') {
    selectors.dialog.showModal();
  } else {
    selectors.dialog.setAttribute('open', '');
  }
}

function openCreateDialog() {
  const config = tabConfig[state.activeTab];
  const collection = config.collection;

  if (collection !== 'foodTrucks' && collection !== 'events') return;

  const record = collection === 'foodTrucks'
    ? {
        claimStatus: 'claimed',
        locationType: 'stationary',
        verificationStatus: 'owner_verified',
        transferEligible: true,
      }
    : {
        status: 'open',
        truckCapacity: 1,
        expectedTruckCount: 1,
      };

  state.selected = {collection, id: '', record, mode: 'create'};
  selectors.recordMessage.textContent = '';
  selectors.dialogEyebrow.textContent = collection;
  selectors.dialogTitle.textContent = collection === 'foodTrucks' ? 'Create Truck' : 'Create Event';
  selectors.dialogSubtitle.textContent = 'New record';
  selectors.deleteRecord.hidden = true;

  const fieldsHtml = (fieldSets[collection] || [])
    .map((field) => renderField(field, record))
    .join('');
  selectors.recordFields.innerHTML = fieldsHtml + getDatalistHtml(collection);

  if (typeof selectors.dialog.showModal === 'function') {
    selectors.dialog.showModal();
  } else {
    selectors.dialog.setAttribute('open', '');
  }
}

function renderSeedOwnerOptions() {
  if (!selectors.seedOwnerOptions) return;

  selectors.seedOwnerOptions.innerHTML = getOwnerEmailOptions()
    .map((option) => `<option value="${escapeHtml(option.email)}" label="${escapeHtml(option.label)}"></option>`)
    .join('');
}

function openSeedTruckDialog() {
  renderSeedOwnerOptions();
  if (selectors.seedForm) {
    selectors.seedForm.reset();
  }
  setMessage(selectors.seedMessage, '');

  if (typeof selectors.seedDialog?.showModal === 'function') {
    selectors.seedDialog.showModal();
  } else {
    selectors.seedDialog?.setAttribute('open', '');
  }
}

function closeSeedTruckDialog() {
  if (typeof selectors.seedDialog?.close === 'function') {
    selectors.seedDialog.close();
  } else {
    selectors.seedDialog?.removeAttribute('open');
  }
}

function renderField(field, record) {
  const value = record[field.name];
  const wideClass = field.wide ? ' record-field--wide' : '';

  if (field.type === 'action') {
    const isCreate = state.selected?.mode === 'create';
    const menuPhotoCount = Array.isArray(record.menuImages) ? record.menuImages.length : 0;
    const disabled = isCreate || menuPhotoCount === 0;
    const help = isCreate
      ? 'Save the truck and upload menu photos before scanning.'
      : menuPhotoCount > 0
        ? `Scans ${menuPhotoCount} saved menu photo${menuPhotoCount === 1 ? '' : 's'} and replaces the current menu items.`
        : 'Upload at least one menu photo, save, then scan.';

    return `
      <div class="record-field record-field--action${wideClass}">
        <span>${escapeHtml(field.label)}</span>
        <div class="record-action-card">
          <button
            class="button button--secondary"
            type="button"
            data-record-action="${escapeHtml(field.action)}"
            ${disabled ? 'disabled' : ''}
          >
            ${escapeHtml(field.label)}
          </button>
          <small>${escapeHtml(help)}</small>
        </div>
      </div>
    `;
  }

  if (field.type === 'file') {
    const previewUrl = getMediaPreviewUrl(field, record);
    const mode = field.mediaType === 'menuImage' ? 'Adds to existing menu photos.' : 'Replaces the current image.';

    return `
      <div class="record-field record-field--file${wideClass}">
        <span>${escapeHtml(field.label)}</span>
        <div class="file-upload-card">
          ${previewUrl ? `<img class="media-preview" src="${escapeHtml(previewUrl)}" alt="">` : '<div class="media-preview media-preview--empty">No image</div>'}
          <div>
            <input
              type="file"
              data-field="${escapeHtml(field.name)}"
              data-type="file"
              data-media-type="${escapeHtml(field.mediaType)}"
              accept="image/jpeg,image/png,image/webp"
              ${field.multiple ? 'multiple' : ''}
            >
            <small>${escapeHtml(mode)} JPG, PNG, or WebP. Max 5 MB each.</small>
          </div>
        </div>
      </div>
    `;
  }

  if (field.type === 'checkbox') {
    return `
      <label class="record-field record-field--checkbox${wideClass}">
        <span>${escapeHtml(field.label)}</span>
        <input type="checkbox" data-field="${escapeHtml(field.name)}" data-type="checkbox" ${value ? 'checked' : ''}>
      </label>
    `;
  }

  if (field.type === 'select') {
    return `
      <label class="record-field${wideClass}">
        ${escapeHtml(field.label)}
        <select data-field="${escapeHtml(field.name)}" data-type="select">
          <option value="">Not set</option>
          ${field.options.map((option) => `
            <option value="${escapeHtml(option)}" ${String(value || '') === option ? 'selected' : ''}>${escapeHtml(option)}</option>
          `).join('')}
        </select>
      </label>
    `;
  }

  if (field.type === 'textarea') {
    const textareaValue = Array.isArray(value) ? value.join(', ') : (value || '');
    return `
      <label class="record-field${wideClass}">
        ${escapeHtml(field.label)}
        <textarea data-field="${escapeHtml(field.name)}" data-type="textarea">${escapeHtml(textareaValue)}</textarea>
      </label>
    `;
  }

  const inputValue = field.type === 'datetime-local'
    ? toDateTimeLocal(value)
    : Array.isArray(value)
      ? value.join(', ')
      : value ?? '';
  const listAttr = field.list ? `list="${escapeHtml(field.list)}"` : '';
  const helpText = field.help ? `<small class="field-help">${escapeHtml(field.help)}</small>` : '';

  return `
    <label class="record-field${wideClass}">
      ${escapeHtml(field.label)}
      <input
        type="${escapeHtml(field.type)}"
        data-field="${escapeHtml(field.name)}"
        data-type="${escapeHtml(field.type)}"
        value="${escapeHtml(inputValue)}"
        ${listAttr}
        ${field.type === 'number' ? 'step="any"' : ''}
      >
      ${helpText}
    </label>
  `;
}

function readInputValue(input, type) {
  if (type === 'checkbox') return input.checked;
  if (type === 'number') return input.value.trim() === '' ? '' : Number(input.value);
  if (type === 'datetime-local') return input.value ? new Date(input.value).toISOString() : '';
  return input.value.trim();
}

function fieldValueMatches(type, nextValue, previousValue) {
  if (type === 'checkbox') return Boolean(previousValue) === Boolean(nextValue);

  if (type === 'number') {
    if (nextValue === '') return previousValue == null || previousValue === '';
    return Number(previousValue) === nextValue;
  }

  if (type === 'datetime-local') {
    if (!nextValue) return !previousValue;
    const previousDate = new Date(previousValue);
    return !Number.isNaN(previousDate.getTime()) && previousDate.toISOString() === nextValue;
  }

  const previousText = Array.isArray(previousValue)
    ? previousValue.join(', ')
    : String(previousValue ?? '').trim();

  return previousText === String(nextValue ?? '').trim();
}

function readFormUpdates() {
  const updates = {};
  const originalRecord = state.selected?.record || {};
  const isCreate = state.selected?.mode === 'create';

  selectors.recordFields.querySelectorAll('[data-field]').forEach((input) => {
    const field = input.dataset.field;
    const type = input.dataset.type;

    if (type === 'file') return;
    if (!field) return;

    const nextValue = readInputValue(input, type);
    if (isCreate) {
      if (nextValue === '' || nextValue == null || (type === 'checkbox' && nextValue === false)) return;
      updates[field] = nextValue;
      return;
    }

    if (fieldValueMatches(type, nextValue, originalRecord[field])) return;

    updates[field] = nextValue;
  });

  return updates;
}

function getSelectedUploads() {
  const uploads = [];

  selectors.recordFields.querySelectorAll('input[type="file"][data-media-type]').forEach((input) => {
    const files = Array.from(input.files || []);
    files.forEach((file) => {
      uploads.push({
        mediaType: input.dataset.mediaType,
        file,
      });
    });
  });

  return uploads;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('Could not read image.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

async function scanSelectedTruckMenu() {
  if (!state.selected || state.selected.collection !== 'foodTrucks' || state.selected.mode === 'create') {
    return;
  }

  const record = state.selected.record || {};
  const menuImages = Array.isArray(record.menuImages) ? record.menuImages : [];

  if (menuImages.length === 0) {
    setMessage(selectors.recordMessage, 'Upload and save at least one menu photo before scanning.', true);
    return;
  }

  const confirmed = window.confirm(
    `Scan ${menuImages.length} menu photo${menuImages.length === 1 ? '' : 's'} with AI? This will replace the current saved menu items for this truck.`
  );
  if (!confirmed) return;

  setMessage(selectors.recordMessage, 'Scanning menu photos with AI...');

  try {
    const result = await scanMenu({
      truckId: state.selected.id,
      images: menuImages,
    });
    const count = Number(result.data?.count || result.data?.menuItems?.length || 0);

    setMessage(selectors.recordMessage, `AI menu scan saved ${count} item${count === 1 ? '' : 's'}. Refreshing data...`);
    await loadSnapshot();
    closeDialog();
    window.alert(`AI menu scan saved ${count} item${count === 1 ? '' : 's'}.`);
  } catch (error) {
    setMessage(selectors.recordMessage, error.message || 'Menu scan failed.', true);
  }
}

async function toggleTruckMapVisibility(button) {
  const truckId = button?.dataset?.toggleMapVisibility || '';
  const nextHidden = button?.dataset?.nextHidden === 'true';
  const truck = state.trucks.find((record) => record.id === truckId);

  if (!truckId || !truck) {
    return;
  }

  const confirmed = window.confirm(
    nextHidden
      ? `Hide ${truck.name || 'this truck'} from the public map without deleting it?`
      : `Show ${truck.name || 'this truck'} on the public map again?`
  );
  if (!confirmed) return;

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = nextHidden ? 'Hiding...' : 'Showing...';

  try {
    await updateRecord({
      collection: 'foodTrucks',
      id: truckId,
      updates: {
        isMapHidden: nextHidden,
      },
    });
    await loadSnapshot();
  } catch (error) {
    window.alert(error.message || 'Could not update map visibility.');
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function saveSelectedRecord() {
  if (!state.selected) return;

  const updates = readFormUpdates();
  const uploads = getSelectedUploads();
  const isCreate = state.selected.mode === 'create';

  if (Object.keys(updates).length === 0 && uploads.length === 0) {
    setMessage(selectors.recordMessage, 'No changes to save.');
    return;
  }

  setMessage(selectors.recordMessage, isCreate ? 'Creating record...' : 'Saving updates...');

  try {
    let recordId = state.selected.id;

    if (isCreate) {
      const result = await createRecord({
        collection: state.selected.collection,
        record: updates,
      });
      recordId = result.data?.id || '';

      if (!recordId) {
        throw new Error('Create succeeded but no record id was returned.');
      }
    } else if (Object.keys(updates).length > 0) {
      await updateRecord({
        collection: state.selected.collection,
        id: recordId,
        updates,
      });
    }

    for (let index = 0; index < uploads.length; index += 1) {
      const upload = uploads[index];
      if (!upload.mediaType) continue;
      if (upload.file.size > MAX_ADMIN_UPLOAD_BYTES) {
        throw new Error(`${upload.file.name} is larger than 5 MB.`);
      }

      setMessage(selectors.recordMessage, `Uploading image ${index + 1} of ${uploads.length}...`);
      const dataUrl = await readFileAsDataUrl(upload.file);

      await uploadMedia({
        collection: state.selected.collection,
        id: recordId,
        mediaType: upload.mediaType,
        fileName: upload.file.name,
        contentType: upload.file.type,
        dataUrl,
      });
    }

    setMessage(selectors.recordMessage, 'Saved. Refreshing data...');
    await loadSnapshot();
    closeDialog();
  } catch (error) {
    setMessage(selectors.recordMessage, error.message || 'Save failed.', true);
  }
}

function splitCommaList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function buildImagePayload(file) {
  if (!file) {
    throw new Error('Image file is required.');
  }

  if (file.size > MAX_ADMIN_UPLOAD_BYTES) {
    throw new Error(`${file.name} is larger than 5 MB.`);
  }

  return {
    dataUrl: await readFileAsDataUrl(file),
    fileName: file.name,
    contentType: file.type,
  };
}

async function seedTruckFromForm() {
  if (!selectors.seedForm) return;

  const formData = new FormData(selectors.seedForm);
  const address = String(formData.get('address') || '').trim();
  const truckName = String(formData.get('name') || '').trim();
  const truckFile = selectors.seedForm.querySelector('input[name="truckImage"]')?.files?.[0] || null;
  const menuFiles = Array.from(
    selectors.seedForm.querySelector('input[name="menuImages"]')?.files || []
  );
  const submitButton = selectors.seedForm.querySelector('button[type="submit"]');

  if (!address) {
    setMessage(selectors.seedMessage, 'Address is required.', true);
    return;
  }

  if (!truckName) {
    setMessage(selectors.seedMessage, 'Truck name is required.', true);
    return;
  }

  if (!truckFile) {
    setMessage(selectors.seedMessage, 'Truck photo is required.', true);
    return;
  }

  if (menuFiles.length === 0) {
    setMessage(selectors.seedMessage, 'At least one menu photo is required.', true);
    return;
  }

  if (menuFiles.length > 3) {
    setMessage(selectors.seedMessage, 'Upload up to three menu photos.', true);
    return;
  }

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Seeding...';
    }

    setMessage(selectors.seedMessage, 'Reading images...');
    const truckImage = await buildImagePayload(truckFile);
    const menuImages = [];

    for (let index = 0; index < menuFiles.length; index += 1) {
      setMessage(selectors.seedMessage, `Reading menu image ${index + 1} of ${menuFiles.length}...`);
      menuImages.push(await buildImagePayload(menuFiles[index]));
    }

    setMessage(selectors.seedMessage, 'Uploading, scanning menu, writing description, and finding links...');
    const result = await seedTruck({
      address,
      ownerEmail: String(formData.get('ownerEmail') || '').trim(),
      name: truckName,
      description: String(formData.get('description') || '').trim(),
      cuisines: splitCommaList(formData.get('cuisines')),
      tags: splitCommaList(formData.get('tags')),
      truckImage,
      menuImages,
    });
    const seededTruckName = result.data?.name || truckName;
    const menuItemCount = Number(result.data?.menuItemCount || 0);
    const linkCount = [
      result.data?.websiteUrl,
      result.data?.doordashUrl,
      result.data?.uberEatsUrl,
      ...(Array.isArray(result.data?.socialLinks) ? result.data.socialLinks : []),
    ].filter(Boolean).length;

    setMessage(
      selectors.seedMessage,
      `${seededTruckName} seeded with ${menuItemCount} menu item${menuItemCount === 1 ? '' : 's'} and ${linkCount} discovered link${linkCount === 1 ? '' : 's'}. Refreshing...`
    );
    state.activeTab = 'trucks';
    await loadSnapshot();
    closeSeedTruckDialog();
    window.alert(`${seededTruckName} was seeded successfully.`);
  } catch (error) {
    setMessage(selectors.seedMessage, error.message || 'Truck seed failed.', true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Seed Truck';
    }
  }
}

async function deleteSelectedRecord() {
  if (!state.selected || state.selected.collection === 'users') return;

  const confirmed = window.confirm(`Delete ${state.selected.collection}/${state.selected.id}? This cannot be undone.`);
  if (!confirmed) return;

  setMessage(selectors.recordMessage, 'Deleting...');

  try {
    await deleteRecord({
      collection: state.selected.collection,
      id: state.selected.id,
    });
    await loadSnapshot();
    closeDialog();
  } catch (error) {
    setMessage(selectors.recordMessage, error.message || 'Delete failed.', true);
  }
}

function closeDialog() {
  state.selected = null;
  if (typeof selectors.dialog.close === 'function') {
    selectors.dialog.close();
  } else {
    selectors.dialog.removeAttribute('open');
  }
}

selectors.loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(selectors.loginForm);
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  setMessage(selectors.authMessage, 'Signing in...');

  try {
    await auth.signInWithEmailAndPassword(email, password);
    setMessage(selectors.authMessage, '');
  } catch (error) {
    setMessage(selectors.authMessage, error.message || 'Sign in failed.', true);
  }
});

selectors.signOut?.addEventListener('click', async () => {
  await auth.signOut();
});

selectors.refresh?.addEventListener('click', loadSnapshot);
selectors.createRecord?.addEventListener('click', openCreateDialog);
selectors.seedTruck?.addEventListener('click', openSeedTruckDialog);

selectors.search?.addEventListener('input', (event) => {
  state.searchByTab[state.activeTab] = event.target.value || '';
  renderTable();
});

selectors.tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    state.activeTab = tab.dataset.tab || 'owners';
    renderTable();
  });
});

selectors.tableBody?.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const visibilityButton = target?.closest('[data-toggle-map-visibility]');
  if (visibilityButton) {
    void toggleTruckMapVisibility(visibilityButton);
    return;
  }

  const button = target?.closest('[data-edit]');
  if (!button) return;
  const [collection, id] = button.dataset.edit.split(':');
  openRecordDialog(collection, id);
});

selectors.recordFields?.addEventListener('click', async (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const button = target?.closest('[data-record-action]');
  if (!button) return;

  if (button.dataset.recordAction === 'scan-menu') {
    await scanSelectedTruckMenu();
  }
});

selectors.recordForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  await saveSelectedRecord();
});

selectors.seedForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  await seedTruckFromForm();
});

selectors.deleteRecord?.addEventListener('click', deleteSelectedRecord);
selectors.closeDialog.forEach((button) => button.addEventListener('click', closeDialog));
selectors.closeSeedDialog.forEach((button) => button.addEventListener('click', closeSeedTruckDialog));

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    selectors.app.hidden = true;
    setAuthenticatedView(false);
    selectors.sessionSummary.textContent = '';
    return;
  }

  setAuthenticatedView(true);
  await loadSnapshot();
});
