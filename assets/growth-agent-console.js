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
  selectedDraftStatus: 'needs_approval',
  counts: {},
  leads: [],
  draftReviewQueue: null,
  claimFunnelReport: null,
  weeklyReport: null,
  socialDrafts: [],
  autopilotReport: null,
  lastAutopilotPlan: null,
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
  dailyAutomationRun: document.querySelector('[data-daily-automation-run]'),
  draftReviewRefresh: document.querySelector('[data-draft-review-refresh]'),
  draftReviewStatus: document.querySelector('[data-draft-review-status]'),
  draftReviewLoadedAt: document.querySelector('[data-draft-review-loaded-at]'),
  draftReviewCounts: document.querySelector('[data-draft-review-counts]'),
  draftReviewQueue: document.querySelector('[data-draft-review-queue]'),
  claimFunnelSummary: document.querySelector('[data-claim-funnel-summary]'),
  claimFunnelRecommendations: document.querySelector('[data-claim-funnel-recommendations]'),
  claimFunnelLeads: document.querySelector('[data-claim-funnel-leads]'),
  weeklyReportGenerate: document.querySelector('[data-weekly-report-generate]'),
  weeklyReportSummary: document.querySelector('[data-weekly-report-summary]'),
  weeklyReportRecommendations: document.querySelector('[data-weekly-report-recommendations]'),
  weeklyReportLists: document.querySelector('[data-weekly-report-lists]'),
  socialGenerate: document.querySelector('[data-social-generate]'),
  socialRefresh: document.querySelector('[data-social-refresh]'),
  socialCity: document.querySelector('[data-social-city]'),
  socialLimit: document.querySelector('[data-social-limit]'),
  socialOwnerTags: document.querySelector('[data-social-owner-tags]'),
  socialPlatforms: Array.from(document.querySelectorAll('[data-social-platform]')),
  socialDrafts: document.querySelector('[data-social-drafts]'),
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
    selectors.draftReviewRefresh,
    selectors.draftReviewStatus,
    selectors.weeklyReportGenerate,
    selectors.status,
    selectors.socialGenerate,
    selectors.socialRefresh,
    selectors.socialCity,
    selectors.socialLimit,
    selectors.socialOwnerTags,
    selectors.autopilotGenerate,
    selectors.autopilotRefresh,
    selectors.autopilotCity,
    selectors.autopilotDays,
    selectors.autopilotDailyPosts,
    selectors.autopilotOwnerTags,
    ...selectors.socialPlatforms,
    ...selectors.autopilotPlatforms,
    ...document.querySelectorAll('[data-draft-action]'),
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

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'truck';
}

function dynamicTruckUrl(truckId) {
  const url = new URL('/truck/', PUBLIC_SITE_BASE_URL);
  url.searchParams.set('id', truckId);
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
    return dynamicTruckUrl(fallbackId);
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
  const autopilotCopy = state.lastAutopilotPlan
    ? `Last autopilot plan created ${formatCount(state.lastAutopilotPlan.drafts || 0)} scheduled drafts.`
    : 'Growth Autopilot builds reviewable scheduled drafts only.';

  selectors.metrics.innerHTML = `
    ${metricRows.map(([label, value]) => `
      <div class="growth-agent-card">
        <strong>${escapeHtml(formatCount(value))}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    `).join('')}
    <div class="growth-agent-card growth-agent-card--wide">
      <strong>Automation</strong>
      <span>${escapeHtml(syncCopy)} ${escapeHtml(queueCopy)} ${escapeHtml(socialCopy)} ${escapeHtml(autopilotCopy)}</span>
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
  const platformFlag = (draft.risk_flags || []).find((flag) => String(flag).startsWith('platform:'));
  return platformFlag ? platformFlag.replace('platform:', '') : 'social';
}

function draftActionButtons(draftOrSlot) {
  const draftId = draftOrSlot.id || draftOrSlot.draft_id;
  const status = String(draftOrSlot.status || '');
  if (!draftId) return '';

  const buttons = [];
  if (status === 'needs_approval') {
    buttons.push(['approve', 'Approve']);
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
      ${buttons.map(([action, label]) => `
        <button class="row-action row-action--button" type="button" data-draft-action="${escapeHtml(action)}" data-draft-id="${escapeHtml(draftId)}">
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
  };
  return labels[value] || growthStatusLabel(value || 'Draft');
}

function statusPillClass(status) {
  const normalized = String(status || '');
  if (normalized === 'published' || normalized === 'verified') return 'status-pill status-pill--success';
  if (normalized.startsWith('rejected') || normalized === 'do_not_contact') return 'status-pill status-pill--danger';
  if (normalized === 'needs_approval' || normalized === 'needs_review' || normalized === 'claim_started') return 'status-pill status-pill--warn';
  return 'status-pill';
}

