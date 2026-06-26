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
const GROWTH_AGENT_TABS = ['review', 'claims', 'social', 'strategy', 'automation', 'reports', 'attribution', 'guide'];
const GROWTH_AGENT_TAB_LABELS = {
  review: 'Drafts',
  claims: 'Truck Leads',
  social: 'Social',
  strategy: 'Strategy',
  automation: 'Automation',
  reports: 'Reports',
  attribution: 'Attribution',
  guide: 'Guide',
};

const state = {
  loading: false,
  loadedAt: '',
  activeTab: 'review',
  loadedTabs: {},
  selectedStatus: 'needs_review',
  selectedDraftStatus: 'needs_approval',
  selectedDraftPlatform: 'all',
  selectedSocialInboxStatus: 'needs_review',
  selectedSocialInboxPlatform: 'all',
  counts: {},
  leads: [],
  draftReviewQueue: null,
  socialInbox: null,
  claimFunnelReport: null,
  weeklyReport: null,
  attributionPerformance: null,
  attributionEvents: [],
  agentBriefing: null,
  agentTasks: [],
  agentMemories: [],
  socialDrafts: [],
  socialStrategyPlan: null,
  autopilotReport: null,
  lastAutopilotPlan: null,
  lastSync: null,
  lastQueue: null,
  lastReconcile: null,
  lastDraftReconcile: null,
  lastSocialBatch: null,
  lastCityDigestBatch: null,
  lastMediaBatch: null,
  lastAgentRun: null,
  lastAttributionRun: null,
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
  dailyAutomationRun: document.querySelector('[data-daily-automation-run]'),
  tabs: document.querySelector('[data-growth-agent-tabs]'),
  tabButtons: Array.from(document.querySelectorAll('[data-growth-agent-tab]')),
  tabPanels: Array.from(document.querySelectorAll('[data-growth-agent-tab-panel]')),
  agentRun: document.querySelector('[data-agent-run]'),
  agentBriefing: document.querySelector('[data-agent-briefing]'),
  agentTasks: document.querySelector('[data-agent-tasks]'),
  agentMemories: document.querySelector('[data-agent-memories]'),
  agentInstructionForm: document.querySelector('[data-agent-instruction-form]'),
  agentInstruction: document.querySelector('[data-agent-instruction]'),
  draftReviewRefresh: document.querySelector('[data-draft-review-refresh]'),
  draftReviewStatus: document.querySelector('[data-draft-review-status]'),
  draftReviewPlatform: document.querySelector('[data-draft-review-platform]'),
  draftReviewLoadedAt: document.querySelector('[data-draft-review-loaded-at]'),
  draftReviewCounts: document.querySelector('[data-draft-review-counts]'),
  draftReviewQueue: document.querySelector('[data-draft-review-queue]'),
  mediaGenerate: document.querySelector('[data-media-generate]'),
  mediaManagerSummary: document.querySelector('[data-media-manager-summary]'),
  socialInboxSync: document.querySelector('[data-social-inbox-sync]'),
  socialInboxRefresh: document.querySelector('[data-social-inbox-refresh]'),
  socialInboxStatus: document.querySelector('[data-social-inbox-status]'),
  socialInboxPlatform: document.querySelector('[data-social-inbox-platform]'),
  socialInboxLoadedAt: document.querySelector('[data-social-inbox-loaded-at]'),
  socialInboxCounts: document.querySelector('[data-social-inbox-counts]'),
  socialInboxSetup: document.querySelector('[data-social-inbox-setup]'),
  socialInboxList: document.querySelector('[data-social-inbox-list]'),
  claimFunnelSummary: document.querySelector('[data-claim-funnel-summary]'),
  claimFunnelRecommendations: document.querySelector('[data-claim-funnel-recommendations]'),
  claimFunnelLeads: document.querySelector('[data-claim-funnel-leads]'),
  weeklyReportGenerate: document.querySelector('[data-weekly-report-generate]'),
  weeklyReportSummary: document.querySelector('[data-weekly-report-summary]'),
  weeklyReportRecommendations: document.querySelector('[data-weekly-report-recommendations]'),
  weeklyReportLists: document.querySelector('[data-weekly-report-lists]'),
  attributionLearningRun: document.querySelector('[data-attribution-learning-run]'),
  attributionRefresh: document.querySelector('[data-attribution-refresh]'),
  attributionSummary: document.querySelector('[data-attribution-summary]'),
  attributionInsights: document.querySelector('[data-attribution-insights]'),
  attributionRows: document.querySelector('[data-attribution-rows]'),
  cityDigestGenerate: document.querySelector('[data-city-digest-generate]'),
  cityDigestCities: document.querySelector('[data-city-digest-cities]'),
  cityDigestCityCount: document.querySelector('[data-city-digest-city-count]'),
  cityDigestTruckLimit: document.querySelector('[data-city-digest-truck-limit]'),
  cityDigestSummary: document.querySelector('[data-city-digest-summary]'),
  socialGenerate: document.querySelector('[data-social-generate]'),
  socialRefresh: document.querySelector('[data-social-refresh]'),
  socialCity: document.querySelector('[data-social-city]'),
  socialLimit: document.querySelector('[data-social-limit]'),
  socialOwnerTags: document.querySelector('[data-social-owner-tags]'),
  socialPlatforms: Array.from(document.querySelectorAll('[data-social-platform]')),
  socialDrafts: document.querySelector('[data-social-drafts]'),
  socialStrategyGenerate: document.querySelector('[data-social-strategy-generate]'),
  socialStrategyDrafts: document.querySelector('[data-social-strategy-drafts]'),
  socialStrategyCompetitors: document.querySelector('[data-social-strategy-competitors]'),
  socialStrategyGoals: document.querySelector('[data-social-strategy-goals]'),
  socialStrategyPlatforms: Array.from(document.querySelectorAll('[data-social-strategy-platform]')),
  socialStrategySummary: document.querySelector('[data-social-strategy-summary]'),
  socialStrategyBoard: document.querySelector('[data-social-strategy-board]'),
  autopilotGenerate: document.querySelector('[data-autopilot-generate]'),
  autopilotRefresh: document.querySelector('[data-autopilot-refresh]'),
  autopilotCity: document.querySelector('[data-autopilot-city]'),
  autopilotDays: document.querySelector('[data-autopilot-days]'),
  autopilotDailyPosts: document.querySelector('[data-autopilot-daily-posts]'),
  autopilotOwnerTags: document.querySelector('[data-autopilot-owner-tags]'),
  autopilotPlatforms: Array.from(document.querySelectorAll('[data-autopilot-platform]')),
  autopilotSummary: document.querySelector('[data-autopilot-summary]'),
  autopilotCalendar: document.querySelector('[data-autopilot-calendar]'),
  autopilotRecommendations: document.querySelector('[data-autopilot-recommendations]'),
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
    selectors.dailyAutomationRun,
    ...selectors.tabButtons,
    selectors.agentRun,
    selectors.agentInstruction,
    selectors.agentInstructionForm?.querySelector('button'),
    selectors.draftReviewRefresh,
    selectors.draftReviewStatus,
    selectors.draftReviewPlatform,
    selectors.mediaGenerate,
    selectors.socialInboxSync,
    selectors.socialInboxRefresh,
    selectors.socialInboxStatus,
    selectors.socialInboxPlatform,
    selectors.weeklyReportGenerate,
    selectors.attributionLearningRun,
    selectors.attributionRefresh,
    selectors.cityDigestGenerate,
    selectors.cityDigestCities,
    selectors.cityDigestCityCount,
    selectors.cityDigestTruckLimit,
    selectors.status,
    selectors.socialGenerate,
    selectors.socialRefresh,
    selectors.socialCity,
    selectors.socialLimit,
    selectors.socialOwnerTags,
    selectors.socialStrategyGenerate,
    selectors.socialStrategyDrafts,
    selectors.socialStrategyCompetitors,
    selectors.socialStrategyGoals,
    selectors.autopilotGenerate,
    selectors.autopilotRefresh,
    selectors.autopilotCity,
    selectors.autopilotDays,
    selectors.autopilotDailyPosts,
    selectors.autopilotOwnerTags,
    ...selectors.socialPlatforms,
    ...selectors.socialStrategyPlatforms,
    ...selectors.autopilotPlatforms,
    ...document.querySelectorAll('[data-draft-action]'),
    ...document.querySelectorAll('[data-media-action]'),
    ...document.querySelectorAll('[data-social-reply-action]'),
    ...document.querySelectorAll('[data-social-thread-status]'),
    ...document.querySelectorAll('[data-agent-task-status]'),
  ].forEach((control) => {
    if (control) control.disabled = isLoading;
  });
}

const PANEL_STORAGE_PREFIX = 'ftf-growth-agent-panel:v2:';
const TAB_STORAGE_KEY = 'ftf-growth-agent-active-tab';

function storageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore private browsing or blocked storage.
  }
}

function panelKey(panel, index) {
  const heading = panel.querySelector('.panel-heading h3')?.textContent || `panel-${index}`;
  return panel.dataset.panelKey || panel.id || slugify(heading) || `panel-${index}`;
}

function validGrowthTab(tab) {
  return GROWTH_AGENT_TABS.includes(tab) ? tab : 'review';
}

function growthTabFromHash() {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return '';
  const panel = document.getElementById(hash.slice(1));
  return panel?.dataset?.growthAgentTabPanel || '';
}

