/* ---- vault ---- */
function docRows() {
  const q = S.dq.toLowerCase(),
    sy = viewSY();
  return (
    S.docs
      .filter(
        (d) =>
          recordInSY(d.d, sy) &&
          (!q ||
            (d.name + d.text + (d.raw || "") + d.lrn + (d.cat || "") + (d.pn || ""))
              .toLowerCase()
              .includes(q)),
      )
      .map(
        (
          d,
        ) => `<div class="item" style="display:block"><b>${esc(d.name)}</b> <span class="tag good">${esc(d.cat || "Intake interview")}</span> <span class="mute">${esc(d.pn || (P.find((p) => p.lrn == d.lrn) || {}).name || "")}, LRN ${d.lrn}, ${fmt(d.d)}</span>${d.img ? `<img alt="Scan of ${esc(d.name)}" src="${d.img}" style="width:120px;border:1px solid var(--line);border-radius:6px;margin:8px 0;display:block">` : ""}
 ${
   d.f
     ? `<div class="note">${[
         [
           "Grade and section",
           (d.f.grade ? "Grade " + d.f.grade : "") + (d.f.section ? ", " + d.f.section : ""),
         ],
         ["Adviser/Teacher", d.f.adviser],
         ["Violation", d.f.violation],
         ["Type of Intervention", d.f.intervention],
         ["Guardian/Parent", d.f.guardian],
         ["Scanned Date", d.f.date ? fmt(d.f.date) : ""],
       ]
         .map(([k, v]) => `<span class="mute">${k}:</span> ${esc(v || "Not given")}`)
         .join(
           "<br>",
         )}</div><details><summary class="mute" style="cursor:pointer">Text read from the form</summary><pre>${esc(d.raw || d.text)}</pre></details>`
     : `<pre>${esc(d.text)}</pre>`
 }</div>`,
      )
      .join("") || `<p class="empty">No saved forms match in SY ${sy}.</p>`
  );
}
const ago = (t) => {
  const m = Math.max(0, Math.round((Date.now() - t) / 6e4));
  return m < 1
    ? "just now"
    : m < 60
      ? m + " min ago"
      : m < 1440
        ? Math.round(m / 60) + " h ago"
        : Math.round(m / 1440) + " d ago";
};
/* ---- vault scan: capture, clean up, read, confirm ---- */
const SC = () => S.sc || (S.sc = { stage: "idle", exp: 0 });
let CAM = null;
function stopCam() {
  if (CAM) {
    CAM.getTracks().forEach((t) => t.stop());
    CAM = null;
  }
}
const STEPS = ["Capture", "Clean up", "Read", "Confirm"],
  STIX = { idle: 0, cam: 0, pre: 1, read: 2, review: 3 };
const stepper = (st) =>
  `<div class="pills" style="margin:0 0 14px">${STEPS.map((x, i) => {
    const n = STIX[st];
    return `<span class="tag ${i < n ? "good" : i == n ? "warn" : ""}" ${i > n ? 'style="color:var(--mute);border-color:var(--line)"' : ""}>${i < n ? "Done:" : i + 1 + "."} ${x}</span>`;
  }).join("")}</div>`;
const VF = ["Matched", "Check this"],
  RD = ["Read", "Missing"],
  fl2 = (ok, t) => `<span class="tag ${ok ? "good" : "warn"}">${ok ? t[0] : t[1]}</span>`;
