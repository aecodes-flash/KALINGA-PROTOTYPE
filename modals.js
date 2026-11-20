/* ---- modals ---- */
function modal() {
  const m = S.modal;
  let h = "",
    isWide = false;
  const X = `<button class="btn o" type="button" onclick="S.modal=null;render()">Cancel</button>`;
  if (m && m.startsWith("rs"))
    h = `<h3>Ask for another time</h3><form onsubmit="doRs(event,${m.slice(2)})"><label>New date<input id="rd2" type="date" value="${nwd(4)}" min="${iso(1)}"></label><label>Time<select id="rt">${opt(SLOTS)}</select></label><label>Why can you not come?<textarea id="rw" rows="3"></textarea></label><div class="row2"><button class="btn y">Send request</button>${X}</div></form>`;
  if (m && m.startsWith("dc"))
    h = `<h3>Decline this request</h3><p class="mute">The parent gets your reason by message. Suggest another time if you can.</p><form onsubmit="doDecl(event,${m.slice(2)})"><label>Reason and a better time<textarea id="dr" rows="3"></textarea></label><div class="row2"><button class="btn y">Decline and notify</button>${X}</div></form>`;
  if (m === "id")
    h = `<h3>Share My Identity</h3><p class="mute">Only the guidance counselor will see this.</p><form onsubmit="doId(event)"><label>Full name<input id="in" autocomplete="off"></label><label>LRN (12 digits)<input id="il" inputmode="numeric" maxlength="12"></label><div class="row2"><label>Grade and section<select id="ig">${opt([...new Set(P.map((p) => p.gr))].sort())}</select></label><label>Class adviser<input id="ia" placeholder="Teacher Cruz"></label></div><div class="row2"><button class="btn y">Share my name</button><button class="btn o" type="button" onclick="S.modal=null;render()">Stay anonymous</button></div></form>`;
  if (m === "help")
    h = `<h3>How to use the helpdesk</h3><ol class="help-steps"><li>Choose how you are feeling and what you want to talk about.</li><li>Make a 4-digit PIN that you can remember, then write your message and tap <b>Send</b>.</li><li>Save the chat code shown on the next screen. To return later, tap <b>Continue my chat</b> and enter your code and PIN.</li><li>You can stay anonymous. Only share your identity if you want the counselor to know who you are.</li></ol><p class="mute">A counselor will read your message and reply here. Chats close after 7 days, so keep your code and PIN safe.</p><button class="btn o" type="button" onclick="S.modal=null;render()">Got it</button>`;
  if (m === "qr") {
    let svg = "";
    try {
      const q = qrcode(0, "M");
      q.addData(location.href.split("#")[0] + "#helpdesk");
      q.make();
      svg = q.createSvgTag({ cellSize: 6, margin: 0, scalable: true });
    } catch (e) {
      svg = '<p class="mute">The QR code could not be drawn.</p>';
    }
    h = `<h3>Helpdesk QR poster</h3><p class="mute">Print this and post it outside the Guidance Room. Pupils scan it with any phone. No login needed.</p><div class="qr" style="margin:12px auto">${svg}</div><p style="text-align:center;font-weight:700;margin:4px 0">Need to talk? Scan me.</p><p class="mute" style="text-align:center">Kalinga Helpdesk, San Roque Elementary School. You can stay anonymous.</p><div class="row2"><button class="btn y" onclick="printQr()">Print poster</button>${X}</div>`;
  }
  if (m === "intake")
    h = `<h3>New intake interview</h3><p class="mute">Replaces the paper logbook. Visible to guidance only.</p><form onsubmit="doIntake(event)"><label>Pupil<select id="ip">${P.map((p) => `<option value="${p.id}">${p.name}, ${p.gr}</option>`).join("")}</select></label>
    <div class="row2"><label>How did this come to us?<select id="is">${opt(INSRC)}</select></label><label>Urgency<select id="iu">${opt(["Normal", "Urgent"])}</select></label></div>
    <div class="row2"><label>Concern<select id="ic">${opt(CONCERNS)}</select></label><label>Type of bullying<select id="ib"><option value="">Not applicable</option>${BTYPES.map((b) => `<option>${b}</option>`).join("")}</select></label></div>
    <label>What the pupil shared<textarea id="id1" rows="3"></textarea></label><label>Home and background<textarea id="ibg" rows="2"></textarea></label><label>Plan and next step<textarea id="ipl" rows="2"></textarea></label>
    <label>Parent informed?<select id="iin">${opt(["Not yet", "Yes, by call slip", "Yes, in person"])}</select></label><div class="row2"><button class="btn y">Save intake</button>${X}</div></form>`;
  if (m === "resume")
    h = `<h3>Continue my chat</h3><form onsubmit="doResume(event)"><label>Your code<input id="rc2" placeholder="K-8392" autocapitalize="characters"></label><label>Your 4-digit PIN<input id="rpn" type="password" inputmode="numeric" maxlength="4"></label><p id="re" role="alert" class="err"></p><div class="row2"><button class="btn y">Open chat</button>${X}</div></form>`;
  if (m === "parentpw")
    h = `<h3>Set your new password</h3><p class="mute">For your privacy, change the temporary password before opening your Parent Portal. Use at least 6 characters.</p><form onsubmit="finishParentPasswordChange(event)"><label>New password<input id="parent_new_pw" type="password" autocomplete="new-password" required></label><label>Confirm new password<input id="parent_confirm_pw" type="password" autocomplete="new-password" required></label><p id="parent_pw_err" role="alert" class="err"></p><div class="row2"><button class="btn y">Save new password</button><button class="btn o" type="button" onclick="cancelParentPasswordChange()">Cancel</button></div></form>`;
  if (m === "newparent") {
    isWide = true;
    h = `<h3>Create Parent / Guardian Account</h3><p class="mute">For PTA distribution or official SMS. A secure 6-character temporary password will be generated automatically.</p>
      <form onsubmit="addParent(event)">
        <label>Parent / Guardian full name<input id="np_name" autocomplete="name" required></label>
        <div class="row2"><label>Mobile number (09XXXXXXXXX)<input id="np_mobile" type="tel" inputmode="numeric" maxlength="11" placeholder="09XXXXXXXXX" required></label><label>Email address<input id="np_email" type="email" autocomplete="email" required></label></div>
        <label>Preferred notification channel<select id="np_pref">${opt(["SMS and email", "SMS only", "Email only"], "SMS and email")}</select></label>
        <fieldset style="border:1px solid var(--line);border-radius:8px;padding:12px;margin:14px 0">
          <legend>Linked learners</legend>
          <div class="cols b">${P.map((p) => `<label style="display:flex;gap:8px;align-items:flex-start;font-weight:500"><input type="checkbox" name="np_kids" value="${p.id}" style="width:auto;min-height:0;margin-top:3px">${esc(p.name)}, ${esc(p.gr)}</label>`).join("")}</div>
        </fieldset>
        <p id="np_err" class="err" role="alert"></p>
        <div class="row2"><button class="btn y">Create parent account</button>${X}</div>
      </form>`;
  }
  if (m === "addp")
    h = `<h3>Add a learner</h3><form onsubmit="doAdd(event)"><label>Full name<input id="an"></label><label>LRN (12 digits)<input id="al2" inputmode="numeric" maxlength="12"></label><div class="row2"><label>Grade<select id="ag">${[1, 2, 3, 4, 5, 6].map((g) => `<option>${g}</option>`).join("")}</select></label><label>Section<input id="as"></label></div><div class="row2"><button class="btn y">Add learner</button>${X}</div></form>`;
  if (m === "newform" || (m && m.startsWith("editform_"))) {
    isWide = true;
    h = renderFormBuilder();
  }
  if (m && m.startsWith("gen_")) {
    const fid = m.replace("gen_", "");
    isWide = true;
    h = renderGenFormModal(fid);
  }
  if (m && m.startsWith("newstaff"))
    h = `<h3>Add School Personnel Account</h3><p class="mute">Directly create an authorized account for a guidance counselor or teacher.</p><form onsubmit="doAddStaff(event)"><label>Full name<input id="nst_name" placeholder="e.g. Teacher Maria Santos or Sir Ramos" required></label><div class="row2"><label>Role / Position<select id="nst_role" onchange="const b=$('nst_sec_wrap');if(b)b.style.display=this.value=='teacher'?'block':'none'"><option value="guidance">Guidance Personnel</option><option value="teacher">Teacher</option></select></label><label>Username / Employee ID<input id="nst_u" placeholder="e.g. jramos" required></label></div><div class="row2"><label>Email<input id="nst_em" type="email" placeholder="name@school.edu.ph" required></label><label>Initial password<input id="nst_pw" type="password" value="demo123" required></label></div><div id="nst_sec_wrap" style="display:none"><label>Advisory section (for Teachers)<select id="nst_sec"><option value="">All sections / Subject teacher</option>${["Sampaguita", "Narra", "Mabini", "Rosal", "Rizal", "Luna", "Dahlia", "Molave", "Bonifacio"].map((s) => `<option value="${s}">${s} (${(P.find((p) => sec(p) == s) || { gr: "" }).gr})</option>`).join("")}</select></label></div><p id="nst_err" class="err" role="alert"></p><div class="row2"><button class="btn y">Create active account</button>${X}</div></form>`;
  $("modal").innerHTML = h
    ? `<div class="ov" onclick="if(event.target===this){S.modal=null;render()}"><div class="dlg ${isWide ? "wide" : ""}" role="dialog" aria-modal="true">${h}</div></div>`
    : "";
  const f = $("modal").querySelector("input,select,textarea");
  if (f) f.focus();
}
function printQr() {
  document.body.classList.add("pq");
  window.print();
  setTimeout(() => document.body.classList.remove("pq"), 600);
}
function doIntake(e) {
  e.preventDefault();
  const t = $("id1").value.trim();
  if (!t) return toast("Write what the pupil shared.");
  const bg = $("ibg").value.trim(),
    pl = $("ipl").value.trim(),
    inf = $("iin").value,
    c = $("ic").value;
  S.cases.unshift({
    id: ++S.seq,
    p: +$("ip").value,
    c,
    bt: c == "Bullying" ? $("ib").value : "",
    u: $("iu").value,
    st: "Ongoing",
    by: "Guidance intake (" + $("is").value + ")",
    d: iso(0),
    desc: t,
    notes: [{ d: iso(0), t: "Intake interview done." + (pl ? " Plan: " + pl : "") }],
    intake: { src: $("is").value, bg, plan: pl, informed: inf },
  });
  S.sel = S.seq;
  S.modal = null;
  save();
  toast("Intake saved as a new case.");
  go("cases");
}
function doRs(e, id) {
  e.preventDefault();
  const a = S.appts.find((x) => x.id == id),
    d = $("rd2").value,
    w = $("rw").value.trim();
  const er = okDate(d, a.id, $("rt").value);
  if (er) return toast(er);
  if (!w) return toast("Add a reason.");
  a.st = "Reschedule requested";
  a.rq = { d, t: $("rt").value, why: w };
  const p = pp(apP(a)),
    pa = parentOf(p.id);
  notify(
    p.id,
    `San Roque ES Guidance: We received your request to move the conference for ${p.name} to ${fmt(d)} at ${$("rt").value}. The Guidance Office will reply soon.`,
  );
  S.flash = "Your request to move the conference was sent. A message went to you by " + chDesc(pa) + ".";
  S.modal = null;
  save();
  render();
}
function doId(e) {
  e.preventDefault();
  const n = $("in").value.trim(),
    l = dig($("il").value);
  if (!n || l.length !== 12) return toast("Enter your full name and your 12-digit LRN.");
  const c = S.chats.find((x) => x.id == S.chat),
    m = P.find((p) => p.lrn === l);
  c.anon = false;
  c.alias = n;
  c.pid = m ? m.id : 0;
  c.msgs.push({
    s: "p",
    t: `I want to share my name: ${n}, LRN ${l}, ${$("ig").value}, adviser ${$("ia").value.trim() || "not given"}.`,
    tm: now(),
  });
  S.modal = null;
  save();
  toast("Shared with the counselor.");
  render();
}
function doResume(e) {
  e.preventDefault();
  const code = $("rc2").value.trim().toUpperCase(),
    pin = $("rpn").value.trim(),
    c = S.chats.find((x) => x.code === code && x.pin === pin);
  if (!c) return ($("re").textContent = "That code and PIN do not match. Check both and try again.");
  if (!live(c)) return ($("re").textContent = "This chat closed after 7 days. Start a new one.");
  S.chat = c.id;
  S.modal = null;
  toast("Welcome back.");
  render();
}
function doAdd(e) {
  e.preventDefault();
  const n = $("an").value.trim(),
    l = dig($("al2").value),
    s = $("as").value.trim();
  if (!n || !s || l.length !== 12) return toast("Enter a name, a section, and a 12-digit LRN.");
  if (P.some((p) => p.lrn == l)) return toast("That LRN is already on the list.");
  P.push({
    id: Math.max(...P.map((p) => p.id)) + 1,
    lrn: l,
    name: n,
    gr: "Grade " + $("ag").value + " – " + s,
  });
  S.modal = null;
  save();
  toast(n + " added.");
  render();
}
function doAddStaff(e) {
  e.preventDefault();
  const g = (i) => ($(i) ? $(i).value.trim() : ""),
    name = g("nst_name"),
    role = g("nst_role"),
    u = g("nst_u").toLowerCase(),
    em = g("nst_em").toLowerCase(),
    pw = g("nst_pw"),
    section = $("nst_sec") ? $("nst_sec").value : "",
    E = (m) => ($("nst_err").textContent = m);
  if (!name) return E("Enter full name.");
  if (!u) return E("Enter username or Employee ID.");
  if (!/^[a-zA-Z0-9._-]+$/.test(u))
    return E("Username may only contain letters, numbers, dots, and hyphens.");
  if (!/^\S+@\S+\.\S+$/.test(em)) return E("Enter a valid email.");
  if (pw.length < 6) return E("Password needs at least 6 characters.");
  if ((S.staff || []).some((x) => x.u.toLowerCase() == u || (x.em && x.em.toLowerCase() == em)))
    return E("That username or email is already registered.");
  const st = {
    u,
    pw,
    role,
    name,
    em,
    section: role == "teacher" ? section : "",
    status: "Active",
    isSuper: false,
    d: iso(0),
  };
  (S.staff = S.staff || []).push(st);
  if (role == "teacher" && section) ADV[section] = name;
  S.modal = null;
  save();
  toast("Created active account for " + name + ".");
  render();
}
function vStaff() {
  const pending = pendingStaff(),
    active = (S.staff || []).filter((s) => s.status !== "Pending");
  return `<div class="top"><div><h2>School Personnel & Account Control</h2><p class="lede">Super Admin Command Center: Review access requests, authorize guidance personnel and teachers, and manage staff permissions under DepEd Child Protection Policy (DO 40, s. 2012).</p></div><button class="btn y" style="margin:0 0 20px" onclick="S.modal='newstaff';render()">+ Add personnel account</button></div>
    <div class="cols a"><div class="blk"><h3>Super Admin Control</h3><p class="mute">Under the Data Privacy Act (RA 10173), student counseling files are confidential. School staff must be authorized before accessing student records or intervention tracking.</p>
    <div class="note" style="margin-top:14px"><b>Direct Personnel Provisioning:</b><br><small class="mute">Teachers and Guidance staff do not register on the public sign-up page. Use the <b>+ Add personnel account</b> button above to create and authorize active accounts directly.</small></div>
    <div class="note" style="margin-top:10px"><b>Designated Super Admin:</b><br><span>${esc((S.staff.find((s) => s.isSuper) || {}).name || "Ma’am De Ocampo (Guidance Lead)")}</span><br><small class="mute">Holds primary administrative oversight over all accounts.</small></div></div>
    <div>
    ${
      pending.length
        ? `<div class="blk r" style="margin-bottom:24px"><div class="item" style="padding-top:0"><h3 style="margin:0;color:var(--danger)">Pending access requests (${pending.length})</h3><span class="tag bad">Action required</span></div>
    <p class="mute">The following school personnel have registered and are waiting for Super Admin authorization to sign in.</p>
    ${pending
      .map(
        (
          st,
        ) => `<div class="item"><div><b>${esc(st.name)}</b> <span class="tag ${st.role == "guidance" ? "bad" : "warn"}">${st.role == "guidance" ? "Guidance Personnel" : "Teacher"}</span>${st.section ? `<span class="tag good">Advisory: ${esc(st.section)}</span>` : ""}<br><span class="mute">Username: <b>${esc(st.u)}</b> · Email: ${esc(st.em || "None")} · Requested ${fmt(st.d || iso(0))}</span></div>
    <div class="row2"><button class="btn s" onclick="apprStaff('${st.u}',true)">Approve access</button><button class="btn s o" onclick="apprStaff('${st.u}',false)">Decline</button></div></div>`,
      )
      .join("")}</div>`
        : ""
    }
    <div class="blk"><div class="item" style="padding-top:0"><h3 style="margin:0">Active School Personnel Directory (${active.filter((s) => s.status === "Active").length})</h3></div>
    ${active
      .map(
        (
          st,
        ) => `<div class="item"><div><b>${esc(st.name)}</b> ${st.isSuper ? `<span class="tag good" style="background:var(--primary);color:#fff">Super Admin</span>` : `<span class="tag ${st.role == "guidance" ? "bad" : "warn"}">${st.role == "guidance" ? "Guidance Personnel" : "Teacher"}</span>`} <span class="tag ${st.status === "Active" ? "good" : st.status === "Declined" ? "bad" : "warn"}">${st.status}</span>${st.section ? `<span class="mute"> · Advisory: <b>${esc(st.section)}</b></span>` : ""}<br><span class="mute">Username: <code>${esc(st.u)}</code> · Email: ${esc(st.em || "None")}</span></div>
    ${!st.isSuper ? `<div class="row2"><button class="btn s o" onclick="toggleStaffStatus('${st.u}')">${st.status === "Active" ? "Suspend" : "Activate"}</button><button class="btn s o" style="color:var(--danger);border-color:var(--danger)" onclick="delStaff('${st.u}')">Remove</button></div>` : '<span class="mute" style="font-weight:600">Master Super Admin</span>'}</div>`,
      )
      .join("")}</div></div></div>
    <div class="blk" style="margin-top:24px"><div class="top"><div><h3 style="margin:0">Parent & Guardian Accounts (${S.parents.length})</h3><p class="mute" style="margin:4px 0 0">Issue accounts for PTA meetings or send temporary credentials by official SMS.</p></div><button class="btn y" onclick="S.modal='newparent';render()">+ Create parent account</button></div>
    ${S.parents.map((pa) => {
      const kids = pa.kids.map((id) => pp(id)).filter(Boolean);
      return `<div class="item"><div><b>${esc(pa.name)}</b><br><span class="mute">Login ID: ${esc(pa.ph)} · Email: ${esc(pa.em || "None")}<br>Linked learner(s): ${kids.map((p) => esc(p.name) + ", " + esc(p.gr)).join("; ") || "None"}</span><br><span class="tag ${pa.mustChangePw ? "warn" : "good"}">${pa.mustChangePw ? "Temporary password" : "Password updated"}</span></div>
        <div style="min-width:190px"><label style="margin-top:0;font-size:12px">Notifications<select onchange="setParentPref(${pa.id},this.value)">${opt(["SMS and email", "SMS only", "Email only"], pa.pref)}</select></label>
        <div class="row2"><button class="btn s o" onclick="printParentSlip(${pa.id})">Print PTA Account Slip</button><button class="btn s" onclick="sendParentCredentials(${pa.id})">Send credentials via SMS</button><button class="btn s o" style="color:var(--danger);border-color:var(--danger)" onclick="delParent(${pa.id})">Remove account</button></div></div></div>`;
    }).join("") || '<p class="empty">No parent accounts have been issued.</p>'}
    </div>`;
}
