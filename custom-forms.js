/* ==========================================================================
   Custom forms: define a form once, get the fill-in form, a blank
   Print / PDF copy, and a .DOC download automatically.
   Also holds the Download Forms directory view.
   ========================================================================== */

S.customForms = S.customForms || [];

const SCHOOL_NAME = "San Roque Elementary School";

const FIELD_TYPES = [
  ["text", "Short answer"],
  ["textarea", "Long answer"],
  ["date", "Date"],
  ["number", "Number"],
  ["select", "Dropdown"],
  ["radio", "Choose one"],
  ["checkbox", "Yes / No"],
];

const FILL_SOURCES = [
  ["", "No auto-fill"],
  ["name", "Learner name"],
  ["lrn", "LRN"],
  ["grade", "Grade level"],
  ["section", "Section"],
  ["gradesec", "Grade and section"],
  ["adviser", "Adviser"],
  ["parent", "Parent or guardian"],
  ["school", "School name"],
  ["today", "Today's date"],
];

const TEXT_LIKE = ["text", "textarea", "date", "number"];
const needsOptions = (type) => type === "select" || type === "radio";
const optionList = (s) =>
  String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

/* ---- lookups used by forms.js ---- */
const allForms = () => [...GUIDANCE_FORMS, ...S.customForms];
const formById = (id) => allForms().find((f) => f.id === id) || GUIDANCE_FORMS[0];
const isCustom = (id) => S.customForms.some((f) => f.id === id);

/* Letterhead shared by built-in and custom forms */
const formHeaderHtml = (d) => `
  <div class="deped-hdr">
    <div class="rep">Republic of the Philippines</div>
    <div class="dept">Department of Education</div>
    <div class="divn">Region IV-A CALABARZON · Division of Rizal</div>
    <div class="sch">${esc((d && d.school) || "SAN ROQUE ELEMENTARY SCHOOL")}</div>
    <div class="off">Guidance and Counseling Office</div>
  </div>`;

/* ==========================================================================
   Fill-in form for a custom form
   ========================================================================== */
const fieldId = (f) => "cf_" + f.id;

function customFieldInput(f) {
  const id = fieldId(f);
  const today = iso(0);
  if (f.type === "textarea") return `<textarea id="${id}" rows="3"></textarea>`;
  if (f.type === "select") {
    return `<select id="${id}"><option value="">Select</option>${optionList(f.options)
      .map((o) => `<option>${esc(o)}</option>`)
      .join("")}</select>`;
  }
  if (f.type === "radio") {
    return `<div class="form-radio-grid">${optionList(f.options)
      .map((o) => `<label><input type="radio" name="${id}" value="${esc(o)}"> ${esc(o)}</label>`)
      .join("")}</div>`;
  }
  if (f.type === "checkbox") {
    return `<div class="form-radio-grid"><label><input type="checkbox" id="${id}" style="width:auto;min-height:0;margin:0"> Yes</label></div>`;
  }
  const value = f.fill === "today" ? today : f.fill === "school" ? SCHOOL_NAME : "";
  return `<input id="${id}" type="${f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}" value="${esc(value)}">`;
}

function renderCustomGenModal(fid) {
  const f = formById(fid);
  const fields = f.fields.map((fld) => `<label>${esc(fld.label)}${customFieldInput(fld)}</label>`).join("");
  return genModalShell(f, `<div class="form-field-group"><h4>Form details</h4>${fields}</div>`);
}

function fillCustomFromKid(fid, kid, parent) {
  const [grade, section] = kid.gr.split(" – ");
  const values = {
    name: kid.name,
    lrn: kid.lrn,
    grade,
    section: section || "",
    gradesec: kid.gr,
    adviser: adv(kid),
    parent: parent ? parent.name : "",
    school: SCHOOL_NAME,
    today: iso(0),
  };
  formById(fid).fields.forEach((f) => {
    const el = f.fill && TEXT_LIKE.includes(f.type) ? $(fieldId(f)) : null;
    if (el && values[f.fill] !== undefined) el.value = values[f.fill];
  });
}

function readCustomField(f) {
  if (f.type === "radio") {
    const el = document.querySelector(`input[name="${fieldId(f)}"]:checked`);
    return el ? el.value : "";
  }
  const el = $(fieldId(f));
  if (!el) return "";
  return f.type === "checkbox" ? (el.checked ? "Yes" : "No") : el.value.trim();
}

function collectCustom(form) {
  const data = {};
  form.fields.forEach((f) => (data[f.id] = readCustomField(f)));
  const nameField = form.fields.find((f) => f.fill === "name");
  return { data, learnerName: nameField ? String(data[nameField.id] || "") : "" };
}