function setActiveGrowthTab(tab, {load = true, persist = true} = {}) {
  const nextTab = validGrowthTab(tab);
  state.activeTab = nextTab;

  selectors.tabButtons.forEach((button) => {
    const isActive = button.dataset.growthAgentTab === nextTab;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    button.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  selectors.tabPanels.forEach((panel) => {
    panel.hidden = panel.dataset.growthAgentTabPanel !== nextTab;
  });

  if (persist) {
    storageSet(TAB_STORAGE_KEY, nextTab);
  }

  if (load && auth.currentUser) {
    void loadGrowthAgent({tab: nextTab});
  }
}

function totalLeadCount() {
  return Object.values(state.counts || {}).reduce((sum, value) => sum + Number(value || 0), 0);
}

function reviewDraftCount() {
  const counts = state.draftReviewQueue?.counts || {};
  return [
    counts.needs_approval,
    counts.approved,
    counts.scheduled,
    counts.published,
    counts.failed,
    counts.rejected,
  ].reduce((sum, value) => sum + Number(value || 0), 0);
}

function updateTabLabels() {
  selectors.tabButtons.forEach((button) => {
    const tab = button.dataset.growthAgentTab || '';
    let label = GROWTH_AGENT_TAB_LABELS[tab] || tab;

    if (tab === 'claims') {
      const leads = totalLeadCount();
      if (leads) label = `${label} (${formatCount(leads)})`;
    }

    if (tab === 'review') {
      const drafts = reviewDraftCount();
      if (drafts) label = `${label} (${formatCount(drafts)})`;
    }

    button.textContent = label;
  });
}

function setPanelCollapsed(panel, collapsed, {persist = true} = {}) {
  const button = panel.querySelector('[data-panel-collapse]');
  const body = panel.querySelector('.growth-agent-panel__body');
  panel.classList.toggle('is-collapsed', collapsed);

  if (body) {
    body.hidden = collapsed;
  }

  if (button) {
    button.textContent = collapsed ? 'Expand' : 'Collapse';
    button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }

  if (persist) {
    storageSet(`${PANEL_STORAGE_PREFIX}${panel.dataset.panelKey}`, collapsed ? 'closed' : 'open');
  }
}

function expandPanelForHash() {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return;

  const target = document.getElementById(hash.slice(1));
  const panel = target?.classList.contains('growth-agent-panel')
    ? target
    : target?.closest?.('.growth-agent-panel');
  if (!panel) return;

  if (panel.dataset.growthAgentTabPanel && panel.hidden) {
    setActiveGrowthTab(panel.dataset.growthAgentTabPanel, {load: true});
  }
  setPanelCollapsed(panel, false);
}

function initGrowthAgentTabs() {
  const hashTab = growthTabFromHash();
  const savedTab = storageGet(TAB_STORAGE_KEY);
  setActiveGrowthTab(hashTab || savedTab || 'review', {load: false, persist: false});
}

function initCollapsiblePanels() {
  const panels = Array.from(document.querySelectorAll('.growth-agent-panel'));
  panels.forEach((panel, index) => {
    const heading = Array.from(panel.children).find((child) => child.classList.contains('panel-heading'));
    if (!heading) return;

    panel.dataset.panelKey = panelKey(panel, index);

    if (!panel.querySelector(':scope > .growth-agent-panel__body')) {
      const body = document.createElement('div');
      body.className = 'growth-agent-panel__body';
      body.id = `${panel.dataset.panelKey}-body`;
      Array.from(panel.children).forEach((child) => {
        if (child !== heading) body.appendChild(child);
      });
      panel.appendChild(body);
    }

    let actions = heading.querySelector('.panel-heading__actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'panel-heading__actions';
      heading.appendChild(actions);
    }

    if (!actions.querySelector('[data-panel-collapse]')) {
      const button = document.createElement('button');
      button.className = 'growth-agent-collapse';
      button.type = 'button';
      button.dataset.panelCollapse = panel.dataset.panelKey;
      button.setAttribute('aria-controls', `${panel.dataset.panelKey}-body`);
      actions.appendChild(button);
    }

    const saved = storageGet(`${PANEL_STORAGE_PREFIX}${panel.dataset.panelKey}`);
    const defaultClosed = panel.dataset.panelDefault === 'closed';
    setPanelCollapsed(panel, saved ? saved === 'closed' : defaultClosed, {persist: false});
  });

  expandPanelForHash();
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

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'truck';
}

function dynamicTruckUrl(truckId, lead = null) {
  const url = new URL('/truck/', PUBLIC_SITE_BASE_URL);
  url.searchParams.set('id', truckId);
  const truckName = lead?.truck_name || lead?.name || '';
  const city = lead?.city || '';
  if (truckName) url.searchParams.set('name', truckName);
  if (city) url.searchParams.set('city', city);
  return url.toString();
}

function staticTruckUrl(lead) {
  const name = slugify(lead?.truck_name || lead?.name || lead?.truck_id || '');
  const city = slugify(lead?.city || lead?.truck_id || '');
  return `${PUBLIC_TRUCK_SHARE_BASE_URL}${encodeURIComponent(city ? `${name}-${city}` : name)}/`;
}

function isRawTruckIdPath(url, truckId) {
  if (!truckId) return false;

  try {
    const parsed = new URL(url, PUBLIC_SITE_BASE_URL);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    return parsed.search === ''
      && pathParts[0] === 'truck'
      && decodeURIComponent(pathParts[1] || '') === String(truckId);
  } catch {
    return false;
  }
}

function resolvePublicUrl(value, fallbackId = '', lead = null) {
  if (fallbackId) {
    return dynamicTruckUrl(fallbackId, lead);
  }

  if (value && !isRawTruckIdPath(value, fallbackId)) {
    try {
      return new URL(value, PUBLIC_SITE_BASE_URL).toString();
    } catch {
      return staticTruckUrl(lead);
    }
  }

  return staticTruckUrl(lead);
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
    const providerMessage = payload.publish_result?.message;
    throw new Error(providerMessage || payload.error || `Growth Agent request failed with ${response.status}.`);
  }

  return payload;
}

function renderMetrics() {
  if (!selectors.metrics) return;

  const counts = state.counts || {};
  const total = totalLeadCount();
  const metricRows = [
    ['Needs Review', counts.needs_review || 0],
    ['Not Contacted', counts.not_contacted || 0],
    ['Contacted', counts.contacted || 0],
    ['Claims Started', counts.claim_started || 0],
    ['Verified', counts.verified || 0],
    ['All Leads', total],
  ];
  const syncCopy = state.lastSync
    ? [
        `Sync imported ${formatCount(state.lastSync.imported || 0)} and found ${formatCount(state.lastSync.existing || 0)} existing.`,
        state.lastReconcile
          ? `${formatCount(state.lastReconcile.blocked || 0)} stale app-truck lead${Number(state.lastReconcile.blocked || 0) === 1 ? '' : 's'} blocked.`
          : '',
        state.lastDraftReconcile
          ? `${formatCount(state.lastDraftReconcile.rejected || 0)} stale draft${Number(state.lastDraftReconcile.rejected || 0) === 1 ? '' : 's'} rejected.`
          : '',
      ].filter(Boolean).join(' ')
    : 'Truck sync runs daily at 6:00 AM.';
  const queueCopy = state.lastQueue
    ? `Last queue generated ${formatCount(state.lastQueue.items || 0)} review items.`
    : 'Outreach queue runs daily at 6:15 AM.';
  const socialCopy = state.lastSocialBatch
    ? `Last social batch created ${formatCount(state.lastSocialBatch.drafts || 0)} drafts.`
    : 'Social drafts stay in approval until posted manually.';
  const autopilotCopy = state.lastAutopilotPlan
    ? `Last autopilot plan created ${formatCount(state.lastAutopilotPlan.drafts || 0)} scheduled drafts.`
    : 'Growth Autopilot builds reviewable scheduled drafts only.';
  const digestCopy = state.lastCityDigestBatch
    ? `Last city digest batch created ${formatCount(state.lastCityDigestBatch.packs || 0)} city pack${Number(state.lastCityDigestBatch.packs || 0) === 1 ? '' : 's'}.`
    : 'Weekly city digests create social, email, push, and SEO drafts.';
  const agentCopy = state.lastAgentRun
    ? `Last agent run created ${formatCount(state.lastAgentRun.tasks || 0)} task${Number(state.lastAgentRun.tasks || 0) === 1 ? '' : 's'}.`
    : 'The autonomous agent creates briefings, tasks, and memories.';
  const mediaCopy = state.lastMediaBatch
    ? `Last media scan selected ${formatCount(state.lastMediaBatch.selected || 0)} existing asset${Number(state.lastMediaBatch.selected || 0) === 1 ? '' : 's'} and found ${formatCount(state.lastMediaBatch.needsReview || 0)} review candidate${Number(state.lastMediaBatch.needsReview || 0) === 1 ? '' : 's'}.`
    : 'Media manager picks existing photos first and holds outside images for review.';
  const attributionCopy = state.lastAttributionRun
    ? `Last attribution learning run updated ${formatCount(state.lastAttributionRun.memories || 0)} memor${Number(state.lastAttributionRun.memories || 0) === 1 ? 'y' : 'ies'} and created ${formatCount(state.lastAttributionRun.tasks || 0)} task${Number(state.lastAttributionRun.tasks || 0) === 1 ? '' : 's'}.`
    : 'Attribution learning ties clicks to app actions and claim outcomes.';

  selectors.metrics.innerHTML = `
    ${metricRows.map(([label, value]) => `
      <div class="growth-agent-card">
        <strong>${escapeHtml(formatCount(value))}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    `).join('')}
    <div class="growth-agent-card growth-agent-card--wide">
      <strong>Automation</strong>
      <span>${escapeHtml(syncCopy)} ${escapeHtml(queueCopy)} ${escapeHtml(socialCopy)} ${escapeHtml(autopilotCopy)} ${escapeHtml(digestCopy)} ${escapeHtml(mediaCopy)} ${escapeHtml(attributionCopy)} ${escapeHtml(agentCopy)}</span>
    </div>
  `;
  updateTabLabels();
}

function agentSuggestedActionLabel(value) {
  const text = String(value || '');
  if (text.includes('campaign-draft-review-queue')) return 'Review draft queue';
  if (text.includes('daily-owner-outreach-queue')) return 'Generate owner outreach';
  if (text.includes('weekly-city-digests')) return 'Create city digest';
  if (text.includes('claim-funnel-report')) return 'Review claim funnel';
  if (text.includes('public-seo-pages')) return 'Create SEO pages';
  if (text.includes('app-store-experiment-briefs')) return 'Create store experiment briefs';
  if (text.includes('weekly-growth-reports')) return 'Review weekly report';
  if (text.includes('social-strategy-plan')) return 'Review social strategy';
  return text || 'No action attached';
}

function memoryPreview(memory) {
  const value = String(memory?.value || '');
  if (!value) return '';
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.entries(parsed)
        .slice(0, 4)
        .map(([key, item]) => `${key}: ${item}`)
        .join(' · ');
    }
  } catch {
    return value;
  }
  return value;
}

function parseMemoryValue(memory) {
  try {
    return JSON.parse(memory?.value || '');
  } catch {
    return memory?.value || '';
  }
}

function strategySectionsFromMemories(memories) {
  const sections = {};
  (memories || []).forEach((memory) => {
    const key = String(memory?.key || '');
    if (!key.startsWith('strategy:')) return;
    sections[key.replace('strategy:', '')] = parseMemoryValue(memory);
  });
  return sections;
}

