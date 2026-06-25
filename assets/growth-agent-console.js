const firebaseConfig = {
  apiKey: 'AIzaSyBWg6A7bQMEXGXhRiXyw_G6v54OqYbhGhc',
  authDomain: 'food-truck-finder-prod.firebaseapp.com',
  projectId: 'food-truck-finder-prod',
  storageBucket: 'food-truck-finder-prod.firebasestorage.app',
  messagingSenderId: '862144269606',
  appId: '1:862144269606:ios:87e34a7659daae408d05e7',
};

const GROWTH_AGENT_API_BASE_URL = 'https://food-truck-growth-agent-xmel35gaya-uc.a.run.app';
const PUBLIC_TRUCK_SHARE_BASE_URL = 'https://www.ftf-foodtruckfinder.com/truck/';
const PUBLIC_SITE_BASE_URL = 'https://www.ftf-foodtruckfinder.com';
const GROWTH_AGENT_STATUSES = [
  'needs_review',
  'not_contacted',
  'contacted',
  'claim_started',
  'claimed',
  'verified',
  'do_not_contact',
];

const state = {
  loading: false,
  loadedAt: '',
  selectedStatus: 'needs_review',
  counts: {},
  leads: [],
  socialDrafts: [],
  lastSync: null,
  lastQueue: null,
  lastSocialBatch: null,
};

const selectors = {
  authSection: document.querySelector('[data-auth-section]'),
  loginForm: document.querySelector('[data-login-form]'),
  authMessage: document.querySelector('[data-auth-message]'),
  app: document.querySelector('[data-growth-agent-app]'),
  sessionSummary: document.querySelector('[data-session-summary]'),
  signOut: document.querySelector('[data-sign-out]'),
  metrics: document.querySelector('[data-growth-agent-metrics]'),
  leads: document.querySelector('[data-growth-agent-leads]'),
  message: document.querySelector('[data-growth-agent-message]'),
  loadedAt: document.querySelector('[data-growth-agent-loaded-at]'),
  status: document.querySelector('[data-growth-agent-status]'),
  refresh: document.querySelector('[data-growth-agent-refresh]'),
  sync: document.querySelector('[data-growth-agent-sync]'),
  queue: document.querySelector('[data-growth-agent-queue]'),
  socialGenerate: document.querySelector('[data-social-generate]'),
  socialRefresh: document.querySelector('[data-social-refresh]'),
  socialCity: document.querySelector('[data-social-city]'),
  socialLimit: document.querySelector('[data-social-limit]'),
  socialOwnerTags: document.querySelector('[data-social-owner-tags]'),
  socialPlatforms: Array.from(document.querySelectorAll('[data-social-platform]')),
  socialDrafts: document.querySelector('[data-social-drafts]'),
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

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

  if (selectors.app) {
    selectors.app.hidden = !isAuthenticated;
  }

  if (selectors.signOut) {
    selectors.signOut.hidden = !isAuthenticated;
  }
}

function setLoading(isLoading) {
  state.loading = isLoading;
  [
    selectors.refresh,
    selectors.sync,
    selectors.queue,
    selectors.status,
    selectors.socialGenerate,
    selectors.socialRefresh,
    selectors.socialCity,
    selectors.socialLimit,
    selectors.socialOwnerTags,
    ...selectors.socialPlatforms,
  ].forEach((control) => {
    if (control) control.disabled = isLoading;
  });
}

function formatDate(value) {
  if (!value) return 'Not set';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'});
}

