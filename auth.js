/* ---- auth & personnel account control ---- */
let pendingParentLogin = 0;
const pendingStaff = () => (S.staff || []).filter((s) => s.status === "Pending");
const activeStaff = () => (S.staff || []).filter((s) => s.status === "Active");
function apprStaff(u, ok) {
  const st = (S.staff || []).find((s) => s.u.toLowerCase() === u.toLowerCase());
  if (!st) return;
  if (ok) {
    st.status = "Active";
    if (st.role === "teacher" && st.section) ADV[st.section] = st.name;
    toast(
      "Approved access for " +
        st.name +
        " (" +
        (st.role === "guidance" ? "Guidance Personnel" : "Teacher") +
        ").",
    );
  } else {
    st.status = "Declined";
    toast("Declined registration for " + st.name + ".");
  }
  save();
  render();
}
function toggleStaffStatus(u) {
  const st = (S.staff || []).find((s) => s.u.toLowerCase() === u.toLowerCase());
  if (!st || st.isSuper) return toast("Cannot modify master Super Admin account.");
  st.status = st.status === "Active" ? "Suspended" : "Active";
  toast(st.name + " account " + (st.status === "Active" ? "activated" : "suspended") + ".");
  save();
  render();
}
function delStaff(u) {
  const st = (S.staff || []).find((s) => s.u.toLowerCase() === u.toLowerCase());
  if (!st) return;
  if (st.isSuper) return toast("Cannot delete master Super Admin account.");
  if (!confirm("Permanently remove personnel account for " + st.name + "?")) return;
  S.staff = S.staff.filter((s) => s.u.toLowerCase() !== u.toLowerCase());
  toast("Account deleted.");
  save();
  render();
}
function demo(k) {
  $("lu").value = { g: "guidance", t: "teacher", p: "09170000002" }[k];
  $("lp").value = "demo";
}
function login(e) {
  e.preventDefault();
  try {
    loginGo();
  } catch (x) {
    const m = $("lerr");
    if (m) m.textContent = "Something went wrong: " + x.message;
  }
}
function loginGo() {
  const u = $("lu").value.trim().toLowerCase(),
    pw = $("lp").value;
  const s = (S.staff || DEFAULT_STAFF).find(
    (x) => (x.u.toLowerCase() == u || (x.em && x.em.toLowerCase() == u)) && x.pw == pw,
  );
  if (s) {
    if (s.status === "Pending")
      return ($("lerr").innerHTML =
        '<b style="color:var(--danger)">Access Pending Approval:</b> Your registration is awaiting review & authorization by the Guidance Lead (Super Admin). Please contact the Guidance Office.');
    if (s.status === "Declined")
      return ($("lerr").innerHTML =
        '<b style="color:var(--danger)">Access Declined:</b> This account request was declined by the Guidance Office.');
    if (s.status === "Suspended")
      return ($("lerr").innerHTML =
        '<b style="color:var(--danger)">Account Suspended:</b> This personnel account is currently deactivated.');
    S.user = { role: s.role, name: s.name, u: s.u, isSuper: !!s.isSuper };
    S.tab = s.role == "guidance" ? "today" : "refer";
    return render();
  }
  const pa = S.parents.find(
    (x) => ((dig(x.ph) == dig(u) && dig(u)) || (x.em && x.em.toLowerCase() == u)) && x.pw == pw,
  );
  if (pa) {
    if (pa.mustChangePw) {
      pendingParentLogin = pa.id;
      S.modal = "parentpw";
      return render();
    }
    S.user = { role: "parent", name: pa.name, pid: pa.id };
    S.kid = pa.kids[0];
    S.tab = "portal";
    return render();
  }
  $("lerr").textContent =
    "That username and password do not match. Use the demo buttons below to try a role.";
}

