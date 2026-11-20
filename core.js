window.addEventListener("error", (e) => {
  if (!document.body) return;
  let b = document.getElementById("jserr");
  if (!b) {
    b = document.createElement("div");
    b.id = "jserr";
    b.style.cssText =
      "position:fixed;left:0;right:0;top:0;z-index:999;background:#fef2f2;color:#dc2626;padding:8px 14px;font:600 13px sans-serif";
    document.body.prepend(b);
  }
  b.textContent = "Script error: " + e.message;
});

const $ = (i) => document.getElementById(i),
  esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ld = (d) =>
  d.getFullYear() +
  "-" +
  String(d.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(d.getDate()).padStart(2, "0");
const iso = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return ld(d);
};
const fmt = (s) =>
  new Date(s + "T00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const dig = (s) => String(s).replace(/\D/g, ""),
  norm = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-zñ ]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .sort()
      .join(" ");
const opt = (l, s) => l.map((x) => `<option ${x == s ? "selected" : ""}>${x}</option>`).join("");
const CONCERNS = [
  "Bullying",
  "Frequent absences",
  "Peer conflict",
  "Academic difficulty",
  "Anxiety or sadness",
  "Family concern",
  "Behavior in class",
];
const BTYPES = ["Physical", "Verbal", "Cyberbullying", "Social exclusion"],
  LOCS = ["Guidance Office", "Conference Room", "Classroom"],
  DOCCATS = ["Intake interview", "Anecdotal record", "Consent form", "Referral slip", "Other"],
  INSRC = ["Walk-in", "Teacher referral", "Parent request", "Helpdesk chat"];
const SLOTS = ["08:30 AM", "10:00 AM", "01:30 PM", "03:00 PM"],
  MOODS = ["Calm", "Anxious", "Upset", "Fearful"],
  WEEK = 7 * 864e5;
const ADV = {
  Sampaguita: "Teacher Cruz",
  Narra: "Teacher Cruz",
  Mabini: "Teacher Santos",
  Rosal: "Teacher Santos",
  Rizal: "Teacher Lim",
  Luna: "Teacher Lim",
  Dahlia: "Teacher Dela Rosa",
  Molave: "Teacher Dela Rosa",
  Bonifacio: "Teacher Garcia",
};
const P = [
  ["Mika Villanueva", "3 – Sampaguita"],
  ["Paolo Reyes", "4 – Narra"],
  ["Althea Mercado", "2 – Mabini"],
  ["Jerome Bautista", "5 – Rizal"],
  ["Sofia Navarro", "1 – Rosal"],
  ["Carlo Santos", "6 – Luna"],
  ["Bea Domingo", "3 – Sampaguita"],
  ["Lance Aquino", "3 – Dahlia"],
  ["Nina Ramos", "4 – Narra"],
  ["Marco Tolentino", "4 – Molave"],
  ["Ella Cruz", "2 – Mabini"],
  ["Rico Flores", "5 – Rizal"],
  ["Kyla Garcia", "5 – Bonifacio"],
  ["Daniel Pascual", "6 – Luna"],
  ["Hanna Lopez", "1 – Rosal"],
  ["Joshua Castro", "1 – Sampaguita"],
].map((x, i) => ({
  id: i + 1,
  lrn: "1070012300" + String(i + 1).padStart(2, "0"),
  name: x[0],
  gr: "Grade " + x[1],
}));
const sec = (p) => p.gr.split(" – ")[1],
  adv = (p) =>
    (S.staff || []).find((s) => s.role === "teacher" && s.status === "Active" && s.section === sec(p))?.name ||
    ADV[sec(p)] ||
    "Unassigned",
  pp = (id) => P.find((x) => x.id == id);
