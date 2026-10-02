import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {JSDOM} from 'jsdom';
const html = fs.readFileSync(new URL('../admin/index.html', import.meta.url), 'utf8');
const source = fs.readFileSync(new URL('../assets/management-console.js', import.meta.url), 'utf8');

async function setup(t, {hash = '', refreshFails = false, snapshot, services = {}, optimize, readUpload, seed = async () => ({data: {id: 'new-truck', name: 'River Tacos', menuItemCount: 3}})} = {}) {
  const dom = new JSDOM(html, {url: `https://example.invalid/admin/${hash}`, runScripts: 'outside-only'});
  t.after(() => dom.window.close());
  const w = dom.window;
  w.CSS = {escape: (value) => value};
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.HTMLDialogElement.prototype.showModal = function () {this.setAttribute('open', '');};
  w.HTMLDialogElement.prototype.close = function () {this.removeAttribute('open');};
  const calls = {seed: [], mutations: [], optimized: 0, revoked: [], snapshot: 0};
  let authChanged;
  const auth = {currentUser: {uid: 'admin', email: 'admin@example.invalid'}, onAuthStateChanged(fn) {authChanged = fn;}};
  w.URL.createObjectURL = () => `blob:preview-${Math.random()}`;
  w.URL.revokeObjectURL = (url) => calls.revoked.push(url);
  w.alert = () => {throw new Error('Unexpected blocking alert');};
  w.firebase = {
    initializeApp() {}, auth: () => auth,
    app: () => ({functions: () => ({httpsCallable: (name) => async (payload) => {
      if (name === 'getManagementConsoleSnapshot') {
        calls.snapshot++;
        if (refreshFails && calls.snapshot > 1) throw new Error('Snapshot unavailable');
        if (snapshot) return snapshot(calls.snapshot, auth.currentUser?.uid);
        return {data: {users: [], trucks: [], events: [], loadedAt: '2026-10-02T18:00:00Z'}};
      }
      if (name === 'seedManagementConsoleTruck') {calls.seed.push(payload); return seed(payload);}
      if (services[name]) {
        calls.mutations.push({name, payload, userId: auth.currentUser?.uid});
        return services[name](payload);
      }
      throw new Error(`Unexpected service call ${name}`);
    }})}),
  };
  vm.runInContext(source + '\nwindow.qa={state,loadSnapshot,seedTruckFromForm,openSeedTruckDialog,closeSeedTruckDialog,saveSelectedRecord};\nbuildSeedImagePayload=async(file)=>{await window.optimized(); return {dataUrl:"data:image/jpeg;base64,eA==",fileName:file.name,contentType:"image/jpeg"};};', dom.getInternalVMContext());
  w.optimized = () => {calls.optimized++; return optimize?.(calls.optimized);};
  if (readUpload) {
    w.readUpload = readUpload;
    vm.runInContext('readFileAsDataUrl = (file) => window.readUpload(file);', dom.getInternalVMContext());
  }
  await w.qa.loadSnapshot();
  const get = (selector) => w.document.querySelector(selector);
  const form = get('[data-seed-form]');
  function files(name, values) {
    const input = form.elements.namedItem(name);
    Object.defineProperty(input, 'files', {configurable: true, value: values});
    // JSDOM cannot populate the native FileList/value together. The production
    // submit handler separately verifies required files before reportValidity.
    input.required = false;
    input.dispatchEvent(new w.Event('change', {bubbles: true}));
    return input;
  }
  function fill() {
    form.elements.namedItem('name').value = ' River Tacos ';
    form.elements.namedItem('address').value = ' 100 Main St, Baltimore, MD ';
    files('truckImage', [new w.File(['image'], 'truck.jpg', {type: 'image/jpeg'})]);
    files('menuImages', [new w.File(['menu'], 'menu.png', {type: 'image/png'})]);
    form.dispatchEvent(new w.Event('input', {bubbles: true}));
  }
  return {w, get, form, calls, files, fill, auth, authChanged};
}

test('opens trucks by default, keeps keyboard tabs and makes photo upload available from every section', async (t) => {
  const {w, get} = await setup(t);
  assert.equal(get('[data-tab=trucks]').getAttribute('aria-selected'), 'true');
  assert.equal(get('.console-overview').open, false);
  get('[data-tab=owners]').click();
  assert.equal(w.location.hash, '#owners');
  get('[data-add-truck]').click();
  assert.equal(get('[data-seed-dialog]').open, true);
  assert.equal(w.document.activeElement.name, 'name');
  assert.equal(get('.seed-optional').open, false);
  w.qa.closeSeedTruckDialog();
  const owners = get('[data-tab=owners]');
  owners.dispatchEvent(new w.KeyboardEvent('keydown', {key: 'ArrowLeft'}));
  assert.equal(w.document.activeElement.dataset.tab, 'trucks');
  assert.equal(w.location.hash, '#trucks');
});

