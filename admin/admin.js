/* =====================================================================
   Colorado Foxes — Admin app
   Plain JavaScript + Supabase. Data lives in the `registrations` table
   (see supabase/schema.sql). Everything is rendered from `state.rows`.
   ===================================================================== */
(() => {
"use strict";

/* =====================================================================
   ===== EDIT YOUR ADMIN SETTINGS HERE =====
   ===================================================================== */
const SETTINGS = {
  // Uniform sizes in the order you want them listed / printed
  sizes: ["Extra Small", "Small", "Medium", "Large", "Extra Large"],
  sizeShort: { "Extra Small": "XS", "Small": "S", "Medium": "M", "Large": "L", "Extra Large": "XL" },

  // Age groups (age is calculated from date of birth as of today)
  ageGroups: [
    { label: "Ages 3–5",   min: 0,  max: 5 },
    { label: "Ages 6–8",   min: 6,  max: 8 },
    { label: "Ages 9–10",  min: 9,  max: 10 },
    { label: "Ages 11–13", min: 11, max: 13 },
    { label: "Ages 14–17", min: 14, max: 17 },
    { label: "Adults 18+", min: 18, max: 200 }
  ],

  positions: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
  experienceLevels: ["Recreational / Adult League", "High School", "Club / Academy", "College", "Semi-Pro", "Professional"],

  // Labels for registration types (new types added in Supabase show up automatically)
  kinds: {
    youth:  { label: "Youth Programs",   short: "Youth",  icon: "users" },
    tryout: { label: "Pro Team Tryouts", short: "Tryout", icon: "trophy" }
  }
};

const PAYMENT = {
  pending:  { label: "Unpaid",   tone: "warn" },
  paid:     { label: "Paid",     tone: "good" },
  waived:   { label: "Waived",   tone: "info" },
  refunded: { label: "Refunded", tone: "muted" }
};
const GEAR = {
  not_started:   { label: "Not started",   tone: "muted" },
  in_production: { label: "In production", tone: "info" },
  ready:         { label: "Ready",         tone: "good" },
  handed_out:    { label: "Handed out",    tone: "done" }
};
/* ===== END SETTINGS ===== */


/* ---------------------------------------------------------------------
   Icons
   --------------------------------------------------------------------- */
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3"/><path d="M7 5H4v2a3 3 0 0 0 3 3"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  shirt: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  dollar: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  chev: '<polyline points="6 9 12 15 18 9"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  sparkle: '<path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/>'
};
const icon = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;


/* ---------------------------------------------------------------------
   Small helpers
   --------------------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const show = (el, on = true) => { el.hidden = !on; };
const uniq = (arr) => [...new Set(arr)];

function parseDate(d) {
  if (!d) return null;
  const [y, m, day] = String(d).slice(0, 10).split("-").map(Number);
  return y ? new Date(y, (m || 1) - 1, day || 1) : null;
}
function ageOf(dob) {
  const b = parseDate(dob);
  if (!b) return null;
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) a--;
  return a >= 0 && a < 120 ? a : null;
}
function ageGroupOf(age) {
  if (age == null) return null;
  const g = SETTINGS.ageGroups.find(g => age >= g.min && age <= g.max);
  return g ? g.label : null;
}
const fmtDate = (d) => { const x = parseDate(d); return x ? x.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"; };
const fmtDateTime = (d) => d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
function timeAgo(d) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 86400 * 7) return Math.floor(s / 86400) + "d ago";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
const initials = (name) => String(name || "?").trim().split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase() || "?";
const kindMeta = (k) => SETTINGS.kinds[k] || { label: (state.kinds.find(x => x.key === k) || {}).label || k, short: (state.kinds.find(x => x.key === k) || {}).label || k, icon: "tag" };
const sizeShort = (s) => SETTINGS.sizeShort[s] || s;
const pill = (map, key) => { const m = map[key] || { label: key || "—", tone: "muted" }; return `<span class="pill ${m.tone}">${esc(m.label)}</span>`; };

function toast(msg, type = "ok") {
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML = `<i></i><span>${esc(msg)}</span>`;
  $("#toasts").appendChild(el);
  setTimeout(() => { el.style.transition = "opacity .3s"; el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 3200);
}


/* ---------------------------------------------------------------------
   State
   --------------------------------------------------------------------- */
const state = {
  user: null,
  rows: [],
  kinds: [],
  loading: true,
  route: "dashboard",
  search: "",
  views: {},              // per-view UI settings
  selected: new Set(),
  realtime: null
};

// Calculated fields used for grouping/filtering
function derive(r) {
  r._age = ageOf(r.date_of_birth);
  r._ageGroup = ageGroupOf(r._age);
  r._birthYear = r.date_of_birth ? Number(String(r.date_of_birth).slice(0, 4)) : null;
  r._team = [r.program, r.location].filter(Boolean).join(" · ");
  return r;
}


/* ---------------------------------------------------------------------
   Groupings — used for "Group by" AND filters
   --------------------------------------------------------------------- */
const LAST = (v) => /^(no |unknown|age unknown|unassigned)/i.test(v);
const GROUPERS = {
  ageGroup:   { label: "Age group",  get: r => r._ageGroup || "Age unknown", order: () => SETTINGS.ageGroups.map(g => g.label) },
  age:        { label: "Exact age",  get: r => r._age != null ? "Age " + r._age : "Age unknown", numeric: true },
  birthYear:  { label: "Birth year", get: r => r._birthYear ? String(r._birthYear) : "Unknown", numeric: true },
  team:       { label: "Team (program + location)", get: r => r._team || "Unassigned" },
  program:    { label: "Program",    get: r => r.program || "No program" },
  location:   { label: "Location",   get: r => r.location || "No location" },
  size:       { label: "Uniform size", get: r => r.uniform_size || "No size", order: () => SETTINGS.sizes },
  position:   { label: "Position",   get: r => r.position || "No position", order: () => SETTINGS.positions },
  experience: { label: "Experience", get: r => r.experience_level || "Unknown", order: () => SETTINGS.experienceLevels },
  payment:    { label: "Payment",    get: r => (PAYMENT[r.payment_status] || {}).label || r.payment_status, order: () => Object.values(PAYMENT).map(p => p.label) },
  gear:       { label: "Gear status", get: r => (GEAR[r.gear_status] || {}).label || r.gear_status, order: () => Object.values(GEAR).map(g => g.label) },
  kind:       { label: "Type",       get: r => kindMeta(r.kind).label },
  source:     { label: "Source",     get: r => r.source || "Unknown" },
  season:     { label: "Season",     get: r => r.season || "No season" },
  none:       { label: "No grouping", get: () => "All registrations" }
};

function sortGroupKeys(keys, gk) {
  const g = GROUPERS[gk];
  const order = g.order ? g.order() : null;
  return keys.sort((a, b) => {
    if (LAST(a) !== LAST(b)) return LAST(a) ? 1 : -1;
    if (order) {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    }
    if (g.numeric) return (parseInt(a.replace(/\D/g, "")) || 0) - (parseInt(b.replace(/\D/g, "")) || 0);
    return a.localeCompare(b);
  });
}
function groupRows(rows, gk) {
  const map = new Map();
  rows.forEach(r => {
    const k = GROUPERS[gk].get(r);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  });
  return sortGroupKeys([...map.keys()], gk).map(k => [k, map.get(k)]);
}
function optionsFor(rows, gk) {
  const counts = {};
  rows.forEach(r => { const k = GROUPERS[gk].get(r); counts[k] = (counts[k] || 0) + 1; });
  return sortGroupKeys(Object.keys(counts), gk).map(k => ({ value: k, count: counts[k] }));
}

const SORTS = {
  name:   { label: "Name A–Z",       fn: (a, b) => a.player_name.localeCompare(b.player_name) },
  newest: { label: "Newest first",   fn: (a, b) => new Date(b.created_at) - new Date(a.created_at) },
  oldest: { label: "Oldest first",   fn: (a, b) => new Date(a.created_at) - new Date(b.created_at) },
  young:  { label: "Youngest first", fn: (a, b) => (b.date_of_birth || "").localeCompare(a.date_of_birth || "") },
  jersey: { label: "Jersey #",       fn: (a, b) => (parseInt(a.jersey_number) || 999) - (parseInt(b.jersey_number) || 999) }
};


/* ---------------------------------------------------------------------
   Table columns
   --------------------------------------------------------------------- */
const COLS = {
  player: { label: "Player", cls: "td-player", html: r => {
    const sub = r._age != null ? `Age ${r._age} · ${fmtDate(r.date_of_birth)}` : (r.season || kindMeta(r.kind).short);
    return `<div class="cell-player"><div class="r-avatar">${esc(initials(r.player_name))}</div><div><b>${esc(r.player_name)}</b><small>${esc(sub)}</small></div></div>`;
  } },
  age:        { label: "Age", html: r => r._age != null ? `<span class="num">${r._age}</span>` : "—" },
  program:    { label: "Program", html: r => esc(r.program || "—") },
  location:   { label: "Location", html: r => esc(r.location || "—") },
  team:       { label: "Team", html: r => esc(r._team || "—") },
  size:       { label: "Size", html: r => r.uniform_size ? `<span class="size-badge" title="${esc(r.uniform_size)}">${esc(sizeShort(r.uniform_size))}</span>` : "—" },
  guardian:   { label: "Parent / Guardian", short: "Parent", html: r => esc(r.guardian_name || "—") },
  contact:    { label: "Contact", html: r => `<div class="cell-contact">${r.email ? `<div><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></div>` : ""}${r.phone ? `<div><a href="tel:${esc(r.phone)}">${esc(r.phone)}</a></div>` : ""}${!r.email && !r.phone ? "—" : ""}</div>` },
  position:   { label: "Position", html: r => esc(r.position || "—") },
  experience: { label: "Experience", html: r => esc(r.experience_level || "—") },
  payment:    { label: "Payment", html: r => pill(PAYMENT, r.payment_status) },
  gear:       { label: "Gear", html: r => pill(GEAR, r.gear_status) },
  jersey:     { label: "Jersey", html: r => r.jersey_number || r.jersey_name ? `<b>${esc(r.jersey_number ? "#" + r.jersey_number : "")}</b> ${esc(r.jersey_name || "")}` : "—" },
  kind:       { label: "Type", html: r => `<span class="tag kind-${esc(r.kind)}">${esc(kindMeta(r.kind).short)}</span>` },
  source:     { label: "Source", html: r => `<span class="tag">${esc(r.source)}</span>` },
  season:     { label: "Season", html: r => esc(r.season || "—") },
  created:    { label: "Registered", html: r => `<span title="${esc(fmtDateTime(r.created_at))}">${esc(timeAgo(r.created_at))}</span>` }
};


/* ---------------------------------------------------------------------
   Views
   --------------------------------------------------------------------- */
const LIST_VIEWS = {
  youth: {
    title: "Youth Players", kind: "youth",
    desc: "Every youth player, grouped the way you need. Click a player for full details.",
    columns: ["player", "program", "location", "size", "guardian", "contact", "payment", "gear", "created"],
    groups: ["ageGroup", "team", "program", "location", "size", "birthYear", "age", "payment", "gear", "none"],
    filters: ["program", "location", "ageGroup", "size", "payment", "gear"],
    defaultGroup: "ageGroup"
  },
  tryout: {
    title: "Pro Team Tryouts", kind: "tryout",
    desc: "Tryout sign-ups. Remember: players are only officially registered once paid.",
    columns: ["player", "position", "experience", "contact", "payment", "created"],
    groups: ["position", "experience", "payment", "season", "none"],
    filters: ["position", "experience", "payment", "season"],
    defaultGroup: "position"
  },
  all: {
    title: "All Registrations", kind: null,
    desc: "Everything from every source in one place.",
    columns: ["player", "kind", "program", "location", "contact", "payment", "source", "created"],
    groups: ["kind", "season", "source", "payment", "none"],
    filters: ["kind", "season", "source", "payment"],
    defaultGroup: "kind"
  }
};
// Registration types added later in Supabase get a generic view automatically
function viewDef(route) {
  if (LIST_VIEWS[route]) return LIST_VIEWS[route];
  if (route.startsWith("k-")) {
    const key = route.slice(2);
    return {
      title: kindMeta(key).label, kind: key, desc: "Registrations of this type.",
      columns: ["player", "program", "location", "contact", "payment", "source", "created"],
      groups: ["program", "location", "season", "payment", "none"],
      filters: ["program", "location", "season", "payment"],
      defaultGroup: "program"
    };
  }
  return null;
}
function vstate(route) {
  if (!state.views[route]) {
    const def = viewDef(route) || {};
    state.views[route] = { filters: {}, group: def.defaultGroup || "none", sort: "name", showCancelled: false, collapsed: new Set() };
  }
  return state.views[route];
}

function matchesSearch(r) {
  const q = state.search.trim().toLowerCase();
  if (!q) return true;
  return [r.player_name, r.guardian_name, r.email, r.phone, r.jersey_name, r.jersey_number, r.program, r.location, r.notes, r.admin_notes]
    .some(v => v && String(v).toLowerCase().includes(q));
}
function baseRows(kind, showCancelled) {
  return state.rows.filter(r => (!kind || r.kind === kind) && (showCancelled || r.status !== "cancelled"));
}
function applyFilters(rows, filters) {
  return rows.filter(r => matchesSearch(r) && Object.entries(filters).every(([k, v]) => !v || GROUPERS[k].get(r) === v));
}

const routes = () => {
  const kindsExtra = state.kinds.filter(k => !SETTINGS.kinds[k.key]).map(k => "k-" + k.key);
  return ["dashboard", "youth", "tryout", ...kindsExtra, "all", "gear", "sources"];
};


/* =====================================================================
   NAVIGATION
   ===================================================================== */
function renderNav() {
  const active = state.rows.filter(r => r.status !== "cancelled");
  const count = (k) => k ? active.filter(r => r.kind === k).length : active.length;
  const item = (route, label, ic, n) =>
    `<a class="nav-item${state.route === route ? " active" : ""}" href="#/${route}">${icon(ic)}<span>${esc(label)}</span>${n != null ? `<span class="count">${n}</span>` : ""}</a>`;
  const extra = state.kinds.filter(k => !SETTINGS.kinds[k.key])
    .map(k => item("k-" + k.key, k.label, "tag", count(k.key))).join("");
  $("#nav").innerHTML = `
    <div class="nav-label">Overview</div>
    ${item("dashboard", "Dashboard", "dashboard")}
    <div class="nav-label">Registrations</div>
    ${item("youth", SETTINGS.kinds.youth.label, "users", count("youth"))}
    ${item("tryout", SETTINGS.kinds.tryout.label, "trophy", count("tryout"))}
    ${extra}
    ${item("all", "All Registrations", "list", count())}
    <div class="nav-label">Shop</div>
    ${item("gear", "Gear & Print", "shirt")}
    <div class="nav-label">Settings</div>
    ${item("sources", "Data Sources", "plug")}
  `;
}

function setRoute() {
  const h = location.hash.startsWith("#/") ? location.hash.slice(2) : "dashboard";
  state.route = routes().includes(h) ? h : "dashboard";
  state.selected.clear();
  $("#sidebar").classList.remove("open");
  render();
  window.scrollTo(0, 0);
}
function goto(route, filters) {
  if (filters) { const vs = vstate(route); vs.filters = { ...filters }; }
  if (location.hash === "#/" + route) setRoute(); else location.hash = "#/" + route;
}

function render() {
  renderNav();
  // Other pages show their own big heading, so the top bar title is only used on the dashboard
  $("#pageTitle").textContent = state.route === "dashboard" ? "Dashboard" : "";
  const view = $("#view");
  if (state.loading) { view.innerHTML = `<div class="loading"><div class="spinner"></div>Loading registrations…</div>`; return; }
  if (state.route === "dashboard") view.innerHTML = renderDashboard();
  else if (state.route === "gear") view.innerHTML = renderGear();
  else if (state.route === "sources") view.innerHTML = renderSources();
  else view.innerHTML = renderList(state.route);
  renderBulkbar();
}


/* =====================================================================
   DASHBOARD
   ===================================================================== */
function barList(items, route, filterKey) {
  if (!items.length) return `<div class="empty-mini">Nothing here yet.</div>`;
  const max = Math.max(...items.map(i => i.count), 1);
  const total = items.reduce((s, i) => s + i.count, 0);
  return `<div class="bars">${items.map(i => `
    <button class="bar-row" data-goto="${esc(route)}" data-fkey="${esc(filterKey)}" data-fval="${esc(i.value)}"
      title="${esc(i.value)}: ${i.count} (${Math.round(i.count / total * 100)}%)">
      <span class="b-label">${esc(i.value)}</span>
      <span class="b-track"><span class="b-fill" style="width:${(i.count / max * 100).toFixed(1)}%"></span></span>
      <span class="b-val">${i.count}</span>
    </button>`).join("")}</div>`;
}

function renderDashboard() {
  const active = state.rows.filter(r => r.status !== "cancelled");
  if (!active.length) {
    return `<div class="empty">${icon("inbox")}<b>No registrations yet</b>When someone registers on the website it will show up here instantly.<br><br>
      <button class="btn btn-primary" data-action="add">${icon("plus")}Add one manually</button></div>`;
  }
  const youth = active.filter(r => r.kind === "youth");
  const tryouts = active.filter(r => r.kind === "tryout");
  const unpaid = active.filter(r => r.payment_status === "pending");
  const paid = active.filter(r => r.payment_status === "paid");
  const weekAgo = Date.now() - 7 * 864e5;
  const newWeek = active.filter(r => new Date(r.created_at) > weekAgo).length;
  const gearTodo = youth.filter(r => r.gear_status === "not_started" || r.gear_status === "in_production").length;

  const kpi = (label, ic, value, sub, attrs, accent) =>
    `<button class="kpi${accent ? " accent" : ""}" ${attrs}><div class="k-label">${icon(ic)}${esc(label)}</div><div class="k-value">${value}</div><div class="k-sub">${esc(sub)}</div></button>`;

  const sizeCounts = SETTINGS.sizes.map(s => ({ s, n: youth.filter(r => r.uniform_size === s).length }));
  const otherSizes = optionsFor(youth.filter(r => r.uniform_size && !SETTINGS.sizes.includes(r.uniform_size)), "size");
  const recent = [...active].sort(SORTS.newest.fn).slice(0, 8);

  return `
    <div class="kpis">
      ${kpi("Total registrations", "list", active.length, `${newWeek} new in the last 7 days`, `data-goto="all"`, true)}
      ${kpi("Youth players", "users", youth.length, `${optionsFor(youth, "team").length} teams / groups`, `data-goto="youth"`)}
      ${kpi("Tryout sign-ups", "trophy", tryouts.length, `${tryouts.filter(r => r.payment_status === "paid").length} paid`, `data-goto="tryout"`)}
      ${kpi("Awaiting payment", "dollar", unpaid.length, `${paid.length} paid so far`, `data-goto="all" data-fkey="payment" data-fval="Unpaid"`)}
      ${kpi("Gear to make", "shirt", gearTodo, "Youth uniforms not finished", `data-goto="gear"`)}
    </div>

    <div class="grid-2">
      <div class="panel"><div class="panel-head"><h3>Youth by age group</h3><span class="muted">Click a bar to open the list</span></div>
        <div class="panel-body">${barList(optionsFor(youth, "ageGroup"), "youth", "ageGroup")}</div></div>
      <div class="panel"><div class="panel-head"><h3>Youth by team</h3><span class="muted">Program · location</span></div>
        <div class="panel-body">${barList(optionsFor(youth, "team"), "youth", "team")}</div></div>
    </div>

    <div class="grid-3">
      <div class="panel"><div class="panel-head"><h3>Uniform sizes needed</h3><a href="#/gear">Gear &amp; Print →</a></div>
        <div class="panel-body">
          <div class="sizes">
            ${sizeCounts.map(x => `<div class="size-chip"><b>${x.n}</b><span>${esc(x.s)}</span></div>`).join("")}
            ${otherSizes.map(x => `<div class="size-chip"><b>${x.count}</b><span>${esc(x.value)}</span></div>`).join("")}
          </div>
        </div></div>
      <div class="panel"><div class="panel-head"><h3>Tryouts by position</h3></div>
        <div class="panel-body">${barList(optionsFor(tryouts, "position"), "tryout", "position")}</div></div>
      <div class="panel"><div class="panel-head"><h3>Payment status</h3></div>
        <div class="panel-body">${barList(optionsFor(active, "payment"), "all", "payment")}</div></div>
    </div>

    <div class="grid-2">
      <div class="panel"><div class="panel-head"><h3>Recent registrations</h3><a href="#/all">View all →</a></div>
        <div class="panel-body"><div class="recent">${recent.map(r => `
          <div class="recent-row" data-open="${esc(r.id)}">
            <div class="r-avatar">${esc(initials(r.player_name))}</div>
            <div class="r-main"><div class="r-name">${esc(r.player_name)}</div>
              <div class="r-sub">${esc([kindMeta(r.kind).short, r.program !== "Pro Team Tryout" ? r.program : r.position, r.location].filter(Boolean).join(" · "))}</div></div>
            ${pill(PAYMENT, r.payment_status)}
            <div class="r-time">${esc(timeAgo(r.created_at))}</div>
          </div>`).join("")}</div></div></div>
      <div class="panel"><div class="panel-head"><h3>Where registrations come from</h3><a href="#/sources">Data sources →</a></div>
        <div class="panel-body">${barList(optionsFor(active, "source"), "all", "source")}</div></div>
    </div>`;
}


/* =====================================================================
   LIST VIEWS (Youth / Tryouts / All / custom types)
   ===================================================================== */
function currentListRows(route) {
  const def = viewDef(route), vs = vstate(route);
  const base = baseRows(def.kind, vs.showCancelled);
  return { def, vs, base, rows: applyFilters(base, vs.filters).sort(SORTS[vs.sort].fn) };
}

function filterSelect(key, base, current) {
  const opts = optionsFor(base, key);
  return `<label class="field"><span>${esc(GROUPERS[key].label)}</span>
    <select class="input select-sm" data-filter="${key}">
      <option value="">All</option>
      ${opts.map(o => `<option value="${esc(o.value)}"${o.value === current ? " selected" : ""}>${esc(o.value)} (${o.count})</option>`).join("")}
    </select></label>`;
}

function renderList(route) {
  const { def, vs, base, rows } = currentListRows(route);
  const paidCount = rows.filter(r => r.payment_status === "paid").length;
  const activeFilters = Object.entries(vs.filters).filter(([, v]) => v);

  const toolbar = `
    <div class="toolbar">
      <label class="field"><span>Group by</span>
        <select class="input select-sm" data-group>${def.groups.map(g => `<option value="${g}"${g === vs.group ? " selected" : ""}>${esc(GROUPERS[g].label)}</option>`).join("")}</select></label>
      <label class="field"><span>Sort</span>
        <select class="input select-sm" data-sort>${Object.entries(SORTS).map(([k, s]) => `<option value="${k}"${k === vs.sort ? " selected" : ""}>${esc(s.label)}</option>`).join("")}</select></label>
      <div class="sep"></div>
      ${def.filters.map(f => filterSelect(f, base, vs.filters[f])).join("")}
      <label class="toggle"><input type="checkbox" data-cancelled${vs.showCancelled ? " checked" : ""}> Show cancelled</label>
    </div>`;

  const chips = activeFilters.length || state.search ? `
    <div class="chips"><span class="result-count">${rows.length} result${rows.length === 1 ? "" : "s"}</span>
      ${state.search ? `<span class="chip">Search: “${esc(state.search)}” <button data-clear-search aria-label="Clear search">${icon("x")}</button></span>` : ""}
      ${activeFilters.map(([k, v]) => `<span class="chip">${esc(GROUPERS[k].label)}: ${esc(v)} <button data-clear-filter="${k}" aria-label="Remove filter">${icon("x")}</button></span>`).join("")}
      <button class="btn btn-ghost btn-sm" data-clear-all>Clear all</button>
    </div>` : "";

  let body;
  if (!rows.length) {
    body = `<div class="empty">${icon("inbox")}<b>${base.length ? "No matches" : "No registrations yet"}</b>${base.length ? "Try removing a filter or clearing the search." : "New sign-ups will appear here automatically."}</div>`;
  } else {
    body = groupRows(rows, vs.group).map(([name, list]) => groupBlock(route, def, vs, name, list)).join("");
  }

  return `
    <div class="page-head">
      <div><h2>${esc(def.title)}</h2><p>${rows.length} shown · ${paidCount} paid · ${rows.length - paidCount} not paid. ${esc(def.desc)}</p></div>
      <div class="page-actions">
        <button class="btn" data-action="export">${icon("download")}Export CSV</button>
        <button class="btn" data-action="print-roster">${icon("printer")}Print roster</button>
        ${def.kind === "youth" ? `<a class="btn" href="#/gear">${icon("shirt")}Gear &amp; Print</a>` : ""}
      </div>
    </div>
    ${toolbar}${chips}${body}`;
}

function groupBlock(route, def, vs, name, list) {
  const collapsed = vs.collapsed.has(name);
  const paid = list.filter(r => r.payment_status === "paid").length;
  const allSel = list.every(r => state.selected.has(r.id));
  const sizes = def.kind === "youth" ? optionsFor(list.filter(r => r.uniform_size), "size").map(o => `${sizeShort(o.value)}×${o.count}`).join("  ") : "";
  return `
    <div class="group${collapsed ? " collapsed" : ""}" data-group-name="${esc(name)}">
      <div class="group-head" data-toggle-group="${esc(name)}">
        <svg class="chev" viewBox="0 0 24 24">${ICONS.chev}</svg>
        <h3>${esc(name)}</h3><span class="g-count">${list.length}</span>
        <span class="g-meta"><span>${paid} paid</span>${sizes ? `<span>Sizes: ${esc(sizes)}</span>` : ""}</span>
        <span class="g-actions">
          <button class="btn btn-sm btn-ghost" data-print-group="${esc(name)}" title="Print this group">${icon("printer")}</button>
        </span>
      </div>
      <div class="table-wrap">
        <table class="data responsive">
          <thead><tr>
            <th class="chk"><input type="checkbox" data-select-group="${esc(name)}"${allSel ? " checked" : ""} aria-label="Select group"></th>
            ${def.columns.map(c => `<th>${esc(COLS[c].label)}</th>`).join("")}
          </tr></thead>
          <tbody>${list.map(r => `
            <tr data-open="${esc(r.id)}" class="${state.selected.has(r.id) ? "selected" : ""}${r.status === "cancelled" ? " cancelled" : ""}">
              <td class="chk"><input type="checkbox" data-select="${esc(r.id)}"${state.selected.has(r.id) ? " checked" : ""} aria-label="Select"></td>
              ${def.columns.map(c => `<td class="${COLS[c].cls || ""}" data-label="${esc(COLS[c].short || COLS[c].label)}">${COLS[c].html(r)}</td>`).join("")}
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}


/* =====================================================================
   GEAR & PRINT
   ===================================================================== */
function gearState() {
  const vs = vstate("gear");
  if (!vs.init) Object.assign(vs, { init: true, kind: "youth", group: "team", payment: "", gearFilter: "", program: "", location: "", sort: "name" });
  return vs;
}
function gearRows() {
  const vs = gearState();
  return state.rows.filter(r =>
    r.status !== "cancelled" && r.kind === vs.kind && matchesSearch(r) &&
    (!vs.payment || r.payment_status === vs.payment) &&
    (!vs.gearFilter || r.gear_status === vs.gearFilter) &&
    (!vs.program || r.program === vs.program) &&
    (!vs.location || r.location === vs.location)
  ).sort(SORTS[vs.sort].fn);
}
function sizeList(rows) {
  const present = uniq(rows.map(r => r.uniform_size || "No size"));
  return sortGroupKeys(uniq([...SETTINGS.sizes.filter(s => present.includes(s)), ...present]), "size");
}

function renderGear() {
  const vs = gearState();
  const rows = gearRows();
  const kindRows = state.rows.filter(r => r.status !== "cancelled" && r.kind === vs.kind);
  const kindsPresent = uniq(state.rows.map(r => r.kind));
  const groups = groupRows(rows, vs.group);
  const sizes = sizeList(rows);
  const sel = (attr, label, opts, cur) => `<label class="field"><span>${label}</span><select class="input select-sm" ${attr}>${opts.map(([v, l]) => `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`;

  const toolbar = `
    <div class="toolbar">
      ${sel("data-gear=kind", "Type", kindsPresent.map(k => [k, kindMeta(k).label]), vs.kind)}
      ${sel("data-gear=group", "Columns / teams by", ["team", "program", "location", "ageGroup", "none"].map(g => [g, GROUPERS[g].label]), vs.group)}
      ${sel("data-gear=program", "Program", [["", "All"], ...optionsFor(kindRows, "program").filter(o => o.value !== "No program").map(o => [o.value, o.value])], vs.program)}
      ${sel("data-gear=location", "Location", [["", "All"], ...optionsFor(kindRows, "location").filter(o => o.value !== "No location").map(o => [o.value, o.value])], vs.location)}
      ${sel("data-gear=payment", "Payment", [["", "All"], ...Object.entries(PAYMENT).map(([k, p]) => [k, p.label + " only"])], vs.payment)}
      ${sel("data-gear=gearFilter", "Gear status", [["", "All"], ...Object.entries(GEAR).map(([k, g]) => [k, g.label])], vs.gearFilter)}
      ${sel("data-gear=sort", "Sort list", Object.entries(SORTS).map(([k, s]) => [k, s.label]), vs.sort)}
    </div>`;

  if (!rows.length) {
    return pageHeadGear(0) + toolbar + `<div class="empty">${icon("shirt")}<b>Nothing to make</b>No players match these filters.</div>`;
  }

  // Size matrix: sizes × groups
  const matrix = `
    <div class="panel" style="margin-bottom:16px;">
      <div class="panel-head"><h3>Size totals</h3><span class="muted">How many of each size to produce</span></div>
      <div class="table-wrap"><table class="matrix">
        <thead><tr><th>Size</th>${groups.map(([g]) => `<th>${esc(g)}</th>`).join("")}<th>Total</th></tr></thead>
        <tbody>
          ${sizes.map(s => {
            const cells = groups.map(([, list]) => list.filter(r => (r.uniform_size || "No size") === s).length);
            const tot = cells.reduce((a, b) => a + b, 0);
            return `<tr><td><span class="size-badge">${esc(sizeShort(s))}</span> <span class="muted">${esc(s)}</span></td>
              ${cells.map(n => `<td class="${n ? "hot" : "zero"}">${n || "–"}</td>`).join("")}<td class="total">${tot}</td></tr>`;
          }).join("")}
          <tr class="total"><td>Total</td>${groups.map(([, list]) => `<td>${list.length}</td>`).join("")}<td class="total">${rows.length}</td></tr>
        </tbody>
      </table></div>
    </div>`;

  const sizeOpts = (cur) => uniq([...SETTINGS.sizes, ...(cur ? [cur] : [])]).map(s => `<option value="${esc(s)}"${s === cur ? " selected" : ""}>${esc(sizeShort(s))}</option>`).join("");
  const gearOpts = (cur) => Object.entries(GEAR).map(([k, g]) => `<option value="${k}"${k === cur ? " selected" : ""}>${esc(g.label)}</option>`).join("");

  const production = groups.map(([name, list]) => `
    <div class="group${vs.collapsed.has(name) ? " collapsed" : ""}" data-group-name="${esc(name)}">
      <div class="group-head" data-toggle-group="${esc(name)}">
        <svg class="chev" viewBox="0 0 24 24">${ICONS.chev}</svg>
        <h3>${esc(name)}</h3><span class="g-count">${list.length}</span>
        <span class="g-meta"><span>${esc(optionsFor(list.filter(r => r.uniform_size), "size").map(o => `${sizeShort(o.value)}×${o.count}`).join("  ") || "No sizes yet")}</span></span>
        <span class="g-actions"><button class="btn btn-sm btn-ghost" data-print-gear-group="${esc(name)}" title="Print this team's order">${icon("printer")}</button></span>
      </div>
      <div class="table-wrap"><table class="data">
        <thead><tr>
          <th class="chk"><input type="checkbox" data-select-group="${esc(name)}"${list.every(r => state.selected.has(r.id)) ? " checked" : ""} aria-label="Select group"></th>
          <th>Player</th><th>Size</th><th>Jersey #</th><th>Name on jersey</th><th>Gear status</th><th>Payment</th>
        </tr></thead>
        <tbody>${list.map(r => `
          <tr data-open="${esc(r.id)}" class="${state.selected.has(r.id) ? "selected" : ""}">
            <td class="chk"><input type="checkbox" data-select="${esc(r.id)}"${state.selected.has(r.id) ? " checked" : ""} aria-label="Select"></td>
            <td>${COLS.player.html(r)}</td>
            <td><select class="inline-input" data-inline="uniform_size" data-id="${esc(r.id)}"><option value="">—</option>${sizeOpts(r.uniform_size)}</select></td>
            <td><input class="inline-input" data-inline="jersey_number" data-id="${esc(r.id)}" value="${esc(r.jersey_number || "")}" placeholder="#" maxlength="4" inputmode="numeric"></td>
            <td><input class="inline-input wide" data-inline="jersey_name" data-id="${esc(r.id)}" value="${esc(r.jersey_name || "")}" placeholder="Name" maxlength="20"></td>
            <td><select class="inline-input" data-inline="gear_status" data-id="${esc(r.id)}">${gearOpts(r.gear_status)}</select></td>
            <td>${pill(PAYMENT, r.payment_status)}</td>
          </tr>`).join("")}
        </tbody>
      </table></div>
    </div>`).join("");

  return pageHeadGear(rows.length) + toolbar + matrix +
    `<div class="page-head" style="margin:22px 0 12px;"><div><h2 style="font-size:22px;">Production list</h2><p>Edit size, jersey number and name right in the table. Changes save automatically.</p></div></div>` +
    production;
}
function pageHeadGear(n) {
  return `
    <div class="page-head">
      <div><h2>Gear &amp; Print</h2><p>${n} player${n === 1 ? "" : "s"} · sizes, jersey numbers and names for the shop.</p></div>
      <div class="page-actions">
        <button class="btn" data-action="gear-export">${icon("download")}Export for shop (CSV)</button>
        <button class="btn btn-primary" data-action="gear-print">${icon("printer")}Print order sheet</button>
      </div>
    </div>`;
}


/* =====================================================================
   DATA SOURCES (expandability)
   ===================================================================== */
function renderSources() {
  const bySource = optionsFor(state.rows, "source");
  const last = (src) => { const r = state.rows.filter(x => (x.source || "Unknown") === src).sort(SORTS.newest.fn)[0]; return r ? timeAgo(r.created_at) : "—"; };
  const url = (window.FOXES_SUPABASE || {}).url || "https://YOUR-PROJECT.supabase.co";
  const snippet =
`fetch("${url}/rest/v1/rpc/submit_registration", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": ANON_KEY,                 // from supabase-config.js
    "Authorization": "Bearer " + ANON_KEY
  },
  body: JSON.stringify({
    p_kind: "youth",                    // or "tryout", or a new type below
    p_source: "partner-site",           // shows up in "Where registrations come from"
    p_data: {
      player_name: "Jane Doe",
      email: "parent@example.com",
      date_of_birth: "2017-04-12",
      program: "Hybrid", location: "Montbello",
      uniform_size: "Small",
      any_other_field: "kept automatically"
    }
  })
});`;

  return `
    <div class="page-head"><div><h2>Data Sources</h2><p>Where registrations come from, and how to bring in more.</p></div></div>

    <div class="grid-2" style="margin-top:0;">
      <div class="panel"><div class="panel-head"><h3>Sources</h3><span class="muted">${state.rows.length} total</span></div>
        <div class="table-wrap"><table class="data">
          <thead><tr><th>Source</th><th>Registrations</th><th>Last received</th></tr></thead>
          <tbody>${bySource.length ? bySource.map(s => `<tr data-goto="all" data-fkey="source" data-fval="${esc(s.value)}"><td><span class="tag">${esc(s.value)}</span></td><td class="num">${s.count}</td><td>${esc(last(s.value))}</td></tr>`).join("") : `<tr><td colspan="3" class="muted">No data yet</td></tr>`}</tbody>
        </table></div>
      </div>

      <div class="panel"><div class="panel-head"><h3>Registration types</h3><span class="muted">Each type gets its own page</span></div>
        <div class="panel-body">
          <div class="table-wrap"><table class="data"><thead><tr><th>Key</th><th>Name</th><th>Count</th></tr></thead><tbody>
            ${state.kinds.map(k => `<tr><td class="mono">${esc(k.key)}</td><td>${esc(k.label)}</td><td class="num">${state.rows.filter(r => r.kind === k.key).length}</td></tr>`).join("")}
          </tbody></table></div>
          <form id="kindForm" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
            <input class="input" name="key" placeholder="key, e.g. camp" pattern="[a-z0-9_]{2,30}" required style="flex:1 1 120px;">
            <input class="input" name="label" placeholder="Name, e.g. Summer Camp" required style="flex:2 1 180px;">
            <button class="btn btn-primary" type="submit">${icon("plus")}Add type</button>
          </form>
        </div>
      </div>
    </div>

    <div class="grid-3">
      <div class="source-card">
        <h3>Website forms</h3>
        <p>The youth registration (home page) and pro tryout (pro page) forms save here automatically as <span class="tag">website</span>.</p>
        <a class="btn btn-sm" href="../index.html#register" target="_blank" rel="noopener">Open youth form</a>
        <a class="btn btn-sm" href="../pro.html#tryouts" target="_blank" rel="noopener">Open tryout form</a>
      </div>
      <div class="source-card">
        <h3>Add manually</h3>
        <p>Walk-ins, phone sign-ups or paper forms. Saved as <span class="tag">manual</span>.</p>
        <button class="btn btn-primary btn-sm" data-action="add">${icon("plus")}Add registration</button>
      </div>
      <div class="source-card">
        <h3>Import a spreadsheet</h3>
        <p>Upload a CSV (from Excel / Google Sheets). Saved as <span class="tag">import</span>.</p>
        <button class="btn btn-sm" data-action="import">${icon("upload")}Import CSV</button>
      </div>
    </div>

    <div class="panel" style="margin-top:16px;">
      <div class="panel-head"><h3>Connect another website or app</h3><span class="muted">Any site can send registrations here</span></div>
      <div class="panel-body">
        <p class="muted" style="margin-top:0;">Use the same public key as this website (in <span class="mono">supabase-config.js</span>). It can only <b>add</b> registrations, never read them. Fields without a matching column are saved under "Other details".</p>
        <pre class="code">${esc(snippet)}</pre>
      </div>
    </div>`;
}


/* =====================================================================
   DETAIL DRAWER + ADD MODAL (shared form)
   ===================================================================== */
const FIELDS = [
  { section: "Registration", key: "kind", label: "Type", type: "kind", newOnly: true },
  { section: "Registration", key: "season", label: "Season", list: "season" },
  { section: "Registration", key: "program", label: "Program", list: "program" },
  { section: "Registration", key: "location", label: "Location", list: "location" },
  { section: "Player", key: "player_name", label: "Player name", required: true, full: true },
  { section: "Player", key: "date_of_birth", label: "Date of birth", type: "date" },
  { section: "Player", key: "position", label: "Position", type: "select", options: () => SETTINGS.positions, kinds: ["tryout"] },
  { section: "Player", key: "experience_level", label: "Experience", type: "select", options: () => SETTINGS.experienceLevels, kinds: ["tryout"] },
  { section: "Contact", key: "guardian_name", label: "Parent / guardian", kinds: ["youth"] },
  { section: "Contact", key: "email", label: "Email", type: "email" },
  { section: "Contact", key: "phone", label: "Phone", type: "tel" },
  { section: "Gear", key: "uniform_size", label: "Uniform size", type: "select", options: () => SETTINGS.sizes },
  { section: "Gear", key: "jersey_number", label: "Jersey #" },
  { section: "Gear", key: "jersey_name", label: "Name on jersey" },
  { section: "Gear", key: "gear_status", label: "Gear status", type: "map", map: GEAR },
  { section: "Admin", key: "payment_status", label: "Payment", type: "map", map: PAYMENT },
  { section: "Admin", key: "status", label: "Status", type: "select", options: () => ["active", "cancelled"], noBlank: true },
  { section: "Admin", key: "notes", label: "Notes from registrant", type: "textarea", full: true },
  { section: "Admin", key: "admin_notes", label: "Private admin notes", type: "textarea", full: true }
];

function fieldHTML(f, r) {
  const v = r[f.key] ?? "";
  const req = f.required ? " required" : "";
  let input;
  if (f.type === "kind") {
    input = `<select class="input" name="kind" data-kind-switch>${state.kinds.map(k => `<option value="${esc(k.key)}"${k.key === r.kind ? " selected" : ""}>${esc(k.label)}</option>`).join("")}</select>`;
  } else if (f.type === "select") {
    const opts = uniq([...f.options(), ...(v ? [v] : [])]);
    input = `<select class="input" name="${f.key}">${f.noBlank ? "" : `<option value="">—</option>`}${opts.map(o => `<option value="${esc(o)}"${o === v ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  } else if (f.type === "map") {
    input = `<select class="input" name="${f.key}">${Object.entries(f.map).map(([k, m]) => `<option value="${k}"${k === v ? " selected" : ""}>${esc(m.label)}</option>`).join("")}</select>`;
  } else if (f.type === "textarea") {
    input = `<textarea class="input" name="${f.key}">${esc(v)}</textarea>`;
  } else {
    input = `<input class="input" name="${f.key}" type="${f.type || "text"}" value="${esc(v)}"${f.list ? ` list="dl-${f.list}"` : ""}${req}>`;
  }
  return `<label class="field${f.full ? " full" : ""}"><span>${esc(f.label)}${f.required ? ' <i class="req">*</i>' : ""}</span>${input}</label>`;
}

function recordFormHTML(r, isNew) {
  const sections = uniq(FIELDS.map(f => f.section));
  const datalists = ["season", "program", "location"].map(k =>
    `<datalist id="dl-${k}">${uniq(state.rows.map(x => x[k]).filter(Boolean)).sort().map(v => `<option value="${esc(v)}">`).join("")}</datalist>`).join("");
  return sections.map(sec => {
    const fs = FIELDS.filter(f => f.section === sec && (!f.newOnly || isNew) && (!f.kinds || f.kinds.includes(r.kind)));
    if (!fs.length) return "";
    return `<div class="form-section"><h4>${esc(sec)}</h4><div class="form-grid">${fs.map(f => fieldHTML(f, r)).join("")}</div></div>`;
  }).join("") + datalists;
}

function readForm(form) {
  const out = {};
  new FormData(form).forEach((v, k) => { const s = String(v).trim(); out[k] = s === "" ? null : s; });
  return out;
}

function openDrawer(id) {
  const r = state.rows.find(x => x.id === id);
  if (!r) return;
  const extra = r.extra && typeof r.extra === "object" ? Object.entries(r.extra) : [];
  $("#drawer").innerHTML = `
    <div class="drawer-head">
      <div class="top">
        <div class="big-avatar">${esc(initials(r.player_name))}</div>
        <div style="flex:1;min-width:0;">
          <h2>${esc(r.player_name)}</h2>
          <div class="meta">
            <span class="tag kind-${esc(r.kind)}">${esc(kindMeta(r.kind).label)}</span>
            ${r._age != null ? `<span class="tag">Age ${r._age} · ${esc(r._ageGroup || "")}</span>` : ""}
            ${pill(PAYMENT, r.payment_status)} ${pill(GEAR, r.gear_status)}
            ${r.status === "cancelled" ? `<span class="pill bad">Cancelled</span>` : ""}
          </div>
        </div>
        <button class="btn btn-ghost icon-btn" data-close-drawer aria-label="Close">${icon("x")}</button>
      </div>
      <div class="quick">
        ${r.email ? `<a class="btn btn-sm" href="mailto:${esc(r.email)}">${icon("mail")}Email</a>` : ""}
        ${r.phone ? `<a class="btn btn-sm" href="tel:${esc(r.phone)}">${icon("phone")}Call</a>` : ""}
        ${r.payment_status !== "paid" ? `<button class="btn btn-sm" data-quick-paid="${esc(r.id)}">${icon("check")}Mark paid</button>` : ""}
        <button class="btn btn-sm" data-print-one="${esc(r.id)}">${icon("printer")}Print</button>
      </div>
    </div>
    <form class="drawer-body" id="drawerForm" novalidate>
      ${recordFormHTML(r, false)}
      <div class="form-section"><h4>Record</h4>
        <dl class="facts">
          <dt>Registered</dt><dd>${esc(fmtDateTime(r.created_at))}</dd>
          <dt>Last updated</dt><dd>${esc(fmtDateTime(r.updated_at))}</dd>
          <dt>Source</dt><dd><span class="tag">${esc(r.source)}</span></dd>
          <dt>Waiver</dt><dd>${r.waiver_accepted ? `Accepted ${esc(fmtDateTime(r.waiver_accepted_at))}` : "Not on file"}</dd>
          ${extra.map(([k, v]) => `<dt>${esc(k.replace(/_/g, " "))}</dt><dd>${esc(typeof v === "object" ? JSON.stringify(v) : v)}</dd>`).join("")}
          <dt>ID</dt><dd class="mono">${esc(r.id)}</dd>
        </dl>
      </div>
    </form>
    <div class="drawer-foot">
      <button class="btn btn-danger" data-delete="${esc(r.id)}">${icon("trash")}Delete</button>
      <div class="grow"></div>
      <button class="btn" data-close-drawer>Close</button>
      <button class="btn btn-primary" data-save="${esc(r.id)}">Save changes</button>
    </div>`;
  $("#drawer").classList.add("show");
  $("#scrim").classList.add("show");
}
function closeDrawer() {
  $("#drawer").classList.remove("show");
  $("#scrim").classList.remove("show");
}

function openAddModal(kind) {
  const draft = { kind: kind || (LIST_VIEWS[state.route] && LIST_VIEWS[state.route].kind) || "youth", payment_status: "pending", gear_status: "not_started", status: "active" };
  const host = $("#modalHost");
  const paint = () => {
    host.innerHTML = `
      <div class="modal-wrap" data-modal>
        <div class="modal" role="dialog" aria-modal="true" aria-label="Add registration">
          <div class="modal-head"><h2>Add registration</h2><button class="btn btn-ghost icon-btn" data-close-modal aria-label="Close">${icon("x")}</button></div>
          <form class="modal-body" id="addForm" novalidate>${recordFormHTML(draft, true)}</form>
          <div class="modal-foot"><button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" data-add-save>Save registration</button></div>
        </div>
      </div>`;
    $("[data-kind-switch]", host).addEventListener("change", (e) => {
      Object.assign(draft, readForm($("#addForm")), { kind: e.target.value });
      paint();
    });
  };
  paint();
}
const closeModal = () => { $("#modalHost").innerHTML = ""; };


/* =====================================================================
   DATA: load / update / insert / delete
   ===================================================================== */
let sb = null;

async function loadAll(quiet) {
  if (!quiet) { state.loading = true; render(); }
  const [kinds, regs] = await Promise.all([
    sb.from("registration_kinds").select("*").order("sort_order"),
    sb.from("registrations").select("*").order("created_at", { ascending: false }).range(0, 9999)
  ]);
  state.loading = false;
  if (regs.error) { toast("Couldn't load registrations: " + regs.error.message, "err"); render(); return; }
  state.kinds = kinds.data && kinds.data.length ? kinds.data
    : Object.entries(SETTINGS.kinds).map(([key, k], i) => ({ key, label: k.label, sort_order: i }));
  state.rows = regs.data.map(derive);
  render();
}

function replaceRows(updated) {
  updated.forEach(u => {
    derive(u);
    const i = state.rows.findIndex(r => r.id === u.id);
    if (i >= 0) state.rows[i] = u; else state.rows.unshift(u);
  });
}

async function updateRows(ids, patch, { silent, rerender = true } = {}) {
  const { data, error } = await sb.from("registrations").update(patch).in("id", ids).select();
  if (error) { toast("Save failed: " + error.message, "err"); return false; }
  replaceRows(data);
  if (!silent) toast(ids.length > 1 ? `Updated ${ids.length} registrations` : "Saved");
  if (rerender) { const y = window.scrollY; render(); window.scrollTo(0, y); }
  return true;
}


/* =====================================================================
   BULK ACTIONS
   ===================================================================== */
function renderBulkbar() {
  const n = state.selected.size;
  const bar = $("#bulkbar");
  if (!n || !["youth", "tryout", "all", "gear"].includes(state.route) && !state.route.startsWith("k-")) { bar.classList.remove("show"); return; }
  bar.innerHTML = `
    <b>${n} selected</b>
    <button class="btn btn-sm" data-bulk-pay="paid">${icon("check")}Mark paid</button>
    <button class="btn btn-sm" data-bulk-pay="pending">Mark unpaid</button>
    <select class="input select-sm" data-bulk-gear style="width:auto;padding:6px 30px 6px 10px;">
      <option value="">Set gear status…</option>
      ${Object.entries(GEAR).map(([k, g]) => `<option value="${k}">${esc(g.label)}</option>`).join("")}
    </select>
    <button class="btn btn-sm" data-bulk-export>${icon("download")}Export</button>
    <button class="btn btn-sm" data-bulk-print>${icon("printer")}Print cards</button>
    <button class="btn btn-sm btn-ghost" data-bulk-clear>${icon("x")}Clear</button>`;
  bar.classList.add("show");
}
const selectedRows = () => state.rows.filter(r => state.selected.has(r.id));


/* =====================================================================
   CSV export / import
   ===================================================================== */
const EXPORT_COLS = [
  ["Type", r => kindMeta(r.kind).label], ["Season", r => r.season], ["Program", r => r.program], ["Location", r => r.location],
  ["Player", r => r.player_name], ["Date of birth", r => r.date_of_birth], ["Age", r => r._age], ["Age group", r => r._ageGroup],
  ["Parent / guardian", r => r.guardian_name], ["Email", r => r.email], ["Phone", r => r.phone],
  ["Uniform size", r => r.uniform_size], ["Jersey #", r => r.jersey_number], ["Name on jersey", r => r.jersey_name],
  ["Position", r => r.position], ["Experience", r => r.experience_level],
  ["Payment", r => (PAYMENT[r.payment_status] || {}).label], ["Gear status", r => (GEAR[r.gear_status] || {}).label],
  ["Status", r => r.status], ["Registrant notes", r => r.notes], ["Admin notes", r => r.admin_notes],
  ["Source", r => r.source], ["Registered", r => fmtDateTime(r.created_at)],
  ["Waiver accepted", r => r.waiver_accepted ? fmtDateTime(r.waiver_accepted_at) : "No"]
];
const SHOP_COLS = [
  ["Team", r => r._team], ["Program", r => r.program], ["Location", r => r.location], ["Player", r => r.player_name],
  ["Age group", r => r._ageGroup], ["Uniform size", r => r.uniform_size], ["Jersey #", r => r.jersey_number],
  ["Name on jersey", r => r.jersey_name], ["Gear status", r => (GEAR[r.gear_status] || {}).label], ["Payment", r => (PAYMENT[r.payment_status] || {}).label]
];

function downloadCSV(rows, filename, cols = EXPORT_COLS, withExtra = true) {
  const extraKeys = withExtra ? uniq(rows.flatMap(r => Object.keys(r.extra || {}))) : [];
  const header = [...cols.map(c => c[0]), ...extraKeys];
  const cell = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [header.map(cell).join(","), ...rows.map(r => [...cols.map(c => c[1](r)), ...extraKeys.map(k => (r.extra || {})[k])].map(cell).join(","))];
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.replace(/[^\w.-]+/g, "-");
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`Exported ${rows.length} row${rows.length === 1 ? "" : "s"}`);
}
const today = () => new Date().toISOString().slice(0, 10);

function parseCSV(text) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); rows.push(row); row = []; cur = "";
    } else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ""));
}
const IMPORT_ALIASES = {
  player_name: ["player_name", "player", "name", "full_name", "player_full_name", "participant"],
  date_of_birth: ["date_of_birth", "dob", "birthdate", "birth_date", "birthday"],
  guardian_name: ["guardian_name", "guardian", "parent", "parent_name", "parent_guardian"],
  email: ["email", "email_address", "e_mail"], phone: ["phone", "phone_number", "mobile", "cell"],
  uniform_size: ["uniform_size", "size", "shirt_size", "jersey_size"], jersey_number: ["jersey_number", "jersey", "number", "jersey_no"],
  jersey_name: ["jersey_name", "name_on_jersey"], program: ["program"], location: ["location", "site"], season: ["season"],
  position: ["position"], experience_level: ["experience_level", "experience"], notes: ["notes", "comments", "message"]
};
function normDate(v) {
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) { const y = m[3].length === 2 ? (Number(m[3]) > 30 ? "19" : "20") + m[3] : m[3]; return `${y}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`; }
  return null;
}

function openImportModal() {
  const host = $("#modalHost");
  let parsed = null;
  host.innerHTML = `
    <div class="modal-wrap" data-modal>
      <div class="modal" role="dialog" aria-modal="true" aria-label="Import CSV">
        <div class="modal-head"><h2>Import CSV</h2><button class="btn btn-ghost icon-btn" data-close-modal aria-label="Close">${icon("x")}</button></div>
        <div class="modal-body">
          <label class="field" style="margin-bottom:14px;"><span>Import as type</span>
            <select class="input" id="importKind">${state.kinds.map(k => `<option value="${esc(k.key)}">${esc(k.label)}</option>`).join("")}</select></label>
          <label class="dropzone" id="dropzone">${icon("upload")}<div><b>Choose a .csv file</b> or drop it here</div>
            <div class="muted" style="font-size:12.5px;margin-top:6px;">First row = column names, e.g. Player, DOB, Parent, Email, Phone, Size, Program, Location</div>
            <input type="file" accept=".csv,text/csv" id="importFile" hidden></label>
          <div id="importPreview" style="margin-top:14px;"></div>
        </div>
        <div class="modal-foot"><button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="importGo" disabled>Import</button></div>
      </div>
    </div>`;
  const dz = $("#dropzone"), fileInput = $("#importFile");
  const handle = async (file) => {
    const rows = parseCSV(await file.text());
    if (rows.length < 2) { $("#importPreview").innerHTML = `<div class="auth-msg err">That file has no data rows.</div>`; return; }
    const head = rows[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
    const mapIdx = {};
    Object.entries(IMPORT_ALIASES).forEach(([field, al]) => { const i = head.findIndex(h => al.includes(h)); if (i >= 0) mapIdx[field] = i; });
    const used = new Set(Object.values(mapIdx));
    const records = rows.slice(1).map(cells => {
      const rec = { extra: {} };
      Object.entries(mapIdx).forEach(([f, i]) => { const v = (cells[i] || "").trim(); if (v) rec[f] = v; });
      head.forEach((h, i) => { if (!used.has(i) && h && (cells[i] || "").trim()) rec.extra[h] = cells[i].trim(); });
      if (rec.date_of_birth) rec.date_of_birth = normDate(rec.date_of_birth);
      return rec;
    }).filter(r => r.player_name);
    parsed = records;
    $("#importPreview").innerHTML = `
      <div class="auth-msg ok"><b>${records.length}</b> players found. Matched columns: ${Object.keys(mapIdx).map(k => `<span class="tag">${esc(k)}</span>`).join(" ") || "none"}.
      ${head.filter((h, i) => !used.has(i)).length ? `Other columns are kept under "Other details".` : ""}</div>
      ${!mapIdx.player_name ? `<div class="auth-msg err" style="margin-top:8px;">No "Player" / "Name" column found.</div>` : ""}`;
    $("#importGo").disabled = !records.length;
  };
  fileInput.addEventListener("change", () => fileInput.files[0] && handle(fileInput.files[0]));
  dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("over"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("over"));
  dz.addEventListener("drop", (e) => { e.preventDefault(); dz.classList.remove("over"); e.dataTransfer.files[0] && handle(e.dataTransfer.files[0]); });
  $("#importGo").addEventListener("click", async () => {
    if (!parsed || !parsed.length) return;
    const kind = $("#importKind").value;
    $("#importGo").disabled = true; $("#importGo").textContent = "Importing…";
    const payload = parsed.map(r => ({ ...r, kind, source: "import" }));
    for (let i = 0; i < payload.length; i += 500) {
      const { error } = await sb.from("registrations").insert(payload.slice(i, i + 500));
      if (error) { toast("Import failed: " + error.message, "err"); $("#importGo").disabled = false; $("#importGo").textContent = "Import"; return; }
    }
    closeModal();
    toast(`Imported ${payload.length} registrations`);
    loadAll(true);
  });
}


/* =====================================================================
   PRINTING
   ===================================================================== */
function printDoc(title, subtitle, html) {
  $("#print-area").innerHTML = `
    <div class="p-head"><img src="../logo2.png" alt=""><div><h1>${esc(title)}</h1><div class="p-sub">${esc(subtitle || "")}</div></div>
      <div class="p-date">Colorado Foxes<br>Printed ${esc(new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }))}</div></div>
    ${html}
    <div class="p-foot">Confidential — contains player and family contact information.</div>`;
  setTimeout(() => window.print(), 50);
}
function printRoster(route, onlyGroup) {
  const { def, vs, rows } = currentListRows(route);
  const youthish = def.kind === "youth";
  const cols = youthish
    ? [["#", (r, i) => i + 1, "c"], ["Player", r => r.player_name], ["Age", r => r._age ?? "", "c"], ["DOB", r => fmtDate(r.date_of_birth)], ["Program", r => r.program], ["Location", r => r.location],
       ["Size", r => sizeShort(r.uniform_size || ""), "c"], ["Parent / guardian", r => r.guardian_name], ["Phone", r => r.phone], ["Email", r => r.email], ["Paid", r => r.payment_status === "paid" ? "✓" : "", "c"], ["Here", () => '<span class="p-check"></span>', "c", true]]
    : [["#", (r, i) => i + 1, "c"], ["Name", r => r.player_name], ["Type", r => kindMeta(r.kind).short], ["Position", r => r.position], ["Experience", r => r.experience_level], ["Email", r => r.email], ["Phone", r => r.phone], ["Paid", r => r.payment_status === "paid" ? "✓" : "", "c"], ["Here", () => '<span class="p-check"></span>', "c", true]];
  const groups = groupRows(rows, vs.group).filter(([g]) => !onlyGroup || g === onlyGroup);
  const html = groups.map(([name, list]) => `
    <div class="p-group"><h2>${esc(name)} <small>${list.length} player${list.length === 1 ? "" : "s"}</small></h2>
      <table class="p-table"><thead><tr>${cols.map(c => `<th class="${c[2] || ""}">${esc(c[0])}</th>`).join("")}</tr></thead>
      <tbody>${list.map((r, i) => `<tr>${cols.map(c => `<td class="${c[2] || ""}">${c[3] ? c[1](r, i) : esc(c[1](r, i) ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`).join("");
  printDoc(def.title + (onlyGroup ? " — " + onlyGroup : ""), `Grouped by ${GROUPERS[vs.group].label.toLowerCase()} · ${rows.length} players`, html);
}
function printGear(onlyGroup) {
  const vs = gearState();
  const rows = gearRows();
  const groups = groupRows(rows, vs.group).filter(([g]) => !onlyGroup || g === onlyGroup);
  const all = groups.flatMap(([, l]) => l);
  const sizes = sizeList(all);
  const matrix = `
    <div class="p-group"><h2>Size totals</h2>
      <table class="p-table"><thead><tr><th>Size</th>${groups.map(([g]) => `<th class="c">${esc(g)}</th>`).join("")}<th class="c">Total</th></tr></thead>
      <tbody>${sizes.map(s => { const cells = groups.map(([, l]) => l.filter(r => (r.uniform_size || "No size") === s).length);
        return `<tr><td>${esc(s)}</td>${cells.map(n => `<td class="c">${n || ""}</td>`).join("")}<td class="c"><b>${cells.reduce((a, b) => a + b, 0)}</b></td></tr>`; }).join("")}
        <tr class="total"><td>Total</td>${groups.map(([, l]) => `<td class="c">${l.length}</td>`).join("")}<td class="c">${all.length}</td></tr></tbody></table></div>`;
  const lists = groups.map(([name, list]) => `
    <div class="p-group"><h2>${esc(name)} <small>${list.length} players</small></h2>
      <table class="p-table"><thead><tr><th class="c">#</th><th>Player</th><th class="c">Size</th><th class="c">Jersey #</th><th>Name on jersey</th><th class="c">Printed</th><th class="c">Handed out</th></tr></thead>
      <tbody>${list.map((r, i) => `<tr><td class="c">${i + 1}</td><td>${esc(r.player_name)}</td><td class="c"><b>${esc(sizeShort(r.uniform_size || "—"))}</b></td><td class="c"><b>${esc(r.jersey_number || "")}</b></td><td>${esc(r.jersey_name || "")}</td><td class="c"><span class="p-check"></span></td><td class="c"><span class="p-check"></span></td></tr>`).join("")}</tbody></table></div>`).join("");
  printDoc("Gear Order Sheet" + (onlyGroup ? " — " + onlyGroup : ""), `${kindMeta(vs.kind).label} · ${all.length} players`, matrix + lists);
}
function printCards(rows) {
  const html = rows.map(r => `
    <div class="p-card"><h2>${esc(r.player_name)}</h2><dl>
      <dt>Type</dt><dd>${esc(kindMeta(r.kind).label)}${r.season ? " · " + esc(r.season) : ""}</dd>
      ${r.program ? `<dt>Program</dt><dd>${esc(r.program)}${r.location ? " · " + esc(r.location) : ""}</dd>` : ""}
      ${r.date_of_birth ? `<dt>Date of birth</dt><dd>${esc(fmtDate(r.date_of_birth))} (age ${r._age ?? "?"}, ${esc(r._ageGroup || "")})</dd>` : ""}
      ${r.position ? `<dt>Position</dt><dd>${esc(r.position)}</dd>` : ""}
      ${r.experience_level ? `<dt>Experience</dt><dd>${esc(r.experience_level)}</dd>` : ""}
      ${r.guardian_name ? `<dt>Parent / guardian</dt><dd>${esc(r.guardian_name)}</dd>` : ""}
      <dt>Email</dt><dd>${esc(r.email || "—")}</dd>
      <dt>Phone</dt><dd>${esc(r.phone || "—")}</dd>
      ${r.uniform_size ? `<dt>Uniform</dt><dd>${esc(r.uniform_size)}${r.jersey_number ? " · #" + esc(r.jersey_number) : ""}${r.jersey_name ? " · " + esc(r.jersey_name) : ""}</dd>` : ""}
      <dt>Payment</dt><dd>${esc((PAYMENT[r.payment_status] || {}).label)}</dd>
      <dt>Waiver</dt><dd>${r.waiver_accepted ? "Accepted " + esc(fmtDateTime(r.waiver_accepted_at)) : "Not on file"}</dd>
      ${r.notes ? `<dt>Notes</dt><dd>${esc(r.notes)}</dd>` : ""}
      ${r.admin_notes ? `<dt>Admin notes</dt><dd>${esc(r.admin_notes)}</dd>` : ""}
      <dt>Registered</dt><dd>${esc(fmtDateTime(r.created_at))} via ${esc(r.source)}</dd>
    </dl></div>`).join("");
  printDoc(rows.length === 1 ? "Player Information" : "Player Information Cards", `${rows.length} player${rows.length === 1 ? "" : "s"}`, html);
}


/* =====================================================================
   EVENTS
   ===================================================================== */
function bindAppEvents() {
  window.addEventListener("hashchange", setRoute);

  $("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  $("#refreshBtn").addEventListener("click", () => loadAll(true).then(() => toast("Refreshed", "info")));
  $("#addBtn").addEventListener("click", () => openAddModal());
  $("#signOutBtn").addEventListener("click", () => sb.auth.signOut());

  let t;
  $("#globalSearch").addEventListener("input", (e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.search = e.target.value;
      if (state.route === "dashboard" || state.route === "sources") { if (state.search) goto("all"); }
      else render();
    }, 180);
  });

  // ---- Clicks anywhere ----
  document.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-goto],[data-open],[data-toggle-group],[data-action],[data-clear-filter],[data-clear-search],[data-clear-all],[data-print-group],[data-print-gear-group],[data-close-drawer],[data-save],[data-delete],[data-quick-paid],[data-print-one],[data-close-modal],[data-add-save],[data-bulk-pay],[data-bulk-export],[data-bulk-print],[data-bulk-clear]");
    if (!el) {
      if (e.target.id === "scrim") closeDrawer();
      if (e.target.matches("[data-modal]")) closeModal();
      return;
    }
    const d = el.dataset;

    if (d.goto !== undefined) { goto(d.goto, d.fkey ? { [d.fkey]: d.fval } : null); return; }

    if (d.toggleGroup !== undefined) {
      if (e.target.closest("button,input,select")) return;
      const vs = vstate(state.route);
      vs.collapsed.has(d.toggleGroup) ? vs.collapsed.delete(d.toggleGroup) : vs.collapsed.add(d.toggleGroup);
      el.closest(".group").classList.toggle("collapsed");
      return;
    }

    if (d.open !== undefined) {
      if (e.target.closest("a,input,select,button,label")) return;
      openDrawer(d.open); return;
    }

    if (d.action === "add") return openAddModal();
    if (d.action === "import") return openImportModal();
    if (d.action === "export") { const { def, rows } = currentListRows(state.route); return downloadCSV(rows, `foxes-${def.title}-${today()}.csv`); }
    if (d.action === "print-roster") return printRoster(state.route);
    if (d.action === "gear-export") return downloadCSV(gearRows(), `foxes-gear-${today()}.csv`, SHOP_COLS, false);
    if (d.action === "gear-print") return printGear();
    if (d.printGroup !== undefined) return printRoster(state.route, d.printGroup);
    if (d.printGearGroup !== undefined) return printGear(d.printGearGroup);

    if (d.clearFilter !== undefined) { delete vstate(state.route).filters[d.clearFilter]; return render(); }
    if (d.clearSearch !== undefined) { state.search = ""; $("#globalSearch").value = ""; return render(); }
    if (d.clearAll !== undefined) { vstate(state.route).filters = {}; state.search = ""; $("#globalSearch").value = ""; return render(); }

    if (d.closeDrawer !== undefined) return closeDrawer();
    if (d.closeModal !== undefined) return closeModal();

    if (d.quickPaid !== undefined) { if (await updateRows([d.quickPaid], { payment_status: "paid" })) openDrawer(d.quickPaid); return; }
    if (d.printOne !== undefined) return printCards([state.rows.find(r => r.id === d.printOne)]);

    if (d.save !== undefined) {
      const form = $("#drawerForm");
      const patch = readForm(form);
      if (!patch.player_name) { toast("Player name is required", "err"); return; }
      el.disabled = true;
      const ok = await updateRows([d.save], patch);
      el.disabled = false;
      if (ok) openDrawer(d.save);
      return;
    }
    if (d.delete !== undefined) {
      const r = state.rows.find(x => x.id === d.delete);
      if (!confirm(`Delete ${r.player_name}'s registration permanently?\n\nTip: set Status to "cancelled" instead if you want to keep a record.`)) return;
      const { error } = await sb.from("registrations").delete().eq("id", d.delete);
      if (error) return toast("Delete failed: " + error.message, "err");
      state.rows = state.rows.filter(x => x.id !== d.delete);
      state.selected.delete(d.delete);
      closeDrawer(); render(); toast("Registration deleted");
      return;
    }
    if (d.addSave !== undefined) {
      const rec = readForm($("#addForm"));
      if (!rec.player_name) { toast("Player name is required", "err"); return; }
      el.disabled = true;
      const { data, error } = await sb.from("registrations").insert({ ...rec, source: "manual" }).select().single();
      el.disabled = false;
      if (error) return toast("Couldn't save: " + error.message, "err");
      replaceRows([data]); closeModal(); render(); toast("Registration added");
      return;
    }

    if (d.bulkPay !== undefined) return updateRows([...state.selected], { payment_status: d.bulkPay });
    if (d.bulkExport !== undefined) return downloadCSV(selectedRows(), `foxes-selected-${today()}.csv`);
    if (d.bulkPrint !== undefined) return printCards(selectedRows());
    if (d.bulkClear !== undefined) { state.selected.clear(); return render(); }
  });

  // ---- Changes (filters, selects, checkboxes, inline edits) ----
  document.addEventListener("change", async (e) => {
    const el = e.target, d = el.dataset;
    const vs = vstate(state.route);
    if (d.filter !== undefined) { el.value ? (vs.filters[d.filter] = el.value) : delete vs.filters[d.filter]; return render(); }
    if (d.group !== undefined) { vs.group = el.value; vs.collapsed.clear(); return render(); }
    if (d.sort !== undefined) { vs.sort = el.value; return render(); }
    if (d.cancelled !== undefined) { vs.showCancelled = el.checked; return render(); }
    if (d.gear !== undefined) { gearState()[d.gear] = el.value; if (d.gear === "kind") Object.assign(gearState(), { program: "", location: "" }); return render(); }
    if (d.select !== undefined) { el.checked ? state.selected.add(d.select) : state.selected.delete(d.select); el.closest("tr").classList.toggle("selected", el.checked); return renderBulkbar(); }
    if (d.selectGroup !== undefined) {
      const box = el.closest(".group");
      $$("[data-select]", box).forEach(c => { c.checked = el.checked; el.checked ? state.selected.add(c.dataset.select) : state.selected.delete(c.dataset.select); c.closest("tr").classList.toggle("selected", el.checked); });
      return renderBulkbar();
    }
    if (d.bulkGear !== undefined) { if (el.value) await updateRows([...state.selected], { gear_status: el.value }); return; }
    if (d.inline !== undefined) {
      const val = el.value.trim() || null;
      const needsRerender = d.inline === "uniform_size";
      await updateRows([d.id], { [d.inline]: val }, { rerender: needsRerender });
      return;
    }
  });

  // Add a new registration type (Data Sources page)
  document.addEventListener("submit", async (e) => {
    if (e.target.id !== "kindForm") return;
    e.preventDefault();
    const f = readForm(e.target);
    const { error } = await sb.from("registration_kinds").insert({ key: f.key.toLowerCase(), label: f.label, sort_order: state.kinds.length + 1 });
    if (error) return toast("Couldn't add type: " + error.message, "err");
    toast(`Added “${f.label}”`);
    loadAll(true);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModal(); closeDrawer(); $("#sidebar").classList.remove("open"); }
    if (e.key === "/" && !e.target.closest("input,textarea,select")) { e.preventDefault(); $("#globalSearch").focus(); }
  });
}

