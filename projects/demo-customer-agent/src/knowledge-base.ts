// Knowledge base — ลูกค้าเปลี่ยน content ตรงนี้ได้เลย
// ในงานจริงจะดึงจาก database หรือ vector store

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
}

export const knowledgeBase: KBArticle[] = [
  {
    id: "pricing-basic",
    title: "Pricing Plans",
    content: `We offer three plans:
- Starter: $29/month — up to 1,000 conversations/month, email support
- Pro: $99/month — up to 10,000 conversations/month, priority support, analytics dashboard
- Enterprise: Custom pricing — unlimited conversations, dedicated account manager, SLA guarantee
All plans include a 14-day free trial. No credit card required.`,
    category: "pricing",
  },
  {
    id: "refund-policy",
    title: "Refund Policy",
    content: `We offer a 30-day money-back guarantee on all plans.
If you're not satisfied, contact support@example.com within 30 days of purchase.
Refunds are processed within 5-7 business days.
Enterprise contracts have custom cancellation terms.`,
    category: "billing",
  },
  {
    id: "setup-guide",
    title: "Getting Started",
    content: `To get started:
1. Sign up at app.example.com
2. Create your first project
3. Upload your knowledge base documents (PDF, TXT, or paste text)
4. Configure your agent's personality and tone
5. Deploy to your website with a single line of code: <script src="agent.js"></script>
Setup typically takes less than 15 minutes.`,
    category: "setup",
  },
  {
    id: "integrations",
    title: "Supported Integrations",
    content: `We integrate with:
- Messaging: LINE, Facebook Messenger, WhatsApp, Slack
- CRM: Salesforce, HubSpot, Pipedrive
- Helpdesk: Zendesk, Freshdesk, Intercom
- Other: Zapier, Make, n8n, REST API
Custom integrations available on Enterprise plan.`,
    category: "features",
  },
  {
    id: "support-hours",
    title: "Support Hours",
    content: `Support availability:
- Starter: Email support, Mon-Fri 9AM-5PM (UTC+7)
- Pro: Priority email + chat, Mon-Fri 9AM-9PM (UTC+7)
- Enterprise: 24/7 dedicated support with <1hr response time SLA
Emergency support available for all plans via emergency@example.com`,
    category: "support",
  },
];

export function searchKnowledge(query: string): KBArticle[] {
  const lower = query.toLowerCase();
  const scored = knowledgeBase.map((article) => {
    let score = 0;
    const fields = `${article.title} ${article.content} ${article.category}`.toLowerCase();

    // Simple keyword matching — ในงานจริงใช้ embedding / vector search
    const words = lower.split(/\s+/);
    for (const word of words) {
      if (word.length < 3) continue;
      if (fields.includes(word)) score += 1;
    }
    return { article, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.article);
}