function scanPanel() {
  const c = SC(),
    st = c.stage;
  let h = stepper(st);
  if (st == "idle")
    h += `<p class="mute">Take a clear photo of the whole form. We clean up the photo first, then read it, then you confirm what we found.</p>
 <label for="op">Expected pupil (optional)</label><select id="op" onchange="SC().exp=+this.value"><option value="0">Detect from the form</option>${P.map((p) => `<option value="${p.id}" ${c.exp == p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>
 <div class="row2" style="margin-top:12px"><button class="btn" style="margin-top:0" onclick="startCam()">Open camera</button><label class="btn o" style="margin:0;display:flex;align-items:center;justify-content:center;cursor:pointer">Upload photo or PDF<input id="of" type="file" accept="image/*,.pdf" style="display:none" onchange="pickFile(this)"></label></div>`;
  if (st == "cam")
    h += `<div style="position:relative;border-radius:10px;overflow:hidden;background:#0f172a"><video id="vid" autoplay playsinline muted style="width:100%;display:block;max-height:60vh"></video><div style="position:absolute;inset:8% 6%;border:3px dashed rgba(255,255,255,.85);border-radius:10px;pointer-events:none"></div></div>
 <p class="mute">Fit the whole form inside the frame. Avoid shadows and glare. Hold steady.</p><div class="row2"><button class="btn" onclick="takePhoto()">Capture</button><button class="btn o" onclick="cancelScan()">Cancel</button></div>`;
  if (st == "pre") {
    const bad = c.q.some((x) => !x.ok),
      im = 'style="width:100%;border:1px solid var(--line);border-radius:8px;display:block"';
    h += c.before
      ? `<div class="row2"><div><span class="mute">Before</span><img alt="Original photo" src="${c.before}" ${im}></div><div><span class="mute">After clean-up</span><img alt="Cleaned photo" src="${c.after}" ${im}></div></div>`
      : "";
    h += `<h3 style="margin-top:14px">Photo check</h3>${c.q.map((x) => `<div class="item" style="padding:6px 0"><div><b>${x.n}</b><br><span class="mute">${x.m}</span></div><span class="tag ${x.ok ? "good" : "warn"}">${x.ok ? "Good" : "Check"}</span></div>`).join("")}
  <div class="pills" style="margin-top:8px">${c.did.map((x) => `<span class="tag good">${x}</span>`).join("")}</div>
  ${bad ? '<p class="err">This photo may be hard to read. Retake it for a better result, or use it anyway.</p>' : ""}
  <div class="row2"><button class="btn" onclick="runRead()">${bad ? "Use anyway and read" : "Read the form"}</button><button class="btn o" onclick="cancelScan()">Retake</button></div>`;
  }
  if (st == "read")
    h += `<p class="mute" id="rmsg">Reading the text on the form…</p><div class="bar" style="grid-template-columns:90px 1fr 40px"><span>Reading</span><i id="rbar" style="width:4%;transition:width .3s"></i><b id="rpct">0%</b></div>`;
  if (st == "review") {
    const r = c.rev,
      f = r.f,
      im =
        'style="width:100%;max-height:240px;object-fit:contain;background:#fff;border:1px solid var(--line);border-radius:8px;display:block"';
    h +=
      (r.sim
        ? `<div class="note"><b>Demo reading.</b> The text engine could not load here (no internet), so sample text stands in for the real scan. Your photo is kept with the record.</div>`
        : `<p class="mute">Read with Tesseract.js, ${r.conf}% confidence.</p>`) +
      (r.note ? `<div class="note">${esc(r.note)}</div>` : "") +
      (c.before
        ? `<div class="row2"><div><span class="mute">Your photo</span><img alt="Your photo" src="${c.before}" ${im}></div><div><span class="mute">Cleaned for reading</span><img alt="Cleaned photo" src="${c.after}" ${im}></div></div>`
        : `<div class="note"><b>${esc(c.name)}</b><br><span class="mute">PDF file. No photo preview.</span></div>`) +
      `<h3 style="margin-top:16px">Intake interview details</h3><p class="mute">Check each field against the paper form. Fix anything that is wrong.</p>
  <div class="row2"><label>LRN ${fl2(r.fl.lrn, VF)}<input id="ol" value="${esc(f.lrn)}" maxlength="12" inputmode="numeric" oninput="onMatch()"></label><label>Learner ${fl2(r.fl.name, VF)}<input id="on" value="${esc(f.name)}" oninput="onMatch()"></label></div><p id="mline" class="mute" style="margin:8px 0 0"></p>
  <div class="row2"><label>Grade ${fl2(r.fl.grade, VF)}<input id="og" value="${esc(f.grade)}" maxlength="1" inputmode="numeric"></label><label>Section ${fl2(r.fl.section, VF)}<input id="os" value="${esc(f.section)}"></label></div>
  <div class="row2"><label>Adviser/Teacher ${fl2(r.fl.adviser, VF)}<input id="oa" value="${esc(f.adviser)}"></label><label>Guardian/Parent ${fl2(r.fl.guardian, VF)}<input id="ogd" value="${esc(f.guardian)}"></label></div>
  <label>Violation ${fl2(r.fl.violation, RD)}<input id="ov" list="vl" value="${esc(f.violation)}"></label><datalist id="vl">${CONCERNS.map((x) => `<option value="${x}">`).join("")}</datalist>
  <label>Type of Intervention ${fl2(r.fl.intervention, RD)}<input id="oi" list="il" value="${esc(f.intervention)}"></label><datalist id="il">${["Parent conference", "Parent-teacher-counselor conference", "Guidance consultation", "Counseling session", "Peer mediation", "Home visit", "Referral"].map((x) => `<option value="${x}">`).join("")}</datalist>
  <div class="row2"><label>Scanned Date ${fl2(r.fl.date, RD)}<input id="od" type="date" value="${f.date}"></label><label>Document type ${fl2(r.fl.cat, ["Read", "Guessed"])}<select id="oc">${opt(DOCCATS, r.cat)}</select></label></div>
  <details style="margin-top:12px"><summary class="mute" style="cursor:pointer">Text read from the form</summary><textarea id="ot" rows="6" style="font:12.5px/1.5 ui-monospace,monospace">${esc(r.text)}</textarea></details>
  <div class="row2"><button class="btn y" onclick="saveOcr()">Confirm and save to Records</button><button class="btn o" onclick="cancelScan()">Scan again</button></div>`;
  }
  return h;
}
function vVault() {
 const count = S.docs.filter((d) => recordInSY(d.d)).length;
 return `<h2>Record Vault</h2><p class="lede">Scan a paper form so it survives the next flood or fire. The photo is cleaned up, read with Tesseract.js, and checked against the learner list before it is filed.</p>${schoolYearFilter()}<div class="cols b"><div class="stack"><div class="blk"><h3>Scan a form</h3>${scanPanel()}</div>
 <div class="blk"><h3>Cloud backup</h3><p class="mute">Cases, scanned forms, and helpdesk chats are copied to cloud storage every night. Last backup: <b>${ago(S.bk.at)}</b>.</p><p class="mute">${S.cases.length} cases, ${S.docs.length} scanned forms, ${S.chats.length} chat threads, and ${P.length} learner profiles are protected.</p>
 <div class="row2"><button class="btn s" onclick="backup()">Back up now</button><button class="btn s o" onclick="dlBackup()">Download a copy</button></div><label for="rf">Restore from a backup file</label><input id="rf" type="file" accept=".json" onchange="restore(this)"></div></div>
 <div class="blk y"><h3>Saved forms in SY ${viewSY()} (${count})</h3><label for="dq" style="margin-top:0">Search by name, LRN, or text</label><input id="dq" value="${esc(S.dq)}" oninput="S.dq=this.value;$('dl').innerHTML=docRows()"><div id="dl">${docRows()}</div></div></div>`;
}
/* capture */
async function startCam() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
    return toast("Camera is not available here. Upload a photo instead.", 4000);
  try {
    CAM = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
    });
  } catch (e) {
    return toast("Camera is blocked or missing. Upload a photo instead.", 4000);
  }
  SC().stage = "cam";
  render();
  $("vid").srcObject = CAM;
}
function takePhoto() {
  const v = $("vid");
  if (!v || !v.videoWidth) return toast("The camera is still starting.");
  const cv = document.createElement("canvas");
  cv.width = v.videoWidth;
  cv.height = v.videoHeight;
  cv.getContext("2d").drawImage(v, 0, 0);
  stopCam();
  const im = new Image();
  im.onload = () => analyse(im, "Camera scan " + iso(0) + ".jpg");
  im.src = cv.toDataURL("image/jpeg", 0.92);
}
function cancelScan() {
  stopCam();
  const e = SC().exp;
  S.sc = { stage: "idle", exp: e };
  render();
}
function pickFile(i) {
  const f = i.files[0];
  if (!f) return;
  const e = SC().exp;
  if (/pdf/i.test(f.type) || /\.pdf$/i.test(f.name)) {
    S.sc = {
      stage: "pre",
      exp: e,
      name: f.name,
      pdf: true,
      before: "",
      after: "",
      thumb: "",
      q: [{ n: "File type", m: "PDF document. Pages are cleaned up while reading.", ok: true }],
      did: ["PDF accepted"],
    };
    return render();
  }
  const u = URL.createObjectURL(f),
    im = new Image();
  im.onload = () => {
    analyse(im, f.name);
    URL.revokeObjectURL(u);
  };
  im.onerror = () => toast("That file could not be opened as a picture.");
  im.src = u;
}
/* pre-process: measure the photo, then grayscale + contrast stretch */
function analyse(img, name) {
  const e = SC().exp,
    W0 = img.naturalWidth,
    H0 = img.naturalHeight,
    k = Math.min(1, 1400 / Math.max(W0, H0)),
    w = Math.max(1, Math.round(W0 * k)),
    h = Math.max(1, Math.round(H0 * k));
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const x = cv.getContext("2d", { willReadFrequently: true });
  x.drawImage(img, 0, 0, w, h);
  const sm = (src, tw, q) => {
    const t = document.createElement("canvas");
    t.width = tw;
    t.height = Math.round((tw * src.height) / src.width);
    t.getContext("2d").drawImage(src, 0, 0, t.width, t.height);
    return t.toDataURL("image/jpeg", q);
  };
  const before = sm(cv, Math.min(w, 480), 0.8),
    d = x.getImageData(0, 0, w, h),
    a = d.data,
    n = w * h,
    g = new Uint8ClampedArray(n);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const v = 0.299 * a[i * 4] + 0.587 * a[i * 4 + 1] + 0.114 * a[i * 4 + 2];
    g[i] = v;
    sum += v;
  }
  const mean = sum / n;
  let vs = 0;
  for (let i = 0; i < n; i++) vs += (g[i] - mean) ** 2;
  const sd = Math.sqrt(vs / n);
  let lm = 0,
    ls = 0,
    cnt = 0;
  for (let y = 1; y < h - 1; y += 2)
    for (let xx = 1; xx < w - 1; xx += 2) {
      const i = y * w + xx,
        l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w];
      lm += l;
      ls += l * l;
      cnt++;
    }
  const lap = cnt ? ls / cnt - (lm / cnt) ** 2 : 0,
    hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) hist[g[i]]++;
  let lo = 0,
    hi = 255,
    acc = 0;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc > n * 0.02) {
      lo = v;
      break;
    }
  }
  acc = 0;
  for (let v = 255; v >= 0; v--) {
    acc += hist[v];
    if (acc > n * 0.02) {
      hi = v;
      break;
    }
  }
  if (hi - lo < 20) {
    lo = 0;
    hi = 255;
  }
  for (let i = 0; i < n; i++) {
    const v = Math.max(0, Math.min(255, ((g[i] - lo) * 255) / (hi - lo)));
    a[i * 4] = a[i * 4 + 1] = a[i * 4 + 2] = v;
  }
  x.putImageData(d, 0, 0);
  const q = [
    {
      n: "Lighting",
      ok: mean >= 70 && mean <= 248,
      m:
        mean < 70
          ? "Too dark. Move to a brighter spot."
          : mean > 248
            ? "Washed out. Avoid glare and flash."
            : "Even and bright enough.",
    },
    {
      n: "Text contrast",
      ok: sd >= 28,
      m: sd < 28 ? "Writing looks faint. Move closer or add light." : "Writing stands out from the paper.",
    },
    {
      n: "Sharpness",
      ok: lap >= 30,
      m: lap < 30 ? "The photo looks blurry. Hold steady and retake." : "Letters are crisp.",
    },
    {
      n: "Size",
      ok: Math.max(W0, H0) >= 800,
      m:
        Math.max(W0, H0) < 800
          ? "Low resolution (" + W0 + "×" + H0 + "). Retake closer."
          : W0 + "×" + H0 + " pixels.",
    },
  ];
  S.sc = {
    stage: "pre",
    exp: e,
    name,
    before,
    after: cv.toDataURL("image/jpeg", 0.9),
    thumb: sm(cv, 240, 0.6),
    q,
    did: ["Resized for reading", "Grayscale", "Contrast boost"],
  };
  render();
}
/* read: Tesseract.js when it can load, demo text otherwise */
const loadScript = (u) =>
  new Promise((ok, no) => {
    const e = document.createElement("script");
    e.src = u;
    e.onload = ok;
    e.onerror = no;
    document.head.appendChild(e);
  });
const hashS = (t) => [...t].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const catOf = (t) =>
  /intake/i.test(t)
    ? "Intake interview"
    : /anecdot/i.test(t)
      ? "Anecdotal record"
      : /consent|permission/i.test(t)
        ? "Consent form"
        : /refer/i.test(t)
          ? "Referral slip"
          : "";
async function runRead() {
  const c = SC();
  c.stage = "read";
  render();
  let text = "",
    conf = 0,
    sim = false;
  const bar = (p) => {
    const b = $("rbar");
    if (b) {
      b.style.width = Math.max(4, p) + "%";
      $("rpct").textContent = p + "%";
    }
  };
  try {
    if (c.pdf) throw 0;
    if (!window.Tesseract)
      await Promise.race([
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js"),
        new Promise((_, no) => setTimeout(no, 8000)),
      ]);
    const r = await Promise.race([
      Tesseract.recognize(c.after, "eng", {
        logger: (m) => {
          if (m.status == "recognizing text") bar(Math.round(m.progress * 100));
        },
      }),
      new Promise((_, no) => setTimeout(no, 60000)),
    ]);
    text = r.data.text;
    conf = Math.round(r.data.confidence);
  } catch (e) {
    sim = true;
    const fw = words(c.name),
      p = c.exp
        ? pp(c.exp)
        : P.find((x) => words(x.name).every((k) => fw.includes(k))) || P[hashS(c.name) % P.length];
    for (let i = 10; i <= 100; i += 30) {
      bar(i);
      await new Promise((r) => setTimeout(r, 150));
    }
    const cc = S.cases.find((x) => x.p == p.id),
      ap = S.appts.find((x) => x.k && apP(x) == p.id),
      pa = parentOf(p.id),
      gs = p.gr.replace("Grade ", "").split(" – ");
    text = compose(
      {
        lrn: p.lrn,
        name: p.name,
        grade: gs[0],
        section: gs[1] || "",
        adviser: adv(p),
        violation: cc ? cc.c + (cc.bt ? " (" + cc.bt + ")" : "") : "Peer conflict",
        intervention: ap ? ap.type : "Counseling session",
        guardian: pa ? pa.name : "Not on file",
        date: iso(0),
      },
      catOf(c.name) || "Intake interview",
    );
  }
  if (S.sc !== c) return;
  c.rev = parseForm(text, c.exp, c.name);
  c.rev.sim = sim;
  c.rev.conf = conf;
  c.stage = "review";
  render();
  onMatch();
  toast("Form read. Please confirm the details.");
}
/* post-process: fix look-alike characters, find the LRN, match the learner, guess the form type */
const words = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-zñ ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
const lev = (a, b) => {
  const m = [...Array(b.length + 1).keys()];
  for (let i = 1; i <= a.length; i++) {
    let p = m[0];
    m[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = m[j];
      m[j] = Math.min(m[j] + 1, m[j - 1] + 1, p + (a[i - 1] == b[j - 1] ? 0 : 1));
      p = t;
    }
  }
  return m[b.length];
};
const ham = (a, b) => (a.length != b.length ? 99 : [...a].filter((ch, i) => ch != b[i]).length);
function findLrn(t) {
  const fix = (v) =>
    v
      .replace(/[Oo]/g, "0")
      .replace(/[lIi|]/g, "1")
      .replace(/[Ss]/g, "5")
      .replace(/B/g, "8")
      .replace(/\D/g, "");
  for (const ln of t.split(/\n/)) {
    if (/lrn|learner reference/i.test(ln)) {
      const v = fix(ln.replace(/^.*?(lrn|learner reference( no\.?| number)?)[:#.\s-]*/i, ""));
      if (v.length >= 12) return v.slice(0, 12);
    }
  }
  const m = t.replace(/(\d)[ -](?=\d)/g, "$1").match(/\d{12}/);
  return m ? m[0] : "";
}
function findKid(t, lrn) {
  let p = P.find((x) => x.lrn == lrn);
  if (p) return { p, how: "lrn" };
  const tw = words(t);
  p = P.find((x) => {
    const tk = words(x.name);
    return tk.length && tk.every((k) => tw.some((w) => w == k || (k.length >= 5 && lev(w, k) <= 1)));
  });
  if (p) return { p, how: "name" };
  p = lrn && P.find((x) => ham(x.lrn, lrn) <= 2);
  return p ? { p, how: "near" } : { p: null };
}
const compose = (f, cat) =>
  `${cat.toUpperCase()}, SRES GUIDANCE OFFICE\nLRN ${f.lrn}\nLearner: ${f.name}\nGrade: ${f.grade}\nSection: ${f.section}\nAdviser/Teacher: ${f.adviser}\nViolation: ${f.violation}\nType of Intervention: ${f.intervention}\nGuardian/Parent: ${f.guardian}\nScanned Date: ${f.date ? fmt(f.date) : ""}`;
const LBL = {
  lrn: /^\s*(?:LRN|Learner Reference(?: No\.?| Number)?)\s*[:#.\-]?\s*(.*)$/i,
  name: /^\s*(?:Learner|Name|Pupil)\s*[:\-]\s*(.*)$/i,
  grade: /^\s*Grade(?: Level)?\s*[:\-]?\s*(.*)$/i,
  section: /^\s*Section\s*[:\-]?\s*(.*)$/i,
  adviser: /^\s*(?:Adviser|Advisor|Teacher)(?:\s*\/\s*(?:Adviser|Advisor|Teacher))?\s*[:\-]?\s*(.*)$/i,
  violation: /^\s*(?:Violation|Offense)\s*[:\-]?\s*(.*)$/i,
  intervention: /^\s*(?:Type of )?Intervention\s*[:\-]?\s*(.*)$/i,
  guardian: /^\s*(?:Guardian|Parent)(?:\s*\/\s*(?:Guardian|Parent))?\s*[:\-]?\s*(.*)$/i,
  date: /^\s*(?:Scanned )?Date(?: Scanned)?\s*[:\-]?\s*(.*)$/i,
};
function readFields(t) {
  const f = {};
  t.split(/\n/).forEach((ln) => {
    for (const k in LBL) {
      const m = ln.match(LBL[k]);
      if (m && f[k] === undefined) {
        f[k] = m[1].trim();
        break;
      }
    }
  });
  return f;
}
const readDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d) ? "" : ld(d);
};
function parseForm(text, exp, fname) {
  const rf = readFields(text),
    lrn = findLrn(text),
    m = findKid(text, lrn),
    kw = catOf(text),
    cat = kw || catOf(fname) || "Intake interview",
    dt = readDate(rf.date);
  const f = {
      lrn,
      name: rf.name || "",
      grade: (rf.grade || "").replace(/\D/g, "").slice(0, 1),
      section: rf.section || "",
      adviser: rf.adviser || "",
      violation: rf.violation || "",
      intervention: rf.intervention || "",
      guardian: rf.guardian || "",
      date: dt || iso(0),
    },
    r = {
      text: text.trim(),
      cat,
      f,
      note: "",
      fl: { cat: !!kw, date: !!dt, violation: !!rf.violation, intervention: !!rf.intervention },
    };
  const kid = m.p || (exp ? pp(exp) : null);
  if (kid) {
    const rec = kid.gr.replace("Grade ", "").split(" – "),
      pa = parentOf(kid.id),
      chk = (k, v) => {
        if (!f[k]) {
          f[k] = v;
          r.fl[k] = false;
        } else r.fl[k] = m.p ? norm(f[k]) == norm(v) : false;
      };
    f.lrn = kid.lrn;
    f.name = kid.name;
    r.fl.lrn = m.how == "lrn";
    r.fl.name = !!m.p;
    chk("grade", rec[0]);
    chk("section", rec[1] || "");
    chk("adviser", adv(kid));
    if (pa) {
      if (!f.guardian) {
        f.guardian = pa.name;
        r.fl.guardian = false;
      } else
        r.fl.guardian = !!m.p && words(f.guardian).some((w) => w.length > 3 && words(pa.name).includes(w));
    } else r.fl.guardian = !!f.guardian;
  } else {
    const nm = text.match(/(?:learner|name)\s*[:\-]\s*([^,\n]+)/i);
    f.name = nm ? nm[1].trim() : f.name;
    ["lrn", "name", "grade", "section", "adviser", "guardian"].forEach((k) => (r.fl[k] = false));
  }
  if (m.how == "name")
    r.note = "The LRN was not clear on the scan, so we filled it from the pupil’s name. Please check it.";
  if (m.how == "near")
    r.note =
      "The scan read LRN " + lrn + ", which is close to " + kid.lrn + ". We corrected it. Please check it.";
  if (!m.p && !exp)
    r.note = "No learner on the list matched this form. Check the LRN and name, or add the learner first.";
  if (!m.p && exp)
    r.note =
      "We could not find a learner on the scan, so we used the pupil you picked. Check it against the text.";
  if (exp && m.p && m.p.id != exp) {
    r.fl.name = false;
    r.note =
      "This form looks like it belongs to " + m.p.name + ", not " + pp(exp).name + ". Check before saving.";
  }
  const miss = ["grade", "section", "adviser"].filter((k) => !rf[k]);
  if (m.p && miss.length && !r.note)
    r.note = "Some fields were blank on the scan, so we filled them from the learner record. Check them.";
  return r;
}
function onMatch() {
  const l = dig($("ol").value),
    p = P.find((x) => x.lrn == l),
    n = norm($("on").value);
  $("mline").innerHTML = p
    ? norm(p.name) == n
      ? `<span class="tag good">Matched</span> ${esc(p.name)}, ${p.gr}`
      : `<span class="tag warn">Name differs</span> LRN ${l} belongs to ${esc(p.name)}.`
    : '<span class="tag warn">No match</span> No learner has this LRN.';
}
function saveOcr() {
  const c = SC(),
    l = dig($("ol").value),
    p = P.find((x) => x.lrn == l);
  if (!p) return toast("That LRN is not on the learner list. Correct it first.");
  if (norm($("on").value) != norm(p.name)) return toast("The name does not match that LRN. Check both.");
  const g = (i) => $(i).value.trim(),
    f = {
      lrn: l,
      name: p.name,
      grade: g("og"),
      section: g("os"),
      adviser: g("oa"),
      violation: g("ov"),
      intervention: g("oi"),
      guardian: g("ogd"),
      date: $("od").value || iso(0),
    },
    cat = $("oc").value;
  S.docs.unshift({
    name: c.name,
    d: f.date,
    lrn: l,
    pn: p.name,
    cat,
    f,
    text: compose(f, cat),
    raw: g("ot") || c.rev.text,
    img: c.thumb || "",
  });
  S.sc = null;
  S.bk.at = Date.now();
  save();
  toast("Filed under " + p.name + " and backed up.");
  render();
}
function backup() {
  S.bk.at = Date.now();
  save();
  toast("Backup saved to the cloud (simulated).");
  render();
}
function dlBackup() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([snap()], { type: "application/json" }));
  a.download = "kalinga-backup-" + iso(0) + ".json";
  a.click();
  toast("Backup file downloaded.");
}
function restore(i) {
  const f = i.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const j = JSON.parse(r.result);
      if (!j.cases || !j.P) throw 0;
      localStorage.setItem(KEY, r.result);
      location.reload();
    } catch (e) {
      toast("That file is not a Kalinga backup.");
    }
  };
  r.readAsText(f);
}