function strategyListMarkup(values) {
  const items = Array.isArray(values) ? values : [];
  if (!items.length) return '<p>No items recorded yet.</p>';
  return `<ul>${items.slice(0, 8).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function strategyObjectListMarkup(values, titleKey = 'name', detailKey = 'purpose') {
  const items = Array.isArray(values) ? values : [];
  if (!items.length) return '<p>No items recorded yet.</p>';
  return items.slice(0, 6).map((item) => `
    <article class="social-strategy-item">
      <strong>${escapeHtml(item?.[titleKey] || item?.topic || item?.post_idea || 'Strategy item')}</strong>
      <span>${escapeHtml(item?.[detailKey] || item?.why_it_connects || item?.core_message_angle || item?.insight || '')}</span>
    </article>
  `).join('');
}

function renderSocialStrategy() {
  if (!selectors.socialStrategySummary && !selectors.socialStrategyBoard) return;

  const plan = state.socialStrategyPlan || {};
  const sections = plan.sections || strategySectionsFromMemories(plan.memories || []);
  const fullStrategy = sections.full_social_media_strategy || {};
  const audience = plan.audience_psychology || sections.audience_psychology_breakdown || {};
  const authority = plan.authority_positioning || sections.authority_positioning_plan || {};
  const pillars = plan.content_pillars || sections.content_pillars_that_convert || [];
  const calendar = plan.content_calendar || sections['30_day_content_plan'] || [];
  const hooks = plan.stop_scroll_posts || sections.posts_that_stop_the_scroll || [];
  const monetization = plan.monetization_strategy || sections.audience_monetization_strategy || {};
  const briefing = plan.briefing || null;
  const drafts = plan.drafts || [];
  const memoryCount = plan.memories?.length || Object.keys(sections).length;

  if (selectors.socialStrategySummary) {
    const rows = [
      ['Strategy Sections', memoryCount],
      ['Content Pillars', pillars.length || 0],
      ['Calendar Days', calendar.length || 0],
      ['Hook Examples', hooks.length || 0],
      ['Drafts Created', drafts.length || 0],
      ['Growth Goals', (fullStrategy.growth_goals || plan.growth_goals || []).length || 0],
    ];
    selectors.socialStrategySummary.innerHTML = rows.map(([label, value]) => `
      <div class="growth-agent-card">
        <strong>${escapeHtml(formatCount(value))}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    `).join('');
  }

  if (!selectors.socialStrategyBoard) return;
  if (!Object.keys(sections).length && !briefing) {
    selectors.socialStrategyBoard.innerHTML = `
      <div class="growth-agent-empty growth-agent-empty--card">Create a strategy to see the agent's social plan here.</div>
    `;
    return;
  }

  selectors.socialStrategyBoard.innerHTML = `
    <article class="social-strategy-card social-strategy-card--wide">
      <span class="status-pill">Full Social Media Strategy</span>
      <h4>${escapeHtml(fullStrategy.business_name || 'Food Truck Finder')}</h4>
      <p>${escapeHtml(fullStrategy.brand_positioning?.one_liner || plan.brand_positioning?.one_liner || briefing?.summary || '')}</p>
      <div class="social-strategy-split">
        <div>
          <strong>Competitors</strong>
          ${strategyListMarkup(fullStrategy.competitors || plan.competitors || [])}
        </div>
        <div>
          <strong>Growth Goals</strong>
          ${strategyListMarkup(fullStrategy.growth_goals || plan.growth_goals || [])}
        </div>
      </div>
    </article>

    <article class="social-strategy-card">
      <span class="status-pill">Audience Psychology</span>
      <h4>Frustrations, Desires, Habits</h4>
      <strong>Frustrations</strong>
      ${strategyListMarkup(audience.frustrations || [])}
      <strong>Scroll-Stopping Angles</strong>
      ${strategyListMarkup(audience.scroll_stopping_angles || [])}
    </article>

    <article class="social-strategy-card">
      <span class="status-pill">Authority Positioning</span>
      <h4>${escapeHtml(authority.authority_role || 'Local food truck discovery guide')}</h4>
      <p>${escapeHtml(authority.voice || '')}</p>
      ${strategyListMarkup(authority.trust_rules || [])}
    </article>

    <article class="social-strategy-card social-strategy-card--wide">
      <span class="status-pill">Content Pillars That Convert</span>
      <h4>Five Pillars</h4>
      <div class="social-strategy-item-grid">
        ${strategyObjectListMarkup(pillars, 'name', 'purpose')}
      </div>
    </article>

    <article class="social-strategy-card social-strategy-card--wide">
      <span class="status-pill">30-Day Content Plan</span>
      <h4>Next Calendar Ideas</h4>
      <div class="social-strategy-item-grid">
        ${strategyObjectListMarkup(calendar.slice(0, 6), 'post_idea', 'core_message_angle')}
      </div>
    </article>

    <article class="social-strategy-card">
      <span class="status-pill">Posts That Stop The Scroll</span>
      <h4>Hook Examples</h4>
      <div class="social-strategy-item-grid">
        ${strategyObjectListMarkup(hooks, 'hook', 'cta')}
      </div>
    </article>

    <article class="social-strategy-card">
      <span class="status-pill">Audience Monetization</span>
      <h4>Future Offers</h4>
      <p>${escapeHtml(monetization.current_focus || '')}</p>
      <div class="social-strategy-item-grid">
        ${strategyObjectListMarkup(monetization.future_offers || [], 'offer', 'value')}
      </div>
    </article>
  `;
}

function renderAgentPanel() {
  if (selectors.agentBriefing) {
    const briefing = state.agentBriefing;
    if (!briefing) {
      selectors.agentBriefing.innerHTML = `
        <strong>No briefing yet</strong>
        <span>Run the agent brain to create the first briefing and task list.</span>
      `;
    } else {
      const metrics = briefing.metrics || {};
      const recommendations = briefing.recommendations || [];
      const recommendationRows = recommendations.length
        ? recommendations.slice(0, 4).map((item) => `
          <li>${escapeHtml(item.action || item.detail || 'Review growth opportunity')}</li>
        `).join('')
        : '<li>No urgent recommendation recorded.</li>';
      selectors.agentBriefing.innerHTML = `
        <strong>Latest Briefing</strong>
        <p>${escapeHtml(briefing.summary || '')}</p>
        <div class="agent-briefing-metrics">
          <span>${escapeHtml(formatCount(metrics.needs_approval_drafts || 0))} drafts need approval</span>
          <span>${escapeHtml(formatCount(metrics.owner_outreach_queue_candidates || 0))} outreach candidates</span>
          <span>${escapeHtml(metrics.top_city || 'No top city yet')}</span>
        </div>
        <ul>${recommendationRows}</ul>
      `;
    }
  }

  if (selectors.agentTasks) {
    if (!state.agentTasks.length) {
      selectors.agentTasks.innerHTML = '<p class="growth-agent-empty">No open agent tasks.</p>';
    } else {
      selectors.agentTasks.innerHTML = state.agentTasks.map((task) => `
        <article class="agent-task-card">
          <div>
            <span class="${escapeHtml(statusPillClass(task.priority === 'high' ? 'needs_review' : task.status))}">${escapeHtml(growthStatusLabel(task.priority || 'medium'))}</span>
            <strong>${escapeHtml(task.title || 'Agent task')}</strong>
            <p>${escapeHtml(task.description || '')}</p>
            <small>${escapeHtml(agentSuggestedActionLabel(task.suggested_action))}</small>
          </div>
          <div class="growth-agent-actions">
            <button class="row-action row-action--button" type="button" data-agent-task-status="done" data-agent-task-id="${escapeHtml(task.id)}">Done</button>
            <button class="row-action row-action--ghost" type="button" data-agent-task-status="dismissed" data-agent-task-id="${escapeHtml(task.id)}">Dismiss</button>
          </div>
        </article>
      `).join('');
    }
  }

  if (selectors.agentMemories) {
    const memories = state.agentMemories || [];
    selectors.agentMemories.innerHTML = memories.length
      ? memories.slice(0, 12).map((memory) => `
        <article class="agent-memory-card">
          <span>${escapeHtml(growthStatusLabel(memory.memory_type || 'memory'))}</span>
          <strong>${escapeHtml(memory.key || 'memory')}</strong>
          <p>${escapeHtml(memoryPreview(memory))}</p>
        </article>
      `).join('')
      : '<p class="growth-agent-empty">No agent memories saved yet.</p>';
  }
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
    const profileUrl = resolvePublicUrl(lead.profile_url, lead.truck_id, lead);

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
  if (draft.platform) return String(draft.platform).toLowerCase();
  const platformFlag = (draft.risk_flags || []).find((flag) => String(flag).startsWith('platform:'));
  return platformFlag ? platformFlag.replace('platform:', '') : 'social';
}

function draftRiskFlagValue(draft, prefix) {
  const flag = (draft.risk_flags || []).find((item) => String(item).startsWith(prefix));
  return flag ? String(flag).slice(prefix.length) : '';
}

function draftTagSourceMarkup(draft) {
  if (!(draft.risk_flags || []).includes('owner_tag_included')) return '';
  const source = draftRiskFlagValue(draft, 'owner_tag_source:');
  const confidence = draftRiskFlagValue(draft, 'owner_tag_confidence:');
  const labels = {
    approved_candidate: 'Tag source: approved handle candidate',
    prod_social_link: 'Tag source: production truck social link',
    lead_social_handle: 'Tag source: saved lead social handle',
  };
  const label = labels[source] || 'Tag source: approved or saved handle';
  const suffix = confidence ? ` · confidence ${confidence}` : '';
  return `<p class="draft-review-card__tag">${escapeHtml(label + suffix)}</p>`;
}

function draftPublisherResponse(draft) {
  const raw = draft.publisher_response;
  if (!raw) return '';
  if (typeof raw === 'object') {
    const provider = raw.provider ? `${raw.provider}: ` : '';
    return `${provider}${raw.message || JSON.stringify(raw)}`;
  }
  const text = String(raw || '').trim();
  if (!text) return '';
  try {
    const payload = JSON.parse(text);
    const provider = payload.provider ? `${payload.provider}: ` : '';
    let message = payload.message || text;
    if (/HTTP Error 403: Forbidden/i.test(message) && provider.includes('meta-facebook')) {
      message = `${message}. Check that the Meta Page token has Facebook Page publishing permission.`;
    }
    return `${provider}${message}`;
  } catch {
    return text;
  }
}

function draftPublisherErrorMarkup(draft) {
  const response = draftPublisherResponse(draft);
  if (!response) return '';
  return `<p class="draft-review-card__reason">Publisher error: ${escapeHtml(response)}</p>`;
}

function draftSelectedMedia(draft) {
  return draft.selected_media_asset
    || (draft.media_candidates || []).find((candidate) => candidate.status === 'selected')
    || null;
}

function isLikelyImageUrl(value) {
  const text = String(value || '').trim();
  if (!text) return false;
  try {
    const url = new URL(text, window.location.origin);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    if (/\.(jpg|jpeg|png|webp|gif)$/i.test(path)) return true;
    if (url.search.toLowerCase().includes('alt=media') && (host.includes('firebasestorage.googleapis.com') || host.includes('storage.googleapis.com'))) return true;
    if (host === 'picsum.photos') return true;
    return host === 'images.squarespace-cdn.com' || host === 'cdn.prod.website-files.com';
  } catch {
    return false;
  }
}

function mediaPreviewMarkup(candidate, fallbackText = 'Open Source') {
  const url = candidate.thumbnail_url || candidate.source_url;
  if (isLikelyImageUrl(url)) {
    return `<img src="${escapeHtml(url)}" alt="${escapeHtml(candidate.alt_text || candidate.title || 'Media candidate')}" data-media-preview-image>`;
  }
  return `<span class="draft-media-placeholder">${escapeHtml(fallbackText)}</span>`;
}

function draftRequiresMediaBeforePublish(draft) {
  return draftPlatform(draft) === 'instagram' && !draftSelectedMedia(draft);
}

function trackingUrlForDraft(draft) {
  if (draft.tracking_url) return draft.tracking_url;
  if (draft.tracking_slug) return `${GROWTH_AGENT_API_BASE_URL}/r/${draft.tracking_slug}`;
  return '';
}

function draftActionButtons(draftOrSlot) {
  const draftId = draftOrSlot.id || draftOrSlot.draft_id;
  const status = String(draftOrSlot.status || '');
  const platform = draftPlatform(draftOrSlot);
  if (!draftId) return '';

  const buttons = [];
  if (status === 'needs_approval') {
    buttons.push(['approve', 'Approve']);
  }
  if (status === 'failed') {
    buttons.push(['approve', 'Reapprove']);
  }
  if (status === 'approved' && ['facebook', 'instagram'].includes(platform)) {
    if (draftRequiresMediaBeforePublish(draftOrSlot)) {
      buttons.push(['media-required', 'Needs Image', true]);
    } else {
      buttons.push(['publish', 'Post Now']);
    }
  }
  if (status !== 'rejected_by_user' && status !== 'published') {
    buttons.push(['reject', 'Reject']);
  }
  if (status === 'approved' || status === 'needs_approval') {
    buttons.push(['mark-scheduled', 'Schedule']);
  }
  if (status === 'approved' || status === 'scheduled') {
    buttons.push(['mark-published', 'Mark Posted']);
  }

  return `
    <div class="growth-agent-actions">
      ${buttons.map(([action, label, disabled]) => `
        <button class="row-action row-action--button" type="button" data-draft-action="${escapeHtml(action)}" data-draft-id="${escapeHtml(draftId)}" ${disabled ? 'disabled aria-disabled="true" title="Select a media asset before publishing this Instagram draft."' : ''}>
          ${escapeHtml(label)}
        </button>
      `).join('')}
    </div>
  `;
}

function contentFormatLabel(value) {
  const labels = {
    instagram_caption: 'Instagram caption',
    tiktok_caption: 'TikTok caption',
    facebook_post: 'Facebook post',
    x_post: 'X post',
    owner_outreach_email: 'Owner email',
    owner_outreach_dm: 'Owner DM',
    city_discovery_post: 'City discovery',
    city_digest_email: 'City digest email',
    city_digest_push: 'City digest push',
  };
  return labels[value] || growthStatusLabel(value || 'Draft');
}

function statusPillClass(status) {
  const normalized = String(status || '');
  if (normalized === 'published' || normalized === 'verified') return 'status-pill status-pill--success';
  if (normalized.startsWith('rejected') || normalized === 'failed' || normalized === 'do_not_contact') return 'status-pill status-pill--danger';
  if (normalized === 'needs_approval' || normalized === 'needs_review' || normalized === 'claim_started') return 'status-pill status-pill--warn';
  return 'status-pill';
}

function mediaSourceLabel(value) {
  const labels = {
    existing_truck_photo: 'Truck photo',
    existing_menu_photo: 'Menu photo',
    app_profile_page: 'Profile screenshot',
    owner_social_profile: 'Owner social',
    google_image_result: 'Google image',
  };
  return labels[value] || growthStatusLabel(value || 'Media');
}

function mediaActionButtons(candidate) {
  if (!candidate?.id) return '';
  const status = String(candidate.status || '');
  const buttons = [];
  if (status !== 'selected' && status !== 'rejected') {
    buttons.push(['select', 'Select']);
  }
  if (status === 'needs_review') {
    buttons.push(['approve', 'Approve']);
  }
  if (status !== 'rejected') {
    buttons.push(['reject', 'Reject']);
  }
  return `
    <div class="growth-agent-actions">
      ${buttons.map(([action, label]) => `
        <button class="row-action row-action--button" type="button" data-media-action="${escapeHtml(action)}" data-media-id="${escapeHtml(candidate.id)}">
          ${escapeHtml(label)}
        </button>
      `).join('')}
    </div>
  `;
}

function draftNextStep(draft) {
  const status = String(draft.status || '');
  const platform = draftPlatform(draft);
  if (status === 'needs_approval') {
    return 'Next: approve the caption, then it moves to Approved / ready to post.';
  }
  if (status === 'approved' && platform === 'instagram' && !draftSelectedMedia(draft)) {
    return 'Next: select one image before Instagram can publish.';
  }
  if (status === 'approved' && ['facebook', 'instagram'].includes(platform)) {
    return 'Ready: use Post Now to publish from the connected account.';
  }
  if (status === 'failed') {
    return 'Needs attention: check the error, fix media or permissions, then reapprove.';
  }
  if (status === 'published') {
    return 'Published from the Growth Agent.';
  }
  return '';
}

function renderDraftMedia(draft) {
  const candidates = draft.media_candidates || [];
  const selected = draftSelectedMedia(draft);
  const reviewCandidates = candidates
    .filter((candidate) => candidate.status !== 'selected' && candidate.status !== 'rejected')
    .slice(0, 4);

  if (!selected && !reviewCandidates.length) {
    return `
      <div class="draft-media draft-media--empty">
        <strong>No media attached yet</strong>
        <span>Use Find Media to score existing photos and collect outside candidates for review.</span>
      </div>
    `;
  }

  const selectedMarkup = selected ? `
    <article class="draft-media-selected">
      <a href="${escapeHtml(selected.source_url)}" target="_blank" rel="noreferrer">
        ${mediaPreviewMarkup(selected, 'Selected')}
      </a>
      <div>
        <span class="${escapeHtml(statusPillClass(selected.status))}">${escapeHtml(growthStatusLabel(selected.status))}</span>
        <strong>${escapeHtml(selected.title || mediaSourceLabel(selected.source_type))}</strong>
        <small>${escapeHtml(mediaSourceLabel(selected.source_type))} · score ${escapeHtml(selected.quality_score ?? 0)}</small>
        <small>${escapeHtml(selected.license_note || '')}</small>
      </div>
    </article>
  ` : '';

  const candidateMarkup = reviewCandidates.length ? `
    <div class="draft-media-candidates">
      ${reviewCandidates.map((candidate) => `
        <article class="draft-media-candidate">
          <a href="${escapeHtml(candidate.source_url)}" target="_blank" rel="noreferrer">
            ${mediaPreviewMarkup(candidate)}
          </a>
          <div>
            <span class="${escapeHtml(statusPillClass(candidate.status))}">${escapeHtml(growthStatusLabel(candidate.status))}</span>
            <strong>${escapeHtml(candidate.title || mediaSourceLabel(candidate.source_type))}</strong>
            <small>${escapeHtml(mediaSourceLabel(candidate.source_type))} · score ${escapeHtml(candidate.quality_score ?? 0)}</small>
            <small>${escapeHtml(candidate.license_note || '')}</small>
            ${mediaActionButtons(candidate)}
          </div>
        </article>
      `).join('')}
    </div>
  ` : '';

  return `
    <section class="draft-media">
      <div class="draft-media__heading">
        <strong>Media</strong>
        ${draft.needs_media_review ? '<span class="status-pill status-pill--warn">Needs media review</span>' : '<span class="status-pill status-pill--success">Media ready</span>'}
      </div>
      ${selectedMarkup}
      ${candidateMarkup}
    </section>
  `;
}

function renderDraftReviewQueue() {
  const queue = state.draftReviewQueue || {};
  const drafts = queue.drafts || [];
  const counts = queue.counts || {};

  if (selectors.draftReviewCounts) {
    const rows = [
      ['Needs Approval', counts.needs_approval || 0, 'needs_approval'],
      ['Approved / Ready', counts.approved || 0, 'approved'],
      ['Scheduled', counts.scheduled || 0, 'scheduled'],
      ['Published', counts.published || 0, 'published'],
      ['Failed', counts.failed || 0, 'failed'],
      ['Rejected', counts.rejected || 0, 'rejected'],
    ];
    selectors.draftReviewCounts.innerHTML = rows.map(([label, value, status]) => `
      <button class="growth-agent-card growth-agent-card--button ${state.selectedDraftStatus === status ? 'is-active' : ''}" type="button" data-draft-status-filter="${escapeHtml(status)}">
        <strong>${escapeHtml(formatCount(value))}</strong>
        <span>${escapeHtml(label)}</span>
      </button>
    `).join('');
  }

  if (selectors.mediaManagerSummary) {
    const batch = state.lastMediaBatch;
    const draftMedia = drafts.flatMap((draft) => draft.media_candidates || []);
    const selectedCount = draftMedia.filter((candidate) => candidate.status === 'selected').length;
    const reviewCount = draftMedia.filter((candidate) => candidate.status === 'needs_review').length;
    const leads = totalLeadCount();
    const summaryText = batch
      ? `Last scan checked ${formatCount(batch.draftsScanned || 0)} drafts, selected ${formatCount(batch.selected || 0)} existing asset${Number(batch.selected || 0) === 1 ? '' : 's'}, and found ${formatCount(batch.needsReview || 0)} review candidate${Number(batch.needsReview || 0) === 1 ? '' : 's'}.`
      : `Loaded drafts include ${formatCount(selectedCount)} selected media asset${selectedCount === 1 ? '' : 's'} and ${formatCount(reviewCount)} candidate${reviewCount === 1 ? '' : 's'} needing review.`;
    selectors.mediaManagerSummary.innerHTML = `
      <article class="setup-card">
        <strong>Drafts Are Not All Trucks</strong>
        <span>This tab shows generated captions and outreach waiting for approval. ${leads ? `${escapeHtml(formatCount(leads))} truck lead${leads === 1 ? '' : 's'} are in Truck Leads.` : 'Open Truck Leads to see the full truck pool.'}</span>
      </article>
      <article class="setup-card setup-card--ok">
        <strong>Media Review First</strong>
        <span>${escapeHtml(summaryText)} Outside images are candidates only until reviewed.</span>
      </article>
    `;
  }
  updateTabLabels();

  if (selectors.draftReviewLoadedAt) {
    selectors.draftReviewLoadedAt.textContent = state.loadedAt
      ? `Loaded ${formatDate(state.loadedAt)}`
      : '';
  }

  if (!selectors.draftReviewQueue) return;

  if (!drafts.length) {
    const platformLabel = state.selectedDraftPlatform && state.selectedDraftPlatform !== 'all'
      ? ` for ${state.selectedDraftPlatform.toUpperCase()}`
      : '';
    selectors.draftReviewQueue.innerHTML = `
      <div class="growth-agent-empty growth-agent-empty--card">No drafts match this status${escapeHtml(platformLabel)}.</div>
    `;
    return;
  }

  selectors.draftReviewQueue.innerHTML = drafts.map((draft) => {
    const isCityDigest = String(draft.content_format || '').startsWith('city_digest')
      || (draft.risk_flags || []).includes('city_digest');
    const profileUrl = draft.profile_url
      ? resolvePublicUrl(draft.profile_url, draft.truck_id, draft)
      : (draft.truck_id ? resolvePublicUrl('', draft.truck_id, draft) : '#');
    const trackingUrl = trackingUrlForDraft(draft);
    const truckLabel = [draft.truck_name, draft.city].filter(Boolean).join(' / ')
      || (isCityDigest ? `${draft.city || 'City'} weekly digest` : 'No truck attached');
    const scheduleLabel = draft.scheduled_for ? formatDate(draft.scheduled_for) : 'Not scheduled';
    const subject = draft.subject ? `<strong>${escapeHtml(draft.subject)}</strong>` : '';
    const profileLabel = isCityDigest ? 'Open SEO Draft' : 'Open Profile';
    const nextStep = draftNextStep(draft);

    return `
      <article class="draft-review-card">
        <div class="draft-review-card__header">
          <div>
            <div class="draft-review-card__badges">
              <span class="${escapeHtml(statusPillClass(draft.status))}">${escapeHtml(growthStatusLabel(draft.status))}</span>
              <span class="status-pill">${escapeHtml(contentFormatLabel(draft.content_format))}</span>
              <span class="status-pill">${escapeHtml(String(draft.platform || draft.channel || 'draft').toUpperCase())}</span>
            </div>
            <h4>${escapeHtml(truckLabel)}</h4>
            <span>${escapeHtml(scheduleLabel)} · ${escapeHtml(formatCount(draft.clicks || 0))} click${Number(draft.clicks || 0) === 1 ? '' : 's'}</span>
          </div>
          <div class="growth-agent-actions">
            <button class="row-action row-action--button" type="button" data-copy-caption="${escapeHtml(draft.id)}">Copy Caption</button>
            <a class="row-action row-action--ghost" href="${escapeHtml(profileUrl)}" target="_blank" rel="noreferrer">${escapeHtml(profileLabel)}</a>
            ${trackingUrl ? `<button class="row-action row-action--ghost" type="button" data-copy-tracking="${escapeHtml(trackingUrl)}">Copy App Link</button>` : ''}
          </div>
        </div>
        ${nextStep ? `<p class="draft-review-card__next">${escapeHtml(nextStep)}</p>` : ''}
        <div class="draft-review-card__copy" data-caption-source="${escapeHtml(draft.id)}">
          ${subject}
          <p>${escapeHtml(draft.text || '').replace(/\n/g, '<br>')}</p>
        </div>
        ${draftTagSourceMarkup(draft)}
        ${renderDraftMedia(draft)}
        ${draft.media_brief ? `<details class="draft-review-card__brief"><summary>Media and reviewer notes</summary><p>${escapeHtml(draft.media_brief).replace(/\n/g, '<br>')}</p></details>` : ''}
        ${draftPublisherErrorMarkup(draft)}
        ${draft.rejection_reason ? `<p class="draft-review-card__reason">Rejected: ${escapeHtml(draft.rejection_reason)}</p>` : ''}
        <div class="draft-review-card__footer">
          ${draftActionButtons(draft)}
        </div>
      </article>
    `;
  }).join('');
}

function socialPlatformLabel(value) {
  if (value === 'instagram') return 'Instagram';
  if (value === 'facebook') return 'Facebook';
  return growthStatusLabel(value || 'Social');
}

function socialReplyButtons(draft) {
  if (!draft?.id) return '';
  const status = String(draft.status || '');
  const buttons = [
    `<button class="row-action row-action--button" type="button" data-copy-social-reply="${escapeHtml(draft.id)}">Copy Reply</button>`,
  ];
  if (status === 'needs_approval') {
    buttons.push(`<button class="row-action row-action--button" type="button" data-social-reply-action="approve" data-social-reply-id="${escapeHtml(draft.id)}">Approve</button>`);
    buttons.push(`<button class="row-action row-action--ghost" type="button" data-social-reply-action="reject" data-social-reply-id="${escapeHtml(draft.id)}">Reject</button>`);
  }
  if (status === 'approved') {
    buttons.push(`<button class="row-action row-action--button" type="button" data-social-reply-action="mark-sent" data-social-reply-id="${escapeHtml(draft.id)}">Mark Sent</button>`);
  }
  return `<div class="growth-agent-actions">${buttons.join('')}</div>`;
}

function renderSocialInbox() {
  const inbox = state.socialInbox || {};
  const counts = inbox.counts || {};
  const setup = inbox.setup || {};
  const items = inbox.items || [];

  if (selectors.socialInboxCounts) {
    const rows = [
      ['Needs Review', counts.social_threads_needs_review || 0],
      ['Reply Drafts', counts.social_reply_drafts || 0],
      ['Needs Approval', counts.social_replies_needs_approval || 0],
      ['Approved', counts.social_replies_approved || 0],
      ['Messages', counts.social_messages || 0],
      ['Accounts', counts.social_accounts || 0],
    ];
    selectors.socialInboxCounts.innerHTML = rows.map(([label, value]) => `
      <div class="growth-agent-card">
        <strong>${escapeHtml(formatCount(value))}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    `).join('');
  }

  if (selectors.socialInboxLoadedAt) {
    selectors.socialInboxLoadedAt.textContent = state.loadedAt
      ? `Loaded ${formatDate(state.loadedAt)}`
      : '';
  }

  if (selectors.socialInboxSetup) {
    const setupRows = [
      {
        label: 'Meta Account',
        ok: setup.meta_page_id_configured && setup.meta_ig_account_id_configured,
        detail: setup.meta_page_id_configured && setup.meta_ig_account_id_configured
          ? 'Facebook and Instagram IDs are configured.'
          : 'Facebook Page or Instagram account ID is missing.',
      },
      {
        label: 'Access Token',
        ok: setup.meta_access_token_configured,
        detail: setup.meta_access_token_configured
          ? 'Meta token is attached to the backend.'
          : 'Meta token is not attached yet, so sync cannot pull comments.',
      },
      {
        label: 'Daily Bot',
        ok: setup.daily_sync_enabled,
        detail: setup.daily_sync_enabled
          ? 'Daily automation will try to sync inbox work.'
          : 'Daily inbox sync is turned off.',
      },
      {
        label: 'Reply Mode',
        ok: !setup.real_replies_enabled,
        detail: setup.real_replies_enabled
          ? 'Approved replies can be sent through the API.'
          : 'Replies are draft/copy/mark-sent only.',
      },
    ];
    selectors.socialInboxSetup.innerHTML = setupRows.map((row) => `
      <article class="${escapeHtml(row.ok ? 'setup-card setup-card--ok' : 'setup-card setup-card--warn')}">
        <strong>${escapeHtml(row.label)}</strong>
        <span>${escapeHtml(row.detail)}</span>
      </article>
    `).join('');
  }

  if (!selectors.socialInboxList) return;

  if (!items.length) {
    selectors.socialInboxList.innerHTML = `
      <div class="growth-agent-empty growth-agent-empty--card">No social inbox threads match this filter.</div>
    `;
    return;
  }

  selectors.socialInboxList.innerHTML = items.map((item) => {
    const thread = item.thread || {};
    const latest = item.latest_message || {};
    const drafts = item.reply_drafts || [];
    const draft = drafts[0] || null;
    const platform = socialPlatformLabel(thread.platform);
    const author = latest.author_handle || latest.author_name || thread.participant_handle || thread.participant_name || 'Unknown';
    const messageText = latest.text || 'No message text captured.';
    const replyText = draft?.reply_text || '';
    const permalink = latest.permalink_url || thread.permalink_url || '';
    const threadStatus = growthStatusLabel(thread.status || 'open');
    const draftStatus = draft ? growthStatusLabel(draft.status || 'needs approval') : 'No draft';
    const threadActionButtons = `
      <div class="growth-agent-actions">
        ${thread.status !== 'handled' ? `<button class="row-action row-action--ghost" type="button" data-social-thread-status="handled" data-social-thread-id="${escapeHtml(thread.id)}">Handled</button>` : ''}
        ${thread.status !== 'ignored' ? `<button class="row-action row-action--ghost" type="button" data-social-thread-status="ignored" data-social-thread-id="${escapeHtml(thread.id)}">Ignore</button>` : ''}
        ${permalink ? `<a class="row-action row-action--ghost" href="${escapeHtml(permalink)}" target="_blank" rel="noreferrer">Open Thread</a>` : ''}
      </div>
    `;

    return `
      <article class="social-inbox-card">
        <div class="social-inbox-card__header">
          <div>
            <div class="draft-review-card__badges">
              <span class="${escapeHtml(statusPillClass(thread.status))}">${escapeHtml(threadStatus)}</span>
              <span class="status-pill">${escapeHtml(platform)}</span>
              <span class="status-pill">${escapeHtml(growthStatusLabel(thread.thread_type || 'comment'))}</span>
              <span class="${escapeHtml(statusPillClass(draft?.status))}">${escapeHtml(draftStatus)}</span>
            </div>
            <h4>${escapeHtml(thread.subject || `${platform} thread`)}</h4>
            <span>${escapeHtml(author)} · ${escapeHtml(formatDate(latest.external_created_at || thread.latest_message_at || thread.updated_at))}</span>
          </div>
          ${threadActionButtons}
        </div>
        <div class="social-inbox-message">
          <strong>Incoming</strong>
          <p>${escapeHtml(messageText).replace(/\n/g, '<br>')}</p>
        </div>
        ${draft ? `
          <div class="social-inbox-reply" data-social-reply-source="${escapeHtml(draft.id)}">
            <strong>Suggested reply</strong>
            <p>${escapeHtml(replyText).replace(/\n/g, '<br>')}</p>
            <small>${escapeHtml((draft.risk_flags || []).join(' · '))}</small>
            ${socialReplyButtons(draft)}
          </div>
        ` : `
          <div class="social-inbox-reply social-inbox-reply--empty">
            <strong>No reply draft</strong>
            <p>This thread may be outbound-only or missing message text.</p>
          </div>
        `}
      </article>
    `;
  }).join('');
}

function renderClaimFunnel() {
  const report = state.claimFunnelReport || {};
  const totals = report.totals || {};
  const buckets = report.buckets || {};
  const recommendations = report.recommendations || [];

  if (selectors.claimFunnelSummary) {
    const rows = [
      ['New Claims', totals.new_claims || 0],
      ['Pending Proof', totals.pending_proof || 0],
      ['Verified', totals.verified || 0],
      ['Rejected', totals.rejected || 0],
      ['Needs Info', totals.needs_more_info || 0],
      ['All Leads', totals.all_leads || 0],
    ];
    selectors.claimFunnelSummary.innerHTML = rows.map(([label, value]) => `
      <div class="growth-agent-card">
        <strong>${escapeHtml(formatCount(value))}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    `).join('');
  }

  if (selectors.claimFunnelRecommendations) {
    selectors.claimFunnelRecommendations.innerHTML = recommendations.map((item) => `
      <article class="growth-agent-recommendation">
        <strong>${escapeHtml(item.title || 'Recommendation')}</strong>
        <span>${escapeHtml(item.detail || item.action || '')}</span>
      </article>
    `).join('');
  }

  if (!selectors.claimFunnelLeads) return;
  const bucketLabels = [
    ['new_claims', 'New Claims'],
    ['pending_proof', 'Pending Proof'],
    ['verified', 'Verified'],
    ['rejected', 'Rejected'],
    ['needs_more_info', 'Needs Info'],
  ];
  selectors.claimFunnelLeads.innerHTML = bucketLabels.map(([bucket, label]) => {
    const leads = buckets[bucket] || [];
    const leadRows = leads.length
      ? leads.slice(0, 8).map((lead) => {
        const profileUrl = resolvePublicUrl(lead.profile_url, lead.truck_id, lead);
        const contact = [
          lead.owner_email,
          lead.owner_phone,
          lead.owner_social_handle,
        ].filter(Boolean).join(' / ') || 'No contact yet';
        return `
          <article class="claim-funnel-card">
            <strong>${escapeHtml(lead.truck_name || 'Unnamed truck')}</strong>
            <span>${escapeHtml(lead.city || lead.truck_id || '')}</span>
            <span>${escapeHtml(contact)}</span>
            <span>${escapeHtml(lead.latest_event_type ? growthStatusLabel(lead.latest_event_type) : growthStatusLabel(lead.outreach_status))}</span>
            <a class="row-action row-action--ghost" href="${escapeHtml(profileUrl)}" target="_blank" rel="noreferrer">Open Profile</a>
          </article>
        `;
      }).join('')
      : '<p class="growth-agent-empty">No leads in this bucket.</p>';

    return `
      <section class="claim-funnel-column">
        <h4>${escapeHtml(label)}</h4>
        ${leadRows}
      </section>
    `;
  }).join('');
}

function renderWeeklyReport() {
  const report = state.weeklyReport || {};
  const summary = report.summary || {};
  const recommendations = report.recommendations || [];
  const topPosts = summary.top_posts || [];
  const topCities = summary.top_cities || [];
  const topTrucks = summary.top_trucks || [];

  if (selectors.weeklyReportSummary) {
    const rows = [
      ['Tracking Clicks', summary.tracking_clicks || 0],
      ['Claim Visits', summary.claim_page_visits || 0],
      ['Claim Submits', summary.claim_submissions || summary.owner_claim_submissions || 0],
      ['App Clicks', summary.app_download_clicks || 0],
      ['Drafts', summary.campaign_drafts || 0],
      ['SEO Pages', summary.public_seo_pages || 0],
    ];
    selectors.weeklyReportSummary.innerHTML = rows.map(([label, value]) => `
      <div class="growth-agent-card">
        <strong>${escapeHtml(formatCount(value))}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    `).join('');
  }

  if (selectors.weeklyReportRecommendations) {
    selectors.weeklyReportRecommendations.innerHTML = recommendations.map((item) => `
      <article class="growth-agent-recommendation">
        <strong>${escapeHtml(item.priority ? growthStatusLabel(item.priority) : 'Recommendation')}</strong>
        <span>${escapeHtml(item.action || item.detail || '')}</span>
      </article>
    `).join('');
  }

  if (!selectors.weeklyReportLists) return;
  const postRows = topPosts.length
    ? topPosts.map((post) => `
      <li>
        <strong>${escapeHtml(post.audience || post.channel || 'Draft')}</strong>
        <span>${escapeHtml(formatCount(post.clicks || 0))} clicks · ${escapeHtml(growthStatusLabel(post.status))}</span>
      </li>
    `).join('')
    : '<li><span>No tracked post clicks yet.</span></li>';
  const cityRows = topCities.length
    ? topCities.map((city) => `
      <li>
        <strong>${escapeHtml(city.city || 'Unknown')}</strong>
        <span>${escapeHtml(formatCount(city.known_trucks || 0))} known trucks</span>
      </li>
    `).join('')
    : '<li><span>No city data yet.</span></li>';
  const truckRows = topTrucks.length
    ? topTrucks.map((truck) => `
      <li>
        <strong>${escapeHtml(truck.truck_name || 'Unnamed truck')}</strong>
        <span>${escapeHtml(truck.city || truck.truck_id || '')} · ${escapeHtml(formatCount(truck.claim_events || 0))} claim events</span>
      </li>
    `).join('')
    : '<li><span>No truck activity yet.</span></li>';

  selectors.weeklyReportLists.innerHTML = `
    <section>
      <h4>Top Posts</h4>
      <ul>${postRows}</ul>
    </section>
    <section>
      <h4>Top Cities</h4>
      <ul>${cityRows}</ul>
    </section>
    <section>
      <h4>Top Trucks</h4>
      <ul>${truckRows}</ul>
    </section>
  `;
}

function renderAttributionPerformance() {
  const performance = state.attributionPerformance || {};
  const summary = performance.summary || {};
  const eventCounts = summary.event_counts || {};
  const topSources = performance.top_sources || [];
  const topCampaigns = performance.top_campaigns || [];
  const rows = performance.top_rows || [];

  if (selectors.attributionSummary) {
    const summaryRows = [
      ['Tracked Clicks', summary.tracking_clicks || 0],
      ['Downstream Actions', summary.engaged_actions || 0],
      ['App Installs', eventCounts.app_install || 0],
      ['App Opens', eventCounts.app_open || 0],
      ['Saved Trucks', eventCounts.favorite_truck_added || 0],
      ['Claims', eventCounts.claim_submitted || 0],
    ];
    selectors.attributionSummary.innerHTML = summaryRows.map(([label, value]) => `
      <div class="growth-agent-card">
        <strong>${escapeHtml(formatCount(value))}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    `).join('');
  }

  if (selectors.attributionInsights) {
    const source = topSources.find((item) => item.source !== 'unknown' && Number(item.score || 0) > 0);
    const campaign = topCampaigns.find((item) => item.campaign !== 'unknown' && Number(item.score || 0) > 0);
    const insights = [];
    if (source) {
      insights.push({
        title: 'Strongest Source',
        detail: `${source.source} has ${formatCount(source.clicks || 0)} tracked clicks and score ${formatCount(source.score || 0)}.`,
      });
    }
    if (campaign) {
      insights.push({
        title: 'Strongest Campaign',
        detail: `${campaign.campaign} is the top tracked campaign by downstream attribution score.`,
      });
    }
    if ((summary.tracking_clicks || 0) > 0 && !(summary.engaged_actions || 0)) {
      insights.push({
        title: 'Needs App Events',
        detail: 'Clicks are being tracked, but app-side events are not connected yet.',
      });
    }
    if (state.lastAttributionRun) {
      insights.push({
        title: 'Last Learning Run',
        detail: `${formatCount(state.lastAttributionRun.memories || 0)} memories updated and ${formatCount(state.lastAttributionRun.tasks || 0)} tasks created.`,
      });
    }
    selectors.attributionInsights.innerHTML = insights.length
      ? insights.map((item) => `
        <article class="growth-agent-recommendation">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.detail)}</span>
        </article>
      `).join('')
      : `
        <article class="growth-agent-recommendation">
          <strong>No attribution signals yet</strong>
          <span>Use tracking links in posts and send app-side events to start learning.</span>
        </article>
      `;
  }

  if (selectors.attributionRows) {
    selectors.attributionRows.innerHTML = rows.length
      ? rows.map((row) => `
        <tr>
          <td>${escapeHtml(row.source || row.platform || 'unknown')}</td>
          <td>${escapeHtml(row.campaign || row.channel || 'unknown')}</td>
          <td><code>${escapeHtml(row.slug || '')}</code></td>
          <td>${escapeHtml(formatCount(row.clicks || 0))}</td>
          <td>${escapeHtml(formatCount(row.engaged_actions || 0))}</td>
          <td>${escapeHtml(formatCount(row.score || 0))}</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td colspan="6" class="growth-agent-empty">No attribution rows yet. Use campaign tracking links and app events to populate this table.</td>
        </tr>
      `;
  }
}

function renderCityDigestSummary() {
  if (!selectors.cityDigestSummary) return;

  const batch = state.lastCityDigestBatch;
  const rows = [
    ['City Packs', batch?.packs || 0],
    ['Drafts', batch?.drafts || 0],
    ['SEO Drafts', batch?.seoPages || 0],
    ['Skipped', batch?.skipped || 0],
  ];
  selectors.cityDigestSummary.innerHTML = rows.map(([label, value]) => `
    <div class="growth-agent-card">
      <strong>${escapeHtml(formatCount(value))}</strong>
      <span>${escapeHtml(label)}</span>
    </div>
  `).join('');
}

function renderSocialDrafts() {
  if (!selectors.socialDrafts) return;

  if (!state.socialDrafts.length) {
    selectors.socialDrafts.innerHTML = `
      <tr>
        <td colspan="5" class="growth-agent-empty">No social drafts are waiting for approval.</td>
      </tr>
    `;
    return;
  }

  selectors.socialDrafts.innerHTML = state.socialDrafts.map((draft) => {
    const platform = draftPlatform(draft);
    const trackingUrl = trackingUrlForDraft(draft);

    return `
      <tr>
        <td><span class="status-pill">${escapeHtml(platform.toUpperCase())}</span></td>
        <td>
          <strong>${escapeHtml(draft.audience || 'Social draft')}</strong>
          <span class="growth-agent-draft-copy">${escapeHtml(draft.text || '')}</span>
        </td>
        <td><span class="status-pill">${escapeHtml(growthStatusLabel(draft.status))}</span></td>
        <td>${trackingUrl ? `<button class="row-action row-action--ghost" type="button" data-copy-tracking="${escapeHtml(trackingUrl)}">Copy App Link</button>` : 'No tracking link'}</td>
        <td>${draftActionButtons(draft)}</td>
      </tr>
    `;
  }).join('');
}

function renderAutopilot() {
  const report = state.autopilotReport || {};
  const totals = report.totals || {};
  const recommendations = report.recommendations || [];
  const calendar = report.scheduled || [];

  if (selectors.autopilotSummary) {
    const rows = [
      ['Drafts', totals.drafts || 0],
      ['Needs Approval', totals.pending_approval || 0],
      ['Scheduled', totals.scheduled || 0],
      ['Published', totals.published || 0],
      ['Clicks', totals.clicks || 0],
      ['Avg Score', totals.average_score || 0],
    ];
    selectors.autopilotSummary.innerHTML = rows.map(([label, value]) => `
      <div class="growth-agent-card">
        <strong>${escapeHtml(formatCount(value))}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    `).join('');
  }

  if (selectors.autopilotRecommendations) {
    if (!recommendations.length) {
      selectors.autopilotRecommendations.innerHTML = '';
    } else {
      selectors.autopilotRecommendations.innerHTML = recommendations.map((item) => `
        <article class="growth-agent-recommendation">
          <strong>${escapeHtml(item.title || 'Recommendation')}</strong>
          <span>${escapeHtml(item.detail || '')}</span>
        </article>
      `).join('');
    }
  }

  if (selectors.autopilotCalendar) {
    if (!calendar.length) {
      selectors.autopilotCalendar.innerHTML = `
        <tr>
          <td colspan="8" class="growth-agent-empty">No Growth Autopilot calendar items yet.</td>
        </tr>
      `;
    } else {
      selectors.autopilotCalendar.innerHTML = calendar.map((slot) => `
        <tr>
          <td>
            <strong>${escapeHtml(formatDate(slot.scheduled_for))}</strong>
            <span>${escapeHtml(slot.date || '')}</span>
          </td>
          <td><span class="status-pill">${escapeHtml(String(slot.platform || 'social').toUpperCase())}</span></td>
          <td>${escapeHtml(String(slot.template || '').replace(/_/g, ' '))}</td>
          <td>${escapeHtml(slot.truck_name || 'Unknown truck')}</td>
          <td>${escapeHtml(slot.score ?? 0)}</td>
          <td><span class="status-pill">${escapeHtml(growthStatusLabel(slot.status))}</span></td>
          <td>${slot.tracking_url ? `<button class="row-action row-action--ghost" type="button" data-copy-tracking="${escapeHtml(slot.tracking_url)}">Copy App Link</button>` : 'No tracking link'}</td>
          <td>${draftActionButtons(slot)}</td>
        </tr>
      `).join('');
    }
  }
}

function renderAll() {
  renderMetrics();
  renderAgentPanel();
  renderDraftReviewQueue();
  renderSocialInbox();
  renderClaimFunnel();
  renderWeeklyReport();
  renderAttributionPerformance();
  renderCityDigestSummary();
  renderSocialStrategy();
  renderAutopilot();
  renderLeads();
  renderSocialDrafts();
  renderLoadedAt();
}

function renderLoadedAt() {
  if (selectors.loadedAt) {
    selectors.loadedAt.textContent = state.loadedAt
      ? `Loaded ${formatDate(state.loadedAt)}`
      : '';
  }
}

function setActiveTabBusy(isBusy) {
  selectors.tabButtons.forEach((button) => {
    if (button.dataset.growthAgentTab === state.activeTab) {
      if (isBusy) {
        button.setAttribute('aria-busy', 'true');
      } else {
        button.removeAttribute('aria-busy');
      }
    }
  });
}

function invalidateGrowthCache(...tabs) {
  if (!tabs.length) {
    state.loadedTabs = {};
    return;
  }

  tabs.forEach((tab) => {
    delete state.loadedTabs[tab];
  });
}

async function loadMetricCounts(force = false) {
  if (!force && state.loadedTabs.metrics) return;

  const countResults = await Promise.all(
    GROWTH_AGENT_STATUSES.map(async (status) => {
      const payload = await callGrowthAgent(`/admin/owner-outreach-leads?status=${encodeURIComponent(status)}&limit=500`);
      return [status, payload.leads?.length || 0];
    })
  );
  state.counts = Object.fromEntries(countResults);
  state.loadedTabs.metrics = true;
  renderMetrics();
}

async function loadReviewTab(force = false) {
  if (!force && state.loadedTabs.review) return;

  const draftStatus = state.selectedDraftStatus || 'needs_approval';
  const draftPlatform = state.selectedDraftPlatform || 'all';
  const params = new URLSearchParams({
    status: draftStatus,
    platform: draftPlatform,
    limit: '50',
  });
  const reviewQueuePayload = await callGrowthAgent(`/admin/campaign-draft-review-queue?${params.toString()}`);
  state.draftReviewQueue = reviewQueuePayload.queue || null;
  state.loadedTabs.review = true;
  renderDraftReviewQueue();
}

async function loadClaimsTab(force = false) {
  if (!force && state.loadedTabs.claims) return;

  const status = state.selectedStatus === 'all' ? '' : `&status=${encodeURIComponent(state.selectedStatus)}`;
  const [leadsPayload, claimFunnelPayload] = await Promise.all([
    callGrowthAgent(`/admin/owner-outreach-leads?limit=100${status}`),
    callGrowthAgent('/admin/claim-funnel-report?limit=25'),
  ]);
  state.leads = leadsPayload.leads || [];
  state.claimFunnelReport = claimFunnelPayload.report || null;
  state.loadedTabs.claims = true;
  renderClaimFunnel();
  renderLeads();
}

async function loadSocialTab(force = false) {
  if (!force && state.loadedTabs.social) return;

  const inboxStatus = state.selectedSocialInboxStatus === 'all' ? '' : `&status=${encodeURIComponent(state.selectedSocialInboxStatus)}`;
  const inboxPlatform = state.selectedSocialInboxPlatform === 'all' ? '' : `&platform=${encodeURIComponent(state.selectedSocialInboxPlatform)}`;
  const [socialInboxPayload, draftPayload] = await Promise.all([
    callGrowthAgent(`/admin/social-inbox?limit=50${inboxStatus}${inboxPlatform}`),
    callGrowthAgent('/admin/campaign-drafts?status=needs_approval&limit=100'),
  ]);
  state.socialInbox = socialInboxPayload.inbox || null;
  state.socialDrafts = (draftPayload.drafts || [])
    .filter((draft) => draft.channel === 'social_draft')
    .slice(0, 25);
  state.loadedTabs.social = true;
  renderSocialInbox();
  renderSocialDrafts();
}

async function loadStrategyTab(force = false) {
  if (!force && state.loadedTabs.strategy) return;

  const memoriesPayload = await callGrowthAgent('/admin/agent-memories?limit=100');
  const memories = (memoriesPayload.memories || []).filter((memory) => String(memory.key || '').startsWith('strategy:'));
  state.socialStrategyPlan = {
    memories,
    sections: strategySectionsFromMemories(memories),
  };
  state.loadedTabs.strategy = true;
  renderSocialStrategy();
}

async function loadAutomationTab(force = false) {
  if (!force && state.loadedTabs.automation) return;

  const [
    agentBriefingsPayload,
    agentTasksPayload,
    agentMemoriesPayload,
    autopilotPayload,
  ] = await Promise.all([
    callGrowthAgent('/admin/agent-briefings?limit=1'),
    callGrowthAgent('/admin/agent-tasks?status=open&limit=20'),
    callGrowthAgent('/admin/agent-memories?limit=20'),
    callGrowthAgent('/admin/growth-autopilot-report?days=14'),
  ]);
  state.agentBriefing = agentBriefingsPayload.briefings?.[0] || null;
  state.agentTasks = agentTasksPayload.tasks || [];
  state.agentMemories = agentMemoriesPayload.memories || [];
  state.autopilotReport = autopilotPayload.report || null;
  state.loadedTabs.automation = true;
  renderAgentPanel();
  renderAutopilot();
  renderCityDigestSummary();
}

async function loadReportsTab(force = false) {
  if (!force && state.loadedTabs.reports) return;

  const weeklyReportsPayload = await callGrowthAgent('/admin/weekly-growth-reports?limit=1');
  state.weeklyReport = weeklyReportsPayload.reports?.[0] || null;
  state.loadedTabs.reports = true;
  renderWeeklyReport();
}

async function loadAttributionTab(force = false) {
  if (!force && state.loadedTabs.attribution) return;

  const [performancePayload, eventsPayload] = await Promise.all([
    callGrowthAgent('/admin/attribution-performance?limit=25'),
    callGrowthAgent('/admin/attribution-events?limit=25'),
  ]);
  state.attributionPerformance = performancePayload.performance || null;
  state.attributionEvents = eventsPayload.events || [];
  state.loadedTabs.attribution = true;
  renderAttributionPerformance();
}

async function loadGrowthTab(tab, force = false) {
  if (tab === 'review') {
    await loadReviewTab(force);
    return;
  }
  if (tab === 'claims') {
    await loadClaimsTab(force);
    return;
  }
  if (tab === 'social') {
    await loadSocialTab(force);
    return;
  }
  if (tab === 'strategy') {
    await loadStrategyTab(force);
    return;
  }
  if (tab === 'automation') {
    await loadAutomationTab(force);
    return;
  }
  if (tab === 'reports') {
    await loadReportsTab(force);
    return;
  }
  if (tab === 'attribution') {
    await loadAttributionTab(force);
    return;
  }
}

async function loadGrowthAgent({force = false, tab = state.activeTab, refreshMetrics = false} = {}) {
  const activeTab = validGrowthTab(tab);
  setActiveGrowthTab(activeTab, {load: false});
  setLoading(true);
  setActiveTabBusy(true);
  setMessage(selectors.message, `Loading ${GROWTH_AGENT_TAB_LABELS[activeTab]}...`);

  try {
    await Promise.all([
      loadMetricCounts(refreshMetrics || !state.loadedTabs.metrics),
      loadGrowthTab(activeTab, force),
    ]);
    state.loadedAt = new Date().toISOString();
    renderLoadedAt();
    setMessage(selectors.message, `${GROWTH_AGENT_TAB_LABELS[activeTab]} loaded.`);
  } catch (error) {
    setMessage(selectors.message, error.message || 'Unable to load Growth Agent data.', true);
  } finally {
    setActiveTabBusy(false);
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
    state.lastReconcile = payload.reconcile || null;
    state.lastDraftReconcile = payload.draft_reconcile || null;
    setMessage(selectors.message, 'Truck sync complete. Reloading Growth Agent data...');
    invalidateGrowthCache();
    await loadGrowthAgent({force: true, refreshMetrics: true});
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
    invalidateGrowthCache();
    await loadGrowthAgent({force: true, refreshMetrics: true});
  } catch (error) {
    setMessage(selectors.message, error.message || 'Queue generation failed.', true);
  } finally {
    setLoading(false);
  }
}

async function runDailyAutomation() {
  setLoading(true);
  setMessage(selectors.message, 'Running daily Growth Agent automation...');

  try {
    const payload = await callGrowthAgent('/admin/daily-growth-automation', {
      method: 'POST',
      body: {
        collection: 'foodTrucks',
        queue_limit: 25,
        social_limit: 10,
        autopilot_days: 7,
        autopilot_daily_posts: 2,
        city_digest_enabled: true,
        city_digest_city_count: Number(selectors.cityDigestCityCount?.value || 3),
        city_digest_truck_limit: Number(selectors.cityDigestTruckLimit?.value || 6),
        platforms: selectedAutopilotPlatforms(),
        city: String(selectors.autopilotCity?.value || '').trim() || undefined,
        include_owner_tags: selectors.autopilotOwnerTags?.checked !== false,
        actor: auth.currentUser?.email || 'growth-agent-console',
      },
    });
    const summary = payload.run?.summary || {};
    state.lastSync = payload.run?.sync || null;
    state.lastReconcile = payload.run?.reconcile || null;
    state.lastDraftReconcile = payload.run?.draft_reconcile || null;
    state.lastQueue = {items: summary.queue_items || 0, real_sending_enabled: false};
    state.lastSocialBatch = {drafts: summary.social_drafts || 0, real_sending_enabled: false};
    state.lastAutopilotPlan = {drafts: summary.autopilot_drafts || 0, real_publishing_enabled: false};
    state.lastCityDigestBatch = {
      packs: summary.city_digest_packs || 0,
      drafts: summary.city_digest_drafts || 0,
      seoPages: summary.city_digest_seo_pages || 0,
      skipped: 0,
    };
    state.lastAgentRun = {
      tasks: summary.agent_tasks || 0,
      memories: summary.agent_memories || 0,
      briefings: summary.agent_briefings || 0,
    };
    setMessage(
      selectors.message,
      `Daily automation complete: ${summary.owner_outreach_drafts || 0} outreach drafts, ${summary.social_drafts || 0} social drafts, ${summary.autopilot_drafts || 0} scheduled drafts, ${summary.city_digest_packs || 0} city digest packs, ${summary.agent_tasks || 0} agent tasks.`
    );
    invalidateGrowthCache();
    await loadGrowthAgent({force: true, refreshMetrics: true});
  } catch (error) {
    setMessage(selectors.message, error.message || 'Daily automation failed.', true);
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

function selectedStrategyPlatforms() {
  const platforms = selectors.socialStrategyPlatforms
    .filter((input) => input.checked)
    .map((input) => input.value);
  return platforms.length ? platforms : ['instagram', 'facebook', 'tiktok', 'x'];
}

function selectedAutopilotPlatforms() {
  const platforms = selectors.autopilotPlatforms
    .filter((input) => input.checked)
    .map((input) => input.value);
  return platforms.length ? platforms : ['instagram', 'facebook', 'tiktok', 'x'];
}

function csvInputValues(input) {
  return String(input?.value || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

async function generateSocialStrategy(createDrafts = false) {
  setLoading(true);
  setMessage(
    selectors.message,
    createDrafts ? 'Creating 30-day review drafts from social strategy...' : 'Generating social strategy plan...'
  );

  try {
    const payload = await callGrowthAgent('/admin/social-strategy-plan', {
      method: 'POST',
      body: {
        competitors: csvInputValues(selectors.socialStrategyCompetitors),
        growth_goals: csvInputValues(selectors.socialStrategyGoals),
        platforms: selectedStrategyPlatforms(),
        create_drafts: createDrafts,
        actor: auth.currentUser?.email || 'growth-agent-console',
      },
    });
    const plan = payload.plan || null;
    state.socialStrategyPlan = plan;
    setMessage(
      selectors.message,
      createDrafts
        ? `Social strategy created ${plan?.drafts?.length || 0} review draft${(plan?.drafts?.length || 0) === 1 ? '' : 's'}. Open Drafts to approve or post.`
        : 'Social strategy saved to agent memory.'
    );
    invalidateGrowthCache('strategy', 'automation', 'review');
    state.loadedTabs.strategy = true;
    renderSocialStrategy();
  } catch (error) {
    setMessage(selectors.message, error.message || 'Social strategy generation failed.', true);
  } finally {
    setLoading(false);
  }
}

async function generateGrowthAutopilotPlan() {
  setLoading(true);
  setMessage(selectors.message, 'Generating Growth Autopilot calendar...');

  try {
    const city = String(selectors.autopilotCity?.value || '').trim();
    const days = Number(selectors.autopilotDays?.value || 7);
    const dailyPosts = Number(selectors.autopilotDailyPosts?.value || 2);
    const payload = await callGrowthAgent('/admin/growth-autopilot-plan', {
      method: 'POST',
      body: {
        days: Number.isFinite(days) ? days : 7,
        daily_posts: Number.isFinite(dailyPosts) ? dailyPosts : 2,
        platforms: selectedAutopilotPlatforms(),
        city: city || undefined,
        include_owner_tags: selectors.autopilotOwnerTags?.checked !== false,
        actor: auth.currentUser?.email || 'growth-agent-console',
      },
    });
    const drafts = payload.plan?.drafts || [];
    state.lastAutopilotPlan = {
      drafts: drafts.length,
      real_publishing_enabled: payload.plan?.real_publishing_enabled === true,
    };
    setMessage(selectors.message, `Growth Autopilot created ${drafts.length} scheduled draft${drafts.length === 1 ? '' : 's'} for approval. Approved Facebook and Instagram drafts can be posted from the review queue.`);
    invalidateGrowthCache();
    await loadGrowthAgent({force: true, refreshMetrics: true});
  } catch (error) {
    setMessage(selectors.message, error.message || 'Growth Autopilot generation failed.', true);
  } finally {
    setLoading(false);
  }
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
    setMessage(selectors.message, `Created ${drafts.length} social draft${drafts.length === 1 ? '' : 's'} for approval. Approved Facebook and Instagram drafts can be posted from the review queue.`);
    invalidateGrowthCache();
    await loadGrowthAgent({force: true, refreshMetrics: true});
  } catch (error) {
    setMessage(selectors.message, error.message || 'Social draft generation failed.', true);
  } finally {
    setLoading(false);
  }
}

function currentWeekBounds() {
  const now = new Date();
  const day = now.getDay() || 7;
  const start = new Date(now);
  start.setDate(now.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const isoDate = (value) => value.toISOString().slice(0, 10);
  return {week_start: isoDate(start), week_end: isoDate(end)};
}

async function generateWeeklyReport() {
  setLoading(true);
  setMessage(selectors.message, 'Generating weekly growth report...');

  try {
    const payload = await callGrowthAgent('/admin/weekly-growth-reports', {
      method: 'POST',
      body: currentWeekBounds(),
    });
    state.weeklyReport = payload.report || null;
    setMessage(selectors.message, 'Weekly growth report generated.');
    invalidateGrowthCache();
    await loadGrowthAgent({force: true, refreshMetrics: true});
  } catch (error) {
    setMessage(selectors.message, error.message || 'Weekly report failed.', true);
  } finally {
    setLoading(false);
  }
}

async function runAttributionLearning() {
  setLoading(true);
  setMessage(selectors.message, 'Running attribution learning loop...');

  try {
    const payload = await callGrowthAgent('/admin/attribution-learning-run', {
      method: 'POST',
      body: {
        actor: auth.currentUser?.email || 'growth-agent-console',
      },
    });
    const run = payload.run || {};
    state.lastAttributionRun = {
      memories: run.memories?.length || 0,
      tasks: run.tasks?.length || 0,
    };
    setMessage(
      selectors.message,
      `Attribution learning complete: ${state.lastAttributionRun.memories} memor${state.lastAttributionRun.memories === 1 ? 'y' : 'ies'} updated and ${state.lastAttributionRun.tasks} task${state.lastAttributionRun.tasks === 1 ? '' : 's'} created.`
    );
    invalidateGrowthCache('attribution', 'automation', 'reports');
    await loadGrowthAgent({force: true, tab: 'attribution', refreshMetrics: true});
  } catch (error) {
    setMessage(selectors.message, error.message || 'Attribution learning failed.', true);
  } finally {
    setLoading(false);
  }
}

async function generateWeeklyCityDigests() {
  setLoading(true);
  setMessage(selectors.message, 'Generating weekly city digest content...');

  try {
    const cities = String(selectors.cityDigestCities?.value || '')
      .split(',')
      .map((city) => city.trim())
      .filter(Boolean);
    const cityCount = Number(selectors.cityDigestCityCount?.value || 3);
    const truckLimit = Number(selectors.cityDigestTruckLimit?.value || 6);
    const payload = await callGrowthAgent('/admin/weekly-city-digests', {
      method: 'POST',
      body: {
        ...currentWeekBounds(),
        cities: cities.length ? cities : undefined,
        city_count: Number.isFinite(cityCount) ? cityCount : 3,
        truck_limit: Number.isFinite(truckLimit) ? truckLimit : 6,
        platforms: selectedAutopilotPlatforms(),
        actor: auth.currentUser?.email || 'growth-agent-console',
      },
    });
    const packs = payload.batch?.packs || [];
    const skipped = payload.batch?.skipped_cities || [];
    state.lastCityDigestBatch = {
      packs: packs.length,
      drafts: packs.reduce((sum, pack) => sum + (pack.drafts?.length || 0), 0),
      seoPages: packs.length,
      skipped: skipped.length,
    };
    setMessage(
      selectors.message,
      `Created ${state.lastCityDigestBatch.packs} city digest pack${state.lastCityDigestBatch.packs === 1 ? '' : 's'} with ${state.lastCityDigestBatch.drafts} approval drafts.`
    );
    invalidateGrowthCache();
    await loadGrowthAgent({force: true, refreshMetrics: true});
  } catch (error) {
    setMessage(selectors.message, error.message || 'Weekly city digest generation failed.', true);
  } finally {
    setLoading(false);
  }
}

async function runAgentBrain() {
  setLoading(true);
  setMessage(selectors.message, 'Running autonomous Growth Agent briefing...');

  try {
    const payload = await callGrowthAgent('/admin/autonomous-agent-run', {
      method: 'POST',
      body: {
        actor: auth.currentUser?.email || 'growth-agent-console',
      },
    });
    const run = payload.run || {};
    state.lastAgentRun = {
      tasks: run.tasks?.length || 0,
      memories: run.memories?.length || 0,
      briefings: run.briefing ? 1 : 0,
    };
    setMessage(selectors.message, `Agent briefing complete: ${state.lastAgentRun.tasks} new task${state.lastAgentRun.tasks === 1 ? '' : 's'} and ${state.lastAgentRun.memories} updated memor${state.lastAgentRun.memories === 1 ? 'y' : 'ies'}.`);
    invalidateGrowthCache();
    await loadGrowthAgent({force: true, refreshMetrics: true});
  } catch (error) {
    setMessage(selectors.message, error.message || 'Autonomous agent run failed.', true);
  } finally {
    setLoading(false);
  }
}

async function generateMediaAssets() {
  setLoading(true);
  setMessage(selectors.message, 'Finding media for review drafts...');

  try {
    const payload = await callGrowthAgent('/admin/media-assets/generate', {
      method: 'POST',
      body: {
        collection: 'foodTrucks',
        status: state.selectedDraftStatus || 'needs_approval',
        limit: 50,
        include_external: true,
        actor: auth.currentUser?.email || 'growth-agent-console',
      },
    });
    const media = payload.media || {};
    state.lastMediaBatch = {
      draftsScanned: media.drafts_scanned || 0,
      generated: media.candidates?.length || 0,
      selected: media.selected?.length || 0,
      needsReview: media.needs_review?.length || 0,
      skipped: media.skipped?.length || 0,
    };
    setMessage(
      selectors.message,
      `Media scan complete: ${state.lastMediaBatch.selected} selected existing asset${state.lastMediaBatch.selected === 1 ? '' : 's'}, ${state.lastMediaBatch.needsReview} candidate${state.lastMediaBatch.needsReview === 1 ? '' : 's'} needing review.`
    );
    invalidateGrowthCache();
    await loadGrowthAgent({force: true, refreshMetrics: true});
  } catch (error) {
    setMessage(selectors.message, error.message || 'Media scan failed.', true);
  } finally {
    setLoading(false);
  }
}

async function runMediaAction(candidateId, action) {
  if (!candidateId || !action) return;
  const body = {
    actor: auth.currentUser?.email || 'growth-agent-console',
  };

  if (action === 'reject') {
    const reason = window.prompt('Why reject this media candidate?');
    if (!reason || !reason.trim()) return;
    body.review_note = reason.trim();
  }

  setLoading(true);
  setMessage(selectors.message, `${growthStatusLabel(action)} media candidate...`);

  try {
    await callGrowthAgent(`/admin/media-assets/${encodeURIComponent(candidateId)}/${action}`, {
      method: 'POST',
      body,
    });
    setMessage(selectors.message, `Media candidate ${growthStatusLabel(action).toLowerCase()} complete.`);
    invalidateGrowthCache();
    await loadGrowthAgent({force: true, refreshMetrics: true});
  } catch (error) {
    setMessage(selectors.message, error.message || 'Media action failed.', true);
  } finally {
    setLoading(false);
  }
}

async function saveAgentInstruction(event) {
  event.preventDefault();
  const value = String(selectors.agentInstruction?.value || '').trim();
  if (!value) {
    setMessage(selectors.message, 'Add an instruction before saving.', true);
    return;
  }

  setLoading(true);
  setMessage(selectors.message, 'Saving agent instruction...');

  try {
    await callGrowthAgent('/admin/agent-memories', {
      method: 'POST',
      body: {
        memory_type: 'instruction',
        key: `instruction:${Date.now()}`,
        value,
        actor: auth.currentUser?.email || 'growth-agent-console',
        metadata: {
          source_surface: 'growth-agent-console',
        },
      },
    });
    if (selectors.agentInstruction) selectors.agentInstruction.value = '';
    setMessage(selectors.message, 'Instruction saved to agent memory.');
    invalidateGrowthCache();
    await loadGrowthAgent({force: true, refreshMetrics: true});
  } catch (error) {
    setMessage(selectors.message, error.message || 'Unable to save instruction.', true);
  } finally {
    setLoading(false);
  }
}

async function updateAgentTaskStatus(taskId, status) {
  if (!taskId || !status) return;
  setLoading(true);
  setMessage(selectors.message, `${growthStatusLabel(status)} agent task...`);

  try {
    await callGrowthAgent(`/admin/agent-tasks/${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      body: {
        status,
        actor: auth.currentUser?.email || 'growth-agent-console',
      },
    });
    setMessage(selectors.message, `Agent task marked ${growthStatusLabel(status).toLowerCase()}.`);
    invalidateGrowthCache();
    await loadGrowthAgent({force: true, refreshMetrics: true});
  } catch (error) {
    setMessage(selectors.message, error.message || 'Unable to update agent task.', true);
  } finally {
    setLoading(false);
  }
}

