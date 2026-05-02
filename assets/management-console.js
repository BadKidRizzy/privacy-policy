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
  seedEvents: [],
  searchByTab: {
    owners: '',
    trucks: '',
    foodies: '',
    organizers: '',
    events: '',
  },
  truckFilters: {
    claim: 'all',
    movement: 'all',
    source: 'all',
    missing: 'all',
  },
  truckSort: 'recently_updated',
  bulkPreview: null,
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
  truckControls: document.querySelector('[data-truck-controls]'),
  truckFilterInputs: Array.from(document.querySelectorAll('[data-truck-filter]')),
  truckSort: document.querySelector('[data-truck-sort]'),
  bulkImport: document.querySelector('[data-bulk-import]'),
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
  transferTruck: document.querySelector('[data-transfer-truck]'),
  markReviewed: document.querySelector('[data-mark-reviewed]'),
  archiveTruck: document.querySelector('[data-archive-truck]'),
  closeDialog: Array.from(document.querySelectorAll('[data-close-dialog]')),
  seedDialog: document.querySelector('[data-seed-dialog]'),
  seedForm: document.querySelector('[data-seed-form]'),
  seedMessage: document.querySelector('[data-seed-message]'),
  seedOwnerOptions: document.querySelector('[data-seed-owner-options]'),
  closeSeedDialog: Array.from(document.querySelectorAll('[data-close-seed-dialog]')),
  transferDialog: document.querySelector('[data-transfer-dialog]'),
  transferForm: document.querySelector('[data-transfer-form]'),
  transferTitle: document.querySelector('[data-transfer-title]'),
  transferMessage: document.querySelector('[data-transfer-message]'),
  transferOwnerOptions: document.querySelector('[data-transfer-owner-options]'),
  closeTransferDialog: Array.from(document.querySelectorAll('[data-close-transfer-dialog]')),
  bulkDialog: document.querySelector('[data-bulk-dialog]'),
  bulkForm: document.querySelector('[data-bulk-form]'),
  bulkRows: document.querySelector('[data-bulk-rows]'),
  bulkMessage: document.querySelector('[data-bulk-message]'),
  bulkOwnerOptions: document.querySelector('[data-bulk-owner-options]'),
  bulkEventOptions: document.querySelector('[data-bulk-event-options]'),
  addBulkRow: document.querySelector('[data-add-bulk-row]'),
  previewBulk: document.querySelector('[data-preview-bulk]'),
  importBulk: document.querySelector('[data-import-bulk]'),
  closeBulkDialog: Array.from(document.querySelectorAll('[data-close-bulk-dialog]')),
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
const transferTruckOwnership = functions.httpsCallable('transferManagementTruckOwnership');
const previewTruckImport = functions.httpsCallable('previewManagementConsoleTruckImport');
const importTrucks = functions.httpsCallable('importManagementConsoleTrucks');

const MAX_ADMIN_UPLOAD_BYTES = 5 * 1024 * 1024;
const INITIAL_BULK_ROW_COUNT = 5;

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
    columns: ['Truck', 'Owner', 'Location', 'Source', 'Movement', 'Health', 'Updated', 'Action'],
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
    {name: 'adminSummary', label: 'Admin Detail Summary', type: 'summary', wide: true},
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
    {name: 'seeded', label: 'Seeded Truck', type: 'checkbox'},
    {name: 'claimed', label: 'Claimed', type: 'checkbox'},
    {name: 'archived', label: 'Archived / Deactivated', type: 'checkbox'},
    {name: 'seedSource', label: 'Seed Source', type: 'select', options: ['photo_seed', 'event_seed', 'admin_bulk_import', 'owner_created']},
    {name: 'sourceName', label: 'Source Name', type: 'text'},
    {name: 'sourceUrl', label: 'Source URL', type: 'text'},
    {name: 'sourceId', label: 'Source ID', type: 'text'},
    {name: 'eventId', label: 'Event ID', type: 'text'},
    {name: 'eventName', label: 'Event Name', type: 'text'},
    {name: 'adminNotes', label: 'Admin Notes', type: 'textarea', wide: true},
    {name: 'enrichmentStatus', label: 'Enrichment Status', type: 'text'},
    {name: 'seedConfidenceScore', label: 'Seed Confidence Score', type: 'number'},
    {name: 'seedWarnings', label: 'Seed Warnings, comma separated', type: 'textarea', wide: true},
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

