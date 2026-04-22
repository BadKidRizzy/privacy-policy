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
  search: '',
  selected: null,
};

const selectors = {
  loginForm: document.querySelector('[data-login-form]'),
  authMessage: document.querySelector('[data-auth-message]'),
  signOut: document.querySelector('[data-sign-out]'),
  app: document.querySelector('[data-console-app]'),
  sessionSummary: document.querySelector('[data-session-summary]'),
  metrics: document.querySelector('[data-metrics]'),
  refresh: document.querySelector('[data-refresh]'),
  search: document.querySelector('[data-search]'),
  tabs: Array.from(document.querySelectorAll('[data-tab]')),
  panelTitle: document.querySelector('[data-panel-title]'),
  panelDescription: document.querySelector('[data-panel-description]'),
  loadedAt: document.querySelector('[data-loaded-at]'),
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
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const functions = firebase.app().functions('us-central1');
const getSnapshot = functions.httpsCallable('getManagementConsoleSnapshot');
const updateRecord = functions.httpsCallable('updateManagementConsoleRecord');
const deleteRecord = functions.httpsCallable('deleteManagementConsoleRecord');

const tabConfig = {
  owners: {
    title: 'Owners',
    description: 'Owner account management, truck limits, and account status.',
    collection: 'users',
    filter: (record) => record.userType === 'Owner',
    columns: ['Owner', 'Email', 'Trucks', 'Access', 'Status', 'Auth', 'Action'],
  },
  trucks: {
    title: 'Trucks',
    description: 'Truck profiles, transfer ownership, claim status, and visibility.',
    collection: 'foodTrucks',
    filter: () => true,
    columns: ['Truck', 'Owner', 'Location', 'Claim', 'Status', 'Updated', 'Action'],
  },
  foodies: {
    title: 'Foodies',
    description: 'Foodie accounts and support status.',
    collection: 'users',
    filter: (record) => record.userType === 'Foodie',
    columns: ['Foodie', 'Email', 'Status', 'Auth', 'Created', 'Action'],
  },
  organizers: {
    title: 'Event Organizers',
    description: 'Organizer accounts, organization details, and event access.',
    collection: 'users',
    filter: (record) => record.userType === 'Organizer',
    columns: ['Organizer', 'Organization', 'Email', 'Events', 'Access', 'Status', 'Action'],
  },
  events: {
    title: 'Events',
    description: 'Event records, organizer ownership, capacity, and public status.',
    collection: 'events',
    filter: () => true,
    columns: ['Event', 'Organizer', 'When', 'Capacity', 'Status', 'Updated', 'Action'],
  },
};

const fieldSets = {
  users: [
    {name: 'name', label: 'Name', type: 'text'},
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
    {name: 'ownerId', label: 'Owner UID', type: 'text'},
    {name: 'ownerEmail', label: 'Owner Email', type: 'text'},
    {name: 'description', label: 'Description', type: 'textarea', wide: true},
    {name: 'currentAddress', label: 'Current Address', type: 'textarea', wide: true},
    {name: 'businessPhone', label: 'Business Phone', type: 'text'},
    {name: 'websiteUrl', label: 'Website URL', type: 'text'},
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
    {name: 'transferEligible', label: 'Transfer Eligible', type: 'checkbox'},
  ],
  events: [
    {name: 'title', label: 'Event Title', type: 'text'},
    {name: 'organizerId', label: 'Organizer UID', type: 'text'},
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

function getActiveRecords() {
  const config = tabConfig[state.activeTab];
  const source = config.collection === 'users'
    ? state.users
    : config.collection === 'foodTrucks'
      ? state.trucks
      : state.events;
  const query = state.search.trim().toLowerCase();

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
      <td>${titleCell(record.name || 'Owner', record.id)}</td>
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
      <td>${titleCell(record.name || 'Foodie', record.id)}</td>
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
      <td>${titleCell(record.name || 'Organizer', record.id)}</td>
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
  return `
    <tr>
      <td>${titleCell(record.name || 'Truck', record.id, record.truckImage)}</td>
      <td>
        <strong>${escapeHtml(owner?.name || record.ownerEmail || 'Unknown owner')}</strong>
        <span class="muted-cell">${escapeHtml(record.ownerId || 'No owner id')}</span>
      </td>
      <td>${escapeHtml(record.currentAddress || 'No address')}</td>
      <td>${statusPill(record.claimStatus || 'unclaimed')}</td>
      <td>${statusPill(record.isOpen ? 'open' : 'closed', ['closed'])}</td>
      <td>${formatShortDate(record.updatedAt)}</td>
      <td>${actionButton('foodTrucks', record.id)}</td>
    </tr>
  `;
}

function renderEventRow(record) {
  const organizer = getUserById(record.organizerId);
  const accepted = Array.isArray(record.acceptedTruckIds) ? record.acceptedTruckIds.length : 0;
  const capacity = Number(record.truckCapacity || 0);

  return `
    <tr>
      <td>${titleCell(record.title || 'Event', record.id)}</td>
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
    selectors.signOut.hidden = false;
    selectors.sessionSummary.textContent = `Signed in as ${auth.currentUser?.email || state.admin?.email || 'admin'}. Showing up to ${data.limit || 200} records per collection.`;
    renderAll();
  } catch (error) {
    selectors.app.hidden = true;
    selectors.signOut.hidden = true;
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
  selectors.recordFields.innerHTML = (fieldSets[collection] || [])
    .map((field) => renderField(field, record))
    .join('');

  if (typeof selectors.dialog.showModal === 'function') {
    selectors.dialog.showModal();
  } else {
    selectors.dialog.setAttribute('open', '');
  }
}

function renderField(field, record) {
  const value = record[field.name];
  const wideClass = field.wide ? ' record-field--wide' : '';

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

  return `
    <label class="record-field${wideClass}">
      ${escapeHtml(field.label)}
      <input
        type="${escapeHtml(field.type)}"
        data-field="${escapeHtml(field.name)}"
        data-type="${escapeHtml(field.type)}"
        value="${escapeHtml(inputValue)}"
        ${field.type === 'number' ? 'step="any"' : ''}
      >
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

  selectors.recordFields.querySelectorAll('[data-field]').forEach((input) => {
    const field = input.dataset.field;
    const type = input.dataset.type;

    if (!field) return;

    const nextValue = readInputValue(input, type);
    if (fieldValueMatches(type, nextValue, originalRecord[field])) return;

    updates[field] = nextValue;
  });

  return updates;
}

async function saveSelectedRecord() {
  if (!state.selected) return;

  setMessage(selectors.recordMessage, 'Saving...');

  try {
    await updateRecord({
      collection: state.selected.collection,
      id: state.selected.id,
      updates: readFormUpdates(),
    });
    setMessage(selectors.recordMessage, 'Saved. Refreshing data...');
    await loadSnapshot();
    closeDialog();
  } catch (error) {
    setMessage(selectors.recordMessage, error.message || 'Save failed.', true);
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

selectors.search?.addEventListener('input', (event) => {
  state.search = event.target.value || '';
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
  const button = target?.closest('[data-edit]');
  if (!button) return;
  const [collection, id] = button.dataset.edit.split(':');
  openRecordDialog(collection, id);
});

selectors.recordForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  await saveSelectedRecord();
});

selectors.deleteRecord?.addEventListener('click', deleteSelectedRecord);
selectors.closeDialog.forEach((button) => button.addEventListener('click', closeDialog));

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    selectors.app.hidden = true;
    selectors.signOut.hidden = true;
    selectors.sessionSummary.textContent = '';
    return;
  }

  await loadSnapshot();
});
