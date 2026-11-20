/* ==========================================================================
   School Anti-Bullying Policies (read-only reference for guidance and teachers)
   Source: SCHOOL_ANTI-BULLYING_POLICIES.docx, San Roque Elementary School
   ========================================================================== */

const POLICY_FILE = "SCHOOL_ANTI-BULLYING_POLICIES.docx";

const POLICY_INTRO =
  "The following are the classification of offenses and their corresponding penalties, within the jurisdiction of the Department of Education, without prejudice to any civil or criminal action.";

const PERSONNEL_NOTE =
  "Any personnel who commits the aforementioned acts shall be subject to appropriate administrative actions and/or sanctions in accordance with the existing rules and regulations of the Department of Education or in the private school, without prejudice to any civil or criminal action.";

const POLICY_LEVELS = [
  {
    id: "first",
    name: "First Level",
    style: "",
    summary:
      "These acts involve less severe actions that do not pose immediate physical, psychological, or emotional harm but still disrupt the learning environment. These behaviors can often be handled through direct intervention and guidance from teachers and authorities.",
    lead: 'This level applies to precursor behaviors or acts that can be classified as "minor offenses" such as, but not limited to:',
    offenses: [
      "Uttering profanities/swearwords inside the school premises, or through online platforms, or during school sanctioned activities whether inside or outside the school.",
      "Sharing fake news or false information that can create confusion or commotion in the school.",
      "Disruptive behavior and/or pranks in class or within the school premises or during school-sanctioned activities, whether inside or outside the school.",
      "Grabbing other's belongings (e.g., toys, things, food, etc.) inside the classroom, school premises or during school-sanctioned activities whether inside or outside the school.",
      "Simple vandalism inside the classroom or school premises, involving damage valued at not more than Php 500.00. Vandalism is marking or damaging school property.",
      "Punching, pinching another learner which does not result to physical injuries, inside the classroom, school premises or during school-sanctioned activities.",
      "Fighting in class/school premises or during school-sanctioned activities which does not result to physical injuries.",
      "Carrying, concealing, liquor, toxic substances, cigarettes/e-cigarettes/vapes, and pornographic materials inside the classroom, school premises or during school-sanctioned activities whether inside or outside the school.",
    ],
    penalties: [
      ["1st offense", "Written reprimand and parental notice (through formal communication)."],
      ["2nd offense", "Written reprimand and suspension for 3 days."],
      [
        "3rd offense",
        "Suspension not exceeding five (5) days, with provision of alternative learning modalities.",
      ],
    ],
  },
  {
    id: "second",
    name: "Second Level",
    style: "y",
    summary:
      "These acts are severe or repeated behaviors that go beyond minor offenses and necessitate a formal proceeding intervention by the Learner Formation Officer or other relevant authority.",
    lead: 'This level applies to behaviors or acts that can be classified as "serious offenses" such as, but not limited to:',
    offenses: [
      "Stalking inside the classroom, school premises or during school-sanctioned activities whether inside or outside the school.",
      "Assaulting or inflicting slight physical injuries to another learner or teacher or school personnel, whether inside or outside the school. Slight physical injuries are those that require medical intervention for 1–9 days.",
      "Theft or stealing other's belongings inside the classroom, school premises or during school-sanctioned activities whether inside or outside the school.",
      "Intimidating or threatening school personnel or learners whether inside or outside the school. This includes threat or intimidation done electronically or using social media platforms.",
      "Gambling or possession of gambling materials inside the classroom, school premises or during school-sanctioned activities whether inside or outside the school.",
      "Smoking cigarettes/e-cigarettes/vapes, inside the school premises or during school-sanctioned activities whether inside or outside the school.",
      "Serious vandalism inside the classroom or school premises involving damage valued at more than Php 500.00. Vandalism is marking or damaging school property.",
    ],
    penalties: [
      [
        "1st offense",
        "Suspension not exceeding five (5) days, with provision of alternative learning modalities, and referral to the Social Welfare Development Office.",
      ],
      ["2nd offense", "Non-readmission and referral to the Social Welfare Development Office."],
      ["3rd offense", "Exclusion and referral to the Social Welfare Development Office."],
    ],
  },
  {
    id: "third",
    name: "Third Level",
    style: "r",
    summary:
      "These include more severe or complex situations that require a higher level of intervention due to their potential impact on learner safety and well-being.",
    lead: "This level applies to offenses that cannot be resolved at the school level, such as, but not limited to:",
    offenses: [
      "Joining, organizing and/or recruiting learners to fraternities, sororities, street gangs, and similar organizations.",
      "Cheating/dishonesty during class assessment/exams; or allowing another student to copy one's answer in exams or assigned homework or similar assessment whether for personal reasons, profit or gain (sagot for sale).",
      "Making bomb threats/jokes.",
      "Inflicting serious physical injuries to another learner or personnel, whether inside or outside the school. Serious physical injuries occur when the victim requires medical intervention for 10 days or more.",
      "Use, possession, or sale of prohibited drugs or substances inside the school premises or during school-sanctioned activities whether inside or outside the school.",
      "Drinking liquor inside the school or during school-sanctioned activities whether inside or outside the school or coming to the school intoxicated.",
      "Acts of lasciviousness, offensive physical or body gestures at someone, and exposing private parts for the sexual gratification of the offender with the effect of demeaning, harassing, threatening or intimidating the offended party including flashing of private parts, public masturbation, groping, and similar lewd sexual actions committed inside the classroom, school premises or school-sanctioned activities whether inside or outside the school.",
      "Sexual exploitation, sexual assault or rape committed whether inside or outside the school.",
      "Carrying and concealing deadly weapons, such as firearms, ammunitions, explosives, bladed/pointed/blunt weapons inside the school premises or during school-sanctioned activities whether inside or outside the school.",
      "Homicide or murder committed whether inside or outside the school.",
      "Hazing in any form inside or outside the school premises.",
      "Uploading and sharing recorded or live videos which degrades, demeans, or shames other learners and school personnel.",
      "Uploading and sharing one's or another student's recorded/live video, photo, or voice with sexual content in social media or to other online platforms.",
    ],
    penalties: [
      [
        "1st offense",
        "Non-readmission and referral to the appropriate office (e.g., PNP, Social Welfare Development Office).",
      ],
      [
        "2nd offense",
        "Exclusion and referral to the appropriate office (e.g., PNP, Social Welfare Development Office).",
      ],
    ],
  },
];

