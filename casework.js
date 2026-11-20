/* ---- cases ---- */
function vCases() {
  const sy = viewSY(),
    recs = recordsFor(sy).sort((a, b) => b.d.localeCompare(a.d)),
    c = recs.find((x) => x.id == S.sel) || recs[0];
  if (!c)
    return `<div class="top"><div><h2>Cases</h2><p class="lede">Notes here are visible to guidance only. Advisers and parents never see them.</p></div><button class="btn y" style="margin:0 0 20px" onclick="S.modal='intake';render()">New intake interview</button></div>${schoolYearFilter()}<div class="blk"><p class="empty">No cases were recorded in SY ${sy}.</p></div>`;
  const
    p = pp(c.p),
    pa = parentOf(p.id),
    ap = S.appts.filter((a) => a.k == c.id && recordInSY(a.d, sy)),
    editable = isCurrentSY(sy) && !c.archived;
  return `<div class="top"><div><h2>Cases</h2><p class="lede">Notes here are visible to guidance only. Advisers and parents never see them.</p></div>${isCurrentSY(sy) ? `<button class="btn y" style="margin:0 0 20px" onclick="S.modal='intake';render()">New intake interview</button>` : ""}</div>${schoolYearFilter()}<div class="cols a"><div class="blk">
  ${recs.map((x) => `<div class="item ${x.id == c.id ? "sel" : ""}"><div><b>${pp(x.p).name}</b><br><span class="mute">${x.c}, ${fmt(x.d)}</span></div><span class="tag ${x.st}">${x.archived ? "Archived" : x.st}</span><button class="btn s o" onclick="S.sel='${x.id}';render()" aria-label="Open ${esc(pp(x.p).name)}">Open</button></div>`).join("")}</div>
  <div class="blk y"><h2 style="font-size:26px">${p.name}</h2><p class="mute">${p.gr}, LRN ${p.lrn}. Adviser ${adv(p)}. Parent: ${pa ? pa.name + ", " + pa.ph : "no account yet"}.</p>
  <p><b>${c.c}</b> ${c.u == "Urgent" ? '<span class="tag bad">Urgent</span>' : ""}<br>${esc(c.desc)}<br><span class="mute">Referred by ${esc(c.by)} on ${fmt(c.d)}</span></p>
  ${!editable ? '<div class="note">Archived case record. This record is read-only.</div>' : ""}
  ${editable && c.c == "Bullying" ? `<label for="bt">Type of bullying</label><select id="bt" onchange="cs(${c.id}).bt=this.value;save();toast('Saved.');render()"><option value="">Not specified</option>${BTYPES.map((b) => `<option ${c.bt == b ? "selected" : ""}>${b}</option>`).join("")}</select>` : ""}
  ${c.intake ? `<div class="note"><b>Intake interview</b> <span class="mute">via ${esc(c.intake.src)}</span><br><span class="mute">Home and background:</span> ${esc(c.intake.bg || "None noted")}<br><span class="mute">Plan:</span> ${esc(c.intake.plan || "None yet")}<br><span class="mute">Parent informed:</span> ${c.intake.informed}</div>` : ""}
  ${editable ? `<label for="st">Status</label><select id="st" onchange="cs(${c.id}).st=this.value;save();toast('Status set to '+this.value);render()">${opt(["New", "Ongoing", "Closed"], c.st)}</select>` : ""}
  <h3 style="margin-top:22px">Confidential anecdotal notes</h3>${(c.notes || []).map((n) => `<div class="note"><span class="mute">${fmt(n.d)}</span><br>${esc(n.t)}</div>`).join("") || `<p class="empty">${editable ? "No notes yet. Write what you observed in this session." : "No notes were saved for this archived record."}</p>`}
  ${editable ? `<textarea id="nn" rows="2" aria-label="New note"></textarea><button class="btn s o" style="margin-top:8px" onclick="addNote(${c.id})">Save note</button>` : ""}
  <h3 style="margin-top:26px">Scanned forms in the vault</h3>${
    S.docs
      .filter((d) => d.lrn == p.lrn && recordInSY(d.d, sy))
      .map(
        (d) =>
          `<div class="note"><b>${esc(d.name)}</b> <span class="tag good">${esc(d.cat || "Intake interview")}</span> <span class="mute">${fmt(d.d)}</span></div>`,
      )
      .join("") || `<p class="empty">No scanned forms for this pupil in SY ${sy}.</p>`
  }
  ${editable ? `<h3 style="margin-top:26px">Send a call slip</h3><div class="row2"><label>Type<select id="at">${opt(["Parent conference", "Parent-teacher-counselor conference", "Guidance consultation"])}</select></label><label>Language<select id="al"><option value="en">English</option><option value="fil">Filipino</option></select></label></div>
  <div class="row2"><label>Date<input id="ad" type="date" value="${iso(2)}" min="${iso(0)}"></label><label>Time<select id="atm">${opt(SLOTS)}</select></label></div>
  <label>Venue<select id="aloc">${opt(LOCS)}</select></label><button class="btn y" onclick="slip(${c.id})">Send call slip</button><p class="mute">Goes by ${pa ? pa.pref.toLowerCase() : "hand delivery (no parent account)"}.</p>
  ${ap.length ? `<p class="mute">Booked: ${ap.map((a) => `${a.type}, ${fmt(a.d)} ${a.t} (${a.st.toLowerCase()})`).join("; ")}</p>` : ""}` : `${ap.length ? `<p class="mute">Conferences in this school year: ${ap.map((a) => `${a.type}, ${fmt(a.d)} ${a.t} (${a.st.toLowerCase()})`).join("; ")}</p>` : ""}`}</div></div>`;
}
function addNote(id) {
  const v = $("nn").value.trim();
  if (!v) return toast("Write a note first.");
  const c = cs(id);
  c.notes.push({ d: iso(0), t: v });
  if (c.st == "New") c.st = "Ongoing";
  save();
  toast("Note saved.");
  render();
}
function schedFor(pid, k, type, d, t, fil, loc) {
  const p = pp(pid),
    e = okDate(d, 0, t),
    L = loc || "Guidance Office";
  if (e) {
    toast(e);
    return false;
  }
  const c = k ? cs(k) : S.cases.find((x) => x.p == pid && x.st != "Closed"),
    aid = ++S.seq;
  S.appts.push({ id: aid, k: c ? c.id : null, p: pid, type, d, t, loc: L, st: "Delivered", rq: null });
  if (c && c.st == "New") c.st = "Ongoing";
  const pa = notify(
    pid,
    fil
      ? `San Roque ES Guidance: Pinapatawag po ang magulang ni ${p.name} para sa ${type.toLowerCase()} sa ${fmt(d)}, ${t} (${L}). Kumpirmahin sa Parent Portal.`
      : `San Roque ES Guidance: Call slip for ${p.name}. Please attend a ${type.toLowerCase()} on ${fmt(d)} at ${t}, ${L}. Confirm in the Parent Portal.`,
    aid,
  );
  save();
  toast(
    pa
      ? "Scheduled. " + pa.name + " was notified by " + chDesc(pa) + "."
      : "Scheduled. No parent account yet, so hand-deliver the slip.",
  );
  return true;
}
function slip(id) {
  const c = cs(id);
  if (
    schedFor(c.p, id, $("at").value, $("ad").value, $("atm").value, $("al").value == "fil", $("aloc").value)
  )
    render();
}
function schedForm(e) {
  e.preventDefault();
  if (
    schedFor(
      +$("sp1").value,
      0,
      $("st1").value,
      $("sd1").value,
      $("stm").value,
      $("sl1").value == "fil",
      $("sloc").value,
    )
  )
    render();
}
function resched(id, yes) {
  const a = S.appts.find((x) => x.id == id),
    p = pp(apP(a));
  if (yes) {
    if (taken(a.rq.d, a.rq.t, a.id) || wkend(a.rq.d))
      return toast("That time is no longer free. Keep the original time or ask the parent to pick another.");
    a.d = a.rq.d;
    a.t = a.rq.t;
    a.st = "Confirmed";
    notify(
      p.id,
      `San Roque ES Guidance: Your request was approved. The conference for ${p.name} is now ${fmt(a.d)} at ${a.t}.`,
    );
  } else {
    a.st = "Delivered";
    notify(
      p.id,
      `San Roque ES Guidance: The original time for ${p.name} stays: ${fmt(a.d)}, ${a.t}. Please call the Guidance Office if you cannot attend.`,
    );
  }
  a.rq = null;
  save();
  toast(yes ? "New time approved. Parent notified." : "Original time kept. Parent notified.");
  render();
}
function apprReq(id) {
  const a = S.appts.find((x) => x.id == id),
    p = pp(apP(a));
  if (taken(a.d, a.t, a.id) || wkend(a.d))
    return toast("That slot is taken now. Decline and suggest another time.");
  a.st = "Confirmed";
  notify(
    p.id,
    `San Roque ES Guidance: Request ${ref(a)} is approved. ${a.type} for ${p.name} on ${fmt(a.d)} at ${a.t}.`,
  );
  save();
  toast("Approved. Parent notified.");
  render();
}
function doDecl(e, id) {
  e.preventDefault();
  const a = S.appts.find((x) => x.id == id),
    p = pp(apP(a)),
    r = $("dr").value.trim();
  if (!r) return toast("Give the parent a reason or a better time.");
  a.st = "Declined";
  a.why2 = r;
  notify(
    p.id,
    `San Roque ES Guidance: Request ${ref(a)} for ${p.name} could not be scheduled. ${r} You can send a new request in the Parent Portal.`,
  );
  S.modal = null;
  save();
  toast("Declined. Parent notified.");
  render();
}
const gw = (x) =>
  x.ch == "SMS"
    ? ' <span class="mute">via Twilio</span>'
    : x.ch == "Email"
      ? ' <span class="mute">via SMTP2GO</span>'
      : "";
