(function () {
  const form = document.querySelector('[data-claim-form]');
  if (!form) return;

  const endpoint = form.dataset.claimEndpoint || '';
  const fallbackEmail = form.dataset.fallbackEmail || 'Foodtruckfinderinfo@gmail.com';
  const searchButton = form.querySelector('[data-claim-search]');
  const searchStatus = form.querySelector('[data-claim-search-status]');
  const resultsBox = form.querySelector('[data-claim-results]');
  const selectedTruckInput = form.querySelector('[data-selected-truck-id]');
  const statusBox = form.querySelector('[data-claim-status]');
  const submitButton = form.querySelector('[data-claim-submit]');
  const emailFallback = form.querySelector('[data-claim-email-fallback]');

  function setStatus(node, message, tone) {
    if (!node) return;
    node.textContent = message;
    node.hidden = !message;
    node.classList.toggle('is-error', tone === 'error');
    node.classList.toggle('is-success', tone === 'success');
  }

  function formValue(name) {
    const field = form.elements.namedItem(name);
    return field && 'value' in field ? String(field.value || '').trim() : '';
  }

  function setFormValue(name, value) {
    const field = form.elements.namedItem(name);
    if (field && 'value' in field) {
      field.value = value || '';
    }
  }

  function absoluteProfileUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';

    try {
      return new URL(raw, window.location.origin).toString();
    } catch {
      return raw;
    }
  }

  function applyPrefillFromParams() {
    const params = new URLSearchParams(window.location.search);
    const truck = params.get('truck') || '';
    const city = params.get('city') || '';
    const profile = params.get('profile') || '';

    if (truck) {
      setFormValue('truckName', truck);
      setFormValue('truckSearch', truck);
    }
    if (city) {
      setFormValue('city', city);
      setFormValue('truckSearchCity', city);
    }
    if (profile) {
      setFormValue('truckProfileUrl', absoluteProfileUrl(profile));
    }

    if (truck || city || profile) {
      setStatus(searchStatus, 'We prefilled the claim form from the truck profile link.', 'success');
    }
  }

  function updateEmailFallback() {
    if (!emailFallback) return;

    const subject = 'Food Truck Finder Claim Request';
    const lines = [
      'Hi Food Truck Finder team,',
      '',
      'I would like to claim or create a food truck profile.',
      '',
      `Truck name: ${formValue('truckName')}`,
      `City or market: ${formValue('city')}`,
      `Owner name: ${formValue('ownerName')}`,
      `Email: ${formValue('ownerEmail')}`,
      `Phone: ${formValue('ownerPhone')}`,
      `Business email: ${formValue('businessEmail')}`,
      `Website/social proof: ${formValue('websiteOrSocialProof')}`,
      `Food Truck Finder profile URL: ${formValue('truckProfileUrl')}`,
      '',
      `Message: ${formValue('message')}`,
    ];

    emailFallback.href = `mailto:${encodeURIComponent(fallbackEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  }

  function renderResults(results) {
    if (!resultsBox) return;
    resultsBox.innerHTML = '';

    if (!results.length) {
      resultsBox.hidden = false;
      resultsBox.innerHTML = '<div class="claim-status">No matching truck profile found yet. Continue with a new claim request below.</div>';
      selectedTruckInput.value = '';
      return;
    }

    results.forEach((result) => {
      const label = document.createElement('label');
      label.className = 'claim-result';
      label.innerHTML = `
        <input type="radio" name="claimTruckResult" value="${escapeHtml(result.id || '')}">
        <span>
          <strong>${escapeHtml(result.name || 'Food truck')}</strong>
          <span>${escapeHtml(result.currentAddress || result.city || 'Location details pending')}</span>
          <span>${escapeHtml(result.claimStatus || 'unclaimed')}</span>
        </span>
      `;

      label.querySelector('input').addEventListener('change', () => {
        selectedTruckInput.value = result.id || '';
        setFormValue('truckName', result.name || '');
        setFormValue('city', result.city || '');
        setFormValue('truckProfileUrl', result.profileUrl || '');
        updateEmailFallback();
      });

      resultsBox.appendChild(label);
    });

    resultsBox.hidden = false;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  async function searchTrucks() {
    const query = formValue('truckSearch') || formValue('truckName');
    const city = formValue('truckSearchCity') || formValue('city');

    if (!query && !city) {
      setStatus(searchStatus, 'Enter a truck name or city before searching.', 'error');
      return;
    }

    setStatus(searchStatus, 'Searching truck profiles...', '');
    selectedTruckInput.value = '';

    try {
      const params = new URLSearchParams({ action: 'search' });
      if (query) params.set('q', query);
      if (city) params.set('city', city);

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Search failed.');
      }

      renderResults(payload.results || []);
      setStatus(
        searchStatus,
        payload.results && payload.results.length
          ? 'Select your truck below, or continue with a new claim if none are correct.'
          : 'No match found. You can still submit a new claim request.',
        'success'
      );
    } catch (error) {
      setStatus(searchStatus, 'Truck search is unavailable right now. You can still submit the form below.', 'error');
    }
  }

  function readProofFile() {
    const fileInput = form.elements.namedItem('proofFile');
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;

    if (!file) {
      return Promise.resolve(null);
    }

    if (file.size > 3 * 1024 * 1024) {
      return Promise.reject(new Error('Proof upload must be 3 MB or smaller.'));
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          fileName: file.name,
          contentType: file.type,
          data: String(reader.result || ''),
        });
      };
      reader.onerror = () => reject(new Error('Unable to read proof upload.'));
      reader.readAsDataURL(file);
    });
  }

  async function submitClaim(event) {
    event.preventDefault();
    updateEmailFallback();

    if (!form.reportValidity()) {
      return;
    }

    setStatus(statusBox, 'Submitting your claim request...', '');
    if (submitButton) submitButton.disabled = true;

    try {
      const proofFile = await readProofFile();
      const payload = {
        selectedTruckId: selectedTruckInput.value,
        truckName: formValue('truckName'),
        city: formValue('city'),
        ownerName: formValue('ownerName'),
        ownerEmail: formValue('ownerEmail'),
        ownerPhone: formValue('ownerPhone'),
        businessEmail: formValue('businessEmail'),
        websiteOrSocialProof: formValue('websiteOrSocialProof'),
        truckProfileUrl: formValue('truckProfileUrl'),
        message: formValue('message'),
        proofFile,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Claim submission failed.');
      }

      const params = new URLSearchParams({
        claim: result.claimRequestId || '',
        truck: payload.truckName,
      });
      window.location.href = `../claim-success/?${params.toString()}`;
    } catch (error) {
      setStatus(
        statusBox,
        `${error.message || 'Unable to submit claim right now.'} Use the Email Instead button if this keeps happening.`,
        'error'
      );
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  }

  searchButton?.addEventListener('click', searchTrucks);
  form.addEventListener('input', updateEmailFallback);
  form.addEventListener('submit', submitClaim);
  applyPrefillFromParams();
  updateEmailFallback();
})();