function renderDraftReviewQueue() {
  const queue = state.draftReviewQueue || {};
  const drafts = queue.drafts || [];
  const counts = queue.counts || {};

  if (selectors.draftReviewCounts) {
    const rows = [
      ['Needs Approval', counts.needs_approval || 0],
      ['Approved', counts.approved || 0],
      ['Scheduled', counts.scheduled || 0],
      ['Published', counts.published || 0],
      ['Rejected', counts.rejected || 0],
    ];
    selectors.draftReviewCounts.innerHTML = rows.map(([label, value]) => `
      <div class="growth-agent-card">
        <strong>${escapeHtml(formatCount(value))}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    `).join('');
  }

  if (selectors.draftReviewLoadedAt) {
    selectors.draftReviewLoadedAt.textContent = state.loadedAt
      ? `Loaded ${formatDate(state.loadedAt)}`
      : '';
  }

  if (!selectors.draftReviewQueue) return;

  if (!drafts.length) {
    selectors.draftReviewQueue.innerHTML = `
      <div class="growth-agent-empty growth-agent-empty--card">No drafts match this status.</div>
    `;
    return;
  }

  selectors.draftReviewQueue.innerHTML = drafts.map((draft) => {
    const profileUrl = resolvePublicUrl(draft.profile_url, draft.truck_id, draft);
    const trackingUrl = draft.tracking_url || `${GROWTH_AGENT_API_BASE_URL}/r/${draft.tracking_slug || ''}`;
    const truckLabel = [draft.truck_name, draft.city].filter(Boolean).join(' / ') || 'No truck attached';
    const scheduleLabel = draft.scheduled_for ? formatDate(draft.scheduled_for) : 'Not scheduled';
    const subject = draft.subject ? `<strong>${escapeHtml(draft.subject)}</strong>` : '';

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
            <a class="row-action row-action--ghost" href="${escapeHtml(profileUrl)}" target="_blank" rel="noreferrer">Open Profile</a>
            <a class="row-action row-action--ghost" href="${escapeHtml(trackingUrl)}" target="_blank" rel="noreferrer">Open Link</a>
          </div>
        </div>
        <div class="draft-review-card__copy" data-caption-source="${escapeHtml(draft.id)}">
          ${subject}
          <p>${escapeHtml(draft.text || '').replace(/\n/g, '<br>')}</p>
        </div>
        ${draft.media_brief ? `<details class="draft-review-card__brief"><summary>Media and reviewer notes</summary><p>${escapeHtml(draft.media_brief).replace(/\n/g, '<br>')}</p></details>` : ''}
        ${draft.rejection_reason ? `<p class="draft-review-card__reason">Rejected: ${escapeHtml(draft.rejection_reason)}</p>` : ''}
        <div class="draft-review-card__footer">
          ${draftActionButtons(draft)}
        </div>
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
          <td><a class="row-action row-action--ghost" href="${escapeHtml(slot.tracking_url || '#')}" target="_blank" rel="noreferrer">Open Link</a></td>
          <td>${draftActionButtons(slot)}</td>
        </tr>
      `).join('');
    }
  }
}

function renderAll() {
  renderMetrics();
  renderDraftReviewQueue();
  renderClaimFunnel();
  renderWeeklyReport();
  renderAutopilot();
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
    const draftStatus = state.selectedDraftStatus || 'needs_approval';
    const [
      leadsPayload,
      draftPayload,
      reviewQueuePayload,
      claimFunnelPayload,
      autopilotPayload,
      weeklyReportsPayload,
    ] = await Promise.all([
      callGrowthAgent(`/admin/owner-outreach-leads?limit=100${status}`),
      callGrowthAgent('/admin/campaign-drafts?status=needs_approval&limit=100'),
      callGrowthAgent(`/admin/campaign-draft-review-queue?status=${encodeURIComponent(draftStatus)}&limit=50`),
      callGrowthAgent('/admin/claim-funnel-report?limit=25'),
      callGrowthAgent('/admin/growth-autopilot-report?days=14'),
      callGrowthAgent('/admin/weekly-growth-reports?limit=1'),
    ]);

    state.counts = Object.fromEntries(countResults);
    state.leads = leadsPayload.leads || [];
    state.draftReviewQueue = reviewQueuePayload.queue || null;
    state.claimFunnelReport = claimFunnelPayload.report || null;
    state.weeklyReport = weeklyReportsPayload.reports?.[0] || null;
    state.socialDrafts = (draftPayload.drafts || [])
      .filter((draft) => draft.channel === 'social_draft')
      .slice(0, 25);
    state.autopilotReport = autopilotPayload.report || null;
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
        platforms: selectedAutopilotPlatforms(),
        city: String(selectors.autopilotCity?.value || '').trim() || undefined,
        include_owner_tags: selectors.autopilotOwnerTags?.checked !== false,
        actor: auth.currentUser?.email || 'growth-agent-console',
      },
    });
    const summary = payload.run?.summary || {};
    state.lastSync = payload.run?.sync || null;
    state.lastQueue = {items: summary.queue_items || 0, real_sending_enabled: false};
    state.lastSocialBatch = {drafts: summary.social_drafts || 0, real_sending_enabled: false};
    state.lastAutopilotPlan = {drafts: summary.autopilot_drafts || 0, real_publishing_enabled: false};
    setMessage(
      selectors.message,
      `Daily automation complete: ${summary.owner_outreach_drafts || 0} outreach drafts, ${summary.social_drafts || 0} social drafts, ${summary.autopilot_drafts || 0} scheduled drafts.`
    );
    await loadGrowthAgent();
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

function selectedAutopilotPlatforms() {
  const platforms = selectors.autopilotPlatforms
    .filter((input) => input.checked)
    .map((input) => input.value);
  return platforms.length ? platforms : ['instagram', 'facebook', 'tiktok', 'x'];
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
    setMessage(selectors.message, `Growth Autopilot created ${drafts.length} scheduled draft${drafts.length === 1 ? '' : 's'} for approval. Real publishing remains disabled.`);
    await loadGrowthAgent();
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
    setMessage(selectors.message, `Created ${drafts.length} social draft${drafts.length === 1 ? '' : 's'} for approval. Real publishing remains disabled.`);
    await loadGrowthAgent();
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
    await loadGrowthAgent();
  } catch (error) {
    setMessage(selectors.message, error.message || 'Weekly report failed.', true);
  } finally {
    setLoading(false);
  }
}

async function runDraftAction(draftId, action) {
  if (!draftId || !action) return;

  const body = {
    actor: auth.currentUser?.email || 'growth-agent-console',
  };

  if (action === 'reject') {
    const reason = window.prompt('Why reject this draft?');
    if (!reason || !reason.trim()) return;
    body.rejection_reason = reason.trim();
  }

  setLoading(true);
  setMessage(selectors.message, `${growthStatusLabel(action)} draft...`);

  try {
    await callGrowthAgent(`/admin/campaign-drafts/${encodeURIComponent(draftId)}/${action}`, {
      method: 'POST',
      body,
    });
    setMessage(selectors.message, `Draft ${growthStatusLabel(action).toLowerCase()} complete.`);
    await loadGrowthAgent();
  } catch (error) {
    setMessage(selectors.message, error.message || 'Draft action failed.', true);
  } finally {
    setLoading(false);
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

selectors.dailyAutomationRun?.addEventListener('click', () => {
  void runDailyAutomation();
});

selectors.draftReviewRefresh?.addEventListener('click', () => {
  void loadGrowthAgent();
});

selectors.autopilotGenerate?.addEventListener('click', () => {
  void generateGrowthAutopilotPlan();
});

selectors.autopilotRefresh?.addEventListener('click', () => {
  void loadGrowthAgent();
});

selectors.socialGenerate?.addEventListener('click', () => {
  void generateSocialDrafts();
});

selectors.socialRefresh?.addEventListener('click', () => {
  void loadGrowthAgent();
});

selectors.weeklyReportGenerate?.addEventListener('click', () => {
  void generateWeeklyReport();
});

document.addEventListener('click', (event) => {
  const copyButton = event.target.closest('[data-copy-caption]');
  if (copyButton) {
    void copyDraftCaption(copyButton.dataset.copyCaption || '');
    return;
  }

  const button = event.target.closest('[data-draft-action]');
  if (!button) return;
  void runDraftAction(button.dataset.draftId || '', button.dataset.draftAction || '');
});

selectors.draftReviewStatus?.addEventListener('change', (event) => {
  state.selectedDraftStatus = event.target.value || 'needs_approval';
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
    state.draftReviewQueue = null;
    state.claimFunnelReport = null;
    state.weeklyReport = null;
    state.autopilotReport = null;
    renderDraftReviewQueue();
    renderClaimFunnel();
    renderWeeklyReport();
    renderSocialDrafts();
    renderAutopilot();
    return;
  }

  setAuthenticatedView(true);
  if (selectors.sessionSummary) {
    selectors.sessionSummary.textContent = `Signed in as ${user.email || 'admin'}. Real publishing and sending remain disabled by default.`;
  }
  await loadGrowthAgent();
});