async function syncSocialInbox() {
  setLoading(true);
  setMessage(selectors.message, 'Syncing Meta social inbox...');

  try {
    const payload = await callGrowthAgent('/admin/social-inbox/sync-meta', {
      method: 'POST',
      body: {
        limit: 25,
        actor: auth.currentUser?.email || 'growth-agent-console',
      },
    });
    const sync = payload.sync || {};
    const skipped = sync.skipped || [];
    const suffix = skipped.length
      ? ` ${skipped.length} source${skipped.length === 1 ? '' : 's'} returned setup or permission notes.`
      : '';
    setMessage(
      selectors.message,
      `Social inbox synced: ${sync.messages?.length || 0} message${(sync.messages?.length || 0) === 1 ? '' : 's'} and ${sync.reply_drafts?.length || 0} reply draft${(sync.reply_drafts?.length || 0) === 1 ? '' : 's'}.${suffix}`
    );
    invalidateGrowthCache();
    await loadGrowthAgent({force: true, refreshMetrics: true});
  } catch (error) {
    setMessage(selectors.message, error.message || 'Social inbox sync failed.', true);
  } finally {
    setLoading(false);
  }
}

async function runSocialReplyAction(draftId, action) {
  if (!draftId || !action) return;
  const body = {
    actor: auth.currentUser?.email || 'growth-agent-console',
  };

  if (action === 'reject') {
    const reason = window.prompt('Why reject this reply?');
    if (!reason || !reason.trim()) return;
    body.note = reason.trim();
  }

  if (action === 'mark-sent') {
    const note = window.prompt('Where was this reply posted?');
    if (note && note.trim()) body.note = note.trim();
  }

  setLoading(true);
  setMessage(selectors.message, `${growthStatusLabel(action)} social reply...`);

  try {
    await callGrowthAgent(`/admin/social-reply-drafts/${encodeURIComponent(draftId)}/${action}`, {
      method: 'POST',
      body,
    });
    setMessage(selectors.message, `Social reply ${growthStatusLabel(action).toLowerCase()} complete.`);
    invalidateGrowthCache();
    await loadGrowthAgent({force: true, refreshMetrics: true});
  } catch (error) {
    setMessage(selectors.message, error.message || 'Social reply action failed.', true);
  } finally {
    setLoading(false);
  }
}

