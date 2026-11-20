/* ---- chat ---- */
const bubbles = (c, me) =>
  c.msgs
    .map((m) => `<div class="m ${m.s == me ? "me" : "them"}">${esc(m.t)}<small>${m.tm}</small></div>`)
    .join("");
function vDesk() {
  const sy = viewSY(),
    archived = !isCurrentSY(sy),
    L = S.chats.filter((x) => x.at != null && recordInSY(ld(new Date(x.at)), sy)),
    c = L.find((x) => x.id == S.chat) || L[0];
  return `<div class="top"><div><h2>Helpdesk</h2><p class="lede">Chats from the QR poster. A pupil’s access closes after 7 days, but the encrypted record stays here.</p></div>${!archived ? `<button class="btn s o" onclick="S.modal='qr';render()">QR poster</button>` : ""}</div>${schoolYearFilter()}${archived ? '<div class="note" style="margin-bottom:18px">Historical helpdesk records are read-only.</div>' : ""}<div class="cols a"><div class="blk"><h3>Threads in SY ${sy}</h3>
  ${L.map((x) => `<div class="item ${c && x.id == c.id ? "sel" : ""}"><div><b>${esc(x.alias)}</b><br><span class="mute">${x.cat}, feeling ${x.mood.toLowerCase()}${live(x) ? "" : ", pupil access closed"}</span></div><span class="tag ${x.anon ? "warn" : "good"}">${x.anon ? "Anonymous" : "Identified"}</span><button class="btn s o" onclick="S.chat=${x.id};render()" aria-label="Open thread ${esc(x.alias)}">Open</button></div>`).join("") || `<p class="empty">No helpdesk threads in SY ${sy}.</p>`}</div>
  <div class="blk y">${
    c
      ? `<div class="item" style="padding-top:0"><div><h3>${esc(c.alias)}</h3><span class="mute">Code ${c.code}. ${c.anon ? "Anonymous Mode" : "Identity shared"}. ${live(c) ? "Pupil access ends " + new Date(exp(c)).toLocaleDateString("en-PH", { month: "short", day: "numeric" }) : "Pupil access closed."}${c.keep ? " Kept as a case." : ""} Encrypted.</span></div>${!archived ? `<button class="btn s y" onclick="toCase(${c.id})">Turn into a case</button>` : ""}</div>
  <div class="chat" id="cb">${bubbles(c, "g")}</div>${!archived && live(c) ? `<div class="send"><input id="gm" aria-label="Reply" placeholder="Write a reply" onkeydown="if(event.key==='Enter')gsend(${c.id})"><button class="btn" onclick="gsend(${c.id})">Send</button></div>` : archived ? '<p class="mute" style="margin-top:10px">Archived chat records are read-only.</p>' : '<p class="mute" style="margin-top:10px">This pupil’s 7-day access has closed, so replies are off. You can still read the record or turn it into a case.</p>'}`
      : '<p class="empty">Open a thread to read it.</p>'
  }</div></div>`;
}
function gsend(id) {
  if (!live(S.chats.find((c) => c.id == id))) return toast("This pupil’s access has closed.");
  const v = $("gm").value.trim();
  if (!v) return toast("Write a reply first.");
  S.chats.find((c) => c.id == id).msgs.push({ s: "g", t: v, tm: now() });
  save();
  render("gm");
}
function toCase(id) {
  const c = S.chats.find((x) => x.id == id);
  if (!c.pid) return toast("This pupil has not shared who they are yet. Ask them in the chat.");
  c.keep = true;
  S.cases.unshift({
    id: ++S.seq,
    p: c.pid,
    c: CONCERNS.includes(c.cat) ? c.cat : c.cat == "School stress" ? "Academic difficulty" : "Family concern",
    u: "Urgent",
    st: "New",
    by: "Helpdesk chat " + c.code,
    d: iso(0),
    desc: "Opened from a helpdesk chat. Pupil felt " + c.mood.toLowerCase() + ".",
    notes: [],
  });
  S.sel = S.seq;
  save();
  toast("Case opened.");
  go("cases");
}
function vPupil() {
  const c = S.chats.find((x) => x.id == S.chat && live(x));
  const top = `<div class="pup"><div class="pup-top"><button class="lk" onclick="S.pupil=false;S.chat=null;render()">Back to log in</button><button class="info-btn" type="button" aria-label="How to use the helpdesk" title="How to use the helpdesk" onclick="S.modal='help';render()">i</button></div><h2 style="margin-top:12px">You can tell us anything.</h2><p class="lede" style="margin-bottom:0">A counselor reads this. Nobody sees your name unless you choose to share it.</p></div>`;
  if (!c)
    return (
      top +
      `<div class="cols b"><div class="blk"><h3>How are you feeling?</h3><div class="pills">${MOODS.map((m) => `<button aria-pressed="${S.mood == m}" onclick="S.mood='${m}';render()">${m}</button>`).join("")}</div>
  <h3 style="margin-top:22px">What is it about?</h3><div class="pills">${["Bullying", "Peer conflict", "School stress", "Family concern"].map((m) => `<button aria-pressed="${S.cat == m}" onclick="S.cat='${m}';render()">${m}</button>`).join("")}</div>
  <button class="btn o" style="margin-top:24px" onclick="S.modal='resume';render()">Continue my chat</button></div>
  <div class="blk y"><h3>Start a chat</h3><label for="pn" style="margin-top:0">Pick a 4-digit PIN you will remember</label><input id="pn" type="password" inputmode="numeric" maxlength="4" autocomplete="off"><label for="pm">Your message</label><textarea id="pm" rows="3"></textarea>
  <p id="pe" class="err" role="alert"></p><button class="btn y" onclick="pstart()">Send</button><p class="mute">You will get a code like K-8392. Chats close by themselves after 7 days.</p></div></div>`
    );
  return (
    top +
    `<div class="cols b"><div class="blk"><h3>Your chat code</h3><span class="code">${c.code}</span> <span class="tag ${c.anon ? "warn" : "good"}">${c.anon ? "Anonymous Mode" : "Identity shared"}</span><p class="mute">Keep this and your PIN. Use them to come back until ${new Date(exp(c)).toLocaleDateString("en-PH", { month: "long", day: "numeric" })}.</p>
  ${c.anon ? `<button class="btn o" onclick="S.modal='id';render()">Share My Identity</button>` : `<p class="mute">The counselor knows you are ${esc(c.alias)}.</p>`}
  <button class="btn o" style="display:block" onclick="S.chat=null;render()">Close this chat on this screen</button></div>
  <div class="blk y"><h3>Chat</h3><div class="chat" id="cb">${bubbles(c, "p")}</div><div class="send"><input id="pm" aria-label="Your message" placeholder="Write here" onkeydown="if(event.key==='Enter')psend()"><button class="btn" onclick="psend()">Send</button></div></div></div>`
  );
}
function pstart() {
  const pin = $("pn").value.trim(),
    v = $("pm").value.trim();
  if (!/^\d{4}$/.test(pin)) return ($("pe").textContent = "Your PIN must be exactly 4 numbers.");
  if (!v) return ($("pe").textContent = "Write a message so the counselor knows how to help.");
  let code;
  do code = "K-" + (1000 + Math.floor(Math.random() * 9000));
  while (S.chats.some((x) => x.code == code));
  const c = {
    id: ++S.seq,
    code,
    pin,
    anon: true,
    alias: "Anonymous pupil",
    pid: 0,
    cat: S.cat,
    mood: S.mood,
    at: Date.now(),
    keep: false,
    msgs: [{ s: "p", t: v, tm: now() }],
  };
  S.chats.unshift(c);
  S.chat = c.id;
  save();
  render("pm");
  auto(c);
}
function auto(c) {
  setTimeout(() => {
    if (c.msgs.length == 1) {
      c.msgs.push({
        s: "g",
        t: "Thank you for telling us. You are safe here. A counselor will read this and reply soon.",
        tm: now(),
      });
      save();
      if (S.pupil) render("pm");
    }
  }, 1100);
}
function psend() {
  const v = $("pm").value.trim();
  if (!v) return toast("Write a message first.");
  const c = S.chats.find((x) => x.id == S.chat);
  c.msgs.push({ s: "p", t: v, tm: now() });
  save();
  render("pm");
}