const customSummary = (form, data) => form.fields.map((f) => `${f.label}: ${data[f.id] || ""}`).join("\n");

/* ==========================================================================
   Printable / Word layout for a custom form
   ========================================================================== */
function customFieldPrint(f, value) {
  const box = (on, text) => `[${on ? "X" : "&nbsp;&nbsp;"}] ${esc(text)}`;
  let answer;
  if (f.type === "select" || f.type === "radio") {
    answer = optionList(f.options)
      .map((o) => box(value === o, o))
      .join(" &nbsp;&nbsp; ");
  } else if (f.type === "checkbox") {
    answer = box(value === "Yes", "Yes") + " &nbsp;&nbsp; " + box(value === "No", "No");
  } else if (f.type === "textarea") {
    return `<div class="q-row"><div class="q-prompt">${esc(f.label)}</div><div style="border:1px solid #000;min-height:64px;padding:6px;font-size:10pt">${esc(value || "")}</div></div>`;
  } else {
    answer = f.type === "date" && value ? esc(fmt(value)) : esc(value || "");
  }
  return `<div class="q-row"><div class="q-prompt">${esc(f.label)}</div><div class="q-answer">${answer}</div></div>`;
}

function customFormHtml(form, isBlank, data) {
  const values = isBlank ? {} : data || {};
  return `${formHeaderHtml({})}
    <div class="form-title">${esc(form.title)}</div>
    <div class="form-subtitle">${esc(form.code)}</div>
    ${form.desc ? `<p style="text-align:center;font-size:9.5pt;font-style:italic">${esc(form.desc)}</p>` : ""}
    ${form.fields.map((f) => customFieldPrint(f, values[f.id])).join("")}
    <div class="sig-container">
      <div class="sig-box"><div class="sig-line">&nbsp;</div><div class="sig-sub">Signature over printed name</div></div>
      <div class="sig-box"><div class="sig-line">&nbsp;</div><div class="sig-sub">Date</div></div>
    </div>`;
}

/* ==========================================================================
   Form builder (add / edit a custom form)
   ========================================================================== */
const newFieldId = () => "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const blankField = () => ({ id: newFieldId(), label: "", type: "text", options: "", fill: "" });

function openFormBuilder(id) {
  const existing = id && S.customForms.find((f) => f.id === id);
  S.fb = existing
    ? JSON.parse(JSON.stringify(existing))
    : {
        id: "",
        title: "",
        code: "",
        category: "Custom Forms",
        desc: "",
        fields: [blankField(), blankField(), blankField()],
      };
  S.modal = existing ? "editform_" + id : "newform";
  render();
}

function closeFormBuilder() {
  S.fb = null;
  S.modal = null;
  render();
}

function fbRowsHtml() {
  return S.fb.fields
    .map((f, i) => {
      const typeOpts = FIELD_TYPES.map(
        ([v, l]) => `<option value="${v}" ${f.type === v ? "selected" : ""}>${l}</option>`,
      ).join("");
      const fillOpts = FILL_SOURCES.map(
        ([v, l]) => `<option value="${v}" ${f.fill === v ? "selected" : ""}>${l}</option>`,
      ).join("");
      const fillOn = TEXT_LIKE.includes(f.type);
      return `<tr>
        <td><input id="fb_l_${i}" value="${esc(f.label)}" placeholder="Field label"></td>
        <td><select id="fb_t_${i}" onchange="fbRetype()">${typeOpts}</select></td>
        <td><input id="fb_o_${i}" value="${esc(f.options)}" placeholder="Option 1, Option 2" ${needsOptions(f.type) ? "" : "disabled"}></td>
        <td><select id="fb_f_${i}" ${fillOn ? "" : "disabled"}>${fillOpts}</select></td>
        <td style="text-align:center"><button type="button" class="btn s o" onclick="fbDelete(${i})">Remove</button></td>
      </tr>`;
    })
    .join("");
}