function formatCount(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function growthStatusLabel(status) {
  return String(status || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function resolvePublicUrl(value, fallbackId = '') {
  const fallback = `${PUBLIC_TRUCK_SHARE_BASE_URL}${encodeURIComponent(fallbackId || '')}/`;

  try {
    return new URL(value || fallback, PUBLIC_SITE_BASE_URL).toString();
  } catch {
    return fallback;
  }
}

async function callGrowthAgent(path, options = {}) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Sign in before opening Growth Agent data.');
  }

  const token = await user.getIdToken();
  const response = await fetch(`${GROWTH_AGENT_API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  let payload = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = {error: text};
    }
  }

  if (!response.ok) {
    throw new Error(payload.error || `Growth Agent request failed with ${response.status}.`);
  }

  return payload;
}

function renderMetrics() {
  if (!selectors.metrics) return;

  const counts = state.counts || {};
  const total = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);
  const metricRows = [
    ['Needs Review', counts.needs_review || 0],
    ['Not Contacted', counts.not_contacted || 0],
    ['Contacted', counts.contacted || 0],
    ['Claims Started', counts.claim_started || 0],
    ['Verified', counts.verified || 0],
    ['All Leads', total],
  ];
  const syncCopy = state.lastSync
    ? `Sync imported ${formatCount(state.lastSync.imported || 0)} and found ${formatCount(state.lastSync.existing || 0)} existing.`
    : 'Truck sync runs daily at 6:00 AM.';
  const queueCopy = state.lastQueue
    ? `Last queue generated ${formatCount(state.lastQueue.items || 0)} review items.`
    : 'Outreach queue runs daily at 6:15 AM.';
  const socialCopy = state.lastSocialBatch
    ? `Last social batch created ${formatCount(state.lastSocialBatch.drafts || 0)} drafts.`
    : 'Social drafts stay in approval until posted manually.';

  selectors.metrics.innerHTML = `
    ${metricRows.map(([label, value]) => `
      <div class="growth-agent-card">
        <strong>${escapeHtml(formatCount(value))}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    `).join('')}
    <div class="growth-agent-card growth-agent-card--wide">
      <strong>Automation</strong>
      <span>${escapeHtml(syncCopy)} ${escapeHtml(queueCopy)} ${escapeHtml(socialCopy)}</span>
    </div>
  `;
}

function renderLeads() {
  if (!selectors.leads) return;

  if (!state.leads.length) {
    selectors.leads.innerHTML = `
      <tr>
        <td colspan="5" class="growth-agent-empty">No Growth Agent leads match this status.</td>
      </tr>
    `;
    return;
  }

  selectors.leads.innerHTML = state.leads.map((lead) => {
    const contact = [
      lead.owner_email,
      lead.owner_phone,
      lead.owner_social_handle,
    ].filter(Boolean).join(' / ') || 'Needs contact research';
    const profileUrl = resolvePublicUrl(lead.profile_url, lead.truck_id);

    return `
      <tr>
        <td>
          <strong>${escapeHtml(lead.truck_name || 'Unnamed truck')}</strong>
          <span>${escapeHtml(lead.city || lead.truck_id || '')}</span>
        </td>
        <td><span class="status-pill">${escapeHtml(growthStatusLabel(lead.outreach_status))}</span></td>
        <td>${escapeHtml(contact)}</td>
        <td>${escapeHtml(lead.priority_score ?? 0)}</td>
        <td><a class="row-action row-action--ghost" href="${escapeHtml(profileUrl)}" target="_blank" rel="noreferrer">Open Profile</a></td>
      </tr>
    `;
  }).join('');
}

function draftPlatform(draft) {
  const platformFlag = (draft.risk_flags || []).find((flag) => String(flag).startsWith('platform:'));
  return platformFlag ? platformFlag.replace('platform:', '') : 'social';
}

function renderSocialDrafts() {
  if (!selectors.socialDrafts) return;

  if (!state.socialDrafts.length) {
    selectors.socialDrafts.innerHTML = `
      <tr>
        <td colspan="4" class="growth-agent-empty">No social drafts are waiting for approval.</td>
      </tr>
    `;
    return;
  }

  selectors.socialDrafts.innerHTML = state.socialDrafts.map((draft) => {
    const platform = draftPlatform(draft);
    const trackingUrl = draft.tracking_url || `${GROWTH_AGENT_API_BASE_URL}/r/${draft.tracking_slug || ''}`;

    return `
      <tr>
        <td><span class="status-pill">${escapeHtml(platform.toUpperCase())}</span></td>
        <td>
          <strong>${escapeHtml(draft.audience || 'Social draft')}</strong>
          <span class="growth-agent-draft-copy">${escapeHtml(draft.text || '')}</span>
        </td>
        <td><span class="status-pill">${escapeHtml(growthStatusLabel(draft.status))}</span></td>
        <td><a class="row-action row-action--ghost" href="${escapeHtml(trackingUrl)}" target="_blank" rel="noreferrer">Open Link</a></td>
      </tr>
    `;
  }).join('');
}

function renderAll() {
  renderMetrics();
  renderLeads();
  renderSocialDrafts();

  if (selectors.loadedAt) {
    selectors.loadedAt.textContent = state.loadedAt
      ? `Loaded ${formatDate(state.loadedAt)}`
      : '';
  }
}

async function loadGrowthAgent() {
  setLoading(true);
  setMessage(selectors.message, 'Loading Growth Agent data...');

  try {
    const countResults = await Promise.all(
      GROWTH_AGENT_STATUSES.map(async (status) => {
        const payload = await callGrowthAgent(`/admin/owner-outreach-leads?status=${encodeURIComponent(status)}&limit=500`);
        return [status, payload.leads?.length || 0];
      })
    );
    const status = state.selectedStatus === 'all' ? '' : `&status=${encodeURIComponent(state.selectedStatus)}`;
    const leadsPayload = await callGrowthAgent(`/admin/owner-outreach-leads?limit=100${status}`);
    const draftPayload = await callGrowthAgent('/admin/campaign-drafts?status=needs_approval&limit=100');

    state.counts = Object.fromEntries(countResults);
    state.leads = leadsPayload.leads || [];
    state.socialDrafts = (draftPayload.drafts || [])
      .filter((draft) => draft.channel === 'social_draft')
      .slice(0, 25);
    state.loadedAt = new Date().toISOString();
    setMessage(selectors.message, 'Growth Agent data loaded.');
    renderAll();
  } catch (error) {
    setMessage(selectors.message, error.message || 'Unable to load Growth Agent data.', true);
  } finally {
    setLoading(false);
  }
}

async function syncGrowthAgentTrucks() {
  setLoading(true);
  setMessage(selectors.message, 'Syncing Firestore trucks into Growth Agent...');

  try {
    const payload = await callGrowthAgent('/admin/sync-firestore-trucks', {
      method: 'POST',
      body: {
        collection: 'foodTrucks',
        public_base_url: PUBLIC_SITE_BASE_URL,
      },
    });
    state.lastSync = payload.sync || null;
    setMessage(selectors.message, 'Truck sync complete. Reloading Growth Agent data...');
    await loadGrowthAgent();
  } catch (error) {
    setMessage(selectors.message, error.message || 'Truck sync failed.', true);
  } finally {
    setLoading(false);
  }
}

async function generateGrowthAgentQueue() {
  setLoading(true);
  setMessage(selectors.message, 'Generating reviewable owner outreach queue...');

  try {
    const payload = await callGrowthAgent('/admin/daily-owner-outreach-queue', {
      method: 'POST',
      body: {
        limit: 25,
        actor: auth.currentUser?.email || 'growth-agent-console',
      },
    });
    state.lastQueue = {
      items: payload.items?.length || 0,
      real_sending_enabled: payload.real_sending_enabled === true,
    };
    setMessage(selectors.message, `Queue generated ${state.lastQueue.items} item${state.lastQueue.items === 1 ? '' : 's'}. Real sending remains disabled.`);
    await loadGrowthAgent();
  } catch (error) {
    setMessage(selectors.message, error.message || 'Queue generation failed.', true);
  } finally {
    setLoading(false);
  }
}

function selectedSocialPlatforms() {
  const platforms = selectors.socialPlatforms
    .filter((input) => input.checked)
    .map((input) => input.value);
  return platforms.length ? platforms : ['instagram', 'facebook', 'tiktok', 'x'];
}

async function generateSocialDrafts() {
  setLoading(true);
  setMessage(selectors.message, 'Generating social drafts for approval...');

  try {
    const city = String(selectors.socialCity?.value || '').trim();
    const limit = Number(selectors.socialLimit?.value || 10);
    const payload = await callGrowthAgent('/admin/social-growth-drafts', {
      method: 'POST',
      body: {
        platforms: selectedSocialPlatforms(),
        city: city || undefined,
        limit: Number.isFinite(limit) ? limit : 10,
        include_owner_tags: selectors.socialOwnerTags?.checked !== false,
        actor: auth.currentUser?.email || 'growth-agent-console',
      },
    });
    const drafts = payload.batch?.drafts || [];
    state.lastSocialBatch = {
      drafts: drafts.length,
      real_publishing_enabled: payload.batch?.real_publishing_enabled === true,
    };
    setMessage(selectors.message, `Created ${drafts.length} social draft${drafts.length === 1 ? '' : 's'} for approval. Real publishing remains disabled.`);
    await loadGrowthAgent();
  } catch (error) {
    setMessage(selectors.message, error.message || 'Social draft generation failed.', true);
  } finally {
    setLoading(false);
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

selectors.refresh?.addEventListener('click', () => {
  void loadGrowthAgent();
});

selectors.sync?.addEventListener('click', () => {
  void syncGrowthAgentTrucks();
});

selectors.queue?.addEventListener('click', () => {
  void generateGrowthAgentQueue();
});

selectors.socialGenerate?.addEventListener('click', () => {
  void generateSocialDrafts();
});

selectors.socialRefresh?.addEventListener('click', () => {
  void loadGrowthAgent();
});

selectors.status?.addEventListener('change', (event) => {
  state.selectedStatus = event.target.value || 'needs_review';
  void loadGrowthAgent();
});

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    setAuthenticatedView(false);
    setMessage(selectors.message, '');
    if (selectors.sessionSummary) {
      selectors.sessionSummary.textContent = '';
    }
    state.socialDrafts = [];
    renderSocialDrafts();
    return;
  }

  setAuthenticatedView(true);
  if (selectors.sessionSummary) {
    selectors.sessionSummary.textContent = `Signed in as ${user.email || 'admin'}. Real publishing and sending remain disabled by default.`;
  }
  await loadGrowthAgent();
});
