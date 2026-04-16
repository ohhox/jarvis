import { processBatch, type Lead, type EmailTask } from "./pipeline.js";

// Sample data — จำลองข้อมูลจริง
const sampleLeads: Lead[] = [
  {
    id: "L001",
    name: "Sarah Chen",
    email: "sarah@techstartup.io",
    source: "Website Contact Form",
    message:
      "We're a Series A startup with 50 employees. Looking for an AI chatbot solution for our customer support. Currently handling 500+ tickets/day manually. Need something ASAP. Budget approved.",
  },
  {
    id: "L002",
    name: "สมชาย ดีมาก",
    email: "somchai@example.co.th",
    source: "LINE OA",
    message:
      "สนใจระบบ AI ครับ อยากรู้ราคาก่อน ยังไม่แน่ใจว่าจะใช้หรือเปล่า แต่เห็นว่าน่าสนใจ",
  },
  {
    id: "L003",
    name: "MAKE MONEY FAST",
    email: "spam@totallylegit.xyz",
    source: "Website Contact Form",
    message:
      "CONGRATULATIONS! You've been selected for a SPECIAL OFFER! Click here to claim your FREE AI tool! Limited time only!!!",
  },
  {
    id: "L004",
    name: "Emily Rodriguez",
    email: "emily.r@lawfirm.com",
    source: "LinkedIn",
    message:
      "Hi, I'm a partner at Rodriguez & Associates. We need AI automation for contract review and client intake. We handle about 200 cases/month. Please send us a proposal.",
  },
];

const sampleEmails: EmailTask[] = [
  {
    id: "E001",
    from: "angry.customer@gmail.com",
    subject: "Your bot gave wrong information!!!",
    body: "I asked your chatbot about refund policy and it said no refunds are available. But your website clearly says 30-day money back guarantee. This is unacceptable. I want a full refund AND an explanation.",
  },
  {
    id: "E002",
    from: "partnerships@bigcorp.com",
    subject: "Partnership Opportunity — BigCorp x Jarvis AI",
    body: "Dear Jarvis AI team, We're BigCorp, a Fortune 500 company exploring AI solutions for our customer service division (10,000+ agents). We'd like to discuss a potential partnership or white-label arrangement. Could we schedule a call next week?",
  },
  {
    id: "E003",
    from: "dev@startup.io",
    subject: "API rate limit question",
    body: "Hey, I'm integrating your API and hitting rate limits on the /chat endpoint. Getting 429 errors when sending more than 10 req/s. Is there a way to increase this limit on the Pro plan? Docs aren't clear on this.",
  },
];

async function runDemo() {
  console.log("=".repeat(60));
  console.log("  AI Workflow Automation — Lead & Email Pipeline");
  console.log("  Powered by Jarvis AI Solutions");
  console.log("=".repeat(60));
  console.log();

  const results = await processBatch(sampleLeads, sampleEmails);

  // Display Lead Results
  console.log("\n" + "=".repeat(60));
  console.log("  LEAD SCORING RESULTS");
  console.log("=".repeat(60));

  const sorted = [...results.leads].sort((a, b) => b.priority - a.priority);
  for (const lead of sorted) {
    const badge =
      lead.classification === "hot"
        ? "🔥 HOT"
        : lead.classification === "warm"
          ? "🟡 WARM"
          : lead.classification === "cold"
            ? "🔵 COLD"
            : "⛔ SPAM";

    console.log(`\n${badge} | Priority: ${lead.priority}/10`);
    console.log(`  Name: ${lead.lead.name} (${lead.lead.email})`);
    console.log(`  Summary: ${lead.summary}`);
    console.log(`  Sentiment: ${lead.sentiment}`);
    console.log(`  Action: ${lead.suggestedAction}`);
  }

  // Display Email Results
  console.log("\n" + "=".repeat(60));
  console.log("  EMAIL CLASSIFICATION RESULTS");
  console.log("=".repeat(60));

  for (const email of results.emails) {
    const urgencyIcon =
      email.urgency === "high"
        ? "🔴"
        : email.urgency === "medium"
          ? "🟡"
          : "🟢";

    console.log(`\n${urgencyIcon} [${email.category.toUpperCase()}] ${email.email.subject}`);
    console.log(`  From: ${email.email.from}`);
    console.log(`  Summary: ${email.summary}`);
    console.log(`  Draft Reply: ${email.draftReply.slice(0, 150)}...`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("  PIPELINE SUMMARY");
  console.log("=".repeat(60));
  const hotLeads = results.leads.filter((l) => l.classification === "hot").length;
  const highUrgency = results.emails.filter((e) => e.urgency === "high").length;
  console.log(`  Leads processed: ${results.leads.length}`);
  console.log(`  Hot leads: ${hotLeads} (need immediate follow-up)`);
  console.log(`  Emails processed: ${results.emails.length}`);
  console.log(`  High urgency: ${highUrgency}`);
  console.log(`  Spam filtered: ${results.leads.filter((l) => l.classification === "spam").length}`);
  console.log("=".repeat(60));
}

runDemo().catch(console.error);