async function updateSocialThreadStatus(threadId, status) {
  if (!threadId || !status) return;
  setLoading(true);
  setMessage(selectors.message, `Marking social thread ${growthStatusLabel(status).toLowerCase()}...`);

  try {
    await callGrowthAgent(`/admin/social-threads/${encodeURIComponent(threadId)}`, {
      method: 'PATCH',
      body: {
        status,
        actor: auth.currentUser?.email || 'growth-agent-console',
      },
    });
    setMessage(selectors.message, `Social thread marked ${growthStatusLabel(status).toLowerCase()}.`);
    invalidateGrowthCache();
    await loadGrowthAgent({force: true, refreshMetrics: true});
  } catch (error) {
    setMessage(selectors.message, error.message || 'Unable to update social thread.', true);
  } finally {
    setLoading(false);
  }
}

async function runDraftAction(draftId, action) {
  if (!draftId || !action) return;
  if (action === 'media-required') {
    setMessage(selectors.message, 'Select or approve an image before posting this Instagram draft.', true);
    return;
  }

  const body = {
    actor: auth.currentUser?.email || 'growth-agent-console',
  };

  if (action === 'publish') {
    const confirmed = window.confirm('Post this approved draft now from the connected Food Truck Finder social account?');
    if (!confirmed) return;
  }

  if (action === 'reject') {
    const reason = window.prompt('Why reject this draft?');
    if (!reason || !reason.trim()) return;
    body.rejection_reason = reason.trim();
  }

  setLoading(true);
  setMessage(selectors.message, `${growthStatusLabel(action)} draft...`);

  try {
    const payload = await callGrowthAgent(`/admin/campaign-drafts/${encodeURIComponent(draftId)}/${action}`, {
      method: 'POST',
      body,
    });
    const publishResult = payload.publish_result || null;
    if (publishResult && publishResult.ok === false) {
      throw new Error(publishResult.message || 'Publishing failed.');
    }
    const publishMessage = publishResult?.message
      ? `${publishResult.provider || 'Publisher'}: ${publishResult.message}`
      : `Draft ${growthStatusLabel(action).toLowerCase()} complete.`;
    let finalMessage = publishMessage;
    if (action === 'approve') {
      state.selectedDraftStatus = 'approved';
      if (selectors.draftReviewStatus) {
        selectors.draftReviewStatus.value = 'approved';
      }
      finalMessage = 'Draft approved. Showing Approved / Ready drafts so you can post it now.';
    }
    invalidateGrowthCache();
    await loadGrowthAgent({force: true, refreshMetrics: true});
    setMessage(selectors.message, finalMessage);
  } catch (error) {
    setMessage(selectors.message, error.message || 'Draft action failed.', true);
  } finally {
    setLoading(false);
  }
}

