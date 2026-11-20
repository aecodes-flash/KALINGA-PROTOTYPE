/* ---- guidance forms & document generator ---- */
const GUIDANCE_FORMS = [
  {
    id: "anecdotal",
    code: "DEPED-SRES-AR",
    title: "ANECDOTAL RECORD",
    category: "Behavioral Records",
    badge: "Official DepEd Form",
    desc: "Official observation log to document specific learner behavioral incidents, setting, observer notes, and disciplinary or supportive actions taken by teachers or guidance designates.",
  },
  {
    id: "annex-a",
    code: "ANNEX A",
    title: "Statement of Confidentiality",
    category: "Annexes",
    badge: "Legal & Consent",
    desc: "Counseling confidentiality agreement, statutory limitations (harm to self/others, abuse/neglect of minor, court subpoena), client rights, responsibilities, and parent/guardian signed agreement per DepEd DO 40 s. 2012 & RA 10173.",
  },
  {
    id: "annex-b",
    code: "ANNEX B",
    title: "INTAKE INTERVIEW FORM",
    category: "Annexes",
    badge: "Assessment & Clinical",
    desc: "Primary 17-point intake interview covering current situation, severity, duration, root causes, coping attempts, readiness for change, and counselor’s clinical assessment.",
  },
  {
    id: "annex-c",
    code: "ANNEX C",
    title: "COUNSELING PLAN",
    category: "Annexes",
    badge: "Intervention Strategy",
    desc: "Structured case plan outlining individualized overall counseling goals, multi-session milestones, specific behavioral targets, and designated guidance interventions.",
  },
  {
    id: "annex-d",
    code: "ANNEX D",
    title: "CASE NOTES TEMPLATE",
    category: "Annexes",
    badge: "Session Tracking",
    desc: "Session-by-session clinical progress documentation across 9 structured dimensions: topics discussed, plan relevance, interventions applied, observations, progress, and homework.",
  },
];

S.arRows = S.arRows || [
  {
    dt: iso(0) + " 09:30 AM",
    place: "Classroom",
    obs: "Teacher Cruz",
    beh: "Engaged in verbal disagreement with seatmate during group seatwork.",
    handle: "Separated pupils temporarily, facilitated calm dialogue, and referred to guidance.",
  },
  { dt: "", place: "", obs: "", beh: "", handle: "" },
  { dt: "", place: "", obs: "", beh: "", handle: "" },
];

S.cpRows = S.cpRows || [
  {
    sess: "Session 1 – " + iso(1),
    goal: "Establish rapport, explore triggers, and define personal goals",
    intervention: "Individual intake counseling & active listening",
  },
  {
    sess: "Session 2 – " + iso(8),
    goal: "Develop emotional regulation and constructive conflict resolution skills",
    intervention: "Behavioral role-playing & emotion journal",
  },
  {
    sess: "Session 3 – " + iso(15),
    goal: "Assess peer interaction progress and review homework results",
    intervention: "Follow-up evaluation & adviser feedback",
  },
];

function openGenModal(fid) {
  S.modal = "gen_" + fid;
  render();
}

function fillKidForForm(fid, kidId) {
  if (!kidId) return;
  const k = pp(+kidId);
  if (!k) return;
  const parts = (k.gr || "").split(" – ");
  const gr = parts[0] || "";
  const secName = parts[1] || "";
  const pa = parentOf(k.id);

  if (isCustom(fid)) {
    fillCustomFromKid(fid, k, pa);
  } else if (fid === "anecdotal") {
    if ($("gf_ar_name")) $("gf_ar_name").value = k.name;
    if ($("gf_ar_grade")) $("gf_ar_grade").value = gr;
    if ($("gf_ar_sec")) $("gf_ar_sec").value = secName;
    if ($("gf_ar_school")) $("gf_ar_school").value = "San Roque Elementary School";
  } else if (fid === "annex-a") {
    if ($("gf_aa_name")) $("gf_aa_name").value = k.name;
    if ($("gf_aa_gr")) $("gf_aa_gr").value = k.gr;
    if ($("gf_aa_parent")) $("gf_aa_parent").value = pa ? pa.name : "";
    if ($("gf_aa_school")) $("gf_aa_school").value = "San Roque Elementary School";
  } else if (fid === "annex-b") {
    if ($("gf_ab_name")) $("gf_ab_name").value = k.name;
    if ($("gf_ab_gr")) $("gf_ab_gr").value = gr;
    if ($("gf_ab_sec")) $("gf_ab_sec").value = secName;
    if ($("gf_ab_date")) $("gf_ab_date").value = iso(0);
  } else if (fid === "annex-c") {
    if ($("gf_ac_name")) $("gf_ac_name").value = k.name;
    if ($("gf_ac_gr")) $("gf_ac_gr").value = k.gr;
  } else if (fid === "annex-d") {
    if ($("gf_ad_name")) $("gf_ad_name").value = k.name;
    if ($("gf_ad_gr")) $("gf_ad_gr").value = k.gr;
    if ($("gf_ad_date")) $("gf_ad_date").value = iso(0);
  }
  toast("Auto-filled learner details for " + k.name + ".");
}

function renderArRows() {
  return (S.arRows || [])
    .map(
      (r, i) => `
      <tr>
        <td><input value="${esc(r.dt || "")}" id="ar_dt_${i}" placeholder="Date / Time"></td>
        <td><input value="${esc(r.place || "")}" id="ar_pl_${i}" placeholder="Place"></td>
        <td><input value="${esc(r.obs || "")}" id="ar_ob_${i}" placeholder="Observer"></td>
        <td><textarea id="ar_beh_${i}" placeholder="Behavior observed">${esc(r.beh || "")}</textarea></td>
        <td><textarea id="ar_hdl_${i}" placeholder="How handled">${esc(r.handle || "")}</textarea></td>
        <td style="text-align:center"><button type="button" class="btn s o" style="color:var(--danger);padding:4px 8px" onclick="delArRow(${i})">Remove</button></td>
      </tr>
    `,
    )
    .join("");
}

