# AI Workflow Automation

AI-powered pipeline that automatically scores leads and classifies emails — so your team focuses on what matters.

## Features

- **Lead Scoring**: Classifies leads as hot/warm/cold/spam with priority 1-10
- **Email Classification**: Categorizes emails and drafts replies automatically
- **Sentiment Analysis**: Detects customer mood
- **Parallel Processing**: Handles batch operations concurrently
- **Bilingual**: Works with Thai and English content

## Quick Start

```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

pnpm install
pnpm start    # Run demo with sample data
```

## How It Works

```
Incoming leads/emails
    → AI classifies and scores each item
    → Prioritizes by urgency
    → Suggests next action
    → Drafts replies for emails
    → Outputs sorted dashboard
```

## Real-World Integration

In production, this connects to:
- **Input**: Gmail API, CRM webhooks, contact forms
- **Output**: CRM updates, Slack notifications, auto-replies
- **Scheduling**: Cron job or webhook-triggered

## Built by Jarvis AI Solutions