const t0 = Date.now();
const DEFAULT_STAFF = [
  {
    u: "guidance",
    pw: "demo",
    role: "guidance",
    name: "Ma’am De Ocampo (Guidance Lead)",
    em: "deocampo.guidance@sres.deped.gov.ph",
    isSuper: true,
    status: "Active",
    section: "",
    d: iso(-180),
  },
  {
    u: "teacher",
    pw: "demo",
    role: "teacher",
    name: "Teacher Cruz",
    em: "cruz.teacher@sres.deped.gov.ph",
    isSuper: false,
    status: "Active",
    section: "Sampaguita",
    d: iso(-120),
  },
];
const cloneStaff = () => DEFAULT_STAFF.map((s) => ({ ...s }));
let S = {
  user: null,
  pupil: false,
  tab: "today",
  sel: 2,
  q: "",
  fg: "",
  open: 0,
  chat: null,
  modal: null,
  mood: "Anxious",
  cat: "Bullying",
  seq: 60,
  ocr: null,
  busy: false,
  kid: 0,
  dq: "",
  auth: "in",
  authMsg: "",
  bk: { at: t0 - 18 * 36e5 },
  staff: cloneStaff(),
  cases: [
    {
      id: 1,
      p: 2,
      c: "Frequent absences",
      u: "Normal",
      st: "Ongoing",
      by: "Teacher Cruz",
      d: iso(-8),
      desc: "Absent 6 days this month.",
      notes: [{ d: iso(-5), t: "Agreed on a weekly attendance check-in." }],
    },
    {
      id: 2,
      p: 4,
      c: "Bullying",
      bt: "Physical",
      u: "Urgent",
      st: "New",
      by: "Teacher Lim",
      d: iso(-2),
      desc: "Pushing incident in the hallway near the Grade 5 room.",
      notes: [],
    },
    {
      id: 3,
      p: 1,
      c: "Academic difficulty",
      u: "Normal",
      st: "Closed",
      by: "Teacher Cruz",
      d: iso(-20),
      desc: "Struggling with English reading.",
      notes: [{ d: iso(-14), t: "Joined the remedial reading group." }],
    },
    {
      id: 4,
      p: 3,
      c: "Anxiety or sadness",
      u: "Normal",
      st: "Ongoing",
      by: "Teacher Santos",
      d: iso(-10),
      desc: "Often cries during the flag ceremony.",
      notes: [{ d: iso(-9), t: "First support session done." }],
    },
    {
      id: 5,
      p: 6,
      c: "Academic difficulty",
      u: "Normal",
      st: "Closed",
      by: "Teacher Lim",
      d: iso(-40),
      desc: "Needed math remediation.",
      notes: [],
    },
    {
      id: 6,
      p: 9,
      c: "Peer conflict",
      u: "Normal",
      st: "Closed",
      by: "Teacher Cruz",
      d: iso(-70),
      desc: "Argument over seating.",
      notes: [],
    },
    {
      id: 7,
      p: 12,
      c: "Bullying",
      bt: "Verbal",
      u: "Normal",
      st: "Closed",
      by: "Teacher Lim",
      d: iso(-72),
      desc: "Name-calling.",
      notes: [],
    },
    {
      id: 8,
      p: 5,
      c: "Family concern",
      u: "Normal",
      st: "Closed",
      by: "Teacher Santos",
      d: iso(-105),
      desc: "Parents separating.",
      notes: [],
    },
    {
      id: 9,
      p: 11,
      c: "Frequent absences",
      u: "Normal",
      st: "Closed",
      by: "Teacher Santos",
      d: iso(-135),
      desc: "Flooded home, missed class.",
      notes: [],
    },
  ],
  appts: [
    { id: 1, k: 1, type: "Parent conference", d: iso(2), t: "10:00 AM", st: "Delivered", rq: null },
    { id: 2, k: 4, type: "Parent conference", d: iso(3), t: "01:30 PM", st: "Delivered", rq: null },
    { id: 3, k: 2, type: "Guidance consultation", d: iso(1), t: "08:30 AM", st: "Confirmed", rq: null },
    {
      id: 4,
      k: 2,
      type: "Guidance consultation",
      d: iso(0),
      t: "03:00 PM",
      st: "Confirmed",
      rq: null,
      loc: "Guidance Office",
    },
  ],
  parents: [
    {
      id: 1,
      name: "Mr. Reyes",
      ph: "09170000002",
      pw: "demo",
      em: "reyes.family@gmail.com",
      pref: "SMS and email",
      kids: [2],
    },
    {
      id: 2,
      name: "Mrs. Villanueva",
      ph: "09170000001",
      pw: "demo",
      em: "villanueva.family@gmail.com",
      pref: "SMS and email",
      kids: [1],
    },
  ],
  sms: [
    {
      p: 2,
      w: "Today",
      d: iso(0),
      ch: "SMS",
      m:
        "San Roque ES Guidance: Call slip for Paolo Reyes. Please attend a parent conference on " +
        fmt(iso(2)) +
        " at 10:00 AM.",
      a: 1,
    },
    {
      p: 2,
      w: "Today",
      d: iso(0),
      ch: "Email",
      m:
        "Call slip for Paolo Reyes: parent conference on " +
        fmt(iso(2)) +
        " at 10:00 AM. Confirm in the Parent Portal.",
      a: 1,
    },
  ],
  obs: [
    { p: 5, d: iso(-4), t: "Quiet during group work. Will observe for two weeks." },
    { p: 11, d: iso(-1), t: "Doing well after moving to a new section." },
  ],
  old: [
    { p: 2, sy: "2024–2025", c: "Peer conflict", n: "Resolved after a parent conference." },
    { p: 6, sy: "2023–2024", c: "Academic difficulty", n: "Remediation completed. Case closed." },
    { p: 7, sy: "2024–2025", c: "Bullying", n: "Verbal teasing. Mediation done." },
    { p: 10, sy: "2023–2024", c: "Bullying", n: "Recess conflict. Resolved." },
    { p: 8, sy: "2023–2024", c: "Family concern", n: "Referred to the school nurse and parent." },
    { p: 13, sy: "2024–2025", c: "Frequent absences", n: "Attendance improved." },
    { p: 14, sy: "2025–2026", c: "Peer conflict", n: "Resolved after mediation." },
    { p: 15, sy: "2025–2026", c: "Bullying", n: "Name-calling. Parent conference held." },
    { p: 3, sy: "2025–2026", c: "Anxiety or sadness", n: "Support sessions completed." },
  ],
  docs: [
    {
      name: "Intake_Interview_Paolo_Reyes.pdf",
      d: iso(-2),
      lrn: "107001230002",
      text: "INTAKE INTERVIEW, SRES GUIDANCE OFFICE\nLRN 107001230002\nLearner: Paolo Reyes, Grade 4 – Narra\nConcern: Pushing incident during recess\nIntervention: Guidance Consultation.",
      cat: "Intake interview",
      pn: "Paolo Reyes",
    },
  ],
  chats: [
    {
      id: 1,
      code: "K-8392",
      pin: "1234",
      anon: true,
      alias: "Anonymous pupil",
      pid: 0,
      cat: "Bullying",
      mood: "Anxious",
      at: t0 - 864e5,
      keep: false,
      msgs: [{ s: "p", t: "Some classmates are spreading rumors in our group chat.", tm: "10:15 AM" }],
    },
    {
      id: 2,
      code: "K-4410",
      pin: "4321",
      anon: false,
      alias: "Paolo Reyes",
      pid: 2,
      cat: "Peer conflict",
      mood: "Upset",
      at: t0 - 3 * 864e5,
      keep: false,
      msgs: [
        { s: "p", t: "Older pupils pushed me during recess yesterday.", tm: "Yesterday" },
        { s: "g", t: "Thank you for telling us, Paolo. A call slip went to your parent.", tm: "Yesterday" },
      ],
    },
  ],
};
const KEY = "kalinga-v3";
const snap = () =>
  JSON.stringify({
    P,
    cases: S.cases,
    appts: S.appts,
    sms: S.sms,
    chats: S.chats,
    docs: S.docs,
    obs: S.obs,
    old: S.old,
    parents: S.parents,
    staff: S.staff,
    adv: ADV,
    seq: S.seq,
    bk: S.bk,
    customForms: S.customForms || [],
  });