async function copyTrackingLink(url) {
  if (!url) return;

  try {
    await navigator.clipboard.writeText(url);
    setMessage(selectors.message, 'App tracking link copied.');
  } catch {
    window.prompt('App tracking link:', url);
  }
}

async function copyDraftCaption(draftId) {
  const source = document.querySelector(`[data-caption-source="${CSS.escape(draftId)}"]`);
  const text = source?.querySelector('p')?.innerText || source?.innerText || '';
  if (!text.trim()) return;

  try {
    await navigator.clipboard.writeText(text.trim());
    setMessage(selectors.message, 'Caption copied.');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text.trim();
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    setMessage(selectors.message, 'Caption copied.');
  }
}

async function copySocialReply(draftId) {
  const source = document.querySelector(`[data-social-reply-source="${CSS.escape(draftId)}"]`);
  const text = source?.querySelector('p')?.innerText || '';
  if (!text.trim()) return;

  try {
    await navigator.clipboard.writeText(text.trim());
    setMessage(selectors.message, 'Reply copied.');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text.trim();
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    setMessage(selectors.message, 'Reply copied.');
  }
}

function socialInboxFilterChanged() {
  state.selectedSocialInboxStatus = selectors.socialInboxStatus?.value || 'needs_review';
  state.selectedSocialInboxPlatform = selectors.socialInboxPlatform?.value || 'all';
  invalidateGrowthCache('social');
  void loadGrowthAgent({force: true, tab: 'social'});
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
  invalidateGrowthCache();
  void loadGrowthAgent({force: true, refreshMetrics: true});
});