function movementPill(record) {
  const status = record.movementStatus || record.lastMovementStatus || 'no_location_data';
  const label = record.movementStatusLabel || status.replace(/_/g, ' ');
  const className = status === 'active'
    ? 'status-pill--success'
    : status === 'inactive'
      ? 'status-pill--danger'
      : status === 'stale' || status === 'needs_review'
        ? 'status-pill--warn'
        : '';
  const days = record.daysSinceLastMovement == null
    ? 'No movement date'
    : `${record.daysSinceLastMovement}d`;

  return `
    <div>
      <span class="status-pill ${className}">${escapeHtml(label)}</span>
      <span class="muted-cell">${escapeHtml(days)}</span>
    </div>
  `;
}

function yesNo(value) {
  return value ? 'Yes' : 'No';
}

function getTruckValidationWarnings(record) {
  return Array.isArray(record.validationWarnings)
    ? record.validationWarnings
    : [
        record.truckImage ? '' : 'missing_photo',
        record.menuImage || (Array.isArray(record.menuImages) && record.menuImages.length) ? '' : 'missing_menu',
        record.currentAddress ? '' : 'missing_address',
        record.ownerId || record.ownerUid ? '' : 'missing_owner',
      ].filter(Boolean);
}

function renderTruckHealth(record) {
  const warnings = getTruckValidationWarnings(record);

  if (record.archived) {
    warnings.unshift('archived');
  }

  if (!warnings.length) {
    return '<span class="status-pill status-pill--success">Complete</span>';
  }

  return `
    <div class="truck-health">
      ${warnings.map((warning) => `<span class="status-pill status-pill--warn">${escapeHtml(warning.replace(/_/g, ' '))}</span>`).join('')}
    </div>
  `;
}