function renderFormBuilder() {
  const b = S.fb || { title: "", code: "", category: "Custom Forms", desc: "", fields: [] };
  const editing = S.modal !== "newform";
  const categories = [...new Set(["Custom Forms", ...allForms().map((f) => f.category)])];
  return `<h3>${editing ? "Edit form" : "Add a form"}</h3>
    <p class="mute">Define the fields once. The form is turned into a fill-in form, a blank Print / PDF copy, and a .DOC download automatically.</p>
    <div class="row2">
      <label>Form title<input id="fb_title" value="${esc(b.title)}" placeholder="e.g. Home Visit Report"></label>
      <label>Form code (optional)<input id="fb_code" value="${esc(b.code)}" placeholder="e.g. ANNEX E"></label>
    </div>
    <div class="row2">
      <label>Category<input id="fb_cat" list="fb_cats" value="${esc(b.category)}"></label>
      <datalist id="fb_cats">${categories.map((c) => `<option value="${esc(c)}">`).join("")}</datalist>
      <label>Short description<input id="fb_desc" value="${esc(b.desc)}"></label>
    </div>
    <div class="form-field-group"><h4>Fields</h4>
      <table class="tbl-form">
        <thead><tr><th style="width:30%">Label</th><th style="width:18%">Type</th><th style="width:22%">Options (comma separated)</th><th style="width:20%">Auto-fill from learner</th><th style="width:84px"></th></tr></thead>
        <tbody id="fb_rows">${fbRowsHtml()}</tbody>
      </table>
      <button type="button" class="btn s o" onclick="fbAdd()">Add field</button>
    </div>
    <div class="form-field-group"><h4>Add many fields at once</h4>
      <textarea id="fb_bulk" rows="3" placeholder="One field per line: Label | type | options&#10;Reason for visit | textarea&#10;Visit date | date&#10;Outcome | select | Resolved, Ongoing, Referred"></textarea>
      <p class="mute" style="margin:4px 0 0">Types: text, textarea, date, number, select, radio, checkbox. Only the label is required.</p>
      <button type="button" class="btn s o" onclick="fbBulk()">Add these fields</button>
    </div>
    <p id="fb_err" class="err" role="alert"></p>
    <div class="row2"><button type="button" class="btn y" onclick="fbSave()">${editing ? "Save changes" : "Save form"}</button><button type="button" class="btn o" onclick="closeFormBuilder()">Cancel</button></div>`;
}

/* Copy what is typed in the builder back into S.fb before any re-draw. */
function fbSync() {
  const b = S.fb;
  const val = (id, fallback) => ($(id) ? $(id).value.trim() : fallback);
  b.title = val("fb_title", b.title);
  b.code = val("fb_code", b.code);
  b.category = val("fb_cat", b.category);
  b.desc = val("fb_desc", b.desc);
  b.fields = b.fields.map((f, i) => ({
    ...f,
    label: val("fb_l_" + i, f.label),
    type: $("fb_t_" + i) ? $("fb_t_" + i).value : f.type,
    options: val("fb_o_" + i, f.options),
    fill: $("fb_f_" + i) ? $("fb_f_" + i).value : f.fill,
  }));
}

const fbRedraw = () => ($("fb_rows").innerHTML = fbRowsHtml());

function fbRetype() {
  fbSync();
  S.fb.fields.forEach((f) => {
    if (!TEXT_LIKE.includes(f.type)) f.fill = "";
  });
  fbRedraw();
}

function fbAdd() {
  fbSync();
  S.fb.fields.push(blankField());
  fbRedraw();
}

function fbDelete(i) {
  fbSync();
  if (S.fb.fields.length <= 1) return toast("A form needs at least one field.");
  S.fb.fields.splice(i, 1);
  fbRedraw();
}

function fbBulk() {
  fbSync();
  const lines = $("fb_bulk")
    .value.split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return toast("Type at least one field first.");
  const typeByWord = {
    text: "text",
    short: "text",
    textarea: "textarea",
    long: "textarea",
    date: "date",
    number: "number",
    select: "select",
    dropdown: "select",
    radio: "radio",
    choose: "radio",
    checkbox: "checkbox",
    yes: "checkbox",
  };
  const added = lines.map((line) => {
    const [label, type = "", options = ""] = line.split("|").map((x) => x.trim());
    const t = typeByWord[type.toLowerCase().split(" ")[0]] || "text";
    return { id: newFieldId(), label, type: t, options: needsOptions(t) ? options : "", fill: "" };
  });
  S.fb.fields = [...S.fb.fields.filter((f) => f.label), ...added];
  $("fb_bulk").value = "";
  fbRedraw();
}

function fbSave() {
  fbSync();
  const b = S.fb;
  const fail = (m) => ($("fb_err").textContent = m);
  const fields = b.fields.filter((f) => f.label);
  if (!b.title) return fail("Give the form a title.");
  if (!fields.length) return fail("Add at least one field with a label.");
  const bad = fields.find((f) => needsOptions(f.type) && optionList(f.options).length < 2);
  if (bad) return fail(`"${bad.label}" needs at least two options, separated by commas.`);
  const form = {
    id: b.id || "cf_" + Date.now().toString(36),
    code: b.code || "CUSTOM-" + (S.customForms.length + 1),
    title: b.title,
    category: b.category || "Custom Forms",
    badge: "Custom form",
    desc: b.desc || "Custom form created by the Guidance Office.",
    fields,
    custom: true,
  };
  const at = S.customForms.findIndex((f) => f.id === form.id);
  if (at >= 0) S.customForms[at] = form;
  else S.customForms.push(form);
  S.fb = null;
  S.modal = null;
  save();
  toast(`"${form.title}" is ready to generate, print, and download.`);
  render();
}