test('previews images, validates type/size/count before uploads, and preserves a closed draft', async (t) => {
  const {w, get, form, files, fill, calls} = await setup(t);
  get('[data-add-truck]').click();
  fill();
  assert.equal(get('[data-seed-preview=truckImage] img').alt, 'Selected truck photo');
  assert.equal(form.querySelectorAll('[data-seed-check].is-complete').length, 4);
  w.qa.closeSeedTruckDialog();
  get('[data-add-truck]').click();
  assert.equal(form.elements.namedItem('name').value, ' River Tacos ');
  assert.equal(form.elements.namedItem('truckImage').files.length, 1);
  assert.ok(calls.revoked.length > 0);
  files('truckImage', [new w.File(['bad'], 'wrong.gif', {type: 'image/gif'})]);
  await w.qa.seedTruckFromForm();
  assert.match(get('[data-seed-file-error=truckImage]').textContent, /JPG, PNG or WebP/);
  assert.equal(calls.seed.length, 0);
  assert.equal(calls.optimized, 0);
  const huge = new w.File(['x'], 'large.jpg', {type: 'image/jpeg'});
  Object.defineProperty(huge, 'size', {value: 6 * 1024 * 1024});
  files('truckImage', [huge]);
  await w.qa.seedTruckFromForm();
  assert.match(get('[data-seed-message]').textContent, /larger than 5 MB/);
  fill();
  files('menuImages', Array.from({length: 4}, () => new w.File(['menu'], 'menu.png', {type: 'image/png'})));
  await w.qa.seedTruckFromForm();
  assert.equal(calls.seed.length, 0);
  assert.match(get('[data-seed-file-error=menuImages]').textContent, /up to three/);
});

test('blocks duplicate submission and dismissal, retains failed data, and allows a corrected retry', async (t) => {
  let reject;
  let attempt = 0;
  const {w, get, fill, form, calls} = await setup(t, {seed: () => {
    if (++attempt === 1) return new Promise((_resolve, fail) => {reject = fail;});
    return {data: {id: 'created-once', name: 'River Tacos', menuItemCount: 3}};
  }});
  get('[data-add-truck]').click(); fill();
  const saving = w.qa.seedTruckFromForm();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await w.qa.seedTruckFromForm();
  assert.equal(calls.seed.length, 1);
  assert.equal(form.getAttribute('aria-busy'), 'true');
  w.qa.closeSeedTruckDialog();
  assert.equal(get('[data-seed-dialog]').open, true);
  const cancel = new w.Event('cancel', {cancelable: true});
  get('[data-seed-dialog]').dispatchEvent(cancel);
  assert.equal(cancel.defaultPrevented, true);
  reject(new Error('Address could not be found.'));
  await saving;
  assert.equal(form.elements.namedItem('name').value, ' River Tacos ');
  assert.equal(form.elements.namedItem('truckImage').files.length, 1);
  assert.match(get('[data-seed-message]').textContent, /details and photos are still here/);
  await w.qa.seedTruckFromForm();
  assert.equal(calls.seed.length, 2);
  assert.equal(get('[data-seed-success]').hidden, false);
  assert.equal(get('[data-seed-fields]').hidden, true);
  assert.match(get('[data-seed-profile]').href, /id=created-once/);
  assert.equal(w.document.activeElement, get('[data-seed-success]'));
  assert.equal(calls.seed[1].name, 'River Tacos');
  assert.equal(calls.seed[1].address, '100 Main St, Baltimore, MD');
  assert.equal(calls.seed[1].menuImages.length, 1);
  await w.qa.seedTruckFromForm();
  assert.equal(calls.seed.length, 2);
  get('[data-seed-another]').click();
  assert.equal(form.elements.namedItem('name').value, '');
  assert.equal(get('[data-seed-success]').hidden, true);
  assert.equal(get('[data-seed-fields]').hidden, false);
});

for (const [name, value] of [['websiteUrl', 'not-a-url'], ['ownerEmail', 'not-an-email']]) {
  test(`opens optional details when invalid ${name} needs correction`, async (t) => {
    const {w, get, fill, form, calls} = await setup(t);
    get('[data-add-truck]').click(); fill();
    const input = form.elements.namedItem(name);
    input.value = value;
    assert.equal(input.closest('details').open, false);
    await w.qa.seedTruckFromForm();
    assert.equal(input.closest('details').open, true);
    assert.equal(calls.seed.length, 0);
  });
}