function toTimestamp(value) {
  if (!value) return 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function compareText(left, right) {
  return String(left || '').localeCompare(String(right || ''), undefined, {sensitivity: 'base'});
}

function matchesTruckFilters(record) {
  const filters = state.truckFilters;
  const claimed = record.claimed === true || record.claimStatus === 'claimed';
  const seeded = record.seeded === true || Boolean(record.seedSource || record.seededBy || record.managementCreatedBy);
  const movement = record.movementStatus || record.lastMovementStatus || 'no_location_data';
  const warnings = getTruckValidationWarnings(record);
  const source = String(record.seedSource || record.seededBy || '').toLowerCase();

  if (filters.claim === 'claimed' && !claimed) return false;
  if (filters.claim === 'unclaimed' && claimed) return false;
  if (filters.movement !== 'all' && movement !== filters.movement) return false;
  if (filters.source === 'seeded' && !seeded) return false;
  if (filters.source === 'owner-created' && seeded) return false;
  if (filters.source === 'event_seed' && source !== 'event_seed') return false;
  if (filters.missing !== 'all' && !warnings.includes(filters.missing)) return false;

  return true;
}

function sortTruckRecords(records) {
  const sorted = [...records];

  sorted.sort((left, right) => {
    if (state.truckSort === 'last_location_update') {
      return toTimestamp(right.lastLocationUpdatedAt || right.locationUpdatedAt) - toTimestamp(left.lastLocationUpdatedAt || left.locationUpdatedAt);
    }
    if (state.truckSort === 'oldest_movement') {
      return toTimestamp(left.lastLocationUpdatedAt || left.locationUpdatedAt) - toTimestamp(right.lastLocationUpdatedAt || right.locationUpdatedAt);
    }
    if (state.truckSort === 'truck_name') {
      return compareText(left.name, right.name);
    }
    if (state.truckSort === 'created_date') {
      return toTimestamp(right.createdAt) - toTimestamp(left.createdAt);
    }
    return toTimestamp(right.updatedAt || right.managementUpdatedAt) - toTimestamp(left.updatedAt || left.managementUpdatedAt);
  });

  return sorted;
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

function renderEventIdDatalist() {
  const publicEvents = state.events.map((event) => ({
    id: event.id,
    label: [event.title, event.address].filter(Boolean).join(' - '),
  }));
  const seedEvents = state.seedEvents.map((event) => ({
    id: event.id,
    label: [event.eventName, event.eventAddress].filter(Boolean).join(' - '),
  }));
  const options = [...publicEvents, ...seedEvents]
    .filter((event) => event.id)
    .sort((a, b) => a.label.localeCompare(b.label));

  if (!options.length) return '';

  return `
    <datalist id="event-id-options">
      ${options.map((option) => `<option value="${escapeHtml(option.id)}" label="${escapeHtml(option.label)}"></option>`).join('')}
    </datalist>
  `;
}

function getActiveRecords() {
  const config = tabConfig[state.activeTab];
  const source = config.collection === 'users'
    ? state.users
    : config.collection === 'foodTrucks'
      ? state.trucks
      : state.events;
  const query = getCurrentSearch().trim().toLowerCase();

  const records = source
    .filter(config.filter)
    .filter((record) => !query || recordText(record).includes(query))
    .filter((record) => state.activeTab !== 'trucks' || matchesTruckFilters(record));

  return state.activeTab === 'trucks' ? sortTruckRecords(records) : records;
}

function renderMetrics() {
  const ownerCount = state.users.filter((user) => user.userType === 'Owner').length;
  const activeTruckCount = state.trucks.filter((truck) => truck.movementStatus === 'active').length;
  const needsReviewCount = state.trucks.filter((truck) => truck.movementStatus === 'needs_review').length;
  const staleTruckCount = state.trucks.filter((truck) => truck.movementStatus === 'stale').length;
  const inactiveTruckCount = state.trucks.filter((truck) => truck.movementStatus === 'inactive').length;
  const unclaimedSeededCount = state.trucks.filter((truck) => {
    const seeded = truck.seeded === true || truck.seedSource || truck.seededBy || truck.managementCreatedBy;
    const claimed = truck.claimed === true || truck.claimStatus === 'claimed';
    return seeded && !claimed;
  }).length;

  selectors.metrics.innerHTML = [
    ['Total trucks', state.trucks.length],
    ['Active trucks', activeTruckCount],
    ['Needs review', needsReviewCount],
    ['Stale trucks', staleTruckCount],
    ['Inactive trucks', inactiveTruckCount],
    ['Unclaimed seeded', unclaimedSeededCount],
    ['Owners', ownerCount],
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
  if (selectors.bulkImport) {
    selectors.bulkImport.hidden = state.activeTab !== 'trucks';
  }
  if (selectors.truckControls) {
    selectors.truckControls.hidden = state.activeTab !== 'trucks';
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
  const owner = getUserById(record.ownerUid || record.ownerId);
  const status = record.archived ? 'archived' : record.isMapHidden ? 'hidden' : record.isOpen ? 'open' : 'closed';
  const sourceLabel = record.eventName || record.sourceName || record.seedSource || (record.seeded ? 'Seeded' : 'Owner-created');
  return `
    <tr>
      <td>${titleCell(record.name || 'Truck', record.id, record.truckImage)}</td>
      <td>
        <strong>${escapeHtml(owner?.name || record.ownerEmail || 'Unknown owner')}</strong>
        <span class="muted-cell">${escapeHtml(record.ownerUid || record.ownerId || 'No owner id')}</span>
      </td>
      <td>${escapeHtml(record.currentAddress || 'No address')}</td>
      <td>
        <strong>${escapeHtml(sourceLabel)}</strong>
        <span class="muted-cell">${escapeHtml(record.sourceUrl || record.sourceId || '')}</span>
      </td>
      <td>${movementPill(record)}</td>
      <td>${renderTruckHealth(record)}</td>
      <td>
        ${formatShortDate(record.updatedAt)}
        <span class="muted-cell">${statusPill(status, ['closed', 'hidden', 'archived'])}</span>
      </td>
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
    const result = await getSnapshot({limit: 500});
    const data = result.data || {};
    state.admin = data.admin || null;
    state.loadedAt = data.loadedAt || new Date().toISOString();
    state.users = data.users || [];
    state.trucks = data.trucks || [];
    state.events = data.events || [];
    state.seedEvents = data.seedEvents || [];
    selectors.app.hidden = false;
    setAuthenticatedView(true);
    selectors.sessionSummary.textContent = `Signed in as ${auth.currentUser?.email || state.admin?.email || 'admin'}. Showing up to ${data.limit || 500} records per collection.`;
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
  selectors.transferTruck.hidden = collection !== 'foodTrucks';
  selectors.markReviewed.hidden = collection !== 'foodTrucks';
  selectors.archiveTruck.hidden = collection !== 'foodTrucks' || record.archived === true;
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
  selectors.transferTruck.hidden = true;
  selectors.markReviewed.hidden = true;
  selectors.archiveTruck.hidden = true;

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

function openTransferDialog() {
  if (!state.selected || state.selected.collection !== 'foodTrucks') return;
  const truck = state.selected.record;
  selectors.transferForm?.reset();
  selectors.transferTitle.textContent = `Transfer ${truck.name || 'Truck'}`;
  selectors.transferOwnerOptions.innerHTML = renderOwnerEmailDatalist();
  setMessage(selectors.transferMessage, '');

  if (typeof selectors.transferDialog?.showModal === 'function') {
    selectors.transferDialog.showModal();
  } else {
    selectors.transferDialog?.setAttribute('open', '');
  }
}

function closeTransferDialog() {
  if (typeof selectors.transferDialog?.close === 'function') {
    selectors.transferDialog.close();
  } else {
    selectors.transferDialog?.removeAttribute('open');
  }
}

async function submitTransferTruck() {
  if (!state.selected || state.selected.collection !== 'foodTrucks' || !selectors.transferForm) return;

  const formData = new FormData(selectors.transferForm);
  const newOwnerEmail = String(formData.get('newOwnerEmail') || '').trim();
  const newOwnerUid = String(formData.get('newOwnerUid') || '').trim();
  const transferReason = String(formData.get('transferReason') || '').trim();

  if (!newOwnerEmail && !newOwnerUid) {
    setMessage(selectors.transferMessage, 'Enter the new owner email or UID.', true);
    return;
  }

  if (!transferReason) {
    setMessage(selectors.transferMessage, 'Transfer reason is required.', true);
    return;
  }

  const confirmed = window.confirm(
    `Transfer ${state.selected.record.name || 'this truck'} to ${newOwnerEmail || newOwnerUid}? This keeps photos, menus, reviews, and favorites.`
  );
  if (!confirmed) return;

  setMessage(selectors.transferMessage, 'Transferring ownership...');

  try {
    await transferTruckOwnership({
      truckId: state.selected.id,
      newOwnerEmail,
      newOwnerUid,
      transferReason,
    });
    setMessage(selectors.transferMessage, 'Transfer complete. Refreshing...');
    await loadSnapshot();
    closeTransferDialog();
    closeDialog();
  } catch (error) {
    setMessage(selectors.transferMessage, error.message || 'Transfer failed.', true);
  }
}

function renderField(field, record) {
  const value = record[field.name];
  const wideClass = field.wide ? ' record-field--wide' : '';

  if (field.type === 'summary') {
    const images = [
      record.truckImage,
      ...(Array.isArray(record.menuImages) ? record.menuImages : []),
    ].filter(Boolean).slice(0, 4);

    return `
      <div class="truck-detail-card">
        <h3>${escapeHtml(field.label)}</h3>
        <div class="truck-detail-grid">
          <div><strong>Owner</strong>${escapeHtml(record.ownerEmail || record.ownerUid || record.ownerId || 'Missing')}</div>
          <div><strong>Claim</strong>${escapeHtml(record.claimStatus || (record.claimed ? 'claimed' : 'unclaimed'))}</div>
          <div><strong>Source</strong>${escapeHtml(record.eventName || record.seedSource || record.sourceName || 'Unknown')}</div>
          <div><strong>Movement</strong>${escapeHtml(record.movementStatusLabel || 'No Location Data')}</div>
          <div><strong>Days Since Movement</strong>${escapeHtml(record.daysSinceLastMovement ?? 'Not set')}</div>
          <div><strong>Visibility</strong>${escapeHtml(record.archived ? 'Archived' : record.isMapHidden ? 'Hidden from map' : 'Visible')}</div>
          <div><strong>Created</strong>${escapeHtml(formatDate(record.createdAt))}</div>
          <div><strong>Updated</strong>${escapeHtml(formatDate(record.updatedAt))}</div>
          <div><strong>Reviewed</strong>${escapeHtml(formatDate(record.lastReviewedAt))}</div>
        </div>
        <div class="truck-health">${renderTruckHealth(record)}</div>
        ${images.length ? `<div class="truck-detail-media">${images.map((url) => `<img src="${escapeHtml(url)}" alt="">`).join('')}</div>` : ''}
      </div>
    `;
  }

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

function createBulkRowHtml(index) {
  return `
    <tr data-bulk-row>
      <td>
        <label class="bulk-mini-field">
          <span>Truck name</span>
          <input data-bulk-field="name" type="text" placeholder="Truck name">
        </label>
      </td>
      <td>
        <label class="bulk-mini-field">
          <span>Truck photo</span>
          <input data-bulk-field="truckImage" type="file" accept="image/jpeg,image/png,image/webp">
        </label>
      </td>
      <td>
        <label class="bulk-mini-field">
          <span>Menu photo</span>
          <input data-bulk-field="menuImages" type="file" accept="image/jpeg,image/png,image/webp">
        </label>
        <input data-bulk-field="duplicateAction" type="hidden" value="skip">
      </td>
      <td class="bulk-row-status" data-bulk-status>Row ${index + 1} pending preview.</td>
    </tr>
  `;
}

function resetBulkRows(count = INITIAL_BULK_ROW_COUNT) {
  if (!selectors.bulkRows) return;
  selectors.bulkRows.innerHTML = Array.from({length: count}, (_value, index) => createBulkRowHtml(index)).join('');
  state.bulkPreview = null;
  if (selectors.importBulk) selectors.importBulk.disabled = true;
}

function openBulkImportDialog() {
  selectors.bulkForm?.reset();
  if (selectors.bulkOwnerOptions) {
    selectors.bulkOwnerOptions.innerHTML = renderOwnerEmailDatalist();
  }
  if (selectors.bulkEventOptions) {
    selectors.bulkEventOptions.innerHTML = renderEventIdDatalist();
  }
  resetBulkRows();
  setMessage(selectors.bulkMessage, '');

  if (typeof selectors.bulkDialog?.showModal === 'function') {
    selectors.bulkDialog.showModal();
  } else {
    selectors.bulkDialog?.setAttribute('open', '');
  }
}

function closeBulkImportDialog() {
  if (typeof selectors.bulkDialog?.close === 'function') {
    selectors.bulkDialog.close();
  } else {
    selectors.bulkDialog?.removeAttribute('open');
  }
}

function addBulkRow() {
  if (!selectors.bulkRows) return;
  const index = selectors.bulkRows.querySelectorAll('[data-bulk-row]').length;
  selectors.bulkRows.insertAdjacentHTML('beforeend', createBulkRowHtml(index));
  if (selectors.importBulk) selectors.importBulk.disabled = true;
}

function getBulkEventPayload() {
  const formData = new FormData(selectors.bulkForm);
  return {
    eventId: String(formData.get('eventId') || '').trim(),
    eventName: String(formData.get('eventName') || '').trim(),
    eventDate: String(formData.get('eventDate') || '').trim(),
    eventAddress: String(formData.get('eventAddress') || '').trim(),
    eventCity: String(formData.get('eventCity') || '').trim(),
    eventState: String(formData.get('eventState') || '').trim(),
    eventZip: String(formData.get('eventZip') || '').trim(),
    eventLatitude: String(formData.get('eventLatitude') || '').trim(),
    eventLongitude: String(formData.get('eventLongitude') || '').trim(),
    sourceUrl: String(formData.get('sourceUrl') || '').trim(),
  };
}

function getBulkRowValue(row, field) {
  const input = row.querySelector(`[data-bulk-field="${field}"]`);
  if (!input) return '';
  return input.type === 'file' ? input : input.value.trim();
}

function collectBulkRows(includeFiles = false) {
  return Array.from(selectors.bulkRows?.querySelectorAll('[data-bulk-row]') || [])
    .map((row, index) => {
      const truckImageInput = getBulkRowValue(row, 'truckImage');
      const menuImagesInput = getBulkRowValue(row, 'menuImages');
      const payload = {
        rowId: `row-${index + 1}`,
        name: getBulkRowValue(row, 'name'),
        duplicateAction: getBulkRowValue(row, 'duplicateAction') || 'skip',
      };

      if (includeFiles) {
        payload.truckImageFile = truckImageInput?.files?.[0] || null;
        payload.menuImageFiles = Array.from(menuImagesInput?.files || []);
      }

      return payload;
    })
    .filter((row) => {
      const hasFile = Boolean(row.truckImageFile) || row.menuImageFiles?.length > 0;
      const hasValue = Object.entries(row).some(([key, value]) =>
        !['rowId', 'duplicateAction', 'truckImageFile', 'menuImageFiles'].includes(key)
        && (Array.isArray(value) ? value.length > 0 : Boolean(value))
      );
      return hasFile || hasValue;
    });
}

function setBulkRowStatus(rowId, html) {
  const index = Number(String(rowId).replace('row-', '')) - 1;
  const row = selectors.bulkRows?.querySelectorAll('[data-bulk-row]')[index];
  const status = row?.querySelector('[data-bulk-status]');
  if (status) status.innerHTML = html;
}

async function previewBulkImport() {
  const rows = collectBulkRows(true).map((row) => {
    const next = {...row};
    if (row.truckImageFile) {
      next.truckImage = {fileName: row.truckImageFile.name, contentType: row.truckImageFile.type, dataUrl: 'selected-for-preview'};
    }
    if (row.menuImageFiles?.length) {
      next.menuImages = row.menuImageFiles.slice(0, 3).map((file) => ({
        fileName: file.name,
        contentType: file.type,
        dataUrl: 'selected-for-preview',
      }));
    }
    delete next.truckImageFile;
    delete next.menuImageFiles;
    return next;
  });

  if (!rows.length) {
    setMessage(selectors.bulkMessage, 'Add at least one truck row.', true);
    return;
  }

  setMessage(selectors.bulkMessage, 'Checking validation and duplicates...');

  try {
    const result = await previewTruckImport({
      event: getBulkEventPayload(),
      rows,
    });
    const previewRows = result.data?.rows || [];
    state.bulkPreview = previewRows;

    previewRows.forEach((row) => {
      const errors = row.errors || [];
      const warnings = row.warnings || [];
      const duplicates = row.duplicates || [];
      setBulkRowStatus(row.rowId, `
        ${errors.length ? `<div class="error"><strong>Errors</strong><br>${errors.map(escapeHtml).join('<br>')}</div>` : '<strong>Valid</strong>'}
        ${warnings.length ? `<div class="warning">${warnings.map(escapeHtml).join('<br>')}</div>` : ''}
        ${duplicates.length ? `<div class="warning">Possible duplicate: ${duplicates.map((item) => escapeHtml(item.name || item.truckId)).join(', ')}</div>` : ''}
      `);
    });

    const hasErrors = previewRows.some((row) => row.errors?.length);
    selectors.importBulk.disabled = hasErrors;
    setMessage(selectors.bulkMessage, hasErrors ? 'Fix row errors before import.' : 'Preview ready. Possible duplicates will be skipped.');
  } catch (error) {
    setMessage(selectors.bulkMessage, error.message || 'Preview failed.', true);
  }
}

async function attachBulkImages(rows) {
  const prepared = [];

  for (const row of rows) {
    const next = {...row};
    delete next.truckImageFile;
    delete next.menuImageFiles;

    if (row.truckImageFile) {
      next.truckImage = await buildImagePayload(row.truckImageFile);
    }

    if (row.menuImageFiles?.length) {
      next.menuImages = [];
      for (const file of row.menuImageFiles.slice(0, 3)) {
        next.menuImages.push(await buildImagePayload(file));
      }
    }

    prepared.push(next);
  }

  return prepared;
}

async function submitBulkImport() {
  const rows = collectBulkRows(true);

  if (!rows.length) {
    setMessage(selectors.bulkMessage, 'Add at least one truck row.', true);
    return;
  }

  const confirmed = window.confirm('Import the valid rows now? Duplicate rows set to Skip will not be created.');
  if (!confirmed) return;

  try {
    selectors.importBulk.disabled = true;
    setMessage(selectors.bulkMessage, 'Reading images...');
    const rowsWithImages = await attachBulkImages(rows);

    setMessage(selectors.bulkMessage, 'Importing trucks...');
    const result = await importTrucks({
      event: getBulkEventPayload(),
      rows: rowsWithImages,
    });
    const results = result.data?.results || [];

    results.forEach((row) => {
      const errors = row.errors || [];
      const warnings = row.warnings || [];
      setBulkRowStatus(row.rowId, `
        <strong>${escapeHtml(row.status || 'done')}</strong>
        ${row.truckId ? `<br>${escapeHtml(row.truckId)}` : ''}
        ${errors.length ? `<div class="error">${errors.map(escapeHtml).join('<br>')}</div>` : ''}
        ${warnings.length ? `<div class="warning">${warnings.map(escapeHtml).join('<br>')}</div>` : ''}
      `);
    });

    setMessage(selectors.bulkMessage, 'Import complete. Refreshing dashboard...');
    state.activeTab = 'trucks';
    await loadSnapshot();
  } catch (error) {
    setMessage(selectors.bulkMessage, error.message || 'Bulk import failed.', true);
  } finally {
    selectors.importBulk.disabled = false;
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

async function markSelectedTruckReviewed() {
  if (!state.selected || state.selected.collection !== 'foodTrucks') return;
  setMessage(selectors.recordMessage, 'Marking reviewed...');

  try {
    await updateRecord({
      collection: 'foodTrucks',
      id: state.selected.id,
      updates: {adminAction: 'mark_reviewed'},
    });
    await loadSnapshot();
    closeDialog();
  } catch (error) {
    setMessage(selectors.recordMessage, error.message || 'Could not mark reviewed.', true);
  }
}

async function archiveSelectedTruck() {
  if (!state.selected || state.selected.collection !== 'foodTrucks') return;

  const confirmed = window.confirm(`Archive/deactivate ${state.selected.record.name || 'this truck'} and hide it from the map?`);
  if (!confirmed) return;

  setMessage(selectors.recordMessage, 'Archiving truck...');

  try {
    await updateRecord({
      collection: 'foodTrucks',
      id: state.selected.id,
      updates: {adminAction: 'archive'},
    });
    await loadSnapshot();
    closeDialog();
  } catch (error) {
    setMessage(selectors.recordMessage, error.message || 'Could not archive truck.', true);
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
selectors.bulkImport?.addEventListener('click', openBulkImportDialog);
selectors.transferTruck?.addEventListener('click', openTransferDialog);
selectors.markReviewed?.addEventListener('click', markSelectedTruckReviewed);
selectors.archiveTruck?.addEventListener('click', archiveSelectedTruck);

selectors.truckFilterInputs.forEach((input) => {
  input.addEventListener('change', (event) => {
    state.truckFilters[event.target.dataset.truckFilter] = event.target.value || 'all';
    renderTable();
  });
});

selectors.truckSort?.addEventListener('change', (event) => {
  state.truckSort = event.target.value || 'recently_updated';
  renderTable();
});

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

selectors.transferForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  await submitTransferTruck();
});

selectors.addBulkRow?.addEventListener('click', addBulkRow);
selectors.previewBulk?.addEventListener('click', previewBulkImport);
selectors.bulkForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  await submitBulkImport();
});

selectors.deleteRecord?.addEventListener('click', deleteSelectedRecord);
selectors.closeDialog.forEach((button) => button.addEventListener('click', closeDialog));
selectors.closeSeedDialog.forEach((button) => button.addEventListener('click', closeSeedTruckDialog));
selectors.closeTransferDialog.forEach((button) => button.addEventListener('click', closeTransferDialog));
selectors.closeBulkDialog.forEach((button) => button.addEventListener('click', closeBulkImportDialog));

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