function remind(id) {
  const a = S.appts.find((x) => x.id == id),
    p = pp(apP(a));
  notify(
    p.id,
    `San Roque ES Guidance: Reminder. ${a.type} for ${p.name} on ${fmt(a.d)} at ${a.t}, ${a.loc || "Guidance Office"}. Please confirm in the Parent Portal.`,
    a.id,
  );
  save();
  toast("Reminder sent.");
  render();
}
function mark(id, s) {
  S.appts.find((x) => x.id == id).st = s;
  save();
  toast("Marked " + s.toLowerCase() + ".");
  render();
}
const apTag = (a) =>
  `<span class="tag ${a.st == "Confirmed" || a.st == "Attended" ? "good" : a.st == "Declined" || a.st == "No-show" ? "bad" : a.st == "Delivered" ? "" : "warn"}">${a.st == "Requested" ? "Waiting for guidance" : a.st}</span>`;
const sent = (x) => (x.ch == "None" ? "" : '<span class="tag good">Sent</span>');
function dayView() {
  const d = S.day || iso(0);
  return SLOTS.map((t) => {
    const a = S.appts.find((x) => x.d == d && x.t == t && AG.includes(x.st));
    return `<div class="item"><b>${t}</b>${a ? `<div><b>${esc(pp(apP(a)).name)}</b><br><span class="mute">${a.type}, ${esc(a.loc || "Guidance Office")}<br>${parentLine(a)}</span></div>${apTag(a)}` : '<span class="tag good">Open</span>'}</div>`;
  }).join("");
}
function vSched() {
  const sy = viewSY(),
    archived = !isCurrentSY(sy),
    L = S.appts.filter((a) => recordInSY(a.d, sy)).sort((a, b) => a.d.localeCompare(b.d)),
    d0 = nwd(1);
  return `<h2>Schedule</h2><p class="lede">Book parents, approve their requests, and see which times are open. Parents get a message every time.</p>${schoolYearFilter()}
  ${archived ? '<div class="note" style="margin-bottom:18px">Historical conferences are shown read-only. Switch to the current school year to schedule or update appointments.</div>' : ""}
  ${archived ? "" : `<div class="cols b"><div class="blk y"><h3>Schedule a parent</h3><form onsubmit="schedForm(event)"><label style="margin-top:0">Pupil<select id="sp1">${P.map((p) => `<option value="${p.id}">${p.name}, ${p.gr}${parentOf(p.id) ? "" : " (no parent account)"}</option>`).join("")}</select></label>
  <div class="row2"><label>Type<select id="st1">${opt(["Parent conference", "Parent-teacher-counselor conference", "Guidance consultation"])}</select></label><label>Language<select id="sl1"><option value="en">English</option><option value="fil">Filipino</option></select></label></div>
  <div class="row2"><label>Date<input id="sd1" type="date" value="${d0}" min="${iso(0)}" oninput="$('stm').innerHTML=slotOpts(this.value)"></label><label>Time<select id="stm">${slotOpts(d0)}</select></label></div><label>Venue<select id="sloc">${opt(LOCS)}</select></label><button class="btn y">Schedule and notify parent</button></form></div>
  <div class="blk"><h3>Daily agenda</h3><label style="margin-top:0">Pick a date<input type="date" value="${S.day || iso(0)}" oninput="S.day=this.value;$('dv').innerHTML=dayView()"></label><div id="dv">${dayView()}</div></div></div>`}
  <div class="cols b" style="margin-top:20px"><div class="blk fm"><h3>Conferences in SY ${sy}</h3>
  ${L.map((a) => {
    const p = pp(apP(a));
    return `<div class="item"><div><b>${p.name}</b><br><span class="mute">${a.type}, ${fmt(a.d)} at ${a.t}, ${esc(a.loc || "Guidance Office")}${a.why ? ". “" + esc(a.why) + "”" : ""}</span></div>${apTag(a)}
  ${!archived && a.st == "Requested" ? `<div class="row2"><button class="btn s" onclick="apprReq(${a.id})">Approve</button><button class="btn s o" onclick="S.modal='dc${a.id}';render()">Decline</button></div>` : !archived && a.st == "Reschedule requested" ? `<div class="row2"><button class="btn s" onclick="resched(${a.id},1)">Approve ${fmt(a.rq.d)}, ${a.rq.t}</button><button class="btn s o" onclick="resched(${a.id},0)">Keep original</button></div>` : !archived && a.st == "Delivered" ? `<div class="row2"><button class="btn s o" onclick="remind(${a.id})">Send reminder</button></div>` : !archived && a.st == "Confirmed" && a.d <= iso(0) ? `<div class="row2"><button class="btn s" onclick="mark(${a.id},'Attended')">Attended</button><button class="btn s o" onclick="mark(${a.id},'No-show')">No-show</button></div>` : ""}</div>`;
  }).join("") || '<p class="empty">No conferences were recorded for this school year.</p>'}</div>
  <div class="blk y"><h3>Notices sent in SY ${sy}</h3>${S.sms.filter((x) => recordInSY(x.d, sy)).map((x) => `<div class="sms"><span class="ch">${x.ch}</span> ${sent(x)}${gw(x)} <span class="mute">${pp(x.p).name}, ${x.w}</span><br>${esc(x.m)}</div>`).join("") || '<p class="empty">No notices were recorded for this school year.</p>'}</div></div>`;
}
/* ---- learners ---- */
const pst = (id) => {
  const c = S.cases.filter((x) => x.p == id && recordInSY(x.d));
  const archived = S.old.some((o) => o.p == id && o.sy === viewSY());
  return c.some((x) => x.st == "New")
    ? ["New referral", "New"]
    : c.some((x) => x.st == "Ongoing")
      ? ["Ongoing case", "Ongoing"]
      : c.length || archived
        ? ["Past record", "Closed"]
        : ["No record", ""];
};
function kidRows() {
  const q = S.q.trim().toLowerCase(),
    sy = viewSY();
  return (
    P.filter((p) => (!q || (p.name + p.lrn).toLowerCase().includes(q)) && (!S.fg || p.gr.startsWith(S.fg)))
      .map((p) => {
        const s = pst(p.id),
          o = S.open == p.id,
          cases = recordsFor(sy).filter((x) => x.p == p.id),
          observations = S.obs.filter((x) => x.p == p.id && recordInSY(x.d, sy));
        return `<div class="item" style="display:block"><div class="item" style="border:0;padding:0"><div><b>${p.name}</b><br><span class="mute">${p.gr}, adviser ${adv(p)}, LRN ${p.lrn}</span></div>${s[1] ? `<span class="tag ${s[1]}">${s[0]}</span>` : `<span class="mute">${s[0]}</span>`}<button class="btn s o" onclick="S.open=${o ? 0 : p.id};$('kl').innerHTML=kidRows()" aria-expanded="${o}">${o ? "Hide" : "Details"}</button></div>
  ${
    o
      ? `<div class="note"><b>Cases in SY ${sy}</b>${cases
          .map((x) => `<br><span class="mute">${fmt(x.d)} · ${esc(x.c)} (${x.archived ? "Archived" : x.st})</span>${x.desc ? `<br>${esc(x.desc)}` : ""}`)
          .join("") || '<br><span class="mute">No case records.</span>'}</div><div class="note"><b>Observations in SY ${sy}</b>${
          observations.map((x) => `<br><span class="mute">${fmt(x.d)}</span> ${esc(x.t)}`).join("") ||
          '<br><span class="mute">None recorded.</span>'
        }</div>${!isCurrentSY(sy) ? "" : `<textarea id="ob${p.id}" rows="2" aria-label="New observation"></textarea><button class="btn s o" style="margin-top:8px" onclick="addObs(${p.id})">Save observation</button>`}`
      : ""
  }</div>`;
      })
      .join("") || '<p class="empty">No learner matches. Check the spelling or the 12-digit LRN.</p>'
  );
}
function addObs(id) {
  const v = $("ob" + id).value.trim();
  if (!v) return toast("Write an observation first.");
  S.obs.unshift({ p: id, d: iso(0), t: v });
  save();
  toast("Observation saved.");
  $("kl").innerHTML = kidRows();
}
function vKids() {
  return `<h2>Learners</h2><p class="lede">${P.length} enrolled pupils. Search by name or LRN.</p>${schoolYearFilter()}<div class="blk"><div class="row2"><label style="margin-top:0">Find a learner<input id="q" value="${esc(S.q)}" oninput="S.q=this.value;$('kl').innerHTML=kidRows()"></label>
  <label style="margin-top:0">Grade<select onchange="S.fg=this.value;$('kl').innerHTML=kidRows()"><option value="">All</option>${[1, 2, 3, 4, 5, 6].map((g) => `<option ${S.fg == "Grade " + g ? "selected" : ""} value="Grade ${g}">Grade ${g}</option>`).join("")}</select></label></div>
  <button class="btn s o" style="margin-top:10px" onclick="S.modal='addp';render()">Add a learner</button><div id="kl">${kidRows()}</div></div>`;
}
