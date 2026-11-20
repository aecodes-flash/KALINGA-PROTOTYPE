/* ---- guidance: today ---- */
function vToday() {
  const op = S.cases.filter((c) => c.st != "Closed"),
    u = op.filter((c) => c.u == "Urgent").length,
    tot = S.cases.length || 1,
    nw = S.cases.filter((c) => c.st == "New"),
    pr = S.appts.filter((a) => a.st == "Requested"),
    rq = S.appts.filter((a) => a.st == "Reschedule requested"),
    ch = S.chats.filter((c) => live(c) && c.msgs.length && c.msgs.at(-1).s === "p"),
    A = S.appts.length || 1,
    cf = S.appts.filter((a) => a.st == "Confirmed").length,
    rr = rq.length,
    pst = pendingStaff();
  return `<div class="top"><div><h2>Good day, Ma’am De Ocampo <span class="tag good" style="font-size:12px;vertical-align:middle;margin-left:6px;background:var(--primary);color:#fff">Guidance Super Admin</span></h2><p class="lede">Here is what needs your authorization and reply before the next bell.</p></div><button class="btn s o" onclick="window.print()">Print report</button></div>
  ${pst.length ? `<div class="note" style="border-left-color:var(--danger);background:var(--danger-light);margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><div><b style="color:var(--danger)">Super Admin Account Alert:</b> <b>${pst.length}</b> new school personnel requested access to the system.</div><button class="btn s" onclick="go('staff')">Review Personnel (${pst.length})</button></div>` : ""}
  <div class="cols a"><div class="blk"><h3>Caseload level</h3><div class="gauge"><div class="tank" role="img" aria-label="${op.length} of ${tot} cases open, ${u} urgent"><div class="w" style="height:${(op.length / tot) * 100}%"></div><div class="u" style="height:${(u / tot) * 100}%"></div></div>
  <div class="legend"><p><b>${op.length}</b>open of ${tot}</p><p><b style="color:var(--brick)">${u}</b>urgent</p><p><b>${S.chats.filter(live).length}</b>live chats</p></div></div></div>
  <div class="blk r"><h3>Needs you now</h3>
  ${pst.map((st) => `<div class="item"><div><b>${esc(st.name)}</b> wants to sign in as <span class="tag ${st.role == "guidance" ? "bad" : "warn"}">${st.role == "guidance" ? "Guidance Personnel" : "Teacher"}</span>${st.section ? " (" + esc(st.section) + ")" : ""}<br><span class="mute">Username: <b>${esc(st.u)}</b> · Email: ${esc(st.em || "None")} · Requested ${fmt(st.d || iso(0))}</span></div><div class="row2"><button class="btn s" onclick="apprStaff('${st.u}',true)">Approve</button><button class="btn s o" onclick="apprStaff('${st.u}',false)">Decline</button></div></div>`).join("")}
  ${nw.map((c) => `<div class="item"><div><b>${esc(pp(c.p).name)}</b>, ${esc(c.c)} ${c.u == "Urgent" ? '<span class="tag bad">Urgent</span>' : ""}<br><span class="mute">Referred by ${esc(c.by)} on ${fmt(c.d)}</span></div><button class="btn s" onclick="S.sel=${c.id};go('cases')">Open case</button></div>`).join("")}
  ${pr
    .map((a) => {
      const p = pp(apP(a));
      return `<div class="item"><div><b>${esc(p.name)}</b>’s parent requests a ${a.type.toLowerCase()}<br><span class="mute">${fmt(a.d)} at ${a.t}${taken(a.d, a.t, a.id) ? " (that slot is booked)" : ""}. “${esc(a.why || "")}”</span></div><div class="row2"><button class="btn s" onclick="apprReq(${a.id})">Approve</button><button class="btn s o" onclick="S.modal='dc${a.id}';render()">Decline</button></div></div>`;
    })
    .join("")}
  ${rq
    .map((a) => {
      const p = pp(apP(a));
      return `<div class="item"><div><b>${esc(p.name)}</b>’s parent asks to move the conference<br><span class="mute">${fmt(a.d)} ${a.t} to ${fmt(a.rq.d)} ${a.rq.t}. “${esc(a.rq.why)}”</span></div><div class="row2"><button class="btn s" onclick="resched(${a.id},1)">Approve</button><button class="btn s o" onclick="resched(${a.id},0)">Keep original</button></div></div>`;
    })
    .join("")}
  ${ch.map((c) => `<div class="item"><div><b>${esc(c.alias)}</b> is waiting for a reply<br><span class="mute">${esc(c.msgs.at(-1).t.slice(0, 80))}</span></div><button class="btn s" onclick="S.chat=${c.id};go('desk')">Reply</button></div>`).join("")}
  ${pst.length + nw.length + rq.length + ch.length + pr.length ? "" : '<p class="empty">Nothing waiting. Every referral, chat, and request is handled.</p>'}</div></div>
  <div class="blk y" style="margin-top:36px"><div class="item" style="padding-top:0"><h3 style="margin:0">Who is scheduled today</h3><button class="btn s o" onclick="S.day=iso(0);go('sched')">Open full agenda</button></div>${whoToday()}</div>
  <div class="blk" style="margin-top:36px"><h3>Conference RSVPs</h3>${bars(
    [
      ["Attended", S.appts.filter((a) => a.st == "Attended").length],
      ["Confirmed", cf],
      ["Waiting for parent", S.appts.filter((a) => a.st == "Delivered").length],
      ["Asked to reschedule", rr],
      ["No-show", S.appts.filter((a) => a.st == "No-show").length],
    ],
    "g",
  )}</div>
  ${analyticsSection()}`;
}
const whoToday = () =>
  SLOTS.map((t) => [t, S.appts.find((a) => a.d == iso(0) && a.t == t && AG.includes(a.st))])
    .filter((x) => x[1])
    .map(
      ([t, a]) =>
        `<div class="item"><div><b>${t}</b>, ${esc(pp(apP(a)).name)}<br><span class="mute">${a.type}, ${esc(a.loc || "Guidance Office")}. ${parentLine(a)}</span></div>${apTag(a)}</div>`,
    )
    .join("") || '<p class="empty">No conferences scheduled today.</p>';