function syncArRowsFromDOM() {
  S.arRows = (S.arRows || []).map((r, i) => ({
    dt: $("ar_dt_" + i) ? $("ar_dt_" + i).value.trim() : r.dt,
    place: $("ar_pl_" + i) ? $("ar_pl_" + i).value.trim() : r.place,
    obs: $("ar_ob_" + i) ? $("ar_ob_" + i).value.trim() : r.obs,
    beh: $("ar_beh_" + i) ? $("ar_beh_" + i).value.trim() : r.beh,
    handle: $("ar_hdl_" + i) ? $("ar_hdl_" + i).value.trim() : r.handle,
  }));
}

function addArRow() {
  syncArRowsFromDOM();
  S.arRows.push({
    dt: iso(0) + " " + now(),
    place: "Classroom",
    obs: S.user ? S.user.name : "Guidance Counselor",
    beh: "",
    handle: "",
  });
  const tb = $("ar_rows_tbody");
  if (tb) tb.innerHTML = renderArRows();
}

function delArRow(i) {
  syncArRowsFromDOM();
  if (S.arRows.length <= 1) return toast("At least one row is required.");
  S.arRows.splice(i, 1);
  const tb = $("ar_rows_tbody");
  if (tb) tb.innerHTML = renderArRows();
}

function renderCpRows() {
  return (S.cpRows || [])
    .map(
      (r, i) => `
      <tr>
        <td><input value="${esc(r.sess || "")}" id="cp_sess_${i}" placeholder="Session # & Date"></td>
        <td><textarea id="cp_goal_${i}" placeholder="Specific Goal">${esc(r.goal || "")}</textarea></td>
        <td><textarea id="cp_int_${i}" placeholder="Intervention">${esc(r.intervention || "")}</textarea></td>
        <td style="text-align:center"><button type="button" class="btn s o" style="color:var(--danger);padding:4px 8px" onclick="delCpRow(${i})">Remove</button></td>
      </tr>
    `,
    )
    .join("");
}

function syncCpRowsFromDOM() {
  S.cpRows = (S.cpRows || []).map((r, i) => ({
    sess: $("cp_sess_" + i) ? $("cp_sess_" + i).value.trim() : r.sess,
    goal: $("cp_goal_" + i) ? $("cp_goal_" + i).value.trim() : r.goal,
    intervention: $("cp_int_" + i) ? $("cp_int_" + i).value.trim() : r.intervention,
  }));
}

function addCpRow() {
  syncCpRowsFromDOM();
  const nextIdx = S.cpRows.length + 1;
  S.cpRows.push({ sess: "Session " + nextIdx + " – " + iso(nextIdx * 7), goal: "", intervention: "" });
  const tb = $("cp_rows_tbody");
  if (tb) tb.innerHTML = renderCpRows();
}

function delCpRow(i) {
  syncCpRowsFromDOM();
  if (S.cpRows.length <= 1) return toast("At least one row is required.");
  S.cpRows.splice(i, 1);
  const tb = $("cp_rows_tbody");
  if (tb) tb.innerHTML = renderCpRows();
}