function finishParentPasswordChange(e) {
  e.preventDefault();
  const pa = S.parents.find((x) => x.id == pendingParentLogin),
    pw = $("parent_new_pw").value,
    confirmPw = $("parent_confirm_pw").value,
    err = $("parent_pw_err");
  if (!pa || !pa.mustChangePw) {
    pendingParentLogin = 0;
    S.modal = null;
    $("lerr").textContent = "Please sign in again to continue.";
    render();
    return;
  }
  if (pw.length < 6) return (err.textContent = "Use at least 6 characters for your new password.");
  if (pw === pa.pw) return (err.textContent = "Choose a password different from your temporary password.");
  if (pw !== confirmPw) return (err.textContent = "The passwords do not match.");
  pa.pw = pw;
  pa.mustChangePw = false;
  save();
  pendingParentLogin = 0;
  S.modal = null;
  S.user = { role: "parent", name: pa.name, pid: pa.id };
  S.kid = pa.kids[0];
  S.tab = "portal";
  toast("Password updated.");
  render();
}

function cancelParentPasswordChange() {
  pendingParentLogin = 0;
  S.modal = null;
  render();
}

const tempPassword = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  if (!window.crypto || !window.crypto.getRandomValues)
    throw new Error("Secure password generation is not available in this browser.");
  const bytes = new Uint8Array(6);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
};

function addParent(e) {
  e.preventDefault();
  if (!S.user || S.user.role !== "guidance") return toast("Only the Guidance Lead can create parent accounts.");
  const g = (id) => $(id).value.trim(),
    name = g("np_name"),
    ph = dig(g("np_mobile")),
    em = g("np_email").toLowerCase(),
    pref = $("np_pref").value,
    kids = Array.from(document.querySelectorAll('input[name="np_kids"]:checked')).map((x) => +x.value),
    err = $("np_err"),
    E = (message) => (err.textContent = message);
  if (!name) return E("Enter the parent or guardian’s full name.");
  if (!/^09\d{9}$/.test(ph)) return E("Mobile number must be 11 digits starting with 09.");
  if (!/^\S+@\S+\.\S+$/.test(em)) return E("Enter a valid email address.");
  if (S.parents.some((x) => dig(x.ph) === ph || (x.em && x.em.toLowerCase() === em)))
    return E("That mobile number or email is already on an account.");
  if (!kids.length) return E("Select at least one linked learner.");
  if (kids.some((id) => !pp(id))) return E("A selected learner could not be found. Refresh and try again.");
  const linked = kids.find((id) => parentOf(id));
  if (linked) return E(pp(linked).name + " is already linked to another parent account.");
  let pw;
  try {
    pw = tempPassword();
  } catch (x) {
    return E(x.message);
  }
  S.parents.push({ id: ++S.seq, name, ph, pw, em, pref, kids, mustChangePw: true });
  S.modal = null;
  save();
  toast("Parent account created. Print the slip or send credentials by SMS.");
  render();
}

function prepareParentDistribution(pa) {
  if (!pa.mustChangePw) {
    try {
      pa.pw = tempPassword();
    } catch (x) {
      toast(x.message);
      return false;
    }
    pa.mustChangePw = true;
  }
  return true;
}