test('keeps confirmed success when the table refresh fails and does not seed again', async (t) => {
  const {w, get, fill, calls} = await setup(t, {refreshFails: true});
  get('[data-add-truck]').click(); fill();
  await w.qa.seedTruckFromForm();
  assert.equal(calls.seed.length, 1);
  assert.equal(get('[data-seed-success]').hidden, false);
  assert.equal(get('[data-seed-fields]').hidden, true);
  assert.match(get('[data-seed-result]').textContent, /River Tacos was added/);
  assert.match(get('[data-session-summary]').textContent, /Refresh failed/);
  assert.equal(get('[data-seed-message]').textContent, '');
  await w.qa.seedTruckFromForm();
  assert.equal(calls.seed.length, 1);
});

test('clears the private draft on sign-out and ignores results from an old account', async (t) => {
  let resolve;
  const {w, get, fill, form, calls, auth, authChanged} = await setup(t, {seed: () => new Promise((done) => {resolve = done;})});
  get('[data-add-truck]').click(); fill();
  const saving = w.qa.seedTruckFromForm();
  await new Promise((done) => setTimeout(done, 0));
  assert.equal(calls.seed.length, 1);
  auth.currentUser = null;
  await authChanged(null);
  resolve({data: {id: 'old-account-truck', name: 'Old truck'}});
  await saving;
  assert.equal(form.elements.namedItem('name').value, '');
  assert.equal(get('[data-seed-success]').hidden, true);
  assert.equal(get('[data-seed-profile]').hasAttribute('href'), false);
  assert.equal(get('[data-console-app]').hidden, true);
});