function renderGenFormModal(fid) {
  if (isCustom(fid)) return renderCustomGenModal(fid);
  const f = formById(fid);
  const defPrep = S.user && S.user.name ? S.user.name : "Ma’am De Ocampo (Guidance Lead)";

  let fieldsHtml = "";
  if (fid === "anecdotal") {
    fieldsHtml = `
        <div class="row2">
          <label>Name of Learner Observed<input id="gf_ar_name" placeholder="Full name of learner" required></label>
          <label>Name of School<input id="gf_ar_school" value="San Roque Elementary School"></label>
        </div>
        <div class="row2">
          <label>Grade / Year Level<input id="gf_ar_grade" placeholder="e.g. Grade 4"></label>
          <label>Section<input id="gf_ar_sec" placeholder="e.g. Narra"></label>
        </div>
        <div class="form-field-group">
          <h4>Behavioral Observation Records</h4>
          <table class="tbl-form">
            <thead>
              <tr>
                <th style="width:18%">Date/ Time</th>
                <th style="width:16%">Place</th>
                <th style="width:18%">Observer</th>
                <th style="width:24%">Behavior Observed</th>
                <th style="width:20%">How Handled</th>
                <th style="width:84px"></th>
              </tr>
            </thead>
            <tbody id="ar_rows_tbody">${renderArRows()}</tbody>
          </table>
          <button type="button" class="btn s o" onclick="addArRow()">+ Add Observation Row</button>
        </div>
        <label>Summary<textarea id="gf_ar_summary" rows="3" placeholder="Summary of behavioral patterns and follow-up guidance recommendations..."></textarea></label>
        <label>Prepared by (Name over printed signature / School Guidance Designate)
          <input id="gf_ar_prep" value="${esc(defPrep)} / School Guidance Designate">
        </label>
      `;
  } else if (fid === "annex-a") {
    fieldsHtml = `
        <div class="row2">
          <label>Name of Learner / Counselee<input id="gf_aa_name" placeholder="Full name of learner" required></label>
          <label>Grade Level & Section<input id="gf_aa_gr" placeholder="e.g. Grade 3 – Sampaguita"></label>
        </div>
        <div class="row2">
          <label>Parent / Guardian’s Name<input id="gf_aa_parent" placeholder="Parent’s full name"></label>
          <label>Date and Time<input id="gf_aa_dt" value="${iso(0)} ${now()}"></label>
        </div>
        <div class="row2">
          <label>Guidance Counselor / Designate<input id="gf_aa_counselor" value="${esc(defPrep)}"></label>
          <label>School Name<input id="gf_aa_school" value="San Roque Elementary School"></label>
        </div>
        <div class="note" style="margin:14px 0;background:#fff;border:1px solid var(--line);border-left:4px solid var(--primary)">
          <p style="margin:0 0 8px;font-size:13px;line-height:1.4"><b>Statutory Confidentiality Limitations:</b> The counseling services of the Guidance and Counseling Office cater to the mental health and well-being of all learners. All discussions are confidential except: (1) imminent danger of suicide or harm to others, (2) reasonable suspicion of emotional/physical/sexual abuse or neglect of a minor, or (3) court subpoena.</p>
          <label style="display:flex;gap:8px;align-items:center;font-weight:600;font-size:13px;margin:8px 0 0">
            <input type="checkbox" id="gf_aa_agree" checked style="width:auto;min-height:0;margin:0">
            Parent/Client acknowledgment: "By signing this, I have read, understood and agreed to the provisions of this Statement of Confidentiality of the Guidance and Counseling Office."
          </label>
        </div>
      `;
  } else if (fid === "annex-b") {
    fieldsHtml = `
        <div class="row2">
          <label>Learner Full Name<input id="gf_ab_name" placeholder="Full name" required></label>
          <label>Date<input id="gf_ab_date" type="date" value="${iso(0)}"></label>
        </div>
        <div class="row2">
          <label>Birth Date<input id="gf_ab_bdate" type="date" value="2015-05-12"></label>
          <label>Sex<select id="gf_ab_sex"><option>Male</option><option>Female</option></select></label>
          <label>Preferred Language<input id="gf_ab_lang" value="Filipino / English"></label>
        </div>
        <div class="row2">
          <label>Grade Level<input id="gf_ab_gr" placeholder="Grade 4"></label>
          <label>Section<input id="gf_ab_sec" placeholder="Narra"></label>
        </div>
        <p class="mute" style="margin:10px 0 16px;font-style:italic">"We are concerned about how things are going for you. Our session today will help us discuss what’s going O.K. and what’s not going so well. Everything is confidential except for those that need to be discussed with others in order to HELP you."</p>

        <div class="form-field-group">
          <h4>Learner Diagnostic Questions</h4>
          <label>1. How would you describe your current situation? What problems are you experiencing? What are your main concerns?
            <textarea id="gf_ab_q1" rows="2" placeholder="Learner's description of current situation..."></textarea>
          </label>

          <label>2. How serious are these matters for you at this time?</label>
          <div class="form-radio-grid">
            <label><input type="radio" name="gf_ab_q2" value="Very Serious"> Very Serious</label>
            <label><input type="radio" name="gf_ab_q2" value="Serious" checked> Serious</label>
            <label><input type="radio" name="gf_ab_q2" value="Not too serious"> Not too serious</label>
            <label><input type="radio" name="gf_ab_q2" value="Not serious at all"> Not serious at all</label>
          </div>

          <label>3. How long have you had these problems?</label>
          <div class="form-radio-grid">
            <label><input type="radio" name="gf_ab_q3" value="0-3 months" checked> 0-3 months</label>
            <label><input type="radio" name="gf_ab_q3" value="4 months to a year"> 4 months to a year</label>
            <label><input type="radio" name="gf_ab_q3" value="more than a year"> more than a year</label>
          </div>

          <div class="row2">
            <label>4. What caused these problems?<textarea id="gf_ab_q4" rows="2"></textarea></label>
            <label>5. Do others (parents, guardians, friends) think there were other causes? What do they say?<textarea id="gf_ab_q5" rows="2"></textarea></label>
          </div>

          <label>6. What other things are currently making it hard to deal with the problems?<textarea id="gf_ab_q6" rows="2"></textarea></label>
          
          <div class="row2">
            <label>7. What have you already tried in order to deal with the problems?<textarea id="gf_ab_q7" rows="2"></textarea></label>
            <label>8. Why do you think these things didn’t work?<textarea id="gf_ab_q8" rows="2"></textarea></label>
          </div>

          <div class="row2">
            <label>9. What have others advised you to do?<textarea id="gf_ab_q9" rows="2"></textarea></label>
            <label>10. What do you think would help to solve the problem?<textarea id="gf_ab_q10" rows="2"></textarea></label>
          </div>

          <label>11. How much time and effort do you want to put into solving the problems?</label>
          <div class="form-radio-grid">
            <label><input type="radio" name="gf_ab_q11" value="none at all"> none at all</label>
            <label><input type="radio" name="gf_ab_q11" value="only a little"> only a little</label>
            <label><input type="radio" name="gf_ab_q11" value="just enough" checked> just enough</label>
            <label><input type="radio" name="gf_ab_q11" value="very much"> very much</label>
          </div>

          <label>12. If you answered 1st, 2nd, or 3rd option, why don’t you want to put more time and effort into solving the problems?<textarea id="gf_ab_q12" rows="2"></textarea></label>

          <div class="row2">
            <label>13. What type of help do you want?<textarea id="gf_ab_q13" rows="2"></textarea></label>
            <label>14. What changes are you hoping for?<textarea id="gf_ab_q14" rows="2"></textarea></label>
          </div>

          <label>15. How hopeful are you about solving the problems?</label>
          <div class="form-radio-grid">
            <label><input type="radio" name="gf_ab_q15" value="very hopeful"> very hopeful</label>
            <label><input type="radio" name="gf_ab_q15" value="hopeful" checked> hopeful</label>
            <label><input type="radio" name="gf_ab_q15" value="somewhat hopeful"> somewhat hopeful</label>
            <label><input type="radio" name="gf_ab_q15" value="hopeless"> hopeless</label>
          </div>

          <div class="row2">
            <label>16. If you are hopeless, why?<textarea id="gf_ab_q16" rows="2"></textarea></label>
            <label>17. What else should we know so that we can help? Any other matters?<textarea id="gf_ab_q17" rows="2"></textarea></label>
          </div>
        </div>

        <div class="form-field-group" style="background:var(--bg);padding:14px;border-radius:8px;border:1px dashed var(--line);margin-top:16px">
          <h4>For Interviewer / Counselor Only (Confidential)</h4>
          <div class="row2">
            <label>Name of Interviewer / Counselor<input id="gf_ab_int_name" value="${esc(defPrep)}"></label>
            <label>Date of Intake<input id="gf_ab_int_date" type="date" value="${iso(0)}"></label>
          </div>
          <div class="row2">
            <label>Note the identified problem<input id="gf_ab_int_prob" placeholder="e.g. Peer conflict, Bullying incident, Academic stress"></label>
            <label>Is the counselee seeking help?<select id="gf_ab_int_seek"><option value="Yes">Yes</option><option value="No">No</option></select></label>
          </div>
          <label>If not, what are the circumstances that brought the counselee to the interview?<textarea id="gf_ab_int_circ" rows="2" placeholder="e.g. Teacher referral due to hallway incident."></textarea></label>
          <label>Counselor’s Clinical Notes<textarea id="gf_ab_int_notes" rows="3" placeholder="Counselor observations, clinical assessment, initial recommendations..."></textarea></label>
        </div>
      `;
  } else if (fid === "annex-c") {
    fieldsHtml = `
        <div class="row2">
          <label>Name of Counselee<input id="gf_ac_name" placeholder="Full name of counselee" required></label>
          <label>Grade Level & Section<input id="gf_ac_gr" placeholder="e.g. Grade 5 – Rizal"></label>
        </div>
        <div class="form-field-group">
          <h4>Overall Goals (case to case basis)</h4>
          <label>1. Goal 1<input id="gf_ac_g1" value="Improve emotional regulation and de-escalation in social situations."></label>
          <label>2. Goal 2<input id="gf_ac_g2" value="Foster positive peer communication and classroom engagement."></label>
          <label>3. Goal 3<input id="gf_ac_g3" value="Coordinate with adviser and parents for consistent support at home."></label>
        </div>
        <div class="form-field-group">
          <h4>Planned Counseling Sessions & Interventions</h4>
          <table class="tbl-form">
            <thead>
              <tr>
                <th style="width:28%">Session # & Date</th>
                <th style="width:34%">Specific Goal</th>
                <th style="width:34%">Intervention</th>
                <th style="width:84px"></th>
              </tr>
            </thead>
            <tbody id="cp_rows_tbody">${renderCpRows()}</tbody>
          </table>
          <button type="button" class="btn s o" onclick="addCpRow()">+ Add Session Row</button>
        </div>
        <label>Prepared by (Signature over printed name of Guidance Counselor)
          <input id="gf_ac_prep" value="${esc(defPrep)}">
        </label>
      `;
  } else if (fid === "annex-d") {
    fieldsHtml = `
        <div class="row2">
          <label>Name of Counselee<input id="gf_ad_name" placeholder="Full name of counselee" required></label>
          <label>Session No.<input id="gf_ad_sess" value="1" style="max-width:120px"></label>
          <label>Date<input id="gf_ad_date" type="date" value="${iso(0)}"></label>
        </div>
        <label>Grade Level & Section<input id="gf_ad_gr" placeholder="e.g. Grade 4 – Narra"></label>
        
        <div class="form-field-group">
          <h4>Case Progress & Clinical Observations (9 Dimensions)</h4>
          <label>1. Topics discussed during the session<textarea id="gf_ad_d1" rows="2" placeholder="Discussion topics..."></textarea></label>
          <label>2. Relevance of the session to the counseling plan<textarea id="gf_ad_d2" rows="2" placeholder="Direct alignment with Goal 1..."></textarea></label>
          <label>3. Means of achieving the counseling plan goals and objectives<textarea id="gf_ad_d3" rows="2" placeholder="Techniques, roleplay, guided reflection..."></textarea></label>
          <label>4. Interventions and techniques used during the session and their effectiveness<textarea id="gf_ad_d4" rows="2" placeholder="Interventions used and observed impact..."></textarea></label>
          <label>5. Counseling observations<textarea id="gf_ad_d5" rows="2" placeholder="Non-verbal cues, mood, responsiveness..."></textarea></label>
          <label>6. Progress or setbacks<textarea id="gf_ad_d6" rows="2" placeholder="Observed gains or challenges..."></textarea></label>
          <label>7. Signs, symptoms, and any increase or decrease in the severity of behaviors as they relate to the main concern<textarea id="gf_ad_d7" rows="2" placeholder="Behavioral changes noted..."></textarea></label>
          <label>8. Homework assigned, results, and compliance (if any)<textarea id="gf_ad_d8" rows="2" placeholder="Home reflection or behavior chart assigned..."></textarea></label>
          <label>9. The counselee’s current strengths and challenges<textarea id="gf_ad_d9" rows="2" placeholder="Strengths identified and ongoing areas for support..."></textarea></label>
        </div>

        <label>Prepared by (Guidance Counselor Signature line)
          <input id="gf_ad_prep" value="${esc(defPrep)}">
        </label>
      `;
  }

  return genModalShell(f, fieldsHtml);
}