const POLICY_CONTACT = {
  address: "9002 Gov Drive San Roque, Naic, Cavite",
  email: "depedcavite.sanroqueelem@gmail.com",
  facebook: "https://www.facebook.com/DepEdTayoSRES108078",
};

/* ---- rendering ---- */
function policyCard(level, offenses) {
  return `<div class="blk ${level.style}" style="margin-bottom:20px">
    <div class="item" style="padding-top:0"><h3 style="margin:0">${level.name}</h3><span class="mute">${level.offenses.length} listed offenses</span></div>
    <p class="mute">${esc(level.summary)}</p>
    <p><b>${esc(level.lead)}</b></p>
    <ol class="policy-list">${offenses.map((o) => `<li>${esc(o)}</li>`).join("")}</ol>
    <h3 style="margin-top:18px">Penalties for learners</h3>
    <table class="tbl-form"><tbody>${level.penalties
      .map(([when, what]) => `<tr><th style="width:22%">${when}</th><td>${esc(what)}</td></tr>`)
      .join("")}</tbody></table>
    <div class="note"><b>For school personnel:</b> ${esc(PERSONNEL_NOTE)}</div>
  </div>`;
}

function policyListHtml() {
  const q = (S.policyQ || "").toLowerCase().trim();
  const pick = S.policyLevel || "all";
  const cards = POLICY_LEVELS.filter((l) => pick === "all" || l.id === pick)
    .map((l) => {
      const hits = q ? l.offenses.filter((o) => o.toLowerCase().includes(q)) : l.offenses;
      return hits.length ? policyCard(l, hits) : "";
    })
    .join("");
  return cards || '<div class="blk"><p class="empty">No listed offense matches your search.</p></div>';
}

function vPolicy() {
  const levels = [["all", "All levels"], ...POLICY_LEVELS.map((l) => [l.id, l.name])];
  return `<div class="top">
      <div>
        <h2>School Anti-Bullying Policies</h2>
        <p class="lede">San Roque Elementary School, Schools Division Office of Cavite Province. ${esc(POLICY_INTRO)}</p>
      </div>
      <div class="row2" style="flex:0 0 auto;align-items:flex-start">
        <a class="btn s" style="margin-top:0" href="${POLICY_FILE}" download>Download original (.docx)</a>
        <button class="btn s o" onclick="window.print()">Print</button>
      </div>
    </div>
    <div class="blk" style="margin-bottom:20px">
      <div class="row2">
        <label style="margin-top:0;flex:1 1 260px">Search offenses
          <input id="pq" placeholder="e.g. vandalism, stalking, online" value="${esc(S.policyQ || "")}" oninput="S.policyQ=this.value;$('pl').innerHTML=policyListHtml()">
        </label>
        <div style="flex:1 1 260px">
          <label style="margin-top:0">Level</label>
          <div class="pills" style="margin:0">${levels
            .map(
              ([id, label]) =>
                `<button aria-pressed="${(S.policyLevel || "all") === id}" onclick="S.policyLevel='${id}';render()">${label}</button>`,
            )
            .join("")}</div>
        </div>
      </div>
    </div>
    <div id="pl">${policyListHtml()}</div>
    <div class="blk"><h3>School contact</h3>
      <p class="mute" style="margin:0">${esc(POLICY_CONTACT.address)}<br>${esc(POLICY_CONTACT.email)}<br>${esc(POLICY_CONTACT.facebook)}</p>
    </div>`;
}