function printParentSlip(id) {
  if (!S.user || S.user.role !== "guidance") return toast("Only the Guidance Lead can distribute parent credentials.");
  const pa = S.parents.find((x) => x.id == id);
  if (!pa || !pa.kids.length) return toast("This parent account has no linked learner.");
  const learners = pa.kids.map((kid) => pp(kid)).filter(Boolean);
  if (!learners.length) return toast("The linked learner could not be found.");
  const w = window.open("", "_blank");
  if (!w) return toast("Popup blocked. Allow popups to print the PTA account slip.", 4500);
  if (!prepareParentDistribution(pa)) {
    w.close();
    return;
  }
  save();
  w.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Parent Account Slip</title>
    <style>
      body{font:16px Arial,sans-serif;color:#172033;max-width:680px;margin:40px auto;padding:24px;border:1px solid #cbd5e1}
      h1{font-size:22px;margin:0 0 6px}h2{font-size:16px;margin:24px 0 8px}
      .school{color:#475569;margin-bottom:24px}.row{padding:10px 0;border-bottom:1px solid #e2e8f0}
      .label{display:inline-block;width:180px;color:#475569}.secret{font-size:20px;font-weight:bold;letter-spacing:2px}
      .notice{margin-top:24px;padding:12px;background:#f8fafc;border-left:4px solid #2563eb;font-size:13px;line-height:1.5}
      @media print{body{margin:0 auto;border:0}}
    </style></head><body><h1>Parent / Guardian Account</h1>
    <div class="school">San Roque Elementary School · Guidance Office</div>
    <div class="row"><span class="label">Parent / Guardian</span>${esc(pa.name)}</div>
    <div class="row"><span class="label">Linked learner(s)</span>${learners.map((p) => esc(p.name) + " — " + esc(p.gr)).join("<br>")}</div>
    <div class="row"><span class="label">Login ID (mobile)</span>${esc(pa.ph)}</div>
    <div class="row"><span class="label">Temporary password</span><span class="secret">${esc(pa.pw)}</span></div>
    <div class="notice"><b>Privacy notice (RA 10173):</b> Keep these login details private. Contact information and learner details are used by the school for guidance notices and related school services. Please change the temporary password the first time you sign in.</div>
    <script>window.onload=()=>window.print();</script></body></html>`);
  w.document.close();
}

function sendParentCredentials(id) {
  if (!S.user || S.user.role !== "guidance") return toast("Only the Guidance Lead can distribute parent credentials.");
  const pa = S.parents.find((x) => x.id == id);
  if (!pa || !pa.kids.length) return toast("This parent account has no linked learner.");
  const p = pp(pa.kids[0]);
  if (!p) return toast("The linked learner could not be found.");
  if (!prepareParentDistribution(pa)) return;
  notify(
    p.id,
    `San Roque Elementary School Guidance Office: Parent account for ${pa.name}. Login ID: ${pa.ph}. Temporary password: ${pa.pw}. Please change it after your first sign-in.`,
    null,
    ["SMS"],
  );
  save();
  toast("SMS credentials notice logged for " + pa.ph + ".");
  render();
}

function setParentPref(id, pref) {
  if (!S.user || S.user.role !== "guidance") return toast("Only the Guidance Lead can manage parent accounts.");
  const pa = S.parents.find((x) => x.id == id);
  if (!pa || !["SMS and email", "SMS only", "Email only"].includes(pref)) return;
  pa.pref = pref;
  save();
  toast("Notification preference saved.");
}

function delParent(id) {
  if (!S.user || S.user.role !== "guidance") return toast("Only the Guidance Lead can manage parent accounts.");
  const pa = S.parents.find((x) => x.id == id);
  if (!pa || !confirm("Permanently remove the parent account for " + pa.name + "?")) return;
  S.parents = S.parents.filter((x) => x.id !== pa.id);
  save();
  toast("Parent account removed.");
  render();
}

function vAuth() {
  return `
  <div class="cols b"><div class="blk">
  ${S.authMsg ? `<div class="note" style="border-left-color:var(--success);background:var(--success-light);margin-bottom:14px"><b>Notice:</b> ${esc(S.authMsg)}</div>` : ""}<form onsubmit="login(event)"><label>Username, mobile, or email<input id="lu" autocomplete="username"></label><label>Password<input id="lp" type="password" autocomplete="current-password"></label><p id="lerr" class="err" role="alert"></p><button class="btn y">Sign in</button>
  <p class="mute" style="margin-top:14px">Parent accounts are issued by the San Roque Elementary School Guidance Office during PTA meetings or through official SMS.</p>
  <p class="mute" style="margin-top:14px">Try a demo: <button type="button" class="lk" onclick="demo('g')">Guidance (Super Admin)</button>, <button type="button" class="lk" onclick="demo('t')">Class adviser</button>, <button type="button" class="lk" onclick="demo('p')">Parent</button> (password: demo)</p></form></div>
  <div class="blk y"><h3>Are you a pupil?</h3><p class="mute">No login, no name needed. Scan the QR poster outside the Guidance Room or start here.</p><button class="btn" onclick="S.pupil=true;S.chat=null;render()">chat to counselor</button>
  <p class="mute" style="margin-top:26px;max-width:46ch">Handled under the DepEd Child Protection Policy (DO 40, s. 2012) and the Data Privacy Act (RA 10173).</p></div></div>`;
}