function save() {
  try {
    localStorage.setItem(KEY, snap());
  } catch (e) {}
}
function load() {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem("kalinga-v2"));
    if (j) {
      P.length = 0;
      P.push(...j.P);
      delete j.P;
      Object.assign(S, j);
      if (j.adv) Object.assign(ADV, j.adv);
    }
  } catch (e) {}
  if (!S.staff || !S.staff.length) S.staff = cloneStaff();
  S.staff.forEach((s) => {
    if (!s.status) s.status = "Active";
    if (s.u === "guidance") {
      s.isSuper = true;
      if (!s.name.includes("Lead")) s.name = "Ma’am De Ocampo (Guidance Lead)";
    }
  });
}
function reset() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {}
  location.reload();
}
load();
/* Archived records need a date so they can be charted by month. */
const archiveDate = (sy, i) => {
  const y = +sy.slice(0, 4),
    m = [8, 9, 10, 11, 1, 2][i % 6];
  return (
    (m >= 6 ? y : y + 1) + "-" + String(m).padStart(2, "0") + "-" + String(10 + (i % 15)).padStart(2, "0")
  );
};
S.old.forEach((o, i) => {
  if (!o.d) o.d = archiveDate(o.sy, i);
});
S.sms.forEach((m) => {
  if (!m.d) {
    const appt = S.appts.find((a) => a.id == m.a);
    m.d = (appt && appt.d) || iso(0);
  }
});
if (location.hash == "#helpdesk") S.pupil = true;
const cs = (id) => S.cases.find((c) => c.id == id),
  parentOf = (id) => S.parents.find((x) => x.kids.includes(id)),
  exp = (c) => c.at + WEEK;