selectors.sync?.addEventListener('click', () => {
  void syncGrowthAgentTrucks();
});

selectors.queue?.addEventListener('click', () => {
  void generateGrowthAgentQueue();
});

selectors.dailyAutomationRun?.addEventListener('click', () => {
  void runDailyAutomation();
});

selectors.agentRun?.addEventListener('click', () => {
  void runAgentBrain();
});

selectors.agentInstructionForm?.addEventListener('submit', (event) => {
  void saveAgentInstruction(event);
});

selectors.tabs?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-growth-agent-tab]');
  if (!button) return;
  setActiveGrowthTab(button.dataset.growthAgentTab || 'review');
});

selectors.draftReviewRefresh?.addEventListener('click', () => {
  void loadGrowthAgent({force: true, tab: 'review'});
});

selectors.mediaGenerate?.addEventListener('click', () => {
  void generateMediaAssets();
});

selectors.socialInboxSync?.addEventListener('click', () => {
  void syncSocialInbox();
});

selectors.socialInboxRefresh?.addEventListener('click', () => {
  void loadGrowthAgent({force: true, tab: 'social'});
});

selectors.autopilotGenerate?.addEventListener('click', () => {
  void generateGrowthAutopilotPlan();
});

selectors.autopilotRefresh?.addEventListener('click', () => {
  void loadGrowthAgent({force: true, tab: 'automation'});
});