function genModalShell(f, fieldsHtml) {
  return `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap">
        <div>
          <span class="tag good" style="background:var(--primary);color:#fff">${f.code}</span>
          <h3 style="margin:4px 0 2px">${esc(f.title)}</h3>
          <p class="mute" style="margin:0">${f.desc}</p>
        </div>
      </div>
      
      <div class="note" style="margin-bottom:16px">
        <b>Quick Learner Auto-Fill (Optional):</b>
        <select onchange="fillKidForForm('${f.id}', this.value)" style="margin-top:4px">
          <option value="">-- Choose enrolled learner to auto-fill details --</option>
          ${P.map((p) => `<option value="${p.id}">${esc(p.name)} (${esc(p.gr)})</option>`).join("")}
        </select>
      </div>

      <form onsubmit="event.preventDefault()">
        ${fieldsHtml}
        <div class="row2" style="margin-top:24px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:16px">
          <button type="button" class="btn y" onclick="submitGenForm('${f.id}', 'print')">Generate and Download (PDF / Print)</button>
          <button type="button" class="btn o" onclick="submitGenForm('${f.id}', 'doc')">Download File (.DOC)</button>
          <button type="button" class="btn o" onclick="submitGenForm('${f.id}', 'vault')">Save to Calamity Vault</button>
          <button type="button" class="btn o" onclick="S.modal=null;render()">Cancel</button>
        </div>
      </form>
    `;
}

function getRadioVal(name, fallback) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : fallback || "";
}

