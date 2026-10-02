import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { JSDOM } from "jsdom";
const root = fileURLToPath(new URL("../", import.meta.url));
const wait = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));
test("management tables and editing recover without duplicate mutations", async (t) => {
  const a = new JSDOM(fs.readFileSync(`${root}/admin/index.html`, "utf8"), {
    url: "http://localhost:4173/admin/#trucks",
    runScripts: "outside-only",
  });
  t.after(() => a.window.close());
  const aw = a.window;
  aw.CSS = { escape: (s) => s };
  aw.HTMLElement.prototype.scrollIntoView = function () {};
  aw.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  aw.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  const users = Array.from({ length: 123 }, (_, i) => ({
    id: `owner-${i}`,
    name: `Owner ${String(i).padStart(3, "0")}`,
    email: `owner${i}@example.invalid`,
    userType: "Owner",
  }));
  const trucks = Array.from({ length: 137 }, (_, i) => ({
    id: `truck-${i}`,
    name: `Truck ${String(i).padStart(3, "0")}`,
    city: i % 2 ? "Arlington" : "Rockville",
    claimed: i % 2 === 0,
  }));
  let signedOut,
    failSnapshot = false,
    created = 0,
    updateCalls = 0,
    uploadCalls = 0,
    loginCalls = 0,
    resolveCreate;
  const data = {
    admin: { email: "qa@example.invalid" },
    loadedAt: new Date().toISOString(),
    users,
    trucks,
    events: [],
  };
  const auth = {
    currentUser: { uid: "qa", email: "qa@example.invalid" },
    onAuthStateChanged: (cb) => {
      signedOut = cb;
    },
    signInWithEmailAndPassword: async () => {
      loginCalls++;
      await wait(30);
    },
    signOut: async () => {
      auth.currentUser = null;
      await signedOut(null);
    },
  };
  aw.firebase = {
    initializeApp() {},
    auth: () => auth,
    app: () => ({
      functions: () => ({
        httpsCallable: (name) => async (payload) => {
          if (name === "getManagementConsoleSnapshot") {
            if (failSnapshot) throw new Error("Network down");
            return { data };
          }
          if (name === "createManagementConsoleRecord") {
            created++;
            await new Promise((resolve) => (resolveCreate = resolve));
            return { data: { id: "created-once" } };
          }
          if (name === "updateManagementConsoleRecord") {
            updateCalls++;
            return { data: {} };
          }
          if (name === "uploadManagementConsoleMedia") {
            uploadCalls++;
            throw new Error("Upload interrupted");
          }
          throw new Error(`Unexpected mutation ${name}`);
        },
      }),
    }),
  };
  vm.runInContext(
    fs.readFileSync(`${root}/assets/management-console.js`, "utf8") +
      "\nwindow.qa={state,loadSnapshot,renderAll,saveSelectedRecord};",
    a.getInternalVMContext(),
  );
  await aw.qa.loadSnapshot();
  assert.equal(
    aw.document
      .querySelector("[data-tab=trucks]")
      .getAttribute("aria-selected"),
    "true",
  );
  assert.equal(aw.document.querySelectorAll("[data-table-body] tr").length, 50);
  aw.document.querySelector("[data-next-page]").click();
  assert.match(
    aw.document.querySelector("[data-page-summary]").textContent,
    /Rows 51–100 of 137/,
  );
  const search = aw.document.querySelector("[data-search]");
  search.value = "Truck 136";
  search.dispatchEvent(new aw.Event("input"));
  await wait();
  assert.equal(aw.document.querySelectorAll("[data-table-body] tr").length, 1);
  assert.equal(aw.document.querySelector("[data-pagination]").hidden, true);
  aw.document.querySelector("[data-clear-search]").click();
  assert.equal(aw.document.querySelectorAll("[data-table-body] tr").length, 50);
  assert.equal(aw.document.activeElement, search);
  const tab = aw.document.querySelector("[data-tab=trucks]");
  tab.focus();
  tab.dispatchEvent(new aw.KeyboardEvent("keydown", { key: "ArrowRight" }));
  assert.equal(aw.document.activeElement.dataset.tab, "owners");
  assert.equal(aw.location.hash, "#owners");
  const sort = aw.document.querySelector("[data-sort-column=Owner]");
  sort.focus();
  sort.click();
  assert.equal(aw.document.activeElement.dataset.sortColumn, "Owner");
  failSnapshot = true;
  await aw.qa.loadSnapshot();
  assert.equal(aw.document.querySelector("[data-console-app]").hidden, false);
  assert.match(
    aw.document.querySelector("[data-session-summary]").textContent,
    /previously loaded/,
  );
  failSnapshot = false;
  await aw.qa.loadSnapshot();
  assert.equal(
    aw.document.querySelector("[data-session-summary]").style.color,
    "",
  );
  const fields = aw.document.querySelector("[data-record-fields]");
  fields.innerHTML =
    '<input data-field="name" data-type="text" value="New truck"><input type="file" data-media-type="truckImage">';
  const fileInput = fields.querySelector("[type=file]");
  Object.defineProperty(fileInput, "files", {
    configurable: true,
    value: [new aw.File(["small image"], "truck.jpg", { type: "image/jpeg" })],
  });
  aw.qa.state.selected = {
    collection: "foodTrucks",
    mode: "create",
    record: {},
    id: "",
  };
  const save = aw.qa.saveSelectedRecord();
  await aw.qa.saveSelectedRecord();
  assert.equal(created, 1);
  assert.equal(
    aw.document.querySelector("[data-record-form]").getAttribute("aria-busy"),
    "true",
  );
  resolveCreate();
  await save;
  assert.equal(aw.qa.state.selected.id, "created-once");
  assert.equal(aw.qa.state.selected.mode, "edit");
  assert.equal(aw.qa.state.savingRecord, false);
  await aw.qa.saveSelectedRecord();
  assert.equal(created, 1);
  assert.equal(updateCalls, 1);
  assert.equal(uploadCalls, 2);
  // Oversized uploads fail before any record mutation.
  Object.defineProperty(fileInput, "files", {
    value: [{ name: "huge.jpg", size: 6 * 1024 * 1024 }],
  });
  await aw.qa.saveSelectedRecord();
  assert.equal(updateCalls, 1);
  assert.match(
    aw.document.querySelector("[data-record-message]").textContent,
    /smaller image/,
  );
  const login = aw.document.querySelector("[data-login-form]");
  login.dispatchEvent(new aw.Event("submit", { cancelable: true }));
  login.dispatchEvent(new aw.Event("submit", { cancelable: true }));
  await wait();
  assert.equal(loginCalls, 1);
  await auth.signOut();
  assert.equal(aw.document.querySelector("[data-table-body]").textContent, "");
  assert.equal(aw.qa.state.trucks.length, 0);
});