selectors.socialGenerate?.addEventListener('click', () => {
  void generateSocialDrafts();
});

selectors.socialRefresh?.addEventListener('click', () => {
  void loadGrowthAgent({force: true, tab: 'social'});
});

selectors.socialStrategyGenerate?.addEventListener('click', () => {
  void generateSocialStrategy(false);
});

selectors.socialStrategyDrafts?.addEventListener('click', () => {
  void generateSocialStrategy(true);
});

selectors.weeklyReportGenerate?.addEventListener('click', () => {
  void generateWeeklyReport();
});

selectors.attributionLearningRun?.addEventListener('click', () => {
  void runAttributionLearning();
});

selectors.attributionRefresh?.addEventListener('click', () => {
  void loadGrowthAgent({force: true, tab: 'attribution'});
});

selectors.cityDigestGenerate?.addEventListener('click', () => {
  void generateWeeklyCityDigests();
});

document.addEventListener('click', (event) => {
  const collapseButton = event.target.closest('[data-panel-collapse]');
  if (collapseButton) {
    const panel = collapseButton.closest('.growth-agent-panel');
    if (panel) {
      setPanelCollapsed(panel, !panel.classList.contains('is-collapsed'));
    }
    return;
  }

  const hashLink = event.target.closest('a[href^="#"]');
  if (hashLink) {
    window.setTimeout(expandPanelForHash, 0);
  }

  const statusFilterButton = event.target.closest('[data-draft-status-filter]');
  if (statusFilterButton) {
    const status = statusFilterButton.dataset.draftStatusFilter || 'needs_approval';
    state.selectedDraftStatus = status;
    if (selectors.draftReviewStatus) {
      selectors.draftReviewStatus.value = status;
    }
    invalidateGrowthCache('review');
    void loadGrowthAgent({force: true, tab: 'review'});
    return;
  }

  const trackingButton = event.target.closest('[data-copy-tracking]');
  if (trackingButton) {
    void copyTrackingLink(trackingButton.dataset.copyTracking || '');
    return;
  }

  const copyButton = event.target.closest('[data-copy-caption]');
  if (copyButton) {
    void copyDraftCaption(copyButton.dataset.copyCaption || '');
    return;
  }

  const copyReplyButton = event.target.closest('[data-copy-social-reply]');
  if (copyReplyButton) {
    void copySocialReply(copyReplyButton.dataset.copySocialReply || '');
    return;
  }

  const taskButton = event.target.closest('[data-agent-task-status]');
  if (taskButton) {
    void updateAgentTaskStatus(taskButton.dataset.agentTaskId || '', taskButton.dataset.agentTaskStatus || '');
    return;
  }

  const socialReplyButton = event.target.closest('[data-social-reply-action]');
  if (socialReplyButton) {
    void runSocialReplyAction(
      socialReplyButton.dataset.socialReplyId || '',
      socialReplyButton.dataset.socialReplyAction || ''
    );
    return;
  }

  const socialThreadButton = event.target.closest('[data-social-thread-status]');
  if (socialThreadButton) {
    void updateSocialThreadStatus(
      socialThreadButton.dataset.socialThreadId || '',
      socialThreadButton.dataset.socialThreadStatus || ''
    );
    return;
  }

  const mediaButton = event.target.closest('[data-media-action]');
  if (mediaButton) {
    void runMediaAction(
      mediaButton.dataset.mediaId || '',
      mediaButton.dataset.mediaAction || ''
    );
    return;
  }

  const button = event.target.closest('[data-draft-action]');
  if (!button) return;
  void runDraftAction(button.dataset.draftId || '', button.dataset.draftAction || '');
});

document.addEventListener('error', (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.matches('[data-media-preview-image]')) return;
  const placeholder = document.createElement('span');
  placeholder.className = 'draft-media-placeholder';
  placeholder.textContent = 'Open Source';
  image.replaceWith(placeholder);
}, true);

selectors.draftReviewStatus?.addEventListener('change', (event) => {
  state.selectedDraftStatus = event.target.value || 'needs_approval';
  invalidateGrowthCache('review');
  void loadGrowthAgent({force: true, tab: 'review'});
});

selectors.draftReviewPlatform?.addEventListener('change', (event) => {
  state.selectedDraftPlatform = event.target.value || 'all';
  invalidateGrowthCache('review');
  void loadGrowthAgent({force: true, tab: 'review'});
});

selectors.socialInboxStatus?.addEventListener('change', socialInboxFilterChanged);

selectors.socialInboxPlatform?.addEventListener('change', socialInboxFilterChanged);

selectors.status?.addEventListener('change', (event) => {
  state.selectedStatus = event.target.value || 'needs_review';
  invalidateGrowthCache('claims');
  void loadGrowthAgent({force: true, tab: 'claims'});
});

window.addEventListener('hashchange', expandPanelForHash);

initCollapsiblePanels();
initGrowthAgentTabs();

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    setAuthenticatedView(false);
    setMessage(selectors.message, '');
    if (selectors.sessionSummary) {
      selectors.sessionSummary.textContent = '';
    }
    state.socialDrafts = [];
    state.draftReviewQueue = null;
    state.socialInbox = null;
    state.claimFunnelReport = null;
    state.weeklyReport = null;
    state.attributionPerformance = null;
    state.attributionEvents = [];
    state.autopilotReport = null;
    state.agentBriefing = null;
    state.agentTasks = [];
    state.agentMemories = [];
    state.lastAgentRun = null;
    state.lastAttributionRun = null;
    state.lastCityDigestBatch = null;
    state.lastMediaBatch = null;
    renderAgentPanel();
    renderDraftReviewQueue();
    renderSocialInbox();
    renderClaimFunnel();
    renderWeeklyReport();
    renderAttributionPerformance();
    renderCityDigestSummary();
    renderSocialDrafts();
    renderAutopilot();
    return;
  }

  setAuthenticatedView(true);
  if (selectors.sessionSummary) {
    selectors.sessionSummary.textContent = `Signed in as ${user.email || 'admin'}. Facebook and Instagram publishing is enabled for approved drafts only. Replies and outbound sending still require review.`;
  }
  invalidateGrowthCache();
  await loadGrowthAgent({force: true, refreshMetrics: true});
});
