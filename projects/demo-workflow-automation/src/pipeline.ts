import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Types
export interface Lead {
  id: string;
  name: string;
  email: string;
  message: string;
  source: string;
}

export interface ProcessedLead {
  lead: Lead;
  classification: "hot" | "warm" | "cold" | "spam";
  sentiment: "positive" | "neutral" | "negative";
  summary: string;
  suggestedAction: string;
  priority: number; // 1-10
}

export interface EmailTask {
  id: string;
  from: string;
  subject: string;
  body: string;
}

export interface ProcessedEmail {
  email: EmailTask;
  category: "inquiry" | "complaint" | "support" | "partnership" | "spam";
  urgency: "low" | "medium" | "high";
  summary: string;
  draftReply: string;
}

// Lead Scoring Agent
export async function scoreLead(lead: Lead): Promise<ProcessedLead> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Analyze this incoming lead and return JSON only (no markdown):

Name: ${lead.name}
Email: ${lead.email}
Source: ${lead.source}
Message: ${lead.message}

Return this exact JSON structure:
{
  "classification": "hot" | "warm" | "cold" | "spam",
  "sentiment": "positive" | "neutral" | "negative",
  "summary": "one line summary",
  "suggestedAction": "what to do next",
  "priority": 1-10
}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = JSON.parse(text);

  return { lead, ...parsed };
}

// Email Classification Agent
export async function classifyEmail(
  email: EmailTask
): Promise<ProcessedEmail> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Classify this email and draft a reply. Return JSON only (no markdown):

From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

Return this exact JSON structure:
{
  "category": "inquiry" | "complaint" | "support" | "partnership" | "spam",
  "urgency": "low" | "medium" | "high",
  "summary": "one line summary",
  "draftReply": "professional reply draft"
}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = JSON.parse(text);

  return { email, ...parsed };
}

// Pipeline Orchestrator
export async function processBatch(
  leads: Lead[],
  emails: EmailTask[]
): Promise<{ leads: ProcessedLead[]; emails: ProcessedEmail[] }> {
  console.log(
    `Processing ${leads.length} leads and ${emails.length} emails...\n`
  );

  // Process in parallel
  const [processedLeads, processedEmails] = await Promise.all([
    Promise.all(leads.map(scoreLead)),
    Promise.all(emails.map(classifyEmail)),
  ]);

  return { leads: processedLeads, emails: processedEmails };
}
