/* ---- teacher (section-bound, no notes) ---- */
const mine = () => P.filter((p) => adv(p) == S.user.name);
function vTeacher() {
  const M = mine(),
    ids = M.map((p) => p.id),
    cl = S.cases.filter((c) => ids.includes(c.p)),
    ap = S.appts.filter((a) => ids.includes(apP(a))),
    T = S.tab;
  const body =
    T == "refer"
      ? `<div class="cols b"><div class="blk"><form onsubmit="refer(event)"><label for="rp" style="margin-top:0">Pupil in your section</label><select id="rp">${M.map((p) => `<option value="${p.id}">${p.name}, ${p.gr}</option>`).join("")}</select>
  <label for="rc">Concern</label><select id="rc">${opt(CONCERNS)}</select><label for="ru">Urgency</label><select id="ru">${opt(["Normal", "Urgent"])}</select><label for="rb">Type of bullying (only if bullying)</label><select id="rb"><option value="">Not applicable</option>${BTYPES.map((b) => `<option>${b}</option>`).join("")}</select><label for="rd">What did you see or hear?</label><textarea id="rd" rows="3" placeholder="Facts only: what happened, where, when."></textarea><button class="btn y">Send referral</button></form></div>
  <div class="blk y"><h3>Your class</h3><p class="mute">${M.map((p) => p.name).join(", ")}</p></div></div>`
      : T == "track"
        ? `<div class="blk"><h3>Referral progress</h3><p class="mute">You see status only. Counseling notes stay with the Guidance Office.</p>${cl.map((c) => `<div class="item"><div><b>${esc(pp(c.p).name)}</b><br><span class="mute">${esc(c.c)}${c.bt ? " (" + esc(c.bt) + ")" : ""}, referred ${fmt(c.d)}</span></div><span class="tag ${c.st}">${c.st}</span></div>`).join("") || '<p class="empty">No referrals for your section yet.</p>'}</div>`
        : T == "stats"
          ? `<div class="cols b"><div class="blk"><h3>Referrals by concern</h3>${
              bars(
                CONCERNS.map((k) => [k, cl.filter((c) => c.c == k).length])
                  .filter((r) => r[1])
                  .sort((a, b) => b[1] - a[1]),
              ) || '<p class="empty">No referrals yet.</p>'
            }</div>
  <div class="blk y"><h3>Referral status</h3>${bars(["New", "Ongoing", "Closed"].map((k) => [k, cl.filter((c) => c.st == k).length]))}</div></div>
  <div class="cols b" style="margin-top:20px"><div class="blk"><h3>Types of bullying</h3>${bars(btRows(cl))}</div><div class="blk y"><h3>Parent responses</h3>${bars(
    [
      ["Attended", ap.filter((a) => a.st == "Attended").length],
      ["Confirmed", ap.filter((a) => a.st == "Confirmed").length],
      ["Waiting for parent", ap.filter((a) => a.st == "Delivered").length],
      ["Asked to reschedule", ap.filter((a) => a.st == "Reschedule requested").length],
    ],
    "g",
  )}</div></div><p class="mute" style="margin-top:14px">Counts cover your own section only. Counseling notes stay with the Guidance Office.</p>`
          : `<div class="blk"><h3>Call slips for your class</h3>${ap.map((a) => `<div class="item"><div><b>${esc(pp(apP(a)).name)}</b><br><span class="mute">${a.type}, ${fmt(a.d)} at ${a.t}, ${esc(a.loc || "Guidance Office")}</span></div>${apTag(a)}</div>`).join("") || '<p class="empty">No call slips sent yet.</p>'}</div>`;
  return `<h2>${S.user.name}</h2><p class="lede">${M.length} pupils in ${[...new Set(M.map(sec))].join(" and ")}.</p>${body}`;
}
function refer(e) {
  e.preventDefault();
  const selected = $("rp") ? +$("rp").value : 0;
  if (!selected) return toast("Select a pupil before sending the referral.");
  if (!mine().some((p) => p.id === selected)) return toast("Select a pupil in your assigned section.");
  S.cases.unshift({
    id: ++S.seq,
    p: selected,
    c: $("rc").value,
    bt: $("rc").value == "Bullying" ? $("rb").value : "",
    u: $("ru").value,
    st: "New",
    by: S.user.name,
    d: iso(0),
    desc: $("rd").value.trim() || "No details added.",
    notes: [],
  });
  save();
  toast("Referral sent to the Guidance Office.");
  go("track");
}
/* ---- parent ---- */
function vParent() {
  const pa = S.parents.find((x) => x.id == S.user.pid),
    k = pa.kids.includes(S.kid) ? S.kid : pa.kids[0],
    p = pp(k),
    ap = S.appts.filter((a) => apP(a) == k).sort((a, b) => a.d.localeCompare(b.d)),
    lg = S.sms.filter((x) => x.p == k),
    fl = S.flash,
    d0 = nwd(1);
  S.flash = "";
  return `<h2>${pa.name}</h2><p class="lede">Conferences and notices about ${p.name}, ${p.gr}.</p>
  ${fl ? `<div class="note" style="border-left-color:var(--success);background:var(--success-light)" role="status"><b>Done.</b> ${esc(fl)}</div>` : ""}
  ${pa.kids.length > 1 ? `<div class="pills" style="margin:0 0 16px">${pa.kids.map((i) => `<button aria-pressed="${i == k}" onclick="S.kid=${i};render()">${pp(i).name}</button>`).join("")}</div>` : ""}
  <div class="cols b"><div class="blk y"><h3>Request a conference</h3><p class="mute">Pick a weekday and an open time. You get a message when we receive it and again when it is decided.</p>
  <form onsubmit="doReq(event)"><label style="margin-top:0">Type<select id="qy">${opt(["Parent conference", "Guidance consultation", "Parent-teacher-counselor conference"])}</select></label>
  <div class="row2"><label>Date<input id="qd" type="date" value="${d0}" min="${iso(0)}" oninput="$('qt').innerHTML=slotOpts(this.value)"></label><label>Time<select id="qt">${slotOpts(d0)}</select></label></div>
  <label>What would you like to talk about?<textarea id="qw" rows="3"></textarea></label><p id="qe" class="err" role="alert"></p><button class="btn">Send request</button></form></div>
  <div class="blk fm"><h3>Your conferences</h3>
  ${ap.map((a) => `<div class="item"><div><b>${a.type}</b><br>${fmt(a.d)} at ${a.t}, ${esc(a.loc || "Guidance Office")}<br>${apTag(a)}${a.rq ? ` <span class="mute">You asked for ${fmt(a.rq.d)}, ${a.rq.t}</span>` : ""}${a.st == "Requested" ? ` <span class="mute">Request ${ref(a)}</span>` : ""}${a.st == "Declined" ? `<br><span class="mute">${esc(a.why2 || "")}</span>` : ""}</div>${a.st == "Delivered" ? `<div class="row2"><button class="btn s" onclick="conf(${a.id})">I will attend</button><button class="btn s o" onclick="S.modal='rs${a.id}';render()">Ask for another time</button></div>` : ""}</div>`).join("") || '<p class="empty">No conferences yet. Send a request on the left.</p>'}</div></div>
  <div class="blk" style="margin-top:20px"><h3>Notices received</h3>${lg.map((l) => `<div class="sms"><span class="ch">${l.ch}</span> ${sent(l)} <span class="mute">${l.w}</span><br>${esc(l.m)}${l.ch == "Email" && l.a && (S.appts.find((x) => x.id == l.a) || {}).st == "Delivered" ? `<div class="row2" style="margin-top:8px"><button class="btn s" onclick="conf(${l.a})">I will attend</button><button class="btn s o" onclick="S.modal='rs${l.a}';render()">Ask for another time</button></div>` : ""}</div>`).join("") || '<p class="empty">No notices yet.</p>'}
  <label for="pf">Send my notices by</label><select id="pf" onchange="S.parents.find(x=>x.id==${pa.id}).pref=this.value;save();toast('Saved.')">${opt(["SMS and email", "SMS only", "Email only"], pa.pref)}</select></div>`;
}
function doReq(e) {
  e.preventDefault();
  const pa = S.parents.find((x) => x.id == S.user.pid),
    k = pa.kids.includes(S.kid) ? S.kid : pa.kids[0],
    p = pp(k),
    d = $("qd").value,
    t = $("qt").value,
    w = $("qw").value.trim(),
    ty = $("qy").value,
    E = (m) => ($("qe").textContent = m),
    er = okDate(d, 0, t);
  if (er) return E(er);
  if (!w) return E("Tell us briefly what the conference is about.");
  const c = S.cases.find((x) => x.p == k && x.st != "Closed"),
    a = { id: ++S.seq, k: c ? c.id : null, p: k, type: ty, d, t, st: "Requested", rq: null, why: w };
  S.appts.push(a);
  notify(
    k,
    `San Roque ES Guidance: We received your request ${ref(a)} for a ${ty.toLowerCase()} for ${p.name} on ${fmt(d)} at ${t}. The Guidance Office will confirm it soon.`,
  );
  S.flash = `Request ${ref(a)} was sent to the Guidance Office. A confirmation message went to you by ${chDesc(pa)}.`;
  save();
  render();
}
function conf(id) {
  const a = S.appts.find((x) => x.id == id),
    p = pp(apP(a)),
    pa = parentOf(p.id);
  a.st = "Confirmed";
  a.rq = null;
  notify(
    p.id,
    `San Roque ES Guidance: Thank you. We have your confirmation to attend the ${a.type.toLowerCase()} for ${p.name} on ${fmt(a.d)} at ${a.t}.`,
  );
  S.flash =
    "Attendance confirmed. The Guidance Office was told, and a message went to you by " + chDesc(pa) + ".";
  save();
  render();
}