// Live updates when someone registers while the admin is open
function startRealtime() {
  try {
    state.realtime = sb.channel("registrations-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "registrations" }, (payload) => {
        if (state.rows.some(r => r.id === payload.new.id)) return;
        replaceRows([payload.new]);
        toast(`New registration: ${payload.new.player_name}`, "info");
        const y = window.scrollY; render(); window.scrollTo(0, y);
      })
      .subscribe();
  } catch (_) { /* realtime is optional */ }
}


/* =====================================================================
   AUTH + STARTUP
   ===================================================================== */
const SCREENS = ["setup", "login", "recovery", "denied", "app"];
const screen = (name) => SCREENS.forEach(s => show($("#screen-" + s), s === name));

async function afterLogin(user) {
  state.user = user;
  const { data: isAdmin, error } = await sb.rpc("is_admin");
  if (error || !isAdmin) {
    $("#deniedEmail").textContent = user.email;
    screen("denied");
    return;
  }
  $("#userEmail").textContent = user.email;
  $("#userAvatar").textContent = (user.email || "A")[0].toUpperCase();
  screen("app");
  if (!state.bound) { bindAppEvents(); state.bound = true; startRealtime(); }
  state.route = "dashboard";
  await loadAll();
  setRoute();   // now that custom types are known, open the page in the URL
}

