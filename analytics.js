/* ==========================================================================
   Analytics: school-year records, charts, and Excel / Word export
   ========================================================================== */

/* School year runs June to May. */
const SY_MONTHS = [6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const GRADES = [1, 2, 3, 4, 5, 6];

/* Chart colors reuse the existing palette tokens only. */
const CONCERN_COLOR = {
  Bullying: "var(--danger)",
  "Frequent absences": "var(--accent)",
  "Peer conflict": "var(--primary)",
  "Academic difficulty": "var(--success)",
  "Anxiety or sadness": "var(--warning)",
  "Family concern": "var(--mute)",
  "Behavior in class": "var(--ink)",
};

const pad2 = (n) => String(n).padStart(2, "0");
const currentSY = () => syOf(iso(0));
const viewSY = () => S.sy || currentSY();
const isCurrentSY = (sy) => sy === currentSY();
const gradeOf = (p) => (p?.gr || "").split(/\s*[–-]\s*/)[0];

/* Every school year that has at least one record, newest first. */
function schoolYears() {
  const set = new Set([currentSY()]);
  S.cases.forEach((c) => set.add(syOf(c.d)));
  S.old.forEach((o) => set.add(o.sy));
  S.appts.forEach((a) => a.d && set.add(syOf(a.d)));
  S.obs.forEach((o) => o.d && set.add(syOf(o.d)));
  S.docs.forEach((d) => d.d && set.add(syOf(d.d)));
  S.chats.forEach((c) => {
    if (Number.isFinite(c.at)) set.add(syOf(ld(new Date(c.at))));
  });
  return [...set].sort().reverse();
}

function recordInSY(date, sy = viewSY()) {
  return Boolean(date && syOf(date) === sy);
}

function schoolYearFilter() {
  const sy = viewSY(),
    archived = !isCurrentSY(sy);
  return `<div class="blk" style="margin-bottom:18px"><div class="top" style="margin:0"><div><b>Record school year</b><br><span class="mute">${archived ? "Archived records are read-only." : "Showing current school-year records."}</span></div>
    <label style="margin:0">School year<select onchange="setSY(this.value)" aria-label="Record school year">${schoolYears()
      .map(
        (y) =>
          `<option value="${y}" ${y === sy ? "selected" : ""}>SY ${y}${isCurrentSY(y) ? " (current)" : ""}</option>`,
      )
      .join("")}</select></label></div></div>`;
}

/* Current cases and archived records for one school year, in one shape. */
function recordsFor(sy) {
  const live = S.cases.filter((c) => syOf(c.d) === sy).map((c) => ({ ...c, archived: false }));
  const archived = S.old
    .filter((o) => o.sy === sy)
    .map((o, i) => ({
      id: "old" + i,
      p: o.p,
      c: o.c,
      st: "Closed",
      u: "Normal",
      d: o.d,
      desc: o.n,
      by: "Archived record",
      archived: true,
    }));
  return [...live, ...archived];
}

function setSY(sy) {
  S.sy = sy === currentSY() ? "" : sy;
  render();
}

/* ---- numbers behind the charts ---- */
function monthKeys(sy) {
  const y = +sy.slice(0, 4);
  return SY_MONTHS.map((m) => ({
    key: (m >= 6 ? y : y + 1) + "-" + pad2(m),
    label: MONTH_NAMES[m - 1],
    year: m >= 6 ? y : y + 1,
  }));
}

function monthlyBreakdown(recs, sy) {
  return monthKeys(sy).map((m) => {
    const inMonth = recs.filter((r) => r.d.slice(0, 7) === m.key);
    const byConcern = {};
    inMonth.forEach((r) => (byConcern[r.c] = (byConcern[r.c] || 0) + 1));
    return { ...m, total: inMonth.length, byConcern };
  });
}

function gradeRows(recs) {
  return GRADES.map((g) => ["Grade " + g, recs.filter((r) => gradeOf(pp(r.p)) === "Grade " + g).length]);
}

function concernRows(recs) {
  return CONCERNS.map((k) => [k, recs.filter((r) => r.c === k).length]).sort((a, b) => b[1] - a[1]);
}

/* ---- charts ---- */
function monthChart(recs, sy) {
  const months = monthlyBreakdown(recs, sy);
  const max = Math.max(1, ...months.map((m) => m.total));
  const base = 130;
  const scale = 100 / max;
  const bars = months
    .map((m, i) => {
      const x = i * 42 + 12;
      let y = base;
      const stack = CONCERNS.filter((k) => m.byConcern[k])
        .map((k) => {
          const h = m.byConcern[k] * scale;
          y -= h;
          return `<rect x="${x}" y="${y}" width="28" height="${h}" fill="${CONCERN_COLOR[k]}"><title>${m.label} ${m.year}: ${k}, ${m.byConcern[k]}</title></rect>`;
        })
        .join("");
      const total = m.total
        ? `<text x="${x + 14}" y="${y - 5}" text-anchor="middle" font-size="12" fill="var(--ink)">${m.total}</text>`
        : "";
      return `${stack}${total}<text x="${x + 14}" y="148" text-anchor="middle" font-size="11" fill="var(--mute)">${m.label}</text>`;
    })
    .join("");
  const label = `Cases opened per month, SY ${sy}: ${months.map((m) => m.label + " " + m.total).join(", ")}`;
  return `<svg viewBox="0 0 520 156" role="img" aria-label="${label}" class="chart-svg"><line x1="6" y1="${base}" x2="514" y2="${base}" stroke="var(--line)"/>${bars}</svg>`;
}

function chartLegend(recs) {
  const used = CONCERNS.filter((k) => recs.some((r) => r.c === k));
  if (!used.length) return "";
  return `<div class="chart-legend">${used
    .map(
      (k) =>
        `<span><i style="background:${CONCERN_COLOR[k]}"></i>${k} (${recs.filter((r) => r.c === k).length})</span>`,
    )
    .join("")}</div>`;
}

function monthDetail(recs, sy) {
  const rows = monthlyBreakdown(recs, sy)
    .filter((m) => m.total)
    .map((m) => {
      const text = CONCERNS.filter((k) => m.byConcern[k])
        .map(
          (k) => `<span class="swatch" style="background:${CONCERN_COLOR[k]}"></span>${k} ${m.byConcern[k]}`,
        )
        .join(" &nbsp; ");
      return `<div class="item"><div><b>${m.label} ${m.year}</b><br><span class="mute">${text}</span></div><span class="tag">${m.total} ${m.total === 1 ? "case" : "cases"}</span></div>`;
    })
    .join("");
  return rows || '<p class="empty">No cases were opened in this school year.</p>';
}

function gradeInsight(recs) {
  const rows = gradeRows(recs);
  const top = Math.max(...rows.map((r) => r[1]));
  if (!top) return '<p class="empty">No cases to compare yet.</p>';
  const lead = rows.filter((r) => r[1] === top).map((r) => r[0]);
  const share = Math.round((top / recs.length) * 100);
  const detail = lead.length === 1 ? commonConcernLine(recs, lead[0]) : "";
  return `<div class="note"><b>${lead.join(" and ")}</b> ${lead.length > 1 ? "have" : "has"} the most guidance cases: ${top} of ${recs.length} (${share}%).${detail}</div>`;
}

function commonConcernLine(recs, grade) {
  const inGrade = recs.filter((r) => gradeOf(pp(r.p)) === grade);
  const [name, n] = concernRows(inGrade)[0];
  return ` Most common concern there: ${name} (${n}).`;
}

/* ---- dashboard blocks ---- */
function syToolbar(sy) {
  const archived = !isCurrentSY(sy);
  return `<div class="blk" style="margin-top:36px"><div class="top"><div><h3 style="margin:0">School year analytics</h3><p class="mute" style="margin:2px 0 0">Showing SY ${sy}${archived ? " (earlier school year)" : " (current)"}.</p></div>
    <div class="row2" style="flex:0 0 auto;align-items:flex-end">
      <label style="margin:0">School year<select onchange="setSY(this.value)" aria-label="School year">${schoolYears()
        .map(
          (y) =>
            `<option value="${y}" ${y === sy ? "selected" : ""}>SY ${y}${isCurrentSY(y) ? " (current)" : ""}</option>`,
        )
        .join("")}</select></label>
      <button class="btn s" onclick="exportAnalytics('excel')">Download Excel</button>
      <button class="btn s o" onclick="exportAnalytics('word')">Download Word</button>
    </div></div>
    ${archived ? `<div class="note" style="margin-top:12px">You are viewing archived records. Cases from earlier school years are read-only. <button class="lk" onclick="setSY('${currentSY()}')">Back to current school year</button></div>` : ""}</div>`;
}

function caseListBlock(recs, sy) {
  const rows = [...recs]
    .sort((a, b) => b.d.localeCompare(a.d))
    .map((r) => {
      const p = pp(r.p);
      const open = r.archived
        ? '<span class="mute">Archived</span>'
        : `<button class="btn s o" onclick="S.sel=${r.id};go('cases')" aria-label="Open case for ${esc(p.name)}">Open case</button>`;
      return `<div class="item"><div><b>${esc(p.name)}</b>, ${esc(p.gr)}<br><span class="mute">${esc(r.c)}${r.bt ? " (" + esc(r.bt) + ")" : ""}, ${fmt(r.d)}</span></div><span class="tag ${r.st}">${r.st}</span>${open}</div>`;
    })
    .join("");
  return `<div class="blk" style="margin-top:36px"><h3>Cases in SY ${sy} (${recs.length})</h3>${rows || '<p class="empty">No cases recorded for this school year.</p>'}</div>`;
}

function analyticsSection() {
  const sy = viewSY();
  const recs = recordsFor(sy);
  return `${syToolbar(sy)}
    <div class="blk y" style="margin-top:20px"><h3>Cases opened per month</h3>
      ${monthChart(recs, sy)}${chartLegend(recs)}
      <h3 style="margin-top:18px">What was opened each month</h3>${monthDetail(recs, sy)}
    </div>
    <div class="cols b" style="margin-top:36px">
      <div class="blk"><h3>Cases by grade level</h3>${gradeInsight(recs)}${bars(gradeRows(recs))}</div>
      <div class="blk"><h3>Concerns this school year</h3>${bars(concernRows(recs))}</div>
    </div>
    <div class="cols b" style="margin-top:36px">
      <div class="blk"><h3>Types of bullying</h3>${bars(btRows(recs))}</div>
      <div class="blk"><h3>Incidents by school year</h3>${bars(syRows())}<p class="mute">Includes archived records from earlier school years.</p></div>
    </div>
    ${caseListBlock(recs, sy)}`;
}

/* ---- export: one data model, two file formats ---- */
function analyticsModel(sy) {
  const recs = recordsFor(sy);
  const months = monthlyBreakdown(recs, sy);
  const open = recs.filter((r) => r.st !== "Closed").length;
  return {
    sy,
    summary: [
      ["School year", "SY " + sy],
      ["Generated on", fmt(iso(0))],
      ["Total cases", recs.length],
      ["Open cases (New or Ongoing)", open],
      ["Closed cases", recs.length - open],
      ["Urgent cases", recs.filter((r) => r.u === "Urgent").length],
    ],
    monthHead: ["Month", ...CONCERNS, "Total"],
    monthRows: months.map((m) => [
      `${m.label} ${m.year}`,
      ...CONCERNS.map((k) => m.byConcern[k] || 0),
      m.total,
    ]),
    concerns: concernRows(recs),
    grades: gradeRows(recs),
    bullying: btRows(recs),
    years: syRows(),
    caseHead: [
      "Pupil",
      "LRN",
      "Grade",
      "Section",
      "Concern",
      "Type of bullying",
      "Urgency",
      "Status",
      "Date opened",
      "Source",
    ],
    caseRows: [...recs]
      .sort((a, b) => a.d.localeCompare(b.d))
      .map((r) => {
        const p = pp(r.p);
        return [p.name, p.lrn, gradeOf(p), sec(p), r.c, r.bt || "", r.u || "Normal", r.st, r.d, r.by || ""];
      }),
  };
}

function exportAnalytics(kind) {
  const m = analyticsModel(viewSY());
  const name = "Kalinga_Guidance_Analytics_SY" + m.sy.replace("–", "-");
  if (kind === "excel") {
    saveBlob(name + ".xls", new Blob(["\ufeff" + buildWorkbook(m)], { type: "application/vnd.ms-excel" }));
  } else {
    downloadDocFile(name, "Guidance Analytics " + m.sy, buildReportHtml(m));
  }
  toast(`${kind === "excel" ? "Excel" : "Word"} file downloaded.`);
}

/* Excel: SpreadsheetML workbook with one sheet per table. */
const xmlEsc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
const xmlCell = (v, head) =>
  `<Cell${head ? ' ss:StyleID="h"' : ""}><Data ss:Type="${typeof v === "number" ? "Number" : "String"}">${xmlEsc(v)}</Data></Cell>`;
const xmlSheet = (name, rows) =>
  `<Worksheet ss:Name="${xmlEsc(name)}"><Table>${rows
    .map((r, i) => `<Row>${r.map((v) => xmlCell(v, i === 0)).join("")}</Row>`)
    .join("")}</Table></Worksheet>`;

function buildWorkbook(m) {
  const sheets = [
    xmlSheet("Summary", [["Measure", "Value"], ...m.summary]),
    xmlSheet("Cases per month", [m.monthHead, ...m.monthRows]),
    xmlSheet("Concerns", [["Concern", "Cases"], ...m.concerns]),
    xmlSheet("Cases by grade", [["Grade", "Cases"], ...m.grades]),
    xmlSheet("Bullying types", [["Type", "Cases"], ...m.bullying]),
    xmlSheet("School years", [["School year", "Incidents"], ...m.years]),
    xmlSheet("Case list", [m.caseHead, ...m.caseRows]),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="h"><Font ss:Bold="1"/></Style></Styles>${sheets.join("")}</Workbook>`;
}

/* Word: HTML that Word opens as a document. */
const docTable = (head, rows) =>
  `<table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;

function buildReportHtml(m) {
  return `<div class="deped-hdr"><b>SAN ROQUE ELEMENTARY SCHOOL</b><br>Guidance and Counseling Office</div>
    <h2>Guidance Analytics Report, SY ${m.sy}</h2>
    <h3>Summary</h3>${docTable(["Measure", "Value"], m.summary)}
    <h3>Cases opened per month</h3>${docTable(m.monthHead, m.monthRows)}
    <h3>Concerns</h3>${docTable(["Concern", "Cases"], m.concerns)}
    <h3>Cases by grade level</h3>${docTable(["Grade", "Cases"], m.grades)}
    <h3>Types of bullying</h3>${docTable(["Type", "Cases"], m.bullying)}
    <h3>Incidents by school year</h3>${docTable(["School year", "Incidents"], m.years)}
    <h3>Case list</h3>${docTable(m.caseHead, m.caseRows)}
    <p><i>Confidential. Handle under DepEd Child Protection Policy (DO 40, s. 2012) and the Data Privacy Act (RA 10173).</i></p>`;
}