function deleteCustomForm(id) {
  const f = S.customForms.find((x) => x.id === id);
  if (!f || !confirm(`Remove the form "${f.title}"? Saved copies in the Calamity Vault are kept.`)) return;
  S.customForms = S.customForms.filter((x) => x.id !== id);
  save();
  toast("Form removed.");
  render();
}

/* ==========================================================================
   Download Forms directory
   ========================================================================== */
function formCard(f) {
  const manage = f.custom
    ? `<button class="btn s o" onclick="openFormBuilder('${f.id}')">Edit</button><button class="btn s o" style="color:var(--danger);border-color:var(--danger)" onclick="deleteCustomForm('${f.id}')">Delete</button>`
    : "";
  return `<div class="form-item-card">
    <div class="form-item-left">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
        <span class="tag good" style="background:var(--primary);color:#fff;font-weight:700">${esc(f.code)}</span>
        <span class="tag warn">${esc(f.badge)}</span>
        <span class="mute">${esc(f.category)}</span>
      </div>
      <b style="font-size:16px">${esc(f.title)}</b>
      <p class="mute" style="margin:4px 0 0;line-height:1.4">${esc(f.desc)}</p>
    </div>
    <div class="form-item-right">
      <button class="btn y s" onclick="openGenModal('${f.id}')">Generate Form</button>
      <button class="btn s o" onclick="printBlankForm('${f.id}')">Blank Print / PDF</button>
      <button class="btn s o" onclick="downloadWordFile('${f.id}', true)">Download .DOC</button>
      ${manage}
    </div>
  </div>`;
}

function formListHtml() {
  const q = (S.formsQ || "").toLowerCase().trim();
  const cat = S.formsCat || "All";
  const list = allForms().filter(
    (f) =>
      (!q || [f.title, f.code, f.desc].some((t) => t.toLowerCase().includes(q))) &&
      (cat === "All" || f.category === cat),
  );
  return `<div class="item" style="padding-top:0">
      <div><h3 style="margin:0">Forms Directory (${list.length} available)</h3></div>
      <span class="mute">Compliant with DepEd DO 40 s. 2012 and RA 10173</span>
    </div>${list.map(formCard).join("") || '<p class="empty">No guidance forms match your filter.</p>'}`;
}

function vForms() {
  const cats = ["All", ...new Set(allForms().map((f) => f.category))],
    sy = viewSY(),
    saved = S.docs.filter((d) => recordInSY(d.d, sy));
  return `<div class="top">
      <div>
        <h2>Guidance Download Forms and Document Generator</h2>
        <p class="lede">Standard DepEd and Guidance Office annexes and student records. Generate a filled form, print a blank copy, or download a .DOC. Use <b>Add a form</b> to create your own; it gets all three automatically.</p>
      </div>
      <button class="btn y" style="margin:0 0 20px" onclick="openFormBuilder()">Add a form</button>
    </div>${schoolYearFilter()}
    <div class="blk" style="margin-bottom:18px">
      <div class="row2">
        <label style="margin-top:0;flex:1 1 260px">Search Guidance Forms
          <input id="fq" placeholder="Search by form name, code, or keyword" value="${esc(S.formsQ || "")}" oninput="S.formsQ=this.value;$('fl').innerHTML=formListHtml()">
        </label>
        <div style="flex:1 1 260px">
          <label style="margin-top:0">Filter by Category</label>
          <div class="pills" style="margin:0">${cats.map((c) => `<button aria-pressed="${(S.formsCat || "All") === c}" data-c="${esc(c)}" onclick="S.formsCat=this.dataset.c;render()">${esc(c)}</button>`).join("")}</div>
        </div>
      </div>
    </div>
    <div class="blk" id="fl">${formListHtml()}</div>
    <div class="blk y" style="margin-top:20px"><h3>Saved form records in SY ${sy} (${saved.length})</h3>${saved
      .map(
        (d) =>
          `<div class="item"><div><b>${esc(d.name)}</b><br><span class="mute">${esc(d.pn || "")}${d.pn ? ", " : ""}LRN ${esc(d.lrn)}, ${fmt(d.d)}</span></div><span class="tag good">${esc(d.cat || "Saved form")}</span></div>`,
      )
      .join("") || `<p class="empty">No saved form records in SY ${sy}. View scanned and saved documents in the Vault.</p>`}</div>`;
}
