(function () {
  'use strict';

  const tokenPattern = /^[A-Za-z0-9_-]{40,128}$/;
  const params = new URLSearchParams(window.location.search);
  const token = String(params.get('token') || '').trim();
  const canonicalContinuationUrl = new URL(window.location.pathname, window.location.origin);
  if (tokenPattern.test(token)) canonicalContinuationUrl.searchParams.set('token', token);
  const ready = document.querySelector('[data-continuation-ready]');
  const error = document.querySelector('[data-continuation-error]');
  const errorHeading = document.querySelector('[data-continuation-error-heading]');
  const openButton = document.querySelector('[data-continuation-open]');
  const status = document.querySelector('[data-continuation-status]');
  const qrRegion = document.querySelector('[data-continuation-qr]');
  const qrImage = document.querySelector('[data-continuation-qr-image]');
  const appStore = document.querySelector('[data-continuation-app-store]');
  const playStore = document.querySelector('[data-continuation-play-store]');
  const currentYear = document.querySelector('[data-current-year]');

  function trackEvent(name) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, {handoff_surface: 'claim_continuation'});
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({event: name, handoff_surface: 'claim_continuation'});
    }
    window.dispatchEvent(new CustomEvent('ftf:analytics', {
      detail: {event: name, handoff_surface: 'claim_continuation'},
    }));
  }

  function deviceContext() {
    const userAgent = navigator.userAgent || '';
    const ipad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const ios = /iPhone|iPad|iPod/i.test(userAgent) || ipad;
    const android = /Android/i.test(userAgent);
    return {ios, android, mobile: ios || android || /Mobile/i.test(userAgent)};
  }

  function loadQrLibrary() {
    if (typeof window.qrcode === 'function') return Promise.resolve(window.qrcode);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('../../assets/vendor/qrcode-generator-1.4.4.min.js', window.location.href).toString();
      script.referrerPolicy = 'no-referrer';
      script.onload = () => typeof window.qrcode === 'function'
        ? resolve(window.qrcode)
        : reject(new Error('QR generator unavailable'));
      script.onerror = () => reject(new Error('QR generator unavailable'));
      document.head.appendChild(script);
    });
  }

  async function renderQr() {
    if (!qrRegion || !qrImage || deviceContext().mobile) return;
    try {
      const factory = await loadQrLibrary();
      const code = factory(0, 'M');
      code.addData(canonicalContinuationUrl.toString());
      code.make();
      qrImage.src = code.createDataURL(6, 8);
      qrImage.alt = 'QR code to continue this Food Truck Finder claim on a phone';
      qrRegion.hidden = false;
    } catch {
      qrRegion.hidden = true;
    }
  }

  function showError() {
    if (ready) ready.hidden = true;
    if (error) error.hidden = false;
    window.requestAnimationFrame(() => errorHeading?.focus());
  }

  function initialize() {
    if (currentYear) currentYear.textContent = String(new Date().getFullYear());
    if (!tokenPattern.test(token)) {
      showError();
      return;
    }

    const device = deviceContext();
    if (ready) ready.hidden = false;
    if (error) error.hidden = true;
    if (appStore) appStore.hidden = device.android;
    if (playStore) playStore.hidden = device.ios;
    if (openButton) {
      openButton.hidden = !device.mobile;
      const query = new URLSearchParams({token});
      openButton.href = `foodtruckfinder:///claim/continue?${query.toString()}`;
      openButton.addEventListener('click', () => {
        trackEvent('claim_open_app_click');
        if (status) {
          status.textContent = 'Opening Food Truck Finder. If nothing happens, install the app with a store button below.';
        }
      });
    }
    if (status && !device.mobile) {
      status.textContent = 'Scan the QR code with your phone, or use a store button below.';
    }
    appStore?.addEventListener('click', () => trackEvent('claim_app_store_click'));
    playStore?.addEventListener('click', () => trackEvent('claim_play_store_click'));
    trackEvent('claim_app_cta_view');
    renderQr();
  }

  initialize();
})();