function deferred() {
  let resolve;
  const promise = new Promise((done) => {resolve = done;});
  return {promise, resolve};
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const snapshotData = (name) => ({data: {users: [], events: [], trucks: [{id: name, name}], loadedAt: '2026-10-02T18:00:00Z'}});

test('refreshes after a mutation even when an older snapshot is pending, and ignores that older response', async (t) => {
  const oldRead = deferred();
  const {w, get, fill, calls} = await setup(t, {snapshot: (request) => request === 2 ? oldRead.promise : snapshotData(request === 1 ? 'Before save' : 'River Tacos')});
  const refreshing = w.qa.loadSnapshot();
  get('[data-add-truck]').click(); fill();
  await w.qa.seedTruckFromForm();
  assert.equal(calls.snapshot, 3);
  assert.equal(w.qa.state.trucks[0].name, 'River Tacos');
  assert.equal(get('[data-refresh]').disabled, false);
  oldRead.resolve(snapshotData('Stale truck'));
  await refreshing;
  assert.equal(w.qa.state.trucks[0].name, 'River Tacos');
  assert.match(get('[data-table-body]').textContent, /River Tacos/);
});

test('clears all prior account data before a direct account change whose snapshot is denied', async (t) => {
  const staleRead = deferred();
  const {w, get, fill, form, auth, authChanged} = await setup(t, {snapshot: (request, uid) => {
    if (uid === 'denied-admin') throw new Error('Access denied');
    return request === 2 ? staleRead.promise : snapshotData('Private truck');
  }});
  const refreshing = w.qa.loadSnapshot();
  get('[data-add-truck]').click(); fill();
  auth.currentUser = {uid: 'denied-admin', email: 'denied@example.invalid'};
  await authChanged(auth.currentUser);
  assert.equal(w.qa.state.trucks.length, 0);
  assert.equal(w.qa.state.loadedAt, '');
  assert.equal(w.qa.state.admin, null);
  assert.equal(get('[data-table-body]').textContent, '');
  assert.equal(get('[data-console-app]').hidden, true);
  assert.equal(get('[data-seed-dialog]').open, false);
  assert.equal(form.elements.namedItem('name').value, '');
  assert.match(get('[data-auth-message]').textContent, /Access denied/);
  assert.doesNotMatch(get('[data-session-summary]').textContent, /previously loaded/);
  staleRead.resolve(snapshotData('Private stale truck'));
  await refreshing;
  assert.equal(w.qa.state.trucks.length, 0);
  assert.equal(get('[data-console-app]').hidden, true);
});

for (const checkpoint of ['create', 'update', 'file read', 'upload']) {
  test(`manual save stops at ${checkpoint} after sign-out and same-account re-login`, async (t) => {
    const pending = deferred();
    const reached = deferred();
    const pause = () => {reached.resolve(); return pending.promise;};
    const {w, get, calls, auth, authChanged} = await setup(t, {
      services: {
        createManagementConsoleRecord: () => checkpoint === 'create' ? pause() : {data: {id: 'old-created-truck'}},
        updateManagementConsoleRecord: () => checkpoint === 'update' ? pause() : {data: {}},
        uploadManagementConsoleMedia: () => checkpoint === 'upload' ? pause() : {data: {}},
      },
      readUpload: () => checkpoint === 'file read' ? pause() : 'data:image/jpeg;base64,eA==',
    });
    const fields = get('[data-record-fields]');
    fields.innerHTML = '<input data-field="name" data-type="text" value="Old truck"><input type="file" data-media-type="menuImage">';
    Object.defineProperty(fields.querySelector('[type=file]'), 'files', {value: [
      new w.File(['old photo'], 'old-1.jpg', {type: 'image/jpeg'}),
      new w.File(['old photo'], 'old-2.jpg', {type: 'image/jpeg'}),
    ]});
    w.qa.state.selected = {collection: 'foodTrucks', id: 'old-truck', mode: checkpoint === 'create' ? 'create' : 'edit', record: {}};
    const saving = w.qa.saveSelectedRecord();
    await reached.promise;
    const sentBeforeChange = calls.mutations.length;
    auth.currentUser = null;
    await authChanged(null);
    auth.currentUser = {uid: 'admin', email: 'admin@example.invalid'};
    await authChanged(auth.currentUser);
    const newSelection = {collection: 'events', id: 'new-session-event', record: {}};
    w.qa.state.selected = newSelection;
    fields.innerHTML = '<input data-field="name" data-type="text" value="New session event">';
    get('[data-record-message]').textContent = 'New session draft';
    pending.resolve(checkpoint === 'file read' ? 'data:image/jpeg;base64,eA==' : {data: {id: 'old-created-truck'}});
    await saving;
    assert.equal(calls.mutations.length, sentBeforeChange, 'must not continue old uploads under the new session');
    assert.equal(w.qa.state.selected, newSelection);
    assert.equal(newSelection.id, 'new-session-event');
    assert.equal(get('[data-record-message]').textContent, 'New session draft');
    assert.equal(get('[data-record-form]').hasAttribute('aria-busy'), false);
    assert.equal(w.qa.state.savingRecord, false);
  });
}

test('an old seed response cannot alter a new seed operation after same-account re-login', async (t) => {
  const first = deferred();
  const second = deferred();
  let attempts = 0;
  const {w, get, fill, form, auth, authChanged} = await setup(t, {seed: () => ++attempts === 1 ? first.promise : second.promise});
  get('[data-add-truck]').click(); fill();
  const firstSave = w.qa.seedTruckFromForm();
  await tick();
  auth.currentUser = null;
  await authChanged(null);
  auth.currentUser = {uid: 'admin', email: 'admin@example.invalid'};
  await authChanged(auth.currentUser);
  get('[data-add-truck]').click(); fill();
  const secondSave = w.qa.seedTruckFromForm();
  await tick();
  first.resolve({data: {id: 'old-truck', name: 'Old private truck'}});
  await firstSave;
  assert.equal(w.qa.state.seedResult, null);
  assert.equal(w.qa.state.seedingTruck, true);
  assert.equal(form.getAttribute('aria-busy'), 'true');
  assert.equal(form.querySelector('[type=submit]').disabled, true);
  assert.equal(get('[data-seed-success]').hidden, true);
  second.resolve({data: {id: 'new-truck', name: 'New truck'}});
  await secondSave;
  assert.equal(w.qa.state.seedResult.id, 'new-truck');
  assert.equal(form.hasAttribute('aria-busy'), false);
});

test('image optimization from an ended session never submits a seed after same-account re-login', async (t) => {
  const image = deferred();
  const {w, get, fill, calls, auth, authChanged} = await setup(t, {optimize: () => image.promise});
  get('[data-add-truck]').click(); fill();
  const saving = w.qa.seedTruckFromForm();
  await tick();
  auth.currentUser = null;
  await authChanged(null);
  auth.currentUser = {uid: 'admin', email: 'admin@example.invalid'};
  await authChanged(auth.currentUser);
  image.resolve();
  await saving;
  assert.equal(calls.seed.length, 0);
  assert.equal(get('[data-seed-message]').textContent, '');
});
