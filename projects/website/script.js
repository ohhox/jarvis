const EN = {
  nav_services:"Services",nav_work:"Work",nav_process:"Process",nav_pricing:"Pricing",nav_contact:"Get a quote",
  hero_eyebrow:"Freelance Software Developer",
  hero_title:"Got an idea? I'll build it.",
  hero_lead:"Custom software of every kind: websites, apps, back-end systems, AI and automation. Fast delivery, clear communication, support after launch.",
  hero_cta1:"Free consultation",hero_cta2:"See services",
  stat1:"weeks to MVP",stat2:"Thai & English",stat3:"days post-launch support",
  sv_title:"Services",
  sv1_t:"Websites & Web Apps",sv1_d:"Landing pages, online stores, member systems, dashboards with React / Next.js / Node.js.",
  sv2_t:"Mobile Apps",sv2_d:"iOS / Android with React Native / Flutter, connected to your back end.",
  sv3_t:"Backend & APIs",sv3_d:"REST / GraphQL, databases, authentication, payments, third-party integrations.",
  sv4_t:"AI Chatbots & Agents",sv4_d:"LINE / web chatbots answering from your data, and multi-agent AI systems.",
  sv5_t:"Automation",sv5_d:"Cut repetitive work: emails, leads, invoices. Connect Google Sheets, Notion, Slack, CRMs.",
  sv6_t:"Scripts & Special Jobs",sv6_d:"Web scraping, data processing, CLI tools, bug fixes, refactoring, code review.",
  wk_title:"Sample Work",
  wk1:"Answers customers in TH/EN from a knowledge base; hands off to a human when needed.",
  wk2:"Scores leads and classifies emails automatically with parallel processing.",
  wk3:"Researcher → Writer → Editor → Publisher: a full content pipeline.",
  pr_title:"How I Work",
  pr1_t:"1. Discuss needs",pr1_d:"Free consultation; agree scope and acceptance criteria.",
  pr2_t:"2. Quote & timeline",pr2_d:"Clear price, paid in milestones.",
  pr3_t:"3. Build & report",pr3_d:"Incremental deliveries, visible progress.",
  pr4_t:"4. Deliver & support",pr4_d:"Source code + docs, 30 days of free support.",
  pc_title:"Starting Prices",
  pc1:"Scripts / bug fixes / single page",pc2:"Web apps / automation / chatbots",pc3_p:"Per scope",pc3:"Large systems / multi-agent / mobile apps",
  pc_note:"* Starting ranges; final price depends on actual scope.",
  ct_title:"Tell me about your project",
  f_name:"Name",f_email:"Email",f_msg:"Project details / budget / deadline",f_send:"Send message"
};
const TH = {};
document.querySelectorAll("[data-i18n]").forEach(e => TH[e.dataset.i18n] = e.textContent);
const EMAIL = "prawit.yancharoenkit@gmail.com";
let lang = "th";
try { lang = localStorage.getItem("lang") || (navigator.language.startsWith("th") ? "th" : "en"); } catch {}
function apply(l) {
  lang = l;
  document.documentElement.lang = l;
  document.querySelectorAll("[data-i18n]").forEach(e => {
    const t = (l === "en" ? EN : TH)[e.dataset.i18n];
    if (t) e.textContent = t;
  });
  document.getElementById("lang").textContent = l === "en" ? "TH" : "EN";
  try { localStorage.setItem("lang", l); } catch {}
}
document.getElementById("lang").onclick = () => apply(lang === "th" ? "en" : "th");
document.getElementById("y").textContent = new Date().getFullYear();
// No backend: the form opens the visitor's mail client with the message prefilled.
document.getElementById("form").onsubmit = ev => {
  ev.preventDefault();
  const f = new FormData(ev.target);
  const body = `${f.get("msg")}\n\n— ${f.get("name")} <${f.get("email")}>`;
  location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Project inquiry from " + f.get("name"))}&body=${encodeURIComponent(body)}`;
};
apply(lang);
