/* ==========================================================================
   Shell: header, fixed navigation bar, and view routing
   ========================================================================== */

/* Navigation tabs per role: [tab id, label, optional badge count] */
const NAV = {
  guidance: () => [
    [
      "today",
      "Overview",
      pend() + S.cases.filter((c) => c.st == "New").length + unread() + pendingStaff().length,
    ],
    ["cases", "Cases"],
    ["sched", "Appointment"],
    ["kids", "Learners"],
    ["forms", "Forms", GUIDANCE_FORMS.length + S.customForms.length],
    ["vault", "Records"],
    ["desk", "Helpdesk", unread()],
    ["staff", "Settings", pendingStaff().length],
  ],
  teacher: () => [
    ["refer", "Refer a pupil"],
    ["track", "Referral progress"],
    ["slips", "Call slips"],
    ["stats", "Class overview"],
  ],
  parent: () => [["portal", "My child"]],
};

/* Views per role. Guidance has one view per tab; the others handle tabs inside. */
const VIEWS = {
  guidance: {
    today: vToday,
    cases: vCases,
    sched: vSched,
    kids: vKids,
    vault: vVault,
    desk: vDesk,
    staff: vStaff,
    forms: vForms,
  },
  teacher: vTeacher,
  parent: vParent,
};

function renderHeader() {
  const u = S.user;
  $("side").innerHTML = `<div><div class="brand"><img class="brand-logo" src="kalinga-logo.png" alt="">KALINGA</div>
    <p class="school">Parent-Counselor Conference Management and Student Guidance Intervention System with Dual-Channel Notification and Document Digitization</p></div>
    <div class="who">${u ? `<span>${esc(u.name)}</span><button onclick="S.user=null;S.chat=null;render()">Log out</button>` : ""}</div>`;
}

function renderNav() {
  const u = S.user;
  const tabs = u ? NAV[u.role]() : [];
  /* A role with a single page (parents) does not need a navigation bar. */
  $("navbar").hidden = tabs.length < 2;
  $("nav").innerHTML = tabs
    .map(
      ([id, label, count]) =>
        `<button ${S.tab == id ? 'aria-current="page"' : ""} onclick="go('${id}')">${label}${count ? `<span class="badge">${count}</span>` : ""}</button>`,
    )
    .join("");
}

function currentView() {
  const u = S.user;
  if (!u) return S.pupil ? vPupil() : vAuth();
  const view = VIEWS[u.role];
  return (typeof view === "function" ? view : view[S.tab] || view.today)();
}

function render(focus) {
  renderHeader();
  renderNav();
  $("main").innerHTML = currentView();
  modal();
  const chat = $("cb");
  if (chat) chat.scrollTop = chat.scrollHeight;
  if (focus && $(focus)) $(focus).focus();
  else if (!S.modal) window.scrollTo(0, 0);
}

render();