async function init() {
  const cfg = window.FOXES_SUPABASE || {};
  const configured = cfg.url && !/YOUR-PROJECT/.test(cfg.url) && cfg.anonKey && !/YOUR-ANON/.test(cfg.anonKey);
  if (!configured || !window.supabase) { screen("setup"); return; }

  const recovering = /type=recovery/.test(location.hash);
  sb = window.supabase.createClient(cfg.url, cfg.anonKey);

  sb.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") screen("recovery");
    if (event === "SIGNED_OUT") { state.rows = []; state.user = null; screen("login"); }
  });

  // Login
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    show($("#loginError"), false); show($("#loginInfo"), false);
    const btn = $("#loginBtn"); btn.disabled = true; btn.textContent = "Signing in…";
    const { data, error } = await sb.auth.signInWithPassword({ email: $("#loginEmail").value.trim(), password: $("#loginPassword").value });
    btn.disabled = false; btn.textContent = "Sign in";
    if (error) { $("#loginError").textContent = error.message; show($("#loginError")); return; }
    afterLogin(data.user);
  });
  $("#forgotBtn").addEventListener("click", async () => {
    const email = $("#loginEmail").value.trim();
    show($("#loginError"), false); show($("#loginInfo"), false);
    if (!email) { $("#loginError").textContent = "Type your email above first, then click “Forgot password?”."; show($("#loginError")); return; }
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    if (error) { $("#loginError").textContent = error.message; show($("#loginError")); return; }
    $("#loginInfo").textContent = "Check your email for a link to reset your password."; show($("#loginInfo"));
  });
  $("#recoveryForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const { data, error } = await sb.auth.updateUser({ password: $("#newPassword").value });
    if (error) { $("#recoveryError").textContent = error.message; show($("#recoveryError")); return; }
    history.replaceState(null, "", location.pathname);
    toast("Password updated");
    afterLogin(data.user);
  });
  $("#deniedSignOut").addEventListener("click", () => sb.auth.signOut());

  const { data: { session } } = await sb.auth.getSession();
  if (recovering) { screen("recovery"); return; }
  if (session) afterLogin(session.user); else screen("login");
}

init();
})();