function generateFormHtml(fid, isBlank, d) {
  d = d || {};
  if (isCustom(fid)) return customFormHtml(formById(fid), isBlank, d);
  const headerHtml = formHeaderHtml(d);

  if (fid === "anecdotal") {
    const rows = isBlank ? [{}, {}, {}, {}, {}] : d.rows || S.arRows || [];
    return `
        ${headerHtml}
        <div class="form-title">ANECDOTAL RECORD</div>
        <div class="meta-line">
          <span><b>Name of Learner Observed:</b> <span class="val-line" style="min-width:320px">${esc(d.name || "")}</span></span>
        </div>
        <div class="meta-line">
          <span><b>Grade / Year Level:</b> <span class="val-line" style="min-width:140px">${esc(d.grade || "")}</span></span>
          <span><b>Section:</b> <span class="val-line" style="min-width:140px">${esc(d.section || "")}</span></span>
          <span><b>Name of School:</b> <span class="val-line" style="min-width:220px">${esc(d.school || "San Roque Elementary School")}</span></span>
        </div>
        <table class="tbl-print">
          <thead>
            <tr>
              <th style="width:18%">Date/ Time</th>
              <th style="width:16%">Place</th>
              <th style="width:18%">Observer</th>
              <th style="width:24%">Behavior Observed</th>
              <th style="width:24%">How Handled</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) => `
              <tr>
                <td>${esc(r.dt || "")}</td>
                <td>${esc(r.place || "")}</td>
                <td>${esc(r.obs || "")}</td>
                <td>${esc(r.beh || "")}</td>
                <td>${esc(r.handle || "")}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        <div style="margin-top:16px">
          <b>Summary:</b>
          <div style="border-bottom:1px solid #000;min-height:48px;padding-top:4px;line-height:1.6">${esc(d.summary || "")}</div>
        </div>
        <div class="sig-container">
          <div class="sig-box">
            <div class="sig-line">${esc(d.prep || "School Guidance Designate")}</div>
            <div class="sig-sub">Name over printed signature / School Guidance Designate</div>
          </div>
        </div>
      `;
  } else if (fid === "annex-a") {
    return `
        ${headerHtml}
        <div class="form-title">ANNEX A</div>
        <div class="form-subtitle">Statement of Confidentiality</div>
        <div class="meta-line" style="margin-bottom:14px">
          <span><b>Learner:</b> <span class="val-line" style="min-width:240px">${esc(d.name || "")}</span></span>
          <span><b>Grade & Section:</b> <span class="val-line" style="min-width:180px">${esc(d.gr || "")}</span></span>
        </div>
        <p style="text-align:justify;font-size:10pt">Counseling services cater to the mental health and well-being of all learners. The Guidance and Counseling Office recognizes that people are faced with various life stressors that can interfere with their daily behavior and functions. Counseling services are completely confidential.</p>
        <p style="text-align:justify;font-size:10pt">There are a few exceptions or limitations to confidentiality in counseling situations. The following are the conditions to be considered in breaking the confidentiality in counseling:</p>
        <ul style="font-size:10pt;line-height:1.4">
          <li>If you are becoming an imminent danger to yourself and/or to others through thoughts of suicide or threats to harm other people</li>
          <li>If there is a reasonable suspicion of emotional and/or physical neglect or abuse including sexual abuse of a minor.</li>
          <li>In rare cases, courts will be asking guidance counselors to testify about you.</li>
        </ul>
        <div class="box-note">
          <b>Confidentiality Guidelines:</b> Many people are concerned about the confidentiality of meeting with a counselor. The following are kept confidential: (1) that you are seeing a counselor; (2) all contact information, including your counseling schedules; and (3) the guidance counselor being the only person who has access to the information discussed, unless you give written permission for specific information to be shared.
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;font-size:9.5pt;margin:12px 0">
          <div style="border:1px solid #ccc;padding:8px">
            <b>Rights of Client:</b>
            <ul style="margin:4px 0 0;padding-left:18px">
              <li>Be treated with respect and consideration</li>
              <li>Know that shared information is confidential</li>
              <li>Discuss dissatisfaction or concerns</li>
              <li>Refuse to complete consent forms requested</li>
              <li>Ask for referral to another counselor</li>
            </ul>
          </div>
          <div style="border:1px solid #ccc;padding:8px">
            <b>Responsibilities of Client:</b>
            <ul style="margin:4px 0 0;padding-left:18px">
              <li>Treat Guidance personnel with respect</li>
              <li>Maintain confidentiality of group members</li>
              <li>Help make counseling experience meaningful</li>
              <li>Notify immediately of service concerns</li>
            </ul>
          </div>
        </div>
        <p style="margin-top:14px;font-size:10pt;font-weight:bold">By signing this, I have read, understood and agreed to the provisions of this Statement of Confidentiality of the Guidance and Counseling Office.</p>
        <div class="sig-container">
          <div class="sig-box">
            <div class="sig-line">${esc(d.parent || "Parent / Guardian Signature")}</div>
            <div class="sig-sub">Parent’s Signature over printed name</div>
          </div>
          <div class="sig-box">
            <div class="sig-line">${esc(d.dt || iso(0) + " " + now())}</div>
            <div class="sig-sub">Date and Time</div>
          </div>
        </div>
      `;
  } else if (fid === "annex-b") {
    return `
        ${headerHtml}
        <div class="form-title">ANNEX B</div>
        <div class="form-subtitle">INTAKE INTERVIEW FORM</div>
        <div class="meta-line">
          <span><b>Name:</b> <span class="val-line" style="min-width:280px">${esc(d.name || "")}</span></span>
          <span><b>Date:</b> <span class="val-line" style="min-width:140px">${esc(d.date || "")}</span></span>
        </div>
        <div class="meta-line">
          <span><b>Birth Date:</b> <span class="val-line" style="min-width:110px">${esc(d.bdate || "")}</span></span>
          <span><b>Sex:</b> <span class="val-line" style="min-width:80px">${esc(d.sex || "")}</span></span>
          <span><b>Preferred Language:</b> <span class="val-line" style="min-width:140px">${esc(d.lang || "")}</span></span>
        </div>
        <div class="meta-line">
          <span><b>Grade Level:</b> <span class="val-line" style="min-width:120px">${esc(d.grade || "")}</span></span>
          <span><b>Section:</b> <span class="val-line" style="min-width:140px">${esc(d.section || "")}</span></span>
        </div>
        <p style="font-size:9.5pt;font-style:italic;margin:10px 0;background:#f8fafc;border:1px solid #ddd;padding:6px 10px">We are concerned about how things are going for you. Our session today will help us discuss what’s going O.K. and what’s not going so well. Everything is confidential except for those that need to be discussed with others in order to HELP you.</p>

        <div class="q-row">
          <div class="q-prompt">How would you describe your current situation? What problems are you experiencing? What are your main concerns?</div>
          <div class="q-answer">${esc(d.q1 || "")}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">How serious are these matters for you at this time?</div>
          <div class="q-answer">Selected: <b>${esc(d.q2 || "")}</b> (Very Serious / Serious / Not too serious / Not serious at all)</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">How long have you had these problems?</div>
          <div class="q-answer">Selected: <b>${esc(d.q3 || "")}</b> (0-3 months / 4 months to a year / more than a year)</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">What caused these problems?</div>
          <div class="q-answer">${esc(d.q4 || "")}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">Do others (parents, guardians, and friends) think there were other causes? If so, what do they say?</div>
          <div class="q-answer">${esc(d.q5 || "")}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">What other things are currently making it hard to deal with the problems?</div>
          <div class="q-answer">${esc(d.q6 || "")}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">What have you already tried in order to deal with the problems?</div>
          <div class="q-answer">${esc(d.q7 || "")}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">Why do you think these things didn’t work?</div>
          <div class="q-answer">${esc(d.q8 || "")}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">What have others advised you to do?</div>
          <div class="q-answer">${esc(d.q9 || "")}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">What do you think would help to solve the problem?</div>
          <div class="q-answer">${esc(d.q10 || "")}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">How much time and effort do you want to put into solving the problems?</div>
          <div class="q-answer">Selected: <b>${esc(d.q11 || "")}</b> (none at all / only a little / just enough / very much)</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">If you answered 1st, 2nd, or 3rd option, why don’t you want to put more time and effort into solving the problems?</div>
          <div class="q-answer">${esc(d.q12 || "")}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">What type of help do you want?</div>
          <div class="q-answer">${esc(d.q13 || "")}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">What changes are you hoping for?</div>
          <div class="q-answer">${esc(d.q14 || "")}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">How hopeful are you about solving the problems?</div>
          <div class="q-answer">Selected: <b>${esc(d.q15 || "")}</b> (very hopeful / hopeful / somewhat hopeful / hopeless)</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">If you are hopeless, why?</div>
          <div class="q-answer">${esc(d.q16 || "")}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">What else should we know so that we can help? Are there any other matters you want to discuss?</div>
          <div class="q-answer">${esc(d.q17 || "")}</div>
        </div>

        <div style="border-top:2px dashed #000;margin-top:24px;padding-top:12px;page-break-inside:avoid">
          <b style="font-size:10pt">For Interviewer/counselor only: Do not write anything below the line:</b>
          <div class="meta-line" style="margin-top:8px">
            <span><b>Name of Interviewer/Counselor:</b> <span class="val-line" style="min-width:220px">${esc(d.intName || "")}</span></span>
            <span><b>Date:</b> <span class="val-line" style="min-width:120px">${esc(d.intDate || "")}</span></span>
          </div>
          <div style="margin:8px 0">
            <b>Note the identified problem:</b>
            <div class="q-answer">${esc(d.intProb || "")}</div>
          </div>
          <div style="margin:8px 0">
            <b>Is the counselee seeking help?</b> [${d.intSeek === "Yes" ? "X" : " "}] Yes &nbsp;&nbsp; [${d.intSeek === "No" ? "X" : " "}] No
          </div>
          <div style="margin:8px 0">
            <b>If not, what are the circumstances that brought the counselee to the interview?</b>
            <div class="q-answer">${esc(d.intCirc || "")}</div>
          </div>
          <div style="margin:8px 0">
            <b>Counselor’s Notes:</b>
            <div style="border:1px solid #000;min-height:75px;padding:6px;font-size:9.5pt;line-height:1.4">${esc(d.intNotes || "")}</div>
          </div>
        </div>
      `;
  } else if (fid === "annex-c") {
    const rows = isBlank ? [{}, {}, {}, {}, {}, {}, {}, {}, {}] : d.rows || S.cpRows || [];
    return `
        ${headerHtml}
        <div class="form-title">ANNEX C</div>
        <div class="form-subtitle">COUNSELING PLAN</div>
        <div class="meta-line">
          <span><b>Name of Counselee:</b> <span class="val-line" style="min-width:280px">${esc(d.name || "")}</span></span>
          <span><b>Grade & Section:</b> <span class="val-line" style="min-width:180px">${esc(d.gr || "")}</span></span>
        </div>
        <div style="margin:12px 0 8px">
          <b>Overall Goals: (case to case basis)</b>
          <div style="margin:4px 0">1. <span class="val-line" style="min-width:90%">${esc(d.g1 || "")}</span></div>
          <div style="margin:4px 0">2. <span class="val-line" style="min-width:90%">${esc(d.g2 || "")}</span></div>
          <div style="margin:4px 0">3. <span class="val-line" style="min-width:90%">${esc(d.g3 || "")}</span></div>
        </div>
        <table class="tbl-print">
          <thead>
            <tr>
              <th style="width:28%">SESSION # & DATE</th>
              <th style="width:36%">SPECIFIC GOAL</th>
              <th style="width:36%">INTERVENTION</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) => `
              <tr>
                <td>${esc(r.sess || "")}</td>
                <td>${esc(r.goal || "")}</td>
                <td>${esc(r.intervention || "")}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        <div class="sig-container">
          <div class="sig-box">
            <div class="sig-line">${esc(d.prep || "Guidance Counselor")}</div>
            <div class="sig-sub">Signature over printed name of Guidance Counselor</div>
          </div>
        </div>
      `;
  } else if (fid === "annex-d") {
    const dimLabels = [
      "Topics discussed during the session",
      "Relevance of the session to the counseling plan",
      "Means of achieving the counseling plan goals and objectives",
      "Interventions and techniques used during the session and their effectiveness",
      "Counseling observations",
      "Progress or setbacks",
      "Signs, symptoms, and any increase or decrease in the severity of behaviors as they relate to the main concern",
      "Homework assigned, results, and compliance (if any)",
      "The counselee’s current strengths and challenges",
    ];
    return `
        ${headerHtml}
        <div class="form-title">ANNEX D</div>
        <div class="form-subtitle">CASE NOTES TEMPLATE</div>
        <div class="meta-line">
          <span><b>Name of Counselee:</b> <span class="val-line" style="min-width:240px">${esc(d.name || "")}</span></span>
          <span><b>Session No.:</b> <span class="val-line" style="min-width:70px">${esc(d.sess || "")}</span></span>
          <span><b>Date:</b> <span class="val-line" style="min-width:120px">${esc(d.date || "")}</span></span>
        </div>
        <div class="meta-line">
          <span><b>Grade Level & Section:</b> <span class="val-line" style="min-width:200px">${esc(d.gr || "")}</span></span>
        </div>
        <table class="tbl-print" style="margin-top:14px">
          <thead>
            <tr>
              <th style="width:42%">Session Dimension</th>
              <th style="width:58%">Clinical Notes & Progress Summary</th>
            </tr>
          </thead>
          <tbody>
            ${dimLabels
              .map(
                (lbl, idx) => `
              <tr>
                <td><b>${lbl}</b></td>
                <td>${esc(d["d" + (idx + 1)] || "")}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        <div class="sig-container">
          <div class="sig-box">
            <div class="sig-line">${esc(d.prep || "Guidance Counselor")}</div>
            <div class="sig-sub">Signature over printed name of Guidance Counselor</div>
          </div>
        </div>
      `;
  }
  return "";
}

function printFormDoc(title, htmlContent) {
  const w = window.open("", "_blank");
  if (!w) {
    toast("Popup window blocked. Please allow popups to print/download PDF.", 4500);
    return;
  }
  w.document.write(`<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${esc(title)}</title>
      <style>
        @page { size: A4 portrait; margin: 14mm 16mm; }
        body { font-family: 'Public Sans', Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.4; color: #111; margin: 18px 24px; background: #fff; }
        .deped-hdr { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 14px; }
        .deped-hdr .rep { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px; }
        .deped-hdr .dept { font-size: 11pt; font-weight: bold; text-transform: uppercase; }
        .deped-hdr .divn { font-size: 9.5pt; }
        .deped-hdr .sch { font-size: 11.5pt; font-weight: bold; }
        .deped-hdr .off { font-size: 10pt; font-style: italic; }
        .form-title { text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 10px 0 2px; letter-spacing: 0.5px; }
        .form-subtitle { text-align: center; font-size: 10.5pt; font-weight: bold; margin-bottom: 10px; }
        .meta-line { margin: 6px 0; font-size: 10pt; display: flex; flex-wrap: wrap; gap: 6px 18px; }
        .meta-line span { display: inline-flex; align-items: baseline; }
        .val-line { border-bottom: 1px solid #000; min-width: 120px; padding: 0 4px; font-weight: 600; }
        table.tbl-print { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9.5pt; }
        table.tbl-print th, table.tbl-print td { border: 1px solid #000; padding: 5px 6px; text-align: left; vertical-align: top; }
        table.tbl-print th { background: #f1f5f9; font-weight: bold; }
        .q-row { margin: 8px 0; font-size: 10pt; }
        .q-prompt { font-weight: bold; margin-bottom: 2px; }
        .q-answer { padding: 4px 6px; border-bottom: 1px solid #999; min-height: 18px; font-style: italic; color: #111; }
        .sig-container { margin-top: 24px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .sig-box { width: 240px; text-align: center; margin-top: 30px; }
        .sig-line { border-top: 1px solid #000; padding-top: 4px; font-weight: bold; font-size: 9.5pt; }
        .sig-sub { font-size: 8.5pt; color: #333; }
        .box-note { border: 1px solid #000; padding: 8px 10px; margin: 8px 0; font-size: 9pt; background: #fafafa; }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="position:fixed;top:10px;right:10px;background:#fff;padding:8px 12px;box-shadow:0 2px 10px rgba(0,0,0,.2);border-radius:6px;z-index:999">
        <button onclick="window.print()" style="background:#1e3a8a;color:#fff;border:0;padding:8px 16px;border-radius:6px;font-weight:bold;cursor:pointer">Print / Save as PDF</button>
      </div>
      ${htmlContent}
    </body>
    </html>`);
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
  }, 400);
}

function downloadDocFile(filename, title, bodyHtml) {
  const docContent = `<!DOCTYPE html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>${esc(title)}</title>
    <style>
      body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.35; margin: 1in; color: #000; }
      h1, h2, h3 { text-align: center; margin: 4pt 0; }
      .deped-hdr { text-align: center; border-bottom: 2pt solid #000; padding-bottom: 8pt; margin-bottom: 14pt; }
      table { width: 100%; border-collapse: collapse; margin: 10pt 0; font-size: 10pt; }
      th, td { border: 1pt solid #000; padding: 5pt 6pt; text-align: left; vertical-align: top; }
      th { background: #f0f0f0; font-weight: bold; }
      .form-title { text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase; }
      .form-subtitle { text-align: center; font-weight: bold; }
      .q-prompt { font-weight: bold; margin-top: 8pt; }
      .q-answer { border-bottom: 1pt solid #999; min-height: 14pt; }
      .val-line { border-bottom: 1pt solid #000; font-weight: bold; }
      .sig-line { border-top: 1pt solid #000; width: 220pt; text-align: center; padding-top: 4pt; margin-top: 36pt; }
    </style>
    </head>
    <body>
      ${bodyHtml}
    </body>
    </html>`;
  saveBlob(
    filename.endsWith(".doc") ? filename : filename + ".doc",
    new Blob(["\ufeff" + docContent], { type: "application/msword" }),
  );
}

function printBlankForm(fid) {
  const f = formById(fid);
  const html = generateFormHtml(fid, true, {});
  printFormDoc(f.title + " (Blank)", html);
  toast("Opening clean blank printable for " + f.title + ".");
}

function downloadWordFile(fid, isBlank) {
  const f = formById(fid);
  const html = generateFormHtml(fid, !!isBlank, {});
  const fname = f.code.replace(/[^a-zA-Z0-9_-]/g, "_") + (isBlank ? "_Blank_Template" : "_Document");
  downloadDocFile(fname, f.title, html);
  toast("Word document downloaded: " + fname + ".doc");
}

function submitGenForm(fid, action) {
  const f = formById(fid);
  const g = (id) => ($(id) ? $(id).value.trim() : "");

  let data = {};
  let learnerName = "";
  let learnerLrn = "";

  if (isCustom(fid)) {
    ({ data, learnerName } = collectCustom(f));
  } else if (fid === "anecdotal") {
    syncArRowsFromDOM();
    learnerName = g("gf_ar_name");
    data = {
      name: learnerName,
      school: g("gf_ar_school") || "San Roque Elementary School",
      grade: g("gf_ar_grade"),
      section: g("gf_ar_sec"),
      rows: S.arRows,
      summary: g("gf_ar_summary"),
      prep: g("gf_ar_prep"),
    };
  } else if (fid === "annex-a") {
    learnerName = g("gf_aa_name");
    data = {
      name: learnerName,
      gr: g("gf_aa_gr"),
      parent: g("gf_aa_parent"),
      dt: g("gf_aa_dt"),
      counselor: g("gf_aa_counselor"),
      school: g("gf_aa_school"),
    };
  } else if (fid === "annex-b") {
    learnerName = g("gf_ab_name");
    data = {
      name: learnerName,
      date: g("gf_ab_date"),
      bdate: g("gf_ab_bdate"),
      sex: g("gf_ab_sex"),
      lang: g("gf_ab_lang"),
      grade: g("gf_ab_gr"),
      section: g("gf_ab_sec"),
      q1: g("gf_ab_q1"),
      q2: getRadioVal("gf_ab_q2", "Serious"),
      q3: getRadioVal("gf_ab_q3", "0-3 months"),
      q4: g("gf_ab_q4"),
      q5: g("gf_ab_q5"),
      q6: g("gf_ab_q6"),
      q7: g("gf_ab_q7"),
      q8: g("gf_ab_q8"),
      q9: g("gf_ab_q9"),
      q10: g("gf_ab_q10"),
      q11: getRadioVal("gf_ab_q11", "just enough"),
      q12: g("gf_ab_q12"),
      q13: g("gf_ab_q13"),
      q14: g("gf_ab_q14"),
      q15: getRadioVal("gf_ab_q15", "hopeful"),
      q16: g("gf_ab_q16"),
      q17: g("gf_ab_q17"),
      intName: g("gf_ab_int_name"),
      intDate: g("gf_ab_int_date"),
      intProb: g("gf_ab_int_prob"),
      intSeek: g("gf_ab_int_seek"),
      intCirc: g("gf_ab_int_circ"),
      intNotes: g("gf_ab_int_notes"),
    };
  } else if (fid === "annex-c") {
    syncCpRowsFromDOM();
    learnerName = g("gf_ac_name");
    data = {
      name: learnerName,
      gr: g("gf_ac_gr"),
      g1: g("gf_ac_g1"),
      g2: g("gf_ac_g2"),
      g3: g("gf_ac_g3"),
      rows: S.cpRows,
      prep: g("gf_ac_prep"),
    };
  } else if (fid === "annex-d") {
    learnerName = g("gf_ad_name");
    data = {
      name: learnerName,
      sess: g("gf_ad_sess"),
      date: g("gf_ad_date"),
      gr: g("gf_ad_gr"),
      d1: g("gf_ad_d1"),
      d2: g("gf_ad_d2"),
      d3: g("gf_ad_d3"),
      d4: g("gf_ad_d4"),
      d5: g("gf_ad_d5"),
      d6: g("gf_ad_d6"),
      d7: g("gf_ad_d7"),
      d8: g("gf_ad_d8"),
      d9: g("gf_ad_d9"),
      prep: g("gf_ad_prep"),
    };
  }

  learnerName = String(learnerName || "").trim();
  if (!learnerName) return toast("Enter the learner’s name before generating or saving this form.");
  const matchedP = P.find((p) => norm(p.name) === norm(learnerName));
  learnerLrn = matchedP ? matchedP.lrn : "";

  const html = generateFormHtml(fid, false, data);

  if (action === "print") {
    printFormDoc(f.title + (learnerName ? " - " + learnerName : ""), html);
    toast("Opening print view for " + f.title + ".");
  } else if (action === "doc") {
    const fname =
      f.code.replace(/[^a-zA-Z0-9_-]/g, "_") +
      (learnerName ? "_" + learnerName.replace(/\s+/g, "_") : "_Document");
    downloadDocFile(fname, f.title, html);
    toast("Downloaded " + fname + ".doc");
  } else if (action === "vault") {
    const docEntry = {
      name:
        f.code.replace(/[^a-zA-Z0-9_-]/g, "_") +
        "_" +
        (learnerName ? learnerName.replace(/\s+/g, "_") : "Form") +
        ".pdf",
      d: iso(0),
      lrn: learnerLrn,
      text: `${f.title}\nLearner: ${learnerName}\nGenerated via Kalinga Forms Generator on ${iso(0)}\nCategory: ${f.category}`,
      cat: f.category,
      pn: learnerName,
    };
    if (isCustom(fid)) docEntry.text += "\n" + customSummary(f, data);
    S.docs.unshift(docEntry);
    save();
    toast("Form successfully filed and archived into Calamity Vault.");
    S.modal = null;
    render();
  }
}
