(function () {
  'use strict';

  const form = document.querySelector('[data-claim-form]');
  if (!form) return;

  const endpoint = String(form.dataset.claimEndpoint || '').trim();
  const attribution = window.FTFAttribution;
  const appStoreUrl = 'https://apps.apple.com/us/app/ftf-food-truck-finder/id6742719545';
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.innoryzen.foodtruckfinder';
  const brandFallback = new URL('../assets/brand/IconLogo-96.svg', window.location.href).toString();
  const allowedProductionOrigins = new Set([
    'https://www.ftf-foodtruckfinder.com',
    'https://ftf-foodtruckfinder.com',
  ]);
  const tokenPattern = /^[A-Za-z0-9_-]{40,128}$/;
  const requestTimeoutMs = 15000;
  const trackedOnce = new Set();
  const completedFields = new Set();

  const elements = {
    main: document.querySelector('.claim-main'),
    backProfile: document.querySelector('[data-back-profile]'),
    openAppLink: document.querySelector('[data-open-app-link]'),
    context: document.querySelector('[data-truck-context]'),
    contextLoading: document.querySelector('[data-truck-context-loading]'),
    selectedCard: document.querySelector('[data-selected-truck-card]'),
    selectedImage: document.querySelector('[data-selected-truck-image]'),
    selectedName: document.querySelector('[data-selected-truck-name]'),
    selectedLocation: document.querySelector('[data-selected-truck-location]'),
    changeTruck: document.querySelector('[data-change-truck]'),
    searchStep: document.querySelector('[data-truck-search-step]'),
    searchForm: document.querySelector('[data-truck-search-form]'),
    searchButton: document.querySelector('[data-claim-search]'),
    searchStatus: document.querySelector('[data-claim-search-status]'),
    results: document.querySelector('[data-claim-results]'),
    recovery: document.querySelector('[data-claim-recovery]'),
    support: document.querySelector('[data-claim-support]'),
    heading: document.querySelector('[data-claim-heading]'),
    introCopy: document.querySelector('[data-claim-intro-copy]'),
    panel: document.querySelector('[data-claim-panel]'),
    contactState: document.querySelector('[data-claim-contact-state]'),
    successState: document.querySelector('[data-claim-success-state]'),
    duplicateState: document.querySelector('[data-claim-duplicate-state]'),
    connectedState: document.querySelector('[data-claim-connected-state]'),
    verifiedState: document.querySelector('[data-claim-verified-state]'),
    expiredState: document.querySelector('[data-claim-expired-state]'),
    successHeading: document.querySelector('[data-claim-success-heading]'),
    duplicateHeading: document.querySelector('[data-claim-duplicate-heading]'),
    connectedHeading: document.querySelector('[data-claim-connected-heading]'),
    verifiedHeading: document.querySelector('[data-claim-verified-heading]'),
    expiredHeading: document.querySelector('[data-claim-expired-heading]'),
    successTruckName: document.querySelector('[data-success-truck-name]'),
    duplicateTruckName: document.querySelector('[data-duplicate-truck-name]'),
    selectedTruckId: form.querySelector('[data-selected-truck-id]'),
    selectedTruckNameInput: form.querySelector('[data-selected-truck-name-input]'),
    selectedTruckCityInput: form.querySelector('[data-selected-truck-city-input]'),
    selectedTruckStateInput: form.querySelector('[data-selected-truck-state-input]'),
    profileUrlInput: form.querySelector('[data-truck-profile-url]'),
    acquisitionSource: form.querySelector('[data-acquisition-source]'),
    referringProfile: form.querySelector('[data-referring-profile]'),
    email: form.elements.namedItem('ownerEmail'),
    phone: form.elements.namedItem('ownerPhone'),
    honeypot: form.elements.namedItem('companyHomepage'),
    errorSummary: document.querySelector('[data-error-summary]'),
    errorSummaryList: document.querySelector('[data-error-summary-list]'),
    status: document.querySelector('[data-claim-status]'),
    submit: document.querySelector('[data-claim-submit]'),
    submitLabel: document.querySelector('[data-claim-submit-label]'),
    submitSpinner: document.querySelector('[data-claim-submit-spinner]'),
    primaryApp: document.querySelector('[data-claim-app-primary]'),
    duplicateContinue: document.querySelector('[data-duplicate-continue]'),
    connectedOpen: document.querySelector('[data-connected-open-app]'),
    resend: document.querySelector('[data-claim-resend]'),
    resendStatus: document.querySelector('[data-resend-status]'),
    restart: document.querySelector('[data-claim-restart]'),
    qrRegion: document.querySelector('[data-claim-qr-region]'),
    qrImage: document.querySelector('[data-claim-qr-image]'),
    appStore: document.querySelector('[data-claim-app-store]'),
    playStore: document.querySelector('[data-claim-play-store]'),
    progressContact: document.querySelector('[data-progress-step="contact"]'),
    progressApp: document.querySelector('[data-progress-step="app"]'),
    progressUpdate: document.querySelector('[data-progress-step="update"]'),
    currentYear: document.querySelector('[data-current-year]'),
  };

  const state = {
    truck: null,
    continuationUrl: '',
    lastContact: null,
    submitting: false,
    resending: false,
    formStarted: false,
    requestedName: '',
    requestedCity: '',
    approvedProfileUrl: '',
    experimentVariant: 'control',
  };

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function normalizeComparison(value) {
    return clean(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function fieldValue(name) {
    const field = form.elements.namedItem(name);
    return field && 'value' in field ? clean(field.value) : '';
  }

  function setHiddenValue(element, value) {
    if (element) element.value = clean(value);
  }

  function firstParam(params, names) {
    for (const name of names) {
      const value = clean(params.get(name));
      if (value) return value;
    }
    return '';
  }

  function isLocalOrigin(url) {
    return url.origin === window.location.origin
      && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
  }

  function safeProfileUrl(value) {
    const raw = clean(value);
    if (!raw) return null;

    try {
      const url = new URL(raw, window.location.origin);
      const approvedOrigin = allowedProductionOrigins.has(url.origin) || isLocalOrigin(url);
      const approvedPath = url.pathname === '/truck' || url.pathname.startsWith('/truck/');
      if (!approvedOrigin || !approvedPath || url.username || url.password) return null;
      return url;
    } catch {
      return null;
    }
  }

  function isSafeTruckId(value) {
    const id = clean(value);
    return Boolean(id)
      && id.length <= 160
      && !id.includes('/')
      && !/[\u0000-\u001f\u007f]/.test(id);
  }

  function safeImageUrl(value) {
    const raw = clean(value);
    if (!raw) return '';
    try {
      const url = new URL(raw, window.location.origin);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
    } catch {
      return '';
    }
  }

  function safeContinuationUrl(value) {
    const raw = clean(value);
    if (!raw) return '';
    try {
      const url = new URL(raw, window.location.origin);
      const approvedOrigin = allowedProductionOrigins.has(url.origin) || isLocalOrigin(url);
      const approvedPath = url.pathname === '/claim/continue/' || url.pathname === '/claim/continue';
      const token = clean(url.searchParams.get('token'));
      if (!approvedOrigin || !approvedPath || !tokenPattern.test(token)) return '';
      return url.toString();
    } catch {
      return '';
    }
  }

  function normalizeTruck(value) {
    const item = value && typeof value === 'object' ? value : {};
    const id = clean(item.id || item.truckId);
    const name = clean(item.name || item.truckName);
    if (!isSafeTruckId(id) || !name) return null;
    return {
      id,
      name,
      city: clean(item.city),
      state: clean(item.state),
      currentAddress: clean(item.currentAddress),
      profileUrl: safeProfileUrl(item.profileUrl)?.toString() || '',
      imageUrl: safeImageUrl(item.imageUrl),
      claimStatus: clean(item.claimStatus),
    };
  }

  function truckLocation(truck) {
    const cityAndState = [truck.city, truck.state].filter(Boolean).join(', ');
    return cityAndState || truck.currentAddress || '';
  }

  function updateSupportLink(query, city) {
    if (!elements.support) return;
    const truckName = clean(query || state.requestedName);
    const truckCity = clean(city || state.requestedCity);
    const subject = truckName ? `Owner claim help for ${truckName}` : 'Food Truck Finder owner claim help';
    const details = [
      'Hi Food Truck Finder,',
      '',
      'I own a food truck and need help finding or creating the right profile.',
      '',
      `Truck name: ${truckName || 'Please add'}`,
      `City or service area: ${truckCity || 'Please add'}`,
      state.approvedProfileUrl ? `Profile I started from: ${state.approvedProfileUrl}` : '',
      '',
      'Please help me continue my owner claim.',
    ].filter(Boolean);
    elements.support.href = `mailto:Foodtruckfinderinfo@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(details.join('\n'))}`;
  }

  function deviceContext() {
    const userAgent = navigator.userAgent || '';
    const isIpad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const ios = /iPhone|iPad|iPod/i.test(userAgent) || isIpad;
    const android = /Android/i.test(userAgent);
    const mobile = ios || android || /Mobile/i.test(userAgent);
    let operatingSystem = 'other';
    if (ios) operatingSystem = 'ios';
    else if (android) operatingSystem = 'android';
    else if (/Mac OS/i.test(userAgent)) operatingSystem = 'macos';
    else if (/Windows/i.test(userAgent)) operatingSystem = 'windows';
    else if (/Linux/i.test(userAgent)) operatingSystem = 'linux';

    let browser = 'other';
    if (/Edg\//i.test(userAgent)) browser = 'edge';
    else if (/CriOS|Chrome\//i.test(userAgent)) browser = 'chrome';
    else if (/FxiOS|Firefox\//i.test(userAgent)) browser = 'firefox';
    else if (/Safari\//i.test(userAgent)) browser = 'safari';

    return {
      ios,
      android,
      mobile,
      device_category: mobile ? 'mobile' : 'desktop',
      operating_system: operatingSystem,
      browser,
    };
  }

  function safeEventProperties(extra) {
    const device = deviceContext();
    return Object.assign({
      truck_id: state.truck?.id || undefined,
      acquisition_source: elements.acquisitionSource?.value || 'claim_page',
      referring_profile: state.approvedProfileUrl ? 'truck_profile' : 'none',
      device_category: device.device_category,
      operating_system: device.operating_system,
      browser: device.browser,
      experiment_variant: state.experimentVariant,
    }, extra || {});
  }

  function trackEvent(name, extra, onceKey) {
    const dedupeKey = onceKey ? `${name}:${onceKey}` : '';
    if (dedupeKey && trackedOnce.has(dedupeKey)) return;
    if (dedupeKey) trackedOnce.add(dedupeKey);

    const properties = safeEventProperties(extra);
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, properties);
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({event: name}, properties));
    }
    window.dispatchEvent(new CustomEvent('ftf:analytics', {
      detail: Object.assign({event: name}, properties),
    }));

    attribution?.track(name, {
      truckId: state.truck?.id || undefined,
      city: state.truck?.city || undefined,
      metadata: {
        acquisition_source: properties.acquisition_source,
        referring_profile: properties.referring_profile,
        device_category: properties.device_category,
        operating_system: properties.operating_system,
        browser: properties.browser,
        experiment_variant: properties.experiment_variant,
        error_category: properties.error_category || undefined,
      },
      dedupeKey: onceKey || undefined,
      dedupeWindowMs: onceKey ? 30 * 60 * 1000 : undefined,
    });
  }

  function setSearchStatus(message, tone) {
    if (!elements.searchStatus) return;
    elements.searchStatus.textContent = clean(message);
    elements.searchStatus.hidden = !message;
    elements.searchStatus.classList.toggle('is-error', tone === 'error');
  }

  function setLiveStatus(message) {
    if (elements.status) elements.status.textContent = clean(message);
  }

  function setContextBusy(isBusy) {
    elements.context?.setAttribute('aria-busy', isBusy ? 'true' : 'false');
    if (elements.contextLoading) elements.contextLoading.hidden = !isBusy;
  }

  function setFormEnabled(enabled) {
    if (elements.submit) elements.submit.disabled = !enabled || state.submitting;
  }

  function showPanelState(name, focus) {
    const states = {
      contact: elements.contactState,
      success: elements.successState,
      duplicate: elements.duplicateState,
      connected: elements.connectedState,
      verified: elements.verifiedState,
      expired: elements.expiredState,
    };
    Object.entries(states).forEach(([key, element]) => {
      if (element) element.hidden = key !== name;
    });
    if (elements.panel) elements.panel.hidden = false;

    const step = name === 'connected' || name === 'verified' ? elements.progressUpdate
      : name === 'success' || name === 'duplicate' ? elements.progressApp
        : elements.progressContact;
    [elements.progressContact, elements.progressApp, elements.progressUpdate].forEach((item) => {
      if (!item) return;
      const current = item === step;
      item.classList.toggle('is-current', current);
      if (current) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });

    if (focus) {
      window.requestAnimationFrame(() => focus.focus({preventScroll: false}));
    }
  }

  function applyExperiment() {
    const params = new URLSearchParams(window.location.search);
    const candidate = clean(params.get('claim_variant')).toLowerCase();
    const allowed = new Set(['control', 'button_b', 'headline_b', 'reassurance_b']);
    state.experimentVariant = allowed.has(candidate) ? candidate : 'control';

    if (state.experimentVariant === 'button_b' && elements.submitLabel) {
      elements.submitLabel.textContent = 'Start My Claim';
    }
    if (state.experimentVariant === 'reassurance_b') {
      const reassurance = document.querySelector('.claim-reassurance strong');
      if (reassurance) reassurance.textContent = 'Start with email and phone. We’ll help with the rest.';
    }
  }

  function updateHeading(truck) {
    if (!elements.heading || !elements.introCopy) return;
    if (!truck) {
      elements.heading.textContent = 'Claim your food truck';
      elements.introCopy.textContent = 'Find your truck, add two contact details, and use the secure link to finish setting up your Owner account.';
      return;
    }
    elements.heading.textContent = state.experimentVariant === 'headline_b'
      ? `Manage ${truck.name} from the app`
      : `Claim ${truck.name}`;
    elements.introCopy.textContent = 'Add your email and mobile number. We’ll save this claim and send a secure link to finish in the Food Truck Finder app.';
    document.title = `${truck.name} Claim | Food Truck Finder`;
  }

  function renderTruck(truck, options) {
    state.truck = truck;
    elements.main?.classList.remove('is-searching');
    setContextBusy(false);
    if (elements.searchStep) elements.searchStep.hidden = true;
    if (elements.recovery) elements.recovery.hidden = true;
    if (elements.selectedCard) elements.selectedCard.hidden = false;
    if (elements.selectedName) elements.selectedName.textContent = truck.name;

    const location = truckLocation(truck);
    if (elements.selectedLocation) {
      elements.selectedLocation.textContent = location;
      elements.selectedLocation.hidden = !location;
    }

    if (elements.selectedImage) {
      const image = truck.imageUrl || brandFallback;
      elements.selectedImage.src = image;
      elements.selectedImage.alt = truck.imageUrl ? `${truck.name} food truck` : '';
      elements.selectedImage.dataset.fallback = truck.imageUrl ? 'false' : 'true';
      elements.selectedImage.onerror = () => {
        elements.selectedImage.onerror = null;
        elements.selectedImage.src = brandFallback;
        elements.selectedImage.alt = '';
        elements.selectedImage.dataset.fallback = 'true';
      };
    }

    setHiddenValue(elements.selectedTruckId, truck.id);
    setHiddenValue(elements.selectedTruckNameInput, truck.name);
    setHiddenValue(elements.selectedTruckCityInput, truck.city);
    setHiddenValue(elements.selectedTruckStateInput, truck.state);
    setHiddenValue(elements.profileUrlInput, truck.profileUrl);
    updateHeading(truck);
    showPanelState('contact');
    setFormEnabled(true);

    const profile = safeProfileUrl(truck.profileUrl) || safeProfileUrl(state.approvedProfileUrl);
    if (profile && elements.backProfile) {
      elements.backProfile.href = profile.toString();
      elements.backProfile.hidden = false;
    }

    trackEvent('selected_truck_loaded', undefined, truck.id);
    trackEvent('claim_form_view', undefined, truck.id);

    if (options?.selectedByUser) {
      const url = new URL(window.location.href);
      url.searchParams.set('id', truck.id);
      url.searchParams.set('selectedTruckId', truck.id);
      url.searchParams.set('truck', truck.name);
      if (location) url.searchParams.set('city', location);
      if (truck.profileUrl) url.searchParams.set('profile', truck.profileUrl);
      window.history.replaceState({}, '', url);
      elements.email?.focus({preventScroll: false});
    } else if (window.location.hash === '#claim-form') {
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      window.requestAnimationFrame(() => form.scrollIntoView({
        block: 'start',
        behavior: reduceMotion ? 'auto' : 'smooth',
      }));
    }
  }

  function showSearch(message, tone) {
    state.truck = null;
    elements.main?.classList.add('is-searching');
    state.continuationUrl = '';
    state.lastContact = null;
    setContextBusy(false);
    if (elements.selectedCard) elements.selectedCard.hidden = true;
    if (elements.searchStep) elements.searchStep.hidden = false;
    if (elements.recovery) elements.recovery.hidden = true;
    [
      elements.contactState,
      elements.successState,
      elements.duplicateState,
      elements.connectedState,
      elements.verifiedState,
      elements.expiredState,
    ].forEach((element) => {
      if (element) element.hidden = true;
    });
    if (elements.panel) elements.panel.hidden = true;
    if (elements.qrRegion) elements.qrRegion.hidden = true;
    if (elements.backProfile) elements.backProfile.hidden = !state.approvedProfileUrl;
    updateHeading(null);
    clearErrors();
    setFormEnabled(false);
    setSearchStatus(message, tone);
  }

  function setFieldError(name, message) {
    const field = form.elements.namedItem(name);
    const error = document.querySelector(`[data-field-error="${name}"]`);
    const wrapper = document.querySelector(`[data-field="${name}"]`);
    if (field) field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (error) {
      error.textContent = clean(message);
      error.hidden = !message;
    }
    wrapper?.classList.toggle('has-error', Boolean(message));
  }

  function clearErrors() {
    setFieldError('ownerEmail', '');
    setFieldError('ownerPhone', '');
    if (elements.errorSummary) elements.errorSummary.hidden = true;
    if (elements.errorSummaryList) elements.errorSummaryList.textContent = '';
  }

  function showErrorSummary(errors, focusSummary) {
    if (!elements.errorSummary || !elements.errorSummaryList) return;
    elements.errorSummaryList.textContent = '';
    errors.forEach((error) => {
      const item = document.createElement('li');
      if (error.field) {
        const link = document.createElement('a');
        link.href = `#${error.field === 'ownerEmail' ? 'owner-email' : 'owner-phone'}`;
        link.textContent = error.message;
        item.appendChild(link);
      } else {
        item.textContent = error.message;
      }
      elements.errorSummaryList.appendChild(item);
    });
    elements.errorSummary.hidden = false;
    if (focusSummary) elements.errorSummary.focus({preventScroll: false});
  }

  function emailError(value) {
    if (!value) return 'Enter an email address.';
    if (value.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      return 'Enter a valid email address.';
    }
    return '';
  }

  function phoneError(value) {
    if (!value) return 'Enter a mobile phone number.';
    const digits = value.replace(/\D/g, '');
    if (value.length > 32 || !/^\+?[0-9().\-\s]+$/.test(value) || digits.length < 7 || digits.length > 15) {
      return 'Check the phone number and try again.';
    }
    return '';
  }

  function validateContact() {
    clearErrors();
    const email = clean(elements.email?.value).toLowerCase();
    const phone = clean(elements.phone?.value);
    if (elements.email) elements.email.value = email;
    if (elements.phone) elements.phone.value = phone;
    const errors = [];
    const emailMessage = emailError(email);
    const phoneMessage = phoneError(phone);
    if (emailMessage) {
      setFieldError('ownerEmail', emailMessage);
      errors.push({field: 'ownerEmail', message: emailMessage});
    }
    if (phoneMessage) {
      setFieldError('ownerPhone', phoneMessage);
      errors.push({field: 'ownerPhone', message: phoneMessage});
    }
    if (errors.length) showErrorSummary(errors, true);
    return {ok: errors.length === 0, email, phone};
  }

  function setSubmitting(submitting) {
    state.submitting = submitting;
    if (elements.submit) {
      elements.submit.disabled = submitting || !state.truck;
      elements.submit.classList.toggle('is-loading', submitting);
      elements.submit.setAttribute('aria-busy', submitting ? 'true' : 'false');
    }
    if (elements.submitLabel) {
      elements.submitLabel.textContent = submitting
        ? 'Saving your claim…'
        : state.experimentVariant === 'button_b' ? 'Start My Claim' : 'Continue to App Setup';
    }
    if (elements.submitSpinner) elements.submitSpinner.hidden = !submitting;
    form.setAttribute('aria-busy', submitting ? 'true' : 'false');
    setLiveStatus(submitting ? 'Saving your claim.' : '');
  }

  async function readJson(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  async function fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      return await fetch(url, {...(options || {}), signal: controller.signal});
    } catch (error) {
      if (error && error.name === 'AbortError') {
        const timeoutError = new Error('The request took too long. Check your connection and try again.');
        timeoutError.code = 'timeout';
        throw timeoutError;
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function notifyClaimStarted() {
    if (!endpoint || !state.truck || state.formStarted) return;
    state.formStarted = true;
    trackEvent('claim_form_started', undefined, state.truck.id);

    const query = new URLSearchParams({
      action: 'start',
      source: 'contact_v2',
      selectedTruckId: state.truck.id,
    });
    fetchWithTimeout(`${endpoint}?${query.toString()}`, {
      method: 'GET',
      headers: {Accept: 'application/json'},
    }).catch(() => undefined);
  }

  function errorFromResponse(response, payload) {
    const code = clean(payload.code || payload.errorCode) || `http_${response.status}`;
    const retryAfter = Number(payload.retryAfterSeconds || response.headers.get('Retry-After') || 0);
    let message = clean(payload.error) || 'We couldn’t save your claim. Try again.';
    if (code === 'rate_limited') {
      const minutes = retryAfter > 0 ? Math.max(1, Math.ceil(retryAfter / 60)) : 1;
      message = `Too many attempts. Try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`;
    }
    const error = new Error(message);
    error.code = code;
    error.status = response.status;
    return error;
  }

  function setContinuationLinks(value) {
    const continuation = safeContinuationUrl(value);
    state.continuationUrl = continuation;
    const webHref = continuation || new URL('../open/', window.location.href).toString();
    const device = deviceContext();
    let primaryHref = webHref;
    if (continuation && device.mobile) {
      const token = clean(new URL(continuation).searchParams.get('token'));
      primaryHref = `foodtruckfinder:///claim/continue?token=${encodeURIComponent(token)}`;
    }
    [elements.primaryApp, elements.duplicateContinue].forEach((link) => {
      if (link) link.href = attribution?.decorateUrl(primaryHref) || primaryHref;
    });
    if (elements.connectedOpen) {
      elements.connectedOpen.href = attribution?.decorateUrl(webHref) || webHref;
    }
    if (elements.appStore) elements.appStore.href = attribution?.decorateUrl(appStoreUrl) || appStoreUrl;
    if (elements.playStore) elements.playStore.href = attribution?.decorateUrl(playStoreUrl) || playStoreUrl;
    return continuation;
  }

  function loadQrLibrary() {
    if (typeof window.qrcode === 'function') return Promise.resolve(window.qrcode);
    if (window.__FTF_QR_PROMISE__) return window.__FTF_QR_PROMISE__;
    window.__FTF_QR_PROMISE__ = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('../assets/vendor/qrcode-generator-1.4.4.min.js', window.location.href).toString();
      script.referrerPolicy = 'no-referrer';
      script.onload = () => typeof window.qrcode === 'function'
        ? resolve(window.qrcode)
        : reject(new Error('QR generator unavailable'));
      script.onerror = () => reject(new Error('QR generator unavailable'));
      document.head.appendChild(script);
    });
    return window.__FTF_QR_PROMISE__;
  }

  async function renderQrCode(url) {
    const device = deviceContext();
    if (!url || device.mobile || !elements.qrRegion || !elements.qrImage) return;
    try {
      const factory = await loadQrLibrary();
      const code = factory(0, 'M');
      code.addData(url);
      code.make();
      elements.qrImage.src = code.createDataURL(6, 8);
      elements.qrImage.alt = 'QR code to continue this food truck claim on a phone';
      elements.qrImage.hidden = false;
      elements.qrRegion.hidden = false;
    } catch {
      elements.qrRegion.hidden = true;
    }
  }

  function configureDeviceActions() {
    const device = deviceContext();
    if (elements.appStore) elements.appStore.hidden = device.android;
    if (elements.playStore) elements.playStore.hidden = device.ios;
    if (elements.primaryApp) {
      elements.primaryApp.hidden = !device.mobile;
      elements.primaryApp.textContent = device.mobile
        ? 'Continue in Food Truck Finder'
        : 'Open Food Truck Finder';
    }
  }

  function showSavedState(result) {
    const matchedTruck = normalizeTruck(result.matchedTruck);
    if (matchedTruck) renderTruck(matchedTruck);
    const continuation = setContinuationLinks(result.continuationUrl);
    configureDeviceActions();

    if (elements.successTruckName) elements.successTruckName.textContent = state.truck?.name || 'your food truck';
    if (elements.duplicateTruckName) elements.duplicateTruckName.textContent = state.truck?.name || 'this food truck';

    const claimState = clean(result.claimState).toLowerCase();
    if (claimState === 'already_connected') {
      showPanelState('connected', elements.connectedHeading);
      trackEvent('claim_success_state_view', {claim_state: 'already_connected'}, `${state.truck?.id}:connected`);
      return;
    }
    if (claimState === 'verified') {
      showPanelState('verified', elements.verifiedHeading);
      trackEvent('claim_success_state_view', {claim_state: 'verified'}, `${state.truck?.id}:verified`);
      return;
    }
    if (['rejected', 'expired', 'revoked', 'unavailable'].includes(claimState)) {
      showPanelState('expired', elements.expiredHeading);
      trackEvent('claim_success_state_view', {claim_state: claimState}, `${state.truck?.id}:${claimState}`);
      return;
    }
    if (claimState === 'already_started' || (!claimState && result.duplicate === true)) {
      showPanelState('duplicate', elements.duplicateHeading);
      trackEvent('claim_success_state_view', {claim_state: 'already_started'}, `${state.truck?.id}:duplicate`);
      trackEvent('claim_app_cta_view', {claim_state: 'already_started'}, `${state.truck?.id}:duplicate`);
      return;
    }

    showPanelState('success', elements.successHeading);
    trackEvent('claim_success_state_view', {claim_state: 'started'}, `${state.truck?.id}:started`);
    trackEvent('claim_app_cta_view', {claim_state: 'started'}, `${state.truck?.id}:started`);
    renderQrCode(continuation);
  }

  async function postContact(contact, mode) {
    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flowVersion: 'contact_v2',
        selectedTruckId: state.truck.id,
        ownerEmail: contact.email,
        ownerPhone: contact.phone,
        website: clean(elements.honeypot?.value),
        acquisitionSource: elements.acquisitionSource?.value || 'claim_page',
        requestMode: mode || 'submit',
      }),
    });
    const payload = await readJson(response);
    if (!response.ok || payload.ok !== true) throw errorFromResponse(response, payload);
    return payload;
  }

  async function submitClaim(event) {
    event.preventDefault();
    if (state.submitting || !state.truck) return;
    await notifyClaimStarted();
    const contact = validateContact();
    trackEvent('claim_submit_attempt');
    if (!contact.ok) {
      trackEvent('claim_submit_error', {error_category: 'validation'});
      return;
    }

    state.lastContact = {email: contact.email, phone: contact.phone};
    setSubmitting(true);
    try {
      const result = await postContact(state.lastContact, 'submit');
      trackEvent('claim_submit_success', {claim_state: clean(result.claimState) || 'started'}, state.truck.id);
      attribution?.track('claim_submitted', {
        truckId: state.truck.id,
        city: state.truck.city || undefined,
        metadata: {flow_version: 'contact_v2'},
        dedupeKey: state.truck.id,
        dedupeWindowMs: 30 * 60 * 1000,
      });
      form.reset();
      showSavedState(result);
    } catch (error) {
      const code = clean(error.code) || 'temporary';
      const errors = [];
      if (code === 'invalid_email') {
        setFieldError('ownerEmail', 'Enter a valid email address.');
        errors.push({field: 'ownerEmail', message: 'Enter a valid email address.'});
      } else if (code === 'invalid_phone') {
        setFieldError('ownerPhone', 'Check the phone number and try again.');
        errors.push({field: 'ownerPhone', message: 'Check the phone number and try again.'});
      } else {
        errors.push({message: error.message || 'We couldn’t save your claim. Try again.'});
      }
      showErrorSummary(errors, true);
      setLiveStatus(error.message || 'We couldn’t save your claim. Try again.');
      trackEvent('claim_submit_error', {error_category: code});
      if (code === 'invalid_truck') {
        showSearch('This truck profile is no longer available. Search for the correct truck.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function resendSetupLink() {
    if (state.resending || !state.lastContact || !state.truck) return;
    state.resending = true;
    if (elements.resend) elements.resend.disabled = true;
    if (elements.resendStatus) elements.resendStatus.textContent = 'Preparing a fresh setup link…';
    try {
      const result = await postContact(state.lastContact, 'resend');
      const continuation = setContinuationLinks(result.continuationUrl);
      const responseClaimState = clean(result.claimState).toLowerCase();
      trackEvent('claim_setup_link_resent');
      if (responseClaimState && responseClaimState !== 'already_started') {
        showSavedState(result);
        return;
      }
      const deliveryStatus = clean(result.confirmationDelivery?.status || result.emailDelivery);
      if (elements.resendStatus) {
        elements.resendStatus.textContent = deliveryStatus === 'sent'
          ? 'Setup link sent. You can also continue in the app now.'
          : 'A fresh secure setup link is ready. Continue in the app now.';
      }
      renderQrCode(continuation);
    } catch (error) {
      if (elements.resendStatus) {
        elements.resendStatus.textContent = error.message || 'We couldn’t refresh the setup link. Try again.';
      }
      trackEvent('claim_submit_error', {error_category: clean(error.code) || 'resend_error'});
    } finally {
      state.resending = false;
      if (elements.resend) elements.resend.disabled = false;
    }
  }

  function nameMatchesQuery(truck, query) {
    const normalizedQuery = normalizeComparison(query);
    if (!normalizedQuery) return true;
    const normalizedName = normalizeComparison(truck.name);
    return normalizedName === normalizedQuery
      || normalizedName.startsWith(normalizedQuery)
      || normalizedName.includes(normalizedQuery);
  }

  function exactRequestedTruck(trucks, query, city) {
    const normalizedQuery = normalizeComparison(query);
    const normalizedCity = normalizeComparison(city);
    if (!normalizedQuery) return null;
    const exact = trucks.filter((truck) => {
      if (normalizeComparison(truck.name) !== normalizedQuery) return false;
      return !normalizedCity || normalizeComparison(truckLocation(truck)).includes(normalizedCity);
    });
    return exact.length === 1 ? exact[0] : null;
  }

  function renderSearchResults(results, query, city, options) {
    if (!elements.results) return;
    elements.results.textContent = '';
    const trucks = Array.isArray(results)
      ? results.map(normalizeTruck).filter(Boolean).filter((truck) => nameMatchesQuery(truck, query))
      : [];
    const automaticMatch = options?.autoSelect ? exactRequestedTruck(trucks, query, city) : null;
    if (automaticMatch) {
      renderTruck(automaticMatch);
      return;
    }
    if (!trucks.length) {
      elements.results.hidden = true;
      if (elements.recovery) elements.recovery.hidden = false;
      updateSupportLink(query, city);
      setSearchStatus('We couldn’t find that truck in the current listings. Check the spelling or get one-to-one claim help below.', 'error');
      return;
    }

    if (elements.recovery) elements.recovery.hidden = false;
    updateSupportLink(query, city);
    trucks.forEach((truck) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'claim-result';
      button.setAttribute('aria-label', `Select ${truck.name}${truckLocation(truck) ? ` in ${truckLocation(truck)}` : ''}`);
      const copy = document.createElement('span');
      const name = document.createElement('strong');
      const location = document.createElement('span');
      const action = document.createElement('span');
      name.textContent = truck.name;
      location.textContent = truckLocation(truck) || 'Location details available in the profile';
      action.textContent = 'Select';
      copy.append(name, location);
      button.append(copy, action);
      button.addEventListener('click', () => renderTruck(truck, {selectedByUser: true}));
      elements.results.appendChild(button);
    });
    elements.results.hidden = false;
    setSearchStatus(`${trucks.length} matching truck${trucks.length === 1 ? '' : 's'} found. Select yours to continue.`);
  }

  async function requestTruckSearch(query, city, options) {
    const queryField = elements.searchForm?.elements.namedItem('truckSearch');
    if (!query) {
      setSearchStatus('Enter a truck name before searching.', 'error');
      queryField?.focus();
      return false;
    }

    if (elements.searchButton) elements.searchButton.disabled = true;
    if (elements.recovery) elements.recovery.hidden = true;
    setSearchStatus('Searching truck profiles…');
    if (elements.results) elements.results.hidden = true;
    try {
      const params = new URLSearchParams({action: 'search', q: query});
      if (city) params.set('city', city);
      const response = await fetchWithTimeout(`${endpoint}?${params.toString()}`, {
        headers: {Accept: 'application/json'},
      });
      const payload = await readJson(response);
      if (!response.ok || payload.ok !== true) throw errorFromResponse(response, payload);
      renderSearchResults(payload.results, query, city, options);
      return true;
    } catch (error) {
      if (elements.recovery) elements.recovery.hidden = false;
      updateSupportLink(query, city);
      const message = clean(error.code)
        ? error.message
        : 'Truck search is temporarily unavailable. Try again or use owner claim help below.';
      setSearchStatus(message, 'error');
      return false;
    } finally {
      if (elements.searchButton) elements.searchButton.disabled = false;
    }
  }

  async function searchTrucks(event) {
    event.preventDefault();
    const queryField = elements.searchForm?.elements.namedItem('truckSearch');
    const cityField = elements.searchForm?.elements.namedItem('truckSearchCity');
    const query = clean(queryField?.value);
    const city = clean(cityField?.value);
    await requestTruckSearch(query, city);
  }

  async function resolveTruck(truckId) {
    const params = new URLSearchParams({action: 'resolve', selectedTruckId: truckId});
    const response = await fetchWithTimeout(`${endpoint}?${params.toString()}`, {
      headers: {Accept: 'application/json'},
    });
    const payload = await readJson(response);
    if (!response.ok || payload.ok !== true) throw errorFromResponse(response, payload);
    const truck = normalizeTruck(payload.truck);
    if (!truck) {
      const error = new Error('This food truck profile could not be confirmed.');
      error.code = 'invalid_truck';
      throw error;
    }
    return truck;
  }

  function prefillSearch() {
    if (!elements.searchForm) return;
    const truckField = elements.searchForm.elements.namedItem('truckSearch');
    const cityField = elements.searchForm.elements.namedItem('truckSearchCity');
    if (truckField && 'value' in truckField) truckField.value = state.requestedName;
    if (cityField && 'value' in cityField) cityField.value = state.requestedCity;
  }

  async function initializeTruckContext() {
    const params = new URLSearchParams(window.location.search);
    state.requestedName = clean(params.get('truck'));
    state.requestedCity = clean(params.get('city'));
    const profile = safeProfileUrl(params.get('profile'));
    state.approvedProfileUrl = profile?.toString() || '';
    setHiddenValue(elements.referringProfile, state.approvedProfileUrl ? 'truck_profile' : '');
    if (elements.backProfile && profile) {
      elements.backProfile.href = profile.toString();
      elements.backProfile.hidden = false;
    }

    const source = firstParam(params, ['utm_source', 'source']).toLowerCase();
    const safeSources = new Set(['truck_profile', 'search', 'social', 'email', 'sms', 'direct', 'owner_outreach']);
    setHiddenValue(elements.acquisitionSource, safeSources.has(source)
      ? source
      : profile ? 'truck_profile' : 'claim_page');

    const directId = firstParam(params, ['selectedTruckId', 'id']);
    const profileId = profile ? clean(profile.searchParams.get('id')) : '';
    const truckId = isSafeTruckId(profileId) ? profileId : isSafeTruckId(directId) ? directId : '';
    trackEvent('claim_page_view', {truck_id: truckId || undefined}, window.location.pathname);
    prefillSearch();

    if (!truckId) {
      showSearch(state.requestedName ? `Looking for ${state.requestedName}…` : 'Search for your truck to begin.');
      if (state.requestedName) {
        await requestTruckSearch(state.requestedName, state.requestedCity, {autoSelect: true});
      }
      return;
    }

    setContextBusy(true);
    setFormEnabled(false);
    try {
      const truck = await resolveTruck(truckId);
      renderTruck(truck);
    } catch (error) {
      const requested = state.requestedName ? ` for ${state.requestedName}` : '';
      const message = clean(error.code) === 'invalid_truck'
        ? `We couldn’t find an available truck profile${requested}. Search for the correct truck.`
        : `We couldn’t load the selected truck${requested}. Search for it below or try again.`;
      showSearch(message, 'error');
      if (elements.recovery) elements.recovery.hidden = false;
      updateSupportLink(state.requestedName, state.requestedCity);
    }
  }

  function changeTruck() {
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    url.searchParams.delete('selectedTruckId');
    window.history.replaceState({}, '', url);
    showSearch('Search for the food truck you own.');
    prefillSearch();
    const queryField = elements.searchForm?.elements.namedItem('truckSearch');
    queryField?.focus({preventScroll: false});
  }

  function restartClaim() {
    state.continuationUrl = '';
    state.lastContact = null;
    showPanelState('contact');
    setFormEnabled(Boolean(state.truck));
    elements.email?.focus({preventScroll: false});
  }

  function trackFieldCompletion(name) {
    if (completedFields.has(name)) return;
    const value = name === 'ownerEmail' ? clean(elements.email?.value).toLowerCase() : clean(elements.phone?.value);
    const valid = name === 'ownerEmail' ? !emailError(value) : !phoneError(value);
    if (!valid) return;
    completedFields.add(name);
    trackEvent(name === 'ownerEmail' ? 'claim_email_completed' : 'claim_phone_completed');
  }

  function bindAppAnalytics() {
    elements.primaryApp?.addEventListener('click', () => trackEvent('claim_open_app_click'));
    elements.duplicateContinue?.addEventListener('click', () => trackEvent('claim_open_app_click'));
    elements.connectedOpen?.addEventListener('click', () => trackEvent('claim_open_app_click'));
    elements.appStore?.addEventListener('click', () => trackEvent('claim_app_store_click'));
    elements.playStore?.addEventListener('click', () => trackEvent('claim_play_store_click'));
  }

  function initialize() {
    if (!endpoint) return;
    if (elements.currentYear) elements.currentYear.textContent = String(new Date().getFullYear());
    if (elements.submitSpinner) elements.submitSpinner.hidden = true;
    applyExperiment();
    configureDeviceActions();
    showPanelState('contact');
    setFormEnabled(false);
    form.addEventListener('submit', submitClaim);
    form.addEventListener('focusin', notifyClaimStarted, {once: true});
    elements.email?.addEventListener('blur', () => trackFieldCompletion('ownerEmail'));
    elements.phone?.addEventListener('blur', () => trackFieldCompletion('ownerPhone'));
    elements.email?.addEventListener('input', () => setFieldError('ownerEmail', ''));
    elements.phone?.addEventListener('input', () => setFieldError('ownerPhone', ''));
    elements.searchForm?.addEventListener('submit', searchTrucks);
    elements.changeTruck?.addEventListener('click', changeTruck);
    elements.resend?.addEventListener('click', resendSetupLink);
    elements.restart?.addEventListener('click', restartClaim);
    bindAppAnalytics();
    initializeTruckContext();
  }

  initialize();
})();