const live = (c) => exp(c) > Date.now();
function toast(m, ms) {
  const t = $("toast");
  t.textContent = m;
  t.classList.add("on");
  clearTimeout(toast.h);
  toast.h = setTimeout(() => t.classList.remove("on"), ms || 2800);
}
const go = (t) => {
  S.tab = t;
  render();
};
const APT = ["Delivered", "Confirmed", "Reschedule requested"],
  ref = (a) => "R-" + a.id;
const apP = (a) => a.p || cs(a.k).p,
  taken = (d, t, ig) => S.appts.some((a) => a.id != ig && a.d == d && a.t == t && APT.includes(a.st)),
  wkend = (d) => [0, 6].includes(new Date(d + "T00:00").getDay());
const slotOpts = (d, sel) =>
  SLOTS.map(
    (t) =>
      `<option ${taken(d, t) ? "disabled" : ""} ${t == sel ? "selected" : ""} value="${t}">${t}${taken(d, t) ? " (booked)" : ""}</option>`,
  ).join("");
const okDate = (d, ig, t) =>
  !d
    ? "Pick a date."
    : d < iso(0)
      ? "Pick today or a later date."
      : wkend(d)
        ? "The Guidance Office is closed on weekends. Pick a weekday."
        : t && taken(d, t, ig)
          ? "That time is already booked. Pick another slot."
          : "";
const nwd = (n) => {
  let i = n;
  while (wkend(iso(i))) i++;
  return iso(i);
};
const syOf = (d) => {
  const y = +d.slice(0, 4),
    m = +d.slice(5, 7);
  return m >= 6 ? y + "–" + (y + 1) : y - 1 + "–" + y;
};
const syRows = () => {
  const m = {};
  S.cases.forEach((c) => {
    const k = syOf(c.d);
    m[k] = (m[k] || 0) + 1;
  });
  S.old.forEach((o) => {
    m[o.sy] = (m[o.sy] || 0) + 1;
  });
  return Object.keys(m)
    .sort()
    .map((k) => ["SY " + k, m[k]]);
};
const btRows = (cl) => {
  const b = cl.filter((c) => c.c == "Bullying"),
    r = BTYPES.map((k) => [k, b.filter((c) => c.bt == k).length]),
    n = b.filter((c) => !BTYPES.includes(c.bt)).length;
  if (n) r.push(["Not specified", n]);
  return r;
};
const AG = [...APT, "Attended", "No-show"],
  parentLine = (a) => {
    const pa = parentOf(apP(a));
    return pa
      ? "Parent: " + esc(pa.name) + ", " + esc(pa.ph)
      : "No parent account yet (hand-deliver the slip)";
  };
const chDesc = (pa) => (pa ? pa.pref.toLowerCase() : "hand delivery");
function notify(pid, msg, aid, channels) {
  const pa = parentOf(pid),
    ch = pa
      ? channels || (pa.pref == "SMS only" ? ["SMS"] : pa.pref == "Email only" ? ["Email"] : ["SMS", "Email"])
      : [];
  if (!ch.length)
    S.sms.unshift({
      p: pid,
      w: "Just now",
      d: iso(0),
      ch: "None",
      m: msg + " (No parent account yet. The adviser will hand-deliver this slip.)",
      a: aid,
    });
  ch.forEach((c) => S.sms.unshift({ p: pid, w: "Just now", d: iso(0), ch: c, m: msg, a: aid }));
  return pa;
}
const unread = () => S.chats.filter((c) => live(c) && c.msgs.length && c.msgs.at(-1).s === "p").length,
  pend = () => S.appts.filter((a) => ["Reschedule requested", "Requested"].includes(a.st)).length;

/* Horizontal bar chart rows */
const bars = (rows, cls = "") => {
  const mx = Math.max(1, ...rows.map((r) => r[1]));
  return rows
    .map(
      ([k, v]) =>
        `<div class="bar"><span>${k}</span><i class="${cls}" style="width:${(v / mx) * 100}%"></i><b>${v}</b></div>`,
    )
    .join("");
};
/* Save any Blob as a downloaded file */
function saveBlob(name, blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
